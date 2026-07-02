function Block({ className = '' }) {
  return <div className={`rounded bg-slate-200 dark:bg-slate-700 ${className}`} />
}

export default function AnalysisSkeleton() {
  return (
    <section className="animate-pulse rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
      <div className="mb-6 space-y-2">
        <Block className="h-5 w-48" />
        <Block className="h-3 w-64 opacity-60" />
      </div>

      <div className="mb-6 flex items-center gap-5 rounded-xl border border-slate-200/50 bg-slate-100/50 px-5 py-4 dark:border-slate-700/40 dark:bg-slate-800/30">
        <div className="h-[72px] w-[72px] shrink-0 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-2">
          <Block className="h-5 w-28" />
          <Block className="h-3 w-40 opacity-60" />
        </div>
      </div>

      <div className="mb-6 space-y-2">
        <Block className="h-3 w-32" />
        <Block className="h-3 w-full opacity-60" />
        <Block className="h-3 w-5/6 opacity-60" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-3">
            <Block className="h-3 w-24" />
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2].map((j) => (
                <Block key={j} className="h-6 w-16 rounded-full opacity-60" />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-2 rounded-xl border border-slate-200/50 p-4 dark:border-slate-700/30">
            <Block className="h-3 w-20" />
            <Block className="h-3 w-full opacity-60" />
            <Block className="h-3 w-4/5 opacity-60" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Block className="h-3 w-40" />
        {[0, 1, 2].map((i) => (
          <Block key={i} className="h-3 w-full opacity-60" />
        ))}
      </div>
    </section>
  )
}
