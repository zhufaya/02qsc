import { useState } from 'react'
import { motion, PanInfo, AnimatePresence } from 'framer-motion'
import HomeControl from './pages/HomeControl'
import PlaybackMatrix from './pages/PlaybackMatrix'
import AspectRatioContainer from './components/AspectRatioContainer'

function App() {
  const [page, setPage] = useState(0) // 0: HomeControl, 1: PlaybackMatrix
  const [direction, setDirection] = useState(0) // -1: 向左, 1: 向右

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 200 // 屏幕宽度的 1/4
    if (info.offset.x < -threshold) {
      // 向左滑动，切换到页面1（下一页）
      setDirection(1) // 正值表示切换到下一页
      setPage(1)
    } else if (info.offset.x > threshold) {
      // 向右滑动，切换到页面0（上一页）
      setDirection(-1) // 负值表示切换到上一页
      setPage(0)
    }
  }

  const pageVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0,
      transition: {
        duration: 0.2
      }
    })
  }

  return (
    <AspectRatioContainer targetWidth={1280} targetHeight={800}>
      <div className="w-full h-full bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl shadow-2xl overflow-hidden select-none relative">
        <AnimatePresence initial={false} custom={direction}>
          {page === 0 ? (
            <motion.div
              key="home"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 w-full h-full"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              style={{ touchAction: 'none' }}
            >
              <HomeControl />
            </motion.div>
          ) : (
            <motion.div
              key="playback"
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0 w-full h-full"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              style={{ touchAction: 'none' }}
            >
              <PlaybackMatrix />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AspectRatioContainer>
  )
}

export default App