import { Lightbulb, ListX, MessageSquareText, Sparkles } from 'lucide-react'
import ScoreRing, { COLOR_STYLES, getScoreTier } from './ScoreRing.jsx'

function SectionHeader({ icon: Icon, title, iconClass = 'text-slate-500 dark:text-slate-400' }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} />
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{title}</h3>
    </div>
  )
}

export default function AnswerEvaluationPanel({ evaluation }) {
  const tier = getScoreTier(evaluation.score)
  const s = COLOR_STYLES[tier.color]

  return (
    <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
      <div className={`mb-6 flex items-center gap-5 rounded-xl border px-5 py-4 ${s.wrap}`}>
        <ScoreRing score={evaluation.score} ringClass={s.ring} />
        <div>
          <p className={`text-xl font-bold ${s.label}`}>{tier.label}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Answer Score</p>
        </div>
      </div>

      <div className="mb-6">
        <SectionHeader icon={MessageSquareText} title="Feedback" />
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{evaluation.feedback}</p>
      </div>

      {evaluation.missing_points?.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200/50 bg-amber-500/[0.04] p-4 dark:border-amber-800/30 dark:bg-amber-950/20">
          <SectionHeader icon={ListX} title="Missing Points" iconClass="text-amber-600 dark:text-amber-400" />
          <ul className="mt-3 space-y-2">
            {evaluation.missing_points.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/70" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6">
        <SectionHeader icon={Sparkles} title="Ideal Answer" />
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{evaluation.ideal_answer}</p>
      </div>

      <div>
        <SectionHeader icon={Lightbulb} title="Suggestions for Improvement" iconClass="text-brand-600 dark:text-brand-400" />
        <ol className="mt-3 space-y-3">
          {evaluation.improvement_suggestions.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-[11px] font-black text-brand-600 dark:text-brand-400">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
