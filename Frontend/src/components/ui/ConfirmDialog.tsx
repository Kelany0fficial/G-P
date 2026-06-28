import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="sm" closeOnBackdrop>
      <div className="flex flex-col items-center gap-4 text-center">
        {danger && (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950">
            <AlertTriangle className="h-6 w-6 text-rose-600 dark:text-rose-400" />
          </div>
        )}
        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">{title}</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{message}</p>
        </div>
        <div className="flex w-full gap-2 pt-1">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className={danger ? 'flex-1 bg-rose-600 text-white hover:bg-rose-700' : 'flex-1'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
