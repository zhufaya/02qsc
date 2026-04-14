import asyncio
import json
import logging
from typing import Any, Callable, Dict, Optional

logger = logging.getLogger("qsys_tcp_client")
MessageListener = Callable[[Dict[str, Any]], Any]

class QSysTcpClient:
    def __init__(self, host: str, port: int = 1710, heartbeat_interval: float = 30.0):
        self.host = host
        self.port = port
        self.heartbeat_interval = heartbeat_interval
        self.reader: Optional[asyncio.StreamReader] = None
        self.writer: Optional[asyncio.StreamWriter] = None
        self._lock = asyncio.Lock()
        self._connected_event = asyncio.Event()
        self._stop_event = asyncio.Event()
        self._listeners: list[MessageListener] = []

    async def run(self) -> None:
        self._stop_event.clear()
        while not self._stop_event.is_set():
            try:
                await self._connect()
                self._connected_event.set()
                logger.info("成功连接到 Q-SYS: %s:%s", self.host, self.port)
                receive_task = asyncio.create_task(self._receive_loop())
                heartbeat_task = asyncio.create_task(self._heartbeat_loop())
                await asyncio.wait([receive_task, heartbeat_task], return_when=asyncio.FIRST_COMPLETED)
            except Exception as exc:
                logger.error("Q-SYS 连接异常: %s", exc)
            finally:
                self._connected_event.clear()
                await self._cleanup()
                if not self._stop_event.is_set():
                    await asyncio.sleep(5) # 断线重连延迟

    async def _connect(self) -> None:
        self.reader, self.writer = await asyncio.open_connection(self.host, self.port)

    async def _cleanup(self) -> None:
        if self.writer:
            self.writer.close()
            try:
                await self.writer.wait_closed()
            except Exception:
                pass
            self.writer = None
            self.reader = None

    async def stop(self) -> None:
        self._stop_event.set()
        await self._cleanup()

    @property
    def is_connected(self) -> bool:
        return self._connected_event.is_set()

    async def send_command(self, command: Dict[str, Any]) -> None:
        if not self.writer:
            raise ConnectionError("Q-SYS 未连接")
        # 核心规则：Q-SYS 必须以 \x00 (空字符) 结尾
        payload = json.dumps(command).encode('utf-8') + b"\x00"
        async with self._lock:
            self.writer.write(payload)
            await self.writer.drain()
            logger.debug("已发送指令: %s", command)

    async def _heartbeat_loop(self) -> None:
        while not self._stop_event.is_set() and self.is_connected:
            try:
                await self.send_command({"jsonrpc": "2.0", "method": "NoOp", "params": {}})
            except Exception:
                break
            await asyncio.sleep(self.heartbeat_interval)

    async def _receive_loop(self) -> None:
        if not self.reader:
            return
        while not self._stop_event.is_set() and self.is_connected:
            try:
                raw = await self.reader.readuntil(separator=b"\x00")
                if raw.endswith(b"\x00"):
                    raw = raw[:-1]
                if not raw:
                    continue
                message = json.loads(raw.decode("utf-8", errors="replace"))
                logger.info("【Q-SYS 硬件返回】: %s", message)
                for listener in self._listeners:
                    asyncio.create_task(self._run_listener(listener, message))
            except Exception:
                break
                
    async def _run_listener(self, listener: MessageListener, message: Dict[str, Any]) -> None:
        try:
            if asyncio.iscoroutinefunction(listener):
                await listener(message)
            else:
                listener(message)
        except Exception as e:
            logger.error("Listener error: %s", e)

    def add_listener(self, listener: MessageListener) -> None:
        self._listeners.append(listener)