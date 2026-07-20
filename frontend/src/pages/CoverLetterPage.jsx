import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ArrowRight, Loader2, Mail } from 'lucide-react'
import CopyToClipboardButton from '../components/CopyToClipboardButton.jsx'
import { generateCoverLetter } from '../api/client.js'

function letterText(coverLetter) {
  return [coverLetter.greeting, ...coverLetter.body_paragraphs, coverLetter.closing].join('\n\n')
}

export default function CoverLetterPage({ result, targetRole, analysis, selectedCompany }) {
  const [coverLetter, setCoverLetter] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function handleGenerate() {
    if (isLoading) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await generateCoverLetter(
        result.extracted_text,
        targetRole,
        analysis,
        selectedCompany?.display_name,
      )
      setCoverLetter(data.cover_letter)
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
          Cover letter generator
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          A complete, role-targeted cover letter for {targetRole}, grounded in your resume.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {!coverLetter && (
          <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 text-center shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 text-brand-500 dark:text-brand-400">
              <Mail className="h-7 w-7" strokeWidth={1.75} />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {selectedCompany
                ? `Will be personalized for ${selectedCompany.display_name}.`
                : 'No company selected yet — this will be a generic, role-targeted letter.'}
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
                  Writing letter…
                </>
              ) : (
                <>
                  Generate Cover Letter
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

        {coverLetter && (
          <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
            <div className="mb-4 flex items-center justify-end">
              <CopyToClipboardButton getText={() => letterText(coverLetter)} label="Copy letter" />
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <p>{coverLetter.greeting}</p>
              {coverLetter.body_paragraphs.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
              <p>{coverLetter.closing}</p>
            </div>
          </section>
        )}
      </div>
    </>
  )
}
