import { orbitElements } from './orbital-energy.js'

export const ORBIT_TYPES = ['crash', 'orbit', 'escape']

/**
 * Where is this launch headed?
 * @param {{x:number,y:number,vx:number,vy:number}} state
 * @param {number} mu  G * M of the planet
 * @param {number} radius  planet surface radius
 */
export function classifyOrbit(state, mu, radius) {
  const r = Math.hypot(state.x, state.y)
  if (r <= radius) return 'crash'
  const { E, periapsis } = orbitElements(state, mu)
  if (E >= 0) {
    const inbound = state.x * state.vx + state.y * state.vy < 0
    return inbound && periapsis < radius ? 'crash' : 'escape'
  }
  return periapsis < radius ? 'crash' : 'orbit'
}
