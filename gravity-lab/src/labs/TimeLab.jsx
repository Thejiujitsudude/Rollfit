import { useRef, useState } from 'react'
import Canvas from '../components/Canvas.jsx'
import ControlDrawer from '../components/ControlDrawer.jsx'
import { clockRate, gravityFactorGap, velocityFactor } from '../physics/time-dilation.js'
import { timePresets } from '../data/time-presets.js'
import { makeStars, drawSpace } from '../utils/stars.js'
import { fmtDuration, fmtClock } from '../utils/format.js'

const STARS = makeStars(150, 23)
const LOG_MIN = -10
const LOG_MAX = 10
const DEMO_SPEED = 10 // clocks run 10x so you can see the hands move

const logOf = (gap) => (gap === Infinity ? LOG_MAX : Math.min(LOG_MAX, Math.max(LOG_MIN, Math.log10(gap))))

function fmtDistance(gap) {
  if (gap === Infinity || gap >= 1e10) return 'very far away'
  if (gap < 0.001) return `a hair above the horizon (1 + ${gap.toExponential(1)}×)`
  const r = 1 + gap
  return r < 1e4 ? `${r.toPrecision(4)}× the horizon radius` : `${r.toExponential(1)}× the horizon radius`
}

export default function TimeLab() {
  const [gap, setGap] = useState(2)
  const [beta, setBeta] = useState(0)
  const [presetId, setPresetId] = useState(null)
  const elapsed = useRef({ you: 0, them: 0 })

  const rate = clockRate({ gap, beta })
  const g = gap === Infinity ? 1 : gravityFactorGap(gap)
  const v = velocityFactor(beta)
  const preset = timePresets.find((p) => p.id === presetId)
  const tiny = 1 - rate < 1e-4

  const pick = (p) => {
    setPresetId(p.id)
    setGap(p.gap)
    setBeta(p.beta)
    elapsed.current = { you: 0, them: 0 }
  }

  const frame = (ctx, w, h, dt) => {
    const e = elapsed.current
    e.you += dt * DEMO_SPEED
    e.them += dt * DEMO_SPEED * rate

    drawSpace(ctx, w, h, STARS)

    // scene: black hole on the left, traveler placed on a log scale
    const sceneH = h * 0.42
    const cy = sceneH * 0.55
    const rs = Math.min(sceneH * 0.28, w * 0.07)
    const hx = rs + 16
    const glow = ctx.createRadialGradient(hx, cy, rs, hx, cy, rs * 2.4)
    glow.addColorStop(0, 'rgba(255,150,60,0.35)')
    glow.addColorStop(1, 'rgba(255,150,60,0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(hx, cy, rs * 2.4, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(hx, cy, rs, 0, Math.PI * 2)
    ctx.fill()

    // log of the real distance, so 'just above the horizon' sits right at the hole
    const t = gap === Infinity ? 1 : Math.min(1, Math.log10(1 + gap) / LOG_MAX)
    const shipX = hx + rs + 6 + t * (w - hx - rs - 40)
    // redshift: the slower its clock, the redder its light looks to you
    const gb = Math.round(80 + 175 * rate)
    ctx.fillStyle = `rgb(255,${gb},${Math.round(gb * 0.9)})`
    if (beta > 0.01) {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.lineWidth = 1
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath()
        ctx.moveTo(shipX - 10 - 30 * beta, cy + k * 4)
        ctx.lineTo(shipX - 10, cy + k * 4)
        ctx.stroke()
      }
    }
    ctx.beginPath()
    ctx.moveTo(shipX + 9, cy)
    ctx.lineTo(shipX - 7, cy - 6)
    ctx.lineTo(shipX - 7, cy + 6)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = 'rgba(220,226,255,0.8)'
    ctx.font = '12px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Traveler', shipX, cy - 14)

    // two clocks
    const cr = Math.min(h * 0.2, w * 0.2)
    const ccy = sceneH + (h - sceneH) / 2 - 8
    drawClock(ctx, w * 0.28, ccy, cr, e.you, 'You (far away)', '#9fb7ff')
    drawClock(ctx, w * 0.72, ccy, cr, e.them, 'Traveler', `rgb(255,${gb},${Math.round(gb * 0.9)})`)
  }

  return (
    <div className="lab">
      <div className="stage">
        <Canvas frame={frame} label="Two clocks: you far away, and a traveler near a black hole" />
        <div className="overlay top">
          <span className="readout">Clocks shown at {DEMO_SPEED}× speed</span>
        </div>
      </div>

      <aside className="panel">
        <header className="lab-head">
          <h2>Time</h2>
          <p>
            Time is not the same everywhere. Clocks tick slower deep in gravity and when moving fast. Move the traveler
            and watch the two clocks drift apart.
          </p>
        </header>

        <section className="card big-stat">
          {tiny ? (
            <>
              <b className="num">{fmtDuration((1 - rate) * 86400)}</b>
              <span>slower per day than your clock</span>
            </>
          ) : (
            <>
              <b className="num">{(rate * 100).toPrecision(3)}%</b>
              <span>traveler's clock speed</span>
            </>
          )}
          <p className="muted small">
            {rate === 0
              ? 'Time looks frozen for the traveler.'
              : `1 hour for the traveler = ${fmtDuration(3600 / rate)} for you.`}
          </p>
        </section>

        <section className="card">
          <label className="slider">
            <span>
              Distance <b className="num">{fmtDistance(gap)}</b>
            </span>
            <input
              type="range"
              min={LOG_MIN}
              max={LOG_MAX}
              step="0.05"
              value={logOf(gap)}
              onChange={(e) => {
                const s = Number(e.target.value)
                setGap(s >= LOG_MAX ? Infinity : 10 ** s)
                setPresetId(null)
              }}
            />
          </label>
          <label className="slider">
            <span>
              Speed <b className="num">{beta < 0.001 && beta > 0 ? `${(beta * 100).toExponential(1)}%` : `${(beta * 100).toFixed(1)}%`}</b> of light
            </span>
            <input
              type="range"
              min="0"
              max="0.999"
              step="0.001"
              value={beta}
              onChange={(e) => {
                setBeta(Number(e.target.value))
                setPresetId(null)
              }}
            />
          </label>
          <div className="stats">
            <div>
              <b className="num">{(g * 100).toPrecision(4)}%</b>
              <span>from gravity</span>
            </div>
            <div>
              <b className="num">{(v * 100).toPrecision(4)}%</b>
              <span>from speed</span>
            </div>
          </div>
          <button type="button" className="btn" onClick={() => (elapsed.current = { you: 0, them: 0 })}>
            Sync clocks
          </button>
        </section>

        <section className="card">
          <h3>Real places</h3>
          <div className="chips">
            {timePresets.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`chip ${p.id === presetId ? 'on' : ''}`}
                onClick={() => pick(p)}
              >
                {p.name}
              </button>
            ))}
          </div>
          {preset && <p className="fact">{preset.fact}</p>}
        </section>

        <ControlDrawer title="The science" defaultOpen={false}>
          <p>
            Gravity slows time (general relativity): the deeper you sit in a gravity well, the slower your clock runs
            compared with someone far away. At a black hole's horizon, it looks frozen from outside.
          </p>
          <p>
            Speed slows time too (special relativity). At 99% of light speed, your clock runs at about 1/7 speed.
          </p>
          <p>
            Both are measured for real: atomic clocks flown on airliners (1971), GPS satellites every day, and cosmic-ray
            particles that reach the ground only because their clocks run slow.
          </p>
        </ControlDrawer>
      </aside>
    </div>
  )
}

function drawClock(ctx, x, y, r, seconds, label, color) {
  ctx.fillStyle = '#0d1122'
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(x + Math.sin(a) * r * 0.85, y - Math.cos(a) * r * 0.85)
    ctx.lineTo(x + Math.sin(a) * r * 0.95, y - Math.cos(a) * r * 0.95)
    ctx.stroke()
  }
  const hand = (frac, len, width) => {
    const a = frac * Math.PI * 2
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.sin(a) * r * len, y - Math.cos(a) * r * len)
    ctx.stroke()
  }
  ctx.strokeStyle = '#e8ebf7'
  hand((seconds / 3600) % 1, 0.7, 3)
  ctx.strokeStyle = color
  hand((seconds / 60) % 1, 0.88, 1.5)
  ctx.fillStyle = '#e8ebf7'
  ctx.textAlign = 'center'
  ctx.font = '600 13px system-ui, sans-serif'
  ctx.fillText(label, x, y + r + 18)
  ctx.font = '12px ui-monospace, monospace'
  ctx.fillStyle = 'rgba(220,226,255,0.75)'
  ctx.fillText(fmtClock(seconds), x, y + r + 34)
}
