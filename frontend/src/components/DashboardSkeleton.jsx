function Block({ className = '' }) {
  return <div className={`rounded bg-slate-200 dark:bg-slate-700 ${className}`} />
}

function ScoreTileSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-white/90 p-5 shadow-xl backdrop-blur-xl animate-pulse dark:border-white/[0.08] dark:bg-slate-900/80">
      <div className="h-14 w-14 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700" />
      <div className="space-y-2">
        <Block className="h-3 w-20 opacity-60" />
        <Block className="h-4 w-12" />
      </div>
    </div>
  )
}

export default function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="animate-pulse space-y-2">
        <Block className="h-7 w-64" />
        <Block className="h-3 w-40 opacity-60" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <ScoreTileSkeleton key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <ScoreTileSkeleton key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="animate-pulse space-y-3 rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80"
          >
            <Block className="h-4 w-32" />
            <Block className="h-3 w-full opacity-60" />
            <Block className="h-3 w-4/5 opacity-60" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="animate-pulse space-y-3 rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80"
          >
            <Block className="h-4 w-32" />
            <Block className="h-3 w-full opacity-60" />
            <Block className="h-3 w-4/5 opacity-60" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="animate-pulse space-y-3 rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80"
          >
            <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
            <Block className="h-3 w-full opacity-60" />
            <Block className="h-9 w-full rounded-xl opacity-70" />
          </div>
        ))}
      </div>
    </div>
  )
}
