import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Lock, Check, Zap, ShieldCheck, Award } from 'lucide-react'
import { BADGES, BADGE_ICONS } from '@/constants/badges'

function getProgress(key, { monthlyCP, eventsCount }) {
  switch (key) {
    case 'first':         return { current: monthlyCP,   target: 50 }
    case 'fast':           return { current: monthlyCP,   target: 100 }
    case 'perfect':        return { current: monthlyCP,   target: 150 }
    case 'regular':        return { current: eventsCount, target: 5 }
    case 'dedicated':      return { current: eventsCount, target: 20 }
    case 'event_machine':  return { current: eventsCount, target: 30 }
    default:               return null
  }
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-[11px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors"
      style={active
        ? { background: 'var(--fl-text)', color: 'var(--fl-bg)' }
        : { background: 'var(--fl-card-alt)', color: 'var(--fl-text-3)', border: '1px solid var(--fl-border)' }}
    >
      {label}
    </button>
  )
}

function BadgeCard({ badge, earned, accent, progress, index }) {
  const Icon = BADGE_ICONS[badge.key] ?? Award
  const pct = progress ? Math.min((progress.current / progress.target) * 100, 100) : 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.02, duration: 0.25 }}
      whileHover={{ y: -3 }}
      className="relative rounded-2xl p-4 flex flex-col gap-3 transition-shadow"
      style={earned
        ? {
            background:     'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(8px)',
            border:          `1px solid ${accent}45`,
            boxShadow:       `0 0 14px ${accent}25, inset 0 1px 0 rgba(255,255,255,0.08)`,
          }
        : {
            background: 'var(--fl-card-alt)',
            border:     '1px solid var(--fl-border)',
          }}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: earned ? `${accent}20` : 'var(--fl-card)',
            border:     `1px solid ${earned ? `${accent}45` : 'var(--fl-border)'}`,
          }}
        >
          <Icon
            size={20}
            style={{
              color:   earned ? '#C9A227' : 'var(--fl-text-3)',
              opacity: earned ? 1 : 0.35,
              filter:  earned ? 'drop-shadow(0 0 4px #C9A22760)' : 'none',
            }}
          />
        </div>

        {earned ? (
          <span
            className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
            style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}40` }}
          >
            <Check size={10} /> Earned
          </span>
        ) : (
          <Lock size={13} style={{ color: 'var(--fl-text-3)', opacity: 0.4 }} className="shrink-0 mt-1" />
        )}
      </div>

      <div>
        <p className="text-sm font-bold leading-tight" style={{ color: earned ? 'var(--fl-text)' : 'var(--fl-text-2)' }}>
          {badge.label}
        </p>
        <p className="text-[11px] mt-1 leading-snug" style={{ color: 'var(--fl-text-3)' }}>
          {badge.description}
        </p>
      </div>

      {progress && !earned && (
        <div>
          <div className="flex items-center justify-between text-[10px] mb-1" style={{ color: 'var(--fl-text-3)' }}>
            <span>Progress</span>
            <span className="font-semibold">{Math.min(progress.current, progress.target)} / {progress.target}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--fl-border)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full"
              style={{ background: accent, boxShadow: `0 0 6px ${accent}80` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default function BadgeGuideModal({ open, onClose, accent, earnedKeys, monthlyCP, eventsCount }) {
  const [query,      setQuery]      = useState('')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) { setQuery(''); setFilterType('all') }
  }, [open])

  const automatic    = useMemo(() => Object.values(BADGES).filter(b => b.automatic), [])
  const adminAwarded = useMemo(() => Object.values(BADGES).filter(b => b.adminOnly), [])

  function matches(b) {
    if (!query) return true
    const q = query.toLowerCase()
    return b.label.toLowerCase().includes(q) || b.description.toLowerCase().includes(q)
  }

  const showAutomatic = filterType !== 'admin'
  const showAdmin     = filterType !== 'automatic'
  const filteredAutomatic = showAutomatic ? automatic.filter(matches) : []
  const filteredAdmin     = showAdmin ? adminAwarded.filter(matches) : []
  const noResults = filteredAutomatic.length === 0 && filteredAdmin.length === 0

  const earnedCount = automatic.length + adminAwarded.length
    ? [...automatic, ...adminAwarded].filter(b => earnedKeys.has(b.key)).length
    : 0
  const totalCount = automatic.length + adminAwarded.length

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="relative w-full h-full sm:h-auto sm:max-h-[88vh] sm:max-w-3xl rounded-none sm:rounded-2xl overflow-hidden flex flex-col"
            style={{ background: 'var(--fl-bg)', border: '1px solid var(--fl-border)', boxShadow: 'var(--fl-shadow)' }}
          >
            {/* Header */}
            <div
              className="shrink-0 px-5 sm:px-7 pt-5 pb-4"
              style={{ borderBottom: '1px solid var(--fl-border)', background: 'var(--fl-card)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black" style={{ color: 'var(--fl-text)' }}>Badge Guide</h2>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--fl-text-3)' }}>
                    How to earn every badge · {earnedCount} / {totalCount} earned
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: 'var(--fl-card-alt)', color: 'var(--fl-text-2)' }}
                  aria-label="Close badge guide"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
                <div className="relative flex-1">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--fl-text-3)' }}
                  />
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search badges…"
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--fl-input-bg)', border: '1px solid var(--fl-border)', color: 'var(--fl-text)' }}
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  <FilterChip label="All"       active={filterType === 'all'}       onClick={() => setFilterType('all')} />
                  <FilterChip label="Automatic" active={filterType === 'automatic'} onClick={() => setFilterType('automatic')} />
                  <FilterChip label="Admin"     active={filterType === 'admin'}     onClick={() => setFilterType('admin')} />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-6 space-y-8">
              {noResults ? (
                <div className="text-center py-16">
                  <Search size={28} style={{ color: 'var(--fl-text-3)', opacity: 0.4 }} className="mx-auto mb-3" />
                  <p className="text-sm" style={{ color: 'var(--fl-text-3)' }}>No badges match "{query}"</p>
                </div>
              ) : (
                <>
                  {filteredAutomatic.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-3.5">
                        <Zap size={15} style={{ color: accent }} />
                        <h3 className="text-[13px] font-bold tracking-wide" style={{ color: 'var(--fl-text)' }}>
                          Earn Automatically
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <AnimatePresence mode="popLayout">
                          {filteredAutomatic.map((badge, i) => (
                            <BadgeCard
                              key={badge.key}
                              badge={badge}
                              earned={earnedKeys.has(badge.key)}
                              accent={accent}
                              progress={getProgress(badge.key, { monthlyCP, eventsCount })}
                              index={i}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </section>
                  )}

                  {filteredAdmin.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-3.5">
                        <ShieldCheck size={15} style={{ color: accent }} />
                        <h3 className="text-[13px] font-bold tracking-wide" style={{ color: 'var(--fl-text)' }}>
                          Awarded by Admin
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <AnimatePresence mode="popLayout">
                          {filteredAdmin.map((badge, i) => (
                            <BadgeCard
                              key={badge.key}
                              badge={badge}
                              earned={earnedKeys.has(badge.key)}
                              accent={accent}
                              progress={null}
                              index={i}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
