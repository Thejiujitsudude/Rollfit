// How fast a clock ticks compared with someone far away and at rest.
// 1 = same speed, 0.5 = half speed.

export const C = 299792458 // m/s

/** Gravity part, from r / rs (rs = event horizon radius). */
export const gravityFactor = (rOverRs) => (rOverRs <= 1 ? 0 : Math.sqrt(1 - 1 / rOverRs))

/** Same as gravityFactor, but takes gap = r/rs - 1 (stays precise a hair above the horizon). */
export const gravityFactorGap = (gap) => (gap <= 0 ? 0 : Math.sqrt(gap / (1 + gap)))

/** Speed part, beta = v / c. */
export const velocityFactor = (beta) => (beta >= 1 ? 0 : Math.sqrt(1 - beta * beta))

/** Combined tick rate (simple model: gravity part x speed part). */
export const clockRate = ({ gap = Infinity, beta = 0 }) =>
  (gap === Infinity ? 1 : gravityFactorGap(gap)) * velocityFactor(beta)

/** Real-world: position r (m) and speed v (m/s) near a body with mu = G*M. */
export function realWorld(mu, r, v = 0) {
  const rs = (2 * mu) / (C * C)
  return { gap: r / rs - 1, beta: v / C }
}

/** Weak-field drift between two clocks, in seconds per day (positive = clock A runs fast). */
export function driftPerDay(mu, a, b) {
  const term = ({ r, v = 0 }) => -mu / (r * C * C) - (v * v) / (2 * C * C)
  return (term(a) - term(b)) * 86400
}
