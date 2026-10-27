import { useRef, useState } from 'react'
import Canvas from '../components/Canvas.jsx'
import ControlDrawer from '../components/ControlDrawer.jsx'

const MODES = [
  { id: 'first', label: '1st: Inertia' },
  { id: 'second', label: '2nd: F = ma' },
  { id: 'third', label: '3rd: Push back' },
]
const SURFACES = { space: { label: 'Space', mu: 0 }, ice: { label: 'Ice', mu: 0.08 }, carpet: { label: 'Carpet', mu: 1.2 } }
const TRACK_M = 20 // meters of track in the 2nd-law race

export default function LawsLab() {
  const [mode, setMode] = useState('first')
  return (
    <div className="lab">
      {mode === 'first' && <FirstLaw modes={<ModeChips mode={mode} setMode={setMode} />} />}
      {mode === 'second' && <SecondLaw modes={<ModeChips mode={mode} setMode={setMode} />} />}
      {mode === 'third' && <ThirdLaw modes={<ModeChips mode={mode} setMode={setMode} />} />}
    </div>
  )
}

function ModeChips({ mode, setMode }) {
  return (
    <div className="chips">
      {MODES.map((m) => (
        <button key={m.id} type="button" className={`chip ${m.id === mode ? 'on' : ''}`} onClick={() => setMode(m.id)}>
          {m.label}
        </button>
      ))}
    </div>
  )
}

function Science() {
  return (
    <ControlDrawer title="The science" defaultOpen={false}>
      <p>Isaac Newton wrote these three laws in 1687. They explain almost every motion you see every day.</p>
      <p>
        <b>1.</b> Things keep doing what they're doing (sitting still or moving straight) unless a force changes it.
      </p>
      <p>
        <b>2.</b> Force = mass × acceleration. Same push, double the mass, half the speed-up.
      </p>
      <p>
        <b>3.</b> Every push gets an equal push back. Rockets work by throwing gas backward.
      </p>
    </ControlDrawer>
  )
}

/* ---------- 1st law: flick a puck ---------- */
function FirstLaw({ modes }) {
  const [surface, setSurface] = useState('space')
  const puck = useRef({ x: 0.5, y: 0.5, vx: 0, vy: 0, trail: [] })
  const drag = useRef(null)
  const size = useRef({ w: 1, h: 1 })

  const frame = (ctx, w, h, dt) => {
    size.current = { w, h }
    const p = puck.current
    const k = Math.min(w, h)
    const mu = SURFACES[surface].mu
    const speed = Math.hypot(p.vx, p.vy)
    if (speed > 0) {
      const slow = Math.min(speed, mu * dt)
      p.vx -= (p.vx / speed) * slow
      p.vy -= (p.vy / speed) * slow
    }
    p.x += (p.vx * dt * k) / w
    p.y += (p.vy * dt * k) / h
    if (surface === 'space') {
      p.x = (p.x + 1) % 1
      p.y = (p.y + 1) % 1
    } else {
      if (p.x < 0.04 || p.x > 0.96) p.vx *= -1
      if (p.y < 0.04 || p.y > 0.96) p.vy *= -1
      p.x = Math.min(0.96, Math.max(0.04, p.x))
      p.y = Math.min(0.96, Math.max(0.04, p.y))
    }
    p.trail.push({ x: p.x, y: p.y })
    if (p.trail.length > 60) p.trail.shift()

    ctx.fillStyle = surface === 'space' ? '#05070f' : surface === 'ice' ? '#0f2436' : '#2a1820'
    ctx.fillRect(0, 0, w, h)
    if (surface !== 'space') {
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.lineWidth = 2
      ctx.strokeRect(w * 0.02, h * 0.02, w * 0.96, h * 0.96)
    }
    ctx.fillStyle = 'rgba(255,210,122,0.35)'
    for (const t of p.trail) ctx.fillRect(t.x * w - 1, t.y * h - 1, 2, 2)
    ctx.fillStyle = '#ffd27a'
    ctx.beginPath()
    ctx.arc(p.x * w, p.y * h, 12, 0, Math.PI * 2)
    ctx.fill()
    const d = drag.current
    if (d) arrow(ctx, d.from.x, d.from.y, d.to.x, d.to.y, '#ffffff')
    ctx.fillStyle = 'rgba(220,226,255,0.8)'
    ctx.font = '12px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`speed ${(speed * 10).toFixed(1)} m/s`, 12, h - 12)
  }

  return (
    <>
      <div className="stage">
        <Canvas
          frame={frame}
          label="A puck you can flick"
          onPointerDown={(p) => (drag.current = { from: p, to: p })}
          onPointerMove={(p) => drag.current && (drag.current.to = p)}
          onPointerUp={(p) => {
            const d = drag.current
            drag.current = null
            if (!d) return
            const k = Math.min(size.current.w, size.current.h)
            puck.current.vx = ((p.x - d.from.x) / k) * 2.5
            puck.current.vy = ((p.y - d.from.y) / k) * 2.5
          }}
        />
        <div className="overlay bottom hint">Drag anywhere to flick the puck</div>
      </div>
      <aside className="panel">
        <header className="lab-head">
          <h2>Laws of Motion</h2>
          <p>Things keep moving unless something stops them. On Earth, friction is the hidden force that stops everything.</p>
        </header>
        <section className="card">
          {modes}
          <div className="chips">
            {Object.entries(SURFACES).map(([id, s]) => (
              <button key={id} type="button" className={`chip ${id === surface ? 'on' : ''}`} onClick={() => setSurface(id)}>
                {s.label}
              </button>
            ))}
          </div>
          <p className="muted small">
            {surface === 'space' && 'No friction, no walls. One flick and it glides forever (it wraps around the screen).'}
            {surface === 'ice' && 'A tiny bit of friction. It glides a long way before stopping.'}
            {surface === 'carpet' && 'Lots of friction. It stops almost right away. That is why Newton\'s 1st law felt wrong for 2,000 years.'}
          </p>
          <button type="button" className="btn" onClick={() => Object.assign(puck.current, { x: 0.5, y: 0.5, vx: 0, vy: 0, trail: [] })}>
            Stop puck
          </button>
        </section>
        <Science />
      </aside>
    </>
  )
}

