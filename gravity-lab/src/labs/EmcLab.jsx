import { useRef, useState } from 'react'
import Canvas from '../components/Canvas.jsx'
import ControlDrawer from '../components/ControlDrawer.jsx'
import { restEnergy, YARDSTICKS } from '../physics/relativity.js'
import { makeStars, drawSpace } from '../utils/stars.js'
import { fmtEnergy } from '../utils/format.js'

const STARS = makeStars(120, 41)
const THINGS = [
  { id: 'sand', name: 'Grain of sand', kg: 1e-6 },
  { id: 'clip', name: 'Paperclip', kg: 0.001 },
  { id: 'banana', name: 'Banana', kg: 0.12 },
  { id: 'you', name: 'A person', kg: 75 },
  { id: 'car', name: 'A car', kg: 1500 },
]

const big = (n) => {
  if (n >= 1e12) return `${(n / 1e12).toPrecision(3)} trillion`
  if (n >= 1e9) return `${(n / 1e9).toPrecision(3)} billion`
  if (n >= 1e6) return `${(n / 1e6).toPrecision(3)} million`
  if (n >= 1000) return Math.round(n).toLocaleString('en-US')
  if (n >= 1) return n.toPrecision(3)
  return n.toPrecision(2)
}

export default function EmcLab() {
  const [id, setId] = useState('clip')
  const thing = THINGS.find((t) => t.id === id)
  const E = restEnergy(thing.kg)
  const burst = useRef(null)

  const frame = (ctx, w, h, dt) => {
    drawSpace(ctx, w, h, STARS)
    const cx = w / 2
    const cy = h / 2
    const b = burst.current
    if (b) {
      b.t += dt
      const r = b.t * Math.max(w, h) * 0.6
      const alpha = Math.max(0, 1 - b.t / 1.6)
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(1, r))
      g.addColorStop(0, `rgba(255,255,255,${alpha})`)
      g.addColorStop(0.4, `rgba(255,214,130,${alpha * 0.8})`)
      g.addColorStop(1, 'rgba(255,120,60,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(cx, cy, Math.max(1, r), 0, Math.PI * 2)
      ctx.fill()
      if (b.t > 1.8) burst.current = null
    }
    if (!b || b.t < 0.15) {
      const size = 8 + 6 * (Math.log10(thing.kg) + 6)
      ctx.fillStyle = '#ffd27a'
      ctx.shadowColor = '#ffd27a'
      ctx.shadowBlur = 20
      ctx.beginPath()
      ctx.arc(cx, cy, size, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(220,226,255,0.85)'
      ctx.font = '13px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(thing.name, cx, cy + size + 22)
    }
  }

  return (
    <div className="lab">
      <div className="stage">
        <Canvas frame={frame} label="Turning mass into energy" onPointerDown={() => (burst.current = { t: 0 })} />
        <div className="overlay bottom hint">Tap to turn it all into energy</div>
      </div>
      <aside className="panel">
        <header className="lab-head">
          <h2>E = mc²</h2>
          <p>
            Mass is frozen energy. Multiply mass by the speed of light squared (a giant number) and you get how much energy
            is locked inside.
          </p>
        </header>
        <section className="card">
          <div className="chips">
            {THINGS.map((t) => (
              <button key={t.id} type="button" className={`chip ${t.id === id ? 'on' : ''}`} onClick={() => setId(t.id)}>
                {t.name}
              </button>
            ))}
          </div>
          <div className="big-stat">
            <b className="num">{fmtEnergy(E)}</b>
            <span>locked inside a {thing.name.toLowerCase()}</span>
          </div>
          <h3>That's enough for</h3>
          <ul className="equiv">
            {YARDSTICKS.map((y) => (
              <li key={y.id}>
                <b className="num">{big(E / y.joules)}</b> {y.label}
              </li>
            ))}
          </ul>
          <button type="button" className="btn primary" onClick={() => (burst.current = { t: 0 })}>
            Convert it
          </button>
        </section>
        <ControlDrawer title="The science" defaultOpen={false}>
          <p>Einstein found E = mc² in 1905. The c² is 90,000,000,000,000,000 (in meters and seconds), so a little mass is a lot of energy.</p>
          <p>
            Nothing gets all of it out. Burning releases about a billionth of the mass. Nuclear power plants get about 0.1%.
            The Sun turns 0.7% of its hydrogen into light and loses 4 million tons of mass every second.
          </p>
          <p>The only way to convert 100% is matter meeting antimatter.</p>
        </ControlDrawer>
      </aside>
    </div>
  )
}
