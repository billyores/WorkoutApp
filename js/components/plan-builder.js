// WT.PlanBuilder — Browse and activate workout plan templates
window.WT = window.WT || {};

WT.PlanBuilder = (function () {

  let _container   = null;
  let _activeGoal  = 'strength';
  let _expandedId  = null;

  // ── Public API ─────────────────────────────────────────────

  function render(containerEl) {
    _container = containerEl;
    containerEl.innerHTML = _buildHTML();
  }

  function afterRender(containerEl) {
    _container = containerEl;
    _bindEvents();
  }

  function destroy() {
    _container = null;
  }

  // ── HTML Builders ──────────────────────────────────────────

  function _buildHTML() {
    const activePlan = WT.Storage.getActivePlan();

    return `
      <div class="plans-view">
        ${activePlan ? _buildActivePlanCard(activePlan) : ''}
        <div class="goal-tabs" id="goal-tabs" role="tablist">
          ${WT.Plans.getGoals().map((g) => `
            <button class="goal-tab ${_activeGoal === g.id ? 'active' : ''}"
              data-goal="${g.id}" role="tab" aria-selected="${_activeGoal === g.id}">
              ${g.emoji} ${g.label}
            </button>
          `).join('')}
        </div>
        <div id="plan-list">
          ${_buildPlanList(_activeGoal)}
        </div>
      </div>
    `;
  }

  function _buildActivePlanCard(activePlan) {
    const planData = WT.Plans.getById(activePlan.planId);
    if (!planData) return '';

    const startDate     = new Date(activePlan.startDate + 'T00:00:00');
    const today         = new Date(WT.App.todayStr() + 'T00:00:00');
    const diffDays      = Math.max(0, Math.round((today - startDate) / 86400000));
    const totalDays     = planData.durationWeeks * 7;
    const pct           = Math.min(100, Math.round((diffDays / totalDays) * 100));
    const completedDays = (activePlan.completedDays || []).length;
    const weeksIn       = Math.floor(diffDays / 7) + 1;
    const weeksLeft     = Math.max(0, planData.durationWeeks - Math.floor(diffDays / 7));

    return `
      <div class="active-plan-card">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;">
          <div>
            <div style="font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--accent);margin-bottom:4px;">Active Plan</div>
            <div style="font-weight:700;font-size:1.0625rem;">${planData.name}</div>
          </div>
          <button class="btn btn-xs btn-danger" id="deactivate-plan-btn">Stop</button>
        </div>
        <div style="display:flex;gap:16px;font-size:0.8125rem;color:var(--text-secondary);margin-bottom:10px;">
          <span>Week ${weeksIn} of ${planData.durationWeeks}</span>
          <span>${completedDays} sessions done</span>
          <span>${weeksLeft}w remaining</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${pct}%"></div>
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">${pct}% complete</div>
      </div>
    `;
  }

  function _buildPlanList(goal) {
    const plans = WT.Plans.getByGoal(goal);
    if (!plans.length) return '<div class="empty-state"><p>No plans in this category yet.</p></div>';

    return plans.map((plan) => _buildPlanCard(plan)).join('');
  }

  function _buildPlanCard(plan) {
    const activePlan = WT.Storage.getActivePlan();
    const isActive   = activePlan?.planId === plan.id;
    const isExpanded = _expandedId === plan.id;

    return `
      <div class="plan-card ${isActive ? 'active-plan' : ''}" data-plan-id="${plan.id}">
        <div class="plan-card-header">
          ${isActive ? '<div style="font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--accent);margin-bottom:6px;">▶ Currently Active</div>' : ''}
          <div class="plan-card-title">${plan.name}</div>
          <div class="plan-card-meta">
            <span>📅 ${plan.durationWeeks} weeks</span>
            <span>💪 ${plan.daysPerWeek}×/week</span>
            <span>⏱ ${_formatRest(plan.restSec)} rest</span>
          </div>
          <p class="plan-card-desc">${plan.description}</p>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;">
            ${plan.highlights.map((h) => `<span class="badge badge-muscle">${h}</span>`).join('')}
          </div>
          <button class="plan-expand-btn" data-toggle-plan="${plan.id}" style="margin-top:10px;">
            ${isExpanded ? '▲ Hide schedule' : '▼ View schedule'}
          </button>
        </div>

        ${isExpanded ? _buildPlanWeeks(plan) : ''}

        <div class="plan-card-actions">
          ${isActive
            ? `<button class="btn btn-danger btn-sm" data-deactivate="${plan.id}">Stop Plan</button>`
            : `<button class="btn btn-primary btn-sm" data-activate="${plan.id}">Start This Plan</button>`
          }
        </div>
      </div>
    `;
  }

  function _buildPlanWeeks(plan) {
    const week = plan.weeks[0]; // Show week 1 as representative
    return `
      <div class="plan-weeks">
        <div class="plan-week-header">Week 1 — Sample Schedule</div>
        ${week.note ? `<div style="padding:8px 16px;font-size:0.8125rem;color:var(--text-secondary);font-style:italic;border-bottom:1px solid var(--border);">${week.note}</div>` : ''}
        ${week.days.filter((d) => d.exercises.length > 0).map((day) => `
          <div class="plan-day-row">
            <div class="plan-day-label">${day.label}</div>
            <div class="plan-day-exercises">
              ${day.exercises.map((ex) => `
                <div class="plan-exercise-line">
                  <strong>${ex.name}</strong>
                  — ${ex.targetSets}×${ex.targetReps}
                  ${ex.restSec ? `<span class="text-muted"> (${_formatRest(ex.restSec)} rest)</span>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ── Event Binding ──────────────────────────────────────────

  function _bindEvents() {
    if (!_container) return;
    _container.addEventListener('click', _handleClick);
  }

  function _handleClick(e) {
    const t = e.target;

    // Goal tab
    const goalTab = t.closest('.goal-tab');
    if (goalTab) {
      _activeGoal = goalTab.dataset.goal;
      _expandedId = null;
      _reRender();
      return;
    }

    // Toggle plan schedule
    const toggleBtn = t.closest('[data-toggle-plan]');
    if (toggleBtn) {
      const id = toggleBtn.dataset.togglePlan;
      _expandedId = _expandedId === id ? null : id;
      _reRenderList();
      return;
    }

    // Activate plan
    const activateBtn = t.closest('[data-activate]');
    if (activateBtn) {
      _showActivateModal(activateBtn.dataset.activate);
      return;
    }

    // Deactivate plan
    const deactivateBtn = t.closest('[data-deactivate]') || t.closest('#deactivate-plan-btn');
    if (deactivateBtn) {
      _deactivatePlan();
      return;
    }
  }

  function _showActivateModal(planId) {
    const plan   = WT.Plans.getById(planId);
    if (!plan) return;
    const today  = WT.App.todayStr();

    WT.App.showModal(`
      <div class="modal-handle"></div>
      <div class="modal-header">
        <h2>Start ${plan.name}</h2>
        <button class="icon-btn" onclick="WT.App.closeModal()">✕</button>
      </div>
      <div class="modal-body">
        <p style="margin-bottom:16px;">Choose a start date. Week 1 begins on this day.</p>
        <div class="form-group">
          <label class="form-label">Start Date</label>
          <input class="form-input date-modal-input" type="date" id="plan-start-date" value="${today}" min="${today}">
        </div>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="btn btn-primary btn-block" id="confirm-activate-btn" data-plan-id="${planId}">
            Start Plan
          </button>
          <button class="btn btn-ghost" onclick="WT.App.closeModal()" style="flex:0 0 80px;">Cancel</button>
        </div>
        <div id="modal-action-area"></div>
      </div>
    `);

    // Bind confirm
    setTimeout(() => {
      const btn = document.getElementById('confirm-activate-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          const startDate = document.getElementById('plan-start-date')?.value || today;
          _activatePlan(planId, startDate);
          WT.App.closeModal();
        });
      }
    }, 50);
  }

  function _activatePlan(planId, startDate) {
    const existing = WT.Storage.getActivePlan();
    if (existing) {
      WT.Storage.clearActivePlan();
    }
    WT.Storage.saveActivePlan({
      planId,
      startDate,
      completedDays: [],
    });
    _expandedId = null;
    _reRender();
    WT.App.toast('Plan started! Check your calendar.', 'success');
  }

  function _deactivatePlan() {
    if (!confirm('Stop this plan? Your workout history will be kept.')) return;
    WT.Storage.clearActivePlan();
    _reRender();
    WT.App.toast('Plan stopped.', 'info');
  }

  // ── Re-render helpers ──────────────────────────────────────

  function _reRender() {
    render(_container);
    afterRender(_container);
  }

  function _reRenderList() {
    const list = _container.querySelector('#plan-list');
    if (list) list.innerHTML = _buildPlanList(_activeGoal);
  }

  // ── Utilities ──────────────────────────────────────────────

  function _formatRest(sec) {
    if (!sec) return '—';
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s ? `${m}m ${s}s` : `${m}m`;
  }

  return { render, afterRender, destroy };
})();
