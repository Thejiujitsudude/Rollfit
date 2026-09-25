# Gravity Lab

Educational orbital mechanics simulator built with React + Vite.

> **Status: scaffold only.** Component logic pending — see `GravityLab.jsx` handoff; physics/data/components need real implementations.

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
