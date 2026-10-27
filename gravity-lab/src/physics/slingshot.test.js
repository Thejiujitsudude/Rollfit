import { describe, it, expect } from 'vitest'
import { stepProbe, accelAt, planetAt } from './slingshot.js'

const PLANET = { x0: 0, y0: -3000, vx: 0, vy: 100, mu: 1.2e6 }

// Probe and planet both reach the origin at t = 30 s; b offsets the probe's path.
function fly(b) {
  let probe = { x: -3000, y: b, vx: 100, vy: 0 }
  let t = 0
  const dt = 0.002
  Object.assign(probe, accelAt(probe, PLANET, t))
  const relEnergy = (p, tt) => {
    const pl = planetAt(PLANET, tt)
    const v2 = (p.vx - PLANET.vx) ** 2 + (p.vy - PLANET.vy) ** 2
    return v2 / 2 - PLANET.mu / Math.hypot(p.x - pl.x, p.y - pl.y)
  }
  const e0 = relEnergy(probe, t)
  let minR = Infinity
  while (t < 60) {
    probe = stepProbe(probe, PLANET, t, dt)
    t += dt
    const pl = planetAt(PLANET, t)
    minR = Math.min(minR, Math.hypot(probe.x - pl.x, probe.y - pl.y))
  }
  return { speed: Math.hypot(probe.vx, probe.vy), e0, e1: relEnergy(probe, t), minR }
}

describe('gravity assist', () => {
  it("in the planet's frame, the flyby keeps its energy (speed in = speed out)", () => {
    const r = fly(-60)
    expect(Math.abs(r.e1 - r.e0) / Math.abs(r.e0)).toBeLessThan(1e-4)
  })

  it('depending on the path, the probe leaves faster or slower than it came', () => {
    const speeds = [-300, -200, -120, -80, 80, 120, 200, 300].map((b) => fly(b).speed)
    expect(Math.max(...speeds)).toBeGreaterThan(130)
    expect(Math.min(...speeds)).toBeLessThan(85)
  })

  it('the gain is capped: never more than 2x the planet speed', () => {
    for (const b of [-300, -150, -80, 80, 150, 300]) expect(fly(b).speed).toBeLessThanOrEqual(100 + 2 * 100)
  })
})
