# Gravity Lab

Play with the laws of the universe. A free, fun, interactive way to understand Newton's physics, Einstein's physics, and the astrophysics they explain. Every concept is a hands-on toy.

> **Status: playable v0.2.** 11 labs live, 5 more planned. The Newton's Cannon logic is a fresh build; merge in or replace it with the `GravityLab.jsx` handoff when it's ready.

No accounts and no backend. Everything runs in the browser.

## Quick start

```bash
npm install
npm run dev     # dev server
npm test        # Vitest physics tests
npm run build   # production build to dist/
```

## Labs

**Newton**
| Lab | What you do |
|---|---|
| Laws of Motion | 1st: flick a puck in space / ice / carpet. 2nd: same push on two carts (F = ma). 3rd: skaters push off (momentum) |
| Falling | Drop hammer, feather, paper, bowling ball; air on/off; Earth, Moon, Mars, Jupiter |
| Newton's Cannon | Launch from a tower: crash, orbit or escape. Predict first, energy bars, 8 challenges |
| Tides | coming soon |

**Einstein**
| Lab | What you do |
|---|---|
| Light Clock | Moving clock ticks slower, moving ship shrinks (special relativity) |
| E = mc² | Energy locked in a paperclip, banana, person, car |
| Elevator | Gravity vs rocket, falling vs floating: can't tell them apart (equivalence principle) |
| Curved Spacetime | Rubber sheet with draggable masses and flickable marbles |
| Bending Light | Exact Schwarzschild light paths around a black hole; Newton's half-strength guess overlay |
| Gravity Slows Time | Clocks near a black hole, GPS, ISS, Miller's planet |
| Gravitational Waves | coming soon |

**Astrophysics**
| Lab | What you do |
|---|---|
| Kepler's Laws | Ellipse with equal-time slices; Earth, Mars, Mercury, Halley's Comet |
| Planet Jump | Jump height, hang time and weight from Ceres to a neutron star |
| Slingshot, Life of a Star | coming soon |

Physics is unit-tested against real numbers (42 tests, including a fact-check of every number stated in the app text): Earth escape speed, Einstein light bending (2x Newton), GPS clock drift, Kepler's 3rd law, 99%-light-speed time dilation, E = mc².

## Structure

```
src/
  App.jsx       home screen + #hash routing
  catalog.js    sections (Newton / Einstein / Astrophysics) and their labs
  labs/         one screen per concept
  components/   Canvas, ControlDrawer, EnergyPanel, ZoneBar,
                PredictPanel, ChallengeList, StatusPill
  physics/      verlet, orbital-energy, classify, spacetime,
                lensing, time-dilation, relativity,
                kepler, motion  (+ tests)
  data/         planets, vehicles, challenges, zones, time-presets
  hooks/        useAnimationLoop, useLaunchPhysics
  utils/        format, storage, stars
```

## TODO

- [ ] Merge the `GravityLab.jsx` handoff into the Orbits lab
- [ ] Play-test and keep / cut features
- [ ] Build the coming-soon labs: Tides, Gravitational Waves, Slingshot, Life of a Star
