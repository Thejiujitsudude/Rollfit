# Gravity Lab — Project Brief

Separate app from Roll Fit (it only lives in this repo for now). React + Vite, no backend.

## Product direction (owner decided)
- A free, fun, interactive tool that makes physics simple: **Newton**, **Einstein**, then **Astrophysics** using the same laws.
- **One concept = one hands-on lab.** Play first, explanation second ("The science" drawer).
- Plain language, no formulas required to enjoy it. Real numbers where possible (real planets, real presets).

## How it's built
- `src/catalog.js` lists sections and labs. A lab without `Lab` shows as "Coming soon". Add a lab = write `src/labs/XLab.jsx` + one catalog line.
- Lab layout: `.lab` > `.stage` (Canvas) + `aside.panel` (`.lab-head`, cards, `ControlDrawer` "The science").
- `Canvas` calls `frame(ctx, w, h, dt)` every animation frame; keep sim state in refs, not React state.
- Pure physics lives in `src/physics/` with Vitest tests. Test against real-world values.
- Routing is `#labId` in the URL (works inside a claude.ai artifact).

## Verification habit
`npm test`, `npm run lint`, `npm run build`, then open every lab in a real browser at 390px and 1280px: 0 console errors, no sideways scroll.

## Owner preferences
ADHD: answer first, short bullets, bold key terms, micro-steps, one question at a time.
