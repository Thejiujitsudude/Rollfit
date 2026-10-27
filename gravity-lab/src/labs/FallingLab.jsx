import { useRef, useState } from 'react'
import Canvas from '../components/Canvas.jsx'
import ControlDrawer from '../components/ControlDrawer.jsx'
import LabIntro from '../components/LabIntro.jsx'
import { fallStep } from '../physics/motion.js'

const HEIGHT = 10 // meters
const OBJECTS = [
  { id: 'bowling', name: 'Bowling ball', vt: 90, color: '#5f6bff', r: 13 },
  { id: 'hammer', name: 'Hammer', vt: 40, color: '#c9ced9', r: 10 },
  { id: 'paper', name: 'Sheet of paper', vt: 1.5, color: '#f2f2f2', r: 10 },
  { id: 'feather', name: 'Feather', vt: 0.6, color: '#ffd27a', r: 9 },
]
const WORLDS = [
  { id: 'earth', name: 'Earth', g: 9.81, air: 1 },
  { id: 'moon', name: 'Moon', g: 1.62, air: 0 },
  { id: 'mars', name: 'Mars', g: 3.71, air: 0.016 },
  { id: 'jupiter', name: 'Jupiter', g: 24.79, air: 0.13 },
]

export default function FallingLab() {
  const [left, setLeft] = useState('hammer')
  const [right, setRight] = useState('feather')
  const [worldId, setWorldId] = useState('earth')
  const [air, setAir] = useState(true)
  const [times, setTimes] = useState({})
  const sim = useRef(null)

  const world = WORLDS.find((w) => w.id === worldId)
  const airOn = air && world.air > 0
  const objs = [OBJECTS.find((o) => o.id === left), OBJECTS.find((o) => o.id === right)]
  // air = density vs Earth's. Terminal speed scales with sqrt(g / density).
  const vtOf = (o) => (airOn ? o.vt * Math.sqrt(world.g / 9.81 / world.air) : Infinity)

  const drop = () => {
    sim.current = { t: 0, bodies: objs.map(() => ({ y: 0, v: 0, done: null })) }
    setTimes({})
  }

  const frame = (ctx, w, h, dt) => {
    const s = sim.current
    if (s) {
      s.t += dt
      s.bodies.forEach((b, i) => {
        if (b.done !== null) return
        const sub = 10
        for (let k = 0; k < sub; k++) Object.assign(b, fallStep(b, dt / sub, world.g, vtOf(objs[i])))
        if (b.y >= HEIGHT) {
          b.y = HEIGHT
          b.done = s.t
          setTimes((t) => ({ ...t, [i]: s.t }))
        }
      })
    }
    ctx.fillStyle = airOn ? '#0c1630' : '#05070f'
    ctx.fillRect(0, 0, w, h)
    const top = 40
    const ground = h - 36
    ctx.fillStyle = world.id === 'moon' ? '#6d6d75' : world.id === 'mars' ? '#7a3417' : world.id === 'jupiter' ? '#8a6038' : '#2d5a2d'
    ctx.fillRect(0, ground, w, h - ground)
    objs.forEach((o, i) => {
      const x = w * (i === 0 ? 0.32 : 0.68)
      const b = s?.bodies[i]
      const y = top + ((b?.y ?? 0) / HEIGHT) * (ground - top - o.r)
      ctx.fillStyle = o.color
      ctx.beginPath()
      if (o.id === 'feather') ctx.ellipse(x, y, o.r * 1.6, o.r * 0.5, -0.4, 0, Math.PI * 2)
      else if (o.id === 'paper') ctx.rect(x - o.r * 1.4, y - 2, o.r * 2.8, 4)
      else ctx.arc(x, y, o.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(220,226,255,0.85)'
      ctx.font = '12px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(o.name, x, 22)
      const t = b?.done ?? (s ? s.t : null)
      if (t !== null) ctx.fillText(`${t.toFixed(2)} s`, x, h - 14)
    })
  }

  const picker = (value, set) => (
    <div className="chips">
      {OBJECTS.map((o) => (
        <button key={o.id} type="button" className={`chip ${o.id === value ? 'on' : ''}`} onClick={() => set(o.id)}>
          {o.name}
        </button>
      ))}
    </div>
  )

  const done = times[0] !== undefined && times[1] !== undefined
  return (
    <div className="lab">
      <div className="stage">
        <Canvas frame={frame} label="Two objects dropped from 10 meters" />
      </div>
      <aside className="panel">
        <header className="lab-head">
          <h2>Falling</h2>
          <p>Does heavy stuff fall faster? Drop two things from 10 m. Then turn the air off and try again.</p>
        </header>
        <LabIntro id="falling" />
        <section className="card">
          <div className="chips">
            {WORLDS.map((wd) => (
              <button key={wd.id} type="button" className={`chip ${wd.id === worldId ? 'on' : ''}`} onClick={() => setWorldId(wd.id)}>
                {wd.name}
              </button>
            ))}
          </div>
          <label className="toggle">
            <input type="checkbox" checked={airOn} disabled={world.air === 0} onChange={(e) => setAir(e.target.checked)} />
            {world.air === 0 ? 'No air on the Moon' : 'Air'}
          </label>
          <span className="small muted">Left</span>
          {picker(left, setLeft)}
          <span className="small muted">Right</span>
          {picker(right, setRight)}
          <button type="button" className="btn primary" onClick={drop}>
            Drop both
          </button>
          {done && (
            <p className="verdict">
              {Math.abs(times[0] - times[1]) < 0.02
                ? airOn
                  ? 'Tie (to the eye). Gravity speeds everything up at the same rate, and air barely slows heavy, compact things.'
                  : 'Tie. Without air pushing back, everything falls at exactly the same rate.'
                : `${times[0] < times[1] ? objs[0].name : objs[1].name} wins by ${Math.abs(times[0] - times[1]).toFixed(2)} s. Air pushes back harder on light, wide things.`}
            </p>
          )}
        </section>
        <ControlDrawer title="The science" defaultOpen={false}>
          <p>
            Galileo figured out that weight doesn't decide falling speed. Newton explained why: a heavier object gets pulled
            harder, but it is also harder to speed up. The two cancel exactly.
          </p>
          <p>
            In 1971, astronaut David Scott dropped a hammer and a feather on the Moon. They hit the ground at the same time.
          </p>
          <p>Einstein took this seriously. It became the seed of his theory of gravity (see the Elevator lab).</p>
        </ControlDrawer>
      </aside>
    </div>
  )
}
