function Block({ className = '' }) {
  return <div className={`rounded bg-slate-200 dark:bg-slate-700 ${className}`} />
}

function HistoryCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-white/90 p-5 shadow-xl backdrop-blur-xl animate-pulse dark:border-white/[0.08] dark:bg-slate-900/80">
      <div className="h-12 w-12 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700" />
      <div className="flex-1 space-y-2">
        <Block className="h-4 w-40" />
        <Block className="h-3 w-28 opacity-60" />
      </div>
      <Block className="h-9 w-20 shrink-0 rounded-xl opacity-70" />
    </div>
  )
}

export default function HistorySkeleton({ count = 4 }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }, (_, i) => (
        <HistoryCardSkeleton key={i} />
      ))}
    </div>
  )
}
