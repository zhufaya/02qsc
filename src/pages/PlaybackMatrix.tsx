import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, Download, Upload } from 'lucide-react'

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
  const [isDragOver, setIsDragOver] = useState(false)
  const [droppedFile, setDroppedFile] = useState<string | null>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

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
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const index = parseInt(e.dataTransfer.getData('text/plain'))
    if (!isNaN(index)) {
      setCurrentTrack(index)
      setProgress(0)
      setIsPlaying(false)
      setDroppedFile(mockRecordings[index].name)
    }
  }

  const handlePlayPause = async () => {
    const newState = !isPlaying
    setIsPlaying(newState)

    // 调用后端 API（模拟）
    try {
      const endpoint = newState ? '/api/playback/play' : '/api/playback/pause'
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: mockRecordings[currentTrack].id }),
      })
    } catch (error) {
      console.error('API 调用失败:', error)
      setIsPlaying(!newState)
    }
  }

  const handleStop = async () => {
    setIsPlaying(false)
    setProgress(0)
    try {
      await fetch('/api/playback/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackId: mockRecordings[currentTrack].id }),
      })
    } catch (error) {
      console.error('API 调用失败:', error)
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return
    const rect = progressBarRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newProgress = (clickX / rect.width) * 100
    setProgress(Math.max(0, Math.min(100, newProgress)))
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

  const handleDownload = (trackName: string) => {
    // 模拟下载
    console.log('下载:', trackName)
    alert(`开始下载: ${trackName}`)
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-blue-50 to-white p-6 flex flex-col">
      {/* 顶部标题 */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
          录音文件回放矩阵
        </h1>
        <p className="text-gray-600 mt-2">拖拽文件到下方窗口进行播放</p>
      </div>

      {/* 文件模块 - 横向排列的拼图卡片 */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-blue-700 mb-4">录音文件库</h2>
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {mockRecordings.map((rec, index) => (
            <div
              key={rec.id}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, index)}
              className={`flex-shrink-0 w-64 p-4 rounded-2xl border-2 cursor-pointer transition-all ${currentTrack === index
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-blue-200 bg-white hover:bg-blue-50 hover:shadow-md'
                }`}
              onClick={() => handleTrackSelect(index)}
            >
              {/* 文件头 */}
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                  <Volume2 size={24} className="text-blue-600" />
                </div>
                <div className="ml-3 flex-1">
                  <div className="font-medium text-blue-800 truncate">{rec.name}</div>
                  <div className="text-xs text-gray-500">{rec.date}</div>
                </div>
                {currentTrack === index && (
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                )}
              </div>

              {/* 文件信息 */}
              <div className="flex justify-between text-sm">
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">时长</span>
                  <span className="font-mono font-bold text-blue-700">{rec.duration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-gray-500">大小</span>
                  <span className="font-mono font-bold text-blue-700">{rec.size}</span>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end mt-4">
                <button
                  className="p-2 text-gray-500 hover:text-blue-600 transition"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownload(rec.name)
                  }}
                  title="下载"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 拖放区 */}
      <div
        className={`flex-1 mb-8 rounded-3xl border-4 ${isDragOver ? 'border-blue-500 bg-blue-100' : 'border-dashed border-blue-300 bg-white'
          } transition-all duration-300 flex flex-col items-center justify-center`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {droppedFile ? (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mx-auto mb-4">
              <Volume2 size={32} className="text-blue-600" />
            </div>
            <div className="text-xl font-bold text-blue-700">已选择文件</div>
            <div className="font-mono text-blue-900 mt-2">{droppedFile}</div>
            <div className="text-gray-600 mt-2">点击下方按钮开始播放</div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mx-auto mb-6">
              <Upload size={40} className="text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-700">拖放文件到此处</div>
            <div className="text-gray-600 mt-2">将上方的录音文件拖拽到此区域进行播放</div>
            <div className="text-sm text-gray-500 mt-4">或点击文件直接选择</div>
          </div>
        )}
      </div>

      {/* 播放控制台 */}
      <div className="p-6 rounded-2xl bg-white border border-blue-200 shadow-lg">
        {/* 当前播放信息 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <div className="font-mono text-lg font-bold text-blue-800 truncate">
              {mockRecordings[currentTrack]?.name || '未选择文件'}
            </div>
            <div className="text-sm text-gray-600">
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
                className="w-32 accent-blue-500"
              />
              <span className="text-xs text-gray-600 w-10">{volume}%</span>
            </div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mb-8">
          <div
            ref={progressBarRef}
            className="h-2 w-full bg-gray-200 rounded-full cursor-pointer relative"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow" />
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>{Math.floor((progress / 100) * 225)} 秒</span>
            <span>{mockRecordings[currentTrack]?.duration}</span>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-center space-x-12">
          <button
            className="p-4 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 transition shadow"
            onClick={handlePrev}
            title="上一首"
          >
            <SkipBack size={22} />
          </button>
          <button
            className="p-5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white transition shadow-lg"
            onClick={handlePlayPause}
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? <Pause size={28} /> : <Play size={28} />}
          </button>
          <button
            className="p-4 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 transition shadow"
            onClick={handleStop}
            title="停止"
          >
            <Square size={22} />
          </button>
          <button
            className="p-4 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 transition shadow"
            onClick={handleNext}
            title="下一首"
          >
            <SkipForward size={22} />
          </button>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="text-center text-gray-500 text-sm mt-8">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-1 h-1 bg-gray-400 rounded-full" />
          <span>向右滑动返回会议控制中心</span>
          <div className="w-1 h-1 bg-gray-400 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export default PlaybackMatrix