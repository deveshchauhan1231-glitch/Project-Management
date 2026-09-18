import type { Toast as ToastMessage } from './types'

export function Toast({ toast }: { toast: ToastMessage | null }) {
  return toast ? <div className={`toast ${toast.type}`}>{toast.message}</div> : null
}
