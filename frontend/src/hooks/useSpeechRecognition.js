import { useCallback, useEffect, useRef, useState } from 'react'

const SpeechRecognitionImpl =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

export const isSpeechRecognitionSupported = Boolean(SpeechRecognitionImpl)

// Wraps the browser's built-in speech-to-text engine for Voice/Video mode answers. Chrome/Edge
// only — Firefox has no implementation, which InterviewModeSelect feature-detects and surfaces.
export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)
  const startTimeRef = useRef(null)
  const finalTranscriptRef = useRef('')

  useEffect(() => {
    if (!SpeechRecognitionImpl) return undefined

    const recognition = new SpeechRecognitionImpl()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscriptRef.current += `${result[0].transcript} `
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
    setTranscript('')
    startTimeRef.current = Date.now()
    setIsListening(true)
    recognitionRef.current.start()
  }, [isListening])

  // Returns a promise resolving with the final transcript + elapsed duration — the Web Speech
  // API delivers its last result(s) asynchronously after stop() is called, so callers must await
  // this rather than reading the transcript state immediately.
  const stop = useCallback(() => {
    return new Promise((resolve) => {
      const recognition = recognitionRef.current
      const durationSeconds = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0
      if (!recognition) {
        resolve({ transcript: finalTranscriptRef.current.trim(), durationSeconds })
        return
      }
      const handleEnd = () => {
        recognition.removeEventListener('end', handleEnd)
        setIsListening(false)
        resolve({ transcript: finalTranscriptRef.current.trim(), durationSeconds })
      }
      recognition.addEventListener('end', handleEnd)
      recognition.stop()
    })
  }, [])

  return { isListening, transcript, start, stop, isSupported: isSpeechRecognitionSupported }
}
