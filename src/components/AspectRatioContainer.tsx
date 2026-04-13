import { useEffect, useState } from 'react'

interface AspectRatioContainerProps {
  children: React.ReactNode
  targetWidth?: number
  targetHeight?: number
  aspectRatio?: string // 例如 "16/10"
}

const AspectRatioContainer = ({
  children,
  targetWidth = 1280,
  targetHeight = 800,
  aspectRatio: _aspectRatio = '16/10',
}: AspectRatioContainerProps) => {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const updateScale = () => {
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight

      // 计算基于窗口和目标的缩放比例
      const scaleX = windowWidth / targetWidth
      const scaleY = windowHeight / targetHeight
      const newScale = Math.min(scaleX, scaleY)

      setScale(newScale)
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [targetWidth, targetHeight])

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-slate-50 overflow-hidden">
      <div
        className="relative origin-top-left"
        style={{
          width: `${targetWidth}px`,
          height: `${targetHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export default AspectRatioContainer