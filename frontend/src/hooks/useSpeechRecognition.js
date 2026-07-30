import { useCallback, useEffect, useRef, useState } from 'react'

const SpeechRecognitionImpl =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

export const isSpeechRecognitionSupported = Boolean(SpeechRecognitionImpl)

// A gap between recognizer events longer than this is treated as a pause. The Web Speech API has
// no per-word timestamps, so this is a coarse proxy — "gap between recognized speech activity" —
// not a precise measurement of silence.
const PAUSE_THRESHOLD_MS = 1200

// Wraps the browser's built-in speech-to-text engine for Voice/Video mode answers. Chrome/Edge
// only — Firefox has no implementation, which InterviewModeSelect feature-detects and surfaces.
export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)
  const startTimeRef = useRef(null)
  const finalTranscriptRef = useRef('')
  const confidencesRef = useRef([])
  const lastActivityTimeRef = useRef(null)
  const pauseCountRef = useRef(0)
  const longestPauseRef = useRef(0)
  const totalPauseRef = useRef(0)

  useEffect(() => {
    if (!SpeechRecognitionImpl) return undefined

    const recognition = new SpeechRecognitionImpl()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      const now = Date.now()
      if (lastActivityTimeRef.current !== null) {
        const gapMs = now - lastActivityTimeRef.current
        if (gapMs > PAUSE_THRESHOLD_MS) {
          const gapSeconds = gapMs / 1000
          pauseCountRef.current += 1
          totalPauseRef.current += gapSeconds
          longestPauseRef.current = Math.max(longestPauseRef.current, gapSeconds)
        }
      }
      lastActivityTimeRef.current = now

      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscriptRef.current += `${result[0].transcript} `
          if (typeof result[0].confidence === 'number') confidencesRef.current.push(result[0].confidence)
        } else {
          interim += result[0].transcript
        }
      }
      setTranscript(`${finalTranscriptRef.current}${interim}`.trim())
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    return () => {
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      recognition.stop()
    }
  }, [])

  const start = useCallback(() => {
    if (!recognitionRef.current || isListening) return
    finalTranscriptRef.current = ''
    confidencesRef.current = []
    lastActivityTimeRef.current = null
    pauseCountRef.current = 0
    longestPauseRef.current = 0
    totalPauseRef.current = 0
    setTranscript('')
    startTimeRef.current = Date.now()
    setIsListening(true)
    recognitionRef.current.start()
  }, [isListening])

  // Returns a promise resolving with the final transcript, elapsed duration, average recognizer
  // confidence, and pause stats — the Web Speech API delivers its last result(s) asynchronously
  // after stop() is called, so callers must await this rather than reading state immediately.
  const stop = useCallback(() => {
    return new Promise((resolve) => {
      const recognition = recognitionRef.current
      const durationSeconds = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0
      const buildResult = () => {
        const confidences = confidencesRef.current
        const avgConfidence =
          confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : null
        return {
          transcript: finalTranscriptRef.current.trim(),
          durationSeconds,
          avgConfidence,
          pauseCount: pauseCountRef.current,
          longestPauseSeconds: longestPauseRef.current,
          totalPauseSeconds: totalPauseRef.current,
        }
      }
      if (!recognition) {
        resolve(buildResult())
        return
      }
      const handleEnd = () => {
        recognition.removeEventListener('end', handleEnd)
        setIsListening(false)
        resolve(buildResult())
      }
      recognition.addEventListener('end', handleEnd)
      recognition.stop()
    })
  }, [])

  return { isListening, transcript, start, stop, isSupported: isSpeechRecognitionSupported }
}
