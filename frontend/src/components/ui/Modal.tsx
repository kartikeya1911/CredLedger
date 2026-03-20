import { AnimatePresence, motion } from 'framer-motion'
import type React from 'react'

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass relative w-full max-w-2xl rounded-2.5xl p-6"
            initial={{ scale: 0.98, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, y: 8 }}
            onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <button className="text-slate-400 hover:text-white" onClick={onClose}>
                ✕
              </button>
            </div>
            <div className="gradient-line mb-4" />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
