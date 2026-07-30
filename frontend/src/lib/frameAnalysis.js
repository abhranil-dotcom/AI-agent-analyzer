// Samples a heavily downscaled canvas snapshot of the video frame to derive two honest, cheap
// signals: overall lighting brightness, and background motion (frame-to-frame pixel change
// OUTSIDE the detected face region, so the candidate's own head/mouth movement while speaking
// isn't mistaken for a busy/distracting background). Everything happens in a canvas that never
// leaves the device.

const SAMPLE_SIZE = 32 // small on purpose — only coarse averages are needed, keeps this cheap per tick

let canvas = null
let ctx = null
let previousFrame = null

function getContext() {
  if (!ctx) {
    canvas = document.createElement('canvas')
    canvas.width = SAMPLE_SIZE
    canvas.height = SAMPLE_SIZE
    ctx = canvas.getContext('2d', { willReadFrequently: true })
  }
  return ctx
}

// `faceDetection` is the object returned by useFaceLandmarker's detectFrame (faceDetected,
// centerOffsetX/Y, faceSize) — used only to exclude an estimated face circle from the motion
// calculation. Pass null/undefined if unavailable; motion will just be computed over the whole
// frame in that case.
export function analyzeFrame(videoEl, faceDetection) {
  if (!videoEl || videoEl.readyState < 2) return null
  const context = getContext()
  context.drawImage(videoEl, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
  const { data } = context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE)

  const excludeFace = Boolean(faceDetection?.faceDetected)
  const centerX = excludeFace ? 0.5 + faceDetection.centerOffsetX : 0
  const centerY = excludeFace ? 0.5 + faceDetection.centerOffsetY : 0
  const faceRadius = excludeFace ? Math.max(faceDetection.faceSize * 2.5, 0.15) : 0

  let brightnessSum = 0
  let motionSum = 0
  let motionCount = 0
  const pixelCount = SAMPLE_SIZE * SAMPLE_SIZE

  for (let y = 0; y < SAMPLE_SIZE; y += 1) {
    for (let x = 0; x < SAMPLE_SIZE; x += 1) {
      const idx = (y * SAMPLE_SIZE + x) * 4
      const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
      brightnessSum += luminance

      const inFaceRegion = excludeFace && Math.hypot(x / SAMPLE_SIZE - centerX, y / SAMPLE_SIZE - centerY) < faceRadius
      if (!inFaceRegion && previousFrame) {
        const prevLuminance =
          0.299 * previousFrame[idx] + 0.587 * previousFrame[idx + 1] + 0.114 * previousFrame[idx + 2]
        motionSum += Math.abs(luminance - prevLuminance)
        motionCount += 1
      }
    }
  }

  const brightness = Math.round((brightnessSum / pixelCount / 255) * 100)
  const backgroundMotion = motionCount > 0 ? Math.round(Math.min(100, (motionSum / motionCount / 255) * 400)) : 0

  previousFrame = data
  return { brightness, backgroundMotion }
}

export function resetFrameAnalysis() {
  previousFrame = null
}
