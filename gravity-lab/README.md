# Gravity Lab

Educational orbital mechanics simulator built with React + Vite.

> **Status: playable v0.1.** All 4 labs work. The orbits logic here is a fresh build; merge in or replace it with the `GravityLab.jsx` handoff when it's ready.

## Vision

A free, fun learning tool for anyone who loves gravity. Learn by playing with objects, not formulas:

- **Orbits:** launch objects and watch them fall, orbit, or escape.
- **Bent spacetime:** heavy objects curve the space around them, and paths bend with it.
- **Bending light:** light curves around massive objects (gravitational lensing).
- **Time dilation:** clocks near heavy objects (or moving fast) tick slower.

No accounts and no backend. Everything runs in the browser.

## Quick start

```bash
npm install
npm run dev     # dev server
npm test        # Vitest physics tests
npm run build   # production build to dist/
```

## Labs

| Tab | What you do | Physics |
|---|---|---|
| Orbits | Newton's cannon: pick planet, speed, angle, predict, launch | Velocity Verlet, real planet data, energy bars, 8 challenges |
| Spacetime | Drag masses on a rubber sheet, flick marbles | Softened Newtonian potential = sheet depth |
| Light | Drag a black hole / neutron star through light beams | Exact Schwarzschild light paths; Newton overlay bends half as much |
| Time | Move a traveler near a black hole or speed it up, compare clocks | Gravity x speed time dilation; real presets (GPS, ISS, Miller's planet) |

Physics is unit-tested against real numbers: Earth escape speed 11.2 km/s, Einstein light bending 2rs/b (twice Newton), black hole shadow at 2.6 rs, GPS clocks 38 microseconds/day fast.

## Structure

```
src/
  App.jsx       tab shell (Orbits / Spacetime / Light / Time)
  labs/         one screen per tab
  components/   Canvas, ControlDrawer, EnergyPanel, ZoneBar,
                PredictPanel, ChallengeList, StatusPill
  physics/      verlet, orbital-energy, classify, spacetime,
                lensing, time-dilation  (+ tests)
  data/         planets, vehicles, challenges, zones, time-presets
  hooks/        useAnimationLoop, useLaunchPhysics
  utils/        format, storage, stars
```

## TODO

- [ ] Merge the `GravityLab.jsx` handoff into the Orbits lab
- [ ] Play-test and keep / cut features
