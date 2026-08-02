import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Building2, Trash2 } from 'lucide-react'
import { clearInterviewHistory, deleteInterviewHistory, fetchInterviewHistory } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EmptyState from '../components/EmptyState.jsx'
import HistorySkeleton from '../components/HistorySkeleton.jsx'
import InterviewProgressSection from '../components/InterviewProgressSection.jsx'

export default function InterviewHistoryPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [entries, setEntries] = useState(null)
  const [error, setError] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchInterviewHistory()
      .then((data) => setEntries(data.entries))
      .catch((err) => setError(err.response?.data?.detail ?? 'Could not load interview history.'))
  }, [])

  async function handleConfirmDelete() {
    setIsDeleting(true)
    try {
      if (pendingDelete.type === 'all') {
        await clearInterviewHistory()
        setEntries([])
        showToast('Interview history cleared.')
      } else {
        await deleteInterviewHistory(pendingDelete.id)
        setEntries((current) => current.filter((e) => e.id !== pendingDelete.id))
        showToast('Interview deleted from history.')
      }
      setPendingDelete(null)
    } catch {
      showToast('Could not delete. Please try again.', 'error')
    } finally {
      setIsDeleting(false)
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
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Interview History</h1>
        {entries !== null && entries.length > 0 && (
          <button
            type="button"
            onClick={() => setPendingDelete({ type: 'all' })}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-500 transition-colors hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
            Clear History
          </button>
        )}
      </div>

      {entries === null && <HistorySkeleton />}

      {entries !== null && entries.length === 0 && (
        <EmptyState
          icon={Building2}
          title="No mock interviews completed yet"
          description="Finish a mock interview to see your questions, answers, and AI feedback saved here."
          ctaLabel="Start a Mock Interview"
          ctaTo="/upload"
        />
      )}

      {entries !== null && entries.length > 0 && <InterviewProgressSection entries={entries} />}

      {entries !== null && entries.length > 0 && (
        <div className="flex flex-col gap-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200/60 bg-white/90 p-5 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{entry.company_display_name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(entry.interview_date).toLocaleDateString()} &middot; {entry.target_role} &middot; Overall {entry.overall_score}/100
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/interview-history/${entry.id}`)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-brand-400"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPendingDelete({ type: 'single', id: entry.id, companyName: entry.company_display_name })
                  }
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 transition-colors hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete?.type === 'all' ? 'Clear all interview history?' : 'Delete this interview?'}
        description={
          pendingDelete?.type === 'all'
            ? 'This permanently deletes every saved mock interview session for your account. This cannot be undone.'
            : `Your interview with "${pendingDelete?.companyName}" and its saved feedback will be permanently deleted. This cannot be undone.`
        }
        confirmLabel={pendingDelete?.type === 'all' ? 'Clear History' : 'Delete'}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
