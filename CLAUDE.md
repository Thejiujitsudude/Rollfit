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
- **Cloud backup (Supabase):** optional email/password account (`ov-account`). Local-first: `save()` stamps `S._ts`, writes localStorage (`saveLocal()`), then debounced `pushState()` upserts the whole `S` into `public.user_state` (`user_id`, `state jsonb`, `updated_at`; RLS = own row only). `pullAndMerge()` on sign-in and on launch (`sbBoot()`): newer `_ts` wins. Once signed in, a URL/domain change no longer loses data.
- supabase-js loads from jsDelivr with `defer`; if it fails, the app still works offline and sign-in shows "Can't reach the server". Project URL + publishable key are in `SB_URL` / `SB_KEY` (never put the secret key in the app).

## State object `S` (key fields)
onboarded, name, daysPerWeek (2–5), track, belt, stripes, xp, dayIdx, orms{}, prs{}, workouts[], pctBump{}, dpState{}, readinessLog{}, fatigueLog[], bjjLog[], bjjDays[], lastLogin, startDate

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
- `applyProgressiveOverload()` runs on finish: RIR ≥ 4 on top set → `S.pctBump[lift]` += 2 (cap +10), added on top of the program's weekly % via `topSetPct(e)` (max 95%). Bump is ignored and not changed on deload (wk6) and test (wk9) weeks. Accessories: double progression (+5 lb after hitting rep ceiling twice).
- Onboarding step 5 (`obs5`) collects the 3 primary 1RMs (optional). If none is set, the workout's top set shows a "No 1RM set" hint.
- Workout UI (`renderWO`): primary warm-up pyramid collapses to one tappable row (`togWU`, no rest timer/PRs); top set has Easy / Solid / Hard buttons (`setFeel`) stored as RIR 4 / 2 / 0; exercise notes sit behind a "How to do it" toggle. Dynamic-warmup checklist taps don't start the rest timer.
- UI style: no emojis anywhere (tester feedback). Nav icons are inline SVG. Each tab has a one-line `.purpose` explaining it. Today's secondary actions (No Gym / Custom / Build) live in an "Other options" `<details>`.
- Plate calculator: `calcPlates()` / `plateBreakdownStr()`, 45 lb bar, plates 45/35/25/10/5/2.5, only for `BARBELL_EXERCISES`.

## Rest rules
Primary top 180s · backoff 120s · primary warmup 60s · compound accessories 90s · core/isolation 60s · carries 45s · Face Pull 45s.

## Other systems
- Belt/XP: `BELTS`, `renderBelt()` (loop-based auto-promotion, capped at 10th Dan black). +5 XP/set, +25/workout, +10 daily login.
- Swaps: `SUBSTITUTES` (every EX_LIB exercise has ≥2), `openSwap()` / `doSwap()`.
- Build From My Exercises: `MATCH_RULES` + `matchExercise()` keyword mapper → `startBuiltWorkout()`.
- Rest days: `markRestDay()` advances dayIdx.
- No Gym Today: `startNoGym()` / `noGymSession()` — zero-equipment session on lift days (Broad Jump, BSS, SL Glute Bridge, Push-Ups, Doorframe Row, Lying Leg Raise, Bear Crawl, Face Pull last). `AWO.noGym` → does NOT advance dayIdx and skips `applyProgressiveOverload`, so gym progression is untouched.
- Week 9 test week applies `applyTrackSwap()`, so Minimal Equipment tests DB RDL / Goblet Squat.

## Known quirks
- Kettlebell Swing is categorized "Warmup" in EX_LIB but functions as a hinge.
- `AV` table rest column is stale and ignored; only its sets/reps are used.

## Verification habit
After any change: extract the `<script>` block, run `node --check`, then a mocked-DOM run of: all 4 tracks × 2/3/4/5 days × weeks 1–9 through `getProgDays/renderToday/renderProgram/renderHome`, plus start → log → finish workout.

## Before public launch (checklist)
- Supabase → Authentication → Sign In / Providers → turn **Confirm email back ON** (off during testing because the built-in mailer is heavily rate-limited and confirm links open in Safari, not the Home Screen app).
- Connect a real SMTP/email service (e.g. Resend) so confirm + reset emails send reliably.
- Add "Forgot password" flow.
- Supabase free tier pauses inactive projects and has no backups → move to Pro before paying users.

## Next priorities
1. Git init + first commit.
2. Deploy to Netlify with a **permanent URL**.
3. Get 1–2 testers running it.
4. Accounts + cloud sync: v1 done (Supabase, whole-state backup). Later: per-workout tables, password reset, Apple sign-in.
