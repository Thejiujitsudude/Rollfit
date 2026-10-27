import { useRef, useState } from 'react'
import Canvas from '../components/Canvas.jsx'
import ControlDrawer from '../components/ControlDrawer.jsx'
import LabIntro from '../components/LabIntro.jsx'
import { jump } from '../physics/motion.js'
import { makeStars, drawSpace } from '../utils/stars.js'

const STARS = makeStars(120, 71)
const V0 = 2.6 // takeoff speed of a decent jump, m/s (about 34 cm / 13 in on Earth)
const EARTH_G = 9.81
const FT = 3.28084
const WORLDS = [
  { id: 'ceres', name: 'Ceres', g: 0.28, ground: '#56565c', note: 'A dwarf planet in the asteroid belt.' },
  { id: 'pluto', name: 'Pluto', g: 0.62, ground: '#c9b39a', note: 'Tiny and icy.' },
  { id: 'moon', name: 'Moon', g: 1.62, ground: '#77777f', note: 'Astronauts bounced around like kangaroos.' },
  { id: 'mars', name: 'Mars', g: 3.71, ground: '#8f3410', note: 'Future Mars athletes will crush high-jump records.' },
  { id: 'earth', name: 'Earth', g: 9.81, ground: '#2d5a2d', note: 'Home. Your normal jump.' },
  { id: 'jupiter', name: 'Jupiter', g: 24.79, ground: '#8a6038', note: 'No solid ground, so imagine a platform at the cloud tops.' },
  { id: 'sun', name: 'The Sun', g: 274, ground: '#ff9c2a', note: 'Imaginary heat-proof suit required.' },
  { id: 'neutron', name: 'Neutron star', g: 1.0e12, ground: '#6aa8ff', note: 'Gravity about 100 billion times Earth\'s. The tallest mountains are thought to be about a millimeter tall. Your jump would be smaller than an atom.' },
]

const fmtLen = (m) => {
  const ft = m * FT
  if (m < 1e-6) return `${(m * 1e9).toPrecision(2)} nanometers`
  if (m < 0.01) return `${(m * 1000).toPrecision(2)} mm`
  if (ft < 3) return `${(ft * 12).toFixed(1)} in`
  return `${ft.toFixed(1)} ft`
}
const fmtTime = (s) => (s < 0.001 ? `${(s * 1e6).toPrecision(2)} microseconds` : `${s.toFixed(s < 10 ? 2 : 0)} s`)

