// WT.WorkoutLogger — Log today's workout session
window.WT = window.WT || {};

WT.WorkoutLogger = (function () {

  // ── State ──────────────────────────────────────────────────
  let _session    = null;   // current in-progress session
  let _container  = null;
  let _timerInt   = null;   // session elapsed timer interval
  let _restInt    = null;   // rest countdown interval
  let _restTotal  = 90;
  let _restLeft   = 0;

  // ── Public API ─────────────────────────────────────────────

  function render(containerEl) {
    _container = containerEl;
    containerEl.innerHTML = _buildHTML();
  }

  function afterRender(containerEl) {
    _container = containerEl;
    _bindEvents();

    // If there's an in-progress session load it
    const saved = _loadDraftSession();
    if (saved) {
      _session = saved;
      _renderSession();
      _startSessionTimer();
    }

    // Register drag-drop for exercise cards
    _registerDragDrop();
  }

  function destroy() {
    clearInterval(_timerInt);
    clearInterval(_restInt);
    _saveDraftSession();
    WT.DragDrop.unregisterZone(_container?.querySelector('#exercise-list'));
  }

  // ── HTML Builders ──────────────────────────────────────────

  function _buildHTML() {
    const today   = WT.App.todayStr();
    const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const activePlan = WT.Storage.getActivePlan();
    const planBanner = activePlan ? _buildPlanBanner(activePlan, today) : '';

    const injuryBanner = WT.MuscleStatus.buildInjuryBannerHTML();

    return `
      <div class="logger-view">
        ${injuryBanner}
        ${planBanner}

        <div class="session-header" id="session-header">
          <div>
            <div class="session-date">${dayName}, ${dateStr}</div>
            <div id="session-status" class="text-muted" style="font-size:0.8125rem;margin-top:2px;">No active session</div>
          </div>
          <div id="session-timer" class="session-timer hidden">00:00</div>
        </div>

        <!-- Exercise list (drag-reorderable) -->
        <div id="exercise-list" style="display:flex;flex-direction:column;gap:12px;"></div>

        <!-- Add exercise block -->
        <div id="add-exercise-block" class="card hidden">
          <div class="card-header">
            <span class="card-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Add Exercise
            </span>
            <button class="icon-btn" id="close-add-exercise">✕</button>
          </div>
          <div class="card-body" style="padding-top:8px;">
            <div class="search-wrap mb-3">
              <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input class="form-input" id="exercise-search" type="text" placeholder="Search exercises…" autocomplete="off" autocorrect="off" spellcheck="false">
            </div>
            <div id="exercise-results" class="exercise-search-results"></div>
            <div style="border-top:1px solid var(--border);padding:10px 0 2px;">
              <button class="btn btn-ghost btn-sm w-full" id="create-custom-ex-btn" style="justify-content:flex-start;gap:8px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Create custom exercise
              </button>
            </div>
          </div>
        </div>

        <!-- Session notes -->
        <div id="session-notes-block" class="hidden">
          <textarea class="form-textarea" id="session-notes-input" placeholder="Session notes (optional)…" rows="2"
            style="font-size:0.9375rem;"></textarea>
        </div>

        <!-- Session actions -->
        <div id="session-actions">
          <button class="btn btn-primary btn-block" id="start-session-btn" style="margin-bottom:8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Start Workout
          </button>
          <!-- Goal progress — shown when not in a session -->
          <div id="home-goals-wrapper" style="margin-top:20px;">
            ${WT.Goals ? WT.Goals.buildHomeProgressHTML() : ''}
          </div>
          <button class="btn btn-ghost btn-block hidden" id="add-exercise-btn">
            + Add Exercise
          </button>
          <button class="btn btn-success btn-block hidden" id="finish-session-btn" style="margin-top:8px;">
            ✓ Finish Workout
          </button>
          <button class="btn btn-ghost btn-sm btn-block hidden" id="cancel-session-btn"
            style="margin-top:4px;color:var(--danger);opacity:0.7;">
            Cancel Workout
          </button>
        </div>
      </div>

      <!-- Rest timer bar (fixed below header) -->
      <div class="rest-timer-bar hidden" id="rest-timer-bar">
        <div>
          <div style="font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);">Rest</div>
          <div class="rest-timer-display" id="rest-display">1:30</div>
        </div>
        <div class="rest-timer-progress">
          <div class="rest-timer-fill" id="rest-fill" style="width:100%"></div>
        </div>
        <button class="btn btn-sm btn-secondary" id="skip-rest-btn">Skip</button>
      </div>
    `;
  }

  function _buildPlanBanner(activePlan, today) {
    const planData = WT.Plans.getById(activePlan.planId);
    if (!planData) return '';
    const day = WT.Plans.getPlannedDayForDate(activePlan, today);
    if (!day || !day.exercises.length) return '';
    return `
      <div class="plan-banner">
        <div>
          <div class="plan-banner-text">📋 ${planData.name}</div>
          <div style="font-size:0.8125rem;color:var(--text-secondary);">Today: ${day.label}</div>
        </div>
        <button class="btn btn-sm btn-secondary" id="load-plan-day-btn">Load</button>
      </div>
    `;
  }

  function _buildExerciseCardHTML(exercise, exIndex) {
    const settings = WT.Storage.getSettings();
    const unit     = settings.weightUnit;

    const setsHTML = exercise.sets.map((set, si) => `
      <tr class="set-row ${set.done ? 'completed' : ''}" data-set="${si}">
        <td>${si + 1}</td>
        <td>
          <input class="set-input" type="number" min="0" max="999" inputmode="decimal"
            value="${set.reps || ''}" placeholder="0"
            data-field="reps" data-ex="${exIndex}" data-set="${si}"
            aria-label="Reps for set ${si + 1}">
        </td>
        <td>
          ${exercise.isBodyweight
            ? '<span class="text-muted" style="font-size:0.8125rem;">BW</span>'
            : `<input class="set-input" type="number" min="0" max="9999" step="2.5" inputmode="decimal"
                value="${set.weight || ''}" placeholder="0"
                data-field="weight" data-ex="${exIndex}" data-set="${si}"
                aria-label="Weight for set ${si + 1}">`
          }
        </td>
        <td>
          <button class="set-check-btn ${set.done ? 'done' : ''}" data-ex="${exIndex}" data-set="${si}" aria-label="Mark set done">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        </td>
        <td>
          <button class="set-delete-btn" data-ex="${exIndex}" data-set="${si}" aria-label="Delete set">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </td>
      </tr>
    `).join('');

    const muscleChips = exercise.muscleGroups.map((g) => {
      const groups = WT.Exercises.getMuscleGroups();
      return `<span class="muscle-chip">${groups[g] || g}</span>`;
    }).join('');

    return `
      <div class="exercise-card draggable" data-id="ex-${exIndex}" data-ex-index="${exIndex}">
        <div class="exercise-card-header">
          <span class="drag-handle" title="Drag to reorder">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="15" cy="5" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="15" cy="19" r="1.5"/></svg>
          </span>
          <span class="exercise-name">${exercise.name}</span>
          <button class="icon-btn" style="width:32px;height:32px;" data-remove-ex="${exIndex}" aria-label="Remove exercise">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
          </button>
        </div>
        <div class="muscle-chips">${muscleChips}</div>
        <table class="set-table">
          <thead>
            <tr>
              <th>Set</th>
              <th>Reps</th>
              <th>${exercise.isBodyweight ? 'BW' : unit.toUpperCase()}</th>
              <th>✓</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="sets-body-${exIndex}">${setsHTML}</tbody>
        </table>
        <div class="add-set-row">
          <button class="btn btn-ghost btn-sm" data-add-set="${exIndex}">+ Add Set</button>
        </div>
      </div>
    `;
  }

  // ── Event Binding ──────────────────────────────────────────

  function _bindEvents() {
    const c = _container;
    if (!c) return;

    c.addEventListener('click', _handleClick);
    c.addEventListener('input', _handleInput);
  }

  function _handleClick(e) {
    const t = e.target;

    // Start session (with pre-workout check-in if applicable)
    if (t.closest('#start-session-btn')) {
      if (WT.MuscleStatus.shouldShowCheckIn()) {
        WT.MuscleStatus.showCheckInModal({ onComplete: () => _startSession() });
      } else {
        _startSession();
      }
      return;
    }

    // Injury banner: check-in now (recovery due)
    if (t.closest('#injury-checkin-btn')) {
      WT.MuscleStatus.showCheckInModal({ isRecoveryCheckIn: true, onComplete: _reRenderView });
      return;
    }

    // Injury banner: early check-in
    if (t.closest('#injury-checkin-early-btn')) {
      WT.MuscleStatus.showCheckInModal({ isRecoveryCheckIn: true, onComplete: _reRenderView });
      return;
    }

    // Cancel workout (only when no exercises logged)
    if (t.closest('#cancel-session-btn')) {
      _cancelSession();
      return;
    }

    // Home screen: set new goal
    if (t.closest('#home-set-goal-btn')) {
      WT.Goals.showAddGoalModal(() => {
        render(_container);
        afterRender(_container);
      });
      return;
    }

    // Load plan day
    if (t.closest('#load-plan-day-btn')) { _loadPlanDay(); return; }

    // Show add exercise UI
    if (t.closest('#add-exercise-btn')) {
      _container.querySelector('#add-exercise-block').classList.remove('hidden');
      _container.querySelector('#exercise-search').focus();
      return;
    }

    // Create custom exercise
    if (t.closest('#create-custom-ex-btn')) {
      _showCreateCustomModal();
      return;
    }

    // Close add exercise
    if (t.closest('#close-add-exercise')) {
      _container.querySelector('#add-exercise-block').classList.add('hidden');
      return;
    }

    // Finish session
    if (t.closest('#finish-session-btn')) { _finishSession(); return; }

    // Add a set to an exercise
    const addSetBtn = t.closest('[data-add-set]');
    if (addSetBtn) { _addSet(parseInt(addSetBtn.dataset.addSet)); return; }

    // Mark set done (triggers rest timer)
    const checkBtn = t.closest('.set-check-btn');
    if (checkBtn) {
      const ei = parseInt(checkBtn.dataset.ex);
      const si = parseInt(checkBtn.dataset.set);
      _toggleSetDone(ei, si);
      return;
    }

    // Delete set
    const delSetBtn = t.closest('.set-delete-btn');
    if (delSetBtn) {
      const ei = parseInt(delSetBtn.dataset.ex);
      const si = parseInt(delSetBtn.dataset.set);
      _deleteSet(ei, si);
      return;
    }

    // Remove exercise
    const removeExBtn = t.closest('[data-remove-ex]');
    if (removeExBtn) {
      _removeExercise(parseInt(removeExBtn.dataset.removeEx));
      return;
    }

    // Select exercise from search results
    const resultItem = t.closest('.exercise-result-item');
    if (resultItem) {
      _addExercise(resultItem.dataset.exId);
      return;
    }

    // Skip rest timer
    if (t.closest('#skip-rest-btn')) { _stopRestTimer(); return; }
  }

  function _handleInput(e) {
    const t = e.target;

    // Exercise search
    if (t.id === 'exercise-search') {
      _renderExerciseResults(t.value);
      return;
    }

    // Session notes
    if (t.id === 'session-notes-input' && _session) {
      _session.notes = t.value;
      _saveDraftSession();
      return;
    }

    // Set reps/weight input
    if (t.dataset.field) {
      const ei = parseInt(t.dataset.ex);
      const si = parseInt(t.dataset.set);
      if (!_session || !_session.exercises[ei]) return;
      _session.exercises[ei].sets[si][t.dataset.field] = t.value ? parseFloat(t.value) : null;
      _saveDraftSession();
    }
  }

  // ── Session Management ─────────────────────────────────────

  function _startSession() {
    _session = {
      id:          WT.App.uuid(),
      date:        WT.App.todayStr(),
      startTime:   WT.App.timeStr(),
      endTime:     null,
      exercises:   [],
      notes:       '',
      planRef:     null,
    };
    _renderSession();
    _startSessionTimer();
    _saveDraftSession();
    WT.App.toast('Workout started!', 'success');
  }

  function _loadPlanDay() {
    if (!_session) _startSession();
    const activePlan = WT.Storage.getActivePlan();
    const today      = WT.App.todayStr();
    if (!activePlan) return;

    const day = WT.Plans.getPlannedDayForDate(activePlan, today);
    if (!day || !day.exercises.length) return;

    // Set rest timer to plan's recommended rest
    const planData = WT.Plans.getById(activePlan.planId);
    if (planData) _restTotal = planData.restSec || 90;

    // Filter out exercises that use injured muscle groups
    const { safe: safeExercises, skipped } = WT.MuscleStatus.filterExercises(day.exercises);
    if (skipped.length) {
      const names = skipped.map((s) => s.exercise.name).join(', ');
      WT.App.toast(`Skipped (injured): ${names}`, 'info');
    }

    safeExercises.forEach((ex) => {
      const exData = WT.Exercises.getById(ex.exerciseId);
      if (!exData) return;
      const sets = parseInt(ex.targetSets) || 3;
      const exercise = {
        id:           exData.id,
        name:         exData.name,
        muscleGroups: exData.muscleGroups,
        isBodyweight: exData.isBodyweight,
        sets:         Array.from({ length: sets }, () => ({ reps: null, weight: null, done: false })),
        planRef:      { exerciseId: ex.exerciseId, targetReps: ex.targetReps, restSec: ex.restSec },
      };
      _session.exercises.push(exercise);
    });
    _session.planRef = { planId: activePlan.planId };

    _renderSession();
    _saveDraftSession();

    const planBanner = _container.querySelector('.plan-banner');
    if (planBanner) planBanner.remove();

    WT.App.toast(`Loaded: ${day.label}`, 'info');
  }

  function _finishSession() {
    if (!_session || !_session.exercises.length) {
      WT.App.toast('Add at least one exercise first.', 'error');
      return;
    }
    _session.endTime = WT.App.timeStr();
    clearInterval(_timerInt);
    _stopRestTimer();

    // Capture notes from textarea before saving
    const notesInput = _container?.querySelector('#session-notes-input');
    if (notesInput) _session.notes = notesInput.value.trim();

    // Check for new PRs
    const newPRs = WT.Storage.checkAndUpdatePRs(_session);
    WT.Storage.saveLog(_session);
    _clearDraftSession();

    if (newPRs && newPRs.length) {
      setTimeout(() => {
        WT.App.toast(`🏆 New PR: ${newPRs.map((p) => p.exerciseName).join(', ')}!`, 'success');
      }, 600);
    }

    // Mark plan day completed
    const ap = WT.Storage.getActivePlan();
    if (ap && _session.planRef) {
      WT.Storage.completePlanDay(_session.date);
    }

    WT.App.toast('Workout saved! 💪', 'success');

    // Check if any strength goals were achieved with new PRs
    WT.Goals.checkAndNotify();

    // Reset UI
    _session = null;
    render(_container);
    afterRender(_container);
  }

  // ── Exercise & Set Actions ─────────────────────────────────

  function _addExercise(exId) {
    const exData = WT.Exercises.getById(exId);
    if (!exData || !_session) return;
    _session.exercises.push({
      id:           exData.id,
      name:         exData.name,
      muscleGroups: exData.muscleGroups,
      isBodyweight: exData.isBodyweight,
      sets:         [{ reps: null, weight: null, done: false }],
    });
    _container.querySelector('#add-exercise-block').classList.add('hidden');
    _container.querySelector('#exercise-search').value = '';
    _container.querySelector('#exercise-results').innerHTML = '';
    _renderExerciseList();
    _saveDraftSession();
  }

  function _removeExercise(exIndex) {
    if (!_session) return;
    _session.exercises.splice(exIndex, 1);
    _renderExerciseList();
    _saveDraftSession();
  }

  function _addSet(exIndex) {
    if (!_session || !_session.exercises[exIndex]) return;
    const sets = _session.exercises[exIndex].sets;
    const last = sets[sets.length - 1];
    sets.push({ reps: last?.reps || null, weight: last?.weight || null, done: false });
    _renderSetsBody(exIndex);
    _saveDraftSession();
  }

  function _deleteSet(exIndex, setIndex) {
    if (!_session || !_session.exercises[exIndex]) return;
    _session.exercises[exIndex].sets.splice(setIndex, 1);
    _renderSetsBody(exIndex);
    _saveDraftSession();
  }

  function _toggleSetDone(exIndex, setIndex) {
    if (!_session || !_session.exercises[exIndex]) return;
    const set = _session.exercises[exIndex].sets[setIndex];
    set.done = !set.done;
    _renderSetsBody(exIndex);
    _saveDraftSession();

    if (set.done) {
      // Get rest time: from exercise planRef if available, else plan default, else setting
      const ex          = _session.exercises[exIndex];
      const planRestSec = ex.planRef?.restSec;
      const planData    = _session.planRef ? WT.Plans.getById(_session.planRef.planId) : null;
      const restSec     = planRestSec || (planData?.restSec) || WT.Storage.getSettings().restTimerSec;
      _startRestTimer(restSec);
    }
  }

  // ── Rendering Helpers ──────────────────────────────────────

  function _renderSession() {
    const c = _container;
    c.querySelector('#session-status').textContent  = 'Session in progress';
    c.querySelector('#session-timer').classList.remove('hidden');
    c.querySelector('#session-notes-block').classList.remove('hidden');
    c.querySelector('#start-session-btn').classList.add('hidden');
    c.querySelector('#home-goals-wrapper')?.classList.add('hidden');
    c.querySelector('#add-exercise-btn').classList.remove('hidden');
    c.querySelector('#finish-session-btn').classList.remove('hidden');
    c.querySelector('#cancel-session-btn')?.classList.remove('hidden');

    // Restore notes if reloading draft
    const notesInput = c.querySelector('#session-notes-input');
    if (notesInput && _session?.notes) notesInput.value = _session.notes;

    // Recovery mode banner (if any muscles in recovery mode are in today's exercises)
    const recoveryMuscles = WT.MuscleStatus.getRecoveryModeMuslces();
    if (recoveryMuscles.length && _session?.exercises?.length) {
      const groups       = WT.Exercises.getMuscleGroups();
      const recovIds     = new Set(recoveryMuscles.map((m) => m.muscleId));
      const affectedExs  = (_session.exercises || [])
        .filter((ex) => (ex.muscleGroups || []).some((g) => recovIds.has(g)))
        .map((ex) => ex.name);
      if (affectedExs.length) {
        const existing = c.querySelector('#recovery-mode-banner');
        if (!existing) {
          const banner = document.createElement('div');
          banner.id    = 'recovery-mode-banner';
          banner.innerHTML = WT.MuscleStatus.buildRecoveryModeBannerHTML(affectedExs);
          const exList = c.querySelector('#exercise-list');
          if (exList) exList.insertAdjacentElement('beforebegin', banner);
        }
      }
    }

    _renderExerciseList();
  }

  function _renderExerciseList() {
    const list = _container.querySelector('#exercise-list');
    if (!_session) { list.innerHTML = ''; return; }
    list.innerHTML = _session.exercises
      .map((ex, i) => _buildExerciseCardHTML(ex, i))
      .join('');
    _registerDragDrop();
  }

  function _renderSetsBody(exIndex) {
    const body = _container.querySelector(`#sets-body-${exIndex}`);
    if (!body || !_session || !_session.exercises[exIndex]) return;
    const ex = _session.exercises[exIndex];
    body.innerHTML = ex.sets.map((set, si) => `
      <tr class="set-row ${set.done ? 'completed' : ''}" data-set="${si}">
        <td>${si + 1}</td>
        <td>
          <input class="set-input" type="number" min="0" max="999" inputmode="decimal"
            value="${set.reps != null ? set.reps : ''}" placeholder="0"
            data-field="reps" data-ex="${exIndex}" data-set="${si}">
        </td>
        <td>
          ${ex.isBodyweight
            ? '<span class="text-muted" style="font-size:0.8125rem;">BW</span>'
            : `<input class="set-input" type="number" min="0" max="9999" step="2.5" inputmode="decimal"
                value="${set.weight != null ? set.weight : ''}" placeholder="0"
                data-field="weight" data-ex="${exIndex}" data-set="${si}">`
          }
        </td>
        <td>
          <button class="set-check-btn ${set.done ? 'done' : ''}" data-ex="${exIndex}" data-set="${si}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
        </td>
        <td>
          <button class="set-delete-btn" data-ex="${exIndex}" data-set="${si}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </td>
      </tr>
    `).join('');
  }

  function _renderExerciseResults(query) {
    const results = WT.Exercises.search(query).slice(0, 20);
    const el = _container.querySelector('#exercise-results');
    if (!el) return;
    if (!results.length) {
      el.innerHTML = '<div style="padding:12px 16px;color:var(--text-muted);font-size:0.875rem;">No exercises found</div>';
      return;
    }
    el.innerHTML = results.map((ex) => `
      <div class="exercise-result-item" data-ex-id="${ex.id}">
        <div>
          <div class="exercise-result-name">
            ${ex.name}
            ${ex.isCustom ? '<span class="custom-ex-badge">Custom</span>' : ''}
          </div>
          <div class="exercise-result-groups">${WT.Exercises.formatMuscles(ex)}</div>
        </div>
        ${ex.isBodyweight ? '<span class="badge badge-muscle">BW</span>' : ''}
      </div>
    `).join('');
  }

  // ── Timers ─────────────────────────────────────────────────

  function _startSessionTimer() {
    const el = _container?.querySelector('#session-timer');
    if (!el) return;
    const startEpoch = _session._startEpoch || (_session._startEpoch = Date.now());
    clearInterval(_timerInt);
    _timerInt = setInterval(() => {
      const secs  = Math.floor((Date.now() - startEpoch) / 1000);
      const mm    = String(Math.floor(secs / 60)).padStart(2, '0');
      const ss    = String(secs % 60).padStart(2, '0');
      if (el) el.textContent = `${mm}:${ss}`;
    }, 1000);
  }

  function _startRestTimer(totalSec) {
    _restTotal = totalSec;
    _restLeft  = totalSec;
    clearInterval(_restInt);

    const bar     = document.getElementById('rest-timer-bar');
    const display = document.getElementById('rest-display');
    const fill    = document.getElementById('rest-fill');
    if (!bar) return;

    bar.classList.remove('hidden');
    _updateRestDisplay();

    _restInt = setInterval(() => {
      _restLeft--;
      _updateRestDisplay();
      if (_restLeft <= 0) {
        _stopRestTimer();
        bar.classList.add('pulse');
        setTimeout(() => bar?.classList.remove('pulse'), 2000);
        WT.App.toast('Rest over — next set!', 'info');
      }
    }, 1000);
  }

  function _stopRestTimer() {
    clearInterval(_restInt);
    const bar = document.getElementById('rest-timer-bar');
    if (bar) bar.classList.add('hidden');
  }

  function _updateRestDisplay() {
    const display = document.getElementById('rest-display');
    const fill    = document.getElementById('rest-fill');
    if (!display || !fill) return;
    const mm  = String(Math.floor(_restLeft / 60)).padStart(2, '0');
    const ss  = String(Math.max(0, _restLeft) % 60).padStart(2, '0');
    display.textContent = `${mm}:${ss}`;
    const pct = Math.max(0, (_restLeft / _restTotal) * 100);
    fill.style.width = pct + '%';
  }

  // ── Draft Session Persistence ─────────────────────────────

  function _saveDraftSession() {
    if (!_session) return;
    try { localStorage.setItem('wt_draftSession', JSON.stringify(_session)); } catch (e) {}
  }

  function _loadDraftSession() {
    try {
      const raw = localStorage.getItem('wt_draftSession');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function _clearDraftSession() {
    localStorage.removeItem('wt_draftSession');
  }

  // ── Cancel / Re-render ─────────────────────────────────────

  function _cancelSession() {
    if (_session?.exercises?.length > 0) {
      if (!confirm('Cancel workout? No exercises will be saved.')) return;
    }
    clearInterval(_timerInt);
    _stopRestTimer();
    _clearDraftSession();
    _session = null;
    render(_container);
    afterRender(_container);
  }

  function _reRenderView() {
    render(_container);
    afterRender(_container);
  }

  // ── Custom Exercise Creation ───────────────────────────────

  function _showCreateCustomModal() {
    const muscleGroups = WT.Exercises.getMuscleGroups();
    const muscleOptions = Object.entries(muscleGroups)
      .map(([id, label]) => `<option value="${id}">${label}</option>`)
      .join('');

    WT.App.showModal(`
      <div class="modal-handle"></div>
      <div class="modal-header">
        <h2>Custom Exercise</h2>
        <button class="icon-btn" onclick="WT.App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Exercise Name</label>
          <input class="form-input" id="custom-ex-name" type="text" placeholder="e.g. Zercher Squat" autocorrect="off">
        </div>
        <div class="form-group">
          <label class="form-label">Primary Muscle Groups</label>
          <select class="form-select" id="custom-ex-muscles" multiple style="height:120px;">
            ${muscleOptions}
          </select>
          <small style="color:var(--text-muted);">Hold Ctrl/Cmd or long-press to select multiple</small>
        </div>
        <div class="setting-row" style="padding:8px 0;margin-bottom:12px;">
          <span>Bodyweight exercise (no weight tracking)</span>
          <label style="cursor:pointer;display:flex;align-items:center;gap:6px;">
            <input type="checkbox" id="custom-ex-bw"> <span style="font-size:0.875rem;">Yes</span>
          </label>
        </div>
        <button class="btn btn-primary btn-block" id="save-custom-ex-btn">Add Exercise</button>
      </div>
    `);

    setTimeout(() => {
      const btn = document.getElementById('save-custom-ex-btn');
      if (!btn) return;
      btn.addEventListener('click', () => {
        const nameEl   = document.getElementById('custom-ex-name');
        const muscleEl = document.getElementById('custom-ex-muscles');
        const bwEl     = document.getElementById('custom-ex-bw');
        const name     = nameEl?.value.trim();
        if (!name) { WT.App.toast('Enter an exercise name.', 'error'); return; }

        const selectedMuscles = muscleEl
          ? [...muscleEl.selectedOptions].map((o) => o.value)
          : [];

        const ex = {
          id:           'custom_' + name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now(),
          name,
          muscleGroups: selectedMuscles.length ? selectedMuscles : ['full-body'],
          isBodyweight: bwEl?.checked || false,
          isCustom:     true,
        };

        WT.Storage.saveCustomExercise(ex);
        WT.App.closeModal();
        WT.App.toast(`"${name}" added to your exercises.`, 'success');

        // Auto-add to current session if one is active
        if (_session) {
          _addExercise(ex.id);
          _container.querySelector('#add-exercise-block')?.classList.add('hidden');
        }
      });
    }, 50);
  }

  // ── Drag-drop ──────────────────────────────────────────────

  function _registerDragDrop() {
    const list = _container?.querySelector('#exercise-list');
    if (!list) return;
    WT.DragDrop.unregisterZone(list);
    WT.DragDrop.registerZone(list, {
      selector:  '.exercise-card',
      handleSel: '.drag-handle',
      onReorder: (newOrder) => {
        if (!_session) return;
        const reordered = newOrder.map((id) => {
          const idx = parseInt(id.replace('ex-', ''));
          return _session.exercises[idx];
        }).filter(Boolean);
        _session.exercises = reordered;
        // Re-index data-id attributes
        list.querySelectorAll('.exercise-card').forEach((el, i) => {
          el.dataset.id       = `ex-${i}`;
          el.dataset.exIndex  = i;
        });
        _saveDraftSession();
      },
    });
  }

  return { render, afterRender, destroy };
})();
