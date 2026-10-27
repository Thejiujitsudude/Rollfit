import { useRef, useState } from 'react'
import Canvas from '../components/Canvas.jsx'
import ControlDrawer from '../components/ControlDrawer.jsx'
import { stepProbe, accelAt, planetAt } from '../physics/slingshot.js'
import { makeStars, drawSpace } from '../utils/stars.js'
import { loadJSON, saveJSON } from '../utils/storage.js'

const STARS = makeStars(150, 81)
const U = 600 // world units across the short side of the screen
const MU = 1.2e6 // planet gravity (world units)
const PLANET_R = 22
const PLANET_V = 90 // planet speed, units/s (it moves up the screen)
const MAX_LAUNCH = 230
const SUBSTEPS = 6
const DONE_KEY = 'gravitylab:slingshot'

const LEVELS = [
  {
    id: 'boost',
    title: 'Speed boost',
    goal: 'Leave the screen at least 1.5× faster than you launched.',
    check: (r) => r.exit && r.ratio >= 1.5,
  },
  {
    id: 'brake',
    title: 'Brake',
    goal: 'Leave the screen at 0.6× your launch speed or slower. Probes to Mercury do this.',
    check: (r) => r.exit && r.ratio <= 0.6,
  },
  {
    id: 'uturn',
    title: 'U-turn',
    goal: 'Use the planet to turn around and come back out the left side.',
    check: (r) => r.exit === 'left',
  },
]

