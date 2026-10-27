// Gravity assist: a probe flies past a MOVING planet.
// In the planet's own frame the flyby is symmetric (speed in = speed out).
// In the Sun's frame the probe can gain or lose up to 2x the planet's speed.
import { verletStep } from './verlet.js'

/** Planet position at time t: starts at (x0, y0), moves with velocity (vx, vy). */
export const planetAt = (p, t) => ({ x: p.x0 + p.vx * t, y: p.y0 + p.vy * t })

/**
 * One step for the probe. Force from the planet where it is at the END of the step,
 * so velocity Verlet stays correct for a moving source.
 */
export function stepProbe(probe, planet, t, dt) {
  const next = planetAt(planet, t + dt)
  return verletStep(probe, dt, (x, y) => {
    const dx = next.x - x
    const dy = next.y - y
    const r2 = dx * dx + dy * dy
    const k = planet.mu / (r2 * Math.sqrt(r2))
    return { ax: dx * k, ay: dy * k }
  })
}

/** Gravity on the probe at its current spot (to seed the first step). */
export function accelAt(probe, planet, t) {
  const p = planetAt(planet, t)
  const dx = p.x - probe.x
  const dy = p.y - probe.y
  const r2 = dx * dx + dy * dy
  const k = planet.mu / (r2 * Math.sqrt(r2))
  return { ax: dx * k, ay: dy * k }
}
