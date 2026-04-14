import asyncio
import logging
import urllib.request
import urllib.error
import ssl
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from qsys_tcp_client import QSysTcpClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("qsys_api")

QSYS_HOST = "192.168.10.68"

global_player_state = {
    "current_sec": 0.0, # 真实秒数
    "time_str": "00:00",
    "is_playing": False
}

class PlaybackRequest(BaseModel):
    filename: str

async def dedicated_status_poller():
    while True:
        try:
            reader, writer = await asyncio.open_connection(QSYS_HOST, 1710)
            logger.info("✅ 状态通道连接成功！")
            while True:
                poll_cmd = {
                    "jsonrpc": "2.0", "id": "poll", "method": "Component.Get",
                    "params": {"Name": "Audio_Player", "Controls": [{"Name": "progress"}, {"Name": "playing"}]}
                }
                writer.write((json.dumps(poll_cmd) + '\0').encode('utf-8'))
                await writer.drain()
                
                data = await reader.readuntil(b'\0')
                response = json.loads(data.decode('utf-8').strip('\0'))
                
                if "result" in response:
                    for ctrl in response["result"].get("Controls", []):
                        name = ctrl.get("Name")
                        val = ctrl.get("Value")
                        if name == "progress":
                            global_player_state["current_sec"] = float(val)
                            global_player_state["time_str"] = ctrl.get("String", "00:00").replace(".0", "")
                        elif name == "playing":
                            global_player_state["is_playing"] = bool(val)
                await asyncio.sleep(0.2)
        except Exception as e:
            await asyncio.sleep(2)

async def lifespan(app: FastAPI):
    client = QSysTcpClient(host=QSYS_HOST)
    app.state.qsys_client = client
    asyncio.create_task(client.run())
    asyncio.create_task(dedicated_status_poller())
    yield
    await client.stop()

app = FastAPI(title="Q-SYS 工业控制", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/api/files")
async def get_files():
    def fetch_api():
        files = []
        try:
            url = f"https://{QSYS_HOST}/api/v0/cores/self/media/Audio/Recorder"
            ctx = ssl.create_default_context()
            ctx.check_hostname, ctx.verify_mode = False, ssl.CERT_NONE
            with urllib.request.urlopen(urllib.request.Request(url), context=ctx, timeout=5) as res:
                data = json.loads(res.read().decode('utf-8'))
                for item in data:
                    name = item.get("name", "")
                    full_name = name if name.lower().endswith(".wav") else f"{name}.wav"
                    size_bytes = item.get('size', 0)
                    size_mb = f"{size_bytes/(1024*1024):.1f} MB"
                    
                    est_secs = int(size_bytes / 192000)
                    duration_str = f"{est_secs//60:02d}:{est_secs%60:02d}"
                    
                    files.append({
                        "filename": full_name, 
                        "size": size_mb, 
                        "duration": duration_str,
                        "duration_sec": est_secs
                    })
        except: pass
        return files
    return {"files": await asyncio.to_thread(fetch_api)}

@app.get("/api/playback/status")
async def get_status():
    return global_player_state

@app.post("/api/playback/load")
async def load_file(req: PlaybackRequest):
    fname = req.filename if req.filename.lower().endswith(".wav") else f"{req.filename}.wav"
    await app.state.qsys_client.send_command({
        "jsonrpc": "2.0", "method": "Component.Set",
        "params": {
            "Name": "Audio_Player", 
            "Controls": [
                {"Name": "directory", "Value": "Recorder"}, 
                {"Name": "filename", "Value": fname},
                {"Name": "loop", "Value": 0}
            ]
        }
    })
    return {"status": "loaded"}

# 【核心修改】：支持指定 component，默认是 Audio_Player，方便我们调 Custom_Controls
@app.post("/api/playback/control")
async def control_player(req: dict):
    comp_name = req.get("component", "Audio_Player")
    await app.state.qsys_client.send_command({
        "jsonrpc": "2.0", "method": "Component.Set",
        "params": {
            "Name": comp_name, 
            "Controls": [{"Name": req["control"], "Value": req.get("value", 1)}]
        }
    })
    return {"status": "ok"}

@app.post("/api/record/{action}")
async def record_control(action: str):
    state = 1 if action == "start" else 0
    await app.state.qsys_client.send_command({
        "jsonrpc": "2.0", "method": "Component.Set",
        "params": {"Name": "Flip-Flop", "Controls": [{"Name": "state", "Value": state}]}
    })
    return {"status": "success"}