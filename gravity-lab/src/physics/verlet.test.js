import { describe, it, expect } from 'vitest'
import { verletStep, pointMassAccel } from './verlet.js'
import { specificOrbitalEnergy, circularSpeed } from './orbital-energy.js'

describe('verletStep', () => {
  it('keeps a circular orbit circular and returns to the start after one period', () => {
    const mu = 1
    const r = 1
    const accel = pointMassAccel(mu)
    let b = { x: r, y: 0, vx: 0, vy: circularSpeed(mu, r) }
    const E0 = specificOrbitalEnergy(Math.hypot(b.vx, b.vy), mu, r)
    const steps = 4000
    const dt = (2 * Math.PI) / steps
    for (let i = 0; i < steps; i++) b = verletStep(b, dt, accel)
    const E1 = specificOrbitalEnergy(Math.hypot(b.vx, b.vy), mu, Math.hypot(b.x, b.y))
    expect(Math.abs(E1 - E0)).toBeLessThan(1e-6)
    expect(b.x).toBeCloseTo(1, 3)
    expect(b.y).toBeCloseTo(0, 2)
  })

  it('moves in a straight line with no force', () => {
    const b = verletStep({ x: 0, y: 0, vx: 2, vy: 1 }, 0.5, () => ({ ax: 0, ay: 0 }))
    expect(b.x).toBe(1)
    expect(b.y).toBe(0.5)
  })
})
