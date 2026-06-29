import imgViperon from '@/assets/clans/viperon.png'
import imgCrodon  from '@/assets/clans/crodon.png'
import imgAveron  from '@/assets/clans/averon.png'
import imgWolfrin from '@/assets/clans/wolfrin.png'

const CLAN_IMAGES = {
  VIPERON: imgViperon,
  CRODON:  imgCrodon,
  AVERON:  imgAveron,
  WOLFRIN: imgWolfrin,
}

// ── ClanIcon — circular clan image ────────────────────────────
export function ClanIcon({ clanId, size = 32, className, style }) {
  const src = CLAN_IMAGES[clanId]
  if (!src) return null
  return (
    <img
      src={src}
      alt={clanId}
      className={className}
      style={{
        width:        size,
        height:       size,
        borderRadius: '50%',
        objectFit:    'cover',
        border:       '2px solid rgba(255,255,255,0.2)',
        flexShrink:   0,
        display:      'inline-block',
        ...style,
      }}
    />
  )
}

// ── RankBadge — styled rank circle ────────────────────────────
const RANK_STYLES = {
  1: { bg: 'linear-gradient(135deg, #C9A227, #F8E08A)', color: '#7A5C00', glow: '#C9A22755' },
  2: { bg: 'linear-gradient(135deg, #9CA3AF, #E5E7EB)', color: '#374151', glow: '#9CA3AF55' },
  3: { bg: 'linear-gradient(135deg, #92613A, #D4956A)', color: '#5C3A1E', glow: '#92613A55' },
}

export function RankBadge({ rank, size = 22 }) {
  const s = RANK_STYLES[rank]
  if (s) {
    return (
      <div
        className="shrink-0 flex items-center justify-center font-black rounded-full select-none"
        style={{
          width:      size,
          height:     size,
          background: s.bg,
          color:      s.color,
          fontSize:   Math.round(size * 0.44),
          boxShadow:  `0 2px 8px ${s.glow}`,
          lineHeight: 1,
        }}
      >
        {rank}
      </div>
    )
  }
  return (
    <span
      className="shrink-0 tabular-nums font-bold select-none"
      style={{
        color:          'rgba(255,255,255,0.25)',
        fontSize:       11,
        minWidth:       size,
        display:        'inline-flex',
        justifyContent: 'center',
      }}
    >
      #{rank}
    </span>
  )
}
