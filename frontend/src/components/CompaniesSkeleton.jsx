function Block({ className = '' }) {
  return <div className={`rounded bg-slate-200 dark:bg-slate-700 ${className}`} />
}

function CompanyCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl animate-pulse dark:border-white/[0.08] dark:bg-slate-900/80">
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-2">
          <Block className="h-4 w-32" />
          <Block className="h-5 w-20 rounded-full opacity-60" />
        </div>
      </div>
      <div className="space-y-2">
        <Block className="h-3 w-full opacity-60" />
        <Block className="h-3 w-4/5 opacity-60" />
      </div>
      <Block className="h-10 w-full rounded-xl opacity-70" />
    </div>
  )
}

export default function CompaniesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <CompanyCardSkeleton key={i} />
      ))}
    </div>
  )
}
