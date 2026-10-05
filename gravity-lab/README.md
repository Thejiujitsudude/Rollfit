# Gravity Lab

Educational orbital mechanics simulator built with React + Vite.

> **Status: scaffold only.** Component logic pending — see `GravityLab.jsx` handoff; physics/data/components need real implementations.

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
npm test        # Vitest (one placeholder test per physics file)
npm run build   # production build to dist/
```

## Structure

```
src/
  components/   Canvas, ControlDrawer, EnergyPanel, ZoneBar,
                PredictPanel, ChallengeList, StatusPill   (stubs)
  physics/      verlet.js, orbital-energy.js, classify.js  (stubs + placeholder tests)
  data/         planets.js, vehicles.js, challenges.js, zones.js  (empty arrays)
  hooks/        useAnimationLoop.js, useLaunchPhysics.js   (stubs)
  App.jsx       "Gravity Lab — coming soon" placeholder screen
```

## TODO

- [ ] Drop in `GravityLab.jsx` handoff and split it into the components above
- [ ] Implement `physics/` (Verlet integrator, energy math, orbit classification)
- [ ] Fill `data/` (planets, vehicles, challenges, zones)
- [ ] Implement hooks (`useAnimationLoop`, `useLaunchPhysics`)
- [ ] Replace placeholder tests with real physics tests
