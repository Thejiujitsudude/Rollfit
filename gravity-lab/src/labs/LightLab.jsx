import { useRef, useState } from 'react'
import Canvas from '../components/Canvas.jsx'
import ControlDrawer from '../components/ControlDrawer.jsx'
import { traceRay, PHOTON_SPHERE } from '../physics/lensing.js'
import { makeStars, drawSpace } from '../utils/stars.js'

const STARS = makeStars(180, 11)
const RAYS = 25
const BODIES = {
  hole: { label: 'Black hole', surface: 1 },
  neutron: { label: 'Neutron star', surface: 2.4 },
}

function buildRays({ w, h, cx, cy, rs, surface, mode }) {
  const bounds = { minX: -20, minY: -20, maxX: w + 20, maxY: h + 20 }
  const out = []
  for (let i = 0; i < RAYS; i++) {
    const y = h * (0.04 + (0.92 * i) / (RAYS - 1))
    const ray = traceRay({ x: 0, y }, { x: 1, y: 0 }, { cx, cy, rs, surface: rs * surface, mode, bounds, maxStep: 6 })
    const lens = [0]
    for (let k = 1; k < ray.points.length; k++) {
      const a = ray.points[k - 1]
      const b = ray.points[k]
      lens.push(lens[k - 1] + Math.hypot(b.x - a.x, b.y - a.y))
    }
    out.push({ ...ray, lens, total: lens[lens.length - 1], b: y - cy })
  }
  return out
}

function pointAt(ray, dist) {
  const { lens, points } = ray
  let lo = 0
  let hi = lens.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (lens[mid] < dist) lo = mid + 1
    else hi = mid
  }
  return points[lo]
}

