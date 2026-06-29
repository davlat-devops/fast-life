import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import imgChess from '@/assets/slides/chess.jpg'
import imgVoll  from '@/assets/slides/voll.jpg'
import imgVolle from '@/assets/slides/volle.jpg'
import imgFoot  from '@/assets/slides/foot.jpg'

const SLIDES = [imgChess, imgVoll, imgVolle, imgFoot]

export default function HeroSlideshow({ overlay = 'rgba(0,0,0,0.52)' }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setCurrent(i => (i + 1) % SLIDES.length), 4000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <AnimatePresence>
        <motion.img
          key={current}
          src={SLIDES[current]}
          alt=""
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1.08 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.2, ease: 'easeInOut' },
            scale:   { duration: 4.5, ease: 'linear' },
          }}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
          }}
        />
      </AnimatePresence>

      {/* Dark overlay for text readability */}
      <div style={{ position: 'absolute', inset: 0, background: overlay, pointerEvents: 'none' }} />
    </div>
  )
}
