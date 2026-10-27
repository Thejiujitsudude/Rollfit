import { describe, it, expect } from 'vitest'
import { fallStep, jump } from './motion.js'

const dropTime = (g, vt, h) => {
  let s = { y: 0, v: 0 }
  let t = 0
  while (s.y < h) {
    s = fallStep(s, 0.001, g, vt)
    t += 0.001
  }
  return t
}

describe('motion', () => {
  it('no air: everything falls 10 m in ~1.43 s on Earth', () => expect(dropTime(9.81, Infinity, 10)).toBeCloseTo(1.428, 2))
  it('air slows a feather way down', () => expect(dropTime(9.81, 0.6, 10)).toBeGreaterThan(15))
  it('approaches terminal speed', () => {
    let s = { y: 0, v: 0 }
    for (let i = 0; i < 20000; i++) s = fallStep(s, 0.001, 9.81, 5)
    expect(s.v).toBeCloseTo(5, 2)
  })
  it('jumping on the Moon goes ~6x higher', () =>
    expect(jump(2.6, 1.62).height / jump(2.6, 9.81).height).toBeCloseTo(6.06, 1))
})
