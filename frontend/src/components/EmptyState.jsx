import { Link } from 'react-router-dom'

export default function EmptyState({ icon: Icon, title, description, ctaLabel, ctaTo }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-slate-200/60 bg-white/90 py-16 text-center shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80">
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 text-brand-500 dark:text-brand-400">
        <Icon className="h-8 w-8" strokeWidth={1.75} />
      </div>
      <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {ctaLabel && ctaTo && (
        <Link
          to={ctaTo}
          className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:opacity-90 hover:shadow-brand-500/40"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  )
}
