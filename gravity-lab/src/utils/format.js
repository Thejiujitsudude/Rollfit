const sig = (n, d = 3) => Number(n.toPrecision(d)).toLocaleString('en-US', { maximumFractionDigits: 10 })

export const fmtSpeed = (ms) => (Math.abs(ms) >= 1000 ? `${sig(ms / 1000)} km/s` : `${sig(ms)} m/s`)

export const fmtDistance = (m) => (Math.abs(m) >= 1000 ? `${sig(m / 1000)} km` : `${sig(m)} m`)

const ENERGY_UNITS = ['J', 'kJ', 'MJ', 'GJ', 'TJ', 'PJ', 'EJ']
export function fmtEnergy(j) {
  let v = Math.abs(j)
  let i = 0
  while (v >= 1000 && i < ENERGY_UNITS.length - 1) {
    v /= 1000
    i++
  }
  return `${j < 0 ? '-' : ''}${sig(v)} ${ENERGY_UNITS[i]}`
}

const YEAR = 365.25 * 86400
export function fmtDuration(s) {
  if (!Number.isFinite(s)) return 'forever'
  const a = Math.abs(s)
  if (a === 0) return '0 seconds'
  if (a < 1e-6) return `${sig(s * 1e9)} nanoseconds`
  if (a < 1e-3) return `${sig(s * 1e6)} microseconds`
  if (a < 1) return `${sig(s * 1e3)} milliseconds`
  if (a < 120) return `${sig(s)} seconds`
  if (a < 7200) return `${sig(s / 60)} minutes`
  if (a < 3 * 86400) return `${sig(s / 3600)} hours`
  if (a < YEAR) return `${sig(s / 86400)} days`
  if (a < 1e9 * YEAR) return `${sig(s / YEAR)} years`
  return `${(s / YEAR).toExponential(1)} years`
}

export function fmtClock(s) {
  const t = Math.floor(s)
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const sec = t % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}
