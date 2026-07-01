import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import ResumeUpload from '../components/ResumeUpload.jsx'
import ExtractedText from '../components/ExtractedText.jsx'
import { uploadResume } from '../api/client.js'

export default function UploadPage({ result, onExtracted }) {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  async function handleUpload(file) {
    setIsLoading(true)
    setError(null)
    onExtracted(null)

    try {
      const data = await uploadResume(file)
      onExtracted(data)
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
      {/* Hero section */}
      <div className="mb-12 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-brand-600 dark:text-brand-400">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500 dark:bg-brand-400 animate-pulse" />
          Step 1 &middot; Upload &amp; Extract
        </div>
        <h1 className="pb-1 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent dark:from-white dark:via-slate-200 dark:to-slate-500">
          AI-powered resume<br />intelligence
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Upload your PDF resume to extract its text. Verify the extraction looks right, then move
          on to AI analysis — ATS score, skill gaps, strengths, and suggestions.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <ResumeUpload onUpload={handleUpload} isLoading={isLoading} />

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <ExtractedText result={result} />

        {result && (
          <button
            type="button"
            onClick={() => navigate('/analysis')}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:opacity-90 hover:shadow-brand-500/40"
          >
            Analyze Resume
            <ArrowRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </>
  )
}
