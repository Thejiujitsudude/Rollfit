export const zones = [
  { id: 'crash', label: 'Crash', color: '#ff5d6c', blurb: 'Not fast enough to miss the ground.' },
  { id: 'orbit', label: 'Orbit', color: '#4fd18b', blurb: 'Falling around the planet forever.' },
  { id: 'escape', label: 'Escape', color: '#b48cff', blurb: 'Fast enough to leave for good.' },
]

export const zoneById = Object.fromEntries(zones.map((z) => [z.id, z]))
