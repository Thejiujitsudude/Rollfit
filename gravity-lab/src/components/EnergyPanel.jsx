import { kineticEnergy, potentialEnergy } from '../physics/orbital-energy.js'
import { fmtEnergy } from '../utils/format.js'

/** Kinetic + potential = total. Total stays constant in flight; its sign decides bound vs escape. */
export default function EnergyPanel({ mass, mu, r, speed, r0 }) {
  const ke = kineticEnergy(mass, speed)
  const pe = potentialEnergy(mu, mass, r)
  const total = ke + pe
  const base = (1.8 * mu * mass) / r0
  const pct = (v) => `${Math.min(100, (Math.abs(v) / base) * 100)}%`
  const rows = [
    { id: 'ke', label: 'Motion (kinetic)', value: ke, cls: 'bar-ke' },
    { id: 'pe', label: 'Height (potential)', value: pe, cls: 'bar-pe' },
    { id: 'tot', label: 'Total', value: total, cls: total < 0 ? 'bar-bound' : 'bar-free' },
  ]
  return (
    <section className="card">
      <h3>Energy</h3>
      {rows.map((row) => (
        <div className="erow" key={row.id}>
          <div className="erow-top">
            <span>{row.label}</span>
            <span className="num">{fmtEnergy(row.value)}</span>
          </div>
          <div className="ebar">
            <div className={row.cls} style={{ width: pct(row.value) }} />
          </div>
        </div>
      ))}
      <p className="muted small">
        {total < 0
          ? 'Total is negative: gravity keeps it. It will crash or orbit.'
          : 'Total is zero or more: enough energy to escape forever.'}{' '}
        In flight, motion and height trade back and forth, but the total stays the same.
      </p>
    </section>
  )
}
