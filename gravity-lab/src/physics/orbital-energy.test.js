import { describe, it, expect } from 'vitest'
import { escapeSpeed, circularSpeed, orbitElements, kineticEnergy, potentialEnergy } from './orbital-energy.js'

const EARTH = { mu: 3.986004418e14, R: 6.371e6 }

describe('orbital-energy', () => {
  it('matches textbook Earth speeds', () => {
    expect(escapeSpeed(EARTH.mu, EARTH.R) / 1000).toBeCloseTo(11.19, 1)
    expect(circularSpeed(EARTH.mu, EARTH.R) / 1000).toBeCloseTo(7.91, 1)
  })

  it('a circular orbit has e = 0 and E = -mu/2r', () => {
    const r = 7e6
    const el = orbitElements({ x: r, y: 0, vx: 0, vy: circularSpeed(EARTH.mu, r) }, EARTH.mu)
    expect(el.e).toBeLessThan(1e-9)
    expect(el.E).toBeCloseTo(-EARTH.mu / (2 * r), 0)
    expect(el.periapsis).toBeCloseTo(r, -1)
  })

  it('kinetic and potential energy', () => {
    expect(kineticEnergy(2, 3)).toBe(9)
    expect(potentialEnergy(10, 2, 5)).toBe(-4)
  })
})
