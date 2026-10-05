import { describe, it, expect } from 'vitest'
import { traceRay, SHADOW } from './lensing.js'

const shoot = (b, mode, rs = 1) =>
  traceRay({ x: -40000, y: b }, { x: 1, y: 0 }, { cx: 0, cy: 0, rs, mode, maxSteps: 200000, maxStep: 400, bounds: { minX: -40000, maxX: 40000, minY: -1e6, maxY: 1e6 } })

const bend = (ray) => Math.abs(Math.atan2(ray.dir.y, ray.dir.x))

describe('traceRay', () => {
  it('weak field: Einstein bends light by 2 rs / b', () => {
    const b = 400
    expect(bend(shoot(b, 'gr')) / (2 / b)).toBeCloseTo(1, 1)
  })

  it("Newton's guess is half of Einstein's", () => {
    const b = 400
    expect(bend(shoot(b, 'gr')) / bend(shoot(b, 'newton'))).toBeCloseTo(2, 1)
  })

  it('rays inside the shadow are captured, rays outside escape', () => {
    expect(shoot(SHADOW * 0.97, 'gr').fate).toBe('captured')
    expect(shoot(SHADOW * 1.03, 'gr').fate).toBe('escaped')
  })
})