/* ---------- 2nd law: same push, different masses ---------- */
function SecondLaw({ modes }) {
  const [force, setForce] = useState(20)
  const [mA, setMA] = useState(2)
  const [mB, setMB] = useState(8)
  const carts = useRef(null)
  const [live, setLive] = useState(null)
  const lastUi = useRef(0)

  const push = () => {
    carts.current = { t: 0, a: { x: 0, v: 0 }, b: { x: 0, v: 0 } }
  }

  const frame = (ctx, w, h, dt) => {
    const c = carts.current
    if (c) {
      c.t += dt
      const on = c.t < 1
      for (const [cart, m] of [
        [c.a, mA],
        [c.b, mB],
      ]) {
        if (on) cart.v += (force / m) * dt
        cart.x = Math.min(TRACK_M, cart.x + cart.v * dt)
      }
      if (performance.now() - lastUi.current > 100) {
        lastUi.current = performance.now()
        setLive({ va: c.a.v, vb: c.b.v, on })
      }
    }
    ctx.fillStyle = '#05070f'
    ctx.fillRect(0, 0, w, h)
    const x0 = 30
    const ppm = (w - 70) / TRACK_M
    const lanes = [
      { y: h * 0.33, m: mA, cart: c?.a, color: '#ffd27a', name: 'Cart A' },
      { y: h * 0.72, m: mB, cart: c?.b, color: '#7ad3ff', name: 'Cart B' },
    ]
    for (const lane of lanes) {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x0, lane.y + 14)
      ctx.lineTo(w - 20, lane.y + 14)
      ctx.stroke()
      const x = x0 + (lane.cart?.x ?? 0) * ppm
      const size = 14 + lane.m * 3
      ctx.fillStyle = lane.color
      ctx.fillRect(x, lane.y + 12 - size, size * 1.4, size)
      ctx.fillStyle = 'rgba(220,226,255,0.85)'
      ctx.font = '12px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`${lane.name} · ${lane.m} kg`, x0, lane.y - size - 4)
      if (c && c.t < 1) arrow(ctx, x - 40, lane.y + 12 - size / 2, x - 4, lane.y + 12 - size / 2, '#ff8f6b')
    }
    ctx.fillStyle = 'rgba(220,226,255,0.5)'
    ctx.textAlign = 'right'
    ctx.fillText(`${TRACK_M} m`, w - 20, h - 10)
  }

  const slider = (label, value, set, min, max, unit) => (
    <label className="slider">
      <span>
        {label} <b className="num">{value} {unit}</b>
      </span>
      <input type="range" min={min} max={max} step="1" value={value} onChange={(e) => set(Number(e.target.value))} />
    </label>
  )

  return (
    <>
      <div className="stage">
        <Canvas frame={frame} label="Two carts pushed with the same force" />
      </div>
      <aside className="panel">
        <header className="lab-head">
          <h2>Laws of Motion</h2>
          <p>Push two carts with the same force for 1 second. The heavier one speeds up less. Acceleration = force ÷ mass.</p>
        </header>
        <section className="card">
          {modes}
          {slider('Push force', force, setForce, 5, 60, 'N')}
          {slider('Cart A mass', mA, setMA, 1, 10, 'kg')}
          {slider('Cart B mass', mB, setMB, 1, 10, 'kg')}
          <div className="stats">
            <div>
              <b className="num">{(force / mA).toFixed(1)} m/s²</b>
              <span>Cart A speed-up</span>
            </div>
            <div>
              <b className="num">{(force / mB).toFixed(1)} m/s²</b>
              <span>Cart B speed-up</span>
            </div>
          </div>
          {live && (
            <p className="muted small">
              Speeds now: A {live.va.toFixed(1)} m/s, B {live.vb.toFixed(1)} m/s. {live.on ? 'Pushing...' : 'Push over: they coast (1st law).'}
            </p>
          )}
          <button type="button" className="btn primary" onClick={push}>
            Push both for 1 second
          </button>
        </section>
        <Science />
      </aside>
    </>
  )
}

