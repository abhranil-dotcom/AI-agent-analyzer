import { ArrowRight, Loader2 } from 'lucide-react'

// Extracted verbatim from the pre-mode-selection MockInterviewPage — Text mode's behavior and
// markup are unchanged, just parameterized so the parent orchestrator owns the `answer` state.
export default function TextAnswerInput({ answer, onAnswerChange, onSubmit, isSubmitting }) {
  return (
    <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
      <label htmlFor="answer" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        Your Answer
      </label>
      <textarea
        id="answer"
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
        disabled={isSubmitting}
        rows={6}
        placeholder="Type your answer here…"
        className="mt-3 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-100"
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={!answer.trim() || isSubmitting}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:opacity-90 hover:shadow-brand-500/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Evaluating…
          </>
        ) : (
          <>
            Submit Answer
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </section>
  )
}
