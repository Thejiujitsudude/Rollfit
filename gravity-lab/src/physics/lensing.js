// Light rays bending around a mass. Units: pixels, light speed = 1.
// rs = Schwarzschild radius (event horizon of a black hole).
//
// 'gr'     : exact Schwarzschild light path via the Binet trick
//            (accel = -1.5 rs h^2 r / |r|^5 gives the true photon orbit shape).
// 'newton' : light as a fast ball under Newton's gravity. Bends half as much.

export const PHOTON_SPHERE = 1.5 // in units of rs
export const SHADOW = (3 * Math.sqrt(3)) / 2 // capture impact parameter, in rs

/**
 * @param {{x:number,y:number}} start
 * @param {{x:number,y:number}} dir  unit direction
 * @param {{cx:number,cy:number,rs:number,surface?:number,mode?:'gr'|'newton',
 *   bounds?:{minX:number,minY:number,maxX:number,maxY:number},maxSteps?:number,maxStep?:number}} opts
 * @returns {{points:{x:number,y:number}[], fate:'escaped'|'captured', dir:{x:number,y:number}}}
 */
export function traceRay(start, dir, opts) {
  const { cx, cy, rs, mode = 'gr', maxSteps = 6000, maxStep = 8 } = opts
  const surface = Math.max(opts.surface ?? rs, rs)
  const b = opts.bounds ?? { minX: -Infinity, minY: -Infinity, maxX: Infinity, maxY: Infinity }
  let x = start.x - cx
  let y = start.y - cy
  let vx = dir.x
  let vy = dir.y
  const h = x * vy - y * vx
  const k = mode === 'gr' ? 1.5 * rs * h * h : rs / 2
  const accel = (px, py) => {
    const r2 = px * px + py * py
    const r = Math.sqrt(r2)
    const f = mode === 'gr' ? -k / (r2 * r2 * r) : -k / (r2 * r)
    return [px * f, py * f]
  }
  const points = [{ x: x + cx, y: y + cy }]
  let [ax, ay] = accel(x, y)
  for (let i = 0; i < maxSteps; i++) {
    const r = Math.hypot(x, y)
    const speed = Math.hypot(vx, vy)
    const ds = Math.min(maxStep, Math.max(0.25, 0.05 * (r - rs * 0.9)))
    const dt = ds / speed
    vx += 0.5 * ax * dt
    vy += 0.5 * ay * dt
    x += vx * dt
    y += vy * dt
    ;[ax, ay] = accel(x, y)
    vx += 0.5 * ax * dt
    vy += 0.5 * ay * dt
    points.push({ x: x + cx, y: y + cy })
    if (Math.hypot(x, y) <= surface) return { points, fate: 'captured', dir: unit(vx, vy) }
    const px = x + cx
    const py = y + cy
    const outward = x * vx + y * vy > 0
    if (outward && (px < b.minX || px > b.maxX || py < b.minY || py > b.maxY)) break
  }
  return { points, fate: 'escaped', dir: unit(vx, vy) }
}

function unit(x, y) {
  const m = Math.hypot(x, y)
  return { x: x / m, y: y / m }
}
