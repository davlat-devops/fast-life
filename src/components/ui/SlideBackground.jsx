import { useEffect, useState } from 'react'
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
      {/* All slides stay mounted and crossfade via a plain CSS opacity
          transition — no framer-motion here. Two independent Chrome LCP
          footguns to avoid re-introducing:
          1. Unmounting/remounting the active slide (e.g. via AnimatePresence
             + key={idx}) invalidates it as the LCP candidate the moment it's
             removed, so the browser falls back to a much smaller element.
          2. framer-motion's motion.img promotes the element to its own
             compositor layer (transform/will-change), which this Chrome
             version does not route through the paint-timing instrumentation
             LCP relies on — the element silently never becomes an LCP
             candidate at all, animated or not. */}
      {slides.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          fetchPriority={i === 0 ? 'high' : undefined}
          decoding={i === 0 ? 'async' : undefined}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center',
            opacity: idx === i ? 1 : 0,
            transform: `scale(${idx === i ? 1.08 : 1.04})`,
            transition: 'opacity 1.2s ease, transform 4.5s linear',
          }}
        />
      ))}

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
