import { useEffect, useRef } from 'react'
import useAnimationLoop from '../hooks/useAnimationLoop.js'

/**
 * Full-size canvas that calls frame(ctx, width, height, dt) every animation frame.
 * Handles retina scaling and resizing. Pointer handlers get canvas-local {x, y} in CSS px.
 */
export default function Canvas({ frame, label, onPointerDown, onPointerMove, onPointerUp }) {
  const canvasRef = useRef(null)
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 })
  const frameRef = useRef(frame)
  useEffect(() => {
    frameRef.current = frame
  })

  useEffect(() => {
    const c = canvasRef.current
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const { width, height } = c.getBoundingClientRect()
      c.width = Math.max(1, Math.round(width * dpr))
      c.height = Math.max(1, Math.round(height * dpr))
      sizeRef.current = { w: width, h: height, dpr }
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(c)
    return () => ro.disconnect()
  }, [])

  useAnimationLoop((dt) => {
    const c = canvasRef.current
    const { w, h, dpr } = sizeRef.current
    if (!c || !w || !h) return
    const ctx = c.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    frameRef.current(ctx, w, h, dt)
  })

  const local = (e) => {
    const r = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  return (
    <canvas
      ref={canvasRef}
      className="canvas"
      role="img"
      aria-label={label}
      onPointerDown={(e) => {
        if (!onPointerDown) return
        e.currentTarget.setPointerCapture(e.pointerId)
        onPointerDown(local(e))
      }}
      onPointerMove={(e) => onPointerMove?.(local(e))}
      onPointerUp={(e) => onPointerUp?.(local(e))}
      onPointerCancel={(e) => onPointerUp?.(local(e))}
    />
  )
}
