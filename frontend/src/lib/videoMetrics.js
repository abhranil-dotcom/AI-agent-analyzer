// Aggregates periodic face-landmark + frame-analysis samples (from useFaceLandmarker and
// lib/frameAnalysis.js) taken during a Video mode answer into the VideoMetrics shape the backend
// expects. Deliberately scoped to what a browser-only face model and simple pixel analysis can
// honestly measure: is a face present and roughly centered/frontal (proxy for eye contact), how
// stable is its position over time (proxy for posture/head steadiness), how bright the scene is,
// and how much the background moves — not true gaze tracking, body posture, or an aesthetic
// judgment of the background.

// Exported so VideoAnswerInput.jsx's live monitor loop can apply these same two thresholds
// per-tick (for the "looking away" / "out of frame" banners) instead of only at session end.
export const CENTER_TOLERANCE = 0.15 // normalized nose-tip offset from frame center still counts as "facing camera"
const TOO_CLOSE_FACE_SIZE = 0.22 // normalized inter-eye distance thresholds — approximate, not calibrated per-device
const TOO_FAR_FACE_SIZE = 0.06
export const OFF_CENTER_TOLERANCE = 0.2

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

    // `episodeCounts` carries rising-edge episode totals accumulated by the caller (VideoAnswerInput's
    // refs) for signals that are inherently about sustained state over time — posture warnings,
    // out-of-frame drift, multiple people, possible phone use — rather than a per-sample average.
    finalize(episodeCounts = {}) {
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

      const postureScores = samples.map((s) => s.postureScore).filter((v) => typeof v === 'number')
      if (postureScores.length > 0) result.posture_score = Math.round(average(postureScores))

      const { postureWarning, outOfFrame, multiplePeople, phoneUse } = episodeCounts
      if (typeof postureWarning === 'number') result.posture_warning_events = postureWarning
      if (typeof outOfFrame === 'number') result.out_of_frame_events = outOfFrame
      if (typeof multiplePeople === 'number') result.multiple_person_events = multiplePeople
      if (typeof phoneUse === 'number') result.phone_use_events = phoneUse

      return result
    },
  }
}
