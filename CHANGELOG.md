# Changelog

All notable changes to WorkTrack will be documented here.
Format: `[version] YYYY-MM-DD — description`

---

## [0.7.0] 2026-05-25 — Home screen enhancements, 1000 lb Club, plan banner Load button

### Added
- **Plan banner: day selector + Load button** (`js/components/workout-logger.js`):
  - Plan banner on Home tab now shows selector buttons for each unique workout day (e.g. "Workout A" / "Workout B" for StrongLifts)
  - Deduplicates workout days by label so each unique day appears once
  - **Load button** (right side of banner) loads the selected day's exercises into the active session; auto-starts session if none is in progress
  - Selector buttons highlight the currently selected day; tapping one updates the Load button's target index
  - Banner is removed from DOM after Load is clicked; reappears on next visit to Home tab
  - Banner only renders when a plan is active (`WT.Storage.getActivePlan()` is non-null)
- **1000 lb Club tracker** on Home tab — shows combined total of Squat + Bench Press + Deadlift PRs vs 1000 lb milestone; only shown once at least one of the three lifts has been logged
- **Calendar day detail** now shows workout start time and duration (e.g. "7:15 AM · 45 min") for logged sessions

### Changed
- Plan day loading logic (`0f0307f`): switched from calendar-date-scheduled day to **next uncompleted day** based on `completedDayCount`. Missed days are always picked up on the next session instead of being skipped. Falls back to `completedDays.length` for plans saved before `completedDayCount` was added.

### Fixed
- Plan banner layout: Load button was not visible because of incorrect `flex-direction: column` override on `.plan-banner`. Fixed by removing the style override and restructuring HTML so the left `<div>` holds the plan name + selector buttons, and the Load button sits on the right with `flex-shrink: 0`. The `.plan-banner` CSS already uses `display: flex; justify-content: space-between` correctly.

### Dev notes (2026-05-25 session)
- **Load button visibility debugging**: if the Load button is not visible in the deployed app, the most likely causes are (1) stale service worker — close all tabs and reopen, or clear site data in Chrome; (2) no active plan set — go to Plans tab and activate one; (3) already clicked Load this session — banner is removed until session ends.
- `#view-container` has `overflow-x: hidden` — any element that overflows the right edge of the screen will be clipped. Keep this in mind when adding buttons or elements to banners.
- Service worker is at `worktrack-v11` — **must bump `CACHE_NAME` on every deploy**.

---

## [0.6.0] 2026-05-11 — Exercise management in settings, custom exercise bug fix

### Added
- **Exercise management in Settings drawer** (`app.js`): "My Exercises" section lists all custom exercises with a delete button; "+ Add Exercise" button opens the `showCreateExerciseModal` flow inline from settings
- `cleanup-exercises.html` — one-time utility page to deduplicate custom exercises in localStorage (e.g. "Forearm Roll" vs "Forearm Rolls"); kept most-recently-created on conflict; safe to run multiple times
- `CLAUDE.md` updated to reflect full current app state as of 2026-05-11

### Fixed
- Custom exercises not appearing in the workout "Add Exercise" search (`a187bd3`): `WT.Exercises.search()` and `getAll()` were not merging custom exercises from `wt_customExercises` with the built-in list

### Dev notes
- Custom exercises created via the `file://` origin are **not** accessible from the `https://billyores.github.io` origin (different localStorage scopes). Always use the live GitHub Pages URL to add custom exercises.

---

## [0.5.0] 2026-04-26 — Historical data import, calendar edit, Upright Row

### Added
- `import-workouts.html` — one-time page that imports 14 historical sessions (Mar 7 – Apr 19, 2026) directly into `wt_workoutLogs`; also sets Bench Press PR to 200 lb in `wt_records`
  - Sessions cover StrongLifts 5×5 A/B split (March) → hypertrophy split (Apr 19)
  - Lower back discomfort logged Mar 21 (golf); knee issues Apr 7 + Apr 14 (hiking)
- **Edit workout from Calendar day detail** (`calendar.js`): pencil icon on each logged session row opens the full edit modal (same UI as workout-logger edit flow)
- `ex_upright_row` — Upright Row added to built-in exercise list (`exercises.js`), muscles: shoulders + traps

### Fixed
- Edit button wiring and PR storage key mismatch in stats/history (`7ca075f`)
- Service worker cache bumped to v2 then v3 to force fresh JS after these fixes

---

## [0.4.0] 2026-04-23 — Goals feature, injuries stats tab, calendar red dots

### Added
- **Goals** (`js/components/goals.js`, `WT.Goals`):
  - Three goal types: 💪 Strength (target lift weight), ⚖️ Body Weight (lose or gain to target), 🔥 Shred (qualitative with target date)
  - Goal creation modal: type selector → type-specific fields → recommended plan (pre-selected radio)
  - Plan recommendation: Strength → StrongLifts/Wendler; Lose Weight → HIIT/Full Body; Gain Weight → PPL/Arnold; Shred → PPL/HIIT
  - Auto-activates selected plan when saving a new goal
  - Progress bars on active strength/weight goals (start value captured at creation time)
  - Goal achievement detection: checks after every workout save (strength PRs) and body stat log (weight goals)
  - Achievement modal: "🎉 Goal Achieved!" celebration with "Set Next Goal" prompt
  - Goals tab added to Stats view (🎯 Goals — 5th tab)
  - Completed goals shown in "Achieved 🏅" section with completion date