/* ---------- 3rd law: skaters push apart ---------- */
function ThirdLaw({ modes }) {
  const [mA, setMA] = useState(40)
  const [mB, setMB] = useState(80)
  const state = useRef(null)
  const IMPULSE = 120 // N*s, the same push on both

  const frame = (ctx, w, h, dt) => {
    const s = state.current
    if (s) {
      s.t += dt
      s.xa = Math.max(-1, s.xa + s.va * dt * 0.06)
      s.xb = Math.min(1, s.xb + s.vb * dt * 0.06)
    }
    ctx.fillStyle = '#0f2436'
    ctx.fillRect(0, 0, w, h)
    const cx = w / 2
    const y = h * 0.6
    const span = w * 0.42
    const xa = cx + (s?.xa ?? -0.06) * span
    const xb = cx + (s?.xb ?? 0.06) * span
    skater(ctx, xa, y, mA, '#ffd27a')
    skater(ctx, xb, y, mB, '#7ad3ff')
    if (s && s.t < 0.6) {
      arrow(ctx, xa, y - 40, xa - 50, y - 40, '#ff8f6b')
      arrow(ctx, xb, y - 40, xb + 50, y - 40, '#ff8f6b')
      ctx.fillStyle = '#ff8f6b'
      ctx.font = '12px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('same force, opposite ways', cx, y - 60)
    }
    ctx.fillStyle = 'rgba(220,226,255,0.85)'
    ctx.font = '12px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${mA} kg`, xa, y + 40)
    ctx.fillText(`${mB} kg`, xb, y + 40)
  }

  const va = IMPULSE / mA
  const vb = IMPULSE / mB
  return (
    <>
      <div className="stage">
        <Canvas frame={frame} label="Two skaters pushing off each other" />
      </div>
      <aside className="panel">
        <header className="lab-head">
          <h2>Laws of Motion</h2>
          <p>Two skaters push off each other. Both feel the exact same push, in opposite directions. The lighter one flies away faster.</p>
        </header>
        <section className="card">
          {modes}
          <label className="slider">
            <span>
              Gold skater <b className="num">{mA} kg</b>
            </span>
            <input type="range" min="20" max="120" step="5" value={mA} onChange={(e) => setMA(Number(e.target.value))} />
          </label>
          <label className="slider">
            <span>
              Blue skater <b className="num">{mB} kg</b>
            </span>
            <input type="range" min="20" max="120" step="5" value={mB} onChange={(e) => setMB(Number(e.target.value))} />
          </label>
          <div className="stats">
            <div>
              <b className="num">{va.toFixed(1)} m/s</b>
              <span>gold skater speed</span>
            </div>
            <div>
              <b className="num">{vb.toFixed(1)} m/s</b>
              <span>blue skater speed</span>
            </div>
          </div>
          <p className="muted small">
            Mass × speed comes out equal: {mA} × {va.toFixed(1)} = {mB} × {vb.toFixed(1)} = {IMPULSE}. Physicists call that
            momentum, and it is always balanced.
          </p>
          <button type="button" className="btn primary" onClick={() => (state.current = { t: 0, xa: -0.06, xb: 0.06, va: -va, vb })}>
            Push off
          </button>
        </section>
        <Science />
      </aside>
    </>
  )
}

function skater(ctx, x, y, m, color) {
  const s = 0.6 + m / 120
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(x, y - 34 * s, 6 * s, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(x, y - 28 * s)
  ctx.lineTo(x, y - 10 * s)
  ctx.moveTo(x - 10 * s, y - 22 * s)
  ctx.lineTo(x + 10 * s, y - 22 * s)
  ctx.moveTo(x, y - 10 * s)
  ctx.lineTo(x - 7 * s, y + 6)
  ctx.moveTo(x, y - 10 * s)
  ctx.lineTo(x + 7 * s, y + 6)
  ctx.stroke()
}

function arrow(ctx, x0, y0, x1, y1, color) {
  const a = Math.atan2(y1 - y0, x1 - x0)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x1 - 9 * Math.cos(a - 0.4), y1 - 9 * Math.sin(a - 0.4))
  ctx.lineTo(x1 - 9 * Math.cos(a + 0.4), y1 - 9 * Math.sin(a + 0.4))
  ctx.closePath()
  ctx.fill()
}
