import { describe, it, expect } from 'vitest'
import { solveKepler, orbitPosition, periodYears } from './kepler.js'

describe('kepler', () => {
  it('solves Kepler equation, even for a comet', () => {
    for (const e of [0, 0.3, 0.967]) {
      const M = 1.234
      const E = solveKepler(M, e)
      expect(E - e * Math.sin(E)).toBeCloseTo(M, 10)
    }
  })
  it('perihelion is a(1 - e), aphelion is a(1 + e)', () => {
    expect(orbitPosition(1, 0.5, 0).x).toBeCloseTo(0.5, 10)
    expect(orbitPosition(1, 0.5, Math.PI).x).toBeCloseTo(-1.5, 10)
  })
  it('Mars takes about 1.88 years', () => expect(periodYears(1.524)).toBeCloseTo(1.88, 2))
})
