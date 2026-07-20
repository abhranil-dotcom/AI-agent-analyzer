import { ArrowRight } from 'lucide-react'

export default function ToolkitCard({ icon: Icon, title, description, hint, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-start gap-3 rounded-2xl border border-slate-200/60 bg-white/90 p-6 text-left shadow-xl backdrop-blur-xl transition-all hover:border-brand-300 hover:shadow-brand-500/10 dark:border-white/[0.08] dark:bg-slate-900/80 dark:hover:border-brand-700"
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 text-brand-600 transition-transform duration-300 group-hover:scale-110 dark:text-brand-400">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>

      <div className="flex-1">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{description}</p>
        {hint && (
          <p className="mt-2 text-xs font-semibold text-brand-600 dark:text-brand-400">{hint}</p>
        )}
      </div>

      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 dark:text-brand-400">
        Open
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  )
}
