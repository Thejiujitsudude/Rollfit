import { useRef, useState } from 'react'
import Canvas from '../components/Canvas.jsx'
import ControlDrawer from '../components/ControlDrawer.jsx'
import { makeStars, drawSpace } from '../utils/stars.js'

const STARS = makeStars(120, 51)
const PAIRS = {
  heavy: {
    label: 'Feel heavy',
    boxes: [
      { id: 'earth', name: 'Sitting on Earth', g: 1 },
      { id: 'rocket', name: 'Rocket speeding up in space', g: 1 },
    ],
    verdict: 'Same everything. The ball falls the same way and the light bends the same way. You cannot tell which box you are in.',
  },
  float: {
    label: 'Feel weightless',
    boxes: [
      { id: 'falling', name: 'Falling elevator on Earth', g: 0 },
      { id: 'space', name: 'Floating in deep space', g: 0 },
    ],
    verdict: 'Same again. Falling freely feels exactly like no gravity at all. That is why astronauts float.',
  },
}
const G_PX = 260 // "1 g" on screen, px/s^2
const SLOW_LIGHT = 330 // light slowed down so its bend is visible, px/s

export default function ElevatorLab() {
  const [pairId, setPairId] = useState('heavy')
  const pair = PAIRS[pairId]
  const sim = useRef({ t: 0, ball: null, laser: null })

  const frame = (ctx, w, h, dt) => {
    const s = sim.current
    s.t += dt
    drawSpace(ctx, w, h, STARS)
    const bw = Math.min(w * 0.42, 260)
    const bh = Math.min(h * 0.62, 300)
    const top = h * 0.12
    pair.boxes.forEach((box, i) => {
      const x0 = i === 0 ? w * 0.25 - bw / 2 : w * 0.75 - bw / 2
      // outside context
      if (box.id === 'earth') {
        ctx.fillStyle = '#2d5a2d'
        ctx.fillRect(x0 - 20, top + bh, bw + 40, h - top - bh)
      } else if (box.id === 'rocket') {
        const fl = 18 + Math.sin(s.t * 30) * 5
        ctx.fillStyle = '#ff8f3a'
        ctx.beginPath()
        ctx.moveTo(x0 + bw * 0.3, top + bh)
        ctx.lineTo(x0 + bw * 0.5, top + bh + 30 + fl)
        ctx.lineTo(x0 + bw * 0.7, top + bh)
        ctx.fill()
      } else if (box.id === 'falling') {
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'
        ctx.setLineDash([4, 6])
        ctx.beginPath()
        ctx.moveTo(x0 + bw / 2, 0)
        ctx.lineTo(x0 + bw / 2, top)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = 'rgba(220,226,255,0.6)'
        ctx.font = '11px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('cable snapped', x0 + bw / 2, top - 6)
      }
      ctx.fillStyle = '#10152c'
      ctx.strokeStyle = 'rgba(220,226,255,0.6)'
      ctx.lineWidth = 2
      ctx.fillRect(x0, top, bw, bh)
      ctx.strokeRect(x0, top, bw, bh)

      // person
      const floatY = box.g ? 0 : Math.sin(s.t * 1.2 + i) * 10 - 30
      person(ctx, x0 + bw * 0.25, top + bh - 2 + floatY, bh * 0.5, box.g === 0)

      // ball
      const hand = { x: x0 + bw * 0.55, y: top + bh * 0.42 }
      if (s.ball) {
        const t = s.t - s.ball
        const y = Math.min(top + bh - 8, hand.y + 0.5 * box.g * G_PX * t * t)
        ctx.fillStyle = '#ffd27a'
        ctx.beginPath()
        ctx.arc(hand.x, box.g ? y : hand.y + Math.sin(t * 2) * 2, 8, 0, Math.PI * 2)
        ctx.fill()
      }

      // laser across the box
      if (s.laser) {
        const t = s.t - s.laser
        const reach = Math.min(bw, t * SLOW_LIGHT)
        const ly = top + bh * 0.22
        ctx.strokeStyle = '#ff4d6d'
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let x = 0; x <= reach; x += 3) {
          const tt = x / SLOW_LIGHT
          const y = ly + 0.5 * box.g * G_PX * tt * tt
          if (x) ctx.lineTo(x0 + x, y)
          else ctx.moveTo(x0, y)
        }
        ctx.stroke()
      }

      ctx.fillStyle = 'rgba(220,226,255,0.9)'
      ctx.font = '600 12px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(box.name, x0 + bw / 2, top + bh + (box.id === 'earth' ? 20 : 64))
    })
  }

  return (
    <div className="lab">
      <div className="stage">
        <Canvas frame={frame} label="Two elevators that feel the same inside" />
      </div>
      <aside className="panel">
        <header className="lab-head">
          <h2>Elevator</h2>
          <p>
            Einstein's "happiest thought": inside a closed box, you can't tell gravity apart from speeding up. Drop a ball
            and shine a laser in both boxes. Spot any difference?
          </p>
        </header>
        <section className="card">
          <div className="chips">
            {Object.entries(PAIRS).map(([id, p]) => (
              <button
                key={id}
                type="button"
                className={`chip ${id === pairId ? 'on' : ''}`}
                onClick={() => {
                  setPairId(id)
                  sim.current = { t: 0, ball: null, laser: null }
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="actions">
            <button type="button" className="btn primary" onClick={() => (sim.current.ball = sim.current.t)}>
              Drop ball
            </button>
            <button type="button" className="btn primary" onClick={() => (sim.current.laser = sim.current.t)}>
              Fire laser
            </button>
          </div>
          <p className="fact">{pair.verdict}</p>
        </section>
        <ControlDrawer title="The science" defaultOpen={false}>
          <p>
            In 1907 Einstein imagined a man falling off a roof. While falling, he wouldn't feel his own weight. Gravity and
            acceleration had to be two faces of the same thing.
          </p>
          <p>
            The laser is the big payoff. In the rocket, light curves down because the floor rushes up to meet it. If gravity
            is the same as acceleration, gravity must bend light too. That was proven in 1919 (see the Light lab).
          </p>
          <p>The light here is slowed down billions of times. In real life the bend is far too small to see in a room.</p>
        </ControlDrawer>
      </aside>
    </div>
  )
}

function person(ctx, x, feet, height, floating) {
  const s = height / 100
  ctx.strokeStyle = '#9fb7ff'
  ctx.fillStyle = '#9fb7ff'
  ctx.lineWidth = 3
  const hip = feet - 45 * s
  const neck = feet - 80 * s
  ctx.beginPath()
  ctx.arc(x, neck - 9 * s, 9 * s, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(x, neck)
  ctx.lineTo(x, hip)
  const arm = floating ? -20 : 18
  ctx.moveTo(x, neck + 8 * s)
  ctx.lineTo(x - 16 * s, neck + arm * s)
  ctx.moveTo(x, neck + 8 * s)
  ctx.lineTo(x + 16 * s, neck + arm * s)
  ctx.moveTo(x, hip)
  ctx.lineTo(x - (floating ? 14 : 8) * s, feet)
  ctx.moveTo(x, hip)
  ctx.lineTo(x + (floating ? 14 : 8) * s, feet)
  ctx.stroke()
}
