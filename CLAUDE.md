# Roll Fit (file: roll-strong) — Project Brief for Claude Code

Grappler (BJJ) strength training web app. Single self-contained `index.html` (~2,400 lines: inline CSS + JS). No backend. Mobile-first, tested on iPhone Safari.

## Owner preferences
- Has ADHD: answer first, short bullets, bold key terms, micro-steps, one question at a time.
- Direct, no hype. Show exact code changes.

## Hard rules (do not break)
- **Session order:** Dynamic warmup → primary compound → accessories → carry/grip → **Face Pull ALWAYS last**.
- **Performance, not bodybuilding.** Movement patterns (hinge, squat, push, pull, carry, anti-rotation), no curls/extensions.
- **Core = Hanging Leg Raise + Pallof Press family only** (rotational/hanging). No planks, crunches, dead bugs.
- **1RMs tracked for 3 primary lifts only:** Trap Bar Deadlift, Zercher Squat, Dumbbell Bench Press. Everything else is RIR/rep based.
- **Every program returns exactly 7 days** (week math is `Math.floor(dayIdx/7)+1`).
- **iOS Safari safe:** no `ctx.roundRect` (use `rrect()`), canvas draws inside double `requestAnimationFrame`.
- **Conditioning is intentionally NOT in the app yet.**

## Persistence
- `localStorage` key **`rs5`**, whole `S` object as JSON. `save()` / `load()` wrapped in try/catch.
- Data is per-device AND per-URL. **Changing the hosting URL wipes users' data.** Keep one permanent URL.

## State object `S` (key fields)
onboarded, name, daysPerWeek (2–5), track, belt, stripes, xp, dayIdx, orms{}, prs{}, workouts[], pctOverrides{}, dpState{}, readinessLog{}, fatigueLog[], bjjLog[], bjjDays[], lastLogin, startDate

## Program engine
- `getProgDaysRaw()` — hardcoded days per daysPerWeek (2/3/4/5), plus week 9 test week.
- `getProgDays()` — wrapper that applies: weekly volume waves (`AV` table via `AV_KEY`), goal-track volume (`TRACKS.volMult`), Minimal Equipment swaps (`MINIMAL_SWAPS` with scale factors).
- `P()` (inside getProgDaysRaw) — builds primary lifts from `TBD` / `ZSQ` / `DBB` weekly tables; applies track `pctAdj`.
- **9-week block:** wk1–2 accumulation, wk3–5 intensification, **wk6 deload**, wk7–8 rebuild, **wk9 test**. Test result becomes next block's 1RM.
- Dynamic warmups: `wuHinge()`, `wuSquat()`, `wuPush()`, `wuGeneral()` — items flagged `isWarmup:true` (checklist only, no load).
- Hinge trained 2x/week in all programs (2nd exposure = RDL, or KB Swing on 2-day).
- Note: `ax()` and `prim()` are legacy/unused.

## Goal tracks (`TRACKS`)
| Track | volMult | pctAdj | minimal |
|---|---|---|---|
| offseason | 1.0 | 0 | no |
| inseason | 0.7 | -3 | no |
| comp | 0.6 | +3 | no |
| minimal | 0.9 | 0 | yes |

## Workout logger
- `buildSets(e)` — primary: pyramid warmups (60s rest) → TOP set with RIR input (180s) → backoffs (120s). Accessories use `dpState` double progression. Deload week overrides dpState (lower reps, ~85% weight).
- `effectiveORM(name)` — single source for 1RM (includes Minimal Equipment scaled fallback). Use this, never `S.orms[x]` directly.
- `togS()` uses per-set `rest` first, then exercise `rest`.
- Readiness (`setReadiness`): 1 = recovery (loads x0.90, fewer backoff/accessory sets), 2 = normal, 3 = push.
- `applyProgressiveOverload()` runs on finish: RIR ≥ 4 on top set → +2% next time; accessories double progression (+5 lb after hitting rep ceiling twice).
- Plate calculator: `calcPlates()` / `plateBreakdownStr()`, 45 lb bar, plates 45/35/25/10/5/2.5, only for `BARBELL_EXERCISES`.

## Rest rules
Primary top 180s · backoff 120s · primary warmup 60s · compound accessories 90s · core/isolation 60s · carries 45s · Face Pull 45s.

## Other systems
- Belt/XP: `BELTS`, `renderBelt()` (loop-based auto-promotion, capped at 10th Dan black). +5 XP/set, +25/workout, +10 daily login.
- Swaps: `SUBSTITUTES` (every EX_LIB exercise has ≥2), `openSwap()` / `doSwap()`.
- Build From My Exercises: `MATCH_RULES` + `matchExercise()` keyword mapper → `startBuiltWorkout()`.
- Rest days: `markRestDay()` advances dayIdx.

## Known quirks
- Kettlebell Swing is categorized "Warmup" in EX_LIB but functions as a hinge.
- `AV` table rest column is stale and ignored; only its sets/reps are used.

## Verification habit
After any change: extract the `<script>` block, run `node --check`, then a mocked-DOM run of: all 4 tracks × 2/3/4/5 days × weeks 1–9 through `getProgDays/renderToday/renderProgram/renderHome`, plus start → log → finish workout.

## Next priorities
1. Git init + first commit.
2. Deploy to Netlify with a **permanent URL**.
3. Get 1–2 testers running it.
4. Later: accounts + cloud sync (Supabase/Firebase) before charging money.
