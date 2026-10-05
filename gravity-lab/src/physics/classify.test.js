import { describe, it, expect } from 'vitest'
import { classifyOrbit } from './classify.js'
import { circularSpeed, escapeSpeed } from './orbital-energy.js'

const mu = 1
const R = 1
const r0 = 1.1
const shot = (v, deg = 0) => {
  const a = (deg * Math.PI) / 180
  return { x: 0, y: r0, vx: v * Math.cos(a), vy: v * Math.sin(a) }
}

describe('classifyOrbit', () => {
  it('too slow crashes', () => expect(classifyOrbit(shot(0.5), mu, R)).toBe('crash'))
  it('circular speed orbits', () => expect(classifyOrbit(shot(circularSpeed(mu, r0)), mu, R)).toBe('orbit'))
  it('escape speed escapes', () => expect(classifyOrbit(shot(escapeSpeed(mu, r0) * 1.01), mu, R)).toBe('escape'))
  it('below the surface is a crash', () => expect(classifyOrbit({ x: 0, y: 0.5, vx: 9, vy: 0 }, mu, R)).toBe('crash'))
  it('steep launch at circular speed crashes', () =>
    expect(classifyOrbit(shot(circularSpeed(mu, r0), 30), mu, R)).toBe('crash'))
  it('fast but aimed at the ground crashes', () =>
    expect(classifyOrbit(shot(escapeSpeed(mu, r0) * 1.2, -80), mu, R)).toBe('crash'))
})
