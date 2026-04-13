import asyncio
import ftplib
import logging
from typing import Any, Dict, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from qsys_tcp_client import QSysTcpClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("qsys_api")

QSYS_HOST = "192.168.10.68"
QSYS_PORT = 1710
FTP_DIRECTORY = "/Audio/Recorder"

class PlaybackRequest(BaseModel):
    filename: str

# 生命周期：启动时连接 Q-SYS
async def lifespan(app: FastAPI):
    client = QSysTcpClient(host=QSYS_HOST, port=QSYS_PORT)
    app.state.qsys_client = client
    app.state.client_task = asyncio.create_task(client.run())
    yield
    await client.stop()
    if app.state.client_task:
        app.state.client_task.cancel()

app = FastAPI(
    title="Q-SYS 网页控制系统",
    description="用于控制 QSC 录音机与播放器的后端服务 API",
    version="1.0.0",
    lifespan=lifespan
)

# === 跨域配置：允许前端 5173 端口访问 ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_qsys_client() -> QSysTcpClient:
    return app.state.qsys_client

@app.post("/api/record/start", summary="开始录音", description="向 Q-SYS 发送 JSON-RPC 指令开启录音机")
async def start_record():
    payload = {
        "jsonrpc": "2.0",
        "method": "Component.Set",
        "params": {"Name": "Flip-Flop", "Controls": [{"Name": "state", "Value": 1}]}
    }
    await get_qsys_client().send_command(payload)
    return JSONResponse({"status": "recording_started"})

@app.post("/api/record/stop", summary="停止录音", description="向 Q-SYS 发送 JSON-RPC 指令停止录音机")
async def stop_record():
    payload = {
        "jsonrpc": "2.0",
        "method": "Component.Set",
        "params": {"Name": "Flip-Flop", "Controls": [{"Name": "state", "Value": 0}]}
    }
    await get_qsys_client().send_command(payload)
    return JSONResponse({"status": "recording_stopped"})

@app.post("/api/playback/play", summary="播放录音文件", description="向 Q-SYS 发送 JSON-RPC 指令播放指定录音文件")
async def playback_play(request: PlaybackRequest):
    payload = {
        "jsonrpc": "2.0",
        "method": "Component.Set",
        "params": {
            "Name": "Audio_Player",
            "Controls": [
                {"Name": "directory", "Value": "Audio/Recorder"},
                {"Name": "filename", "Value": request.filename},
                {"Name": "play", "Value": 1}
            ]
        }
    }
    await get_qsys_client().send_command(payload)
    return JSONResponse({"status": "playing", "file": request.filename})

@app.post("/api/playback/stop", summary="停止播放", description="向 Q-SYS 发送 JSON-RPC 指令停止当前播放")
async def playback_stop():
    payload = {
        "jsonrpc": "2.0",
        "method": "Component.Set",
        "params": {"Name": "Audio_Player", "Controls": [{"Name": "stop", "Value": 1}]}
    }
    await get_qsys_client().send_command(payload)
    return JSONResponse({"status": "stopped"})

@app.get("/api/files", summary="获取录音文件列表", description="通过 FTP 从 Q-SYS 设备获取录音文件列表")
async def get_files():
    # 利用 FTP 获取 Q-SYS 录音文件
    def fetch_ftp():
        files = []
        try:
            ftp = ftplib.FTP(QSYS_HOST, timeout=5)
            ftp.login()
            entries = ftp.nlst(FTP_DIRECTORY)
            for path in entries:
                basename = path.split("/")[-1]
                if basename.startswith("recording_") and basename.endswith(".wav"):
                    files.append({"filename": basename})
            ftp.quit()
        except Exception as e:
            logger.error("FTP 拉取失败: %s", e)
        return files
    
    files = await asyncio.to_thread(fetch_ftp)
    return JSONResponse({"files": files})