export default function SlingshotLab() {
  const [levelId, setLevelId] = useState('boost')
  const [planetView, setPlanetView] = useState(false)
  const [result, setResult] = useState(null)
  const [done, setDone] = useState(() => new Set(loadJSON(DONE_KEY, [])))
  const [live, setLive] = useState(null)
  const sim = useRef(null)
  const ghosts = useRef([])
  const aim = useRef(null)
  const world = useRef({ W: U, H: U, s: 1 })
  const lastUi = useRef(0)
  const [lastShot, setLastShot] = useState(null)
  const level = LEVELS.find((l) => l.id === levelId)

  const launchPoint = () => ({ x: 50, y: world.current.H * 0.5 })
  const planetStart = () => ({ x0: world.current.W * 0.62, y0: world.current.H * 0.92, vx: 0, vy: -PLANET_V, mu: MU })

  const launch = (vx, vy) => {
    const lp = launchPoint()
    const planet = planetStart()
    setLastShot({ vx, vy })
    const probe = { x: lp.x, y: lp.y, vx, vy }
    Object.assign(probe, accelAt(probe, planet, 0))
    if (sim.current?.trail.length > 1) ghosts.current = [sim.current.trail, ...ghosts.current].slice(0, 3)
    sim.current = { t: 0, probe, planet, v0: Math.hypot(vx, vy), trail: [], history: [], over: false }
    setResult(null)
  }

  const finish = (s, outcome) => {
    s.over = true
    const speed = Math.hypot(s.probe.vx, s.probe.vy)
    const r = { ...outcome, ratio: speed / s.v0, speed, v0: s.v0 }
    r.win = level.check(r)
    setResult(r)
    if (r.win && !done.has(level.id)) {
      const next = new Set([...done, level.id])
      setDone(next)
      saveJSON(DONE_KEY, [...next])
    }
  }

  const frame = (ctx, w, h, dt) => {
    const sc = Math.min(w, h) / U
    world.current = { W: w / sc, H: h / sc, s: sc }
    const { W, H } = world.current
    const s = sim.current

    if (s && !s.over) {
      const step = dt / SUBSTEPS
      for (let i = 0; i < SUBSTEPS && !s.over; i++) {
        s.probe = stepProbe(s.probe, s.planet, s.t, step)
        s.t += step
        const pl = planetAt(s.planet, s.t)
        const p = s.probe
        if (Math.hypot(p.x - pl.x, p.y - pl.y) < PLANET_R) finish(s, { crash: true })
        else if (p.x < -40) finish(s, { exit: 'left' })
        else if (p.x > W + 40) finish(s, { exit: 'right' })
        else if (p.y < -40 || p.y > H + 40) finish(s, { exit: 'edge' })
        else if (s.t > 20) finish(s, { lost: true })
      }
      const pl = planetAt(s.planet, s.t)
      s.trail.push({ x: s.probe.x, y: s.probe.y, px: pl.x, py: pl.y })
      s.history.push(Math.hypot(s.probe.vx, s.probe.vy))
      if (performance.now() - lastUi.current > 120) {
        lastUi.current = performance.now()
        setLive({ speed: Math.hypot(s.probe.vx, s.probe.vy), v0: s.v0 })
      }
    }

    drawSpace(ctx, w, h, STARS)
    const pl = s ? planetAt(s.planet, s.t) : { x: planetStart().x0, y: planetStart().y0 }
    // In planet view, the camera rides along with the planet.
    const cam = planetView ? { x: pl.x - W * 0.62, y: pl.y - H * 0.5 } : { x: 0, y: 0 }
    const X = (x) => (x - cam.x) * sc
    const Y = (y) => (y - cam.y) * sc
    const trailPt = (p) => (planetView ? { x: p.x - p.px + pl.x, y: p.y - p.py + pl.y } : p)

    // planet path
    if (!planetView) {
      ctx.setLineDash([4, 6])
      ctx.strokeStyle = 'rgba(240,201,149,0.25)'
      ctx.beginPath()
      ctx.moveTo(X(pl.x), 0)
      ctx.lineTo(X(pl.x), h)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // old attempts
    ctx.lineWidth = 1.5
    ghosts.current.forEach((g, i) => {
      ctx.strokeStyle = `rgba(150,170,255,${0.3 - i * 0.08})`
      path(ctx, g.map(trailPt), X, Y)
    })

    // planet
    const pr = PLANET_R * sc
    const g = ctx.createRadialGradient(X(pl.x) - pr * 0.3, Y(pl.y) - pr * 0.3, pr * 0.1, X(pl.x), Y(pl.y), pr)
    g.addColorStop(0, '#f0c995')
    g.addColorStop(1, '#9a6a3d')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(X(pl.x), Y(pl.y), pr, 0, Math.PI * 2)
    ctx.fill()
    if (!planetView) arrowUp(ctx, X(pl.x) + pr + 10, Y(pl.y), 26)

    // launcher
    const lp = launchPoint()
    if (!planetView) {
      ctx.fillStyle = '#7ad3ff'
      ctx.beginPath()
      ctx.arc(X(lp.x), Y(lp.y), 5, 0, Math.PI * 2)
      ctx.fill()
    }

    // aim preview (straight line, no gravity)
    const a = aim.current
    if (a) {
      ctx.setLineDash([3, 5])
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'
      ctx.beginPath()
      ctx.moveTo(X(lp.x), Y(lp.y))
      ctx.lineTo(X(lp.x + a.vx * 1.4), Y(lp.y + a.vy * 1.4))
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#ffffff'
      ctx.font = '12px system-ui, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`launch ${Math.round(Math.hypot(a.vx, a.vy))}`, X(lp.x) + 10, Y(lp.y) - 10)
    }

    // current flight
    if (s) {
      ctx.strokeStyle = '#ffd27a'
      ctx.lineWidth = 2
      path(ctx, s.trail.map(trailPt), X, Y)
      const p = trailPt({ x: s.probe.x, y: s.probe.y, px: pl.x, py: pl.y })
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(X(p.x), Y(p.y), 4, 0, Math.PI * 2)
      ctx.fill()
      sparkline(ctx, s.history, s.v0, 12, h - 58, Math.min(160, w * 0.4), 44)
    }
  }

  const toWorld = (p) => ({ x: p.x / world.current.s, y: p.y / world.current.s })
  const onDown = (p) => {
    if (planetView) return
    aim.current = { from: toWorld(p), vx: 0, vy: 0 }
  }
  const onMove = (p) => {
    const a = aim.current
    if (!a) return
    const q = toWorld(p)
    // pull back like a slingshot: launch goes the opposite way of the drag
    let vx = (a.from.x - q.x) * 1.8
    let vy = (a.from.y - q.y) * 1.8
    const m = Math.hypot(vx, vy)
    if (m > MAX_LAUNCH) {
      vx *= MAX_LAUNCH / m
      vy *= MAX_LAUNCH / m
    }
    Object.assign(a, { vx, vy })
  }
  const onUp = () => {
    const a = aim.current
    aim.current = null
    if (a && Math.hypot(a.vx, a.vy) > 20) launch(a.vx, a.vy)
  }

  const verdict = () => {
    if (!result) return null
    if (result.crash) return 'Crashed into the planet. Aim a little wider.'
    if (result.lost) return 'Still drifting after 20 seconds. Try a faster launch.'
    const change = `Left at ${result.ratio.toFixed(2)}× launch speed.`
    return result.win ? `${change} Level complete!` : `${change} Not quite. ${level.goal}`
  }

  return (
    <div className="lab">
      <div className="stage">
        <Canvas frame={frame} label="Gravity assist game" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} />
        <div className="overlay top">
          {live && (
            <span className="readout">
              speed {Math.round(live.speed)} · {(live.speed / live.v0).toFixed(2)}× launch
            </span>
          )}
        </div>
        <div className="overlay bottom hint">
          {planetView ? 'Riding along with the planet' : 'Pull back and let go to launch (like a slingshot)'}
        </div>
      </div>
      <aside className="panel">
        <header className="lab-head">
          <h2>Slingshot</h2>
          <p>
            Space probes steal speed from planets. Fly close behind a moving planet and it drags you along. Pass in
            front and it slows you down. Time your launch to catch the planet as it goes by.
          </p>
        </header>
        <section className="card">
          <div className="card-head">
            <h3>Levels</h3>
            <span className="muted small">
              {done.size} / {LEVELS.length}
            </span>
          </div>
          <div className="chips">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                type="button"
                className={`chip ${l.id === levelId ? 'on' : ''}`}
                style={done.has(l.id) ? { '--chip': 'var(--orbit)', borderColor: 'var(--orbit)' } : undefined}
                onClick={() => {
                  setLevelId(l.id)
                  setResult(null)
                }}
              >
                {done.has(l.id) ? '✓ ' : ''}
                {l.title}
              </button>
            ))}
          </div>
          <p className="fact">{level.goal}</p>
          {result && <p className={`verdict ${result.win ? 'good' : 'bad'}`}>{verdict()}</p>}
          <label className="toggle">
            <input type="checkbox" checked={planetView} onChange={(e) => setPlanetView(e.target.checked)} />
            Watch from the planet's point of view
          </label>
          <button type="button" className="btn" disabled={!lastShot} onClick={() => launch(lastShot.vx, lastShot.vy)}>
            Retry last shot
          </button>
        </section>
        <section className="card">
          <h3>Try this</h3>
          <ul className="tips">
            <li>Aim so you cross the planet's path just after it goes by (behind it). That's the speed boost.</li>
            <li>Cross just before it arrives (in front of it) to brake.</li>
            <li>
              Turn on the planet's point of view. From there, you leave exactly as fast as you came. All the speed change is
              borrowed from the planet's own motion.
            </li>
          </ul>
        </section>
        <ControlDrawer title="The science" defaultOpen={false}>
          <p>
            Seen from the planet, a flyby is perfectly fair: you come in and leave at the same speed, just bent in a new
            direction. But the planet is racing around the Sun. Bend your path to go more with its motion and you add some
            of the planet's speed to your own. The most you can ever gain is twice the planet's speed.
          </p>
          <p>
            The planet pays for it: it slows down by a tiny, unmeasurable amount, because it is trillions of times heavier
            than the probe.
          </p>
          <p>
            Voyager 2 used Jupiter, Saturn, Uranus and Neptune one after another in the 1970s and 80s. Without those
            slingshots the trip to Neptune would have taken about 30 years instead of 12.
          </p>
          <p>Simplified here: the planet moves in a straight line and the Sun's own pull is left out. The trick is the same.</p>
        </ControlDrawer>
      </aside>
    </div>
  )
}

