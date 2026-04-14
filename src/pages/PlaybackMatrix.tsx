import { useState, useEffect, useRef } from 'react'
import { Play, Pause, Square, Rewind, FastForward, HardDrive } from 'lucide-react'

const API_BASE_URL = 'http://localhost:8000'

const PlaybackMatrix = () => {
  const [recordings, setRecordings] = useState<any[]>([])
  
  const [currentTrack, setCurrentTrack] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('qsys_last_track');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });
  
  const [droppedFile, setDroppedFile] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('qsys_last_file') : null;
  });

  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playerStatus, setPlayerStatus] = useState({ current_sec: 0, time_str: "00:00" })
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  
  const latestDragRef = useRef(0);
  const ignoreServerUntil = useRef<number>(0);
  const actionLock = useRef(false);
  
  // 【核心修复 1】：创建一个引用，用来直接操控底层的 input DOM 元素
  const rangeInputRef = useRef<HTMLInputElement>(null);

  const formatSecs = (s: number) => {
    if (!s || isNaN(s) || s < 0) return "00:00";
    const m = Math.floor(s / 60);
    const rs = Math.floor(s % 60);
    return `${m.toString().padStart(2, '0')}:${rs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE_URL}/api/files`)
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.files && data.files.length > 0) {
          setRecordings(data.files.map((f: any, i: number) => ({ ...f, id: i })));
          
          const savedFile = localStorage.getItem('qsys_last_file');
          if (savedFile) {
            const foundIndex = data.files.findIndex((f: any) => f.filename === savedFile);
            if (foundIndex !== -1) {
              setCurrentTrack(foundIndex);
              setDroppedFile(savedFile);
            }
          } else {
            setDroppedFile(data.files[0].filename);
          }
        }
      })
      .catch(err => console.error("加载失败:", err));
      
    return () => { isMounted = false; }
  }, []);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/playback/status`);
        const data = await res.json();
        
        if (!isDragging && Date.now() > ignoreServerUntil.current) {
          setPlayerStatus({ current_sec: data.current_sec, time_str: data.time_str });
        }
        
        if (!actionLock.current) setIsPlaying(data.is_playing);
      } catch (e) {}
    }, 200);
    return () => clearInterval(timer);
  }, [isDragging]); 

  const currentTotalSecs = recordings[currentTrack]?.duration_sec || 1; 

  const currentRenderVal = isDragging ? dragValue : playerStatus.current_sec;
  let progressPercent = (currentRenderVal / currentTotalSecs) * 100;
  progressPercent = Math.min(100, Math.max(0, progressPercent));

  const handleLoadTrack = async (index: number) => {
    if (!recordings[index]) return;
    
    setCurrentTrack(index);
    setDroppedFile(recordings[index].filename);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('qsys_last_track', index.toString());
      localStorage.setItem('qsys_last_file', recordings[index].filename);
    }
    
    await fetch(`${API_BASE_URL}/api/playback/load`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: recordings[index].filename })
    });
  };

  const handlePlayToggle = async () => {
    if (!recordings[currentTrack]) return;
    actionLock.current = true;
    const targetState = !isPlaying;
    setIsPlaying(targetState); 

    await fetch(`${API_BASE_URL}/api/playback/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ control: targetState ? 'play' : 'pause', value: 1 })
    });
    setTimeout(() => { actionLock.current = false; }, 1500);
  };

  const handleStop = async () => {
    actionLock.current = true;
    setIsPlaying(false);
    await fetch(`${API_BASE_URL}/api/playback/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ control: 'stop', value: 1 })
    });
    setTimeout(() => { actionLock.current = false; }, 1500);
  };

  const handleCustomControl = (controlName: string, val: number) => {
    fetch(`${API_BASE_URL}/api/playback/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ component: 'Custom_Controls', control: controlName, value: val })
    });
  };

  const handleAbsoluteSkip = (offsetSeconds: number) => {
    let targetSec = playerStatus.current_sec + offsetSeconds;
    targetSec = Math.min(currentTotalSecs, Math.max(0, targetSec));

    setPlayerStatus(prev => ({...prev, current_sec: targetSec}));
    ignoreServerUntil.current = Date.now() + 1500;
    handleCustomControl('integer.1', Math.round(targetSec));
  };

  const finishDrag = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    const targetSec = latestDragRef.current;
    setPlayerStatus(prev => ({...prev, current_sec: targetSec}));
    handleCustomControl('integer.1', Math.round(targetSec));
    
    ignoreServerUntil.current = Date.now() + 1500;
    setIsDragging(false);

    // 【核心修复 2】：绝杀！在松开手指的瞬间，用代码模拟“点击空白处”，强制剥夺进度条的焦点
    if (rangeInputRef.current) {
      rangeInputRef.current.blur();
    }
  };

  return (
    <div className="w-full h-full bg-slate-50 p-6 flex flex-col overflow-hidden select-none overscroll-none">
      <div className="mb-4 font-bold text-blue-600 flex items-center gap-2">
        <HardDrive size={20} /> Q-SYS 录音回放矩阵
      </div>

      <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar">
        <div className="flex flex-wrap gap-4 pb-10">
          {recordings.map((rec, i) => (
            <div
              key={i} draggable
              onDragStart={(e) => e.dataTransfer.setData('text/plain', i.toString())}
              className={`w-48 p-4 rounded-xl border-2 transition-all cursor-pointer bg-white shadow-sm hover:shadow-md flex flex-col justify-between ${currentTrack === i ? 'border-blue-500 bg-blue-50/50 shadow-md' : 'border-blue-50'}`}
              onClick={() => handleLoadTrack(i)}
            >
              <div className="text-xs font-bold text-blue-900 break-all whitespace-normal">
                {rec.filename}
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-4 pt-2 border-t border-gray-100">
                <span>大小: <span className="text-blue-500 font-bold">{rec.size}</span></span>
                <span>时长: <span className="text-blue-500 font-bold">{rec.duration}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div 
        className={`min-h-[80px] mb-4 rounded-xl border-2 border-dashed flex items-center justify-center transition-all p-4 ${isDraggingOver ? 'border-blue-500 bg-blue-50' : 'border-blue-100 bg-white/60'}`}
        onDragOver={e => { e.preventDefault(); setIsDraggingOver(true); }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={(e) => {
          e.preventDefault(); setIsDraggingOver(false);
          const idx = parseInt(e.dataTransfer.getData('text/plain'));
          if (!isNaN(idx)) handleLoadTrack(idx);
        }}
      >
        <span className="text-sm font-medium text-gray-500 text-center break-all whitespace-normal">
          {droppedFile ? `已装载: ${droppedFile} (${recordings[currentTrack]?.duration || '获取中'})` : '拖拽上方卡片至此区域准备播放'}
        </span>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-blue-50 shadow-xl">
        <div className="mb-4">
          <div className="font-bold text-blue-900 text-sm leading-tight break-all whitespace-normal">
            {recordings[currentTrack]?.filename || '未选择文件'}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-gray-400 w-10 text-right">
              {formatSecs(currentRenderVal)}
            </span>
            
            <div 
              className="flex-1 flex items-center py-4" 
              style={{ touchAction: 'none' }}
              onTouchMove={e => e.stopPropagation()}
              onPointerMove={e => e.stopPropagation()}
            >
              <input
                ref={rangeInputRef} // 【绑定引用】将 DOM 元素绑定到我们的 ref 上
                type="range" 
                min="0" 
                max={currentTotalSecs} 
                step="0.1" 
                value={currentRenderVal} 
                draggable={false}
                onDragStart={e => e.preventDefault()}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setIsDragging(true);
                  ignoreServerUntil.current = Date.now() + 5000;
                  setDragValue(parseFloat(e.currentTarget.value));
                }}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setDragValue(val);
                  latestDragRef.current = val;
                }}
                onPointerUp={finishDrag}
                onTouchEnd={finishDrag}
                className="w-full h-1.5 rounded-full appearance-none bg-gray-100 outline-none cursor-pointer touch-none overscroll-none"
                style={{ 
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progressPercent}%, #f1f5f9 ${progressPercent}%, #f1f5f9 100%)`,
                  touchAction: 'none'
                }}
              />
            </div>
            
            <span className="text-[10px] font-mono text-gray-400 w-10">
              {recordings[currentTrack]?.duration || "00:00"}
            </span>
          </div>

          <div className="flex justify-center items-center gap-12">
            <Rewind 
              size={24} 
              className="text-blue-600 cursor-pointer active:scale-90 active:text-blue-800 transition-transform" 
              onClick={(e) => { e.stopPropagation(); handleAbsoluteSkip(-5); }}
            />
            
            <div 
              className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer hover:bg-blue-700 transition-colors"
              onClick={(e) => { e.stopPropagation(); handlePlayToggle(); }}
            >
              {isPlaying ? <Pause size={28} /> : <Play size={28} />}
            </div>
            
            <Square size={20} className="text-gray-300 cursor-pointer hover:text-red-500" onClick={(e) => { e.stopPropagation(); handleStop(); }} />
            
            <FastForward 
              size={24} 
              className="text-blue-600 cursor-pointer active:scale-90 active:text-blue-800 transition-transform"
              onClick={(e) => { e.stopPropagation(); handleAbsoluteSkip(5); }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaybackMatrix;