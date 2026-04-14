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

# 建立全局状态池，存储硬件返回的真实数据
global_player_state = {
    "current_time": 0,
    "total_time": 0,
    "is_playing": False
}

class PlaybackRequest(BaseModel):
    filename: str

async def lifespan(app: FastAPI):
    client = QSysTcpClient(host=QSYS_HOST)
    app.state.qsys_client = client
    asyncio.create_task(client.run())
    # 启动后台任务：每半秒问一次硬件真实进度
    asyncio.create_task(auto_poll_qsys(client))
    yield
    await client.stop()

# 【核心修复】：不再劫持底层流，而是用正规的 send_command 发送查询并解析返回结果
async def auto_poll_qsys(client):
    while True:
        if client.is_connected:
            try:
                poll_cmd = {
                    "jsonrpc": "2.0", "method": "Component.Get",
                    "params": {"Name": "Audio_Player", "Controls": [{"Name": "playback_time"}, {"Name": "length"}, {"Name": "playing"}]}
                }
                # 发送查询并直接拿到硬件返回的 JSON 结果
                response = await client.send_command(poll_cmd)
                if response and "result" in response:
                    controls = response["result"].get("Controls", [])
                    for ctrl in controls:
                        name = ctrl.get("Name")
                        val = ctrl.get("Value")
                        if name == "playback_time":
                            global_player_state["current_time"] = val
                        elif name == "length":
                            global_player_state["total_time"] = val
                        elif name == "playing":
                            global_player_state["is_playing"] = bool(val)
            except Exception as e:
                pass
        await asyncio.sleep(0.5)

app = FastAPI(title="Q-SYS 工业级控制后端", lifespan=lifespan)
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
                    files.append({"filename": full_name, "size": f"{item.get('size', 0)/(1024*1024):.1f} MB"})
        except: pass
        return files
    return {"files": await asyncio.to_thread(fetch_api)}

@app.get("/api/playback/status")
async def get_status():
    # 前端随时来读取最新的真实现状
    return global_player_state

@app.post("/api/playback/play")
async def play_file(req: PlaybackRequest):
    fname = req.filename if req.filename.lower().endswith(".wav") else f"{req.filename}.wav"
    await app.state.qsys_client.send_command({
        "jsonrpc": "2.0", "method": "Component.Set",
        "params": {
            "Name": "Audio_Player", 
            "Controls": [
                {"Name": "directory", "Value": "Recorder"}, 
                {"Name": "filename", "Value": fname},
                {"Name": "loop", "Value": 0},
                {"Name": "play", "Value": 1}
            ]
        }
    })
    return {"status": "playing"}

@app.post("/api/playback/stop")
async def stop_file():
    await app.state.qsys_client.send_command({
        "jsonrpc": "2.0", "method": "Component.Set",
        "params": {"Name": "Audio_Player", "Controls": [{"Name": "stop", "Value": 1}]}
    })
    return {"status": "stopped"}

@app.post("/api/record/{action}")
async def record_control(action: str):
    state = 1 if action == "start" else 0
    payload = {
        "jsonrpc": "2.0", "method": "Component.Set",
        "params": {"Name": "Flip-Flop", "Controls": [{"Name": "state", "Value": state}]}
    }
    await app.state.qsys_client.send_command(payload)
    return {"status": "success"}