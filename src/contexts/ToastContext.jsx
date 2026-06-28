import { createContext, useCallback, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const ToastContext = createContext(null)

const ICONS = {
  success: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  error: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
    </svg>
  ),
  info: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
    </svg>
  ),
}

const STYLES = {
  success: 'bg-emerald-950/90 border-emerald-700/40 text-emerald-300',
  error:   'bg-red-950/90 border-red-700/40 text-red-300',
  info:    'bg-surface-2 border-white/10 text-white/80',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback(({ message, type = 'info', duration = 3500 }) => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const dismiss = useCallback(id =>
    setToasts(prev => prev.filter(t => t.id !== id)), [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast stack — top-right, slides in from the right */}
      <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence initial={false}>
          {toasts.map(t => (
            <motion.button
              key={t.id}
              onClick={() => dismiss(t.id)}
              initial={{ opacity: 0, x: 60, scale: 0.92 }}
              animate={{ opacity: 1, x: 0,  scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className={`
                pointer-events-auto flex items-center gap-2.5
                px-4 py-2.5 rounded-xl text-sm font-medium
                border shadow-2xl text-left
                ${STYLES[t.type] ?? STYLES.info}
              `}
            >
              <span className="shrink-0">{ICONS[t.type]}</span>
              <span className="max-w-[260px] leading-snug">{t.message}</span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}
