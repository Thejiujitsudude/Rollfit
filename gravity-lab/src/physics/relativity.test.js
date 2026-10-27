import { describe, it, expect } from 'vitest'
import { gamma, restEnergy } from './relativity.js'

describe('relativity', () => {
  it('gamma is 1 at rest and ~7.09 at 99% c', () => {
    expect(gamma(0)).toBe(1)
    expect(gamma(0.99)).toBeCloseTo(7.089, 2)
  })
  it('1 gram is about 90 trillion joules', () => {
    expect(restEnergy(0.001)).toBeCloseTo(8.988e13, -10)
  })
})
