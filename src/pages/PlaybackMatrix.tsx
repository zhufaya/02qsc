import { useState, useEffect } from 'react'
import { Play, Pause, Square, SkipBack, SkipForward, HardDrive } from 'lucide-react'

const API_BASE_URL = 'http://localhost:8000'

const PlaybackMatrix = () => {
  const [recordings, setRecordings] = useState<any[]>([])
  const [currentTrack, setCurrentTrack] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [realTime, setRealTime] = useState({ current: 0, total: 0 })
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [droppedFile, setDroppedFile] = useState<string | null>(null) 

  // 读取文件列表
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/files`).then(res => res.json()).then(data => {
      if (data.files) setRecordings(data.files.map((f: any, i: number) => ({ ...f, id: i })));
    });
  }, []);

  // 轮询真实时间（完全依赖硬件反馈）
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/playback/status`);
        const data = await res.json();
        
        setRealTime({ current: data.current_time, total: data.total_time });
        setIsPlaying(data.is_playing); // 按钮状态由硬件真实状态接管
      } catch (e) { console.error("状态同步异常", e) }
    }, 500);
    return () => clearInterval(timer);
  }, []);

  // 安全的时间格式化
  const formatSecs = (s: number) => {
    if (s === undefined || s === null || isNaN(s)) return "00:00";
    const m = Math.floor(s / 60);
    const rs = Math.floor(s % 60);
    return `${m.toString().padStart(2, '0')}:${rs.toString().padStart(2, '0')}`;
  };

  // 根据真实时间计算进度条百分比
  const progress = realTime.total > 0 ? (realTime.current / realTime.total) * 100 : 0;

  // 播放与暂停切换
  const handlePlayToggle = async () => {
    if (recordings.length === 0 || !recordings[currentTrack]) return;
    
    // UI 先行反应，防止硬件延迟导致的手感顿挫
    const targetState = !isPlaying;
    setIsPlaying(targetState); 

    if (targetState) {
      await fetch(`${API_BASE_URL}/api/playback/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: recordings[currentTrack].filename })
      });
    } else {
      await fetch(`${API_BASE_URL}/api/playback/stop`, { method: 'POST' });
    }
  };

  const handleStop = async () => {
    setIsPlaying(false);
    await fetch(`${API_BASE_URL}/api/playback/stop`, { method: 'POST' });
  };

  return (
    // 【修复1】：移除了最外层所有的 onPointerDownCapture，允许左右滑动手势穿透回主页
    <div className="w-full h-full bg-slate-50 p-6 flex flex-col overflow-hidden select-none">
      <div className="mb-4 font-bold text-blue-600 flex items-center gap-2">
        <HardDrive size={20} /> Q-SYS 录音回放矩阵
      </div>

      {/* 录音卡片网格 */}
      <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar">
        <div className="flex flex-wrap gap-4 pb-10">
          {recordings.map((rec, i) => (
            <div
              key={i} draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', i.toString())}
              className={`w-48 h-32 p-4 rounded-xl border-2 transition-all cursor-pointer bg-white shadow-sm hover:shadow-md ${currentTrack === i ? 'border-blue-500 bg-blue-50/50' : 'border-blue-50'}`}
              onClick={() => {
                setCurrentTrack(i);
                setDroppedFile(rec.filename);
              }}
            >
              <div className="text-xs font-bold text-blue-900 truncate">{rec.filename}</div>
              <div className="text-[10px] text-gray-400 mt-12">大小: <span className="text-blue-500 font-bold">{rec.size}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* 拖入框 */}
      <div 
        className={`h-20 mb-4 rounded-xl border-2 border-dashed flex items-center justify-center transition-all ${isDraggingOver ? 'border-blue-500 bg-blue-50' : 'border-blue-100 bg-white/60'}`}
        onDragOver={e => { e.preventDefault(); setIsDraggingOver(true); }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={(e) => {
          e.preventDefault(); setIsDraggingOver(false);
          const idx = parseInt(e.dataTransfer.getData('text/plain'));
          if (!isNaN(idx) && recordings[idx]) {
            setCurrentTrack(idx);
            setDroppedFile(recordings[idx].filename);
          }
        }}
      >
        <span className="text-sm font-medium text-gray-500">
          {droppedFile ? `已装载: ${droppedFile}` : '拖拽上方卡片至此区域准备播放'}
        </span>
      </div>

      {/* 底部控制台 */}
      <div className="p-5 rounded-2xl bg-white border border-blue-50 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <div className="font-bold text-blue-900 truncate max-w-[300px]">{recordings[currentTrack]?.filename || '未选择'}</div>
        </div>

        <div className="space-y-4">
          {/* 【修复3】：使用动态计算的 progress，时间来源于真实硬件反馈 */}
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-gray-400 w-10 text-right">{formatSecs(realTime.current)}</span>
            <input
              type="range" min="0" max="100" value={progress || 0} readOnly
              className="flex-1 h-1.5 rounded-full appearance-none bg-gray-100 outline-none"
              style={{ background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #f1f5f9 ${progress}%, #f1f5f9 100%)` }}
              // 仅保留进度条处的防误触，防止拖动进度条时触发切页
              onPointerDownCapture={e => e.stopPropagation()} 
            />
            <span className="text-[10px] font-mono text-gray-400 w-10">{formatSecs(realTime.total)}</span>
          </div>

          <div className="flex justify-center items-center gap-12">
            <SkipBack className="text-blue-600 cursor-pointer active:scale-90" />
            
            {/* 【修复2】：绑定 PlayToggle 方法，保证按钮图标完美切换 */}
            <div 
              className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-blue-700 transition-colors"
              onClick={handlePlayToggle}
            >
              {isPlaying ? <Pause size={28} /> : <Play size={28} />}
            </div>
            
            <Square className="text-gray-300 cursor-pointer hover:text-red-500" onClick={handleStop} />
            <SkipForward className="text-blue-600 cursor-pointer active:scale-90" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaybackMatrix;