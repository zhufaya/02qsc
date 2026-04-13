import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  // 水流动画颜色配置
  const waterGradient = isRecording
    ? 'conic-gradient(from 0deg, #3b82f6, #06b6d4, #3b82f6)' // 亮蓝+青色
    : 'conic-gradient(from 0deg, #60a5fa, #93c5fd, #60a5fa)' // 单色蓝

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-blue-50 to-white p-6 flex flex-col overflow-hidden">
      {/* 背景光晕 */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-blue-400/20 blur-3xl"
          animate={{
            x: [0, 30, -20, 10, 0],
            y: [0, -20, 30, -10, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-80 h-80 rounded-full bg-cyan-400/15 blur-3xl"
          animate={{
            x: [0, -40, 20, -30, 0],
            y: [0, 30, -20, 40, 0],
            scale: [1, 0.9, 1.2, 0.8, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          style={{ top: '60%', right: '15%' }}
        />
        <motion.div
          className="absolute w-72 h-72 rounded-full bg-blue-300/10 blur-3xl"
          animate={{
            x: [0, 50, -30, 20, 0],
            y: [0, -40, 30, -20, 0],
            scale: [1, 1.15, 0.85, 1.1, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          style={{ bottom: '20%', left: '20%' }}
        />
      </div>

      {/* 顶部状态栏 */}
      <div className="flex justify-between items-center mb-8 z-10">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-blue-600">
            <Mic size={16} />
            <span className="text-sm font-medium">Q-SYS 会议系统</span>
          </div>
          <div className="h-4 w-px bg-gray-300" />
          <div className="text-xs text-gray-600 font-mono">
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })}{' '}
            {new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 text-gray-500">
            <Wifi size={14} />
            <span className="text-xs">100%</span>
          </div>
          <div className="flex items-center space-x-1 text-gray-500">
            <Battery size={14} />
            <span className="text-xs">98%</span>
          </div>
          <button className="text-gray-400 hover:text-blue-500 transition">
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 mb-3">
            会议控制中心
          </h1>
          <p className="text-gray-500">点击下方按钮开始或结束会议</p>
        </div>

        {/* 水流动态会议按钮 */}
        <div className="relative" onClick={handleRecordToggle}>
          <motion.div
            className="relative w-72 h-72 rounded-full flex items-center justify-center cursor-pointer"
            animate={{ scale: isRecording ? 1.05 : 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {/* 水流外环 */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: waterGradient,
                padding: '8px',
              }}
              animate={{ rotate: isRecording ? 360 : 0 }}
              transition={{
                duration: isRecording ? 1 : 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <div className="w-full h-full rounded-full bg-white" />
            </motion.div>

            {/* 按钮中心 */}
            <div className="absolute inset-8 rounded-full bg-gradient-to-br from-blue-50 to-white shadow-lg flex items-center justify-center">
              {isRecording ? (
                <div className="text-center">
                  <div className="text-4xl font-mono font-bold text-blue-600 tracking-wider">
                    {formatTime(elapsedTime)}
                  </div>
                  <div className="text-sm text-cyan-500 mt-2">会议进行中</div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500">开始会议</div>
                  <div className="text-sm text-gray-400 mt-2">点击启动录音</div>
                </div>
              )}
            </div>

            {/* 内层光晕 */}
            {isRecording && (
              <motion.div
                className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.div>
        </div>

        {/* 状态指示器 */}
        <div className="mt-12 flex items-center space-x-8">
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            <span className="text-xs text-gray-600 mt-1">会议状态</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs text-gray-600 mt-1">系统在线</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-cyan-400" />
            <span className="text-xs text-gray-600 mt-1">存储正常</span>
          </div>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="text-center text-gray-500 text-sm mt-8 z-10">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-1 h-1 bg-gray-400 rounded-full" />
          <span>向左滑动进入录音回放界面</span>
          <div className="w-1 h-1 bg-gray-400 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export default HomeControl