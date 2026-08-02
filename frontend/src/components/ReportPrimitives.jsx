import { Lightbulb, Sparkles } from 'lucide-react'

// Shared building blocks for the Voice/Video delivery report cards — extracted from
// DeliveryEvaluationPanel.jsx so InterviewPerformanceReport.jsx doesn't duplicate them.

export function SectionHeader({ icon: Icon, title, iconClass = 'text-slate-500 dark:text-slate-400' }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} />
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{title}</h3>
    </div>
  )
}

// Renders nothing when `value` is null/undefined — the report-wide discipline that keeps every
// displayed number traceable to a real measurement, never a placeholder for an unmeasured stat.
export function StatTile({ label, value }) {
  if (value === null || value === undefined) return null
  // Short numeric/percentage values read best large and bold; longer text labels (e.g. "Some
  // background movement") get a smaller size so they wrap cleanly instead of looming over the tile.
  const isLong = typeof value === 'string' && value.length > 10
  return (
    <div className="rounded-xl border border-slate-200/50 p-3 text-center dark:border-slate-700/30">
      <p className={`font-black text-slate-900 dark:text-slate-100 ${isLong ? 'text-sm' : 'text-lg'}`}>{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  )
}

export function StrengthsImprovements({ strengths, improvements }) {
  if (!strengths?.length && !improvements?.length) return null
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {strengths?.length > 0 && (
        <div>
          <SectionHeader icon={Sparkles} title="Strengths" />
          <ul className="mt-3 space-y-2">
            {strengths.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/70" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {improvements?.length > 0 && (
        <div>
          <SectionHeader icon={Lightbulb} title="Improvements" iconClass="text-brand-600 dark:text-brand-400" />
          <ul className="mt-3 space-y-2">
            {improvements.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500/60" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export const CAMERA_POSITIONING_LABELS = {
  well_centered: 'Well centered',
  too_close: 'Too close to camera',
  too_far: 'Too far from camera',
  off_center: 'Off-center framing',
}
