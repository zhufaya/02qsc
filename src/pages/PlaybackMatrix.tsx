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
  const [isDraggingOver, setIsDraggingOver] = useState(false)
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
    setIsDraggingOver(true)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(true)
  }

  const handleDragLeave = () => {
    setIsDraggingOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    const index = parseInt(e.dataTransfer.getData('text/plain'))
    if (!isNaN(index)) {
      setCurrentTrack(index)
      setProgress(0)
      setIsPlaying(false)
      setDroppedFile(mockRecordings[index].name)

      // 调用后端 API（模拟）
      try {
        fetch('/api/playback/load', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trackId: mockRecordings[index].id }),
        })
      } catch (error) {
        console.error('API 调用失败:', error)
      }
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
    <div className="relative w-full h-full bg-gradient-to-b from-slate-50 to-white p-8 flex flex-col">
      {/* 顶部标题 */}
      <div className="mb-10">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
          录音文件回放
        </h1>
        <p className="text-gray-600 text-lg mt-3">选择或拖拽文件进行播放</p>
      </div>

      {/* 文件区 - 横向排列的现代化卡片 */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-blue-700 mb-6">录音文件库</h2>
        <div className="flex space-x-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent">
          {mockRecordings.map((rec, index) => (
            <div
              key={rec.id}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, index)}
              className={`flex-shrink-0 w-72 p-6 rounded-2xl border-2 cursor-pointer transition-all shadow-lg ${currentTrack === index
                  ? 'border-blue-500 bg-white shadow-blue-200'
                  : 'border-blue-200 bg-white hover:border-blue-300 hover:shadow-blue-100'
                }`}
              onClick={() => handleTrackSelect(index)}
            >
              {/* 文件头 */}
              <div className="flex items-center mb-5">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center shadow-sm">
                  <Volume2 size={28} className="text-blue-600" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="font-semibold text-blue-800 truncate text-sm">{rec.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{rec.date}</div>
                </div>
                {currentTrack === index && (
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                )}
              </div>

              {/* 文件信息 */}
              <div className="flex justify-between text-sm mb-5">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">时长</span>
                  <span className="font-mono font-bold text-blue-700">{rec.duration}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">大小</span>
                  <span className="font-mono font-bold text-blue-700">{rec.size}</span>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end">
                <button
                  className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownload(rec.name)
                  }}
                  title="下载"
                >
                  <Download size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 拖拽播放区 */}
      <div
        className={`flex-1 mb-10 rounded-3xl border-4 ${isDraggingOver
            ? 'border-blue-500 bg-blue-50 shadow-inner'
            : 'border-dashed border-blue-300 bg-white'
          } transition-all duration-300 flex flex-col items-center justify-center shadow-lg`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {droppedFile ? (
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Volume2 size={40} className="text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700">已选择文件</div>
            <div className="font-mono text-blue-900 mt-3 text-lg">{droppedFile}</div>
            <div className="text-gray-600 mt-4">点击下方按钮开始播放</div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mx-auto mb-8 shadow-lg">
              <Upload size={48} className="text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-blue-700">拖拽录音文件至此</div>
            <div className="text-gray-600 mt-4 text-lg">将上方的录音文件拖拽到此区域进行播放</div>
            <div className="text-sm text-gray-500 mt-6">或点击文件直接选择</div>
          </div>
        )}
      </div>

      {/* 播放控制台 */}
      <div className="p-8 rounded-2xl bg-white border border-blue-200 shadow-xl">
        {/* 当前播放信息 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            <div className="font-mono text-xl font-bold text-blue-800 truncate">
              {mockRecordings[currentTrack]?.name || '未选择文件'}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              时长 {mockRecordings[currentTrack]?.duration} • 大小 {mockRecordings[currentTrack]?.size}
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <Volume2 size={20} className="text-gray-500" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="w-36 accent-blue-500"
              />
              <span className="text-sm text-gray-600 w-12">{volume}%</span>
            </div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mb-10">
          <div
            ref={progressBarRef}
            className="h-3 w-full bg-gray-200 rounded-full cursor-pointer relative"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-5 h-5 bg-white border-3 border-blue-500 rounded-full shadow-lg" />
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-3">
            <span>{Math.floor((progress / 100) * 225)} 秒</span>
            <span>{mockRecordings[currentTrack]?.duration}</span>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-center space-x-16">
          <button
            className="p-5 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 transition shadow-lg hover:shadow-xl"
            onClick={handlePrev}
            title="上一首"
          >
            <SkipBack size={24} />
          </button>
          <button
            className="p-6 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white transition shadow-2xl hover:shadow-3xl"
            onClick={handlePlayPause}
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? <Pause size={32} /> : <Play size={32} />}
          </button>
          <button
            className="p-5 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 transition shadow-lg hover:shadow-xl"
            onClick={handleStop}
            title="停止"
          >
            <Square size={24} />
          </button>
          <button
            className="p-5 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 transition shadow-lg hover:shadow-xl"
            onClick={handleNext}
            title="下一首"
          >
            <SkipForward size={24} />
          </button>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="text-center text-gray-500 text-base mt-10">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-2 h-2 bg-gray-400 rounded-full" />
          <span>向右滑动返回会议控制中心</span>
          <div className="w-2 h-2 bg-gray-400 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export default PlaybackMatrix