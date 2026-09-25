import { describe, it, expect } from 'vitest'
import { verletStep } from './verlet.js'

describe('verletStep (stub)', () => {
  it('returns a body object', () => {
    const body = { x: 0, y: 0, vx: 0, vy: 0 }
    const next = verletStep(body, 0.1, () => ({ ax: 0, ay: 0 }))
    expect(next).toMatchObject(body)
  })
})
