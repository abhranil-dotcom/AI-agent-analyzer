import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeftRight, FileText, Trash2 } from 'lucide-react'
import { deleteResumeHistory, fetchResumeHistory } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import EmptyState from '../components/EmptyState.jsx'
import HistorySkeleton from '../components/HistorySkeleton.jsx'

export default function ResumeHistoryPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [entries, setEntries] = useState(null)
  const [error, setError] = useState(null)
  const [compareSelection, setCompareSelection] = useState([])
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    fetchResumeHistory()
      .then((data) => setEntries(data.entries))
      .catch((err) => setError(err.response?.data?.detail ?? 'Could not load resume history.'))
  }, [])

  function toggleCompareSelection(id) {
    setCompareSelection((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id)
      if (current.length >= 2) return [current[1], id]
      return [...current, id]
    })
  }

  async function handleDelete(id) {
    setDeletingId(id)
    try {
      await deleteResumeHistory(id)
      setEntries((current) => current.filter((e) => e.id !== id))
      setCompareSelection((current) => current.filter((x) => x !== id))
      showToast('Resume deleted from history.')
    } catch {
      showToast('Could not delete this resume. Please try again.', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="flex-1">{error}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Resume History</h1>
        {compareSelection.length === 2 && (
          <button
            type="button"
            onClick={() => navigate(`/resume-history/compare?a=${compareSelection[0]}&b=${compareSelection[1]}`)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all hover:opacity-90"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Compare Selected
          </button>
        )}
      </div>

      {entries === null && <HistorySkeleton />}

      {entries !== null && entries.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No resumes analyzed yet"
          description="Upload a resume to get your first ATS analysis — it'll show up here automatically."
          ctaLabel="Upload Resume"
          ctaTo="/upload"
        />
      )}

      {entries !== null && entries.length > 0 && (
        <div className="flex flex-col gap-4">
          {entries.map((entry) => {
            const isSelected = compareSelection.includes(entry.id)
            return (
              <div
                key={entry.id}
                className={`flex flex-wrap items-center gap-4 rounded-2xl border bg-white/90 p-5 shadow-xl backdrop-blur-xl transition-colors dark:bg-slate-900/80 ${
                  isSelected
                    ? 'border-brand-400 dark:border-brand-500'
                    : 'border-slate-200/60 dark:border-white/[0.08]'
                }`}
              >
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{entry.resume_filename}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(entry.uploaded_at).toLocaleDateString()} &middot; {entry.target_role} &middot; ATS {entry.ats_score}/100
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/resume-history/${entry.id}`)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-brand-400"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleCompareSelection(entry.id)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      isSelected
                        ? 'border-brand-400 bg-brand-100 text-brand-700 dark:border-brand-600 dark:bg-brand-950/50 dark:text-brand-300'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-brand-400'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Compare'}
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === entry.id}
                    onClick={() => handleDelete(entry.id)}
                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
