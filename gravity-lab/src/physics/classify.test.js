import { describe, it, expect } from 'vitest'
import { classifyOrbit, ORBIT_TYPES } from './classify.js'

describe('classifyOrbit (stub)', () => {
  it('returns a string', () => {
    expect(typeof classifyOrbit({})).toBe('string')
    expect(ORBIT_TYPES.length).toBeGreaterThan(0)
  })
})
