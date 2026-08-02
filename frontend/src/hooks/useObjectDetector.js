import { useEffect, useRef, useState } from 'react'

// Same MediaPipe CDN-hosted WASM runtime as the other detectors. EfficientDet-Lite0 is
// COCO-pretrained; COCO's label set includes "cell phone" directly, so no custom model/labels
// are needed for a phone-presence signal.
const WASM_BASE_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
const MODEL_ASSET_URL =
  'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite'
const PHONE_SCORE_THRESHOLD = 0.5

let detectorPromise = null

async function loadObjectDetector() {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const { ObjectDetector, FilesetResolver } = await import('@mediapipe/tasks-vision')
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE_URL)
      return ObjectDetector.createFromOptions(vision, {
        // CPU delegate deliberately, not GPU: this detector is only sampled every few seconds (see
        // VideoAnswerInput.jsx's staggered cadence), so it isn't latency-sensitive, and keeping it
        // off the GPU avoids contending with the face/pose landmarkers that run every tick.
        baseOptions: { modelAssetPath: MODEL_ASSET_URL, delegate: 'CPU' },
        runningMode: 'VIDEO',
        maxResults: 1,
        scoreThreshold: PHONE_SCORE_THRESHOLD,
        categoryAllowlist: ['cell phone'],
      })
    })()
  }
  return detectorPromise
}

// Possible-phone-usage signal for Video mode's live coaching — an observable presentation signal,
// never a certainty claim (see GUIDANCE_COPY.phoneUse in VideoAnswerInput.jsx). Runs fully
// in-browser (WASM); no frame ever leaves the device. Deliberately exposes only a boolean, no
// bounding box — nothing downstream needs frame position, just whether a phone was seen.
export function useObjectDetector() {
  const [isReady, setIsReady] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const detectorRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    loadObjectDetector()
      .then((detector) => {
        if (cancelled) return
        detectorRef.current = detector
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
    const detector = detectorRef.current
    if (!detector || !videoEl || videoEl.readyState < 2) return null

    const result = detector.detectForVideo(videoEl, performance.now())
    const phoneDetected = (result.detections ?? []).some((d) =>
      d.categories.some((c) => c.categoryName === 'cell phone' && c.score >= PHONE_SCORE_THRESHOLD),
    )
    return { phoneDetected }
  }

  return { isReady, loadError, detectFrame }
}
