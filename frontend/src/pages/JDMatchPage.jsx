import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, Lightbulb, Loader2, XCircle } from 'lucide-react'
import ChipList from '../components/ChipList.jsx'
import ScoreRing, { COLOR_STYLES, getScoreTier } from '../components/ScoreRing.jsx'
import { matchResumeToJD } from '../api/client.js'

function SectionHeader({ icon: Icon, title, iconClass = 'text-slate-500 dark:text-slate-400' }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} />
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{title}</h3>
    </div>
  )
}

export default function JDMatchPage({ result, targetRole, analysis }) {
  const [jobDescription, setJobDescription] = useState('')
  const [match, setMatch] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const canGenerate = jobDescription.trim().length >= 50

  async function handleGenerate() {
    if (!canGenerate || isLoading) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await matchResumeToJD(result.extracted_text, targetRole, analysis, jobDescription)
      setMatch(data.match)
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

  const tier = match ? getScoreTier(match.jd_match_score) : null
  const s = tier ? COLOR_STYLES[tier.color] : null

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
          Resume vs job description
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Paste a job posting to see how well your resume matches its specific requirements — a different
          question than your general {targetRole} ATS score.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
          <label htmlFor="jd" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Job Description
          </label>
          <textarea
            id="jd"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            disabled={isLoading}
            rows={8}
            placeholder="Paste the full job posting text here…"
            className="mt-3 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-100"
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate || isLoading}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:opacity-90 hover:shadow-brand-500/40 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing match…
              </>
            ) : (
              <>
                Analyze Match
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </section>

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

        {match && (
          <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
            <div className={`mb-6 flex items-center gap-5 rounded-xl border px-5 py-4 ${s.wrap}`}>
              <ScoreRing score={match.jd_match_score} ringClass={s.ring} />
              <div>
                <p className={`text-xl font-bold ${s.label}`}>{tier.label}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Job Description Match Score</p>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <SectionHeader icon={CheckCircle2} title="Matching Keywords" iconClass="text-emerald-600 dark:text-emerald-400" />
                <ChipList
                  items={match.matching_keywords}
                  chipClass="border-emerald-300/70 bg-emerald-100 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300"
                />
              </div>
              <div>
                <SectionHeader icon={XCircle} title="Missing Keywords" iconClass="text-red-500 dark:text-red-400" />
                <ChipList items={match.missing_keywords} chipClass={s.badge} />
              </div>
            </div>

            <div>
              <SectionHeader icon={Lightbulb} title="Tailoring Suggestions" iconClass="text-brand-600 dark:text-brand-400" />
              <ol className="mt-3 space-y-3">
                {match.tailoring_suggestions.map((item, i) => (
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
        )}
      </div>
    </>
  )
}
