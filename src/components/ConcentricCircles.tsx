
interface ConcentricCirclesProps {
  isRecording: boolean
  elapsedTime: number // 秒数
  onClick: () => void
}

const ConcentricCircles = ({ isRecording, elapsedTime, onClick }: ConcentricCirclesProps) => {

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="relative flex items-center justify-center w-64 h-64" onClick={onClick}>
      {/* 最外层圆环 - 最慢，顺时针 */}
      <svg className="absolute w-full h-full" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="url(#outer-gradient)"
          strokeWidth="0.5"
          strokeDasharray="4,4"
          className={isRecording ? 'animate-spin-slower' : ''}
          style={{ transformOrigin: 'center' }}
        />
        <defs>
          <linearGradient id="outer-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ffff" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#0077ff" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>

      {/* 中间圆环 - 中速，逆时针 */}
      <svg className="absolute w-3/4 h-3/4" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r="70"
          fill="none"
          stroke="url(#middle-gradient)"
          strokeWidth="0.5"
          strokeDasharray="3,3"
          className={isRecording ? 'animate-spin-reverse-slow' : ''}
          style={{ transformOrigin: 'center' }}
        />
        <defs>
          <linearGradient id="middle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0077ff" stopOpacity="0.5" />
          </linearGradient>
        </defs>
      </svg>

      {/* 内层圆环 - 最快，顺时针 */}
      <svg className="absolute w-1/2 h-1/2" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r="50"
          fill="none"
          stroke="url(#inner-gradient)"
          strokeWidth="0.5"
          strokeDasharray="2,2"
          className={isRecording ? 'animate-spin-slow' : ''}
          style={{ transformOrigin: 'center' }}
        />
        <defs>
          <linearGradient id="inner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ffff" stopOpacity="1" />
            <stop offset="100%" stopColor="#0077ff" stopOpacity="0.7" />
          </linearGradient>
        </defs>
      </svg>

      {/* 中心区域 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/10 to-blue-500/5 blur-sm" />
          {isRecording ? (
            <div className="relative z-10">
              <div className="text-3xl font-mono font-bold text-hud-cyan tracking-wider">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-xs text-center text-cyan-300/70 mt-1">录音中</div>
            </div>
          ) : (
            <div className="relative z-10">
              <div className="text-xl font-semibold text-gray-300">系统待命</div>
              <div className="text-xs text-center text-gray-500 mt-1">点击开始录音</div>
            </div>
          )}
        </div>
      </div>

      {/* 点击区域覆盖 */}
      <div className="absolute inset-0 cursor-pointer z-20" />
    </div>
  )
}

export default ConcentricCircles