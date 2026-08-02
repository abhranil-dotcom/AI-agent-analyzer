import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Loader2, Mic, Square, Volume2 } from 'lucide-react'
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis.js'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition.js'
import { useFaceLandmarker } from '../hooks/useFaceLandmarker.js'
import { usePoseLandmarker } from '../hooks/usePoseLandmarker.js'
import { useObjectDetector } from '../hooks/useObjectDetector.js'
import { useMicrophoneLevel } from '../hooks/useMicrophoneLevel.js'
import { computeSpeechMetrics } from '../lib/speechMetrics.js'
import { createVideoMetricsAccumulator, CENTER_TOLERANCE, OFF_CENTER_TOLERANCE } from '../lib/videoMetrics.js'
import { analyzeFrame, resetFrameAnalysis } from '../lib/frameAnalysis.js'
import { computePostureScore, isPostureWarning } from '../lib/postureScoring.js'

const MONITOR_INTERVAL_MS = 500
const FACE_MISSING_TICKS = 4 // ~2s at MONITOR_INTERVAL_MS
const LOW_LIGHT_TICKS = 2 // ~1s
const LOW_LIGHT_BRIGHTNESS = 25 // 0-100 scale
const LOW_MIC_TICKS = 6 // ~3s while listening
const LOW_MIC_VOLUME = 8 // 0-100 scale
const OUT_OF_FRAME_TICKS = 4 // ~2s — face detected but drifted past OFF_CENTER_TOLERANCE
const LOOKING_AWAY_TICKS = 8 // ~4s — face detected but not facing camera (tighter CENTER_TOLERANCE), sustained longer than a brief glance
const POSTURE_TICKS = 6 // ~3s — a bit more sustain than the others so single-frame pose jitter doesn't false-trigger on normal upright sitting
const MULTIPLE_PEOPLE_TICKS = 4 // ~2s
const PHONE_TICKS = 4 // ~2s — object-detector result is sticky between strides, see OBJECT_DETECTOR_STRIDE
const OBJECT_DETECTOR_STRIDE = 4 // run the (heavier) object detector only every 4th tick, ~2s cadence

const GUIDANCE_COPY = {
  faceMissing: 'Please position yourself so your face is clearly visible.',
  outOfFrame: 'Please move back into the center of the camera.',
  posture: 'Try sitting upright and facing the camera.',
  lowLight: 'Your face is difficult to see. Try improving the lighting.',
  phoneUse: 'A phone may be in use. Please avoid using your phone during the interview.',
  lookingAway: 'Try to stay engaged with the camera while answering.',
  multiplePeople: 'Please ensure only you are visible during the interview.',
  lowMic: 'Your voice is difficult to hear. Please speak a little louder.',
}

const INITIAL_GUIDANCE = {
  faceMissing: false,
  outOfFrame: false,
  posture: false,
  lowLight: false,
  phoneUse: false,
  lookingAway: false,
  multiplePeople: false,
  lowMic: false,
}

