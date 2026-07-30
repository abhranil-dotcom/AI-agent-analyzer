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
