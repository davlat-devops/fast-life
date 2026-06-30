import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Key, PartyPopper } from 'lucide-react'
import { CLANS } from '@/constants/clans'
import { ClanIcon } from '@/components/ui/ClanIcons'

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-md transition-colors"
      style={{
        background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.07)',
        color: copied ? '#6ee7b7' : 'rgba(255,255,255,0.5)',
      }}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function CredRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-white/30 mb-0.5">{label}</p>
        <p className="text-sm font-mono text-white font-semibold truncate">{value}</p>
      </div>
      <CopyButton value={value} />
    </div>
  )
}

export default function CredentialsModal({ credentials, studentName, onClose, mode = 'created' }) {
  if (!credentials) return null
  const { username, password, clan } = credentials
  const clanInfo = CLANS[clan]
  const isReset  = mode === 'reset'

  function copyAll() {
    navigator.clipboard.writeText(
      `Fast Life Login\nUsername: ${username}\nPassword: ${password}`
    )
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className="relative w-full max-w-sm rounded-2xl overflow-hidden"
          style={{ background: 'var(--ad-surface-solid)', border: '1px solid var(--ad-border)' }}
        >
          {/* Clan colour header stripe */}
          <div
            className="h-1.5 w-full"
            style={{ background: clanInfo?.colorAccent ?? '#CC0000' }}
          />

          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="text-center space-y-1">
              <div className="flex justify-center">
                {isReset
                  ? <Key size={28} className="text-white/60" />
                  : clan
                    ? <ClanIcon clanId={clan} size={40} />
                    : <PartyPopper size={28} className="text-white/60" />
                }
              </div>
              <h2 className="text-lg font-bold text-white">
                {isReset ? 'Password Reset' : 'Student Created!'}
              </h2>
              <p className="text-sm text-white/50">
                {isReset ? (
                  <>New password generated for{' '}
                    <span className="font-medium text-white/70">{studentName}</span>
                  </>
                ) : (
                  <><span className="font-medium text-white/70">{studentName}</span> has been assigned to{' '}
                    <span className="font-semibold" style={{ color: clanInfo?.colorAccent }}>
                      {clanInfo?.name ?? clan}
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-950/40 border border-amber-800/30">
              <svg className="shrink-0 text-amber-400 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
              </svg>
              <p className="text-xs text-amber-300/80 leading-relaxed">
                Share these credentials with the student. The password is shown <strong>once only</strong> — save it now.
              </p>
            </div>

            {/* Credentials */}
            <div className="space-y-2">
              <CredRow label="Username" value={username} />
              <CredRow label="Temporary Password" value={password} />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={copyAll}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/70 border border-white/10 hover:bg-white/5 transition-colors"
              >
                Copy Both
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
                style={{ background: '#CC0000' }}
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