// Video mode: same TTS/STT flow as Voice, plus a live webcam preview continuously sampled by
// in-browser face/pose-landmark models and object detection (see hooks/useFaceLandmarker.js,
// hooks/usePoseLandmarker.js, hooks/useObjectDetector.js, lib/frameAnalysis.js) to derive honest,
// lightweight presentation signals — never a fabricated "AI watched your posture/background"
// claim. Camera/mic data never leaves the device. Live, non-intrusive guidance banners surface
// obvious problems (out of frame, dark, too quiet, poor posture, possible phone use, disengaged,
// multiple people) as soon as the camera is ready, not just while actively answering — they never
// interrupt or end the interview, only coach.
export default function VideoAnswerInput({ question, onSubmit, isSubmitting }) {
  const { speak, isSpeaking } = useSpeechSynthesis()
  const { isListening, transcript, start, stop } = useSpeechRecognition()
  const { loadError: landmarkerError, detectFrame } = useFaceLandmarker()
  const { detectFrame: detectPose } = usePoseLandmarker()
  const { detectFrame: detectObject } = useObjectDetector()
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [emptyWarning, setEmptyWarning] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [guidance, setGuidance] = useState(INITIAL_GUIDANCE)
  const [micStream, setMicStream] = useState(null)
  const hasSpokenRef = useRef(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const monitorTimerRef = useRef(null)
  const accumulatorRef = useRef(null)
  const isRecordingRef = useRef(false)
  const tickCountersRef = useRef({ ...Object.fromEntries(Object.keys(INITIAL_GUIDANCE).map((k) => [k, 0])) })
  const guidanceActiveRef = useRef({ ...INITIAL_GUIDANCE })
  const episodeCountersRef = useRef({ postureWarning: 0, outOfFrame: 0, multiplePeople: 0, phoneUse: 0 })
  const tickIndexRef = useRef(0)
  const lastPhoneDetectedRef = useRef(false)
  const { getVolumeLevel } = useMicrophoneLevel(micStream)

  useEffect(() => {
    if (!hasSpokenRef.current) {
      hasSpokenRef.current = true
      speak(question)
    }
  }, [question, speak])

  useEffect(() => {
    let cancelled = false
    resetFrameAnalysis()

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        setMicStream(stream)
        if (videoRef.current) videoRef.current.srcObject = stream

        // Continuous monitoring — runs for the whole time the camera is up, not just while
        // actively recording an answer, so guidance can help the candidate get positioned before
        // they even start. Feeds the per-answer accumulator/episode counters only while
        // isRecordingRef is true.
        monitorTimerRef.current = setInterval(() => {
          // Each detectFrame reads its own ref internally and safely returns null until its model
          // has finished loading — no need to gate on isReady here, which would otherwise be
          // frozen at its mount-time value inside this closure.
          const faceDetection = detectFrame(videoRef.current)
          const frameStats = analyzeFrame(videoRef.current, faceDetection)
          const poseDetection = detectPose(videoRef.current)

          tickIndexRef.current += 1
          if (tickIndexRef.current % OBJECT_DETECTOR_STRIDE === 0) {
            const objectDetection = detectObject(videoRef.current)
            if (objectDetection) lastPhoneDetectedRef.current = objectDetection.phoneDetected
          }

          const counters = tickCountersRef.current

          counters.faceMissing = faceDetection && !faceDetection.faceDetected ? counters.faceMissing + 1 : 0
          counters.lowLight =
            frameStats && frameStats.brightness < LOW_LIGHT_BRIGHTNESS ? counters.lowLight + 1 : 0

          if (isRecordingRef.current) {
            const micLevel = getVolumeLevel()
            counters.lowMic = micLevel !== null && micLevel < LOW_MIC_VOLUME ? counters.lowMic + 1 : 0
          } else {
            counters.lowMic = 0
          }

          const isOffCenter =
            faceDetection?.faceDetected &&
            (Math.abs(faceDetection.centerOffsetX) > OFF_CENTER_TOLERANCE ||
              Math.abs(faceDetection.centerOffsetY) > OFF_CENTER_TOLERANCE)
          counters.outOfFrame = isOffCenter ? counters.outOfFrame + 1 : 0

          const isNotFacing =
            faceDetection?.faceDetected &&
            (Math.abs(faceDetection.centerOffsetX) > CENTER_TOLERANCE ||
              Math.abs(faceDetection.centerOffsetY) > CENTER_TOLERANCE)
          counters.lookingAway = isNotFacing ? counters.lookingAway + 1 : 0

          const postureWarn = poseDetection ? isPostureWarning(poseDetection) : false
          counters.posture = postureWarn ? counters.posture + 1 : 0

          const multiplePeopleNow = Boolean(faceDetection?.faceCount > 1)
          counters.multiplePeople = multiplePeopleNow ? counters.multiplePeople + 1 : 0

          counters.phoneUse = lastPhoneDetectedRef.current ? counters.phoneUse + 1 : 0

          const nextActive = {
            faceMissing: counters.faceMissing >= FACE_MISSING_TICKS,
            outOfFrame: counters.outOfFrame >= OUT_OF_FRAME_TICKS,
            posture: counters.posture >= POSTURE_TICKS,
            lowLight: counters.lowLight >= LOW_LIGHT_TICKS,
            phoneUse: counters.phoneUse >= PHONE_TICKS,
            lookingAway: counters.lookingAway >= LOOKING_AWAY_TICKS,
            multiplePeople: counters.multiplePeople >= MULTIPLE_PEOPLE_TICKS,
            lowMic: counters.lowMic >= LOW_MIC_TICKS,
          }

          // Discrete "episode" counts for the final report — only count the OFF→ON transition of
          // the debounced banner state, not every raw tick, so "3 posture warnings" means 3
          // distinct sustained incidents, not 3 seconds' worth of ticks. Only while recording, so
          // per-answer counts reflect that answer, not idle time before "Start Answering".
          if (isRecordingRef.current) {
            const prevActive = guidanceActiveRef.current
            if (nextActive.posture && !prevActive.posture) episodeCountersRef.current.postureWarning += 1
            if (nextActive.outOfFrame && !prevActive.outOfFrame) episodeCountersRef.current.outOfFrame += 1
            if (nextActive.multiplePeople && !prevActive.multiplePeople) episodeCountersRef.current.multiplePeople += 1
            if (nextActive.phoneUse && !prevActive.phoneUse) episodeCountersRef.current.phoneUse += 1
          }
          guidanceActiveRef.current = nextActive
          setGuidance(nextActive)

          if (isRecordingRef.current && accumulatorRef.current && faceDetection) {
            accumulatorRef.current.addSample({
              ...faceDetection,
              ...frameStats,
              postureScore: poseDetection ? computePostureScore(poseDetection) : null,
            })
          }
        }, MONITOR_INTERVAL_MS)
      })
      .catch(() => {
        setCameraError(
          'Camera access was denied or unavailable — you can still answer, just without presentation feedback.',
        )
      })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (monitorTimerRef.current) clearInterval(monitorTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- detector readiness/detectFrame fns are stable enough per mount; re-running this effect would re-request the camera
  }, [])

  function beginRecording() {
    accumulatorRef.current = createVideoMetricsAccumulator()
    // Fresh per-answer state: a problem sustained before the candidate hit "Start Answering"
    // shouldn't instantly count as an episode the moment recording begins — it has to be sustained
    // again within the recording window, matching how the accumulator itself starts clean.
    tickCountersRef.current = { ...Object.fromEntries(Object.keys(INITIAL_GUIDANCE).map((k) => [k, 0])) }
    guidanceActiveRef.current = { ...INITIAL_GUIDANCE }
    episodeCountersRef.current = { postureWarning: 0, outOfFrame: 0, multiplePeople: 0, phoneUse: 0 }
    isRecordingRef.current = true
    start()
  }

  async function handleStop() {
    isRecordingRef.current = false
    setIsFinalizing(true)
    const { transcript: finalTranscript, durationSeconds, ...recognitionMetrics } = await stop()
    setIsFinalizing(false)
    if (!finalTranscript) {
      setEmptyWarning(true)
      return
    }
    setEmptyWarning(false)
    const videoMetrics = accumulatorRef.current?.finalize(episodeCountersRef.current)
    onSubmit(finalTranscript, {
      speechMetrics: computeSpeechMetrics(finalTranscript, durationSeconds, recognitionMetrics),
      // Only send video metrics if we actually collected samples — an all-zero object would be a
      // fabricated claim, not a real measurement.
      videoMetrics: videoMetrics?.sample_count > 0 ? videoMetrics : null,
    })
  }

  const busy = isSubmitting || isFinalizing
  const activeBanners = Object.entries(guidance).filter(([, active]) => active)

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

      {activeBanners.length > 0 && (
        <div className="mb-4 flex flex-col gap-2">
          {activeBanners.map(([key]) => (
            <div
              key={key}
              className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400"
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {GUIDANCE_COPY[key]}
            </div>
          ))}
        </div>
      )}

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
