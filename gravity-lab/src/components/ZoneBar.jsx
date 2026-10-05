import { useMemo } from 'react'
import { classifyOrbit } from '../physics/classify.js'
import { zoneById } from '../data/zones.js'
import { fmtSpeed } from '../utils/format.js'

const SAMPLES = 240

/** Speed bar colored by what each launch speed would do at the current angle. */
export default function ZoneBar({ mu, radius, r0, angle, max, value }) {
  const segments = useMemo(() => {
    const a = (angle * Math.PI) / 180
    const out = []
    for (let i = 0; i < SAMPLES; i++) {
      const v = ((i + 0.5) / SAMPLES) * max
      const type = classifyOrbit({ x: 0, y: r0, vx: v * Math.cos(a), vy: v * Math.sin(a) }, mu, radius)
      const last = out[out.length - 1]
      if (last && last.type === type) last.to = (i + 1) / SAMPLES
      else out.push({ type, from: i / SAMPLES, to: (i + 1) / SAMPLES })
    }
    return out
  }, [mu, radius, r0, angle, max])

  return (
    <div className="zonebar">
      <div className="zonebar-track">
        {segments.map((s) => (
          <div
            key={s.from}
            className="zonebar-seg"
            style={{ left: `${s.from * 100}%`, width: `${(s.to - s.from) * 100}%`, background: zoneById[s.type].color }}
          />
        ))}
        <div className="zonebar-mark" style={{ left: `${Math.min(100, (value / max) * 100)}%` }} />
      </div>
      <div className="zonebar-legend">
        {segments.map((s) => (
          <span key={s.from}>
            <b style={{ color: zoneById[s.type].color }}>{zoneById[s.type].label}</b>{' '}
            {s.from === 0 ? `under ${fmtSpeed(s.to * max)}` : `from ${fmtSpeed(s.from * max)}`}
          </span>
        ))}
      </div>
    </div>
  )
}
