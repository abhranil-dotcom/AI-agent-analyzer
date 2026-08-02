import { CheckCircle2, ClipboardList, Lightbulb, ListChecks, Sparkles, Target } from 'lucide-react'
import { SectionHeader } from './ReportPrimitives.jsx'

function BulletList({ items, dotClass }) {
  if (!items?.length) return null
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
          <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} />
          {item}
        </li>
      ))}
    </ul>
  )
}

// End-of-session "AI Interview Review" — shown for ALL THREE modes (Text/Voice/Video), unlike
// InterviewPerformanceReport.jsx which is Voice/Video-only. `review` is the LLM-synthesized
// InterviewReview object (see backend/app/agent/interview_review_generator.py), grounded entirely
// in that session's real per-question evaluations and measured delivery/presentation metrics —
// this component just renders whatever fields the backend actually returned; it never invents
// content, and quietly renders nothing for a field that came back empty (e.g. a strong Text
// session may have no delivery/presentation content because none was ever measured for Text mode).
export default function AIInterviewReview({ review }) {
  if (!review) return null

  const hasStrengthsOrImprove = review.strengths?.length > 0 || review.areas_to_improve?.length > 0

  return (
    <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
      <div className="mb-6 flex items-center gap-2">
        <Sparkles className="h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">AI Interview Review</h2>
      </div>

      {review.overall_review && (
        <div className="mb-6">
          <SectionHeader icon={ClipboardList} title="Overall Review" />
          <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{review.overall_review}</p>
        </div>
      )}

      {hasStrengthsOrImprove && (
        <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {review.strengths?.length > 0 && (
            <div>
              <SectionHeader icon={CheckCircle2} title="Strengths" iconClass="text-emerald-600 dark:text-emerald-400" />
              <BulletList items={review.strengths} dotClass="bg-emerald-500/70" />
            </div>
          )}
          {review.areas_to_improve?.length > 0 && (
            <div>
              <SectionHeader icon={ListChecks} title="Areas to Improve" iconClass="text-amber-600 dark:text-amber-400" />
              <BulletList items={review.areas_to_improve} dotClass="bg-amber-500/70" />
            </div>
          )}
        </div>
      )}

      {review.actionable_suggestions?.length > 0 && (
        <div className="mb-6">
          <SectionHeader icon={Lightbulb} title="Actionable Suggestions" iconClass="text-brand-600 dark:text-brand-400" />
          <BulletList items={review.actionable_suggestions} dotClass="bg-brand-500/60" />
        </div>
      )}

      {review.focus_for_next_interview?.length > 0 && (
        <div className="rounded-xl border border-brand-200/60 bg-brand-50/60 p-5 dark:border-brand-800/40 dark:bg-brand-950/30">
          <SectionHeader icon={Target} title="Focus For Your Next Interview" iconClass="text-brand-600 dark:text-brand-400" />
          <ol className="mt-3 space-y-2">
            {review.focus_for_next_interview.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-[11px] font-black text-brand-700 dark:bg-brand-500/20 dark:text-brand-300">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}
