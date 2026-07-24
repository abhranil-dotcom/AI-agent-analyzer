import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { fetchResumeHistoryDetail } from '../api/client.js'
import AnalysisResult from '../components/AnalysisResult.jsx'
import AnalysisSkeleton from '../components/AnalysisSkeleton.jsx'

export default function ResumeHistoryDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setDetail(null)
    setError(null)
    fetchResumeHistoryDetail(id)
      .then(setDetail)
      .catch((err) => setError(err.response?.data?.detail ?? 'Could not load this resume.'))
  }, [id])

  return (
    <>
      <button
        type="button"
        onClick={() => navigate('/resume-history')}
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Resume History
      </button>

      {!detail && !error && <AnalysisSkeleton />}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {detail && <AnalysisResult analysis={detail.analysis} targetRole={detail.target_role} />}
    </>
  )
}
