import { useState, useEffect } from 'react'
import ConcentricCircles from '../components/ConcentricCircles'
import { Mic, Wifi, Battery, Settings } from 'lucide-react'

const HomeControl = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  // 模拟录音计时器
  useEffect(() => {
    let interval: number | null = null
    if (isRecording) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    } else {
      setElapsedTime(0)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRecording])

  const handleRecordToggle = async () => {
    const newState = !isRecording
    setIsRecording(newState)

    // 调用后端 API（模拟）
    try {
      const endpoint = newState ? '/api/record/start' : '/api/record/stop'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp: Date.now() }),
      })
      if (!response.ok) {
        console.error('API 调用失败')
        // 回滚状态
        setIsRecording(!newState)
      }
    } catch (error) {
      console.error('网络错误:', error)
      setIsRecording(!newState)
    }
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-hud-bg to-black p-6 flex flex-col">
      {/* 顶部状态栏 */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-hud-cyan">
            <Mic size={16} />
            <span className="text-sm font-medium">Q-SYS Core</span>
          </div>
          <div className="h-4 w-px bg-gray-700" />
          <div className="text-xs text-gray-400 font-mono">
            {new Date().toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}{' '}
            {new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 text-gray-400">
            <Wifi size={14} />
            <span className="text-xs">100%</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-400">
            <Battery size={14} />
            <span className="text-xs">98%</span>
          </div>
          <button className="text-gray-500 hover:text-gray-300 transition">
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* 背景网格 */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
            主控舱界面
          </h1>
          <p className="text-gray-500 text-sm">点击同心圆开始/停止录音</p>
        </div>

        <ConcentricCircles
          isRecording={isRecording}
          elapsedTime={elapsedTime}
          onClick={handleRecordToggle}
        />

        {/* 状态指示器 */}
        <div className="mt-12 flex items-center space-x-8">
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-700'}`} />
            <span className="text-xs text-gray-400 mt-1">录音状态</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-gray-400 mt-1">系统在线</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-cyan-500" />
            <span className="text-xs text-gray-400 mt-1">存储正常</span>
          </div>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="text-center text-gray-600 text-xs mt-8">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-1 h-1 bg-gray-600 rounded-full" />
          <span>向左滑动进入回放矩阵</span>
          <div className="w-1 h-1 bg-gray-600 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export default HomeControl