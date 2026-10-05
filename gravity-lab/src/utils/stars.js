export function makeStars(n, seed = 1) {
  let s = seed
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647
  return Array.from({ length: n }, () => ({ x: rnd(), y: rnd(), r: rnd() * 1.3 + 0.3, a: rnd() * 0.6 + 0.15 }))
}

export function drawSpace(ctx, w, h, stars) {
  ctx.fillStyle = '#05070f'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#ffffff'
  for (const s of stars) {
    ctx.globalAlpha = s.a
    ctx.fillRect(s.x * w, s.y * h, s.r, s.r)
  }
  ctx.globalAlpha = 1
}