- **Injuries tab** in Stats view (🩹 Injuries):
  - Total injury days per muscle, injury period timeline, recent soreness log
- **Calendar injury dots**: red dots on injury days; muscle status chips in day detail panel

### Storage
- New localStorage key: `wt_goals` — Goal[]

---

## [0.3.0] 2026-04-20 — Muscle soreness tracking, injury management, cancel workout

### Added
- **Pre-workout muscle check-in** (`js/components/muscle-status.js`):
  - Shown before every workout (after first session — becomes a quick habit)
  - Rates each recently-worked muscle group: 🟢 Feeling Good · 🟡 Mild Soreness · 🟠 Very Sore · 🔴 Injured
  - Tap cycles through statuses; "Show all muscle groups" expands to full list
  - Skip button to bypass quickly
- **Injury management**:
  - Marking a muscle as "Injured" blocks all exercises using that muscle from plan day loads
  - Skipped exercises shown as an info toast: "Skipped (injured): Bench Press"
  - 7-day auto-recovery date set on injury
  - Recovery check-in banner shows on Log view listing all current injuries + recovery dates
  - "Check in now" button (after recovery date) or "I feel better" (early check-in)
  - Recovery check-in: if still sore → extend recovery 3 more days; if Good → enter Recovery Mode
- **Recovery Mode**: first session after clearing an injury shows a banner: "Try ~50% of your previous weight for [exercise names]"
- **Cancel Workout button** — visible during active session; requires confirmation if exercises already logged

### Changed
- `js/storage.js`: added `MUSCLE_STATUS` key, `getMuscleStatus`, `saveMuscleStatus`, `clearMuscleStatus`
- `js/components/workout-logger.js`: pre-workout check-in flow, injury banner, recovery mode banner, cancel button, injured muscle filtering on plan day load
- Service worker cache updated

---

## [0.2.0] 2026-04-20 — Feature batch: Stats, PRs, charts, themes, custom exercises

### Added
- **Stats view** (new tab) with three sub-sections:
  - 🏆 **Personal Records** — best set per weighted exercise, "NEW" badge for PRs in the last 7 days; tap a PR to jump to its progress chart
  - 📈 **Progress Charts** — Canvas line chart of best weight per session for any logged exercise, with smoothed bezier curve, area fill, and session history table
  - ⚖️ **Body Weight Tracking** — log daily weight, view trend chart, start/current/change summary
- **Session Notes** — free-text notes field on the workout logger, saved with each session and displayed in history
- **Custom Exercises** — "Create custom exercise" button in exercise search; pick name, muscle groups, bodyweight flag; saved to localStorage and merged with built-in list; "Custom" badge visible in search
- **Light Theme** — toggle in Settings; full CSS variable override; persisted in settings
- **Share Workout** — share icon on each history session card; uses Web Share API on Android (native share sheet) with clipboard fallback
- **PR Detection** — auto-detects new personal records when finishing a session; toast celebration; PR badge shown inline in history detail view

### Changed
- Bottom nav now has 5 tabs (added Stats)
- Settings drawer: added Theme toggle section
- `js/storage.js`: added `RECORDS`, `BODY_STATS`, `CUSTOM_EX` storage keys and all associated methods
- `js/data/exercises.js`: `getAll()` now merges built-in + custom exercises
- Service worker cache updated to include `stats.js`

---

## [0.1.0] 2026-04-20 — Initial build

### Added
- Project scaffolding: HTML/CSS/JS PWA structure, no build tools
- `CLAUDE.md` with architecture docs, data schemas, and development notes
- `manifest.json` + `service-worker.js` for offline PWA support
- `css/main.css` — full dark-theme mobile-first stylesheet with CSS custom properties
- `js/storage.js` — localStorage read/write layer (`WT.Storage` namespace)
- `js/data/exercises.js` — master exercise list with muscle group metadata
- `js/data/workout-plans.js` — 6 plan templates across 3 goal categories:
  - **Strength:** StrongLifts 5x5, Wendler 5/3/1
  - **Getting Shredded:** Push/Pull/Legs High Volume, Arnold Split
  - **Weight Loss:** Full Body 3x + Cardio, HIIT + Resistance
- `js/components/drag-drop.js` — Pointer Events drag engine for reordering view blocks
- `js/components/workout-logger.js` — Log sessions with exercise search, sets/reps/weight entry, rest timer
- `js/components/calendar.js` — Monthly calendar with workout indicators, day detail overlay, plan projection
- `js/components/plan-builder.js` — Browse plans by goal, view weekly schedule, activate with start date
- `js/components/history.js` — Past sessions list with expandable detail and basic stats
- `js/app.js` — App boot, hash-based view router, settings drawer, toast notifications
- `index.html` — Entry point with bottom navigation, settings drawer, modal overlay

### Notes
- All data stored in localStorage (no backend)
- Default weight unit: **lbs** (switchable to kg in settings)
- Default rest timer: **90 seconds** (plans override with their own recommended rest)
  - StrongLifts 5x5: 3 min rest; Wendler 5/3/1: 4 min rest; shred/weight-loss: 45-60s
- Bodyweight exercises tracked without weight field (BW flag)
- CSV export/import for Google Drive backup; full JSON backup/restore also available
- Supports Android "Add to Home Screen" install (PWA)
- Dark theme default; light theme switching can be added in future
