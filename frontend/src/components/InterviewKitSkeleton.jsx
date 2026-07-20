function Block({ className = '' }) {
  return <div className={`rounded bg-slate-200 dark:bg-slate-700 ${className}`} />
}

export default function InterviewKitSkeleton() {
  return (
    <section className="animate-pulse rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
      <div className="mb-6 space-y-2">
        <Block className="h-5 w-56" />
        <Block className="h-3 w-72 opacity-60" />
      </div>

      <div className="mb-6 space-y-2">
        <Block className="h-3 w-32" />
        <Block className="h-3 w-full opacity-60" />
        <Block className="h-3 w-5/6 opacity-60" />
      </div>

      <div className="mb-6 space-y-2">
        <Block className="h-3 w-40" />
        <Block className="h-3 w-full opacity-60" />
        <Block className="h-3 w-3/4 opacity-60" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2 rounded-xl border border-slate-200/50 p-4 dark:border-slate-700/30">
            <Block className="h-3 w-24" />
            <Block className="h-3 w-full opacity-60" />
            <Block className="h-3 w-4/5 opacity-60" />
            <Block className="h-3 w-3/5 opacity-60" />
          </div>
        ))}
      </div>
    </section>
  )
}
