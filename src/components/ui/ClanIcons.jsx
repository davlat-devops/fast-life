import { CLANS } from '@/constants/clans'

// ── ViperonIcon — sleek viper/snake ───────────────────────────
export function ViperonIcon({ size = 32, className, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style} aria-hidden="true">
      {/* S-curve body */}
      <path
        d="M21 4C25 4 28 7 28 12C28 17 23 19 16 19C9 19 4 21 4 26C4 29 8 30 12 28"
        stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"
      />
      {/* Head */}
      <ellipse cx="18" cy="4.5" rx="5" ry="3.5" fill="currentColor" transform="rotate(-10 18 4.5)" />
      {/* Eye */}
      <ellipse cx="20.5" cy="3.5" rx="1.2" ry="1.5" fill="white" />
      <ellipse cx="20.7" cy="3.8" rx="0.5" ry="0.7" fill="rgba(0,0,0,0.7)" />
      {/* Forked tongue */}
      <path d="M13 6L10 4.5M13 6L10 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

// ── CrodonIcon — dragon ────────────────────────────────────────
export function CrodonIcon({ size = 32, className, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style} aria-hidden="true">
      {/* Left horn */}
      <path d="M10 8L7 2L13 7Z" fill="currentColor" />
      {/* Right horn */}
      <path d="M22 8L25 2L19 7Z" fill="currentColor" />
      {/* Left wing */}
      <path d="M9 18C7 13 2 13 2 9C6 10 9 14 11 19Z" fill="currentColor" opacity="0.65" />
      {/* Right wing */}
      <path d="M23 18C25 13 30 13 30 9C26 10 23 14 21 19Z" fill="currentColor" opacity="0.65" />
      {/* Head */}
      <ellipse cx="16" cy="13" rx="7" ry="8" fill="currentColor" />
      {/* Left eye */}
      <circle cx="13" cy="12" r="1.7" fill="white" />
      <circle cx="13.4" cy="12" r="0.8" fill="rgba(0,0,0,0.65)" />
      {/* Right eye */}
      <circle cx="19" cy="12" r="1.7" fill="white" />
      <circle cx="19.4" cy="12" r="0.8" fill="rgba(0,0,0,0.65)" />
      {/* Snout line */}
      <path d="M13 18C14 19 18 19 19 18" stroke="rgba(255,255,255,0.28)" strokeWidth="1" strokeLinecap="round" />
      {/* Body */}
      <ellipse cx="16" cy="25" rx="4" ry="5" fill="currentColor" opacity="0.7" />
    </svg>
  )
}

// ── AveronIcon — eagle ─────────────────────────────────────────
export function AveronIcon({ size = 32, className, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style} aria-hidden="true">
      {/* Left wing */}
      <path d="M15 14C11 11 2 10 2 6C7 7 13 10 15 15Z" fill="currentColor" />
      {/* Right wing */}
      <path d="M17 14C21 11 30 10 30 6C25 7 19 10 17 15Z" fill="currentColor" />
      {/* Body */}
      <ellipse cx="16" cy="20" rx="3" ry="6" fill="currentColor" />
      {/* Head */}
      <circle cx="16" cy="12" r="4.5" fill="currentColor" />
      {/* Hooked beak */}
      <path d="M12 13L9 15L11.5 15.5Z" fill="white" opacity="0.75" />
      {/* Eye */}
      <circle cx="14.5" cy="11" r="1.5" fill="white" />
      <circle cx="14.7" cy="11" r="0.65" fill="rgba(0,0,0,0.7)" />
      {/* Tail feathers */}
      <path d="M14 26L12 31M16 26.5L16 31M18 26L20 31" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

// ── WolfrinIcon — wolf ─────────────────────────────────────────
export function WolfrinIcon({ size = 32, className, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} style={style} aria-hidden="true">
      {/* Left ear */}
      <path d="M6 17L4 5L13 13Z" fill="currentColor" />
      {/* Right ear */}
      <path d="M26 17L28 5L19 13Z" fill="currentColor" />
      {/* Head */}
      <path d="M7 17C7 10 11 6 16 6C21 6 25 10 25 17C25 23 21 27 16 27C11 27 7 23 7 17Z" fill="currentColor" />
      {/* Snout */}
      <ellipse cx="16" cy="22.5" rx="4.5" ry="3.5" fill="currentColor" opacity="0.55" />
      {/* Nose */}
      <ellipse cx="16" cy="20.5" rx="2.5" ry="1.8" fill="rgba(0,0,0,0.3)" />
      {/* Left eye */}
      <ellipse cx="12" cy="16.5" rx="2.2" ry="2.2" fill="white" />
      <circle cx="12.5" cy="16.5" r="1.1" fill="rgba(0,0,0,0.7)" />
      {/* Right eye */}
      <ellipse cx="20" cy="16.5" rx="2.2" ry="2.2" fill="white" />
      <circle cx="20.5" cy="16.5" r="1.1" fill="rgba(0,0,0,0.7)" />
    </svg>
  )
}

// ── ClanIcon dispatcher ────────────────────────────────────────
const CLAN_ICON_MAP = {
  VIPERON: ViperonIcon,
  CRODON:  CrodonIcon,
  AVERON:  AveronIcon,
  WOLFRIN: WolfrinIcon,
}

export function ClanIcon({ clanId, size = 32, className, style }) {
  const Icon  = CLAN_ICON_MAP[clanId]
  const color = CLANS[clanId]?.colorAccent ?? '#888'
  if (!Icon) return null
  return <Icon size={size} className={className} style={{ color, ...style }} />
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
