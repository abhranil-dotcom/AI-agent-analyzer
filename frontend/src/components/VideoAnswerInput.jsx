import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Loader2, Mic, Square, Volume2 } from 'lucide-react'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis.js'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition.js'
import { useFaceLandmarker } from '../hooks/useFaceLandmarker.js'
import { computeSpeechMetrics } from '../lib/speechMetrics.js'
import { createVideoMetricsAccumulator } from '../lib/videoMetrics.js'

const SAMPLE_INTERVAL_MS = 500

// Video mode: same TTS/STT flow as Voice, plus a live webcam preview sampled periodically by an
// in-browser face-landmark model (see hooks/useFaceLandmarker.js) to derive honest, lightweight
// presentation signals (camera-facing ratio, head-stability) — never a fabricated "AI watched
// your posture" claim. Camera frames never leave the device.
export default function VideoAnswerInput({ question, onSubmit, isSubmitting }) {
  const { speak, isSpeaking } = useSpeechSynthesis()
  const { isListening, transcript, start, stop } = useSpeechRecognition()
  const { isReady: isLandmarkerReady, loadError: landmarkerError, detectFrame } = useFaceLandmarker()
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [emptyWarning, setEmptyWarning] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const hasSpokenRef = useRef(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const sampleTimerRef = useRef(null)
  const accumulatorRef = useRef(null)

  useEffect(() => {
    if (!hasSpokenRef.current) {
      hasSpokenRef.current = true
      speak(question)
    }
  }, [question, speak])

  useEffect(() => {
    let cancelled = false
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => {
        setCameraError(
          'Camera access was denied or unavailable — you can still answer, just without presentation feedback.',
        )
      })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (sampleTimerRef.current) clearInterval(sampleTimerRef.current)
    }
  }, [])

  function beginRecording() {
    accumulatorRef.current = createVideoMetricsAccumulator()
    if (isLandmarkerReady && !cameraError) {
      sampleTimerRef.current = setInterval(() => {
        const detection = detectFrame(videoRef.current)
        if (detection) accumulatorRef.current.addSample(detection)
      }, SAMPLE_INTERVAL_MS)
    }
    start()
  }

  async function handleStop() {
    if (sampleTimerRef.current) {
      clearInterval(sampleTimerRef.current)
      sampleTimerRef.current = null
    }
    setIsFinalizing(true)
    const { transcript: finalTranscript, durationSeconds } = await stop()
    setIsFinalizing(false)
    if (!finalTranscript) {
      setEmptyWarning(true)
      return
    }
    setEmptyWarning(false)
    const videoMetrics = accumulatorRef.current?.finalize()
    onSubmit(finalTranscript, {
      speechMetrics: computeSpeechMetrics(finalTranscript, durationSeconds),
      // Only send video metrics if we actually collected samples — an all-zero object would be a
      // fabricated claim, not a real measurement.
      videoMetrics: videoMetrics?.sample_count > 0 ? videoMetrics : null,
    })
  }

  const busy = isSubmitting || isFinalizing

  return (
    <section className="rounded-2xl border border-slate-200/60 bg-white/90 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-white/[0.08] dark:bg-slate-900/80">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Your Answer (Video)
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

      <div className="mb-4 overflow-hidden rounded-xl border border-slate-200/50 bg-slate-900 dark:border-slate-700/30">
        <video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full object-cover" />
      </div>

      {cameraError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {cameraError}
        </div>
      )}
      {landmarkerError && !cameraError && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Presentation analysis couldn't load — you can still answer, just without eye-contact/steadiness feedback.
        </div>
      )}

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
        onClick={isListening ? handleStop : beginRecording}
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
