import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, RotateCcw, Trophy } from 'lucide-react'
import AnswerEvaluationPanel from '../components/AnswerEvaluationPanel.jsx'
import DeliveryEvaluationPanel from '../components/DeliveryEvaluationPanel.jsx'
import InterviewModeSelect from '../components/InterviewModeSelect.jsx'
import InterviewQuestionCard from '../components/InterviewQuestionCard.jsx'
import TextAnswerInput from '../components/TextAnswerInput.jsx'
import VideoAnswerInput from '../components/VideoAnswerInput.jsx'
import VoiceAnswerInput from '../components/VoiceAnswerInput.jsx'
import ScoreRing, { COLOR_STYLES, getScoreTier } from '../components/ScoreRing.jsx'
import Stepper from '../components/Stepper.jsx'
import { evaluateAnswer, saveInterviewHistory } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import { CATEGORY_LABELS, flattenQuestions } from '../constants/interview.js'
import { averageCommunicationPresentationScore, averageScore } from '../lib/scoreAggregation.js'

function SummaryView({ history, company, mode, onStartOver }) {
  const average = Math.round(history.reduce((sum, h) => sum + h.evaluation.score, 0) / history.length)
  const tier = getScoreTier(average)
  const s = COLOR_STYLES[tier.color]

  const byCategory = {}
  for (const h of history) {
    const cat = h.question.category
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(h.evaluation.score)
  }

  const evaluations = history.map((h) => h.evaluation)
  const technicalAvg = mode !== 'text' ? averageScore(evaluations, 'technical_score') : null
  const commsAvg = mode !== 'text' ? averageCommunicationPresentationScore(evaluations) : null
  const speechSamples = history.map((h) => h.speechMetrics).filter(Boolean)
  const videoSamples = history.map((h) => h.videoMetrics).filter(Boolean)

  return (
    <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
      <div className="mb-6 flex items-center gap-2">
        <Trophy className="h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Mock interview complete — {company.display_name}
        </h2>
      </div>

      <div className={`mb-6 flex items-center gap-5 rounded-xl border px-5 py-4 ${s.wrap}`}>
        <ScoreRing score={average} ringClass={s.ring} />
        <div>
          <p className={`text-xl font-bold ${s.label}`}>{tier.label}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Average Score Across {history.length} Questions</p>
        </div>
      </div>

      {mode !== 'text' && technicalAvg !== null && commsAvg !== null && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { label: 'Technical Score', score: technicalAvg },
            { label: mode === 'video' ? 'Communication & Presentation Score' : 'Communication Score', score: commsAvg },
          ].map(({ label, score }) => {
            const t = getScoreTier(score)
            const c = COLOR_STYLES[t.color]
            return (
              <div key={label} className={`flex items-center gap-4 rounded-xl border px-5 py-4 ${c.wrap}`}>
                <ScoreRing score={score} ringClass={c.ring} size={56} />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{label}</p>
              </div>
            )
          })}
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Object.entries(byCategory).map(([cat, scores]) => {
          const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          return (
            <div key={cat} className="rounded-xl border border-slate-200/50 p-4 text-center dark:border-slate-700/30">
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{avg}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {CATEGORY_LABELS[cat] ?? cat}
              </p>
            </div>
          )
        })}
      </div>

      {speechSamples.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200/50 p-4 text-center dark:border-slate-700/30">
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {Math.round(speechSamples.reduce((a, b) => a + b.words_per_minute, 0) / speechSamples.length)}
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Avg WPM</p>
          </div>
          <div className="rounded-xl border border-slate-200/50 p-4 text-center dark:border-slate-700/30">
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {speechSamples.reduce((a, b) => a + b.filler_word_count, 0)}
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Filler Words</p>
          </div>
          {videoSamples.length > 0 && (
            <>
              <div className="rounded-xl border border-slate-200/50 p-4 text-center dark:border-slate-700/30">
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {Math.round((videoSamples.reduce((a, b) => a + b.camera_facing_ratio, 0) / videoSamples.length) * 100)}%
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Camera Engagement
                </p>
              </div>
              <div className="rounded-xl border border-slate-200/50 p-4 text-center dark:border-slate-700/30">
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {Math.round(videoSamples.reduce((a, b) => a + b.head_stability_score, 0) / videoSamples.length)}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Head Steadiness
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onStartOver}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:opacity-90 hover:shadow-brand-500/40"
      >
        <RotateCcw className="h-5 w-5" />
        Start Over
      </button>
    </section>
  )
}

