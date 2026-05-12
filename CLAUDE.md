# WorkTrack — Workout Tracking PWA

## Project Overview
A progressive web app (PWA) for tracking workouts on Android. Pure HTML/CSS/JS — no build tools,
no backend, no external dependencies. All data stored in `localStorage`. Hosted on GitHub Pages
at `https://billyores.github.io/WorkoutApp/`. Installable on Android via "Add to Home Screen."

**Git repo:** `billyores/WorkoutApp` (public, required for GitHub Pages free tier)
**Local path:** `/Users/billyo/Documents/Projects/Workout App/`

---

## File Structure
```
Workout App/
├── CLAUDE.md                  ← You are here
├── CHANGELOG.md
├── index.html                 ← Entry point; all <script defer> and <link> tags live here
├── manifest.json              ← PWA manifest
├── service-worker.js          ← Offline cache (cache-first + background update)
├── import-workouts.html       ← One-time page: imports 14 historical sessions (Mar–Apr 2026)
├── cleanup-exercises.html     ← One-time page: deduplicates custom exercises in localStorage
├── css/
│   └── main.css               ← All styles (CSS vars → layout → per-component)
└── js/
    ├── storage.js             ← WT.Storage — all localStorage read/write
    ├── app.js                 ← WT.App — boot, router, settings drawer, modal, toast, utils
    ├── data/
    │   ├── exercises.js       ← WT.Exercises — built-in exercise list + joints + custom lookup
    │   └── workout-plans.js   ← WT.Plans — plan templates (strength/shred/weight-loss)
    └── components/
        ├── drag-drop.js       ← WT.DragDrop — pointer-events drag engine (Android-compatible)
        ├── muscle-status.js   ← WT.MuscleStatus — injury/soreness tracking, check-in modal
        ├── workout-logger.js  ← WT.WorkoutLogger — Home tab: log/edit sessions, rest timer
        ├── calendar.js        ← WT.Calendar — monthly calendar + day detail + edit workout
        ├── plan-builder.js    ← WT.PlanBuilder — browse & activate plan templates
        ├── history.js         ← WT.History — past sessions list with export
        ├── goals.js           ← WT.Goals — strength/weight/shred goals + plan recommendations
        └── stats.js           ← WT.Stats — PRs, charts, body weight, muscle history, injuries
```

---

## Script Load Order
Defined in `index.html` with `defer` — order matters:
1. `js/storage.js`
2. `js/data/exercises.js`
3. `js/data/workout-plans.js`
4. `js/components/drag-drop.js`
5. `js/components/muscle-status.js`
6. `js/components/workout-logger.js`
7. `js/components/calendar.js`
8. `js/components/plan-builder.js`
9. `js/components/history.js`
10. `js/components/goals.js`
11. `js/components/stats.js`
12. `js/app.js` ← boots last, depends on all above

---

## Global Namespace Pattern
Every JS file attaches to `window.WT`:
```js
window.WT = window.WT || {};
WT.Storage = (function() { ... return { ... }; })();
```

---

## Component Lifecycle Contract
Each view component exposes:
```js
{
  render(containerEl)      // builds innerHTML
  afterRender(containerEl) // binds events
  destroy()                // cleans up listeners/intervals
}
```
`WT.App._navigateTo(viewId)` calls these in order.

---

## localStorage Keys
| Key                  | Shape                        | Description                              |
|----------------------|------------------------------|------------------------------------------|
| `wt_workoutLogs`     | `WorkoutLog[]`               | All logged sessions                      |
| `wt_draftSession`    | `WorkoutLog \| null`         | In-progress session (auto-saved)         |
| `wt_activePlan`      | `ActivePlan \| null`         | Currently running plan                   |
| `wt_settings`        | `AppSettings`                | User preferences + profile               |
| `wt_records`         | `{ [exId]: PRRecord }`       | Personal records (max weight per exercise)|
| `wt_bodyStats`       | `BodyStat[]`                 | Body weight log entries                  |
| `wt_customExercises` | `Exercise[]`                 | User-created exercises                   |
| `wt_muscleStatus`    | `{ [muscleId]: StatusEntry }`| Current injury/soreness per muscle       |
| `wt_muscleHistory`   | `HistoryEntry[]`             | Historical check-in scores per muscle    |
| `wt_goals`           | `Goal[]`                     | Strength / weight / shred goals          |
| `wt_layout_log`      | `string[]`                   | Drag-reorder state for Home view         |
| `wt_layout_calendar` | `string[]`                   | Drag-reorder state for Calendar view     |