function path(ctx, pts, X, Y) {
  if (pts.length < 2) return
  ctx.beginPath()
  pts.forEach((p, i) => (i ? ctx.lineTo(X(p.x), Y(p.y)) : ctx.moveTo(X(p.x), Y(p.y))))
  ctx.stroke()
}

function arrowUp(ctx, x, y, len) {
  ctx.strokeStyle = 'rgba(240,201,149,0.8)'
  ctx.fillStyle = 'rgba(240,201,149,0.8)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x, y + len / 2)
  ctx.lineTo(x, y - len / 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x, y - len / 2 - 6)
  ctx.lineTo(x - 5, y - len / 2 + 2)
  ctx.lineTo(x + 5, y - len / 2 + 2)
  ctx.fill()
}

function sparkline(ctx, values, base, x, y, w, h) {
  if (values.length < 2) return
  const max = Math.max(base * 2, ...values)
  ctx.fillStyle = 'rgba(5,7,15,0.7)'
  ctx.fillRect(x - 6, y - 16, w + 12, h + 22)
  ctx.fillStyle = 'rgba(220,226,255,0.75)'
  ctx.font = '11px system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('probe speed', x, y - 4)
  const by = y + h - (base / max) * h
  ctx.setLineDash([2, 4])
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.beginPath()
  ctx.moveTo(x, by)
  ctx.lineTo(x + w, by)
  ctx.stroke()
  ctx.setLineDash([])
  ctx.strokeStyle = '#ffd27a'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  values.forEach((v, i) => {
    const px = x + (i / (values.length - 1)) * w
    const py = y + h - (v / max) * h
    if (i) ctx.lineTo(px, py)
    else ctx.moveTo(px, py)
  })
  ctx.stroke()
}
