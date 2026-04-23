// WT.Storage — localStorage read/write layer
// All keys are prefixed with 'wt_' to avoid collisions
window.WT = window.WT || {};

WT.Storage = (function () {
  const KEYS = {
    LOGS:        'wt_workoutLogs',
    ACTIVE_PLAN: 'wt_activePlan',
    SETTINGS:    'wt_settings',
    LAYOUT_LOG:  'wt_layout_log',
    LAYOUT_CAL:  'wt_layout_calendar',
    RECORDS:       'wt_records',        // PRs: { exerciseId: { maxWeight, reps, date, ... } }
    BODY_STATS:    'wt_bodyStats',      // BodyStat[]
    CUSTOM_EX:     'wt_customExercises', // Exercise[]
    MUSCLE_STATUS:  'wt_muscleStatus',   // { [muscleId]: MuscleStatusEntry }
    MUSCLE_HISTORY: 'wt_muscleHistory', // MuscleHistoryEntry[] — one per check-in per muscle per day
    GOALS:          'wt_goals',          // Goal[]
  };

  const DEFAULTS = {
    settings: {
      weightUnit:        'lbs',
      restTimerSec:      90,
      startOfWeek:       1,    // 1 = Monday
      theme:             'dark',
      profileHeightCm:   null, // stored in cm; display converted per profileHeightUnit
      profileHeightUnit: 'imperial', // 'imperial' | 'metric'
    }
  };

  // ── Generic helpers ──────────────────────────────────────

  function read(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn('[WT.Storage] read error', key, e);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('[WT.Storage] write error', key, e);
      return false;
    }
  }

  function remove(key) {
    localStorage.removeItem(key);
  }

  // ── Settings ─────────────────────────────────────────────

  function getSettings() {
    return Object.assign({}, DEFAULTS.settings, read(KEYS.SETTINGS, {}));
  }

  function saveSettings(settings) {
    return write(KEYS.SETTINGS, Object.assign(getSettings(), settings));
  }

  // ── Workout Logs ─────────────────────────────────────────

  function getLogs() {
    return read(KEYS.LOGS, []);
  }

  function saveLog(log) {
    const logs = getLogs();
    const idx  = logs.findIndex((l) => l.id === log.id);
    if (idx >= 0) {
      logs[idx] = log;
    } else {
      logs.push(log);
      _updatePRs(log); // only check PRs on new logs
    }
    return write(KEYS.LOGS, logs);
  }

  function deleteLog(id) {
    const logs = getLogs().filter((l) => l.id !== id);
    return write(KEYS.LOGS, logs);
  }

  function getLogsByDate(dateStr) {
    return getLogs().filter((l) => l.date === dateStr);
  }

  function getLogsByMonth(year, month) {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return getLogs().filter((l) => l.date && l.date.startsWith(prefix));
  }

  function getLoggedDates() {
    return new Set(getLogs().map((l) => l.date));
  }

  // ── Active Plan ──────────────────────────────────────────

  function getActivePlan() {
    return read(KEYS.ACTIVE_PLAN, null);
  }

  function saveActivePlan(plan) {
    return write(KEYS.ACTIVE_PLAN, plan);
  }

  function clearActivePlan() {
    remove(KEYS.ACTIVE_PLAN);
  }

  function completePlanDay(dateStr) {
    const plan = getActivePlan();
    if (!plan) return;
    plan.completedDays = plan.completedDays || [];
    if (!plan.completedDays.includes(dateStr)) {
      plan.completedDays.push(dateStr);
    }
    saveActivePlan(plan);
  }

  // ── Component Layout ─────────────────────────────────────

  function getLayout(view) {
    const key = view === 'calendar' ? KEYS.LAYOUT_CAL : KEYS.LAYOUT_LOG;
    return read(key, null);
  }

  function saveLayout(view, orderArray) {
    const key = view === 'calendar' ? KEYS.LAYOUT_CAL : KEYS.LAYOUT_LOG;
    return write(key, orderArray);
  }

  // ── Personal Records (PRs) ────────────────────────────────
  // Shape: { [exerciseId]: { exerciseId, exerciseName, maxWeight, reps, date, logId } }

  function getPRs() {
    return read(KEYS.RECORDS, {});
  }

  // Returns array of { exerciseName, maxWeight, reps, date } for newly broken PRs
  function checkAndUpdatePRs(log) {
    return _updatePRs(log, true);
  }

  function _updatePRs(log, returnNew = false) {
    const records  = getPRs();
    const newPRs   = [];

    (log.exercises || []).forEach((ex) => {
      if (ex.isBodyweight) return; // skip bodyweight for PR tracking
      ex.sets.forEach((set) => {
        if (set.weight == null || !set.reps) return;
        const existing = records[ex.id];
        if (!existing || set.weight > existing.maxWeight) {
          records[ex.id] = {
            exerciseId:   ex.id,
            exerciseName: ex.name,
            maxWeight:    set.weight,
            reps:         set.reps,
            date:         log.date,
            logId:        log.id,
          };
          if (returnNew) newPRs.push(records[ex.id]);
        }
      });
    });

    write(KEYS.RECORDS, records);
    return returnNew ? newPRs : undefined;
  }

  function clearPRs() {
    remove(KEYS.RECORDS);
  }

  // ── Body Stats ────────────────────────────────────────────
  // Shape: [{ id, date, weight, unit, notes }]

  function getBodyStats() {
    return read(KEYS.BODY_STATS, []);
  }

  function saveBodyStat(stat) {
    const stats = getBodyStats();
    const idx   = stats.findIndex((s) => s.id === stat.id);
    if (idx >= 0) {
      stats[idx] = stat;
    } else {
      stats.push(stat);
    }
    // Keep sorted by date
    stats.sort((a, b) => a.date.localeCompare(b.date));
    return write(KEYS.BODY_STATS, stats);
  }

  function deleteBodyStat(id) {
    const stats = getBodyStats().filter((s) => s.id !== id);
    return write(KEYS.BODY_STATS, stats);
  }

  // ── Muscle Status ─────────────────────────────────────────
  // Shape: { [muscleId]: { muscleId, score, key, label, lastUpdated, injuredDate, recoveryDate, recoveryMode } }

  function getMuscleStatus() {
    return read(KEYS.MUSCLE_STATUS, {});
  }

  function saveMuscleStatus(muscleId, statusObj) {
    const all = getMuscleStatus();
    all[muscleId] = { ...statusObj, muscleId };
    return write(KEYS.MUSCLE_STATUS, all);
  }

  function clearMuscleStatus(muscleId) {
    const all = getMuscleStatus();
    delete all[muscleId];
    return write(KEYS.MUSCLE_STATUS, all);
  }

  // ── Muscle History ────────────────────────────────────────
  // Shape: [{ id, date, muscleId, muscleName, score, key, label }]
  // One entry per muscle per check-in day (upserted by date+muscleId)

  function getMuscleHistory() {
    return read(KEYS.MUSCLE_HISTORY, []);
  }

  function appendMuscleHistory(entry) {
    // entry: { date, muscleId, muscleName, score, key, label }
    const history = getMuscleHistory();
    // Upsert: replace existing entry for same date+muscle
    const idx = history.findIndex(
      (h) => h.date === entry.date && h.muscleId === entry.muscleId
    );
    const full = { id: entry.id || (entry.date + '_' + entry.muscleId), ...entry };
    if (idx >= 0) {
      history[idx] = full;
    } else {
      history.push(full);
    }
    return write(KEYS.MUSCLE_HISTORY, history);
  }

  // Returns a Set of date strings where any muscle had score === 3 (injured)
  function getInjuredDates() {
    const history = getMuscleHistory();
    return new Set(history.filter((h) => h.score === 3).map((h) => h.date));
  }

  // Returns history entries for a specific date
  function getMuscleHistoryByDate(dateStr) {
    return getMuscleHistory().filter((h) => h.date === dateStr);
  }

  // ── Custom Exercises ──────────────────────────────────────
  // Shape matches exercises.js: { id, name, muscleGroups, isBodyweight, isCustom: true }

  function getCustomExercises() {
    return read(KEYS.CUSTOM_EX, []);
  }

  function saveCustomExercise(exercise) {
    const existing = getCustomExercises();
    const idx      = existing.findIndex((e) => e.id === exercise.id);
    if (idx >= 0) {
      existing[idx] = exercise;
    } else {
      existing.push(exercise);
    }
    return write(KEYS.CUSTOM_EX, existing);
  }

  function deleteCustomExercise(id) {
    const existing = getCustomExercises().filter((e) => e.id !== id);
    return write(KEYS.CUSTOM_EX, existing);
  }

  // ── Goals ─────────────────────────────────────────────────
  // Shape: [{ id, type, title, status, startDate, unit, targetDate, completedDate,
  //           exerciseId?, exerciseName?, targetWeight?, startValue?,
  //           targetBodyWeight?, weightDirection?,
  //           description?, recommendedPlanId?, recommendedPlanName? }]

  function getGoals() {
    return read(KEYS.GOALS, []);
  }

  function saveGoal(goal) {
    const goals = getGoals();
    const idx   = goals.findIndex((g) => g.id === goal.id);
    if (idx >= 0) {
      goals[idx] = goal;
    } else {
      goals.push(goal);
    }
    return write(KEYS.GOALS, goals);
  }

  function deleteGoal(id) {
    return write(KEYS.GOALS, getGoals().filter((g) => g.id !== id));
  }

  // Checks active goals against current PRs and body stats.
  // Marks any newly achieved goals as 'completed' and returns them.
  function checkGoalsProgress() {
    const goals  = getGoals();
    const active = goals.filter((g) => g.status === 'active');
    if (!active.length) return [];

    const records    = getPRs();
    const bodyStats  = getBodyStats();
    const latestBody = bodyStats.length ? bodyStats[bodyStats.length - 1].weight : null;
    const today      = new Date().toISOString().slice(0, 10);

    const newlyCompleted = [];
    let changed = false;

    active.forEach((goal) => {
      let achieved = false;

      if (goal.type === 'strength' && goal.exerciseId && goal.targetWeight != null) {
        const pr = records[goal.exerciseId];
        if (pr && pr.maxWeight >= goal.targetWeight) achieved = true;
      } else if (goal.type === 'weight' && goal.targetBodyWeight != null && latestBody != null) {
        if (goal.weightDirection === 'lose' && latestBody <= goal.targetBodyWeight) achieved = true;
        if (goal.weightDirection === 'gain' && latestBody >= goal.targetBodyWeight) achieved = true;
      }

      if (achieved) {
        // Update in the full goals array
        const gIdx = goals.findIndex((g) => g.id === goal.id);
        if (gIdx >= 0) {
          goals[gIdx].status        = 'completed';
          goals[gIdx].completedDate = today;
          newlyCompleted.push({ ...goals[gIdx] });
          changed = true;
        }
      }
    });

    if (changed) write(KEYS.GOALS, goals);
    return newlyCompleted;
  }

  // ── Utilities ────────────────────────────────────────────

  function getStorageUsageKB() {
    let total = 0;
    for (const key of Object.values(KEYS)) {
      const val = localStorage.getItem(key);
      if (val) total += val.length * 2; // UTF-16
    }
    return Math.round(total / 1024);
  }

  function clearAllData() {
    for (const key of Object.values(KEYS)) {
      remove(key);
    }
  }

  return {
    // Settings
    getSettings,
    saveSettings,
    // Logs
    getLogs,
    saveLog,
    deleteLog,
    getLogsByDate,
    getLogsByMonth,
    getLoggedDates,
    // Plan
    getActivePlan,
    saveActivePlan,
    clearActivePlan,
    completePlanDay,
    // Layout
    getLayout,
    saveLayout,
    // PRs
    getPRs,
    checkAndUpdatePRs,
    clearPRs,
    // Body stats
    getBodyStats,
    saveBodyStat,
    deleteBodyStat,
    // Muscle status
    getMuscleStatus,
    saveMuscleStatus,
    clearMuscleStatus,
    // Muscle history
    getMuscleHistory,
    appendMuscleHistory,
    getInjuredDates,
    getMuscleHistoryByDate,
    // Custom exercises
    getCustomExercises,
    saveCustomExercise,
    deleteCustomExercise,
    // Goals
    getGoals,
    saveGoal,
    deleteGoal,
    checkGoalsProgress,
    // Utils
    getStorageUsageKB,
    clearAllData,
    KEYS,
  };
})();
