import { useEffect, useRef, useState } from 'react'

// MediaPipe's own CDN-hosted WASM runtime + model asset — the standard loading pattern from
// MediaPipe's docs, since bundling these multi-megabyte binaries via Vite isn't practical.
const WASM_BASE_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
const MODEL_ASSET_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

// Module-level singleton: the landmarker is expensive to initialize and stateless per-frame, so
// every VideoAnswerInput mount across the session reuses the same loaded instance.
let landmarkerPromise = null

async function loadFaceLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL)
      return FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_ASSET_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        // 2, not 1: lets us cheaply detect "more than one person in frame" by reusing this
        // already-every-tick model instead of running a second detector — see faceCount below.
        numFaces: 2,
      })
    })()
  }
  return landmarkerPromise
}

// Thin wrapper around MediaPipe's Face Landmarker for Video mode's presentation-signal sampling.
// Runs fully in-browser (WASM) — no webcam frame ever leaves the device. Deliberately exposes
// only the primary face's nose-tip position (normalized 0-1 within the frame) plus a face count,
// not full landmark/blendshape data — lib/videoMetrics.js turns a stream of these samples into
// honest camera-facing/steadiness proxies, and the face count feeds multiple-person detection.
export function useFaceLandmarker() {
  const [isReady, setIsReady] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const landmarkerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    loadFaceLandmarker()
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
    const faceCount = result.faceLandmarks?.length ?? 0
    const landmarks = result.faceLandmarks?.[0]
    if (!landmarks?.length) {
      return { faceDetected: false, centerOffsetX: 0, centerOffsetY: 0, faceSize: 0, faceCount: 0 }
    }

    // Landmark index 1 is the nose tip in MediaPipe's 478-point face mesh — a stable proxy for
    // overall head position without needing the full transformation matrix. Indices 33/263 are
    // the outer corners of the right/left eyes — their distance approximates face size in frame,
    // a proxy for how close/far the candidate is from the camera.
    const noseTip = landmarks[1]
    const rightEyeOuter = landmarks[33]
    const leftEyeOuter = landmarks[263]
    const faceSize = Math.hypot(leftEyeOuter.x - rightEyeOuter.x, leftEyeOuter.y - rightEyeOuter.y)

    return {
      faceDetected: true,
      centerOffsetX: noseTip.x - 0.5,
      centerOffsetY: noseTip.y - 0.5,
      faceSize,
      faceCount,
    }
  }

  return { isReady, loadError, detectFrame }
}
