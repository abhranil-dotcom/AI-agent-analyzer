import { TrendingUp } from 'lucide-react'
import InterviewProgressChart, { SERIES_COLORS } from './InterviewProgressChart.jsx'

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/90 p-5 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80">
      <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  )
}

// `entries` is the Interview History list (newest first, from GET /api/interview/history) —
// every number here comes straight from those saved rows, nothing computed by an LLM or
// fabricated. Rendered above the existing history list; that list and its View/Delete/Clear
// actions are untouched.
export default function InterviewProgressSection({ entries }) {
  const scores = entries.map((e) => e.overall_score)
  const average = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  const best = Math.max(...scores)
  const latest = entries[0].overall_score // list is newest-first

  // Chronological (oldest -> newest) for the chart, left to right.
  const chronological = [...entries].reverse()
  const dates = chronological.map((e) => e.interview_date)

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">Interview Progress</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Interviews" value={entries.length} />
        <StatCard label="Average Score" value={average} />
        <StatCard label="Best Score" value={best} />
        <StatCard label="Latest Score" value={latest} />
      </div>

      {entries.length < 2 ? (
        <div className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 text-center text-sm text-slate-500 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80 dark:text-slate-400">
          Complete more interviews to see your progress.
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Overall Score Trend
            </h3>
            <InterviewProgressChart
              dates={dates}
              series={[
                {
                  key: 'overall',
                  label: 'Overall Score',
                  color: SERIES_COLORS.primary,
                  values: chronological.map((e) => e.overall_score),
                },
              ]}
            />
          </div>

          <div className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Communication &amp; Answer Quality Trend
            </h3>
            <InterviewProgressChart
              dates={dates}
              series={[
                {
                  key: 'communication',
                  label: 'Communication',
                  color: SERIES_COLORS.primary,
                  values: chronological.map((e) => e.communication_score),
                },
                {
                  key: 'technical',
                  label: 'Answer Quality',
                  color: SERIES_COLORS.secondary,
                  values: chronological.map((e) => e.technical_score),
                },
              ]}
            />
          </div>
        </>
      )}
    </section>
  )
}