### WorkoutLog shape
```json
{
  "id": "uuid",
  "date": "2026-04-20",
  "startTime": "07:15",
  "endTime": "08:00",
  "exercises": [
    {
      "id": "ex_bench_press",
      "name": "Bench Press",
      "muscleGroups": ["chest", "front-delts", "triceps"],
      "isBodyweight": false,
      "sets": [
        { "setNumber": 1, "reps": 5, "weight": 135, "notes": "", "done": true }
      ]
    }
  ],
  "notes": "",
  "planRef": { "planId": "plan_stronglifts" }
}
```

### AppSettings shape
```json
{
  "weightUnit": "lbs",
  "restTimerSec": 90,
  "startOfWeek": 1,
  "theme": "dark",
  "profileHeightCm": null,
  "profileHeightUnit": "imperial"
}
```

### PRRecord shape
```json
{
  "exerciseId": "ex_bench_press",
  "exerciseName": "Bench Press",
  "maxWeight": 200,
  "reps": 1,
  "date": "2026-04-19",
  "logId": "uuid-or-null"
}
```

### Goal shape
```json
{
  "id": "uuid",
  "type": "strength",
  "title": "Bench 225",
  "status": "active",
  "startDate": "2026-05-01",
  "exerciseId": "ex_bench_press",
  "exerciseName": "Bench Press",
  "targetWeight": 225,
  "startValue": 200,
  "recommendedPlanId": "plan_stronglifts",
  "recommendedPlanName": "StrongLifts 5×5"
}
```

---

## Key Public APIs

### WT.WorkoutLogger
- `showEditModal(logId, onSaved)` — opens bottom-sheet to edit a saved workout in-place
- `showCreateExerciseModal(onSaved)` — opens custom exercise creation modal; `onSaved(ex)` called on save

### WT.Goals
- `buildHomeProgressHTML()` — returns HTML for compact goal cards shown on Home tab
- `showAddGoalModal(onSaved)` — multi-step modal: type → fields + plan recommendations → save
- `checkAndNotify()` — checks if goals were just achieved; shows achievement modal if so

### WT.MuscleStatus
- `buildInjuryBannerHTML()` — compact single-row banner shown on Home if any muscles injured
- `buildInjuryBannerHTML()` returns `''` if no active injuries
- `showCheckInModal(opts)` — pre-workout soreness check-in (opts: `{ onComplete, isRecoveryCheckIn }`)
- `shouldShowCheckIn()` — returns true if a check-in is due today
- `filterExercises(exercises)` — returns `{ safe, skipped }` filtering out injured-muscle exercises

### WT.App (global utilities)
- `showModal(html)` / `closeModal()` — bottom-sheet modal
- `toast(message, type)` — transient notification (type: `'info'|'success'|'error'`)
- `todayStr()` — returns `'YYYY-MM-DD'`
- `timeStr()` — returns `'HH:MM'`
- `uuid()` — generates a UUID v4

---

## Features Implemented

### Home Tab (was "Log")
- Start/finish/cancel workout session with elapsed timer
- Rest timer auto-starts when a set is checked done (configurable per plan)
- Pre-workout muscle check-in if due
- Injury banner (compact, single row) when muscles are injured
- Active plan banner with "Load" button
- Goal progress cards below Start Workout button

### Calendar Tab
- Monthly calendar with dots: green=logged, blue outline=planned, red=injury
- Tap a date → day detail panel (logged workouts, planned exercises, muscle status)
- Pencil button on each workout row → opens full edit modal (same UI as logger)

### History Tab
- All past sessions, expandable, with exercise/set breakdown
- Export to CSV or JSON

