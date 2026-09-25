import { describe, it, expect } from 'vitest'
import { kineticEnergy, potentialEnergy, specificOrbitalEnergy } from './orbital-energy.js'

describe('orbital-energy (stub)', () => {
  it('exports numeric functions', () => {
    expect(typeof kineticEnergy(1, 1)).toBe('number')
    expect(typeof potentialEnergy(1, 1, 1)).toBe('number')
    expect(typeof specificOrbitalEnergy(1, 1, 1)).toBe('number')
  })
})
