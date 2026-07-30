import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CheckCircle2, Lightbulb } from 'lucide-react'
import { fetchInterviewHistoryDetail } from '../api/client.js'
import AnswerEvaluationPanel from '../components/AnswerEvaluationPanel.jsx'
import DeliveryEvaluationPanel from '../components/DeliveryEvaluationPanel.jsx'
import InterviewKitSkeleton from '../components/InterviewKitSkeleton.jsx'
import ScoreRing, { COLOR_STYLES, getScoreTier } from '../components/ScoreRing.jsx'

const STRENGTH_THRESHOLD = 80
const WEAKNESS_THRESHOLD = 60

function computeSessionOverview(qa) {
  const strengths = qa.filter((entry) => entry.evaluation.score >= STRENGTH_THRESHOLD).map((entry) => entry.question)
  const weaknesses = qa.filter((entry) => entry.evaluation.score < WEAKNESS_THRESHOLD).map((entry) => entry.question)
  const finalSuggestions = [...new Set(qa.flatMap((entry) => entry.evaluation.improvement_suggestions))]
  return { strengths, weaknesses, finalSuggestions }
}

export default function InterviewHistoryDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setDetail(null)
    setError(null)
    fetchInterviewHistoryDetail(id)
      .then(setDetail)
      .catch((err) => setError(err.response?.data?.detail ?? 'Could not load this interview.'))
  }, [id])

  return (
    <>
      <button
        type="button"
        onClick={() => navigate('/interview-history')}
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Interview History
      </button>

      {!detail && !error && <InterviewKitSkeleton />}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {detail && (() => {
        const overview = computeSessionOverview(detail.qa)
        return (
        <div className="flex flex-col gap-6">
          <div className="mb-2 text-center">
            <h1 className="pb-1 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent dark:from-white dark:via-slate-200 dark:to-slate-500">
              {detail.company_display_name} &middot; {detail.target_role}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500 dark:text-slate-400">
              {new Date(detail.interview_date).toLocaleDateString()}
              {detail.duration_seconds != null && ` · ${Math.round(detail.duration_seconds / 60)} min`}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Overall', score: detail.overall_score },
              { label: 'Communication', score: detail.communication_score },
              { label: 'Technical', score: detail.technical_score },
              { label: 'Confidence', score: detail.confidence_score },
            ].map(({ label, score }) => {
              const tier = getScoreTier(score)
              const s = COLOR_STYLES[tier.color]
              return (
                <div
                  key={label}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200/60 bg-white/90 p-5 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80"
                >
                  <ScoreRing score={score} ringClass={s.ring} size={56} />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
                </div>
              )
            })}
          </div>

          {(overview.strengths.length > 0 || overview.weaknesses.length > 0 || overview.finalSuggestions.length > 0) && (
            <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Session Overview</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {overview.strengths.length > 0 && (
                  <div className="rounded-xl border border-emerald-200/50 bg-emerald-500/[0.04] p-4 dark:border-emerald-800/30 dark:bg-emerald-950/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Strengths</p>
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {overview.strengths.map((q) => (
                        <li key={q} className="text-sm text-slate-700 dark:text-slate-300">
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {overview.weaknesses.length > 0 && (
                  <div className="rounded-xl border border-amber-200/50 bg-amber-500/[0.04] p-4 dark:border-amber-800/30 dark:bg-amber-950/20">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Weaknesses</p>
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {overview.weaknesses.map((q) => (
                        <li key={q} className="text-sm text-slate-700 dark:text-slate-300">
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {overview.finalSuggestions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Final Suggestions</p>
                    </div>
                    <ol className="mt-3 space-y-1.5">
                      {overview.finalSuggestions.map((item, i) => (
                        <li key={i} className="text-sm text-slate-700 dark:text-slate-300">
                          {i + 1}. {item}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="flex flex-col gap-6">
            {detail.qa.map((entry, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Question {i + 1} &middot; {entry.category}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{entry.question}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{entry.candidate_answer}</p>
                </div>
                <AnswerEvaluationPanel evaluation={entry.evaluation} />
                {entry.evaluation.speaking_clarity && (
                  <DeliveryEvaluationPanel
                    evaluation={entry.evaluation}
                    speechMetrics={entry.speech_metrics}
                    videoMetrics={entry.video_metrics}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        )
      })()}
    </>
  )
}
