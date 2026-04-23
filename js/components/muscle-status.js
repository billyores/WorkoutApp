// WT.MuscleStatus — Muscle soreness tracking and injury management
// Pre-workout check-in, injury banner, recovery flow
window.WT = window.WT || {};

WT.MuscleStatus = (function () {

  // ── Constants ──────────────────────────────────────────────

  const STATUS_LEVELS = [
    { score: 0, key: 'good',    label: 'Feeling Good',  shortLabel: 'Good',    emoji: '🟢', color: 'var(--success)' },
    { score: 1, key: 'sore-1',  label: 'Mild Soreness', shortLabel: 'Mild',    emoji: '🟡', color: 'var(--warning)' },
    { score: 2, key: 'sore-2',  label: 'Very Sore',     shortLabel: 'Sore',    emoji: '🟠', color: '#f97316'        },
    { score: 3, key: 'injured', label: 'Injured',       shortLabel: 'Injured', emoji: '🔴', color: 'var(--danger)'  },
  ];

  const RECOVERY_DAYS = 7;

  // Muscles shown by default (major groups)
  const DEFAULT_MUSCLES = [
    'chest', 'back', 'shoulders', 'biceps', 'triceps',
    'quads', 'hamstrings', 'glutes', 'core', 'calves',
  ];

  // ── Public API ─────────────────────────────────────────────

  // Returns true when the check-in prompt should be shown
  function shouldShowCheckIn() {
    const logs = WT.Storage.getLogs();
    if (!logs.length) return false;           // skip on very first workout
    const statuses = WT.Storage.getMuscleStatus();
    // Always show if anything is currently non-good
    const hasNonGood = Object.values(statuses).some((s) => s.score > 0);
    return true; // show every time after first session (quick habit)
  }

  // Returns muscle groups that are currently injured
  function getInjuredMuscles() {
    const statuses = WT.Storage.getMuscleStatus();
    return Object.values(statuses).filter((s) => s.score === 3);
  }

  // Returns muscles that have passed their recovery date and need check-in
  function getRecoveryDueMuslces() {
    const today    = WT.App.todayStr();
    const statuses = WT.Storage.getMuscleStatus();
    return Object.values(statuses).filter(
      (s) => s.score === 3 && s.recoveryDate && s.recoveryDate <= today
    );
  }

  // Returns muscles in recovery mode (recently cleared from injury, need light weight)
  function getRecoveryModeMuslces() {
    const statuses = WT.Storage.getMuscleStatus();
    return Object.values(statuses).filter((s) => s.recoveryMode);
  }

  // Returns ids of all currently injured muscles (for exercise filtering)
  function getInjuredMuscleIds() {
    return getInjuredMuscles().map((s) => s.muscleId);
  }

  // Filter a list of exercises to remove any that use injured muscle groups
  // Returns { safe: Exercise[], skipped: { exercise, reason }[] }
  function filterExercises(exercises) {
    const injuredIds = getInjuredMuscleIds();
    if (!injuredIds.length) return { safe: exercises, skipped: [] };

    const safe    = [];
    const skipped = [];
    const groups  = WT.Exercises.getMuscleGroups();

    exercises.forEach((ex) => {
      const exData     = WT.Exercises.getById(ex.exerciseId) || { muscleGroups: [] };
      const hitInjured = exData.muscleGroups.filter((g) => injuredIds.includes(g));
      if (hitInjured.length) {
        skipped.push({
          exercise: ex,
          reason: hitInjured.map((g) => groups[g] || g).join(', '),
        });
      } else {
        safe.push(ex);
      }
    });
    return { safe, skipped };
  }

  // ── Banner HTML ────────────────────────────────────────────

  function buildInjuryBannerHTML() {
    const injured  = getInjuredMuscles();
    const recovery = getRecoveryDueMuslces();
    const groups   = WT.Exercises.getMuscleGroups();

    if (!injured.length) return '';

    const recoveryDue = recovery.length > 0;
    const injuredList = injured.map((s) => groups[s.muscleId] || s.muscleId).join(', ');

    return `
      <div class="injury-banner" id="injury-banner">
        <div style="display:flex;align-items:center;gap:6px;min-width:0;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--danger)" flex-shrink="0"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
          <span style="font-size:0.8125rem;font-weight:700;color:var(--danger);white-space:nowrap;">Injured:</span>
          <span style="font-size:0.8125rem;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${injuredList}</span>
          ${recoveryDue ? '<span style="font-size:0.75rem;color:var(--warning);white-space:nowrap;">⏰ Check-in due</span>' : ''}
        </div>
        ${recoveryDue
          ? `<button class="btn btn-sm btn-primary" id="injury-checkin-btn" style="flex-shrink:0;">Check In</button>`
          : `<button class="btn btn-sm btn-ghost" id="injury-checkin-early-btn" style="flex-shrink:0;color:var(--danger);">Feel better?</button>`
        }
      </div>
    `;
  }

  function buildRecoveryModeBannerHTML(exerciseNames) {
    if (!exerciseNames.length) return '';
    return `
      <div class="injury-checkin" style="margin-bottom:0;">
        <div>
          <div style="font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--warning);margin-bottom:2px;">💚 Recovery Mode</div>
          <div style="font-size:0.875rem;color:var(--text-secondary);">
            First session back. Try <strong>~50% of your previous weight</strong> for: ${exerciseNames.join(', ')}
          </div>
        </div>
      </div>
    `;
  }

  // ── Check-In Modal ─────────────────────────────────────────

  // Show the pre-workout check-in modal
  // onComplete(updatedStatuses) is called when user taps Start or Skip
  function showCheckInModal(options = {}) {
    const { isRecoveryCheckIn = false, onComplete = () => {} } = options;

    const musclesToShow = _getMusclesForCheckIn();
    const statuses      = WT.Storage.getMuscleStatus();
    const groups        = WT.Exercises.getMuscleGroups();

    // Build temporary state object for the modal (before saving)
    const tempState = {};
    musclesToShow.forEach((mid) => {
      tempState[mid] = statuses[mid]?.score ?? 0;
    });

    const title = isRecoveryCheckIn
      ? '🏥 Recovery Check-In'
      : '💪 How Are You Feeling?';
    const subtitle = isRecoveryCheckIn
      ? 'Your recovery period has ended. How do these muscles feel?'
      : 'Rate how each muscle feels before starting.';

    WT.App.showModal(`
      <div class="modal-handle"></div>
      <div class="modal-header" style="padding-bottom:4px;">
        <div>
          <h2>${title}</h2>
          <p style="font-size:0.8125rem;margin-top:2px;">${subtitle}</p>
        </div>
      </div>
      <div class="modal-body">
        <div id="checkin-grid" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
          ${musclesToShow.map((mid) => _buildMuscleCheckInRow(mid, tempState[mid], groups)).join('')}
        </div>
        <div id="checkin-all-toggle" style="text-align:center;margin-bottom:12px;">
          <button class="btn btn-ghost btn-sm" id="show-all-muscles-btn" style="font-size:0.8125rem;">
            + Check other muscle groups
          </button>
        </div>
        <div id="checkin-extra-muscles" style="display:none;flex-direction:column;gap:8px;margin-bottom:12px;"></div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary btn-block" id="checkin-start-btn">
            ${isRecoveryCheckIn ? 'Save & Continue' : 'Start Workout'}
          </button>
          ${!isRecoveryCheckIn
            ? `<button class="btn btn-ghost" id="checkin-skip-btn" style="flex:0 0 64px;font-size:0.8125rem;">Skip</button>`
            : ''}
        </div>
        <div id="checkin-status-legend" style="margin-top:12px;">
          ${STATUS_LEVELS.map((lvl) => `
            <div style="display:flex;align-items:center;gap:6px;font-size:0.75rem;color:var(--text-muted);margin-bottom:3px;">
              <span>${lvl.emoji}</span>
              <span><strong>${lvl.score}</strong> — ${lvl.label}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `);

    // Bind events
    setTimeout(() => {
      const grid = document.getElementById('checkin-grid');
      if (!grid) return;

      // Tap to cycle muscle status
      grid.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-muscle-btn]');
        if (!btn) return;
        const mid    = btn.dataset.muscleBtn;
        if (!mid) return;
        const current = tempState[mid] ?? 0;
        tempState[mid] = (current + 1) % STATUS_LEVELS.length;
        _updateMuscleBtn(btn, tempState[mid]);
      });

      // Show all muscles
      const showAllBtn = document.getElementById('show-all-muscles-btn');
      if (showAllBtn) {
        showAllBtn.addEventListener('click', () => {
          const extraContainer = document.getElementById('checkin-extra-muscles');
          if (!extraContainer) return;
          const shown = new Set(musclesToShow);
          const allGroups = Object.keys(groups).filter((g) => !shown.has(g));
          allGroups.forEach((mid) => {
            if (!tempState[mid]) tempState[mid] = 0;
          });
          extraContainer.innerHTML = allGroups.map((mid) =>
            _buildMuscleCheckInRow(mid, tempState[mid] ?? 0, groups)
          ).join('');
          extraContainer.style.display = 'flex';
          extraContainer.style.flexDirection = 'column';
          showAllBtn.parentElement.style.display = 'none';

          // Bind click for extra muscles too
          extraContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-muscle-btn]');
            if (!btn) return;
            const mid = btn.dataset.muscleBtn;
            if (!mid) return;
            const current = tempState[mid] ?? 0;
            tempState[mid] = (current + 1) % STATUS_LEVELS.length;
            _updateMuscleBtn(btn, tempState[mid]);
          });
        });
      }

      // Start workout
      const startBtn = document.getElementById('checkin-start-btn');
      if (startBtn) {
        startBtn.addEventListener('click', () => {
          _saveCheckIn(tempState, isRecoveryCheckIn);
          WT.App.closeModal();
          onComplete(tempState);
        });
      }

      // Skip
      const skipBtn = document.getElementById('checkin-skip-btn');
      if (skipBtn) {
        skipBtn.addEventListener('click', () => {
          WT.App.closeModal();
          onComplete(null); // null = skipped
        });
      }
    }, 50);
  }

  function _buildMuscleCheckInRow(mid, score, groups) {
    const lvl   = STATUS_LEVELS[score] || STATUS_LEVELS[0];
    const label = groups[mid] || mid;
    return `
      <div class="muscle-checkin-row" data-muscle-btn="${mid}"
        style="display:flex;align-items:center;justify-content:space-between;
               padding:10px 14px;border-radius:var(--radius-md);cursor:pointer;
               background:var(--bg-surface);border:2px solid var(--border);
               transition:all 0.15s ease;"
        data-score="${score}">
        <span style="font-weight:600;font-size:0.9375rem;">${label}</span>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:0.8125rem;font-weight:600;color:${lvl.color};">${lvl.shortLabel}</span>
          <span style="font-size:1.1rem;">${lvl.emoji}</span>
          <span style="font-size:0.75rem;color:var(--text-muted);">tap to change</span>
        </div>
      </div>
    `;
  }

  function _updateMuscleBtn(btn, newScore) {
    const lvl = STATUS_LEVELS[newScore] || STATUS_LEVELS[0];
    btn.dataset.score = newScore;

    // Update border color
    const borderMap = {
      0: 'var(--border)',
      1: '#ca8a04',
      2: '#ea580c',
      3: '#dc2626',
    };
    btn.style.borderColor = borderMap[newScore] || 'var(--border)';

    // Update label and emoji inside the row
    const statusDiv = btn.querySelector('div');
    if (statusDiv) {
      statusDiv.innerHTML = `
        <span style="font-size:0.8125rem;font-weight:600;color:${lvl.color};">${lvl.shortLabel}</span>
        <span style="font-size:1.1rem;">${lvl.emoji}</span>
        <span style="font-size:0.75rem;color:var(--text-muted);">tap to change</span>
      `;
    }
  }

  // Save check-in results to storage and append to history
  function _saveCheckIn(tempState, isRecoveryCheckIn) {
    const today    = WT.App.todayStr();
    const existing = WT.Storage.getMuscleStatus();
    const groups   = WT.Exercises.getMuscleGroups();

    Object.entries(tempState).forEach(([mid, score]) => {
      const prev     = existing[mid];
      const wasInj   = prev?.score === 3;
      const isInj    = score === 3;
      const wasRecov = prev?.recoveryMode;

      const entry = {
        muscleId:     mid,
        score,
        key:          STATUS_LEVELS[score]?.key    || 'good',
        label:        STATUS_LEVELS[score]?.label  || 'Feeling Good',
        lastUpdated:  today,
        injuredDate:  isInj ? (prev?.injuredDate || today) : null,
        recoveryDate: isInj ? (prev?.recoveryDate || _addDays(today, RECOVERY_DAYS)) : null,
        // Recovery mode: was injured, now marking good for the first time
        recoveryMode: wasInj && !isInj && score === 0 ? true : (wasRecov && score === 0 ? false : false),
      };

      // If recovery check-in and they cleared an injury: set recovery mode
      if (isRecoveryCheckIn && wasInj && score < 3) {
        entry.recoveryMode = score === 0;
        // Still sore after recovery date → extend recovery by 3 more days
        if (score > 0) {
          entry.score       = score;
          entry.injuredDate = prev?.injuredDate || today;
          entry.recoveryDate = _addDays(today, 3);
        }
      }

      WT.Storage.saveMuscleStatus(mid, entry);

      // Append to history (only if score > 0 or was previously non-good — always record transitions)
      const prevScore = existing[mid]?.score ?? 0;
      if (score > 0 || prevScore > 0) {
        WT.Storage.appendMuscleHistory({
          date:        today,
          muscleId:    mid,
          muscleName:  groups[mid] || mid,
          score,
          key:         STATUS_LEVELS[score]?.key   || 'good',
          label:       STATUS_LEVELS[score]?.label || 'Feeling Good',
        });
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────

  // Which muscles to show in check-in (recently worked + currently non-good + defaults)
  function _getMusclesForCheckIn() {
    const recentMuscles = _getRecentlyWorkedMuscles(2);
    const nonGoodMuscles = Object.keys(WT.Storage.getMuscleStatus())
      .filter((mid) => (WT.Storage.getMuscleStatus()[mid]?.score ?? 0) > 0);

    const combined = new Set([...recentMuscles, ...nonGoodMuscles]);

    // Fill up to at least 4 with defaults if needed
    if (combined.size < 4) {
      DEFAULT_MUSCLES.forEach((m) => { if (combined.size < 6) combined.add(m); });
    }

    return [...combined];
  }

  // Get muscle groups worked in the last N sessions
  function _getRecentlyWorkedMuscles(sessionCount) {
    const logs = WT.Storage.getLogs().slice(-sessionCount);
    const muscles = new Set();
    logs.forEach((log) => {
      (log.exercises || []).forEach((ex) => {
        (ex.muscleGroups || []).forEach((g) => muscles.add(g));
      });
    });
    return [...muscles];
  }

  function _addDays(dateStr, n) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function _daysUntil(dateStr) {
    if (!dateStr) return 0;
    const today  = new Date(WT.App.todayStr() + 'T00:00:00');
    const target = new Date(dateStr + 'T00:00:00');
    return Math.round((target - today) / 86400000);
  }

  return {
    shouldShowCheckIn,
    showCheckInModal,
    getInjuredMuscles,
    getInjuredMuscleIds,
    getRecoveryDueMuslces,
    getRecoveryModeMuslces,
    filterExercises,
    buildInjuryBannerHTML,
    buildRecoveryModeBannerHTML,
    STATUS_LEVELS,
  };
})();
