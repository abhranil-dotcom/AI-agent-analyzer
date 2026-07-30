// Shared speech-delivery metrics for Voice/Video mode answers — computed entirely client-side
// from the Web Speech API's transcript + timing, then sent to the backend alongside the answer
// so the evaluator can ground communication/confidence feedback in real measured signals instead
// of guessing from text alone.

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'actually', 'basically', 'so', 'right']

export function computeSpeechMetrics(transcript, durationSeconds) {
  const words = transcript.trim().split(/\s+/).filter(Boolean)
  const minutes = Math.max(durationSeconds / 60, 1 / 60)
  const wordsPerMinute = words.length / minutes

  const fillerWords = []
  for (const filler of FILLER_WORDS) {
    const pattern = new RegExp(`\\b${filler.replace(/\s+/g, '\\s+')}\\b`, 'gi')
    const matches = transcript.match(pattern)
    if (matches) fillerWords.push(...matches.map((m) => m.toLowerCase()))
  }

  return {
    words_per_minute: Math.round(wordsPerMinute),
    filler_word_count: fillerWords.length,
    filler_words: fillerWords,
    duration_seconds: Math.round(durationSeconds),
  }
}
