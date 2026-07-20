import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Loader2, RotateCcw, Trophy } from 'lucide-react'
import AnswerEvaluationPanel from '../components/AnswerEvaluationPanel.jsx'
import InterviewQuestionCard from '../components/InterviewQuestionCard.jsx'
import ScoreRing, { COLOR_STYLES, getScoreTier } from '../components/ScoreRing.jsx'
import Stepper from '../components/Stepper.jsx'
import { evaluateAnswer } from '../api/client.js'
import { CATEGORY_LABELS, flattenQuestions } from '../constants/interview.js'

function SummaryView({ history, company, onStartOver }) {
  const average = Math.round(history.reduce((sum, h) => sum + h.evaluation.score, 0) / history.length)
  const tier = getScoreTier(average)
  const s = COLOR_STYLES[tier.color]

  const byCategory = {}
  for (const h of history) {
    const cat = h.question.category
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(h.evaluation.score)
  }

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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [history, setHistory] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const isComplete = currentIndex >= questions.length
  const currentQuestion = !isComplete ? questions[currentIndex] : null

  async function handleSubmit() {
    if (!answer.trim() || isSubmitting) return
    setIsSubmitting(true)
    setError(null)
    try {
      const data = await evaluateAnswer(
        currentQuestion.question,
        currentQuestion.category,
        targetRole,
        company.slug,
        answer,
      )
      setEvaluation(data.evaluation)
      setHistory((prev) => [...prev, { question: currentQuestion, answer, evaluation: data.evaluation }])
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
        {isComplete ? (
          <SummaryView history={history} company={company} onStartOver={() => navigate('/')} />
        ) : (
          <>
            <InterviewQuestionCard question={currentQuestion} index={currentIndex} total={questions.length} />

            {!evaluation && (
              <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
                <label htmlFor="answer" className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Your Answer
                </label>
                <textarea
                  id="answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  disabled={isSubmitting}
                  rows={6}
                  placeholder="Type your answer here…"
                  className="mt-3 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-400/30 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleSubmit}
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
