import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import imgWolfrin from '@/assets/clans/wolfrin-hero.webp'
import imgAveron  from '@/assets/clans/averon-hero.webp'
import imgCrodon  from '@/assets/clans/crodon-hero.webp'
import imgViperon from '@/assets/clans/viperon-hero.webp'

// Named map so pages can pick a clan-specific image
export const CLAN_IMAGES = {
  WOLFRIN: imgWolfrin,
  AVERON:  imgAveron,
  CRODON:  imgCrodon,
  VIPERON: imgViperon,
}

const ALL_SLIDES = [imgWolfrin, imgAveron, imgCrodon, imgViperon]

/**
 * Fullscreen/absolute slideshow background.
 * Parent must have position:relative and overflow:hidden.
 *
 * Props:
 *   images           – array of src strings to cycle (default: all 4 clan images)
 *   image            – single src string; disables cycling
 *   overlay          – CSS color for the dark overlay (default rgba(0,0,0,0.55))
 *   bottomFade       – if true, adds a gradient fading into --fl-bg at the bottom
 *   placeholderColor – background color shown instantly, before `image` loads
 *                      (only used in single-image mode)
 */
export default function SlideBackground({
  images           = ALL_SLIDES,
  image            = null,
  overlay          = 'rgba(0,0,0,0.55)',
  bottomFade       = false,
  placeholderColor = '#0a0a0a',
}) {
  const slides = image ? [image] : images
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (slides.length <= 1) return
    const id = setInterval(() => setIdx(i => (i + 1) % slides.length), 4000)
    return () => clearInterval(id)
  }, [slides.length])

  // Single, non-cycling image (e.g. profile/clan hero banner): a plain CSS
  // background-image avoids the <img> decode/paint cost and shows a solid
  // placeholder color instantly instead of a blank flash while it loads.
  if (image) {
    return (
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div
          style={{
            position:        'absolute', inset: 0,
            backgroundColor: placeholderColor,
            backgroundImage: `url(${image})`,
            backgroundSize:  'cover',
            backgroundPosition: 'center',
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: overlay, pointerEvents: 'none' }} />
        {bottomFade && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(to top, var(--fl-bg) 0%, rgba(0,0,0,0.15) 45%, transparent 75%)',
          }} />
        )}
      </div>
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <AnimatePresence>
        <motion.img
          key={idx}
          src={slides[idx]}
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

      {/* Dark overlay */}
      <div style={{ position: 'absolute', inset: 0, background: overlay, pointerEvents: 'none' }} />

      {/* Optional bottom fade into page background */}
      {bottomFade && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to top, var(--fl-bg) 0%, rgba(0,0,0,0.15) 45%, transparent 75%)',
        }} />
      )}
    </div>
  )
}
