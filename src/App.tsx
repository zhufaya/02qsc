import { useState } from 'react'
import { motion, PanInfo } from 'framer-motion'
import HomeControl from './pages/HomeControl'
import PlaybackMatrix from './pages/PlaybackMatrix'
import AspectRatioContainer from './components/AspectRatioContainer'

function App() {
  const [page, setPage] = useState(0) // 0: HomeControl, 1: PlaybackMatrix

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100
    if (info.offset.x < -threshold) {
      // 向左滑动，切换到页面1
      setPage(1)
    } else if (info.offset.x > threshold) {
      // 向右滑动，切换到页面0
      setPage(0)
    }
  }

  return (
    <AspectRatioContainer targetWidth={1280} targetHeight={800} aspectRatio="16/10">
      <div className="w-full h-full bg-hud-bg overflow-hidden select-none relative">
        <motion.div
          className="relative w-full h-full"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
          animate={{ x: page === 0 ? 0 : '-100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ touchAction: 'none' }}
        >
          <div className="absolute inset-0 w-full h-full">
            <HomeControl />
          </div>
          <div className="absolute inset-0 w-full h-full left-full">
            <PlaybackMatrix />
          </div>
        </motion.div>
        {/* 页面指示器 */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
          <div className={`w-2 h-2 rounded-full ${page === 0 ? 'bg-hud-cyan' : 'bg-gray-700'}`} />
          <div className={`w-2 h-2 rounded-full ${page === 1 ? 'bg-hud-cyan' : 'bg-gray-700'}`} />
        </div>
      </div>
    </AspectRatioContainer>
  )
}

export default App