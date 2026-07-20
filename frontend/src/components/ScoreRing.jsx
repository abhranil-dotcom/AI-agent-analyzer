export const SCORE_TIERS = [
  { min: 85, label: 'Excellent', color: 'emerald' },
  { min: 70, label: 'Good', color: 'blue' },
  { min: 50, label: 'Average', color: 'amber' },
  { min: 0, label: 'Needs Work', color: 'red' },
]

export const COLOR_STYLES = {
  emerald: {
    badge: 'border-emerald-200/70 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300',
    label: 'text-emerald-600 dark:text-emerald-400',
    wrap: 'border-emerald-200/50 bg-emerald-500/[0.04] dark:border-emerald-800/30 dark:bg-emerald-950/20',
    ring: 'stroke-emerald-500 dark:stroke-emerald-400',
  },
  blue: {
    badge: 'border-blue-200/70 bg-blue-50 text-blue-700 dark:border-blue-800/40 dark:bg-blue-950/40 dark:text-blue-300',
    label: 'text-blue-600 dark:text-blue-400',
    wrap: 'border-blue-200/50 bg-blue-500/[0.04] dark:border-blue-800/30 dark:bg-blue-950/20',
    ring: 'stroke-blue-500 dark:stroke-blue-400',
  },
  amber: {
    badge: 'border-amber-200/70 bg-amber-50 text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300',
    label: 'text-amber-600 dark:text-amber-400',
    wrap: 'border-amber-200/50 bg-amber-500/[0.04] dark:border-amber-800/30 dark:bg-amber-950/20',
    ring: 'stroke-amber-500 dark:stroke-amber-400',
  },
  red: {
    badge: 'border-red-200/70 bg-red-50 text-red-700 dark:border-red-800/40 dark:bg-red-950/40 dark:text-red-300',
    label: 'text-red-600 dark:text-red-400',
    wrap: 'border-red-200/50 bg-red-500/[0.04] dark:border-red-800/30 dark:bg-red-950/20',
    ring: 'stroke-red-500 dark:stroke-red-400',
  },
}

export function getScoreTier(score) {
  return SCORE_TIERS.find((t) => score >= t.min)
}

export default function ScoreRing({ score, ringClass, size = 72 }) {
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference

  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 72 72" className="-rotate-90">
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          strokeWidth="7"
          className="stroke-slate-200 dark:stroke-slate-700"
        />
        <circle
          cx="36"
          cy="36"
          r={radius}
          fill="none"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`transition-[stroke-dashoffset] duration-1000 ease-out ${ringClass}`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-black leading-none">{score}</span>
        <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">/100</span>
      </div>
    </div>
  )
}
