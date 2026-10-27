// Planet on an ellipse, solved exactly with Kepler's equation (no drift, works for comets).

/** Solve M = E - e sin E for E (eccentric anomaly). */
export function solveKepler(M, e) {
  let E = e < 0.8 ? M : Math.PI
  for (let i = 0; i < 30; i++) {
    const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
    E -= d
    if (Math.abs(d) < 1e-12) break
  }
  return E
}

/** Position relative to the Sun (at a focus), for mean anomaly M. a = semi-major axis. */
export function orbitPosition(a, e, M) {
  const E = solveKepler(M, e)
  return { x: a * (Math.cos(E) - e), y: a * Math.sqrt(1 - e * e) * Math.sin(E) }
}

/** Kepler's 3rd law in Sun units: period (years) from a (AU). */
export const periodYears = (aAU) => aAU ** 1.5
