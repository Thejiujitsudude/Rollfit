# Roll Fit Program Framework

Planning doc for building out workout depth **after the MVP feature freeze**. Nothing here is built yet unless marked "already in app".

**Source of inspiration:** general, widely used "powerbuilding" training principles (strength + muscle on equal footing), as popularized by evidence-based coaches. **We do not copy any paid program's workouts, tables, exercise orders, or wording, and we never use a coach's name in the app or marketing.** Everything below is Roll Fit's own design, adapted for grapplers.

---

## 1. Core idea

Train for **strength and muscle at the same time**, because grapplers need both: strength to control and finish, and muscle to absorb punishment and hold positions. Neither goal is treated as secondary.

## 2. Exercise tiers

| Tier | What it is | Roll Fit examples | How load is set |
|---|---|---|---|
| **Primary** | Big compound lifts, most muscle, heaviest | Trap Bar Deadlift, Zercher Squat, DB Bench | % of 1RM |
| **Secondary** | Compounds with less total muscle | Rows, pull-ups, split squats, RDL, overhead press | Rep range + effort |
| **Tertiary** | Smaller, targeted work | Face Pull, Pallof Press, grip, hanging leg raise | Rep range + effort |

## 3. Effort (how hard each set is)

- Measured as **reps left in the tank** (RIR). The app shows this as Easy / Solid / Hard.
- **Primary lifts:** stop with **1–3 reps left**. Never grind to failure on the main lifts.
- **Secondary / tertiary:** usually **1–2 reps left**.
- **Optional:** the **last set of the last exercise** for a body part can go close to failure.

## 4. Load on main lifts: intensity ranges (autoregulation)

- Instead of one fixed number (e.g. 75%), the main lift gets a **range** (e.g. 72–78%).
- **Warm-ups feel heavy? Use the low end. Warm-ups feel fast? Use the high end.**
- Hitting the low end on a rough day is **success, not failure**. This matters extra for grapplers, who show up to lift after hard rounds.
- **Already in app:** a fixed % plus the readiness check and "Jiu-jitsu today" switch. **Upgrade later:** show a range (e.g. "285–305 lb") instead of one number.

## 5. Session structure (already in app)

Dynamic warm-up → **pyramid warm-up sets** → **1 top set** (heavy) → **back-off sets** (lighter, for volume) → secondary → tertiary → carry/grip → **Face Pull last**.

## 6. Progression

- **Primary:** % rises across the block; an easy top set bumps the next session. **(Already in app.)**
- **Secondary / tertiary: double progression.** Add reps at the same weight until you hit the top of the rep range, then add the smallest weight jump and start back at the bottom. **(Already in app.)**
- If you can't add reps or weight, **do it better**: cleaner reps, slower lowering, better control. That still counts as progress.

## 7. Weekly volume targets

- General lifting guidance is roughly **10–20 hard sets per muscle per week**.
- **Grappler adjustment:** BJJ already loads the back, grip, hips and neck, so aim **lower, around 8–14 sets** for most muscles. Drop further on "Jiu-jitsu today" days. **More is not better if it wrecks you for the mat.**
- Each main movement (hinge, squat, press, pull) gets trained **about 2× a week**.

## 8. Alternating week focus (the key idea to adopt)

| Week type | Focus | Main lifts | Accessories |
|---|---|---|---|
| **Strength week** | Heavier, slightly less volume | Top set in the high range + back-offs | Fewer sets, 6–10 reps |
| **Muscle week** | Lighter loads, more volume, lift variations | Lighter %, more reps; **one** heavy top set to stay sharp | More sets, 8–15 reps |

This maps directly onto the parked **goal picker**:
- **Strength only** → mostly strength-week style
- **Muscle only** → mostly muscle-week style
- **Strength + Muscle** → alternate the two week types
- **Conditioning** → added separately (not covered here)

## 9. The block (already mostly in app)

- Build-up weeks → **mid-block lighter "technique week"** → build again → **max test** → **full deload** before the next block.
- **Max test options:**
  - **Strength-focused:** heavy single (current Week 9).
  - **Muscle-focused:** a **rep-max test** (as many good reps as possible at a set weight), converted to an estimated 1RM. This is safer and more relevant for size. **Add later.**
- **Current app:** Week 6 deload, Week 9 test. **Gap:** add a full deload week after the test and a rep-max option.

## 10. Finding a 1RM without maxing out

- Use a recent **tough set of 3–6 reps**, then estimate the 1RM with a formula (the app already uses one).
- Or do a **rep-max test**: after a warm-up pyramid, one set of as many clean reps as possible at a weight you think you can do 3–5 times.
- **Always** use a spotter or safety pins on heavy tests.

## 11. Optional "catch-up" day

- A short, low-fatigue **pump / catch-up session** that can go on **any day** to fill gaps (upper back, grip, neck, arms if the user wants them).
- Fits grapplers well on light-mat days. **Later, optional.**

---

## What Roll Fit already does vs. what to add later

| Principle | Status |
|---|---|
| Top set + back-offs, pyramid warm-ups | ✅ In app |
| Reps-left-in-tank effort (Easy / Solid / Hard) | ✅ In app |
| Double progression on accessories | ✅ In app |
| Easy top set → heavier next time | ✅ In app |
| Mid-block deload, test week | ✅ In app |
| Each pattern ~2×/week | ✅ In app |
| Readiness + "Jiu-jitsu today" adjustments | ✅ In app |
| Intensity **ranges** instead of one fixed % | Later |
| **Alternating strength / muscle weeks** | Later (with the goal picker) |
| Weekly set targets per muscle (8–14 for grapplers) | Later |
| Rep-max test option + full deload after the test | Later |
| Optional catch-up day | Later |
| Conditioning | Later (separate framework) |
