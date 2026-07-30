import { useCallback, useEffect, useState } from 'react'

const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

// Reads interview questions aloud for Voice/Video mode via the browser's built-in TTS engine —
// zero backend/infra cost, no new Azure resource needed.
export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    return () => {
      if (isSupported) window.speechSynthesis.cancel()
    }
  }, [])

  const speak = useCallback((text) => {
    if (!isSupported || !text) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }, [])

  const cancel = useCallback(() => {
    if (isSupported) window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  return { speak, cancel, isSpeaking, isSupported }
}
