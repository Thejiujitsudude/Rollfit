import { useState } from 'react'
import Canvas from '../components/Canvas.jsx'
import ControlDrawer from '../components/ControlDrawer.jsx'
import EnergyPanel from '../components/EnergyPanel.jsx'
import ZoneBar from '../components/ZoneBar.jsx'
import PredictPanel from '../components/PredictPanel.jsx'
import ChallengeList from '../components/ChallengeList.jsx'
import StatusPill from '../components/StatusPill.jsx'
import useLaunchPhysics from '../hooks/useLaunchPhysics.js'
import { planets } from '../data/planets.js'
import { vehicles } from '../data/vehicles.js'
import { challenges } from '../data/challenges.js'
import { circularSpeed, escapeSpeed } from '../physics/orbital-energy.js'
import { makeStars, drawSpace } from '../utils/stars.js'
import { fmtSpeed, fmtDistance } from '../utils/format.js'
import { loadJSON, saveJSON } from '../utils/storage.js'

const STARS = makeStars(160, 7)
const VIEW_R = 3.3 // planet radii from screen center to the nearest edge
const MAX_FRAC = 1.3 // slider goes to 130% of escape speed
const CH_KEY = 'gravitylab:challenges'

const STATUS = {
  ready: { tone: 'idle', label: 'Ready' },
  flying: { tone: 'live', label: 'In flight' },
  crash: { tone: 'crash', label: 'Crashed' },
  orbit: { tone: 'orbit', label: 'In orbit' },
  escape: { tone: 'escape', label: 'Escaped' },
}

