import { useEffect, useRef } from 'react'

/** Calls callback(dtSeconds) every animation frame while running. dt is capped so tab switches don't explode the sim. */
export default function useAnimationLoop(callback, running = true) {
  const cbRef = useRef(callback)
  useEffect(() => {
    cbRef.current = callback
  })
  useEffect(() => {
    if (!running) return undefined
    let id = 0
    let last = performance.now()
    const tick = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      cbRef.current(dt)
      id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [running])
}
