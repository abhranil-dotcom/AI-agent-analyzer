import { Camera, Mic2, Sparkles, Trophy } from 'lucide-react'
import ScoreRing, { COLOR_STYLES, getScoreTier } from './ScoreRing.jsx'
import { CAMERA_POSITIONING_LABELS, SectionHeader, StatTile, StrengthsImprovements } from './ReportPrimitives.jsx'
import { averageMetricField, averageScore, sumMetricField } from '../lib/scoreAggregation.js'

function dedupe(values) {
  return [...new Set(values.filter(Boolean))]
}

function mostFrequent(values) {
  if (values.length === 0) return null
  const counts = {}
  for (const v of values) counts[v] = (counts[v] ?? 0) + 1
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
}

function classifyBackgroundQuality(score) {
  if (score === null || score === undefined) return null
  if (score < 30) return 'Clean / still'
  if (score < 60) return 'Some background movement'
  return 'Busy / distracting'
}

// Deterministic, threshold-based labels from real measured signals — never LLM-authored — so
// "Areas for improvement" names concrete, data-backed themes rather than vague prose.
function deriveAreasForImprovement({ avgFluency, totalFillerWords, avgPosture, avgCameraFacing, outOfFrameEvents, phoneUseEvents, multiplePersonEvents }) {
  const areas = []
  if (avgFluency !== null && avgFluency < 70) areas.push('Speaking fluency')
  if (totalFillerWords !== null && totalFillerWords >= 5) areas.push('Filler words')
  if (avgPosture !== null && avgPosture < 70) areas.push('Sitting posture')
  if (avgCameraFacing !== null && avgCameraFacing < 0.6) areas.push('Eye contact with the camera')
  if (outOfFrameEvents) areas.push('Staying centered in frame')
  if (phoneUseEvents) areas.push('Avoiding phone use during the interview')
  if (multiplePersonEvents) areas.push('Keeping only yourself visible on camera')
  return areas
}

