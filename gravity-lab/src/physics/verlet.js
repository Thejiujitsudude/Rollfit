// Velocity Verlet integrator: stable, keeps orbital energy from drifting.

/**
 * Advance one body by one timestep.
 * @param {{x:number,y:number,vx:number,vy:number,ax?:number,ay?:number}} body
 * @param {number} dt
 * @param {(x:number,y:number)=>{ax:number,ay:number}} accelFn
 */
export function verletStep(body, dt, accelFn) {
  const a0 = body.ax === undefined ? accelFn(body.x, body.y) : { ax: body.ax, ay: body.ay }
  const x = body.x + body.vx * dt + 0.5 * a0.ax * dt * dt
  const y = body.y + body.vy * dt + 0.5 * a0.ay * dt * dt
  const a1 = accelFn(x, y)
  return {
    x,
    y,
    vx: body.vx + 0.5 * (a0.ax + a1.ax) * dt,
    vy: body.vy + 0.5 * (a0.ay + a1.ay) * dt,
    ax: a1.ax,
    ay: a1.ay,
  }
}

/** Newtonian gravity toward a point mass. mu = G * M. */
export function pointMassAccel(mu, cx = 0, cy = 0) {
  return (x, y) => {
    const dx = cx - x
    const dy = cy - y
    const r2 = dx * dx + dy * dy
    const k = mu / (r2 * Math.sqrt(r2))
    return { ax: dx * k, ay: dy * k }
  }
}
