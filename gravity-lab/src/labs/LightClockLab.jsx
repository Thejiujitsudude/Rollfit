import { useRef, useState } from 'react'
import Canvas from '../components/Canvas.jsx'
import ControlDrawer from '../components/ControlDrawer.jsx'
import { gamma } from '../physics/relativity.js'
import { makeStars, drawSpace } from '../utils/stars.js'

const STARS = makeStars(120, 31)
const LIGHT_PX = 140 // light speed on screen, px per second (slowed way down so you can watch it)

export default function LightClockLab() {
  const [beta, setBeta] = useState(0.6)
  const st = useRef({ t: 0, shipX: 0, ticksYou: 0, ticksShip: 0, trail: [] })
  const g = gamma(beta)

  const frame = (ctx, w, h, dt) => {
    const s = st.current
    const H = Math.min(h * 0.32, 150) // mirror gap
    const tickTime = H / LIGHT_PX // one bounce for a clock at rest
    s.t += dt
    drawSpace(ctx, w, h, STARS)

    // your clock (at rest)
    const yourX = w * 0.16
    const topA = h * 0.18
    const phaseA = (s.t / tickTime) % 2
    const yA = phaseA < 1 ? topA + H * phaseA : topA + H * (2 - phaseA)
    s.ticksYou = Math.floor(s.t / tickTime)
    drawClock(ctx, yourX, topA, H, 46, yA, '#9fb7ff')
    label(ctx, 'Your clock', yourX, topA + H + 22)
    label(ctx, `${s.ticksYou} ticks`, yourX, topA + H + 38, 0.7)

    // ship clock as YOU see it: the light zigzags, so each tick takes gamma times longer
    const shipTick = tickTime * g
    const v = beta * LIGHT_PX
    const trackL = w * 0.34
    const trackR = w - 20
    s.shipX += v * dt
    const shipW = 120 / g // length contraction
    if (trackL + s.shipX - shipW / 2 > trackR) {
      s.shipX = 0
      s.trail = []
    }
    const sx = trackL + s.shipX
    const phaseB = (s.t / shipTick) % 2
    const yB = phaseB < 1 ? topA + H * phaseB : topA + H * (2 - phaseB)
    s.ticksShip = Math.floor(s.t / shipTick)
    s.trail.push({ x: sx, y: yB })
    if (s.trail.length > 400) s.trail.shift()
    ctx.strokeStyle = 'rgba(255,214,130,0.55)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    s.trail.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
    ctx.stroke()
    // ship hull
    ctx.fillStyle = 'rgba(120,140,200,0.18)'
    ctx.fillRect(sx - shipW / 2, topA - 10, shipW, H + 20)
    drawClock(ctx, sx, topA, H, Math.min(46, shipW * 0.6), yB, '#ffd27a')
    label(ctx, `Ship's clock at ${(beta * 100).toFixed(0)}% light speed`, Math.min(Math.max(sx, trackL + 60), trackR - 60), topA + H + 22)
    label(ctx, `${s.ticksShip} ticks`, Math.min(Math.max(sx, trackL + 60), trackR - 60), topA + H + 38, 0.7)

    // ship length bar
    const by = h * 0.86
    ctx.fillStyle = 'rgba(220,226,255,0.7)'
    ctx.font = '12px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Ship length as you measure it', 16, by - 10)
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.fillRect(16, by, Math.min(w - 32, 240), 10)
    ctx.fillStyle = '#ffd27a'
    ctx.fillRect(16, by, Math.min(w - 32, 240) / g, 10)
  }

  return (
    <div className="lab">
      <div className="stage">
        <Canvas frame={frame} label="Two light clocks, one moving fast" />
        <div className="overlay top">
          <span className="readout">Light slowed way down so you can watch it</span>
        </div>
      </div>
      <aside className="panel">
        <header className="lab-head">
          <h2>Light Clock</h2>
          <p>
            A light clock ticks each time light bounces between two mirrors. Watch a moving one from outside: its light has
            to zigzag, a longer path. Light can't go faster, so the moving clock ticks slower.
          </p>
        </header>
        <section className="card">
          <label className="slider">
            <span>
              Ship speed <b className="num">{(beta * 100).toFixed(0)}%</b> of light
            </span>
            <input type="range" min="0" max="0.99" step="0.01" value={beta} onChange={(e) => setBeta(Number(e.target.value))} />
          </label>
          <div className="stats">
            <div>
              <b className="num">{g.toFixed(2)}×</b>
              <span>slower ship clock</span>
            </div>
            <div>
              <b className="num">{((1 / g) * 100).toFixed(0)}%</b>
              <span>ship length you measure</span>
            </div>
          </div>
          <p className="muted small">
            1 year on the ship = {g.toFixed(2)} years for you. Inside the ship, nothing feels different: to them, YOUR
            clock is the slow one.
          </p>
          <button type="button" className="btn" onClick={() => (st.current = { t: 0, shipX: 0, ticksYou: 0, ticksShip: 0, trail: [] })}>
            Restart clocks
          </button>
        </section>
        <section className="card">
          <h3>Try this</h3>
          <ul className="tips">
            <li>Set 0%. Both clocks tick together.</li>
            <li>Set 87%. The ship clock runs at half speed and the ship measures half as long.</li>
            <li>Set 99%. Seven of your ticks for every one of theirs.</li>
          </ul>
        </section>
        <ControlDrawer title="The science" defaultOpen={false}>
          <p>
            In 1905, Einstein started from two rules: the laws of physics are the same for everyone moving steadily, and
            everyone measures the same speed of light. Slow clocks and short ships follow from just those two.
          </p>
          <p>
            Fine print: "measure" is the key word. A photo of a fast ship would look twisted rather than squashed, because
            light from its far end left earlier.
          </p>
          <p>
            It's real. Muons made by cosmic rays high in the sky should decay before reaching the ground. They make it
            because their fast-moving clocks run slow.
          </p>
        </ControlDrawer>
      </aside>
    </div>
  )
}

function drawClock(ctx, x, top, H, mw, y, color) {
  ctx.strokeStyle = 'rgba(220,226,255,0.8)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(x - mw / 2, top)
  ctx.lineTo(x + mw / 2, top)
  ctx.moveTo(x - mw / 2, top + H)
  ctx.lineTo(x + mw / 2, top + H)
  ctx.stroke()
  ctx.fillStyle = color
  ctx.shadowColor = color
  ctx.shadowBlur = 12
  ctx.beginPath()
  ctx.arc(x, y, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
}

function label(ctx, text, x, y, alpha = 0.9) {
  ctx.fillStyle = `rgba(220,226,255,${alpha})`
  ctx.font = '12px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(text, x, y)
}
