import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ArrowRight, BookMarked, BookOpen, GraduationCap, Loader2, Search } from 'lucide-react'
import { analyzeSkillGap } from '../api/client.js'

const PRIORITY_STYLES = {
  High: 'border-red-300/70 bg-red-100 text-red-800 dark:border-red-800/40 dark:bg-red-950/40 dark:text-red-300',
  Medium: 'border-amber-300/70 bg-amber-100 text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300',
  Low: 'border-slate-300/70 bg-slate-100 text-slate-700 dark:border-slate-700/40 dark:bg-slate-800/60 dark:text-slate-300',
}

export default function SkillGapPage({ result, targetRole, analysis }) {
  const [skillGap, setSkillGap] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function handleGenerate() {
    if (isLoading) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await analyzeSkillGap(result.extracted_text, targetRole, analysis)
      setSkillGap(data.skill_gap)
    } catch (err) {
      let message
      if (err.response?.data?.detail) {
        message = err.response.data.detail
      } else if (!err.response && err.request) {
        message =
          'Could not reach the server. Open the browser console (F12) and look for the [API] log to see the exact error.'
      } else {
        message = 'Something went wrong. Please try again.'
      }
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => navigate('/toolkit')}
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to toolkit
      </button>

      <div className="mb-12 text-center">
        <h1 className="pb-1 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent dark:from-white dark:via-slate-200 dark:to-slate-500">
          Skill gap &amp; learning path
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          A prioritized plan for closing your gaps toward {targetRole}. Resources are named generically or as
          search terms — never a guessed link.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {!skillGap && (
          <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 text-center shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 text-brand-500 dark:text-brand-400">
              <GraduationCap className="h-7 w-7" strokeWidth={1.75} />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Turn your missing skills into a prioritized, role-specific learning plan.
            </p>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isLoading}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:opacity-90 hover:shadow-brand-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating plan…
                </>
              ) : (
                <>
                  Generate Learning Plan
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </section>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={handleGenerate}
              className="shrink-0 font-semibold underline decoration-red-300 underline-offset-2 hover:decoration-red-500"
            >
              Try again
            </button>
          </div>
        )}

        {skillGap && (
          <>
            <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{skillGap.overall_notes}</p>
            </section>

            <button
              type="button"
              onClick={() =>
                navigate('/toolkit/learning-resources', {
                  state: { extraSkills: skillGap.learning_path.map((entry) => entry.skill) },
                })
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/60 bg-white/60 px-6 py-3.5 text-sm font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-white/[0.08] dark:bg-slate-900/40 dark:text-slate-300 dark:hover:text-brand-400 sm:w-auto"
            >
              <BookMarked className="h-4 w-4" />
              Find Courses for These Gaps
            </button>

            <div className="flex flex-col gap-4">
              {skillGap.learning_path.map((entry, i) => (
                <section
                  key={i}
                  className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{entry.skill}</h3>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${PRIORITY_STYLES[entry.priority]}`}>
                      {entry.priority} Priority
                    </span>
                  </div>

                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{entry.why_it_matters}</p>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          Suggested Resources
                        </h4>
                      </div>
                      <ul className="mt-2 space-y-1.5">
                        {entry.suggested_resources.map((resource, j) => (
                          <li key={j} className="text-sm text-slate-700 dark:text-slate-300">
                            {resource}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Search className="h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                          Search Terms
                        </h4>
                      </div>
                      <ul className="mt-2 space-y-1.5">
                        {entry.search_terms.map((term, j) => (
                          <li key={j} className="text-sm text-slate-700 dark:text-slate-300">
                            {term}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
