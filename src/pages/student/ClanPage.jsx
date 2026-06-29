import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Crown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { CLANS } from '@/constants/clans'
import { ClanIcon } from '@/components/ui/ClanIcons'

function Skeleton({ className }) {
  return <div className={`rounded-lg animate-pulse ${className}`} style={{ background: 'var(--fl-skeleton)' }} />
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div
      className="flex-1 rounded-xl p-3.5 text-center"
      style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${accent}28`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-widest mb-1"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        {label}
      </p>
      <p className="text-xl font-black" style={{ color: accent }}>{value}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>{sub}</p>}
    </div>
  )
}


export default function ClanPage() {
  const { studentRecord } = useAuth()
  const clanInfo = CLANS[studentRecord?.clan]
  const accent   = clanInfo?.colorAccent ?? '#CC0000'
  const colorBg  = clanInfo?.colorBg ?? '#0a0a0a'

  const [clans,   setClans]   = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!studentRecord) return
    Promise.all([
      supabase.from('clans').select('*').order('total_cp', { ascending: false }),
      supabase.from('students')
        .select('id, full_name, username, cp, level')
        .eq('clan', studentRecord.clan)
        .eq('is_active', true)
        .order('cp', { ascending: false }),
    ]).then(([clansRes, membersRes]) => {
      setClans(clansRes.data ?? [])
      setMembers(membersRes.data ?? [])
      setLoading(false)
    })
  }, [studentRecord?.id])

  const clanRank   = clans.findIndex(c => c.id === studentRecord?.clan) + 1
  const myRank     = members.findIndex(m => m.id === studentRecord?.id) + 1
  const myClanData = clans.find(c => c.id === studentRecord?.clan)
  const maxCp      = Math.max(clans[0]?.total_cp ?? 0, 1)

  const rankColors = ['#C9A227', '#9CA3AF', '#92613A']

  return (
    <div className="min-h-screen" style={{ background: 'var(--fl-bg)' }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ minHeight: 220, background: colorBg }}
      >
        {/* Animated gradient orbs */}
        <motion.div
          animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.55, 0.35] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: '-40%', left: '-20%',
            width: '70%', height: '180%', borderRadius: '50%',
            background: `radial-gradient(circle, ${accent}40, transparent 65%)`,
            pointerEvents: 'none',
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          style={{
            position: 'absolute', bottom: '-50%', right: '-10%',
            width: '60%', height: '160%', borderRadius: '50%',
            background: `radial-gradient(circle, ${accent}28, transparent 60%)`,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, transparent 55%, var(--fl-bg) 100%)',
          }}
        />

        <div className="relative z-10 px-5 pt-6 pb-7">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.22em] mb-2"
              style={{ color: `${accent}bb` }}
            >
              Your Clan
            </p>
            <h1
              className="text-4xl font-black text-white"
              style={{ textShadow: `0 0 40px ${accent}55, 0 2px 12px rgba(0,0,0,0.7)` }}
            >
              {clanInfo?.name ?? '—'}
            </h1>
            <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.42)' }}>
              {loading
                ? '…'
                : `${members.length} members · ${(myClanData?.total_cp ?? 0).toLocaleString()} total CP`}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="px-5 pt-4 pb-6 space-y-4">

        {/* ── Stat chips ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.08, duration: 0.3 }}
          className="flex gap-3"
        >
          <StatCard
            label="Clan CP"
            value={loading ? '…' : (myClanData?.total_cp ?? 0).toLocaleString()}
            accent={accent}
          />
          <StatCard
            label="Clan Rank"
            value={loading ? '…' : clanRank ? `#${clanRank}` : '?'}
            sub="of 4 clans"
            accent={accent}
          />
          <StatCard
            label="My Rank"
            value={loading ? '…' : myRank ? `#${myRank}` : '?'}
            sub={`of ${members.length}`}
            accent={accent}
          />
        </motion.div>

        {/* ── Clan standings ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.3 }}
          className="rounded-2xl p-5"
          style={{
            background: 'var(--fl-card)',
            border:     '1px solid var(--fl-border)',
            boxShadow:  'var(--fl-shadow)',
          }}
        >
          <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--fl-text)' }}>Clan Standings</h2>

          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {clans.map((clan, i) => {
                const info = CLANS[clan.id]
                const isMe = clan.id === studentRecord?.clan
                const pct  = (clan.total_cp / maxCp) * 100

                return (
                  <div key={clan.id}>
                    <div className="flex items-center gap-3 mb-2">
                      <ClanIcon
                        clanId={clan.id}
                        size={40}
                        style={isMe ? { border: `2px solid ${accent}`, boxShadow: `0 0 14px ${accent}50` } : undefined}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span
                            className="text-xs font-bold"
                            style={{ color: isMe ? 'var(--fl-text)' : 'var(--fl-text-2)' }}
                          >
                            #{i + 1} {info?.name}
                          </span>
                          {isMe && (
                            <span
                              className="text-[9px] font-black px-1.5 py-0.5 rounded"
                              style={{ background: `${accent}22`, color: accent }}
                            >
                              YOU
                            </span>
                          )}
                          {i === 0 && clan.total_cp > 0 && (
                            <Crown size={11} style={{ color: '#C9A227' }} />
                          )}
                          <span
                            className="ml-auto text-xs font-bold tabular-nums"
                            style={{ color: 'var(--fl-text-2)' }}
                          >
                            {clan.total_cp.toLocaleString()} CP
                          </span>
                        </div>

                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--fl-card-alt)' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(pct, clan.total_cp > 0 ? 2 : 0)}%` }}
                            transition={{ delay: 0.3 + i * 0.1, duration: 0.9, type: 'spring', stiffness: 80, damping: 20 }}
                            className="h-full rounded-full"
                            style={{ background: info?.colorAccent ?? '#555' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* ── Members list ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'var(--fl-card)',
            border:     '1px solid var(--fl-border)',
            boxShadow:  'var(--fl-shadow)',
          }}
        >
          <div
            className="px-5 py-3.5"
            style={{ borderBottom: '1px solid var(--fl-border)' }}
          >
            <h2 className="text-sm font-bold" style={{ color: 'var(--fl-text)' }}>
              Members
              <span className="ml-1.5 text-[11px] font-normal" style={{ color: 'var(--fl-text-3)' }}>
                {members.length}
              </span>
            </h2>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <Skeleton className="flex-1 h-4" />
                  <Skeleton className="w-14 h-4 shrink-0" />
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: 'var(--fl-text-3)' }}>No members found</p>
          ) : (
            members.map((member, i) => {
              const isMe     = member.id === studentRecord?.id
              const initials = member.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.025 }}
                  className="flex items-center gap-3 px-5 py-3"
                  style={{
                    borderBottom: '1px solid var(--fl-border-2)',
                    background:   isMe ? `${accent}0d` : 'transparent',
                  }}
                >
                  <span
                    className="text-[11px] font-black w-6 text-center shrink-0 tabular-nums"
                    style={{ color: i < 3 ? rankColors[i] : 'var(--fl-text-3)' }}
                  >
                    {i + 1}
                  </span>

                  <div
                    className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[12px] font-bold text-white"
                    style={{
                      background: accent,
                      boxShadow:  isMe ? `0 0 0 2px ${accent}50` : 'none',
                    }}
                  >
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: isMe ? 'var(--fl-text)' : 'var(--fl-text-2)' }}
                    >
                      {member.full_name}
                      {isMe && (
                        <span className="ml-1.5 text-[10px]" style={{ color: accent }}>(you)</span>
                      )}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--fl-text-3)' }}>{member.level}</p>
                  </div>

                  <span
                    className="text-sm font-black shrink-0 tabular-nums"
                    style={{ color: isMe ? accent : 'var(--fl-text-2)' }}
                  >
                    {member.cp.toLocaleString()}
                  </span>
                </motion.div>
              )
            })
          )}
        </motion.div>

      </div>
    </div>
  )
}
