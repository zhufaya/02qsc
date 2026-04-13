import { useState, useEffect } from 'react'
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, Upload } from 'lucide-react'

const API_BASE_URL = 'http://localhost:8000'

// 模拟录音文件数据
const mockRecordings = [
  { id: 1, name: 'recording_2026-04-13_10-02-59_1.wav', duration: '03:45', size: '12.4 MB', date: '2026-04-13 10:02' },
  { id: 2, name: 'recording_2026-04-12_15-30-22_2.wav', duration: '02:18', size: '7.8 MB', date: '2026-04-12 15:30' },
  { id: 3, name: 'recording_2026-04-11_09-15-47_3.wav', duration: '05:12', size: '18.2 MB', date: '2026-04-11 09:15' },
  { id: 4, name: 'recording_2026-04-10_14-22-33_4.wav', duration: '01:56', size: '6.5 MB', date: '2026-04-10 14:22' },
  { id: 5, name: 'recording_2026-04-09_11-08-14_5.wav', duration: '04:33', size: '15.1 MB', date: '2026-04-09 11:08' },
  { id: 6, name: 'recording_2026-04-08_16-44-05_6.wav', duration: '02:07', size: '7.0 MB', date: '2026-04-08 16:44' },
]

const PlaybackMatrix = () => {
  const [currentTrack, setCurrentTrack] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(80)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [droppedFile, setDroppedFile] = useState<string | null>(null)

  // 模拟播放进度
  useEffect(() => {
    let interval: number | null = null
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false)
            return 0
          }
          return prev + 0.5
        })
      }, 100)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying])

  // 拖拽事件处理
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(true)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(true)
  }

  const handleDragLeave = () => {
    setIsDraggingOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    const index = parseInt(e.dataTransfer.getData('text/plain'))
    if (!isNaN(index)) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/playback/play`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: mockRecordings[index].name }),
        })
        if (response.ok) {
          setCurrentTrack(index)
          setProgress(0)
          setIsPlaying(true)
          setDroppedFile(mockRecordings[index].name)
        } else {
          alert('播放文件失败，请检查设备连接')
        }
      } catch (error) {
        console.error('API 调用失败:', error)
        alert('网络连接失败，请检查服务器是否在线')
      }
    }
  }

  const handlePlayPause = async () => {
    const newState = !isPlaying

    try {
      const endpoint = newState ? `${API_BASE_URL}/api/playback/play` : `${API_BASE_URL}/api/playback/stop`
      const body = newState
        ? JSON.stringify({ filename: mockRecordings[currentTrack].name })
        : JSON.stringify({})
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      if (response.ok) {
        setIsPlaying(newState)
      } else {
        alert('播放控制失败，请检查设备连接')
      }
    } catch (error) {
      console.error('API 调用失败:', error)
      alert('网络连接失败，请检查服务器是否在线')
    }
  }

  const handleStop = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/playback/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (response.ok) {
        setIsPlaying(false)
        setProgress(0)
      } else {
        alert('停止播放失败，请检查设备连接')
      }
    } catch (error) {
      console.error('API 调用失败:', error)
      alert('网络连接失败，请检查服务器是否在线')
    }
  }

  const handleTrackSelect = (index: number) => {
    setCurrentTrack(index)
    setIsPlaying(false)
    setProgress(0)
    setDroppedFile(null)
  }

  const handlePrev = () => {
    setCurrentTrack((prev) => (prev > 0 ? prev - 1 : mockRecordings.length - 1))
    setProgress(0)
    setDroppedFile(null)
  }

  const handleNext = () => {
    setCurrentTrack((prev) => (prev < mockRecordings.length - 1 ? prev + 1 : 0))
    setProgress(0)
    setDroppedFile(null)
  }

  // 格式化进度时间
  const formatProgressTime = (progressPercent: number, totalDuration: string) => {
    if (!totalDuration) return '00:00'
    // 将总时长字符串（如 "03:45"）转换为秒数
    const [minutes, seconds] = totalDuration.split(':').map(Number)
    const totalSeconds = minutes * 60 + seconds
    // 计算当前进度秒数
    const currentSeconds = Math.floor((progressPercent / 100) * totalSeconds)
    // 格式化为 mm:ss
    const currentMinutes = Math.floor(currentSeconds / 60)
    const currentSecs = currentSeconds % 60
    return `${currentMinutes.toString().padStart(2, '0')}:${currentSecs.toString().padStart(2, '0')}`
  }


  return (
    <div className="relative w-full h-full bg-gradient-to-b from-slate-50 to-white p-6 flex flex-col overflow-hidden">
      {/* 顶部标题 */}
      <div className="mb-2">
        <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
          录音文件回放
        </h1>
        <p className="text-gray-600 mt-1 text-sm">选择或拖拽文件进行播放</p>
      </div>

      {/* 文件区 - 横向排列的现代化卡片 */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-blue-700 mb-4">录音文件库</h2>
        <div className="flex flex-row overflow-x-auto gap-4 pb-4" onPointerDownCapture={(e) => e.stopPropagation()}>
          {mockRecordings.map((rec, index) => (
            <div
              key={rec.id}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, index)}
              onPointerDownCapture={(e) => e.stopPropagation()}
              className={`flex-shrink-0 w-56 h-40 p-4 rounded-xl border-2 cursor-pointer transition-all ${currentTrack === index
                  ? 'border-blue-500 bg-white shadow-md'
                  : 'border-blue-200 bg-white hover:border-blue-300 hover:shadow-sm'
                }`}
              onClick={() => handleTrackSelect(index)}
            >
              {/* 文件头 */}
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                  <Volume2 size={20} className="text-blue-600" />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="font-medium text-blue-800 truncate text-xs">{rec.name}</div>
                  <div className="text-xs text-gray-500 truncate mt-1">{rec.date}</div>
                </div>
                {currentTrack === index && (
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ml-2" />
                )}
              </div>

              {/* 文件信息 */}
              <div className="flex justify-between text-xs mt-4">
                <div className="flex flex-col">
                  <span className="text-gray-500">时长</span>
                  <span className="font-mono font-bold text-blue-700 mt-1">{rec.duration}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-gray-500">大小</span>
                  <span className="font-mono font-bold text-blue-700 mt-1">{rec.size}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 拖拽播放区 */}
      <div
        className={`h-28 mb-4 rounded-2xl border-4 ${isDraggingOver
            ? 'border-blue-500 bg-blue-50 shadow-inner'
            : 'border-dashed border-blue-300 bg-white'
          } transition-all duration-300 flex flex-col items-center justify-center shadow-md`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onPointerDownCapture={(e) => e.stopPropagation()}
      >
        {droppedFile ? (
          <div className="flex flex-col items-center justify-center p-4">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center shadow-md">
                <Volume2 size={20} className="text-blue-600" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-blue-700">已选择文件</div>
                <div className="font-mono text-blue-900 text-xs truncate max-w-[200px]">{droppedFile}</div>
              </div>
            </div>
            <div className="text-xs text-gray-600">点击下方按钮开始播放</div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center shadow-md">
                <Upload size={20} className="text-blue-500" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-blue-700">拖拽录音文件至此</div>
                <div className="text-xs text-gray-600 mt-1">将上方的录音文件拖拽到此区域进行播放</div>
              </div>
            </div>
            <div className="text-xs text-gray-500">或点击文件直接选择</div>
          </div>
        )}
      </div>

      {/* 播放控制台 */}
      <div className="mt-auto p-4 rounded-2xl bg-white border border-blue-200 shadow-xl" onPointerDownCapture={(e) => e.stopPropagation()}>
        {/* 当前播放信息 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <div className="font-mono text-lg font-bold text-blue-800 truncate">
              {mockRecordings[currentTrack]?.name || '未选择文件'}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              时长 {mockRecordings[currentTrack]?.duration} • 大小 {mockRecordings[currentTrack]?.size}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Volume2 size={18} className="text-gray-500" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="w-28 accent-blue-500"
                onPointerDownCapture={(e) => e.stopPropagation()}
              />
              <span className="text-xs text-gray-600 w-10">{volume}%</span>
            </div>
          </div>
        </div>


        {/* 控制按钮与进度条 */}
        <div className="space-y-4">
          {/* 科技感极简进度条 */}
          <div className="flex items-center space-x-4">
            <span className="text-xs text-gray-600 font-mono w-12 text-right">
              {formatProgressTime(progress, mockRecordings[currentTrack]?.duration)}
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(parseInt(e.target.value))}
              className="flex-1 h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-500"
              onPointerDownCapture={(e) => e.stopPropagation()}
            />
            <span className="text-xs text-gray-600 font-mono w-12">
              {mockRecordings[currentTrack]?.duration || '00:00'}
            </span>
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center justify-center space-x-10">
            <button
              className="p-3 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 transition shadow-md hover:shadow-lg"
              onClick={handlePrev}
              title="上一首"
            >
              <SkipBack size={20} />
            </button>
            <button
              className="p-4 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white transition shadow-lg hover:shadow-xl"
              onClick={handlePlayPause}
              title={isPlaying ? '暂停' : '播放'}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button
              className="p-3 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 transition shadow-md hover:shadow-lg"
              onClick={handleStop}
              title="停止"
            >
              <Square size={20} />
            </button>
            <button
              className="p-3 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 transition shadow-md hover:shadow-lg"
              onClick={handleNext}
              title="下一首"
            >
              <SkipForward size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="text-center text-gray-500 text-sm mt-4">
        <div className="flex items-center justify-center space-x-2">
          <span>→ 向右滑动返回会议控制中心</span>
        </div>
      </div>
    </div>
  )
}

export default PlaybackMatrix