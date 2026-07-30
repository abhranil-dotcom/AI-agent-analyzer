import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Loader2, Mic, Square, Volume2 } from 'lucide-react'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis.js'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition.js'
import { computeSpeechMetrics } from '../lib/speechMetrics.js'

// Voice mode: the AI reads the question aloud (TTS), the candidate answers only via microphone
// (STT) — no textarea. Mount this keyed by question id so each question gets a clean slate.
export default function VoiceAnswerInput({ question, onSubmit, isSubmitting }) {
  const { speak, isSpeaking } = useSpeechSynthesis()
  const { isListening, transcript, start, stop } = useSpeechRecognition()
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [emptyWarning, setEmptyWarning] = useState(false)
  const hasSpokenRef = useRef(false)

  useEffect(() => {
    if (!hasSpokenRef.current) {
      hasSpokenRef.current = true
      speak(question)
    }
  }, [question, speak])

  async function handleStop() {
    setIsFinalizing(true)
    const { transcript: finalTranscript, durationSeconds } = await stop()
    setIsFinalizing(false)
    if (!finalTranscript) {
      setEmptyWarning(true)
      return
    }
    setEmptyWarning(false)
    onSubmit(finalTranscript, { speechMetrics: computeSpeechMetrics(finalTranscript, durationSeconds) })
  }

  const busy = isSubmitting || isFinalizing

  return (
    <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Your Answer (Voice)
        </span>
        <button
          type="button"
          onClick={() => speak(question)}
          disabled={isSpeaking || isListening}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700 disabled:opacity-50 dark:text-brand-400"
        >
          <Volume2 className="h-3.5 w-3.5" />
          {isSpeaking ? 'Reading question…' : 'Replay question'}
        </button>
      </div>

      {transcript && (
        <p className="mb-4 rounded-xl border border-slate-200/50 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 dark:border-slate-700/30 dark:bg-slate-800/40 dark:text-slate-300">
          {transcript}
        </p>
      )}

      {emptyWarning && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          No speech detected — try recording your answer again.
        </div>
      )}

      <button
        type="button"
        onClick={isListening ? handleStop : start}
        disabled={busy}
        className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
          isListening
            ? 'bg-red-500 shadow-red-500/25 hover:opacity-90'
            : 'bg-gradient-to-r from-brand-600 to-accent-500 shadow-brand-500/25 hover:opacity-90'
        }`}
      >
        {isFinalizing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Finishing…
          </>
        ) : isListening ? (
          <>
            <Square className="h-4 w-4" />
            Stop &amp; Submit
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            Start Answering
          </>
        )}
      </button>
    </section>
  )
}
