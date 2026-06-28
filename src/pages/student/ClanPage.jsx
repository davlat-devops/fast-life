import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { CLANS } from '@/constants/clans'

function Skeleton({ className }) {
  return <div className={`rounded-lg bg-white/[0.07] animate-pulse ${className}`} />
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="flex-1 rounded-xl p-3.5 text-center"
         style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 mb-1">{label}</p>
      <p className="text-xl font-black" style={{ color: accent }}>{value}</p>
      {sub && <p className="text-[10px] text-white/25 mt-0.5">{sub}</p>}
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

  const clanRank    = clans.findIndex(c => c.id === studentRecord?.clan) + 1
  const myRank      = members.findIndex(m => m.id === studentRecord?.id) + 1
  const myClanData  = clans.find(c => c.id === studentRecord?.clan)
  const maxCp       = Math.max(clans[0]?.total_cp ?? 0, 1)

  return (
    <div className="min-h-screen bg-brand-dark">

      {/* ── Hero ─────────────────────────────────────────── */}
      <div
        className="relative px-5 pt-12 pb-8 overflow-hidden"
        style={{
          background: clanInfo
            ? `linear-gradient(160deg, ${clanInfo.colorBg}cc 0%, ${clanInfo.colorBg}40 60%, transparent 100%)`
            : 'transparent',
        }}
      >
        {clanInfo && (
          <div
            className="absolute top-0 right-0 pointer-events-none select-none"
            style={{ fontSize: 140, lineHeight: 1, opacity: 0.08, transform: 'translate(15%, -10%)' }}
            aria-hidden
          >
            {clanInfo.emoji}
          </div>
        )}
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-5xl mb-3">{clanInfo?.emoji ?? '⚔️'}</div>
            <h1 className="text-3xl font-black text-white">{clanInfo?.name ?? '—'}</h1>
            <p className="text-sm mt-1" style={{ color: accent }}>
              {loading
                ? '…'
                : `${members.length} members · ${(myClanData?.total_cp ?? 0).toLocaleString()} total CP`}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="px-5 pb-6 space-y-4">

        {/* ── Stat chips ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="flex gap-3"
        >
          <StatCard label="Clan CP"   value={loading ? '…' : (myClanData?.total_cp ?? 0).toLocaleString()} accent={accent} />
          <StatCard label="Clan Rank" value={loading ? '…' : clanRank ? `#${clanRank}` : '?'} sub="of 4 clans" accent={accent} />
          <StatCard label="My Rank"   value={loading ? '…' : myRank   ? `#${myRank}`   : '?'} sub={`of ${members.length}`} accent={accent} />
        </motion.div>

        {/* ── Clan standings ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl p-5"
          style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <h2 className="text-sm font-bold text-white mb-4">Clan Standings</h2>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {clans.map((clan, i) => {
                const info  = CLANS[clan.id]
                const isMe  = clan.id === studentRecord?.clan
                const pct   = (clan.total_cp / maxCp) * 100
                return (
                  <div key={clan.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{info?.emoji}</span>
                        <span className={`text-xs font-bold ${isMe ? 'text-white' : 'text-white/50'}`}>
                          {info?.name}
                        </span>
                        {isMe && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded"
                                style={{ background: `${accent}22`, color: accent }}>
                            YOU
                          </span>
                        )}
                        {i === 0 && clan.total_cp > 0 && <span className="text-sm">👑</span>}
                      </div>
                      <span className="text-xs font-bold text-white/50">
                        {clan.total_cp.toLocaleString()} CP
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(pct, clan.total_cp > 0 ? 2 : 0)}%` }}
                        transition={{ delay: 0.3 + i * 0.07, duration: 0.9, type: 'spring', stiffness: 60, damping: 18 }}
                        className="h-full rounded-full"
                        style={{ background: info?.colorAccent ?? '#555' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* ── Members ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="px-5 py-4 border-b border-white/[0.05]">
            <h2 className="text-sm font-bold text-white">Members</h2>
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
            <p className="text-center py-10 text-sm text-white/25">No members found</p>
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
                  className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.04] last:border-0"
                  style={isMe ? { background: `${accent}0d` } : {}}
                >
                  <span className="text-sm w-6 text-center shrink-0">
                    {medal ?? <span className="text-[11px] font-bold text-white/20">{i + 1}</span>}
                  </span>

                  <div
                    className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
                    style={{ background: accent }}
                  >
                    {initials}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isMe ? 'text-white' : 'text-white/70'}`}>
                      {member.full_name}
                      {isMe && (
                        <span className="ml-1.5 text-[10px]" style={{ color: accent }}>(you)</span>
                      )}
                    </p>
                    <p className="text-[10px] text-white/25">{member.level}</p>
                  </div>

                  <span
                    className="text-sm font-black shrink-0"
                    style={{ color: isMe ? accent : 'rgba(255,255,255,0.45)' }}
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
