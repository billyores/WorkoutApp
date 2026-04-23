# WorkTrack — Workout Tracking PWA

## Project Overview
A progressive web app (PWA) for tracking workouts on Android. Pure HTML/CSS/JS with no build tools,
no backend, and no external dependencies. All data stored in `localStorage`. Designed to run
offline and be installable on Android via "Add to Home Screen."

## Goals
- Quick workout logging (date, time, exercise, sets, reps, muscle groups)
- Calendar view showing logged and planned workouts
- Pre-built plan templates by goal category (strength, shred, weight-loss)
- Pluggable/movable components — each view's blocks can be drag-reordered and persisted
- Mobile-first, gym-friendly dark UI

## Tech Stack
- **No build tools** — open `index.html` directly in browser or serve with any static server
- **No npm / node** — copy the directory to any machine and it works
- **localStorage** for all persistence — no backend required
- **Pointer Events API** for drag-and-drop (works on Android touch + desktop mouse)
- **Service Worker** for offline support (Cache-first strategy)

## File Structure
```
Workout App/
├── CLAUDE.md              ← You are here
├── CHANGELOG.md
├── index.html             ← Entry point, all <script> and <link> tags
├── manifest.json          ← PWA manifest (Add to Home Screen)
├── service-worker.js      ← Offline cache (cache-first)
├── css/
│   └── main.css           ← All styles in one file (variables → layout → components)
└── js/
    ├── storage.js         ← localStorage read/write (WT.Storage namespace)
    ├── app.js             ← Boot, view router, settings, toast, WT.App namespace
    ├── data/
    │   ├── exercises.js   ← Master exercise list with muscle groups (WT.Exercises)
    │   └── workout-plans.js ← Plan templates: strength / shred / weight-loss (WT.Plans)
    └── components/
        ├── drag-drop.js      ← Pointer-events drag engine (WT.DragDrop)
        ├── workout-logger.js ← Log today's session (WT.WorkoutLogger)
        ├── calendar.js       ← Monthly calendar + day detail (WT.Calendar)
        ├── plan-builder.js   ← Browse & activate plan templates (WT.PlanBuilder)
        └── history.js        ← Past sessions list (WT.History)
```

## Global Namespace
Every JS file attaches to the `window.WT` namespace to avoid globals:
```js
window.WT = window.WT || {};
WT.Storage = (function() { ... })();
```

**Script load order** (defined in `index.html` with `defer`):
1. `js/storage.js`
2. `js/data/exercises.js`
3. `js/data/workout-plans.js`
4. `js/components/drag-drop.js`
5. `js/components/workout-logger.js`
6. `js/components/calendar.js`
7. `js/components/plan-builder.js`
8. `js/components/history.js`
9. `js/app.js`  ← boots last, depends on all above

## Component Lifecycle Contract
Each component module exposes:
```js
{
  render(containerEl, state)     // creates DOM inside containerEl
  afterRender(containerEl)       // binds events (called after render)
  destroy(containerEl)           // removes listeners, cleans up
}
```
`WT.App` calls these in order when switching views.

## localStorage Keys
| Key                     | Shape                      | Description                    |
|-------------------------|----------------------------|--------------------------------|
| `wt_workoutLogs`        | `WorkoutLog[]`             | All logged sessions            |
| `wt_activePlan`         | `ActivePlan \| null`       | Currently running plan         |
| `wt_settings`           | `AppSettings`              | User preferences               |
| `wt_layout_log`         | `string[]` (block id order)| Drag order for Log view        |
| `wt_layout_calendar`    | `string[]`                 | Drag order for Calendar view   |

### WorkoutLog shape
```json
{
  "id": "uuid",
  "sessionId": "uuid",
  "date": "2026-04-20",
  "startTime": "07:15",
  "endTime": "07:45",
  "exercises": [
    {
      "id": "ex_bench_press",
      "name": "Bench Press",
      "muscleGroups": ["chest", "triceps", "front-delts"],
      "isBodyweight": false,
      "sets": [
        { "setNumber": 1, "reps": 10, "weight": 60, "notes": "" }
      ]
    }
  ],
  "notes": "",
  "planRef": { "planId": "plan_strength", "weekNumber": 1, "dayNumber": 1 }
}
```

### AppSettings shape
```json
{
  "weightUnit": "kg",
  "restTimerSec": 90,
  "startOfWeek": 1
}
```

## Adding a New Exercise
Edit `js/data/exercises.js`. Add to the `EXERCISES` array:
```js
{ id: 'ex_your_exercise', name: 'Your Exercise', muscleGroups: ['group1', 'group2'], isBodyweight: false }
```
Muscle group strings must match keys in the `MUSCLE_GROUPS` map at the top of that file.

## Adding a New Workout Plan
Edit `js/data/workout-plans.js`. Add to the `WORKOUT_PLANS` array following the existing shape.
The `goal` field must be one of: `"strength"`, `"shred"`, `"weight-loss"`.

## Service Worker Cache
When you add new files, update the `CACHE_FILES` array in `service-worker.js`.
The SW uses cache-then-network: cached assets load immediately, updated in the background on next visit.

## PWA Install (Android)
1. Open `index.html` in Chrome on Android (must be served over HTTP/HTTPS, not `file://`)
2. Tap the three-dot menu → "Add to Home Screen"
3. To serve locally: `python3 -m http.server 8080` from the `Workout App/` directory

## Development Notes
- No linter or formatter configured — follow existing code style (2-space indent, single quotes)
- CSS custom properties are defined in `:root` in `css/main.css` — change colors/spacing there
- All date handling uses `YYYY-MM-DD` strings (no Date objects stored in localStorage)
- UUIDs generated by `WT.App.uuid()` helper in `app.js`
