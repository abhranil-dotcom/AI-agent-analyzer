import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Minus, Sparkles, TrendingDown, TrendingUp } from 'lucide-react'
import { compareResumeHistory } from '../api/client.js'
import ChipList from '../components/ChipList.jsx'
import ScoreRing, { COLOR_STYLES, getScoreTier } from '../components/ScoreRing.jsx'
import AnalysisSkeleton from '../components/AnalysisSkeleton.jsx'

const IMPROVEMENT_CHIP_CLASS =
  'border-emerald-300/70 bg-emerald-100 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300'

function computeImprovements(a, b) {
  return {
    improvedSkills: b.analysis.skills.filter((s) => !a.analysis.skills.includes(s)),
    reducedWeaknesses: a.analysis.weaknesses.filter((w) => !b.analysis.weaknesses.includes(w)),
    lowerSkillGaps: a.analysis.missing_skills.filter((s) => !b.analysis.missing_skills.includes(s)),
  }
}

function ResumeColumn({ entry }) {
  const tier = getScoreTier(entry.analysis.ats_score)
  const s = COLOR_STYLES[tier.color]

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80">
      <div>
        <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{entry.resume_filename}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(entry.uploaded_at).toLocaleDateString()}</p>
      </div>
      <div className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${s.wrap}`}>
        <ScoreRing score={entry.analysis.ats_score} ringClass={s.ring} size={56} />
        <p className={`text-sm font-bold ${s.label}`}>{tier.label}</p>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Strengths</p>
        <ul className="mt-2 space-y-1.5">
          {entry.analysis.strengths.map((item) => (
            <li key={item} className="text-sm text-slate-700 dark:text-slate-300">
              + {item}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Weaknesses</p>
        <ul className="mt-2 space-y-1.5">
          {entry.analysis.weaknesses.map((item) => (
            <li key={item} className="text-sm text-slate-700 dark:text-slate-300">
              &minus; {item}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Missing Skills</p>
        <ChipList items={entry.analysis.missing_skills} chipClass={s.badge} />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Suggestions</p>
        <ol className="mt-2 space-y-1.5">
          {entry.analysis.suggestions.map((item, i) => (
            <li key={i} className="text-sm text-slate-700 dark:text-slate-300">
              {i + 1}. {item}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export default function ResumeComparePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const idA = searchParams.get('a')
  const idB = searchParams.get('b')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!idA || !idB) {
      setError('Two resumes must be selected to compare.')
      return
    }
    compareResumeHistory(idA, idB)
      .then(setData)
      .catch((err) => setError(err.response?.data?.detail ?? 'Could not load this comparison.'))
  }, [idA, idB])

  const delta = data ? data.b.analysis.ats_score - data.a.analysis.ats_score : 0
  const improvements = data ? computeImprovements(data.a, data.b) : null
  const hasImprovements =
    improvements &&
    (improvements.improvedSkills.length > 0 ||
      improvements.reducedWeaknesses.length > 0 ||
      improvements.lowerSkillGaps.length > 0)

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

      {!data && !error && <AnalysisSkeleton />}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {data && (
        <>
          <div className="mb-6 flex items-center justify-center gap-2 rounded-xl border border-slate-200/60 bg-white/90 px-4 py-3 text-sm font-bold shadow-xl backdrop-blur-xl dark:border-white/[0.08] dark:bg-slate-900/80">
            {delta > 0 && <TrendingUp className="h-4 w-4 text-emerald-500" />}
            {delta < 0 && <TrendingDown className="h-4 w-4 text-red-500" />}
            {delta === 0 && <Minus className="h-4 w-4 text-slate-400" />}
            <span
              className={
                delta > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : delta < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-500 dark:text-slate-400'
              }
            >
              ATS Score {delta > 0 ? `improved by ${delta}` : delta < 0 ? `dropped by ${Math.abs(delta)}` : 'unchanged'}
            </span>
          </div>

          {hasImprovements && (
            <section className="mb-6 rounded-2xl border border-emerald-200/50 bg-emerald-500/[0.04] p-6 dark:border-emerald-800/30 dark:bg-emerald-950/20">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">What Improved</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {improvements.improvedSkills.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Improved Skills</p>
                    <ChipList items={improvements.improvedSkills} chipClass={IMPROVEMENT_CHIP_CLASS} />
                  </div>
                )}
                {improvements.reducedWeaknesses.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Reduced Weaknesses</p>
                    <ChipList items={improvements.reducedWeaknesses} chipClass={IMPROVEMENT_CHIP_CLASS} />
                  </div>
                )}
                {improvements.lowerSkillGaps.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Lower Skill Gaps</p>
                    <ChipList items={improvements.lowerSkillGaps} chipClass={IMPROVEMENT_CHIP_CLASS} />
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ResumeColumn entry={data.a} />
            <ResumeColumn entry={data.b} />
          </div>
        </>
      )}
    </>
  )
}
