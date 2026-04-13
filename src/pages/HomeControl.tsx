import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mic } from 'lucide-react'

const API_BASE_URL = 'http://localhost:8000'

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

    // 调用后端 API（模拟）
    try {
      const endpoint = newState ? `${API_BASE_URL}/api/record/start` : `${API_BASE_URL}/api/record/stop`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp: Date.now() }),
      })
      if (response.ok) {
        setIsRecording(newState)
      } else {
        alert('硬件连接失败或服务器离线，请检查 Q-SYS 设备连接状态')
      }
    } catch (error) {
      console.error('网络错误:', error)
      alert('网络连接失败，请检查服务器是否在线')
    }
  }

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-slate-50 to-white p-8 flex flex-col overflow-hidden">
      {/* 背景光晕 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full bg-blue-300/30 blur-[100px]"
          animate={{
            x: [0, 40, -30, 20, 0],
            y: [0, -30, 40, -20, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ top: '10%', left: '5%' }}
        />
        <motion.div
          className="absolute w-[450px] h-[450px] rounded-full bg-cyan-300/30 blur-[100px]"
          animate={{
            x: [0, -50, 30, -40, 0],
            y: [0, 40, -30, 50, 0],
            scale: [1, 0.9, 1.2, 0.85, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          style={{ top: '50%', right: '10%' }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full bg-blue-400/20 blur-[100px]"
          animate={{
            x: [0, 60, -40, 30, 0],
            y: [0, -50, 40, -30, 0],
            scale: [1, 1.15, 0.85, 1.1, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4,
          }}
          style={{ bottom: '15%', left: '15%' }}
        />
      </div>

      {/* 顶部状态栏 */}
      <div className="flex justify-between items-center mb-10 z-10">
        <div className="flex items-center space-x-5">
          <div className="flex items-center space-x-3 text-blue-600">
            <div className="p-2 rounded-xl bg-white/80 backdrop-blur-sm border border-white/90 shadow-sm">
              <Mic size={20} />
            </div>
            <span className="text-lg font-semibold">Q-SYS 会议系统</span>
          </div>
          <div className="h-5 w-px bg-gray-300" />
          <div className="text-sm text-gray-700 font-mono bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/90 shadow-sm">
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })}{' '}
            {new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="mb-14 text-center">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 mb-4">
            会议控制中心
          </h1>
          <p className="text-gray-600 text-lg">点击下方按钮开始或结束会议录音</p>
        </div>

        {/* 水流动效按钮 */}
        <div className="relative" onClick={handleRecordToggle}>
          <motion.div
            className="relative w-80 h-80 rounded-full flex items-center justify-center cursor-pointer"
            animate={{ scale: isRecording ? 1.05 : 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {/* 未开启会议状态：水波流动圆环 */}
            {!isRecording && (
              <div
                className="absolute inset-0 rounded-full p-3"
                style={{
                  background: 'conic-gradient(from 0deg, #3b82f6 0%, #06b6d4 50%, rgba(59,130,246,0) 100%)',
                  animation: 'spin 15s linear infinite',
                }}
              >
                <div className="w-full h-full rounded-full bg-white/90 backdrop-blur-sm shadow-inner" />
              </div>
            )}

            {/* 开启会议状态：三个同心旋转圆环 */}
            {isRecording && (
              <>
                {/* 最外圈 - 顺时针，慢速 */}
                <div
                  className="absolute inset-0 rounded-full border-4 border-transparent"
                  style={{
                    background: 'conic-gradient(from 0deg, #3b82f6, #06b6d4, #3b82f6)',
                    animation: 'spin 4s linear infinite',
                    WebkitMask: 'radial-gradient(circle, transparent 65%, black 66%)',
                    mask: 'radial-gradient(circle, transparent 65%, black 66%)',
                  }}
                />
                {/* 中间圈 - 逆时针，中速 */}
                <div
                  className="absolute inset-8 rounded-full border-4 border-transparent"
                  style={{
                    background: 'conic-gradient(from 180deg, #06b6d4, #3b82f6, #06b6d4)',
                    animation: 'spin 2.5s linear infinite reverse',
                    WebkitMask: 'radial-gradient(circle, transparent 70%, black 71%)',
                    mask: 'radial-gradient(circle, transparent 70%, black 71%)',
                  }}
                />
                {/* 最内圈 - 顺时针，快速 */}
                <div
                  className="absolute inset-16 rounded-full border-4 border-transparent"
                  style={{
                    background: 'conic-gradient(from 0deg, #3b82f6, #06b6d4, #3b82f6)',
                    animation: 'spin 1.2s linear infinite',
                    WebkitMask: 'radial-gradient(circle, transparent 75%, black 76%)',
                    mask: 'radial-gradient(circle, transparent 75%, black 76%)',
                  }}
                />
                {/* 内层光晕 */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-cyan-400/20 blur-2xl"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </>
            )}

            {/* 按钮中心 */}
            <div className="absolute inset-12 rounded-full bg-gradient-to-br from-white to-slate-50 shadow-lg flex items-center justify-center border border-white/80">
              {isRecording ? (
                <div className="text-center">
                  <div className="text-5xl font-mono font-bold text-blue-600 tracking-wider">
                    {formatTime(elapsedTime)}
                  </div>
                  <div className="text-lg text-cyan-500 mt-4 font-medium">录音进行中</div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-500">准备就绪</div>
                  <div className="text-gray-500 mt-4">点击开始录音</div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* 状态指示器 */}
        <div className="mt-16 flex items-center space-x-12">
          <div className="flex flex-col items-center">
            <div className={`w-4 h-4 rounded-full ${isRecording ? 'bg-green-500 animate-pulse' : 'bg-gray-300'} mb-2`} />
            <span className="text-sm text-gray-700">会议状态</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-blue-500 mb-2" />
            <span className="text-sm text-gray-700">系统在线</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-4 h-4 rounded-full bg-cyan-400 mb-2" />
            <span className="text-sm text-gray-700">存储正常</span>
          </div>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="text-center text-gray-500 text-base mt-10 z-10">
        <div className="flex items-center justify-center space-x-2">
          <span>← 向左滑动进入录音回放界面</span>
        </div>
      </div>
    </div>
  )
}

export default HomeControl