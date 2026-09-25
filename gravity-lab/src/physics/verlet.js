// Velocity Verlet integrator. TODO: real implementation pending.

/**
 * Advance one body by one timestep.
 * @param {{x:number,y:number,vx:number,vy:number}} body
 * @param {number} dt
 * @param {(x:number,y:number)=>{ax:number,ay:number}} accelFn
 */
export function verletStep(body, dt, accelFn) {
  void dt
  void accelFn
  return { ...body }
}
