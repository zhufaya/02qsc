import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Square, SkipBack, SkipForward, Volume2, Download } from 'lucide-react';

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
  }

  const handlePrev = () => {
    setCurrentTrack((prev) => (prev > 0 ? prev - 1 : mockRecordings.length - 1))
    setProgress(0)
  }

  const handleNext = () => {
    setCurrentTrack((prev) => (prev < mockRecordings.length - 1 ? prev + 1 : 0))
    setProgress(0)
  }

  const handleDownload = (trackName: string) => {
    // 模拟下载
    console.log('下载:', trackName)
    alert(`开始下载: ${trackName}`)
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-b from-hud-bg to-black p-6 flex flex-col">
      {/* 顶部标题 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          录音文件回放矩阵
        </h1>
        <p className="text-gray-500 text-sm mt-1">选择文件进行播放或下载</p>
      </div>

      {/* 录音文件列表 */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-2 gap-4 h-full">
          {mockRecordings.map((rec, index) => (
            <div
              key={rec.id}
              className={`relative p-4 rounded-xl border cursor-pointer transition-all ${currentTrack === index
                  ? 'border-cyan-500/50 bg-cyan-500/5'
                  : 'border-gray-800 bg-gray-900/30 hover:bg-gray-800/30'
                }`}
              onClick={() => handleTrackSelect(index)}
            >
              {/* 选中指示器 */}
              {currentTrack === index && (
                <div className="absolute top-3 right-3 w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
              )}

              {/* 文件图标 */}
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-900/30 to-blue-900/30 flex items-center justify-center">
                  <Volume2 size={20} className="text-cyan-400" />
                </div>
                <div className="ml-3 flex-1">
                  <div className="font-mono text-sm truncate">{rec.name}</div>
                  <div className="text-xs text-gray-500">{rec.date}</div>
                </div>
              </div>

              {/* 文件信息 */}
              <div className="flex justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">时长</span>
                  <span className="text-cyan-300 font-mono">{rec.duration}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">大小</span>
                  <span className="text-cyan-300 font-mono">{rec.size}</span>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="absolute bottom-3 right-3">
                <button
                  className="p-1 text-gray-500 hover:text-cyan-400 transition"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownload(rec.name)
                  }}
                  title="下载"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 播放控制台 */}
      <div className="mt-8 p-6 rounded-2xl border border-gray-800 bg-gray-900/20">
        {/* 当前播放信息 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="font-mono text-lg text-cyan-300 truncate">
              {mockRecordings[currentTrack]?.name || '未选择文件'}
            </div>
            <div className="text-sm text-gray-500">
              时长 {mockRecordings[currentTrack]?.duration} • 大小 {mockRecordings[currentTrack]?.size}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Volume2 size={16} className="text-gray-400" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="w-24 accent-cyan-500"
              />
              <span className="text-xs text-gray-400 w-8">{volume}%</span>
            </div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mb-6">
          <div
            ref={progressBarRef}
            className="h-1.5 w-full bg-gray-800 rounded-full cursor-pointer relative"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-cyan-400 rounded-full shadow-lg" />
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{Math.floor((progress / 100) * 225)} 秒</span>
            <span>{mockRecordings[currentTrack]?.duration}</span>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-center space-x-8">
          <button
            className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-cyan-300 transition"
            onClick={handlePrev}
            title="上一首"
          >
            <SkipBack size={20} />
          </button>
          <button
            className="p-4 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white transition shadow-lg"
            onClick={handlePlayPause}
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button
            className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-cyan-300 transition"
            onClick={handleStop}
            title="停止"
          >
            <Square size={20} />
          </button>
          <button
            className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-cyan-300 transition"
            onClick={handleNext}
            title="下一首"
          >
            <SkipForward size={20} />
          </button>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="text-center text-gray-600 text-xs mt-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-1 h-1 bg-gray-600 rounded-full" />
          <span>向右滑动返回主控舱</span>
          <div className="w-1 h-1 bg-gray-600 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export default PlaybackMatrix