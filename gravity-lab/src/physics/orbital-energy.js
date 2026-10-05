// Orbital energy helpers (SI units unless noted). mu = G * M.

export const kineticEnergy = (mass, speed) => 0.5 * mass * speed * speed
export const potentialEnergy = (mu, mass, r) => (-mu * mass) / r
export const specificOrbitalEnergy = (speed, mu, r) => (speed * speed) / 2 - mu / r
export const circularSpeed = (mu, r) => Math.sqrt(mu / r)
export const escapeSpeed = (mu, r) => Math.sqrt((2 * mu) / r)

/** Shape of the orbit from a position + velocity. */
export function orbitElements({ x, y, vx, vy }, mu) {
  const r = Math.hypot(x, y)
  const v = Math.hypot(vx, vy)
  const E = specificOrbitalEnergy(v, mu, r)
  const h = x * vy - y * vx
  const e = Math.sqrt(Math.max(0, 1 + (2 * E * h * h) / (mu * mu)))
  const periapsis = (h * h) / (mu * (1 + e))
  const bound = E < 0
  const a = bound ? -mu / (2 * E) : Infinity
  return {
    E,
    e,
    periapsis,
    apoapsis: bound ? a * (1 + e) : Infinity,
    period: bound ? 2 * Math.PI * Math.sqrt((a * a * a) / mu) : Infinity,
  }
}
