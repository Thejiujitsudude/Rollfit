import { useRef, useState } from 'react'
import Canvas from '../components/Canvas.jsx'
import ControlDrawer from '../components/ControlDrawer.jsx'
import { orbitPosition, periodYears } from '../physics/kepler.js'
import { makeStars, drawSpace } from '../utils/stars.js'

const STARS = makeStars(150, 61)
const WEDGES = 12 // slices of equal time per orbit
const SECONDS_PER_ORBIT = 9
const PRESETS = [
  { id: 'earth', name: 'Earth', a: 1, e: 0.017 },
  { id: 'mars', name: 'Mars', a: 1.524, e: 0.093 },
  { id: 'mercury', name: 'Mercury', a: 0.387, e: 0.206 },
  { id: 'halley', name: "Halley's Comet", a: 17.8, e: 0.967 },
]

export default function KeplerLab() {
  const [e, setE] = useState(0.5)
  const [a, setA] = useState(1)
  const [presetId, setPresetId] = useState(null)
  const [wedges, setWedges] = useState(true)
  const M = useRef(0)

  const frame = (ctx, w, h, dt) => {
    M.current = (M.current + (dt / SECONDS_PER_ORBIT) * 2 * Math.PI) % (2 * Math.PI)
    drawSpace(ctx, w, h, STARS)
    const bSemi = Math.sqrt(1 - e * e)
    // fit the ellipse (in units of a) on screen
    const scale = Math.min((w - 40) / (2 + 0.001), (h - 60) / (2 * bSemi + 0.001)) * 0.95
    const cx = w / 2 + e * scale // sun at the focus
    const cy = h / 2
    const P = (m) => {
      const p = orbitPosition(1, e, m)
      return { x: cx + p.x * scale, y: cy - p.y * scale }
    }

    // equal-time wedges
    if (wedges) {
      const cur = Math.floor((M.current / (2 * Math.PI)) * WEDGES)
      for (let k = 0; k < WEDGES; k++) {
        ctx.fillStyle = k === cur ? 'rgba(255,210,122,0.35)' : k % 2 ? 'rgba(122,162,255,0.12)' : 'rgba(122,162,255,0.22)'
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        for (let j = 0; j <= 24; j++) {
          const p = P(((k + j / 24) / WEDGES) * 2 * Math.PI)
          ctx.lineTo(p.x, p.y)
        }
        ctx.closePath()
        ctx.fill()
      }
    }

    // orbit path
    ctx.strokeStyle = 'rgba(220,226,255,0.45)'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    for (let j = 0; j <= 180; j++) {
      const p = P((j / 180) * 2 * Math.PI)
      if (j) ctx.lineTo(p.x, p.y)
      else ctx.moveTo(p.x, p.y)
    }
    ctx.stroke()

    // sun
    const sg = ctx.createRadialGradient(cx, cy, 2, cx, cy, 22)
    sg.addColorStop(0, '#fff6d6')
    sg.addColorStop(0.5, '#ffc04d')
    sg.addColorStop(1, 'rgba(255,150,40,0)')
    ctx.fillStyle = sg
    ctx.beginPath()
    ctx.arc(cx, cy, 22, 0, Math.PI * 2)
    ctx.fill()

    // planet
    const p = P(M.current)
    ctx.fillStyle = '#7ad3ff'
    ctx.beginPath()
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,214,130,0.6)'
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()

    const r = Math.hypot(p.x - cx, p.y - cy) / scale
    const speed = Math.sqrt(2 / r - 1) // in units of the average speed
    ctx.fillStyle = 'rgba(220,226,255,0.85)'
    ctx.font = '12px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`speed ${speed.toFixed(2)}× (1 = steady circle speed)`, 12, h - 12)
  }

  const setPreset = (p) => {
    setPresetId(p.id)
    setA(p.a)
    setE(p.e)
  }
  const T = periodYears(a)

  return (
    <div className="lab">
      <div className="stage">
        <Canvas frame={frame} label="A planet orbiting the Sun with equal-time slices" />
      </div>
      <aside className="panel">
        <header className="lab-head">
          <h2>Kepler's Laws</h2>
          <p>
            Planets move in stretched circles (ellipses). They speed up near the Sun and slow down far away, so each
            colored slice is swept in the same amount of time, and every slice has the same area.
          </p>
        </header>
        <section className="card">
          <div className="chips">
            {PRESETS.map((p) => (
              <button key={p.id} type="button" className={`chip ${p.id === presetId ? 'on' : ''}`} onClick={() => setPreset(p)}>
                {p.name}
              </button>
            ))}
          </div>
          <label className="slider">
            <span>
              Stretch (eccentricity) <b className="num">{e.toFixed(3)}</b>
            </span>
            <input
              type="range"
              min="0"
              max="0.97"
              step="0.001"
              value={e}
              onChange={(ev) => {
                setE(Number(ev.target.value))
                setPresetId(null)
              }}
            />
          </label>
          <label className="slider">
            <span>
              Size <b className="num">{a.toFixed(2)} AU</b> (Earth = 1)
            </span>
            <input
              type="range"
              min="0.3"
              max="40"
              step="0.01"
              value={a}
              onChange={(ev) => {
                setA(Number(ev.target.value))
                setPresetId(null)
              }}
            />
          </label>
          <div className="stats">
            <div>
              <b className="num">{T < 2 ? `${(T * 365.25).toFixed(0)} days` : `${T.toFixed(1)} years`}</b>
              <span>one trip around the Sun</span>
            </div>
            <div>
              <b className="num">{((1 + e) / (1 - e)).toFixed(1)}×</b>
              <span>farthest vs closest</span>
            </div>
          </div>
          <label className="toggle">
            <input type="checkbox" checked={wedges} onChange={(ev) => setWedges(ev.target.checked)} />
            Show equal-time slices
          </label>
        </section>
        <ControlDrawer title="The science" defaultOpen={false}>
          <p>Johannes Kepler found three rules in 1609-1619 by studying years of Mars measurements:</p>
          <p>
            <b>1.</b> Orbits are ellipses with the Sun at one focus, not the center.
          </p>
          <p>
            <b>2.</b> A line from the Sun to the planet sweeps equal areas in equal times.
          </p>
          <p>
            <b>3.</b> Bigger orbits take much longer: time² = size³. Double the size and the year is 2.8× longer.
          </p>
          <p>Newton later showed all three come from one rule: gravity weakens with distance squared.</p>
        </ControlDrawer>
      </aside>
    </div>
  )
}
