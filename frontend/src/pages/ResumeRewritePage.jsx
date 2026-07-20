import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ArrowRight, ListChecks, Loader2, Sparkles, Wand2 } from 'lucide-react'
import CopyToClipboardButton from '../components/CopyToClipboardButton.jsx'
import { rewriteResume } from '../api/client.js'

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{title}</h3>
    </div>
  )
}

export default function ResumeRewritePage({ result, targetRole, analysis }) {
  const [rewrite, setRewrite] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function handleGenerate() {
    if (isLoading) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await rewriteResume(result.extracted_text, targetRole, analysis)
      setRewrite(data.rewrite)
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
          Resume rewrite
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Stronger, rewritten content for {targetRole} — grounded in what's actually in your resume, never
          invented experience.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {!rewrite && (
          <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 text-center shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 text-brand-500 dark:text-brand-400">
              <Wand2 className="h-7 w-7" strokeWidth={1.75} />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Rewrite your professional summary, strengthen your weakest bullet points, and clean up your
              skills section.
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
                  Generating rewrite…
                </>
              ) : (
                <>
                  Generate Rewrite
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

        {rewrite && (
          <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
            <div className="mb-6">
              <div className="flex items-center justify-between gap-3">
                <SectionHeader icon={Sparkles} title="Improved Summary" />
                <CopyToClipboardButton getText={() => rewrite.improved_summary} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {rewrite.improved_summary}
              </p>
            </div>

            <div className="mb-6">
              <SectionHeader icon={Wand2} title="Bullet Rewrites" />
              <div className="mt-3 space-y-4">
                {rewrite.bullet_rewrites.map((b, i) => (
                  <div key={i} className="rounded-xl border border-slate-200/50 p-4 dark:border-slate-700/30">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Original</p>
                        <p className="text-sm text-slate-500 line-through decoration-slate-300 dark:text-slate-400 dark:decoration-slate-600">
                          {b.original}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-widest text-brand-500 dark:text-brand-400">Improved</p>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{b.improved}</p>
                      </div>
                      <CopyToClipboardButton getText={() => b.improved} />
                    </div>
                    <p className="mt-3 text-xs italic text-slate-500 dark:text-slate-400">{b.rationale}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <SectionHeader icon={ListChecks} title="Skills Section" />
                <CopyToClipboardButton getText={() => rewrite.skills_section_rewrite.join('\n')} />
              </div>
              <ul className="mt-3 space-y-2">
                {rewrite.skills_section_rewrite.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500/60" />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