### Plans Tab
- Browse plan templates, activate one at a time
- Plans: StrongLifts 5×5, Wendler 5/3/1, PPL High Volume, Arnold Split, Full Body + Cardio, HIIT + Resistance

### Stats Tab (tabs: Overview, PRs, Body, Progress, Goals, Injuries)
- PRs table per exercise
- Body weight chart (Canvas)
- Per-exercise volume/weight charts
- Goals progress with achievement tracking
- Muscle injury history calendar

### Settings Drawer
- **About Me:** height (imperial/metric), injury checkboxes (muscles + joints)
- **My Exercises:** list of custom exercises with delete; + Add Exercise button
- Theme toggle (dark/light), weight unit (lbs/kg), week start, default rest timer
- Clear all data

### Goals
- Types: Strength (target weight on exercise), Weight Lose/Gain (target body weight), Shred
- Recommended plans shown per goal type
- Achievement detection after each saved workout; celebration modal with "Set Next Goal" chain

### Injury System
- Muscles and joints tracked separately in About Me
- Injured muscles block exercises from being loaded from a plan
- 7-day recovery window with early check-in option
- Recovery mode: 50% weight hint for muscles in recovery

---

## Exercises
Built-in exercises are in `js/data/exercises.js` in the `EXERCISES` array.
Custom exercises are saved to `wt_customExercises` in localStorage via `WT.Storage.saveCustomExercise()`.

`WT.Exercises.search(query)` and `WT.Exercises.getById(id)` both search built-in + custom.

**Notable exercises added beyond original set:**
- `ex_upright_row` — Upright Row (shoulders, traps)

**Joints** (injury tracking only, not assigned to exercises):
`knee, elbow, neck, lower-back, hip, ankle, wrist`

### Adding a new built-in exercise
Edit `js/data/exercises.js`, add to `EXERCISES`:
```js
{ id: 'ex_your_exercise', name: 'Your Exercise', muscleGroups: ['chest', 'triceps'], isBodyweight: false }
```
Muscle group keys must match the `MUSCLE_GROUPS` map at the top of that file.

---

## Service Worker / Deployment

**CRITICAL: Bump `CACHE_NAME` in `service-worker.js` on every deploy that changes JS or CSS.**

```js
const CACHE_NAME = 'worktrack-v5'; // increment this each deploy
```

The SW uses cache-first + background update. Without bumping the version, devices will serve
stale cached JS indefinitely (old and new SWs share the same cache name and the activate
handler only deletes caches with different names).

When adding new files, also add them to the `CACHE_FILES` array in `service-worker.js`.

### Deploy workflow
```bash
cd "Workout App"
# make changes...
# bump CACHE_NAME in service-worker.js
git add <files>
git commit -m "description"
git push origin main
# GitHub Pages auto-deploys from main branch
```

---

## User's Data (as of 2026-05-11)
- **14 historical sessions** loaded via `import-workouts.html` (Mar 7 – Apr 19, 2026)
  - StrongLifts 5×5 A/B split through March, switched to hypertrophy split April 19
  - Noted: lower back discomfort Mar 21 (golf); knee issues Apr 7 + Apr 14 (hiking)
- **Known PRs:** Bench Press actual 1RM = 200 lb (set in `wt_records` via import page)
- **Custom exercises:** "Forearm Rolls" (and possibly duplicates — run `cleanup-exercises.html` if needed)

---

## Development Notes
- 2-space indent, single quotes throughout
- CSS custom properties in `:root` in `main.css` — change colors/spacing there
- All dates stored as `YYYY-MM-DD` strings; times as `HH:MM` strings
- No Date objects in localStorage — always serialize/deserialize via string
- `confirm()` used for destructive actions (cancel workout, delete data)
- The settings drawer is static HTML in `index.html`; dynamic sections are populated
  by `_renderProfileInjuries()`, `_renderCustomExercises()` in `app.js` on drawer open

## PWA on Android
- Must be served over HTTPS — `file://` origin blocks CSS/JS and siloes localStorage
- GitHub Pages URL: `https://billyores.github.io/WorkoutApp/`
- Install: Chrome → three-dot menu → "Add to Home Screen"
- Custom exercises created at `file://` are NOT accessible from the GitHub Pages origin