export default function JumpLab() {
  const [worldId, setWorldId] = useState('moon')
  const [lb, setLb] = useState(180)
  const world = WORLDS.find((w) => w.id === worldId)
  const jumpRef = useRef(null)
  const { height, hang } = jump(V0, world.g)
  const earth = jump(V0, EARTH_G)

  const frame = (ctx, w, h, dt) => {
    drawSpace(ctx, w, h, STARS)
    const ground = h - 40
    ctx.fillStyle = world.ground
    ctx.fillRect(0, ground, w, h - ground)
    // vertical scale fits the jump (min shows Earth's jump decently)
    const maxM = Math.max(height, earth.height) * 1.25 + 1.9
    const ppm = (ground - 30) / maxM
    const j = jumpRef.current
    let y = 0
    if (j) {
      // slow down long jumps so they finish in about 4 s of real time
      const slow = Math.max(1, hang / 4)
      j.t += dt * slow
      if (j.t >= hang) jumpRef.current = null
      else y = V0 * j.t - 0.5 * world.g * j.t * j.t
    }
    // Earth jump marker
    const ey = ground - earth.height * ppm
    ctx.setLineDash([4, 5])
    ctx.strokeStyle = 'rgba(122,211,255,0.6)'
    ctx.beginPath()
    ctx.moveTo(w * 0.5, ey)
    ctx.lineTo(w - 10, ey)
    ctx.stroke()
    // this world's peak
    const py = ground - height * ppm
    ctx.strokeStyle = 'rgba(255,214,130,0.7)'
    ctx.beginPath()
    ctx.moveTo(w * 0.5, py)
    ctx.lineTo(w - 10, py)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.font = '12px system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillStyle = 'rgba(122,211,255,0.9)'
    ctx.fillText('Earth jump', w - 12, ey - 5)
    ctx.fillStyle = 'rgba(255,214,130,0.95)'
    if (Math.abs(py - ey) > 14) ctx.fillText(`${world.name} jump`, w - 12, py - 5)
    // jumper (1.8 m tall)
    jumper(ctx, w * 0.35, ground - y * ppm, 1.8 * ppm)
  }

  return (
    <div className="lab">
      <div className="stage">
        <Canvas frame={frame} label={`Jumping on ${world.name}`} onPointerDown={() => (jumpRef.current = { t: 0 })} />
        <div className="overlay bottom hint">Tap to jump</div>
      </div>
      <aside className="panel">
        <header className="lab-head">
          <h2>Planet Jump</h2>
          <p>Same legs, same takeoff speed, different worlds. Weaker gravity pulls you back slower, so you fly higher and hang longer.</p>
        </header>
        <LabIntro id="jump" />
        <section className="card">
          <div className="chips">
            {WORLDS.map((wd) => (
              <button key={wd.id} type="button" className={`chip ${wd.id === worldId ? 'on' : ''}`} onClick={() => setWorldId(wd.id)}>
                {wd.name}
              </button>
            ))}
          </div>
          <p className="muted small">{world.note}</p>
          <div className="stats">
            <div>
              <b className="num">{fmtLen(height)}</b>
              <span>jump height</span>
            </div>
            <div>
              <b className="num">{fmtTime(hang)}</b>
              <span>time in the air</span>
            </div>
          </div>
          <label className="slider">
            <span>
              Your weight on Earth <b className="num">{lb} lb</b>
            </span>
            <input type="range" min="60" max="350" step="5" value={lb} onChange={(e) => setLb(Number(e.target.value))} />
          </label>
          <div className="big-stat">
            <b className="num">
              {(() => {
                const v = (lb * world.g) / EARTH_G
                return v >= 1e12 ? `${(v / 1e12).toPrecision(3)} trillion lb` : v >= 1e6 ? `${(v / 1e6).toPrecision(3)} million lb` : `${v.toFixed(0)} lb`
              })()}
            </b>
            <span>what you'd weigh on {world.name}</span>
          </div>
          <button type="button" className="btn primary" onClick={() => (jumpRef.current = { t: 0 })}>
            Jump
          </button>
        </section>
        <ControlDrawer title="The science" defaultOpen={false}>
          <p>
            Your mass (how much stuff you're made of) never changes. Your weight is how hard a world's gravity pulls on that
            mass. Bigger, denser worlds pull harder.
          </p>
          <p>
            Surface gravity depends on mass ÷ radius². Jupiter is 318 times Earth's mass but also 11 times wider, so its
            pull is only about 2.5 times Earth's.
          </p>
        </ControlDrawer>
      </aside>
    </div>
  )
}

function jumper(ctx, x, feet, tall) {
  const s = tall / 100
  ctx.strokeStyle = '#ffd27a'
  ctx.fillStyle = '#ffd27a'
  ctx.lineWidth = Math.max(2, 4 * s)
  const hip = feet - 48 * s
  const neck = feet - 84 * s
  ctx.beginPath()
  ctx.arc(x, neck - 8 * s, 8 * s, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(x, neck)
  ctx.lineTo(x, hip)
  ctx.moveTo(x, neck + 6 * s)
  ctx.lineTo(x - 18 * s, neck - 10 * s)
  ctx.moveTo(x, neck + 6 * s)
  ctx.lineTo(x + 18 * s, neck - 10 * s)
  ctx.moveTo(x, hip)
  ctx.lineTo(x - 10 * s, feet)
  ctx.moveTo(x, hip)
  ctx.lineTo(x + 10 * s, feet)
  ctx.stroke()
}
