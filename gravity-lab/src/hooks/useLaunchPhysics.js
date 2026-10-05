import { useCallback, useEffect, useRef, useState } from 'react'
import { verletStep, pointMassAccel } from '../physics/verlet.js'
import { orbitElements } from '../physics/orbital-energy.js'

export const LAUNCH_ALT = 1.1 // launch from 1.1 planet radii (the tower)
export const EXIT_R = 4.2 // past this many radii on an escape path = escaped
const STEPS_PER_ORBIT = 4000
const SECONDS_PER_ORBIT = 8 // a circular orbit takes ~8 real seconds at 1x
const MAX_TRAIL = 6000

/**
 * Runs one launch at a time around a planet.
 * onOutcome({ outcome, e, planetId }) fires once per launch: crash, orbit (after one lap) or escape.
 */
export default function useLaunchPhysics(planet, onOutcome) {
  const { mu, radius } = planet
  const r0 = radius * LAUNCH_ALT
  const T0 = 2 * Math.PI * Math.sqrt((r0 * r0 * r0) / mu)

  const ref = useRef({ body: null, trail: [], ghosts: [], swept: 0, outcome: null, flying: false, el: null })
  const [tele, setTele] = useState({ status: 'ready', r: r0, speed: 0 })
  const lastTele = useRef(0)
  const outcomeRef = useRef(onOutcome)
  useEffect(() => {
    outcomeRef.current = onOutcome
  })

  const launch = useCallback(
    (speed, angleDeg) => {
      const a = (angleDeg * Math.PI) / 180
      const body = { x: 0, y: r0, vx: speed * Math.cos(a), vy: speed * Math.sin(a) }
      const s = ref.current
      if (s.trail.length > 1) s.ghosts = [s.trail, ...s.ghosts].slice(0, 4)
      Object.assign(s, { body, trail: [{ x: 0, y: r0 }], swept: 0, outcome: null, flying: true, el: orbitElements(body, mu) })
      setTele({ status: 'flying', r: r0, speed })
    },
    [mu, r0],
  )

  const reset = useCallback(() => {
    Object.assign(ref.current, { body: null, trail: [], ghosts: [], swept: 0, outcome: null, flying: false, el: null })
    setTele({ status: 'ready', r: r0, speed: 0 })
  }, [r0])

  const step = useCallback(
    (dtReal, speedMult = 1) => {
      const s = ref.current
      if (!s.flying) return
      const accel = pointMassAccel(mu)
      const h = T0 / STEPS_PER_ORBIT
      const steps = Math.min(400, Math.round((dtReal * speedMult * STEPS_PER_ORBIT) / SECONDS_PER_ORBIT))
      let finished = null
      for (let i = 0; i < steps && s.flying; i++) {
        const b = s.body
        const r = Math.hypot(b.x, b.y)
        // far away, time speeds up so huge orbits come back in a sensible time
        const dt = h * Math.max(1, (r / r0) ** 1.5)
        const before = Math.atan2(b.y, b.x)
        const nb = verletStep(b, dt, accel)
        let d = Math.atan2(nb.y, nb.x) - before
        if (d > Math.PI) d -= 2 * Math.PI
        if (d < -Math.PI) d += 2 * Math.PI
        s.swept += d
        s.body = nb
        const nr = Math.hypot(nb.x, nb.y)
        const last = s.trail[s.trail.length - 1]
        if (Math.hypot(nb.x - last.x, nb.y - last.y) > radius * 0.01) {
          s.trail.push({ x: nb.x, y: nb.y })
          if (s.trail.length > MAX_TRAIL) s.trail.shift()
        }
        if (nr <= radius) {
          const k = radius / nr
          s.body = { ...nb, x: nb.x * k, y: nb.y * k, vx: 0, vy: 0 }
          s.trail.push({ x: s.body.x, y: s.body.y })
          s.flying = false
          finished = 'crash'
        } else if (nr > EXIT_R * radius && s.el.E >= 0) {
          s.flying = false
          finished = 'escape'
        } else if (!s.outcome && Math.abs(s.swept) >= 2 * Math.PI) {
          finished = 'orbit'
        }
        if (finished && !s.outcome) {
          s.outcome = finished
          outcomeRef.current?.({ outcome: finished, e: s.el.e, planetId: planet.id })
        }
      }
      const now = performance.now()
      if (finished || now - lastTele.current > 100) {
        lastTele.current = now
        const b = s.body
        setTele({
          status: s.flying ? (s.outcome === 'orbit' ? 'orbit' : 'flying') : s.outcome,
          r: Math.hypot(b.x, b.y),
          speed: Math.hypot(b.vx, b.vy),
        })
      }
    },
    [mu, radius, r0, T0, planet.id],
  )

  return { ref, tele, launch, reset, step, r0 }
}
