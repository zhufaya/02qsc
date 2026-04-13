# Q-SYS 会议室录音控制台

极简硬核科幻风 (Sci-Fi HUD) 10寸触摸屏 UI，适配 16:10 比例显示屏。

## 功能特性

- **主控舱界面**：三层同心圆环动画，点击切换录音状态
- **录音文件回放矩阵**：文件列表、播放控制、进度拖拽
- **手势切换**：左右滑动在两个全屏页面间无缝切换
- **科幻视觉**：深色背景、发光青蓝色调、网格背景、等宽字体
- **中文界面**：所有文案均为中文

## 技术栈

- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- Framer Motion (手势与动画)
- Lucide React (图标)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

然后在浏览器中打开 [http://localhost:5173](http://localhost:5173)

### 3. 构建生产版本

```bash
npm run build
```

## 项目结构

```
src/
├── components/           # 可复用组件
│   ├── AspectRatioContainer.tsx  # 16:10 比例适配容器
│   └── ConcentricCircles.tsx     # 同心圆环动画组件
├── pages/               # 页面组件
│   ├── HomeControl.tsx           # 主控舱界面
│   └── PlaybackMatrix.tsx        # 回放矩阵界面
├── App.tsx              # 主应用（手势切换逻辑）
├── main.tsx             # 应用入口
└── index.css            # 全局样式
```

## 设计要点

### 颜色主题
- 背景: `#0a0a0f` (深空黑)
- 主色: `#00ffff` (青色) / `#0077ff` (湖蓝)
- 文本: 白色与灰色渐变

### 动画效果
- 同心圆环: 三层不同速度、方向的永久旋转
- 页面切换: 弹簧物理动画 + 拖拽回弹
- 状态指示: 脉冲、渐变、微交互

### 适配策略
- 固定设计尺寸: 1280×800 (16:10)
- 自动缩放: 根据窗口大小等比缩放，保持比例不变
- 触摸优化: 大点击区域、拖拽手势

## API 接口（模拟）

UI 中预留了以下后端接口调用位置：

| 端点 | 方法 | 用途 |
|------|------|------|
| `/api/record/start` | POST | 开始录音 |
| `/api/record/stop` | POST | 停止录音 |
| `/api/playback/play` | POST | 播放录音 |
| `/api/playback/pause` | POST | 暂停播放 |
| `/api/playback/stop` | POST | 停止播放 |

当前为模拟调用，实际集成时需替换为真实 API。

## 开发说明

### 添加新录音文件
修改 `src/pages/PlaybackMatrix.tsx` 中的 `mockRecordings` 数组。

### 调整动画速度
在 `tailwind.config.js` 中扩展 `animation` 部分。

### 修改颜色主题
更新 `tailwind.config.js` 中的 `colors` 扩展。

## 许可证

MIT