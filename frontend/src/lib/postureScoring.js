// Deterministic posture scoring from MediaPipe Pose Landmarker samples (see
// hooks/usePoseLandmarker.js) — a shoulder-tilt/head-alignment proxy, not a body-language or
// personality judgment. Purely interview-presentation coaching: is the candidate roughly upright
// and facing the camera squarely. When shoulders aren't visible in frame (common with a tightly
// framed webcam), callers simply get `poseDetected: false` and should omit posture entirely
// rather than fabricate a score.

const TILT_WARNING_DEGREES = 12 // shoulder-line tilt beyond this reads as "leaning"
const OFFSET_WARNING = 0.12 // normalized head-over-shoulders horizontal misalignment

// `sample` is usePoseLandmarker's detectFrame() result: { poseDetected, shoulderTiltDegrees, headShoulderOffsetX }.
export function computePostureScore(sample) {
  if (!sample?.poseDetected) return null

  const tiltPenalty = Math.min(60, Math.abs(sample.shoulderTiltDegrees) * 3)
  const offsetPenalty = Math.min(40, Math.abs(sample.headShoulderOffsetX) * 250)

  return Math.max(0, Math.round(100 - tiltPenalty - offsetPenalty))
}

export function isPostureWarning(sample) {
  if (!sample?.poseDetected) return false
  return Math.abs(sample.shoulderTiltDegrees) > TILT_WARNING_DEGREES || Math.abs(sample.headShoulderOffsetX) > OFFSET_WARNING
}
