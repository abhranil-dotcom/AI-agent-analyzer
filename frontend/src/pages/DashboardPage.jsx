import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Award,
  FileText,
  Lightbulb,
  MessagesSquare,
  Mic,
  Minus,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Upload,
} from 'lucide-react'
import { fetchDashboardSummary } from '../api/client.js'
import ScoreRing, { COLOR_STYLES, getScoreTier } from '../components/ScoreRing.jsx'
import CompanyRecommendationCard from '../components/CompanyRecommendationCard.jsx'
import DashboardSkeleton from '../components/DashboardSkeleton.jsx'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function ScoreTile({ label, score, icon: Icon }) {
  const tier = score != null ? getScoreTier(score) : null
  const ringClass = tier ? COLOR_STYLES[tier.color].ring : ''

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-white/90 p-5 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80">
      {score != null ? (
        <ScoreRing score={score} ringClass={ringClass} size={56} />
      ) : (
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600">
          <Icon className="h-6 w-6" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase leading-snug tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
        {score == null && <p className="mt-1 text-sm font-semibold text-slate-400 dark:text-slate-500">No data yet</p>}
      </div>
    </div>
  )
}

function StatTile({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-white/90 p-5 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80">
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase leading-snug tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-xl font-black text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  )
}

function ProgressTrail({ points }) {
  if (points.length === 0) {
    return <p className="text-sm text-slate-400 dark:text-slate-500">Not enough data yet.</p>
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {points.map((point, i) => (
        <div key={point.date} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1 rounded-xl border border-slate-200/60 bg-slate-50 px-3 py-2 dark:border-slate-700/40 dark:bg-slate-800/40">
            <span className="text-base font-black text-slate-900 dark:text-slate-100">{point.score}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
          {i < points.length - 1 &&
            (points[i + 1].score > point.score ? (
              <TrendingUp className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : points[i + 1].score < point.score ? (
              <TrendingDown className="h-4 w-4 shrink-0 text-red-500" />
            ) : (
              <Minus className="h-4 w-4 shrink-0 text-slate-400" />
            ))}
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    fetchDashboardSummary()
      .then((data) => {
        if (!cancelled) setSummary(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.detail ?? 'Could not load your dashboard. Please try again.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [retryCount])

  if (isLoading) return <DashboardSkeleton />

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="flex-1">{error}</span>
        <button
          type="button"
          onClick={() => setRetryCount((c) => c + 1)}
          className="shrink-0 font-semibold underline decoration-red-300 underline-offset-2 hover:decoration-red-500"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">Welcome Back!</p>
        <h1 className="pb-1 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent dark:from-white dark:via-slate-200 dark:to-slate-500">
          {getGreeting()} 👋
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {summary.preferred_role ? `Targeting ${summary.preferred_role} roles.` : 'Upload a resume to get started.'}
        </p>
      </div>

      {/* Career overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ScoreTile label="Latest ATS Score" score={summary.latest_ats_score} icon={FileText} />
        <ScoreTile label="Latest JD Match" score={summary.latest_jd_match_score} icon={Target} />
        <ScoreTile label="Latest Interview Score" score={summary.latest_interview_score} icon={Mic} />
        <ScoreTile label="Overall Career Score" score={summary.overall_career_score} icon={Award} />
      </div>

      {/* Dashboard analytics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total Resumes" value={summary.total_resumes} icon={FileText} />
        <StatTile label="Total Interviews" value={summary.total_interviews} icon={MessagesSquare} />
        <StatTile label="Average ATS Score" value={summary.average_ats_score ?? '—'} icon={Target} />
        <StatTile label="Average Interview Score" value={summary.average_interview_score ?? '—'} icon={Mic} />
      </div>

      {/* Resume + interview progress */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Resume Progress</h3>
          <ProgressTrail points={summary.resume_progress} />
        </section>
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Interview Progress</h3>
          <ProgressTrail points={summary.interview_progress} />
        </section>
      </div>

      {/* Recent resume + interview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Recent Resume</h3>
          {summary.recent_resume ? (
            <>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">{summary.recent_resume.resume_filename}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {new Date(summary.recent_resume.uploaded_at).toLocaleDateString()} &middot; {summary.recent_resume.target_role} &middot; ATS {summary.recent_resume.ats_score}/100
              </p>
              <button
                type="button"
                onClick={() => navigate(`/resume-history/${summary.recent_resume.id}`)}
                className="mt-auto inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:opacity-90"
              >
                View Analysis
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500">No resumes analyzed yet.</p>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Recent Interview</h3>
          {summary.recent_interview ? (
            <>
              <p className="text-base font-bold text-slate-900 dark:text-slate-100">{summary.recent_interview.company_display_name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {new Date(summary.recent_interview.interview_date).toLocaleDateString()} &middot; Overall {summary.recent_interview.overall_score}/100
              </p>
              <button
                type="button"
                onClick={() => navigate(`/interview-history/${summary.recent_interview.id}`)}
                className="mt-auto inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:opacity-90"
              >
                View Feedback
              </button>
            </>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500">No mock interviews completed yet.</p>
          )}
        </section>
      </div>

      {/* Recommended companies */}
      {summary.recommended_companies.length > 0 && (
        <section>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Recommended Companies</h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {summary.recommended_companies.map((rec) => (
              <CompanyRecommendationCard key={rec.slug} recommendation={rec} onSelect={() => navigate('/upload')} />
            ))}
          </div>
        </section>
      )}

      {/* AI suggestions */}
      {summary.ai_suggestions.length > 0 && (
        <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">AI Suggestions</h3>
          </div>
          <ul className="flex flex-col gap-2.5">
            {summary.ai_suggestions.map((suggestion) => (
              <li key={suggestion} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Upload CTA */}
      <section className="flex flex-col items-center gap-5 rounded-2xl border border-slate-200/60 bg-white/90 px-6 py-12 text-center shadow-xl backdrop-blur-xl sm:px-12 dark:border-white/[0.08] dark:bg-slate-900/80">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 text-brand-500 dark:text-brand-400">
          <Upload className="h-8 w-8" strokeWidth={1.75} />
        </div>
        <div>
          <h2 className="pb-1 text-2xl font-extrabold tracking-tight sm:text-3xl bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent dark:from-white dark:via-slate-200 dark:to-slate-500">
            Ready for your next career analysis?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Upload your latest resume to receive updated ATS scoring, company recommendations,
            interview preparation, and personalized AI insights.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/upload')}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-500 px-10 py-5 text-lg font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:opacity-90 hover:shadow-brand-500/40"
        >
          <Upload className="h-5 w-5" />
          Upload Resume
        </button>
      </section>
    </div>
  )
}
