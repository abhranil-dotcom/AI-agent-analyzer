import { useCallback, useEffect, useRef, useState } from 'react'

// Web Audio API RMS volume meter, reusing the MediaStream Video mode already has permission for
// (no second getUserMedia prompt) — used only to detect "microphone too quiet" for live guidance.
export function useMicrophoneLevel(stream) {
  const [isReady, setIsReady] = useState(false)
  const analyserRef = useRef(null)
  const dataArrayRef = useRef(null)

  useEffect(() => {
    if (!stream || stream.getAudioTracks().length === 0) return undefined

    const AudioContextImpl = window.AudioContext || window.webkitAudioContext
    if (!AudioContextImpl) return undefined

    const audioContext = new AudioContextImpl()
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 512
    source.connect(analyser)

    analyserRef.current = analyser
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)
    setIsReady(true)

    return () => {
      source.disconnect()
      audioContext.close().catch(() => {})
      analyserRef.current = null
      setIsReady(false)
    }
  }, [stream])

  // Returns a 0-100 RMS-based volume level, or null if not ready.
  const getVolumeLevel = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return null
    analyserRef.current.getByteTimeDomainData(dataArrayRef.current)
    let sumSquares = 0
    for (const value of dataArrayRef.current) {
      const normalized = (value - 128) / 128
      sumSquares += normalized * normalized
    }
    const rms = Math.sqrt(sumSquares / dataArrayRef.current.length)
    return Math.round(Math.min(1, rms * 4) * 100)
  }, [])

  return { isReady, getVolumeLevel }
}