export default function MockInterviewPage({ interviewKit, targetRole, company }) {
  const questions = useMemo(() => flattenQuestions(interviewKit), [interviewKit])
  const [mode, setMode] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [history, setHistory] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { showToast } = useToast()
  const sessionStartRef = useRef(Date.now())
  const hasSavedRef = useRef(false)

  const isComplete = currentIndex >= questions.length
  const currentQuestion = !isComplete ? questions[currentIndex] : null

  // Persist the completed session once — there's no single backend call to hook this into since
  // a session spans many /evaluate calls, so this is the one natural "interview complete" moment.
  useEffect(() => {
    if (!isComplete || hasSavedRef.current || history.length === 0) return
    hasSavedRef.current = true

    const durationSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000)
    saveInterviewHistory({
      company_slug: company.slug,
      company_display_name: company.display_name,
      target_role: targetRole,
      duration_seconds: durationSeconds,
      qa: history.map((h) => ({
        question: h.question.question,
        category: h.question.category,
        candidate_answer: h.answer,
        evaluation: h.evaluation,
        speech_metrics: h.speechMetrics ?? null,
        video_metrics: h.videoMetrics ?? null,
      })),
    })
      .then(() => showToast('Interview saved to history.'))
      .catch(() => showToast('Could not save this interview to history.', 'error'))
  }, [isComplete, history, company, targetRole, showToast])

  // Shared across all three modes — only how `answerText`/`metrics` are produced differs.
  async function submitAnswer(answerText, metrics = {}) {
    if (!answerText.trim() || isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    try {
      const data = await evaluateAnswer(
        currentQuestion.question,
        currentQuestion.category,
        targetRole,
        company.slug,
        answerText,
        { interviewMode: mode, speechMetrics: metrics.speechMetrics, videoMetrics: metrics.videoMetrics },
      )
      setEvaluation(data.evaluation)
      setHistory((prev) => [
        ...prev,
        {
          question: currentQuestion,
          answer: answerText,
          evaluation: data.evaluation,
          speechMetrics: metrics.speechMetrics ?? null,
          videoMetrics: metrics.videoMetrics ?? null,
        },
      ])
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
      setIsSubmitting(false)
    }
  }

  function handleNext() {
    setCurrentIndex((i) => i + 1)
    setAnswer('')
    setEvaluation(null)
  }

  return (
    <>
      <Stepper currentStep={5} />

      <div className="mb-12 text-center">
        <h1 className="pb-1 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent dark:from-white dark:via-slate-200 dark:to-slate-500">
          Mock interview
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {company.display_name} · {targetRole}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {!mode ? (
          <InterviewModeSelect onSelect={setMode} />
        ) : isComplete ? (
          <SummaryView history={history} company={company} mode={mode} onStartOver={() => navigate('/')} />
        ) : (
          <>
            <InterviewQuestionCard question={currentQuestion} index={currentIndex} total={questions.length} />

            {!evaluation && mode === 'text' && (
              <TextAnswerInput
                answer={answer}
                onAnswerChange={setAnswer}
                onSubmit={() => submitAnswer(answer)}
                isSubmitting={isSubmitting}
              />
            )}
            {!evaluation && mode === 'voice' && (
              <VoiceAnswerInput
                key={currentQuestion.id}
                question={currentQuestion.question}
                onSubmit={submitAnswer}
                isSubmitting={isSubmitting}
              />
            )}
            {!evaluation && mode === 'video' && (
              <VideoAnswerInput
                key={currentQuestion.id}
                question={currentQuestion.question}
                onSubmit={submitAnswer}
                isSubmitting={isSubmitting}
              />
            )}

            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            {evaluation && (
              <>
                <AnswerEvaluationPanel evaluation={evaluation} />
                {mode !== 'text' && (
                  <DeliveryEvaluationPanel
                    evaluation={evaluation}
                    speechMetrics={history[history.length - 1]?.speechMetrics}
                    videoMetrics={history[history.length - 1]?.videoMetrics}
                  />
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:opacity-90 hover:shadow-brand-500/40"
                >
                  Next Question
                  <ArrowRight className="h-5 w-5" />
                </button>
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}
