// Special relativity + E = mc^2.
import { C } from './time-dilation.js'

/** Lorentz factor. beta = v / c. 1 at rest, infinity at light speed. */
export const gamma = (beta) => (beta >= 1 ? Infinity : 1 / Math.sqrt(1 - beta * beta))

/** Rest energy in joules for a mass in kg. */
export const restEnergy = (kg) => kg * C * C

// Everyday yardsticks for big energies (joules)
export const YARDSTICKS = [
  { id: 'phone', label: 'phone charges', joules: 15 * 3600 },
  { id: 'tank', label: 'tanks of gas', joules: 1.7e9 },
  { id: 'home', label: 'years powering a home', joules: 10500 * 3.6e6 },
  { id: 'sun', label: 'seconds of sunshine (the whole Sun)', joules: 3.828e26 },
]
