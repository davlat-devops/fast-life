import { motion } from 'framer-motion'
import Logo from './Logo'

export default function FullPageLoader() {
  return (
    <div className="fixed inset-0 bg-brand-dark flex items-center justify-center z-50">
      <motion.div
        animate={{ opacity: [0.35, 1, 0.35] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Logo size={52} color="white" />
      </motion.div>
    </div>
  )
}
