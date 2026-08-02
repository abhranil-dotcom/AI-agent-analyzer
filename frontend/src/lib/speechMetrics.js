// Shared speech-delivery metrics for Voice/Video mode answers — computed entirely client-side
// from the Web Speech API's transcript + timing, then sent to the backend alongside the answer
// so the evaluator can ground communication/confidence feedback in real measured signals instead
// of guessing from text alone.

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'actually', 'basically', 'so', 'right']

// Comfortable conversational pace for an interview answer — outside this band, fluency score
// degrades. Not a strict rule, just the center of typical "clear and unhurried" delivery.
const IDEAL_WPM_LOW = 110
const IDEAL_WPM_HIGH = 160

// Deterministic 0-100 heuristic — never an LLM guess — from three signals already computed here:
// how filler-heavy the answer was, how far pace strayed from a comfortable band, and (when pause
// timing is available) how much of the answer was spent paused. Capped per-factor so no single
// signal can single-handedly zero out the score.
function computeFluencyScore(wordCount, fillerWordCount, wordsPerMinute, durationSeconds, totalPauseSeconds) {
  let score = 100

  const fillerRatio = wordCount > 0 ? fillerWordCount / wordCount : 0
  score -= Math.min(40, fillerRatio * 200)

  const paceDeviation =
    wordsPerMinute < IDEAL_WPM_LOW
      ? IDEAL_WPM_LOW - wordsPerMinute
      : wordsPerMinute > IDEAL_WPM_HIGH
        ? wordsPerMinute - IDEAL_WPM_HIGH
        : 0
  score -= Math.min(30, paceDeviation * 0.5)

  if (totalPauseSeconds !== null && durationSeconds > 0) {
    const pauseRatio = totalPauseSeconds / durationSeconds
    score -= Math.min(30, pauseRatio * 100)
  }

  return Math.max(0, Math.round(score))
}

// `recognitionMetrics` carries the raw signals useSpeechRecognition's stop() resolves with
// (avgConfidence, pauseCount, longestPauseSeconds, totalPauseSeconds) — optional so this function
// still works if only a transcript/duration are available.
export function computeSpeechMetrics(transcript, durationSeconds, recognitionMetrics = {}) {
  const words = transcript.trim().split(/\s+/).filter(Boolean)
  const minutes = Math.max(durationSeconds / 60, 1 / 60)
  const wordsPerMinute = words.length / minutes

  const fillerWords = []
  for (const filler of FILLER_WORDS) {
    const pattern = new RegExp(`\\b${filler.replace(/\s+/g, '\\s+')}\\b`, 'gi')
    const matches = transcript.match(pattern)
    if (matches) fillerWords.push(...matches.map((m) => m.toLowerCase()))
  }

  const { avgConfidence = null, pauseCount = null, longestPauseSeconds = null, totalPauseSeconds = null } =
    recognitionMetrics

  return {
    words_per_minute: Math.round(wordsPerMinute),
    filler_word_count: fillerWords.length,
    filler_words: fillerWords,
    duration_seconds: Math.round(durationSeconds),
    fluency_score: computeFluencyScore(words.length, fillerWords.length, wordsPerMinute, durationSeconds, totalPauseSeconds),
    ...(avgConfidence !== null && { speech_confidence: Math.round(avgConfidence * 100) / 100 }),
    ...(pauseCount !== null && {
      pause_count: pauseCount,
      longest_pause_seconds: Math.round(longestPauseSeconds * 10) / 10,
      total_pause_seconds: Math.round(totalPauseSeconds * 10) / 10,
    }),
  }
}
