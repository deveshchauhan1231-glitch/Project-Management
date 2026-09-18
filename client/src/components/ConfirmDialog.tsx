import { useEffect } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import type { ConfirmDialogState } from './types'

type ConfirmDialogProps = {
  dialog: ConfirmDialogState | null
  onClose: () => void
}

export function ConfirmDialog({ dialog, onClose }: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dialog?.isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dialog, onClose])

  if (!dialog || !dialog.isOpen) return null

  return (
    <div className="dialog-overlay" onClick={onClose} role="presentation">
      <div
        className="dialog-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <button
          type="button"
          className="dialog-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <div className="dialog-header">
          <div className={`dialog-icon-wrapper ${dialog.isDestructive ? 'destructive' : ''}`}>
            {dialog.isDestructive ? (
              <Trash2 size={22} className="dialog-danger-icon" />
            ) : (
              <AlertTriangle size={22} className="dialog-warn-icon" />
            )}
          </div>
          <div>
            <h3 id="dialog-title" className="dialog-title">
              {dialog.title}
            </h3>
            <p className="dialog-description">{dialog.description}</p>
          </div>
        </div>

        <div className="dialog-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {dialog.cancelText || 'Cancel'}
          </button>
          <button
            type="button"
            className={`btn ${dialog.isDestructive ? 'btn-danger' : 'btn-primary'}`}
            onClick={async () => {
              await dialog.onConfirm()
              onClose()
            }}
          >
            {dialog.confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
