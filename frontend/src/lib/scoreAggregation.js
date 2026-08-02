// Derives the "Communication & Presentation Score" shown for Voice/Video mode reports — the mean
// of communication_score + confidence_score (+ presentation_score for Video). Computed here
// rather than by the LLM so it's deterministic and identical everywhere it's shown (per-turn
// panel, session summary, saved history) — Technical Score stays `technical_score` as-is.
export function communicationPresentationScore(evaluation) {
  const parts = [evaluation.communication_score, evaluation.confidence_score]
  if (evaluation.presentation_score !== null && evaluation.presentation_score !== undefined) {
    parts.push(evaluation.presentation_score)
  }
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length)
}

export function averageScore(evaluations, field) {
  const values = evaluations.map((e) => e[field]).filter((v) => typeof v === 'number')
  if (values.length === 0) return null
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length)
}

export function averageCommunicationPresentationScore(evaluations) {
  if (evaluations.length === 0) return null
  const scores = evaluations.map(communicationPresentationScore)
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

// Generic helpers for aggregating a field across an array of speech/video metrics objects (as
// opposed to `averageScore`, which reads from `AnswerEvaluation` objects) — used by
// InterviewPerformanceReport.jsx to build the session-level Voice & Communication / Video &
// Presentation stat tiles from real per-turn measurements, never from LLM text.
//
// Deliberately NOT rounded here: some fields are already 0-100 (fluency_score, posture_score),
// others are 0-1 fractions destined to be multiplied by 100 for display (speech_confidence,
// face_presence_ratio, camera_facing_ratio) — rounding at this layer would collapse any fraction
// below 0.5 to 0 and anything else to 1 before that multiplication. Callers round after any
// necessary scaling.
export function averageMetricField(metricsArray, field) {
  const values = metricsArray.map((m) => m?.[field]).filter((v) => typeof v === 'number')
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function sumMetricField(metricsArray, field) {
  const values = metricsArray.map((m) => m?.[field]).filter((v) => typeof v === 'number')
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0)
}
