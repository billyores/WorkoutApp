// WT.Goals — Goals: creation, tracking, plan recommendations, achievement
window.WT = window.WT || {};

WT.Goals = (function () {

  // Plan recommendations by goal type / direction
  const PLAN_RECS = {
    strength: [
      { id: 'stronglifts_5x5', name: 'StrongLifts 5×5',   reason: 'Progressive overload every session — best for raw strength gains' },
      { id: 'wendler_531',     name: 'Wendler 5/3/1',      reason: 'Proven long-term periodization for steady strength progress' },
    ],
    weight_lose: [
      { id: 'hiit_resistance',  name: 'HIIT + Resistance', reason: 'High intensity burns fat while preserving muscle' },
      { id: 'full_body_cardio', name: 'Full Body + Cardio', reason: 'Full body movements + cardio for maximum calorie burn' },
    ],
    weight_gain: [
      { id: 'ppl_volume',   name: 'PPL High Volume', reason: 'Push/Pull/Legs maximizes volume for muscle and weight gain' },
      { id: 'arnold_split', name: 'Arnold Split',    reason: 'Classic high-volume split for muscle mass and strength' },
    ],
    shred: [
      { id: 'ppl_volume',      name: 'PPL High Volume',    reason: 'High volume training keeps metabolism elevated' },
      { id: 'hiit_resistance', name: 'HIIT + Resistance',  reason: 'HIIT burns fat while building lean muscle definition' },
    ],
  };

  // ── Public: Build Goals Tab HTML ───────────────────────────

  function buildGoalsTabHTML() {
    const goals  = WT.Storage.getGoals();
    const active = goals.filter((g) => g.status === 'active');
    const done   = goals
      .filter((g) => g.status === 'completed')
      .sort((a, b) => (b.completedDate || '').localeCompare(a.completedDate || ''));

    const addBtn = `<button class="btn btn-primary" id="add-goal-btn" style="width:100%;">+ New Goal</button>`;

    if (!goals.length) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">🎯</div>
          <h3>No goals set</h3>
          <p>Set a goal to track your progress and get a workout plan recommendation.</p>
        </div>
        ${addBtn}
      `;
    }

    const activeHTML = active.length ? `
      <div>
        <div style="font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:8px;">Active Goals</div>
        <div style="display:flex;flex-direction:column;gap:10px;">
          ${active.map(_buildGoalCard).join('')}
        </div>
      </div>` : '';

    const doneHTML = done.length ? `
      <div>
        <div style="font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:8px;">Achieved 🏅</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${done.map(_buildCompletedGoalCard).join('')}
        </div>
      </div>` : '';

    return `
      <div style="display:flex;flex-direction:column;gap:16px;">
        ${activeHTML}
        ${doneHTML}
        ${addBtn}
      </div>
    `;
  }

  function _buildGoalCard(goal) {
    const { pct, startLabel, targetLabel, currentDetail } = _getProgress(goal);
    const typeIcon   = goal.type === 'strength' ? '💪' : goal.type === 'weight' ? '⚖️' : '🔥';
    const pctClamped = Math.min(100, Math.max(0, isFinite(pct) ? pct : 0));
    const barColor   = pctClamped >= 100 ? 'var(--success)' : pctClamped >= 60 ? 'var(--accent)' : 'var(--info)';

    const progressHTML = goal.type !== 'shred' ? `
      <div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;
          font-size:0.8125rem;color:var(--text-muted);margin-bottom:4px;">
          <span>${startLabel}</span>
          <span style="font-weight:700;color:var(--text-primary);">${Math.round(pctClamped)}%</span>
          <span>${targetLabel}</span>
        </div>
        <div style="background:var(--border);border-radius:var(--radius-full);height:8px;overflow:hidden;">
          <div style="height:100%;width:${pctClamped}%;background:${barColor};
            border-radius:var(--radius-full);transition:width 0.4s ease;"></div>
        </div>
        ${currentDetail ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:3px;">Current: <strong>${currentDetail}</strong></div>` : ''}
      </div>` : `
      <div style="font-size:0.875rem;color:var(--text-muted);margin-bottom:8px;">
        Started ${new Date(goal.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>`;

    const planChip = goal.recommendedPlanName ? `
      <div style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;
        background:var(--bg-elevated);border-radius:var(--radius-full);
        font-size:0.75rem;margin-top:4px;">
        <span style="color:var(--text-muted);">📋</span>
        <span style="font-weight:600;color:var(--accent);">${goal.recommendedPlanName}</span>
      </div>` : '';

    const dateChip = goal.targetDate ? `
      <div style="font-size:0.75rem;color:var(--text-muted);margin-top:5px;">
        🗓 Target: ${new Date(goal.targetDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>` : '';

    return `
      <div class="card">
        <div class="card-body" style="padding:14px 16px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
            <div>
              <div style="font-size:0.6875rem;text-transform:uppercase;letter-spacing:0.5px;
                color:var(--text-muted);margin-bottom:2px;">${typeIcon} ${_typeLabel(goal)}</div>
              <div style="font-weight:700;font-size:1rem;">${goal.title}</div>
            </div>
            <button class="icon-btn" style="width:28px;height:28px;flex-shrink:0;"
              data-delete-goal="${goal.id}" aria-label="Remove goal">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          ${progressHTML}
          ${planChip}
          ${dateChip}
        </div>
      </div>
    `;
  }

  function _buildCompletedGoalCard(goal) {
    const typeIcon  = goal.type === 'strength' ? '💪' : goal.type === 'weight' ? '⚖️' : '🔥';
    const dateLabel = goal.completedDate
      ? new Date(goal.completedDate + 'T00:00:00').toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        })
      : '';
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;
        padding:10px 14px;background:var(--bg-surface);border:1px solid var(--border);
        border-radius:var(--radius-md);">
        <div>
          <div style="font-size:0.6875rem;color:var(--text-muted);">${typeIcon} ${_typeLabel(goal)}</div>
          <div style="font-weight:600;">${goal.title}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;margin-left:12px;">
          <div style="color:var(--success);font-weight:700;font-size:0.875rem;">✅ Achieved</div>
          <div style="font-size:0.75rem;color:var(--text-muted);">${dateLabel}</div>
        </div>
      </div>
    `;
  }

  // ── Progress Calculation ───────────────────────────────────

  function _getProgress(goal) {
    const records   = WT.Storage.getPRs();
    const bodyStats = WT.Storage.getBodyStats();
    const unit      = goal.unit || WT.Storage.getSettings().weightUnit;

    if (goal.type === 'strength') {
      const pr      = goal.exerciseId ? records[goal.exerciseId] : null;
      const current = pr ? pr.maxWeight : (goal.startValue || 0);
      const start   = goal.startValue || 0;
      const target  = goal.targetWeight || 1;
      const range   = target - start;
      const pct     = range > 0 ? ((current - start) / range) * 100 : (current >= target ? 100 : 0);
      return {
        pct,
        startLabel:    `${start}${unit}`,
        targetLabel:   `${target}${unit}`,
        currentDetail: pr ? `${current}${unit}` : null,
      };
    }

    if (goal.type === 'weight') {
      const latest  = bodyStats.length ? bodyStats[bodyStats.length - 1].weight : null;
      const current = latest ?? (goal.startValue ?? 0);
      const start   = goal.startValue ?? current;
      const target  = goal.targetBodyWeight || 1;
      let pct;
      if (goal.weightDirection === 'lose') {
        const range = start - target;
        pct = range > 0 ? ((start - current) / range) * 100 : (current <= target ? 100 : 0);
      } else {
        const range = target - start;
        pct = range > 0 ? ((current - start) / range) * 100 : (current >= target ? 100 : 0);
      }
      return {
        pct,
        startLabel:    `${start}${unit}`,
        targetLabel:   `${target}${unit}`,
        currentDetail: latest != null ? `${latest}${unit}` : null,
      };
    }

    return { pct: 0, startLabel: '', targetLabel: '', currentDetail: null };
  }

  function _typeLabel(goal) {
    if (goal.type === 'strength') return 'Strength Goal';
    if (goal.type === 'weight')   return goal.weightDirection === 'lose' ? 'Weight Loss Goal' : 'Weight Gain Goal';
    return 'Shred Goal';
  }

  // ── Add Goal Modal ─────────────────────────────────────────

  function showAddGoalModal(onSaved) {
    WT.App.showModal(_buildAddGoalModalHTML(null, 'lose'));

    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    let selectedType      = null;
    let selectedDirection = 'lose';

    function handler(e) {
      const t = e.target;

      // Type selection → rebuild modal with selected type
      const typeBtn = t.closest('[data-goal-type]');
      if (typeBtn) {
        selectedType = typeBtn.dataset.goalType;
        document.getElementById('modal-container').innerHTML =
          _buildAddGoalModalHTML(selectedType, selectedDirection);
        return;
      }

      // Direction toggle → rebuild to update plan recs, preserve entered values
      const dirBtn = t.closest('[data-direction]');
      if (dirBtn && dirBtn.dataset.direction !== selectedDirection) {
        const prevWeight = document.getElementById('goal-target-body-weight')?.value;
        const prevDate   = document.getElementById('goal-target-date')?.value;
        selectedDirection = dirBtn.dataset.direction;
        document.getElementById('modal-container').innerHTML =
          _buildAddGoalModalHTML(selectedType, selectedDirection);
        const wEl = document.getElementById('goal-target-body-weight');
        const dEl = document.getElementById('goal-target-date');
        if (wEl && prevWeight) wEl.value = prevWeight;
        if (dEl && prevDate)   dEl.value = prevDate;
        return;
      }

      // Cancel
      if (t.closest('#goal-modal-cancel')) {
        WT.App.closeModal();
        overlay.removeEventListener('click', handler);
        return;
      }

      // Save
      if (t.closest('#goal-modal-save')) {
        const saved = _saveGoalFromModal(selectedType, selectedDirection);
        if (saved) {
          WT.App.closeModal();
          overlay.removeEventListener('click', handler);
          if (onSaved) onSaved(saved);
        }
        return;
      }
    }

    overlay.addEventListener('click', handler);
  }

  function _buildAddGoalModalHTML(type, direction) {
    const typeOptions = [
      { key: 'strength', icon: '💪', label: 'Strength',    sub: 'Hit a lifting milestone' },
      { key: 'weight',   icon: '⚖️', label: 'Body Weight', sub: 'Reach a target body weight' },
      { key: 'shred',    icon: '🔥', label: 'Shred',       sub: 'Get lean and defined' },
    ];

    const typeSelectorHTML = `
      <div style="margin-bottom:16px;">
        <div style="font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;
          color:var(--text-muted);margin-bottom:8px;">Goal Type</div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${typeOptions.map((opt) => `
            <button class="goal-type-btn${type === opt.key ? ' active' : ''}"
              data-goal-type="${opt.key}">
              <span style="font-size:1.375rem;line-height:1;">${opt.icon}</span>
              <div style="text-align:left;">
                <div style="font-weight:700;font-size:0.9375rem;">${opt.label}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);">${opt.sub}</div>
              </div>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    const fields  = type ? _buildGoalFields(type, direction) : '';
    const saveBtn = type
      ? `<button class="btn btn-primary" id="goal-modal-save" style="width:100%;margin-top:4px;">Save Goal</button>`
      : '';

    return `
      <div class="modal-sheet">
        <div class="modal-sheet-header">
          <span class="modal-sheet-title">New Goal</span>
          <button class="icon-btn" id="goal-modal-cancel">✕</button>
        </div>
        <div class="modal-sheet-body">
          ${typeSelectorHTML}
          ${fields}
          ${saveBtn}
        </div>
      </div>
    `;
  }

  function _buildGoalFields(type, direction) {
    const unit  = WT.Storage.getSettings().weightUnit;
    const today = WT.App.todayStr();

    if (type === 'strength') {
      const exes = WT.Exercises.getAll().filter((e) => !e.isBodyweight);
      return `
        <div class="form-group">
          <label class="form-label">Exercise</label>
          <select class="form-select" id="goal-exercise">
            <option value="">Select exercise…</option>
            ${exes.map((e) => `<option value="${e.id}">${e.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Target Weight (${unit})</label>
          <input class="form-input" type="number" id="goal-target-weight"
            min="1" step="5" inputmode="decimal" placeholder="e.g. 225">
        </div>
        <div class="form-group">
          <label class="form-label">Target Date (optional)</label>
          <input class="form-input" type="date" id="goal-target-date" min="${today}">
        </div>
        ${_buildPlanRecsHTML(PLAN_RECS.strength)}
      `;
    }

    if (type === 'weight') {
      const recs = PLAN_RECS[`weight_${direction}`];
      return `
        <div class="form-group">
          <label class="form-label">Direction</label>
          <div class="toggle-group">
            <button class="toggle-btn${direction === 'lose' ? ' active' : ''}" data-direction="lose">Lose Weight</button>
            <button class="toggle-btn${direction === 'gain' ? ' active' : ''}" data-direction="gain">Gain Weight</button>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Target Weight (${unit})</label>
          <input class="form-input" type="number" id="goal-target-body-weight"
            min="1" step="0.5" inputmode="decimal"
            placeholder="${direction === 'lose' ? 'e.g. 185' : 'e.g. 200'}">
        </div>
        <div class="form-group">
          <label class="form-label">Target Date (optional)</label>
          <input class="form-input" type="date" id="goal-target-date" min="${today}">
        </div>
        ${_buildPlanRecsHTML(recs)}
      `;
    }

    // Shred
    return `
      <div class="form-group">
        <label class="form-label">Description (optional)</label>
        <input class="form-input" type="text" id="goal-shred-desc"
          placeholder="e.g. Get shredded for summer">
      </div>
      <div class="form-group">
        <label class="form-label">Target Date (optional)</label>
        <input class="form-input" type="date" id="goal-target-date" min="${today}">
      </div>
      ${_buildPlanRecsHTML(PLAN_RECS.shred)}
    `;
  }

  function _buildPlanRecsHTML(recs) {
    if (!recs || !recs.length) return '';
    const options = [
      ...recs,
      { id: '', name: 'No plan', reason: 'Track this goal without activating a plan' },
    ];
    return `
      <div style="margin-bottom:4px;">
        <div style="font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;
          color:var(--text-muted);margin-bottom:8px;">Recommended Plan</div>
        ${options.map((r, i) => `
          <label style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;
            background:var(--bg-elevated);border-radius:var(--radius-md);
            margin-bottom:6px;cursor:pointer;
            border:1px solid ${i === 0 ? 'var(--accent)' : 'var(--border)'};">
            <input type="radio" name="goal-plan-rec" value="${r.id}" ${i === 0 ? 'checked' : ''}
              style="margin-top:3px;accent-color:var(--accent);">
            <div>
              <div style="font-weight:600;font-size:0.875rem;">${r.name}</div>
              <div style="font-size:0.75rem;color:var(--text-muted);">${r.reason}</div>
            </div>
          </label>
        `).join('')}
      </div>
    `;
  }

  function _saveGoalFromModal(type, direction) {
    if (!type) {
      WT.App.toast('Select a goal type first.', 'error');
      return null;
    }

    const today = WT.App.todayStr();
    const unit  = WT.Storage.getSettings().weightUnit;

    const goal = {
      id:                  WT.App.uuid(),
      type,
      status:              'active',
      startDate:           today,
      unit,
      targetDate:          document.getElementById('goal-target-date')?.value || null,
      completedDate:       null,
      recommendedPlanId:   null,
      recommendedPlanName: null,
    };

    // Plan selection
    const planRadio = document.querySelector('input[name="goal-plan-rec"]:checked');
    const planId    = planRadio ? planRadio.value : '';
    if (planId) {
      goal.recommendedPlanId   = planId;
      goal.recommendedPlanName = WT.Plans.getById(planId)?.name || planId;
    }

    if (type === 'strength') {
      const exId   = document.getElementById('goal-exercise')?.value;
      const weight = parseFloat(document.getElementById('goal-target-weight')?.value);
      if (!exId)                    { WT.App.toast('Select an exercise.', 'error');      return null; }
      if (!weight || weight <= 0)   { WT.App.toast('Enter a target weight.', 'error');   return null; }
      const pr = WT.Storage.getPRs()[exId];
      goal.exerciseId   = exId;
      goal.exerciseName = WT.Exercises.getById(exId)?.name || exId;
      goal.targetWeight = weight;
      goal.startValue   = pr ? pr.maxWeight : 0;
      goal.title = `${goal.exerciseName} ${weight}${unit}`;
    }

    else if (type === 'weight') {
      const weight = parseFloat(document.getElementById('goal-target-body-weight')?.value);
      if (!weight || weight <= 0) { WT.App.toast('Enter a target weight.', 'error'); return null; }
      const stats = WT.Storage.getBodyStats();
      goal.targetBodyWeight = weight;
      goal.weightDirection  = direction;
      goal.startValue       = stats.length ? stats[stats.length - 1].weight : null;
      goal.title = direction === 'lose'
        ? `Lose weight to ${weight}${unit}`
        : `Gain weight to ${weight}${unit}`;
    }

    else if (type === 'shred') {
      goal.description = document.getElementById('goal-shred-desc')?.value.trim() || 'Get shredded';
      goal.title       = goal.description;
    }

    // Activate plan if one was selected
    if (planId) {
      const existing = WT.Storage.getActivePlan();
      if (!existing || existing.planId !== planId) {
        WT.Storage.saveActivePlan({ planId, startDate: today, completedDays: [] });
        WT.App.toast(`Plan activated: ${goal.recommendedPlanName}`, 'success');
      }
    }

    WT.Storage.saveGoal(goal);
    WT.App.toast('Goal saved! 🎯', 'success');
    return goal;
  }

  // ── Achievement Modal ──────────────────────────────────────

  function showAchievementModal(goals) {
    if (!goals.length) return;
    const goal = goals[0];

    WT.App.showModal(`
      <div class="modal-sheet">
        <div class="modal-sheet-header">
          <span class="modal-sheet-title">Goal Achieved! 🎉</span>
          <button class="icon-btn" id="achievement-close">✕</button>
        </div>
        <div class="modal-sheet-body" style="text-align:center;padding:24px 20px;">
          <div style="font-size:3.5rem;margin-bottom:14px;">🏅</div>
          <div style="font-size:1.25rem;font-weight:800;margin-bottom:6px;">${goal.title}</div>
          <div style="font-size:0.9375rem;color:var(--text-muted);margin-bottom:28px;">
            You crushed it! Ready to set your next challenge?
          </div>
          <button class="btn btn-primary" id="achievement-next" style="width:100%;margin-bottom:10px;">
            Set Next Goal 🎯
          </button>
          <button class="btn btn-secondary" id="achievement-later" style="width:100%;">
            Celebrate Later
          </button>
        </div>
      </div>
    `);

    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    function handler(e) {
      const t = e.target;
      if (t.closest('#achievement-close') || t.closest('#achievement-later')) {
        WT.App.closeModal();
        overlay.removeEventListener('click', handler);
        return;
      }
      if (t.closest('#achievement-next')) {
        WT.App.closeModal();
        overlay.removeEventListener('click', handler);
        setTimeout(() => showAddGoalModal(null), 200);
        return;
      }
    }

    overlay.addEventListener('click', handler);
  }

  // ── Check & Notify ─────────────────────────────────────────
  // Call after saving a workout or body stat

  function checkAndNotify() {
    const completed = WT.Storage.checkGoalsProgress();
    if (completed.length) {
      setTimeout(() => showAchievementModal(completed), 900);
    }
  }

  // ── Home Screen Progress Section ───────────────────────────
  // Compact goal cards shown on the Home tab below Start Workout

  function buildHomeProgressHTML() {
    const goals  = WT.Storage.getGoals();
    const active = goals.filter((g) => g.status === 'active');

    const header = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span style="font-size:0.6875rem;font-weight:700;text-transform:uppercase;
          letter-spacing:0.5px;color:var(--text-muted);">Your Goals</span>
        <button class="btn btn-ghost btn-sm" id="home-set-goal-btn"
          style="font-size:0.75rem;padding:3px 10px;">+ New Goal</button>
      </div>
    `;

    if (!active.length) {
      return `
        <div id="home-goals">
          ${header}
          <div style="text-align:center;padding:20px 16px;background:var(--bg-surface);
            border:1px solid var(--border);border-radius:var(--radius-lg);">
            <div style="font-size:1.75rem;margin-bottom:8px;">🎯</div>
            <div style="font-size:0.875rem;color:var(--text-muted);">No active goals yet.</div>
            <div style="font-size:0.8125rem;color:var(--text-muted);margin-top:4px;">
              Set a goal and track your progress right here.
            </div>
          </div>
        </div>
      `;
    }

    const cardsHTML = active.map((goal) => {
      const { pct, startLabel, targetLabel, currentDetail } = _getProgress(goal);
      const typeIcon   = goal.type === 'strength' ? '💪' : goal.type === 'weight' ? '⚖️' : '🔥';
      const pctClamped = Math.min(100, Math.max(0, isFinite(pct) ? pct : 0));
      const barColor   = pctClamped >= 100 ? 'var(--success)' : pctClamped >= 60 ? 'var(--accent)' : 'var(--info)';

      let progressHTML;
      if (goal.type === 'shred') {
        // No numeric progress — show days active + target date if set
        const daysSince = Math.floor(
          (new Date() - new Date(goal.startDate + 'T00:00:00')) / 86400000
        );
        const targetStr = goal.targetDate
          ? ` · Target: ${new Date(goal.targetDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          : '';
        progressHTML = `
          <div style="font-size:0.8125rem;color:var(--text-muted);">
            ${daysSince} day${daysSince !== 1 ? 's' : ''} in${targetStr} 🔥
          </div>`;
      } else {
        progressHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;
            font-size:0.75rem;color:var(--text-muted);margin-bottom:3px;">
            <span>${startLabel}</span>
            <span style="font-weight:700;color:var(--text-primary);">${Math.round(pctClamped)}%</span>
            <span>${targetLabel}</span>
          </div>
          <div style="background:var(--border);border-radius:var(--radius-full);height:8px;overflow:hidden;">
            <div style="height:100%;width:${pctClamped}%;background:${barColor};
              border-radius:var(--radius-full);transition:width 0.4s ease;"></div>
          </div>
          ${currentDetail ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:3px;">Current: <strong>${currentDetail}</strong></div>` : ''}
        `;
      }

      return `
        <div class="card" style="margin-bottom:8px;">
          <div class="card-body" style="padding:12px 14px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
              <div>
                <div style="font-size:0.6875rem;text-transform:uppercase;letter-spacing:0.5px;
                  color:var(--text-muted);">${typeIcon} ${_typeLabel(goal)}</div>
                <div style="font-weight:700;font-size:0.9375rem;">${goal.title}</div>
              </div>
              ${goal.recommendedPlanName ? `
                <span style="font-size:0.6875rem;color:var(--accent);font-weight:600;
                  background:var(--bg-elevated);padding:2px 7px;border-radius:var(--radius-full);
                  white-space:nowrap;margin-left:8px;">${goal.recommendedPlanName}</span>
              ` : ''}
            </div>
            ${progressHTML}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div id="home-goals">
        ${header}
        ${cardsHTML}
      </div>
    `;
  }

  return {
    buildGoalsTabHTML,
    buildHomeProgressHTML,
    showAddGoalModal,
    showAchievementModal,
    checkAndNotify,
  };

})();
