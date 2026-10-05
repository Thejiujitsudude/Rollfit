// "Rubber sheet" model of curved space. World units: the sheet spans about -1.2..1.2.

export const SHEET = { G: 0.6, soft: 0.12, depthScale: 0.28 }

/** Gravitational potential (negative near masses). Softened so it stays finite. */
export function potential(x, y, masses, soft = SHEET.soft) {
  let p = 0
  for (const m of masses) {
    const dx = x - m.x
    const dy = y - m.y
    p -= (SHEET.G * m.m) / Math.sqrt(dx * dx + dy * dy + soft * soft)
  }
  return p
}

/** How far the sheet sinks at (x, y). Negative = down. */
export const wellDepth = (x, y, masses) => potential(x, y, masses) * SHEET.depthScale

/** Acceleration field for marbles rolling on the sheet (gradient of the potential). */
export function sheetAccel(masses, soft = SHEET.soft) {
  return (x, y) => {
    let ax = 0
    let ay = 0
    for (const m of masses) {
      const dx = m.x - x
      const dy = m.y - y
      const r2 = dx * dx + dy * dy + soft * soft
      const k = (SHEET.G * m.m) / (r2 * Math.sqrt(r2))
      ax += dx * k
      ay += dy * k
    }
    return { ax, ay }
  }
}
