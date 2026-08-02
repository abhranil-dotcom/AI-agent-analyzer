import { useEffect, useRef, useState } from 'react'

// Same MediaPipe CDN-hosted WASM runtime as useFaceLandmarker.js — the "lite" pose model, chosen
// over "full"/"heavy" to keep this affordable to run alongside the face landmarker every tick.
const WASM_BASE_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
const MODEL_ASSET_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

// Module-level singleton, same reasoning as useFaceLandmarker.js: expensive to initialize,
// stateless per-frame, reused across every VideoAnswerInput mount in the session.
let landmarkerPromise = null

async function loadPoseLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL)
      return PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_ASSET_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numPoses: 1,
        // Segmentation masks are the expensive part of pose inference and unused here — only
        // landmark coordinates are needed for a shoulder-tilt/head-alignment proxy.
        outputSegmentationMasks: false,
      })
    })()
  }
  return landmarkerPromise
}

// Presentation-only posture signal for Video mode: is the candidate roughly upright and squarely
// facing the camera, derived from BlazePose's shoulder (11/12) and nose (0) landmarks. Runs fully
// in-browser (WASM) — no frame ever leaves the device. Deliberately exposes only a tilt angle and
// a horizontal offset, never full body landmarks — this is camera-framing coaching, not body-
// language or personality inference (see lib/postureScoring.js).
export function usePoseLandmarker() {
  const [isReady, setIsReady] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const landmarkerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    loadPoseLandmarker()
      .then((landmarker) => {
        if (cancelled) return
        landmarkerRef.current = landmarker
        setIsReady(true)
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function detectFrame(videoEl) {
    const landmarker = landmarkerRef.current
    if (!landmarker || !videoEl || videoEl.readyState < 2) return null

    const result = landmarker.detectForVideo(videoEl, performance.now())
    const landmarks = result.landmarks?.[0]
    if (!landmarks?.length) {
      return { poseDetected: false, shoulderTiltDegrees: 0, headShoulderOffsetX: 0 }
    }

    // BlazePose's 33-point topology: 0 = nose, 11 = left shoulder, 12 = right shoulder.
    const nose = landmarks[0]
    const leftShoulder = landmarks[11]
    const rightShoulder = landmarks[12]

    const shoulderTiltDegrees =
      (Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x) * 180) / Math.PI
    const headShoulderOffsetX = nose.x - (leftShoulder.x + rightShoulder.x) / 2

    return { poseDetected: true, shoulderTiltDegrees, headShoulderOffsetX }
  }

  return { isReady, loadError, detectFrame }
}
