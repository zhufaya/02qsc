# Q-SYS 触控面板与中间件 - 项目上下文文档 (AI_CONTEXT.md)

## 📌 项目概述
本项目是一个为 **Q-SYS Core 110f** 音视频处理器定制的网页端控制程序。
项目采用“前后端分离”架构，前端实现适配 10 寸触摸屏的高保真“蓝白科技风”界面，后端作为中间件处理复杂的 TCP 长连接与文件系统访问，并通过 REST API 和 WebSocket 与前端交互。

## 🛠️ 技术栈
* **前端**: React 18 + Vite + TypeScript + Tailwind CSS + Framer Motion (用于物理级手势与切页) + Lucide Icons。
* **后端**: Python 3 + FastAPI + Uvicorn + `asyncio` (原生异步 TCP 通信) + 原生 `ftplib`。
* **底层通信**: Q-SYS Remote Control (QRC) 协议 (基于 TCP 端口 1710 的 JSON-RPC 2.0)。

## 📡 核心设备与网络环境
* **Q-SYS Core IP**: `192.168.10.68`
* **控制端口**: TCP 1710 (需发送心跳包保活，每条 JSON 指令严格以 `\0` 结尾)。
* **FTP 目录**: `/Audio/Recorder` (用于拉取录音文件列表，格式如 `recording_YYYY-MM-DD_HH-mm-ss_1.wav`)。
* **Q-SYS 组件命名 (Code Name)**:
  - `Flip-Flop`: 触发录音与停止 (`state` = 1 或 0)。
  - `Audio_Player`: 处理录音回放 (`directory`, `filename`, `play`, `stop` 控件)。

## 🚀 核心 UI 架构与视觉规范

### 1. 视觉基调 (蓝白洁净科技风)
* **配色**: 绝对摒弃纯黑色背景。采用干净的 `bg-slate-50` 为基底，搭配 `blue-500` 与 `cyan-400` 高亮。
* **质感**: 大量使用白色毛玻璃态 (`bg-white/70 backdrop-blur-xl border border-white`) 与浅蓝色阴影。底层背景放置数个巨大且缓慢呼吸的浅蓝色模糊光圈 (`blur-[100px]`) 营造科技环境感。
* **屏幕适配**: 在最外层容器强行锁定 `w-[1280px] h-[800px]` (16:10 比例)，使用 `transform: scale()` 机制确保在各种浏览器下绝对居中且不变形。

### 2. 主控面板 (HomeControl)
* **交互**: 剔除传统按钮，采用屏幕正中央的一个超大圆形控件同时兼顾状态展示与启停控制。
* **动画引擎**: 
  - 待命状态：单圈 `conic-gradient` 顺时针极其缓慢地流转，模拟水流。
  - 录音状态：展开为 3 层同心圆，分别以**正、反、正**方向进行平滑地 `animate-spin` 旋转，中心浮现 `00:00:00` 高精度数字计时器。

### 3. 录音回放矩阵 (PlaybackMatrix)
* **路由导航**: 抛弃底部 NavBar，采用 Framer Motion 监听横向滑动 (`drag="x"`) 实现主页与回放页的双向物理级无缝平滑切页。
* **文件模块**: 数据展示为白底蓝边的科技感拼图卡片，单行横向滚动排列。卡片文字使用 `truncate` 防溢出，包含 `draggable={true}` 原生属性。
* **拖拽闭环**: 页面下半部提供固定的拖放显式区域 (`h-32`)。在 `onDragOver` 时背景变色提供强视觉反馈，`onDrop` 触发 API 调用。
* **控制栏**: 固定在容器底部，包含极简的蓝灰色进度条 `<input type="range">` 和 Lucide 媒体控制图标。

---

## 💡 全栈排错与开发备忘录 (Troubleshooting)

1. **手势滑动冲突 (Event Bubbling) [致命Bug]**:
   - **问题**: 在回放页拖动“播放进度条(Range Input)”或“横向滚动的文件列表”时，极其容易触发 Framer Motion 的翻页事件。
   - **解决**: 必须在这些可能发生横向滑动的内部组件上绑定 `onPointerDownCapture={(e) => e.stopPropagation()}` 以阻断事件冒泡。
2. **Lucide Icons 命名陷阱**:
   - 表示“停止播放”的正方形图标，在 `lucide-react` 中**不叫** `Stop`，必须引入并使用 `Square`。
3. **QRC 协议的心跳与结尾**:
   - Python 建立 `asyncio.open_connection` 后，发送的 JSON 字符串必须拼接 `+ b"\x00"`，否则 Q-SYS 绝对不会响应。
   - 必须维持一个后台 Task，每隔 30 秒发送一次 `{"jsonrpc": "2.0", "method": "NoOp", "params": {}}`。
4. **Framer Motion 切页生硬**:
   - 要实现对称的双向滑动切页，必须使用 `<AnimatePresence initial={false} custom={direction}>` 并共享统一的 `variants` 动画参数。
5. **Windows 终端进程残留**:
   - 启动 `.bat` 脚本必须包含 `chcp 65001 >nul` 防止中文乱码。
   - 启动前端时使用 `start "QSYS_Frontend" cmd /c "npm run dev"` 为窗口命名，结束服务时通过 `taskkill /FI "WINDOWTITLE eq QSYS_Frontend*"` 精确关闭黑框，避免残留。