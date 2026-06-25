import createGlobe from 'cobe'
import { useEffect, useRef } from 'react'

export default function Globe() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Create canvas imperatively — keeps it outside React's fiber tree so
    // cobe's DOM wrapper-injection never conflicts with React reconciliation.
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'width:100%;height:100%;opacity:0;transition:opacity 1s ease;display:block'
    container.appendChild(canvas)

    let phi = 0
    let animId

    const globe = createGlobe(canvas, {
      devicePixelRatio: 2,
      width: 600 * 2,
      height: 600 * 2,
      phi: 0,
      theta: 0.3,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.15, 0.15, 0.4],
      markerColor: [0.1, 0.8, 1],
      glowColor: [1, 1, 1],
      markers: [],
    })

    // cobe v2 removed its built-in RAF loop — drive rotation manually
    function loop() {
      phi += 0.004
      globe.update({ phi })
      animId = requestAnimationFrame(loop)
    }
    animId = requestAnimationFrame(loop)

    setTimeout(() => { canvas.style.opacity = '1' }, 150)

    return () => {
      cancelAnimationFrame(animId)
      globe.destroy()
      // Remove cobe's injected wrapper div (not just the canvas) so StrictMode's
      // second mount starts with a clean container.
      const wrapper = canvas.parentElement
      if (wrapper && wrapper !== container) {
        wrapper.remove()
      } else if (canvas.parentElement) {
        canvas.remove()
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        maxWidth: 400,
        aspectRatio: '1 / 1',
        margin: '0 auto',
        position: 'relative',
      }}
    >
      {/* Glow halo behind the globe */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