export default function LightLab() {
  const [mass, setMass] = useState(0.45)
  const [kind, setKind] = useState('hole')
  const [newton, setNewton] = useState(false)
  const [stats, setStats] = useState({ captured: 0, maxBend: 0 })
  const pos = useRef({ x: 0.58, y: 0.5 })
  const cache = useRef({ key: '', gr: [], nw: [] })
  const clock = useRef(0)
  const dragging = useRef(false)
  const size = useRef({ w: 1, h: 1 })

  const rsFor = (w, h) => (4 + 56 * mass) * (Math.min(w, h) / 420)

  const frame = (ctx, w, h, dt) => {
    size.current = { w, h }
    clock.current += dt
    const cx = pos.current.x * w
    const cy = pos.current.y * h
    const rs = rsFor(w, h)
    const surface = BODIES[kind].surface
    const key = [w, h, cx.toFixed(1), cy.toFixed(1), rs.toFixed(2), kind, newton].join('|')
    const c = cache.current
    if (c.key !== key) {
      c.key = key
      c.gr = buildRays({ w, h, cx, cy, rs, surface, mode: 'gr' })
      c.nw = newton ? buildRays({ w, h, cx, cy, rs, surface, mode: 'newton' }) : []
      const captured = c.gr.filter((r) => r.fate === 'captured').length
      const maxBend = c.gr
        .filter((r) => r.fate === 'escaped')
        .reduce((m, r) => Math.max(m, Math.abs(Math.atan2(r.dir.y, r.dir.x))), 0)
      setStats({ captured, maxBend: (maxBend * 180) / Math.PI })
    }

    drawSpace(ctx, w, h, STARS)

    // emitter
    ctx.fillStyle = '#ffd27a'
    ctx.fillRect(0, h * 0.03, 3, h * 0.94)

    // Newton's guess
    if (newton) {
      ctx.setLineDash([4, 5])
      ctx.strokeStyle = 'rgba(120,200,255,0.65)'
      ctx.lineWidth = 1.2
      for (const r of c.nw) strokePath(ctx, r.points)
      ctx.setLineDash([])
    }

    // Einstein's light
    ctx.lineWidth = 1.4
    for (const r of c.gr) {
      ctx.strokeStyle = r.fate === 'captured' ? 'rgba(255,100,90,0.75)' : 'rgba(255,214,130,0.8)'
      strokePath(ctx, r.points)
    }

    // moving photons
    ctx.fillStyle = '#ffffff'
    const speed = 160
    for (const r of c.gr) {
      if (r.total < 2) continue
      for (let k = 0; k < 2; k++) {
        const d = (clock.current * speed + k * (r.total / 2)) % r.total
        const p = pointAt(r, d)
        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // the body
    if (kind === 'hole') {
      const glow = ctx.createRadialGradient(cx, cy, rs, cx, cy, rs * 2.6)
      glow.addColorStop(0, 'rgba(255,150,60,0.35)')
      glow.addColorStop(1, 'rgba(255,150,60,0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(cx, cy, rs * 2.6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      ctx.beginPath()
      ctx.arc(cx, cy, rs, 0, Math.PI * 2)
      ctx.fill()
      ctx.setLineDash([3, 4])
      ctx.strokeStyle = 'rgba(255,170,90,0.7)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(cx, cy, rs * PHOTON_SPHERE, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      if (rs > 16) {
        ctx.fillStyle = 'rgba(255,200,150,0.85)'
        ctx.font = '11px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('photon sphere', cx, cy - rs * PHOTON_SPHERE - 6)
      }
    } else {
      const R = rs * surface
      const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R)
      g.addColorStop(0, '#ffffff')
      g.addColorStop(1, '#6aa8ff')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const move = (p) => {
    const { w, h } = size.current
    pos.current = { x: Math.min(0.92, Math.max(0.15, p.x / w)), y: Math.min(0.95, Math.max(0.05, p.y / h)) }
  }

  return (
    <div className="lab">
      <div className="stage">
        <Canvas
          frame={frame}
          label="Light rays bending around a black hole"
          onPointerDown={(p) => {
            dragging.current = true
            move(p)
          }}
          onPointerMove={(p) => dragging.current && move(p)}
          onPointerUp={() => (dragging.current = false)}
        />
        <div className="overlay bottom hint">Drag to move the {BODIES[kind].label.toLowerCase()}</div>
      </div>

      <aside className="panel">
        <header className="lab-head">
          <h2>Light</h2>
          <p>
            Light has no mass, but it still bends around heavy things, because it follows curved spacetime. Close
            enough to a black hole, light falls in and never comes out.
          </p>
        </header>

        <section className="card">
          <div className="chips">
            {Object.entries(BODIES).map(([id, b]) => (
              <button key={id} type="button" className={`chip ${kind === id ? 'on' : ''}`} onClick={() => setKind(id)}>
                {b.label}
              </button>
            ))}
          </div>
          <label className="slider">
            <span>
              Mass <b className="num">{Math.round(mass * 100)}%</b>
            </span>
            <input type="range" min="0" max="1" step="0.01" value={mass} onChange={(e) => setMass(Number(e.target.value))} />
          </label>
          <label className="toggle">
            <input type="checkbox" checked={newton} onChange={(e) => setNewton(e.target.checked)} />
            Show Newton's guess (blue dashes)
          </label>
          <div className="stats">
            <div>
              <b className="num">
                {stats.captured} / {RAYS}
              </b>
              <span>{kind === 'hole' ? 'beams swallowed' : 'beams hit the star'}</span>
            </div>
            <div>
              <b className="num">{stats.maxBend.toFixed(0)}°</b>
              <span>most bent escaping beam</span>
            </div>
          </div>
        </section>

        <section className="card">
          <h3>Try this</h3>
          <ul className="tips">
            <li>Turn on Newton's guess. Einstein's light (gold) bends about twice as much.</li>
            <li>Drag the black hole close to a beam. Some beams wrap around and fly back the way they came.</li>
            <li>Switch to Neutron star: light bends hard, but it hits the surface instead of vanishing.</li>
          </ul>
        </section>

        <ControlDrawer title="The science" defaultOpen={false}>
          <p>
            In 1919, astronomers photographed stars next to the Sun during an eclipse. The starlight was bent by 1.75
            arcseconds: exactly Einstein's number, twice Newton's. It made Einstein famous overnight.
          </p>
          <p>
            Today we see whole galaxies stretched into arcs and rings by the gravity of galaxies in front of them. This is
            called gravitational lensing.
          </p>
          <p>
            At 1.5× the horizon (the photon sphere), light can circle a black hole. Inside the horizon, every path leads
            in. These gold paths are calculated with Einstein's equations, not faked.
          </p>
        </ControlDrawer>
      </aside>
    </div>
  )
}

function strokePath(ctx, pts) {
  ctx.beginPath()
  pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
  ctx.stroke()
}
