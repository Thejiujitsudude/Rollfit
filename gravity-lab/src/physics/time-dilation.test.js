import { describe, it, expect } from 'vitest'
import { clockRate, gravityFactor, gravityFactorGap, velocityFactor, driftPerDay, realWorld } from './time-dilation.js'

const EARTH_MU = 3.986004418e14

describe('time dilation', () => {
  it('no gravity, no speed = normal time', () => expect(clockRate({})).toBe(1))
  it('99% of light speed ticks at ~14%', () => expect(velocityFactor(0.99)).toBeCloseTo(0.141, 3))
  it('stops at the horizon', () => expect(gravityFactor(1)).toBe(0))
  it('gap form matches the plain form', () => expect(gravityFactorGap(2)).toBeCloseTo(gravityFactor(3), 12))

  it('GPS clocks run ~38 microseconds/day fast vs the ground', () => {
    const gps = { r: 26.56e6, v: 3874 }
    const ground = { r: 6.371e6, v: 0 }
    const us = driftPerDay(EARTH_MU, gps, ground) * 1e6
    expect(us).toBeGreaterThan(37)
    expect(us).toBeLessThan(40)
  })

  it('Earth surface is a weak field', () => {
    const { gap, beta } = realWorld(EARTH_MU, 6.371e6)
    expect(gap).toBeGreaterThan(1e8)
    expect(beta).toBe(0)
  })
})
