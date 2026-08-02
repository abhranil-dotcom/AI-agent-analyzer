import { useEffect, useState } from 'react'
import { Wrench } from 'lucide-react'
import { fetchResumeHistory, fetchResumeHistoryDetail } from '../api/client.js'
import EmptyState from '../components/EmptyState.jsx'
import ToolkitHubPage from './ToolkitHubPage.jsx'

// Reached from the navbar's "Career Toolkit" link — unlike the existing "Explore Career Toolkit"
// button (which only appears once the upload -> analyze wizard has populated `analysis` in
// App.jsx's lifted state), the navbar link can be clicked with nothing in memory yet, e.g. right
// after logging in. Rather than bouncing to /upload like every other wizard-gated route, this
// loads the user's most recent saved resume analysis and hands it to the SAME ToolkitHubPage the
// existing button already renders — no second toolkit, no duplicated hub UI. If a wizard session
// is already in progress, App.jsx renders ToolkitHubPage directly and this component is never
// used, so the "Explore Career Toolkit" flow is completely unaffected.
export default function ToolkitEntryPage({ targetRole, selectedCompany, onAnalysisComplete, onTargetRoleChange }) {
  const [status, setStatus] = useState('loading') // 'loading' | 'ready' | 'empty' | 'error'

  useEffect(() => {
    let cancelled = false
    fetchResumeHistory()
      .then((data) => {
        if (cancelled) return
        const latest = data.entries[0] // already newest-first, same convention as interview history
        if (!latest) {
          setStatus('empty')
          return undefined
        }
        return fetchResumeHistoryDetail(latest.id).then((detail) => {
          if (cancelled) return
          onAnalysisComplete(detail.analysis)
          onTargetRoleChange(detail.target_role)
          setStatus('ready')
        })
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [onAnalysisComplete, onTargetRoleChange])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-brand-200/60 bg-brand-50/60 px-4 py-3 text-sm font-semibold text-brand-700 dark:border-brand-800/40 dark:bg-brand-950/30 dark:text-brand-300">
        <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
        Loading your latest resume analysis…
      </div>
    )
  }

  if (status === 'empty' || status === 'error') {
    return (
      <EmptyState
        icon={Wrench}
        title="No analyzed resume yet"
        description="Upload and analyze a resume first to unlock the Career Toolkit."
        ctaLabel="Upload Your Resume"
        ctaTo="/upload"
      />
    )
  }

  return <ToolkitHubPage targetRole={targetRole} selectedCompany={selectedCompany} />
}
