import { ArrowRight, Building2 } from 'lucide-react'
import ScoreRing, { COLOR_STYLES, getScoreTier } from './ScoreRing.jsx'

export default function CompanyRecommendationCard({ recommendation, onSelect }) {
  const { display_name: displayName, match_percentage: matchPercentage, reason } = recommendation
  const tier = getScoreTier(matchPercentage)
  const s = COLOR_STYLES[tier.color]

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80">
      <div className="flex items-start gap-4">
        <ScoreRing score={matchPercentage} ringClass={s.ring} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
            <h3 className="truncate text-base font-bold text-slate-900 dark:text-slate-100">{displayName}</h3>
          </div>
          <span className={`mt-1 inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${s.badge}`}>
            {matchPercentage}% Match
          </span>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{reason}</p>

      <button
        type="button"
        onClick={onSelect}
        className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:opacity-90 hover:shadow-brand-500/40"
      >
        Prepare for {displayName}
        <ArrowRight className="h-4 w-4" />
      </button>
    </section>
  )
}
