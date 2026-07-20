import { HelpCircle } from 'lucide-react'
import { CATEGORY_LABELS } from '../constants/interview.js'

export default function InterviewQuestionCard({ question, index, total }) {
  return (
    <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-300/70 bg-brand-100 px-3 py-1 text-xs font-bold text-brand-800 dark:border-brand-800/40 dark:bg-brand-950/40 dark:text-brand-300">
          {CATEGORY_LABELS[question.category] ?? question.category}
          {question.difficulty && ` · ${question.difficulty}`}
        </span>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Question {index + 1} of {total}
        </span>
      </div>

      <div className="flex items-start gap-3">
        <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
        <p className="text-base font-semibold leading-relaxed text-slate-900 dark:text-slate-100">
          {question.question}
        </p>
      </div>
    </section>
  )
}
