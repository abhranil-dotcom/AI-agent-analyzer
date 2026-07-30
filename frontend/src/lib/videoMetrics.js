// Aggregates periodic face-landmark + frame-analysis samples (from useFaceLandmarker and
// lib/frameAnalysis.js) taken during a Video mode answer into the VideoMetrics shape the backend
// expects. Deliberately scoped to what a browser-only face model and simple pixel analysis can
// honestly measure: is a face present and roughly centered/frontal (proxy for eye contact), how
// stable is its position over time (proxy for posture/head steadiness), how bright the scene is,
// and how much the background moves — not true gaze tracking, body posture, or an aesthetic
// judgment of the background.

const CENTER_TOLERANCE = 0.15 // normalized nose-tip offset from frame center still counts as "facing camera"
const TOO_CLOSE_FACE_SIZE = 0.22 // normalized inter-eye distance thresholds — approximate, not calibrated per-device
const TOO_FAR_FACE_SIZE = 0.06
const OFF_CENTER_TOLERANCE = 0.2

function average(values) {
  return values.reduce((a, b) => a + b, 0) / values.length
}

function classifyCameraPositioning(detectedSamples) {
  if (detectedSamples.length === 0) return null

  const avgFaceSize = average(detectedSamples.map((s) => s.faceSize))
  const avgOffsetX = average(detectedSamples.map((s) => Math.abs(s.centerOffsetX)))
  const avgOffsetY = average(detectedSamples.map((s) => Math.abs(s.centerOffsetY)))

  if (avgFaceSize >= TOO_CLOSE_FACE_SIZE) return 'too_close'
  if (avgFaceSize <= TOO_FAR_FACE_SIZE) return 'too_far'
  if (avgOffsetX > OFF_CENTER_TOLERANCE || avgOffsetY > OFF_CENTER_TOLERANCE) return 'off_center'
  return 'well_centered'
}

export function createVideoMetricsAccumulator() {
  const samples = []

  return {
    addSample(detection) {
      samples.push(detection)
    },

    finalize() {
      const sampleCount = samples.length
      if (sampleCount === 0) {
        return { face_presence_ratio: 0, camera_facing_ratio: 0, head_stability_score: 0, sample_count: 0 }
      }

      const detected = samples.filter((s) => s.faceDetected)
      const facing = detected.filter(
        (s) => Math.abs(s.centerOffsetX) <= CENTER_TOLERANCE && Math.abs(s.centerOffsetY) <= CENTER_TOLERANCE,
      )

      let stability = 0
      if (detected.length > 1) {
        const variance = (values) => {
          const mean = average(values)
          return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
        }
        const totalVariance = variance(detected.map((s) => s.centerOffsetX)) + variance(detected.map((s) => s.centerOffsetY))
        // Empirical scaling: normalized-coordinate variance is typically small (well under 0.02)
        // for a steady head position, so scale it up before subtracting from a 100 baseline.
        stability = Math.max(0, Math.min(100, Math.round(100 - totalVariance * 4000)))
      } else if (detected.length === 1) {
        stability = 100
      }

      const result = {
        face_presence_ratio: Math.round((detected.length / sampleCount) * 100) / 100,
        camera_facing_ratio: Math.round((facing.length / sampleCount) * 100) / 100,
        head_stability_score: stability,
        sample_count: sampleCount,
      }

      const brightnessSamples = samples.map((s) => s.brightness).filter((v) => typeof v === 'number')
      if (brightnessSamples.length > 0) result.average_brightness = Math.round(average(brightnessSamples))

      const motionSamples = samples.map((s) => s.backgroundMotion).filter((v) => typeof v === 'number')
      if (motionSamples.length > 0) result.background_motion_score = Math.round(average(motionSamples))

      const positioning = classifyCameraPositioning(detected)
      if (positioning) result.camera_positioning = positioning

      return result
    },
  }
}