export default function OrbitsLab() {
  const [planetId, setPlanetId] = useState('earth')
  const [vehicleId, setVehicleId] = useState('cannonball')
  const [speedFrac, setSpeedFrac] = useState(0.6)
  const [angle, setAngle] = useState(0)
  const [fast, setFast] = useState(false)
  const [predicted, setPredicted] = useState(null)
  const [result, setResult] = useState(null)
  const [done, setDone] = useState(() => new Set(loadJSON(CH_KEY, [])))
  const [toast, setToast] = useState(null)

  const planet = planets.find((p) => p.id === planetId)
  const vehicle = vehicles.find((v) => v.id === vehicleId)

  const onOutcome = (res) => {
    const full = { ...res, angle, predicted, correct: predicted ? predicted === res.outcome : null }
    setResult(full)
    const fresh = challenges.filter((c) => !done.has(c.id) && c.test(full))
    if (fresh.length) {
      const next = new Set([...done, ...fresh.map((c) => c.id)])
      setDone(next)
      saveJSON(CH_KEY, [...next])
      setToast(`Challenge done: ${fresh.map((c) => c.title).join(', ')}`)
      setTimeout(() => setToast(null), 3000)
    }
  }

  const sim = useLaunchPhysics(planet, onOutcome)
  const { r0, tele } = sim
  const vEsc = escapeSpeed(planet.mu, r0)
  const vCirc = circularSpeed(planet.mu, r0)
  const speed = speedFrac * vEsc
  const flying = tele.status === 'flying'
  const status = STATUS[tele.status]

  const launch = () => {
    setResult(null)
    sim.launch(speed, angle)
  }

  const pickPlanet = (id) => {
    setPlanetId(id)
    setResult(null)
    sim.reset()
  }

  const frame = (ctx, w, h, dt) => {
    sim.step(dt, fast ? 4 : 1)
    const s = sim.ref.current
    drawSpace(ctx, w, h, STARS)
    const R = planet.radius
    const scale = Math.min(w, h) / 2 / (VIEW_R * R)
    const cx = w / 2
    const cy = h / 2 + Math.min(w, h) * 0.06
    const X = (x) => cx + x * scale
    const Y = (y) => cy - y * scale
    const path = (pts) => {
      ctx.beginPath()
      pts.forEach((p, i) => (i ? ctx.lineTo(X(p.x), Y(p.y)) : ctx.moveTo(X(p.x), Y(p.y))))
      ctx.stroke()
    }

    // circular-orbit guide ring
    ctx.setLineDash([3, 6])
    ctx.strokeStyle = 'rgba(79,209,139,0.25)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(cx, cy, r0 * scale, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    // old shots
    ctx.lineWidth = 1.5
    s.ghosts.forEach((g, i) => {
      ctx.strokeStyle = `rgba(150,170,255,${0.28 - i * 0.06})`
      path(g)
    })

    // planet
    const pr = R * scale
    if (planet.atmosphere) {
      const glow = ctx.createRadialGradient(cx, cy, pr * 0.95, cx, cy, pr * 1.12)
      glow.addColorStop(0, planet.atmosphere)
      glow.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(cx, cy, pr * 1.12, 0, Math.PI * 2)
      ctx.fill()
    }
    const body = ctx.createRadialGradient(cx - pr * 0.35, cy - pr * 0.35, pr * 0.1, cx, cy, pr)
    body.addColorStop(0, planet.colorLight)
    body.addColorStop(1, planet.color)
    ctx.fillStyle = body
    ctx.beginPath()
    ctx.arc(cx, cy, pr, 0, Math.PI * 2)
    ctx.fill()

    // launch tower
    ctx.strokeStyle = '#cfd6f5'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx, Y(R))
    ctx.lineTo(cx, Y(r0))
    ctx.moveTo(cx - 6, Y(r0))
    ctx.lineTo(cx + 6, Y(r0))
    ctx.stroke()

    // aim arrow
    if (!flying) {
      const a = (angle * Math.PI) / 180
      const len = 18 + 70 * (speedFrac / MAX_FRAC)
      const x0 = cx
      const y0 = Y(r0)
      const x1 = x0 + Math.cos(a) * len
      const y1 = y0 - Math.sin(a) * len
      ctx.strokeStyle = '#ffd27a'
      ctx.fillStyle = '#ffd27a'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
      ctx.stroke()
      const hx = Math.cos(a)
      const hy = -Math.sin(a)
      ctx.beginPath()
      ctx.moveTo(x1 + hx * 7, y1 + hy * 7)
      ctx.lineTo(x1 - hy * 5, y1 + hx * 5)
      ctx.lineTo(x1 + hy * 5, y1 - hx * 5)
      ctx.fill()
    }

    // current trail + body
    if (s.trail.length > 1) {
      ctx.strokeStyle = '#ffd27a'
      ctx.lineWidth = 2
      path(s.trail)
    }
    if (s.body) {
      ctx.fillStyle = s.outcome === 'crash' ? '#ff5d6c' : '#ffffff'
      ctx.beginPath()
      ctx.arc(X(s.body.x), Y(s.body.y), 4.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const resetChallenges = () => {
    setDone(new Set())
    saveJSON(CH_KEY, [])
  }

  return (
    <div className="lab">
      <div className="stage">
        <Canvas frame={frame} label={`Newton's cannon on ${planet.name}`} />
        <div className="overlay top">
          <StatusPill tone={status.tone}>{status.label}</StatusPill>
          {tele.status !== 'ready' && (
            <span className="readout">
              {fmtSpeed(tele.speed)} · alt {fmtDistance(Math.max(0, tele.r - planet.radius))}
            </span>
          )}
        </div>
        {toast && <div className="toast">{toast}</div>}
      </div>

      <aside className="panel">
        <header className="lab-head">
          <h2>Orbits</h2>
          <p>
            Newton's cannon. Fire from a tall tower. Too slow and you crash. Fast enough and you keep falling but keep
            missing the ground: that's an orbit. Faster still and you escape.
          </p>
        </header>

        <section className="card">
          <div className="chips">
            {planets.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`chip ${p.id === planetId ? 'on' : ''}`}
                onClick={() => pickPlanet(p.id)}
              >
                {p.name}
              </button>
            ))}
          </div>
          <p className="muted small">{planet.fact}</p>

          <label className="slider">
            <span>
              Launch speed <b className="num">{fmtSpeed(speed)}</b>
            </span>
            <input
              type="range"
              min="0"
              max={MAX_FRAC}
              step="0.001"
              value={speedFrac}
              disabled={flying}
              onChange={(e) => setSpeedFrac(Number(e.target.value))}
            />
          </label>
          <ZoneBar mu={planet.mu} radius={planet.radius} r0={r0} angle={angle} max={MAX_FRAC * vEsc} value={speed} />
          <div className="quick">
            <button type="button" className="linkbtn" disabled={flying} onClick={() => setSpeedFrac(vCirc / vEsc)}>
              Set to circle speed
            </button>
            <button type="button" className="linkbtn" disabled={flying} onClick={() => setSpeedFrac(1)}>
              Set to escape speed
            </button>
          </div>

          <label className="slider">
            <span>
              Launch angle <b className="num">{angle}°</b> {angle === 0 ? '(level)' : 'upward'}
            </span>
            <input
              type="range"
              min="0"
              max="60"
              step="1"
              value={angle}
              disabled={flying}
              onChange={(e) => setAngle(Number(e.target.value))}
            />
          </label>

          <div className="actions">
            {flying ? (
              <button type="button" className="btn" onClick={() => setFast((f) => !f)}>
                {fast ? 'Normal speed' : 'Fast forward'}
              </button>
            ) : (
              <button type="button" className="btn primary" onClick={launch}>
                Launch
              </button>
            )}
            <button type="button" className="btn" onClick={sim.reset}>
              Clear
            </button>
          </div>
        </section>

        <PredictPanel predicted={predicted} onPredict={setPredicted} result={result} locked={flying} />

        <EnergyPanel
          mass={vehicle.mass}
          mu={planet.mu}
          r0={r0}
          r={tele.status === 'ready' ? r0 : tele.r}
          speed={tele.status === 'ready' ? speed : tele.speed}
        />

        <ControlDrawer title="Vehicle" defaultOpen={false}>
          <div className="chips">
            {vehicles.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`chip ${v.id === vehicleId ? 'on' : ''}`}
                onClick={() => setVehicleId(v.id)}
              >
                {v.name}
              </button>
            ))}
          </div>
          <p className="muted small">
            Swap vehicles and launch again: same path every time. Gravity pulls a cannonball and a space station
            with the same acceleration. Only the energy numbers change.
          </p>
        </ControlDrawer>

        <ChallengeList items={challenges} done={done} onReset={resetChallenges} />

        <ControlDrawer title="The science" defaultOpen={false}>
          <p>
            Isaac Newton imagined this exact cannon in 1687. The planet's surface curves away as you fly. At about{' '}
            {fmtSpeed(vCirc)} here, the ground curves away exactly as fast as you fall. You never land.
          </p>
          <p>
            Escape speed ({fmtSpeed(vEsc)} here) is exactly √2 times circle speed. At that point your total energy
            hits zero and gravity can never pull you back.
          </p>
          <p>Astronauts float because they are falling around Earth with their ship, not because gravity is gone.</p>
        </ControlDrawer>
      </aside>
    </div>
  )
}
