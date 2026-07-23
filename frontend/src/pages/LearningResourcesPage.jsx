import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ArrowRight, Clock, ExternalLink, GraduationCap, Loader2 } from 'lucide-react'
import { recommendLearningResources } from '../api/client.js'
import { PLATFORM_DISPLAY_ORDER, PLATFORM_META } from '../constants/learningPlatforms.js'

const DIFFICULTY_STYLES = {
  Beginner: 'border-emerald-300/70 bg-emerald-100 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300',
  Intermediate: 'border-amber-300/70 bg-amber-100 text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300',
  Advanced: 'border-red-300/70 bg-red-100 text-red-800 dark:border-red-800/40 dark:bg-red-950/40 dark:text-red-300',
}

function groupByPlatform(resources) {
  const groups = {}
  for (const resource of resources) {
    if (!groups[resource.platform]) groups[resource.platform] = []
    groups[resource.platform].push(resource)
  }
  return PLATFORM_DISPLAY_ORDER.filter((key) => groups[key]?.length).map((key) => ({
    platform: key,
    resources: groups[key],
  }))
}

export default function LearningResourcesPage({ result, targetRole, analysis }) {
  const [resources, setResources] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  const extraSkills = location.state?.extraSkills ?? []
  const grouped = useMemo(() => (resources ? groupByPlatform(resources) : []), [resources])

  async function handleGenerate() {
    if (isLoading) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await recommendLearningResources(result.extracted_text, targetRole, analysis, extraSkills)
      setResources(data.resources)
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
          Learning resources
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          A personalized learning path for {targetRole} across Udemy, Coursera, YouTube, and more, built from
          your resume's skill gaps
          {extraSkills.length > 0 ? ' and the gaps you just found' : ''} — every link is real, never a guessed
          course.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {!resources && (
          <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 text-center shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 text-brand-500 dark:text-brand-400">
              <GraduationCap className="h-7 w-7" strokeWidth={1.75} />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Turn your missing skills into a prioritized, multi-platform learning plan.
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
                  Building learning path…
                </>
              ) : (
                <>
                  Find Learning Resources
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

        {grouped.length > 0 && (
          <div className="flex flex-col gap-10">
            {grouped.map(({ platform, resources: platformResources }) => {
              const meta = PLATFORM_META[platform]
              const Icon = meta.icon
              return (
                <section key={platform}>
                  <div className="mb-4 flex items-center gap-2.5">
                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${meta.accent}`}>
                      <Icon className="h-5 w-5" strokeWidth={1.9} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {platformResources[0].platform_name}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {platformResources.map((resource, i) => (
                      <article
                        key={i}
                        className="flex flex-col rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80"
                      >
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                            {resource.skill}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${DIFFICULTY_STYLES[resource.difficulty]}`}
                          >
                            {resource.difficulty}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {resource.title}
                        </h3>

                        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                          {resource.why_recommended}
                        </p>

                        <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                          <span className="font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                            What to look for:{' '}
                          </span>
                          {resource.what_to_look_for}
                        </p>

                        {resource.estimated_duration && (
                          <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            <Clock className="h-3.5 w-3.5" />
                            {resource.estimated_duration}
                          </p>
                        )}

                        <a
                          href={resource.resource_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:text-brand-400"
                        >
                          Open Resource
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </article>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
