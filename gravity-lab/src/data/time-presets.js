import { realWorld } from '../physics/time-dilation.js'

const EARTH_MU = 3.986004418e14

// gap = r/rs - 1 (distance above the event horizon), beta = v/c
export const timePresets = [
  {
    id: 'earth',
    name: "Earth's surface",
    ...realWorld(EARTH_MU, 6.371e6),
    fact: 'Your clock runs slow compared with deep space: about 0.02 seconds a year. Your head ages slightly faster than your feet.',
  },
  {
    id: 'iss',
    name: 'Space station',
    ...realWorld(EARTH_MU, 6.771e6, 7660),
    fact: 'Speed wins over height here. Astronauts come home about 0.005 seconds younger after 6 months.',
  },
  {
    id: 'gps',
    name: 'GPS satellite',
    ...realWorld(EARTH_MU, 26.56e6, 3874),
    fact: 'Ticks about 38 microseconds a day faster than ground clocks. Without correcting for it, your map would drift about 10 km a day.',
  },
  {
    id: 'neutron',
    name: 'Neutron star surface',
    gap: 1.4,
    beta: 0,
    fact: 'A city-sized ball heavier than the Sun. Time runs at about two thirds speed on its surface.',
  },
  {
    id: 'edge',
    name: 'Black hole edge',
    gap: 0.01,
    beta: 0,
    fact: 'Hovering just outside the horizon. At the horizon itself, time would look frozen to you far away.',
  },
  {
    id: 'miller',
    name: "Miller's planet",
    gap: 2.66e-10,
    beta: 0,
    fact: 'From Interstellar: 1 hour there = 7 years back home. The movie used a spinning black hole; this is the non-spinning version.',
  },
  {
    id: 'fast',
    name: '99% light speed',
    gap: Infinity,
    beta: 0.99,
    fact: 'No gravity needed: speed alone slows your clock to about 1/7 speed.',
  },
]
