import { describe, it, expect } from 'vitest'
import { wellDepth, sheetAccel } from './spacetime.js'

const masses = [{ x: 0, y: 0, m: 1 }]

describe('rubber sheet', () => {
  it('sinks deepest at the mass and is symmetric', () => {
    expect(wellDepth(0, 0, masses)).toBeLessThan(wellDepth(0.5, 0, masses))
    expect(wellDepth(0.5, 0, masses)).toBeCloseTo(wellDepth(0, -0.5, masses), 12)
  })

  it('heavier mass = deeper well', () => {
    expect(wellDepth(0.2, 0, [{ x: 0, y: 0, m: 2 }])).toBeLessThan(wellDepth(0.2, 0, masses))
  })

  it('marbles get pulled toward the mass', () => {
    const { ax, ay } = sheetAccel(masses)(0.5, 0)
    expect(ax).toBeLessThan(0)
    expect(ay).toBeCloseTo(0, 12)
  })
})
