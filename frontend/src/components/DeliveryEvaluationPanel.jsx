import { Camera, Clock, Eye, Gauge, Lightbulb, Mic2, Sparkles, SpellCheck } from 'lucide-react'
import ScoreRing, { COLOR_STYLES, getScoreTier } from './ScoreRing.jsx'
import { communicationPresentationScore } from '../lib/scoreAggregation.js'

function SectionHeader({ icon: Icon, title, iconClass = 'text-slate-500 dark:text-slate-400' }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} />
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{title}</h3>
    </div>
  )
}

function StatTile({ label, value }) {
  if (value === null || value === undefined) return null
  return (
    <div className="rounded-xl border border-slate-200/50 p-3 text-center dark:border-slate-700/30">
      <p className="text-lg font-black text-slate-900 dark:text-slate-100">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  )
}

function StrengthsImprovements({ strengths, improvements }) {
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

const CAMERA_POSITIONING_LABELS = {
  well_centered: 'Well centered',
  too_close: 'Too close to camera',
  too_far: 'Too far from camera',
  off_center: 'Off-center framing',
}

// Voice/Video-only report card, rendered as an additional card alongside (below) the existing
// AnswerEvaluationPanel — never a replacement for it. `evaluation` carries the LLM's delivery-
// analysis fields (all optional; absent for Text mode, which never renders this component at
// all); `speechMetrics`/`videoMetrics` are the raw client-measured numbers so real figures (WPM,
// filler count, etc.) are shown alongside the LLM's narrative feedback, not just prose.
export default function DeliveryEvaluationPanel({ evaluation, speechMetrics, videoMetrics }) {
  const commsScore = communicationPresentationScore(evaluation)
  const tier = getScoreTier(commsScore)
  const s = COLOR_STYLES[tier.color]
  const isVideo = Boolean(videoMetrics)

  return (
    <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
      <div className={`mb-6 flex items-center gap-5 rounded-xl border px-5 py-4 ${s.wrap}`}>
        <ScoreRing score={commsScore} ringClass={s.ring} />
        <div>
          <p className={`text-xl font-bold ${s.label}`}>{tier.label}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Communication{isVideo ? ' & Presentation' : ''} Score
          </p>
        </div>
      </div>

      {speechMetrics && (
        <div className="mb-6">
          <SectionHeader icon={Gauge} title="Speaking Metrics" />
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Words / min" value={speechMetrics.words_per_minute} />
            <StatTile label="Filler words" value={speechMetrics.filler_word_count} />
            <StatTile label="Pauses" value={speechMetrics.pause_count} />
            <StatTile
              label="Clarity conf."
              value={speechMetrics.speech_confidence != null ? `${Math.round(speechMetrics.speech_confidence * 100)}%` : null}
            />
          </div>
        </div>
      )}

      <div className="mb-6 space-y-4">
        {evaluation.speaking_clarity && (
          <div>
            <SectionHeader icon={Mic2} title="Speaking Clarity" />
            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{evaluation.speaking_clarity}</p>
          </div>
        )}
        {evaluation.pronunciation_feedback && (
          <div>
            <SectionHeader icon={SpellCheck} title="Pronunciation (rough proxy)" />
            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {evaluation.pronunciation_feedback}
            </p>
          </div>
        )}
        {evaluation.grammar_feedback && (
          <div>
            <SectionHeader icon={SpellCheck} title="Grammar" />
            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{evaluation.grammar_feedback}</p>
          </div>
        )}
        {evaluation.pause_analysis && (
          <div>
            <SectionHeader icon={Clock} title="Pause Analysis" />
            <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{evaluation.pause_analysis}</p>
          </div>
        )}
      </div>

      <StrengthsImprovements
        strengths={evaluation.communication_strengths}
        improvements={evaluation.communication_improvement_suggestions}
      />

      {isVideo && (
        <>
          <div className="my-6 border-t border-slate-200/60 dark:border-white/[0.08]" />

          <div className="mb-6">
            <SectionHeader icon={Camera} title="Presentation Metrics" />
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Face visible" value={`${Math.round(videoMetrics.face_presence_ratio * 100)}%`} />
              <StatTile label="Camera engagement" value={`${Math.round(videoMetrics.camera_facing_ratio * 100)}%`} />
              <StatTile label="Head steadiness" value={videoMetrics.head_stability_score} />
              <StatTile label="Lighting" value={videoMetrics.average_brightness} />
              <StatTile label="Background motion" value={videoMetrics.background_motion_score} />
              <StatTile
                label="Camera positioning"
                value={videoMetrics.camera_positioning ? CAMERA_POSITIONING_LABELS[videoMetrics.camera_positioning] : null}
              />
            </div>
          </div>

          <div className="mb-6 space-y-4">
            {evaluation.camera_positioning_feedback && (
              <div>
                <SectionHeader icon={Eye} title="Camera Positioning" />
                <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {evaluation.camera_positioning_feedback}
                </p>
              </div>
            )}
          </div>

          <StrengthsImprovements
            strengths={evaluation.presentation_strengths}
            improvements={evaluation.presentation_improvement_suggestions}
          />
        </>
      )}
    </section>
  )
}
