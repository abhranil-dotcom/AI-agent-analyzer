// Aggregates periodic face-landmark samples (from useFaceLandmarker) taken during a Video mode
// answer into the VideoMetrics shape the backend expects. Deliberately scoped to what a
// browser-only face model can honestly measure: is a face present and roughly centered/frontal
// (proxy for eye contact), and how stable is its position over time (proxy for posture
// steadiness) — not true gaze tracking or body posture.

const CENTER_TOLERANCE = 0.15 // normalized nose-tip offset from frame center still counts as "facing camera"

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
          const mean = values.reduce((a, b) => a + b, 0) / values.length
          return values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
        }
        const totalVariance = variance(detected.map((s) => s.centerOffsetX)) + variance(detected.map((s) => s.centerOffsetY))
        // Empirical scaling: normalized-coordinate variance is typically small (well under 0.02)
        // for a steady head position, so scale it up before subtracting from a 100 baseline.
        stability = Math.max(0, Math.min(100, Math.round(100 - totalVariance * 4000)))
      } else if (detected.length === 1) {
        stability = 100
      }

      return {
        face_presence_ratio: Math.round((detected.length / sampleCount) * 100) / 100,
        camera_facing_ratio: Math.round((facing.length / sampleCount) * 100) / 100,
        head_stability_score: stability,
        sample_count: sampleCount,
      }
    },
  }
}
