// Hand-rolled SVG line chart — no charting library, matching the codebase's existing
// zero-dependency pattern for visuals (see ScoreRing.jsx). Fixed 0-100 y-domain (scores are
// always 0-100), points evenly spaced along x by attempt order. Colors are OKLab-checked for
// colorblind separation and contrast in both light and dark mode (dataviz skill validator).
const WIDTH = 640
const HEIGHT = 220
const PAD_LEFT = 34
const PAD_RIGHT = 16
const PAD_TOP = 16
const PAD_BOTTOM = 28
const GRID_VALUES = [0, 25, 50, 75, 100]

// Validated as a pair (light & dark, both ALL-PASS) — used identically in both themes rather than
// swapping steps, since one hex pair already clears every check in both modes.
const SERIES_COLORS = {
  primary: '#4f46e5', // brand-600
  secondary: '#0284c7', // accent-600
}

function scaleX(index, count) {
  if (count <= 1) return PAD_LEFT
  return PAD_LEFT + (index * (WIDTH - PAD_LEFT - PAD_RIGHT)) / (count - 1)
}

function scaleY(value) {
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM
  return PAD_TOP + plotHeight * (1 - value / 100)
}

function formatShortDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// `showEndLabel` is only true for a lone series — with two or more, end labels can converge and
// collide (the dataviz anti-pattern of stacked/overlapping end labels); the legend + per-point
// hover tooltip carry identity and value instead, per the skill's own fallback for that case.
function Series({ points, color, label, showEndLabel }) {
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${scaleY(0)} L ${points[0].x} ${scaleY(0)} Z`
  const last = points[points.length - 1]

  return (
    <g>
      <path d={areaPath} fill={color} fillOpacity={0.08} stroke="none" />
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill={color} stroke="var(--chart-surface, #fff)" strokeWidth={2}>
          <title>
            {label ? `${label}: ` : ''}
            {p.value}/100 — {p.dateLabel}
          </title>
        </circle>
      ))}
      {showEndLabel && (
        <text x={last.x} y={last.y - 10} textAnchor="end" className="fill-slate-700 text-[11px] font-bold dark:fill-slate-200">
          {last.value}
        </text>
      )}
    </g>
  )
}

// `series` is an array of { key, label, color, values: number[] } — all sharing the same
// chronological `dates` (oldest -> newest, left to right) and a fixed 0-100 y-axis.
export default function InterviewProgressChart({ dates, series }) {
  const count = dates.length
  const xLabelStride = count > 8 ? Math.ceil(count / 8) : 1

  const plotted = series.map((s) => ({
    ...s,
    points: s.values.map((value, i) => ({
      x: scaleX(i, count),
      y: scaleY(value),
      value,
      dateLabel: formatShortDate(dates[i]),
    })),
  }))

  return (
    <div className="[--chart-surface:#fff] dark:[--chart-surface:#0f172a]">
      {series.length > 1 && (
        <div className="mb-3 flex flex-wrap items-center gap-4">
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      )}

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Interview score progress over time">
        {GRID_VALUES.map((v) => (
          <g key={v}>
            <line
              x1={PAD_LEFT}
              x2={WIDTH - PAD_RIGHT}
              y1={scaleY(v)}
              y2={scaleY(v)}
              className="stroke-slate-200 dark:stroke-slate-700/60"
              strokeWidth={1}
            />
            <text x={PAD_LEFT - 8} y={scaleY(v)} textAnchor="end" dominantBaseline="middle" className="fill-slate-400 text-[10px] dark:fill-slate-500">
              {v}
            </text>
          </g>
        ))}

        {dates.map((d, i) =>
          i % xLabelStride === 0 || i === count - 1 ? (
            <text
              key={i}
              x={scaleX(i, count)}
              y={HEIGHT - 8}
              textAnchor="middle"
              className="fill-slate-400 text-[10px] dark:fill-slate-500"
            >
              {formatShortDate(d)}
            </text>
          ) : null,
        )}

        {plotted.map((s) => (
          <Series
            key={s.key}
            points={s.points}
            color={s.color}
            label={series.length > 1 ? s.label : null}
            showEndLabel={series.length === 1}
          />
        ))}
      </svg>
    </div>
  )
}

export { SERIES_COLORS }
