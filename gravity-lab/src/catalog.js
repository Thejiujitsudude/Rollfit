import LawsLab from './labs/LawsLab.jsx'
import FallingLab from './labs/FallingLab.jsx'
import OrbitsLab from './labs/OrbitsLab.jsx'
import LightClockLab from './labs/LightClockLab.jsx'
import EmcLab from './labs/EmcLab.jsx'
import ElevatorLab from './labs/ElevatorLab.jsx'
import SpacetimeLab from './labs/SpacetimeLab.jsx'
import LightLab from './labs/LightLab.jsx'
import TimeLab from './labs/TimeLab.jsx'
import KeplerLab from './labs/KeplerLab.jsx'
import JumpLab from './labs/JumpLab.jsx'

// Labs without a component are shown as "coming soon".
export const SECTIONS = [
  {
    id: 'newton',
    title: 'Newton',
    era: '1687',
    blurb: 'How things move, and the force that pulls everything together.',
    labs: [
      { id: 'laws', title: 'Laws of Motion', blurb: 'Flick a puck, race two carts, push off on skates.', Lab: LawsLab },
      { id: 'falling', title: 'Falling', blurb: 'Hammer vs feather, with and without air.', Lab: FallingLab },
      { id: 'orbits', title: "Newton's Cannon", blurb: 'Fire fast enough and you fall around the planet forever.', Lab: OrbitsLab },
      { id: 'tides', title: 'Tides', blurb: 'Why the Moon pulls the ocean on both sides of Earth.' },
    ],
  },
  {
    id: 'einstein',
    title: 'Einstein',
    era: '1905-1915',
    blurb: 'Light speed is the limit, and gravity is bent space and time.',
    labs: [
      { id: 'lightclock', title: 'Light Clock', blurb: 'Moving clocks tick slower and moving ships shrink.', Lab: LightClockLab },
      { id: 'emc2', title: 'E = mc²', blurb: 'How much energy is hiding in a paperclip.', Lab: EmcLab },
      { id: 'elevator', title: 'Elevator', blurb: "Gravity or a rocket? From inside, you can't tell.", Lab: ElevatorLab },
      { id: 'spacetime', title: 'Curved Spacetime', blurb: 'Mass dents spacetime and marbles follow the curve.', Lab: SpacetimeLab },
      { id: 'light', title: 'Bending Light', blurb: 'Starlight curving around a black hole.', Lab: LightLab },
      { id: 'time', title: 'Gravity Slows Time', blurb: 'Clocks near a black hole, on GPS, in Interstellar.', Lab: TimeLab },
      { id: 'waves', title: 'Gravitational Waves', blurb: 'Two black holes spiral together and shake spacetime.' },
    ],
  },
  {
    id: 'astro',
    title: 'Astrophysics',
    era: 'today',
    blurb: 'The same laws, used to explore planets, stars and black holes.',
    labs: [
      { id: 'kepler', title: "Kepler's Laws", blurb: 'Why planets speed up near the Sun.', Lab: KeplerLab },
      { id: 'jump', title: 'Planet Jump', blurb: 'How high could you jump on the Moon? On a neutron star?', Lab: JumpLab },
      { id: 'slingshot', title: 'Slingshot', blurb: 'Steal speed from a planet to fling a probe across the solar system.' },
      { id: 'stars', title: 'Life of a Star', blurb: 'Gravity vs fusion, from birth to black hole.' },
    ],
  },
]

export const ALL_LABS = SECTIONS.flatMap((s) => s.labs.filter((l) => l.Lab).map((l) => ({ ...l, section: s })))
