import React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type BlurModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  className?: string
  children: React.ReactNode
}

export default function BlurModal({ open, onClose, title, className, children }: BlurModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop with blur instead of dark overlay */}
      <div
        className="absolute inset-0 bg-white/30 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal panel */}
      <div className="relative z-50 flex min-h-full items-center justify-center p-4">
        <div className={cn(
          'w-full max-w-md rounded-xl border border-blue-200 bg-white shadow-2xl',
          'transform transition-all duration-200',
          className,
        )}>
          {title && (
            <div className="flex items-center justify-between border-b border-blue-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-blue-800">{title}</h3>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full w-8 h-8 flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          <div className="">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
