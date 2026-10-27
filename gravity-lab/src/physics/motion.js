// Everyday Newtonian motion helpers.

/** One step of falling with air drag. vt = terminal speed (Infinity = no air). Down is positive. */
export function fallStep({ y, v }, dt, g, vt = Infinity) {
  const drag = Number.isFinite(vt) ? (g * v * Math.abs(v)) / (vt * vt) : 0
  const a = g - drag
  const nv = v + a * dt
  return { y: y + ((v + nv) / 2) * dt, v: nv }
}

/** Jump height (m) and hang time (s) for a takeoff speed v0 (m/s) under gravity g. */
export const jump = (v0, g) => ({ height: (v0 * v0) / (2 * g), hang: (2 * v0) / g })
