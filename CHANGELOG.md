# Changelog

All notable changes to WorkTrack will be documented here.
Format: `[version] YYYY-MM-DD — description`

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
