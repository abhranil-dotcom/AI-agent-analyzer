import { CheckCircle2, X, XCircle } from 'lucide-react'

const TYPE_STYLES = {
  success: {
    wrap: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/80 dark:text-emerald-300',
    icon: CheckCircle2,
  },
  error: {
    wrap: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/80 dark:text-red-400',
    icon: XCircle,
  },
}

export default function Toast({ message, type = 'success', onDismiss }) {
  const s = TYPE_STYLES[type] ?? TYPE_STYLES.success
  const Icon = s.icon

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-xl ${s.wrap}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="flex-1">{message}</span>
      <button type="button" onClick={onDismiss} className="shrink-0 opacity-60 transition-opacity hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
