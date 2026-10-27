// Every number the app states in its text, recomputed from first principles.
import { describe, it, expect } from 'vitest'
import { circularSpeed, escapeSpeed } from './orbital-energy.js'
import { driftPerDay, gravityFactor, C } from './time-dilation.js'
import { planets } from '../data/planets.js'
import { timePresets } from '../data/time-presets.js'
import { clockRate } from './time-dilation.js'

const G = 6.674e-11
const M_SUN = 1.989e30
const EARTH = planets.find((p) => p.id === 'earth')
const MOON = planets.find((p) => p.id === 'moon')
const JUP = planets.find((p) => p.id === 'jupiter')

describe('facts shown in the app', () => {
  it('Moon orbit speed ~1.7 km/s, under a quarter of Earth', () => {
    const moon = circularSpeed(MOON.mu, MOON.radius)
    expect(moon / 1000).toBeCloseTo(1.68, 1)
    expect(moon / circularSpeed(EARTH.mu, EARTH.radius)).toBeLessThan(0.25)
  })
  it('Jupiter escape speed ~60 km/s', () => expect(escapeSpeed(JUP.mu, JUP.radius) / 1000).toBeCloseTo(60, -1))
  it('Earth surface clocks lose ~0.02 s/year vs deep space', () =>
    expect((EARTH.mu / (EARTH.radius * C * C)) * 365.25 * 86400).toBeCloseTo(0.022, 3))
  it('ISS astronauts ~0.005 s younger after 6 months', () => {
    const s = -driftPerDay(EARTH.mu, { r: 6.771e6, v: 7660 }, { r: EARTH.radius }) * 182.6
    expect(s).toBeGreaterThan(0.004)
    expect(s).toBeLessThan(0.006)
  })
  it('GPS error ~10 km/day if uncorrected', () =>
    expect((driftPerDay(EARTH.mu, { r: 26.56e6, v: 3874 }, { r: EARTH.radius }) * C) / 1000).toBeCloseTo(11.5, 0))
  it('neutron star surface ~three quarters speed', () => expect(gravityFactor(2.4)).toBeCloseTo(0.76, 2))
  it("Miller's planet preset: 1 hour = ~7 years", () => {
    const rate = clockRate(timePresets.find((p) => p.id === 'miller'))
    expect(3600 / rate / (365.25 * 86400)).toBeCloseTo(7, 0)
  })
  it('Einstein: starlight grazing the Sun bends 1.75 arcseconds', () =>
    expect(((4 * G * M_SUN) / (C * C * 6.957e8)) * 206265).toBeCloseTo(1.75, 2))
  it('Sun loses ~4 million tons of mass per second', () => expect(3.828e26 / (C * C) / 1e9).toBeCloseTo(4.26, 1))
  it('neutron star gravity ~100 billion g', () => expect((G * 1.4 * M_SUN) / 12e3 ** 2 / 9.81).toBeGreaterThan(1e11))
})