// Detailed end-of-session report for Voice/Video mode, replacing the terse tile grid that used to
// be the only summary shown. Mode-aware (`voice` skips the Video & Presentation section entirely).
// Works identically for a live in-progress session (MockInterviewPage.jsx) and a saved historical
// one (InterviewHistoryDetailPage.jsx) — both pass the same normalized `entries` shape. Every
// number here traces to a real client-measured metric or a server-computed score average; nothing
// is invented — fields simply don't render when the underlying measurement is absent.
export default function InterviewPerformanceReport({ mode, entries }) {
  const evaluations = entries.map((e) => e.evaluation).filter(Boolean)
  const speechMetricsList = entries.map((e) => e.speechMetrics).filter(Boolean)
  const videoMetricsList = mode === 'video' ? entries.map((e) => e.videoMetrics).filter(Boolean) : []

  const overallScore = averageScore(evaluations, 'score')
  const technicalScore = averageScore(evaluations, 'technical_score')
  const communicationScore = averageScore(evaluations, 'communication_score')
  const presentationScore = mode === 'video' ? averageScore(evaluations, 'presentation_score') : null

  const avgWpm = averageMetricField(speechMetricsList, 'words_per_minute')
  const totalFillerWords = sumMetricField(speechMetricsList, 'filler_word_count')
  const totalPauses = sumMetricField(speechMetricsList, 'pause_count')
  const avgFluency = averageMetricField(speechMetricsList, 'fluency_score')
  const avgClarityConfidence = averageMetricField(speechMetricsList, 'speech_confidence')

  const avgFacePresence = averageMetricField(videoMetricsList, 'face_presence_ratio')
  const avgCameraFacing = averageMetricField(videoMetricsList, 'camera_facing_ratio')
  const avgPosture = averageMetricField(videoMetricsList, 'posture_score')
  const avgBrightness = averageMetricField(videoMetricsList, 'average_brightness')
  const avgBackgroundMotion = averageMetricField(videoMetricsList, 'background_motion_score')
  const outOfFrameEvents = sumMetricField(videoMetricsList, 'out_of_frame_events')
  const postureWarnings = sumMetricField(videoMetricsList, 'posture_warning_events')
  const phoneUseEvents = sumMetricField(videoMetricsList, 'phone_use_events')
  const multiplePersonEvents = sumMetricField(videoMetricsList, 'multiple_person_events')
  const framingBucket = mostFrequent(videoMetricsList.map((v) => v.camera_positioning).filter(Boolean))

  const strengths = dedupe(evaluations.flatMap((e) => [...(e.communication_strengths ?? []), ...(e.presentation_strengths ?? [])]))
  const areasForImprovement = deriveAreasForImprovement({
    avgFluency,
    totalFillerWords,
    avgPosture,
    avgCameraFacing,
    outOfFrameEvents,
    phoneUseEvents,
    multiplePersonEvents,
  })
  const recommendations = dedupe(
    evaluations.flatMap((e) => [...(e.communication_improvement_suggestions ?? []), ...(e.presentation_improvement_suggestions ?? [])]),
  )

  const performanceTiles = [
    { label: 'Overall', score: overallScore },
    { label: 'Technical', score: technicalScore },
    { label: 'Communication', score: communicationScore },
    ...(presentationScore !== null ? [{ label: 'Presentation', score: presentationScore }] : []),
  ].filter((t) => t.score !== null)

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
        <SectionHeader icon={Trophy} title="Interview Performance" iconClass="text-brand-600 dark:text-brand-400" />
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {performanceTiles.map(({ label, score }) => {
            const tier = getScoreTier(score)
            const c = COLOR_STYLES[tier.color]
            return (
              <div key={label} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${c.wrap}`}>
                <ScoreRing score={score} ringClass={c.ring} size={48} />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
        <SectionHeader icon={Mic2} title="Voice & Communication" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label="Speaking pace" value={avgWpm !== null ? `${Math.round(avgWpm)} WPM` : null} />
          <StatTile label="Filler words" value={totalFillerWords} />
          <StatTile label="Long pauses" value={totalPauses} />
          <StatTile label="Fluency" value={avgFluency !== null ? Math.round(avgFluency) : null} />
          <StatTile label="Clarity confidence" value={avgClarityConfidence !== null ? `${Math.round(avgClarityConfidence * 100)}%` : null} />
          <StatTile label="Communication score" value={communicationScore} />
        </div>
      </section>

      {mode === 'video' && videoMetricsList.length > 0 && (
        <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
          <SectionHeader icon={Camera} title="Video & Presentation" />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Face visible" value={avgFacePresence !== null ? `${Math.round(avgFacePresence * 100)}%` : null} />
            <StatTile label="Camera framing" value={framingBucket ? CAMERA_POSITIONING_LABELS[framingBucket] : null} />
            <StatTile label="Camera engagement" value={avgCameraFacing !== null ? `${Math.round(avgCameraFacing * 100)}%` : null} />
            <StatTile label="Posture" value={avgPosture !== null ? Math.round(avgPosture) : null} />
            <StatTile label="Lighting" value={avgBrightness !== null ? Math.round(avgBrightness) : null} />
            <StatTile label="Background quality" value={classifyBackgroundQuality(avgBackgroundMotion)} />
            <StatTile label="Out-of-frame events" value={outOfFrameEvents} />
            <StatTile label="Posture warnings" value={postureWarnings} />
            <StatTile label="Possible phone-use events" value={phoneUseEvents} />
            <StatTile label="Multiple-person events" value={multiplePersonEvents} />
          </div>
        </section>
      )}

      {(strengths.length > 0 || areasForImprovement.length > 0 || recommendations.length > 0) && (
        <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
          <SectionHeader icon={Sparkles} title="Interview Coach Summary" iconClass="text-brand-600 dark:text-brand-400" />
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {strengths.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Strengths</p>
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
            {areasForImprovement.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Areas for Improvement</p>
                <ul className="mt-3 space-y-2">
                  {areasForImprovement.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/70" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {recommendations.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Recommendations</p>
                <ol className="mt-3 space-y-2">
                  {recommendations.map((item, i) => (
                    <li key={i} className="text-sm text-slate-700 dark:text-slate-300">
                      {i + 1}. {item}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
