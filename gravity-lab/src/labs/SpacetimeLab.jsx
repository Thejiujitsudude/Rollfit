import { useRef, useState } from 'react'
import Canvas from '../components/Canvas.jsx'
import ControlDrawer from '../components/ControlDrawer.jsx'
import { verletStep } from '../physics/verlet.js'
import { wellDepth, sheetAccel } from '../physics/spacetime.js'

const TILT = 0.5 // how flat the sheet looks (1 = top-down)
const DROP = 0.55 // how far wells sink on screen
const MAX_DEPTH = 1.4
const XS = 1.3
const YS = 1.0
const MAX_MARBLES = 14
const MARBLE_COLORS = ['#ffd27a', '#7ad3ff', '#ff8fb1', '#b9f27a', '#c7a6ff']

const START_MASSES = [{ x: 0, y: 0, m: 1.5 }]

export default function SpacetimeLab() {
  const masses = useRef(START_MASSES.map((m) => ({ ...m })))
  const marbles = useRef([])
  const drag = useRef(null)
  const view = useRef({ cx: 0, cy: 0, scale: 1 })
  const spawnClock = useRef(0)
  const colorIdx = useRef(0)
  const [selected, setSelected] = useState(0)
  const [selMass, setSelMass] = useState(1.5)
  const [count, setCount] = useState(1)
  const [auto, setAuto] = useState(true)

  const depth = (x, y) => Math.max(-MAX_DEPTH, wellDepth(x, y, masses.current))
  const project = (x, y, d = depth(x, y)) => {
    const { cx, cy, scale } = view.current
    return { sx: cx + x * scale, sy: cy + y * scale * TILT - d * scale * DROP }
  }
  // screen -> sheet, accounting for the dip (a few fixed-point passes)
  const unproject = (sx, sy) => {
    const { cx, cy, scale } = view.current
    const x = (sx - cx) / scale
    let y = (sy - cy) / (scale * TILT)
    for (let i = 0; i < 4; i++) y = (sy - cy + depth(x, y) * scale * DROP) / (scale * TILT)
    return { x, y }
  }

  const addMarble = (x, y, vx, vy) => {
    const color = MARBLE_COLORS[colorIdx.current++ % MARBLE_COLORS.length]
    marbles.current = [...marbles.current, { x, y, vx, vy, trail: [], color }].slice(-MAX_MARBLES)
  }

  const frame = (ctx, w, h, dt) => {
    const scale = Math.min(w / (2 * XS + 0.2), h / ((2 * YS + 0.2) * TILT + DROP * 1.2))
    view.current = { cx: w / 2, cy: h / 2 - scale * DROP * 0.35, scale }
    const ms = masses.current

    // auto marbles roll in from the left edge
    if (auto) {
      spawnClock.current += dt
      if (spawnClock.current > 1.4) {
        spawnClock.current = 0
        addMarble(-XS, (Math.random() * 2 - 1) * YS * 0.8, 0.45 + Math.random() * 0.25, 0)
      }
    }

    // physics
    const accel = sheetAccel(ms)
    const sub = 6
    const h1 = dt / sub
    marbles.current = marbles.current.filter((m) => {
      let b = m
      for (let i = 0; i < sub; i++) b = verletStep(b, h1, accel)
      Object.assign(m, { x: b.x, y: b.y, vx: b.vx, vy: b.vy, ax: b.ax, ay: b.ay })
      m.trail.push({ x: m.x, y: m.y })
      if (m.trail.length > 90) m.trail.shift()
      const swallowed = ms.some((k) => Math.hypot(k.x - m.x, k.y - m.y) < 0.035 + 0.02 * Math.sqrt(k.m))
      return !swallowed && Math.abs(m.x) < XS + 0.4 && Math.abs(m.y) < YS + 0.4
    })

    // background
    ctx.fillStyle = '#05070f'
    ctx.fillRect(0, 0, w, h)

    // grid
    const N = 48
    const line = (fx) => {
      ctx.beginPath()
      for (let i = 0; i <= N; i++) {
        const [x, y] = fx(i / N)
        const p = project(x, y)
        if (i) ctx.lineTo(p.sx, p.sy)
        else ctx.moveTo(p.sx, p.sy)
      }
      ctx.stroke()
    }
    ctx.lineWidth = 1
    for (let gy = -YS; gy <= YS + 1e-9; gy += 0.1) {
      ctx.strokeStyle = `rgba(110,170,255,${0.18 + 0.32 * ((gy + YS) / (2 * YS))})`
      line((t) => [-XS + t * 2 * XS, gy])
    }
    ctx.strokeStyle = 'rgba(110,170,255,0.3)'
    for (let gx = -XS; gx <= XS + 1e-9; gx += 0.1) line((t) => [gx, -YS + t * 2 * YS])

    // marbles
    for (const m of marbles.current) {
      ctx.strokeStyle = m.color
      ctx.globalAlpha = 0.5
      ctx.lineWidth = 1.5
      ctx.beginPath()
      m.trail.forEach((p, i) => {
        const q = project(p.x, p.y)
        if (i) ctx.lineTo(q.sx, q.sy)
        else ctx.moveTo(q.sx, q.sy)
      })
      ctx.stroke()
      ctx.globalAlpha = 1
      const q = project(m.x, m.y)
      ctx.fillStyle = m.color
      ctx.beginPath()
      ctx.arc(q.sx, q.sy, 4, 0, Math.PI * 2)
      ctx.fill()
    }

    // masses (back to front)
    ;[...ms]
      .map((m, i) => ({ m, i }))
      .sort((a, b) => a.m.y - b.m.y)
      .forEach(({ m, i }) => {
        const q = project(m.x, m.y)
        const r = (8 + 9 * Math.sqrt(m.m)) * (scale / 260)
        const g = ctx.createRadialGradient(q.sx - r * 0.35, q.sy - r * 1.35, r * 0.1, q.sx, q.sy - r, r)
        g.addColorStop(0, '#fff1c9')
        g.addColorStop(1, '#e0812d')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(q.sx, q.sy - r, r, 0, Math.PI * 2)
        ctx.fill()
        if (i === selected) {
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(q.sx, q.sy - r, r + 4, 0, Math.PI * 2)
          ctx.stroke()
        }
      })

    // fling arrow
    const d = drag.current
    if (d?.type === 'fling') {
      const a = project(d.start.x, d.start.y)
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(a.sx, a.sy)
      ctx.lineTo(d.screen.x, d.screen.y)
      ctx.stroke()
    }
  }

  const hitMass = (p) => {
    const { scale } = view.current
    let best = -1
    let bestD = Infinity
    masses.current.forEach((m, i) => {
      const q = project(m.x, m.y)
      const r = (8 + 9 * Math.sqrt(m.m)) * (scale / 260)
      const dist = Math.hypot(p.x - q.sx, p.y - (q.sy - r))
      if (dist < r + 16 && dist < bestD) {
        best = i
        bestD = dist
      }
    })
    return best
  }

  const onDown = (p) => {
    const i = hitMass(p)
    if (i >= 0) {
      const m = masses.current[i]
      drag.current = { type: 'mass', i, grab: { x: p.x, y: p.y }, from: { x: m.x, y: m.y } }
      setSelected(i)
      setSelMass(m.m)
    } else {
      drag.current = { type: 'fling', start: unproject(p.x, p.y), screen: p, t: performance.now() }
    }
  }
  const onMove = (p) => {
    const d = drag.current
    if (!d) return
    if (d.type === 'mass') {
      // move in flat sheet coordinates so the ball tracks the finger 1:1
      const { scale } = view.current
      const m = masses.current[d.i]
      m.x = Math.max(-XS, Math.min(XS, d.from.x + (p.x - d.grab.x) / scale))
      m.y = Math.max(-YS, Math.min(YS, d.from.y + (p.y - d.grab.y) / (scale * TILT)))
    } else {
      d.screen = p
    }
  }
  const onUp = (p) => {
    const d = drag.current
    drag.current = null
    if (d?.type !== 'fling') return
    const end = unproject(p.x, p.y)
    addMarble(d.start.x, d.start.y, (end.x - d.start.x) * 1.6, (end.y - d.start.y) * 1.6)
  }

  const addMass = () => {
    if (masses.current.length >= 4) return
    masses.current.push({ x: (Math.random() * 2 - 1) * 0.8, y: (Math.random() * 2 - 1) * 0.6, m: 1 })
    setSelected(masses.current.length - 1)
    setSelMass(1)
    setCount(masses.current.length)
  }
  const removeMass = () => {
    if (!masses.current.length) return
    masses.current.splice(selected, 1)
    const next = Math.max(0, selected - 1)
    setSelected(next)
    setSelMass(masses.current[next]?.m ?? 1)
    setCount(masses.current.length)
  }
  const changeMass = (v) => {
    setSelMass(v)
    const m = masses.current[selected]
    if (m) m.m = v
  }
  const reset = () => {
    masses.current = START_MASSES.map((m) => ({ ...m }))
    marbles.current = []
    setSelected(0)
    setSelMass(1.5)
    setCount(1)
  }

  return (
    <div className="lab">
      <div className="stage">
        <Canvas
          frame={frame}
          label="Curved spacetime sheet with masses and rolling marbles"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
        />
        <div className="overlay bottom hint">Drag a ball to move it · Flick anywhere to roll a marble</div>
      </div>

      <aside className="panel">
        <header className="lab-head">
          <h2>Spacetime</h2>
          <p>
            Heavy things dent spacetime, like a bowling ball on a trampoline. Marbles just roll straight, but the sheet
            is curved, so their paths bend. That bending is what we call gravity.
          </p>
        </header>

        <section className="card">
          <label className="slider">
            <span>
              Selected mass <b className="num">{count ? `${selMass.toFixed(1)}×` : 'none'}</b>
            </span>
            <input
              type="range"
              min="0.2"
              max="3"
              step="0.1"
              value={selMass}
              disabled={!count}
              onChange={(e) => changeMass(Number(e.target.value))}
            />
          </label>
          <div className="actions wrap">
            <button type="button" className="btn" onClick={addMass} disabled={count >= 4}>
              Add mass
            </button>
            <button type="button" className="btn" onClick={removeMass} disabled={!count}>
              Remove selected
            </button>
            <button type="button" className="btn" onClick={() => (marbles.current = [])}>
              Clear marbles
            </button>
            <button type="button" className="btn" onClick={reset}>
              Reset
            </button>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
            Roll marbles in automatically
          </label>
        </section>

        <section className="card">
          <h3>Try this</h3>
          <ul className="tips">
            <li>Flick a marble sideways past a mass. Too slow and it falls in; just right and it loops around.</li>
            <li>Add a second mass and watch marbles weave between the two dents.</li>
            <li>Crank a mass to 3× and see how much wider its dent reaches.</li>
          </ul>
        </section>

        <ControlDrawer title="The science" defaultOpen={false}>
          <p>
            Newton said gravity is a force that pulls. Einstein (1915) said mass curves spacetime, and objects just
            follow the straightest path they can through that curve.
          </p>
          <p>
            The trampoline is only a picture. It uses Earth's gravity to explain gravity, and real curvature also bends
            time. That's what the Time tab shows: the deeper the dent, the slower clocks tick.
          </p>
          <p>The math of the dent here is real Newtonian gravity, so the marble paths are honest orbits.</p>
        </ControlDrawer>
      </aside>
    </div>
  )
}
