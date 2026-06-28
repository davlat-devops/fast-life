import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { CLANS } from '@/constants/clans'

// ── Clan image with fallback ───────────────────────────────────

function ClanImg({ clanId, size, style }) {
  const [err, setErr] = useState(false)
  if (err || !clanId) {
    return (
      <span
        aria-hidden
        style={{
          fontSize: (size ?? 40) * 0.6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          ...style,
        }}
      >
        {CLANS[clanId]?.emoji ?? '⚔️'}
      </span>
    )
  }
  return (
    <img
      src={`/clans/${clanId.toLowerCase()}.png`}
      alt=""
      width={size}
      height={size}
      style={{ objectFit: 'cover', ...style }}
      onError={() => setErr(true)}
    />
  )
}

function Skeleton({ className }) {
  return <div className={`rounded-lg animate-pulse ${className}`} style={{ background: 'var(--fl-skeleton)' }} />
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div
      className="flex-1 rounded-xl p-3.5 text-center"
      style={{
        background: 'var(--fl-card)',
        border:     '1px solid var(--fl-border)',
        boxShadow:  'var(--fl-shadow)',
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-widest mb-1"
        style={{ color: 'var(--fl-text-3)' }}
      >
        {label}
      </p>
      <p className="text-xl font-black" style={{ color: accent }}>{value}</p>
      {sub && <p className="text-[10px] mt-0.5" style={{ color: 'var(--fl-text-3)' }}>{sub}</p>}
    </div>
  )
}

export default function ClanPage() {
  const { studentRecord } = useAuth()
  const clanInfo = CLANS[studentRecord?.clan]
  const accent   = clanInfo?.colorAccent ?? '#CC0000'

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

  return (
    <div className="min-h-screen" style={{ background: 'var(--fl-bg)' }}>

      {/* ── Hero ─────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: clanInfo
            ? `linear-gradient(145deg, ${clanInfo.colorBg} 0%, ${clanInfo.colorBg}88 60%, transparent 100%)`
            : '#161616',
          minHeight: 200,
        }}
      >
        {/* Clan mascot image – large, right-aligned */}
        {clanInfo && (
          <div
            className="absolute right-0 top-0 bottom-0 pointer-events-none select-none overflow-hidden"
            style={{ width: '60%' }}
          >
            <ClanImg
              clanId={studentRecord?.clan}
              style={{
                position:   'absolute',
                right:      -10,
                top:        0,
                width:      '110%',
                height:     '100%',
                opacity:    0.35,
                objectFit:  'cover',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(90deg, ${clanInfo.colorBg} 0%, transparent 55%)`,
              }}
            />
          </div>
        )}

        <div className="relative z-10 px-5 pt-5 pb-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1"
              style={{ color: accent + 'cc' }}
            >
              Your Clan
            </p>
            <h1 className="text-3xl font-black text-white">{clanInfo?.name ?? '—'}</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
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

        {/* ── Clan standings (race bars) ───────────────────── */}
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
                      {/* Mascot thumbnail */}
                      <div
                        className="shrink-0 rounded-lg overflow-hidden"
                        style={{
                          width:  40,
                          height: 40,
                          background: info?.colorBg ?? '#222',
                          border: isMe ? `2px solid ${accent}` : '2px solid transparent',
                        }}
                      >
                        <ClanImg clanId={clan.id} size={40} style={{ width: 40, height: 40 }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span
                            className="text-xs font-bold"
                            style={{ color: isMe ? 'var(--fl-text)' : 'var(--fl-text-2)' }}
                          >
                            {info?.name}
                          </span>
                          {isMe && (
                            <span
                              className="text-[9px] font-black px-1.5 py-0.5 rounded"
                              style={{ background: `${accent}22`, color: accent }}
                            >
                              YOU
                            </span>
                          )}
                          {i === 0 && clan.total_cp > 0 && <span className="text-sm">👑</span>}
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
              const medal    = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.025 }}
                  className="flex items-center gap-3 px-5 py-3"
                  style={{
                    borderBottom: '1px solid var(--fl-border-2)',
                    background: isMe ? `${accent}0d` : 'transparent',
                  }}
                >
                  <span className="text-sm w-6 text-center shrink-0">
                    {medal ?? <span className="text-[11px] font-bold" style={{ color: 'var(--fl-text-3)' }}>{i + 1}</span>}
                  </span>

                  <div
                    className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[12px] font-bold text-white"
                    style={{ background: accent }}
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
