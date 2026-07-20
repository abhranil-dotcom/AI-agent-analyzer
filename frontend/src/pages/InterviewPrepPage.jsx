import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ArrowRight, Building2, ClipboardList, ListChecks, Sparkles } from 'lucide-react'
import InterviewKitSkeleton from '../components/InterviewKitSkeleton.jsx'
import Stepper from '../components/Stepper.jsx'
import { generateInterviewKit } from '../api/client.js'
import { CATEGORY_LABELS } from '../constants/interview.js'

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{title}</h3>
    </div>
  )
}

function QuestionPreviewGroup({ title, questions }) {
  if (!questions?.length) return null
  return (
    <div className="rounded-xl border border-slate-200/50 p-4 dark:border-slate-700/30">
      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{title}</h4>
      <ul className="mt-3 space-y-2">
        {questions.map((q) => (
          <li key={q.id} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500/60" />
            <span>
              {q.question}
              {q.difficulty && (
                <span className="ml-2 rounded-full border border-slate-300/70 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:border-slate-600 dark:text-slate-400">
                  {q.difficulty}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function InterviewPrepPage({ result, targetRole, analysis, company, interviewKit, onKitComplete }) {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(!interviewKit)
  const [retryCount, setRetryCount] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (interviewKit) return
    let cancelled = false

    async function runGenerate() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await generateInterviewKit(company.slug, targetRole, result.extracted_text, analysis)
        if (!cancelled) onKitComplete(data.kit)
      } catch (err) {
        if (cancelled) return
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
        if (!cancelled) setIsLoading(false)
      }
    }

    runGenerate()
    return () => {
      cancelled = true
    }
  }, [result, targetRole, analysis, company, interviewKit, onKitComplete, retryCount])

  return (
    <>
      <button
        type="button"
        onClick={() => navigate('/companies')}
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to companies
      </button>

      <Stepper currentStep={4} />

      <div className="mb-12 text-center">
        <h1 className="pb-1 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent dark:from-white dark:via-slate-200 dark:to-slate-500">
          Interview prep kit
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Grounded in {company.display_name}&rsquo;s knowledge base and tailored to your resume and target
          role.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {isLoading && <InterviewKitSkeleton />}

        {error && (
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
        )}

        {interviewKit && (
          <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
            <div className="mb-6 flex items-center gap-2">
              <Building2 className="h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {company.display_name}
              </h2>
            </div>

            <div className="mb-6">
              <SectionHeader icon={Sparkles} title="Company Overview" />
              <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {interviewKit.company_overview}
              </p>
            </div>

            <div className="mb-6">
              <SectionHeader icon={ClipboardList} title="Hiring Process" />
              <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {interviewKit.hiring_process}
              </p>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <SectionHeader icon={ListChecks} title="Interview Rounds" />
                <ol className="mt-3 space-y-2">
                  {interviewKit.interview_rounds.map((round, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-[11px] font-black text-brand-600 dark:text-brand-400">
                        {i + 1}
                      </span>
                      {round}
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <SectionHeader icon={ListChecks} title="Preparation Tips" />
                <ul className="mt-3 space-y-2">
                  {interviewKit.preparation_tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500/60" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <QuestionPreviewGroup title={CATEGORY_LABELS.hr} questions={interviewKit.hr_questions} />
              <QuestionPreviewGroup title={CATEGORY_LABELS.resume} questions={interviewKit.resume_questions} />
              <QuestionPreviewGroup title={CATEGORY_LABELS.technical} questions={interviewKit.technical_questions} />
              <QuestionPreviewGroup title={CATEGORY_LABELS.coding} questions={interviewKit.coding_questions} />
            </div>
          </section>
        )}

        {interviewKit && (
          <button
            type="button"
            onClick={() => navigate('/mock-interview')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:opacity-90 hover:shadow-brand-500/40"
          >
            Start Mock Interview
            <ArrowRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </>
  )
}
