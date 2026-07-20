import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import CompanyRecommendationCard from '../components/CompanyRecommendationCard.jsx'
import CompaniesSkeleton from '../components/CompaniesSkeleton.jsx'
import Stepper from '../components/Stepper.jsx'
import { recommendCompanies } from '../api/client.js'

export default function CompaniesPage({
  result,
  targetRole,
  analysis,
  recommendations,
  onRecommendationsComplete,
  onSelectCompany,
}) {
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(!recommendations)
  const [retryCount, setRetryCount] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (recommendations) return
    let cancelled = false

    async function runRecommend() {
      setIsLoading(true)
      setError(null)
      try {
        const data = await recommendCompanies(result.extracted_text, targetRole, analysis)
        if (!cancelled) onRecommendationsComplete(data.recommendations)
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

    runRecommend()
    return () => {
      cancelled = true
    }
  }, [result, targetRole, analysis, recommendations, onRecommendationsComplete, retryCount])

  function handleSelect(recommendation) {
    onSelectCompany({ slug: recommendation.slug, display_name: recommendation.display_name })
    navigate('/interview-prep')
  }

  const sorted = recommendations
    ? [...recommendations].sort((a, b) => b.match_percentage - a.match_percentage)
    : []

  return (
    <>
      <button
        type="button"
        onClick={() => navigate('/analysis')}
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to analysis
      </button>

      <Stepper currentStep={3} />

      <div className="mb-12 text-center">
        <h1 className="pb-1 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 bg-clip-text text-transparent dark:from-white dark:via-slate-200 dark:to-slate-500">
          Recommended companies
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Personalized matches based on your resume, skills, and target role — pick one to start
          company-specific interview prep.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {isLoading && <CompaniesSkeleton />}

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

        {sorted.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {sorted.map((recommendation) => (
              <CompanyRecommendationCard
                key={recommendation.slug}
                recommendation={recommendation}
                onSelect={() => handleSelect(recommendation)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
