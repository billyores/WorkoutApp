// WT.Stats — Personal Records, Exercise Progress Charts, Body Weight Tracking
window.WT = window.WT || {};

WT.Stats = (function () {

  let _container   = null;
  let _activeTab   = 'prs';     // 'prs' | 'progress' | 'body'
  let _selectedExId = null;

  // ── Public API ─────────────────────────────────────────────

  function render(containerEl) {
    _container = containerEl;
    containerEl.innerHTML = _buildHTML();
  }

  function afterRender(containerEl) {
    _container = containerEl;
    _bindEvents();
    _drawActiveChart();
  }

  function destroy() {
    _container = null;
  }

  // ── HTML Builders ──────────────────────────────────────────

  function _buildHTML() {
    return `
      <div class="stats-view" style="padding:16px;display:flex;flex-direction:column;gap:12px;">
        <div class="goal-tabs" id="stats-tabs" style="flex-wrap:wrap;">
          <button class="goal-tab ${_activeTab === 'prs'      ? 'active' : ''}" data-tab="prs">🏆 PRs</button>
          <button class="goal-tab ${_activeTab === 'progress' ? 'active' : ''}" data-tab="progress">📈 Progress</button>
          <button class="goal-tab ${_activeTab === 'body'     ? 'active' : ''}" data-tab="body">⚖️ Body</button>
          <button class="goal-tab ${_activeTab === 'injuries' ? 'active' : ''}" data-tab="injuries">🩹 Injuries</button>
          <button class="goal-tab ${_activeTab === 'goals'    ? 'active' : ''}" data-tab="goals">🎯 Goals</button>
        </div>
        <div id="stats-content">
          ${_buildTabContent()}
        </div>
      </div>
    `;
  }

  function _buildTabContent() {
    switch (_activeTab) {
      case 'prs':      return _buildPRsTab();
      case 'progress': return _buildProgressTab();
      case 'body':     return _buildBodyTab();
      case 'injuries': return _buildInjuriesTab();
      case 'goals':    return WT.Goals.buildGoalsTabHTML();
      default:         return '';
    }
  }

  // ── PRs Tab ────────────────────────────────────────────────

  function _buildPRsTab() {
    const records = WT.Storage.getPRs();
    const entries = Object.values(records).sort((a, b) => b.date.localeCompare(a.date));

    if (!entries.length) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">🏆</div>
          <h3>No PRs yet</h3>
          <p>Log weighted exercises to see your personal records here.</p>
        </div>`;
    }

    const unit          = WT.Storage.getSettings().weightUnit;
    const sevenDaysAgo  = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCutoff  = sevenDaysAgo.toISOString().slice(0, 10);

    return `
      <p style="font-size:0.8125rem;color:var(--text-muted);">Your best set per exercise across all logged sessions.</p>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:4px;">
        ${entries.map((pr) => {
          const isRecent  = pr.date >= recentCutoff;
          const dateLabel = new Date(pr.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return `
            <div class="history-session-card" data-pr-ex="${pr.exerciseId}" style="cursor:pointer;">
              <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;">
                <div>
                  <div style="font-weight:600;font-size:0.9375rem;">${pr.exerciseName}</div>
                  <div style="font-size:0.8125rem;color:var(--text-muted);">${pr.reps} reps · ${dateLabel}</div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                  ${isRecent ? '<span class="badge" style="background:var(--warning-dim);color:var(--warning);">NEW</span>' : ''}
                  <span style="font-size:1.25rem;font-weight:800;color:var(--accent);font-family:var(--font-mono);">${pr.maxWeight}<small style="font-size:0.6875rem;font-weight:600;">${unit}</small></span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ── Progress Tab ───────────────────────────────────────────

  function _buildProgressTab() {
    const logs = WT.Storage.getLogs();

    // Collect unique weighted exercises
    const exerciseMap = new Map();
    logs.forEach((log) => {
      (log.exercises || []).forEach((ex) => {
        if (!ex.isBodyweight && ex.id && !exerciseMap.has(ex.id)) {
          exerciseMap.set(ex.id, ex.name);
        }
      });
    });

    const exercises = [...exerciseMap.entries()];
    if (!_selectedExId && exercises.length) _selectedExId = exercises[0][0];

    if (!exercises.length) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">📈</div>
          <h3>No data yet</h3>
          <p>Log weighted exercises to track progress over time.</p>
        </div>`;
    }

    const unit       = WT.Storage.getSettings().weightUnit;
    const chartData  = _getProgressData(_selectedExId, logs, unit);

    return `
      <div class="form-group" style="margin-bottom:12px;">
        <label class="form-label">Exercise</label>
        <select class="form-select" id="progress-ex-select">
          ${exercises.map(([id, name]) =>
            `<option value="${id}" ${id === _selectedExId ? 'selected' : ''}>${name}</option>`
          ).join('')}
        </select>
      </div>
      <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:12px;margin-bottom:12px;">
        <canvas id="progress-chart" style="width:100%;height:200px;display:block;"></canvas>
      </div>
      ${chartData.length > 1 ? _buildProgressTable(chartData, unit) : ''}
    `;
  }

  function _buildProgressTable(data, unit) {
    return `
      <div style="display:flex;flex-direction:column;gap:6px;">
        <div style="font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);">Session History</div>
        ${data.slice().reverse().slice(0, 10).map((d) => `
          <div style="display:flex;justify-content:space-between;padding:8px 12px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-md);">
            <span style="font-size:0.875rem;color:var(--text-secondary);">${d.dateLabel}</span>
            <span style="font-size:0.875rem;font-weight:600;font-family:var(--font-mono);">${d.value}${unit} × ${d.reps}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ── Body Stats Tab ─────────────────────────────────────────

  function _buildBodyTab() {
    const stats    = WT.Storage.getBodyStats();
    const settings = WT.Storage.getSettings();
    const unit     = settings.weightUnit;
    const today    = WT.App.todayStr();

    return `
      <div class="card" style="margin-bottom:12px;">
        <div class="card-body" style="padding:12px 16px;">
          <div style="font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:10px;">Log Weight</div>
          <div style="display:flex;gap:8px;align-items:flex-end;">
            <div style="flex:1;">
              <label class="form-label">Date</label>
              <input class="form-input" type="date" id="body-date" value="${today}" max="${today}">
            </div>
            <div style="flex:1;">
              <label class="form-label">Weight (${unit})</label>
              <input class="form-input" type="number" id="body-weight" min="0" max="999" step="0.1"
                inputmode="decimal" placeholder="—">
            </div>
            <button class="btn btn-primary" id="log-body-btn" style="flex-shrink:0;height:44px;padding:0 16px;">Log</button>
          </div>
          <input class="form-input" type="text" id="body-notes" placeholder="Notes (optional)"
            style="margin-top:8px;">
        </div>
      </div>

      ${stats.length > 0 ? `
        <div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:12px;margin-bottom:12px;">
          <canvas id="body-chart" style="width:100%;height:180px;display:block;"></canvas>
        </div>
        ${stats.length >= 2 ? _buildBodyTrend(stats, unit) : ''}
      ` : ''}

      ${stats.length === 0
        ? `<div class="empty-state">
            <div class="empty-state-icon">⚖️</div>
            <h3>No weight logged</h3>
            <p>Log your weight above to track your trend over time.</p>
          </div>`
        : `<div style="display:flex;flex-direction:column;gap:6px;">
            <div style="font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);">History</div>
            ${stats.slice().reverse().slice(0, 20).map((entry) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-md);">
                <div>
                  <div style="font-weight:600;font-size:0.9375rem;">${new Date(entry.date + 'T00:00:00').toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}</div>
                  ${entry.notes ? `<div style="font-size:0.8125rem;color:var(--text-muted);">${entry.notes}</div>` : ''}
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="font-size:1.125rem;font-weight:800;color:var(--accent);font-family:var(--font-mono);">${entry.weight}<small style="font-size:0.6875rem;">${entry.unit}</small></span>
                  <button class="icon-btn" style="width:28px;height:28px;" data-delete-body="${entry.id}">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>`
      }
    `;
  }

  function _buildBodyTrend(stats, unit) {
    const first   = stats[0];
    const last    = stats[stats.length - 1];
    const diff    = last.weight - first.weight;
    const diffStr = (diff >= 0 ? '+' : '') + diff.toFixed(1);
    const color   = diff < 0 ? 'var(--success)' : diff > 0 ? 'var(--accent)' : 'var(--text-muted)';
    return `
      <div style="display:flex;gap:12px;margin-bottom:8px;">
        <div class="stat-box" style="flex:1;">
          <div class="stat-value">${first.weight}<small style="font-size:0.75rem;">${unit}</small></div>
          <div class="stat-label">Start</div>
        </div>
        <div class="stat-box" style="flex:1;">
          <div class="stat-value" style="color:${color};">${diffStr}<small style="font-size:0.75rem;">${unit}</small></div>
          <div class="stat-label">Change</div>
        </div>
        <div class="stat-box" style="flex:1;">
          <div class="stat-value">${last.weight}<small style="font-size:0.75rem;">${unit}</small></div>
          <div class="stat-label">Current</div>
        </div>
      </div>
    `;
  }

  // ── Injuries Tab ───────────────────────────────────────────

  function _buildInjuriesTab() {
    const history = WT.Storage.getMuscleHistory();
    const groups  = WT.Exercises.getMuscleGroups();

    // Only score ≥ 1 entries are worth showing; score 3 = injured
    const injured = history.filter((h) => h.score === 3);

    if (!history.filter((h) => h.score > 0).length) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">🩹</div>
          <h3>No injuries recorded</h3>
          <p>Muscle check-ins will appear here when you mark a muscle as sore or injured.</p>
        </div>`;
    }

    // ── Summary: total injured days per muscle ──────────────
    const injuredDaysByMuscle = {}; // muscleId → Set of dates
    injured.forEach((h) => {
      if (!injuredDaysByMuscle[h.muscleId]) injuredDaysByMuscle[h.muscleId] = new Set();
      injuredDaysByMuscle[h.muscleId].add(h.date);
    });

    const summaryRows = Object.entries(injuredDaysByMuscle)
      .sort((a, b) => b[1].size - a[1].size)
      .map(([muscleId, dates]) => {
        const name = groups[muscleId] || muscleId;
        return `
          <div style="display:flex;justify-content:space-between;align-items:center;
            padding:10px 14px;background:var(--bg-surface);border:1px solid var(--border);
            border-radius:var(--radius-md);">
            <span style="font-weight:600;">${name}</span>
            <span style="font-family:var(--font-mono);font-size:0.9375rem;color:var(--danger);font-weight:700;">
              ${dates.size} day${dates.size !== 1 ? 's' : ''}
            </span>
          </div>`;
      }).join('');

    // ── Timeline: group consecutive injury dates into periods ──
    // Build per-muscle sorted date arrays, then find contiguous runs
    const periods = []; // { muscleId, muscleName, start, end, days }
    Object.entries(injuredDaysByMuscle).forEach(([muscleId, dateSet]) => {
      const sorted = [...dateSet].sort();
      let start = sorted[0], prev = sorted[0];
      for (let i = 1; i <= sorted.length; i++) {
        const cur = sorted[i];
        const prevDate = new Date(prev + 'T00:00:00');
        const curDate  = cur ? new Date(cur + 'T00:00:00') : null;
        const gap = curDate ? (curDate - prevDate) / 86400000 : Infinity;
        if (gap > 1) {
          const startDate = new Date(start + 'T00:00:00');
          const endDate   = new Date(prev  + 'T00:00:00');
          const days = Math.round((endDate - startDate) / 86400000) + 1;
          periods.push({ muscleId, muscleName: groups[muscleId] || muscleId, start, end: prev, days });
          start = cur;
        }
        prev = cur;
      }
    });
    periods.sort((a, b) => b.start.localeCompare(a.start));

    const timelineHTML = periods.map((p) => {
      const startLabel = new Date(p.start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endLabel   = new Date(p.end   + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const sameDay    = p.start === p.end;
      return `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;
          background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-md);">
          <div style="width:8px;height:8px;background:var(--danger);border-radius:50%;flex-shrink:0;"></div>
          <div style="flex:1;">
            <div style="font-weight:600;">${p.muscleName}</div>
            <div style="font-size:0.8125rem;color:var(--text-muted);">
              ${sameDay ? startLabel : `${startLabel} – ${endLabel}`}
            </div>
          </div>
          <span style="font-family:var(--font-mono);font-size:0.875rem;color:var(--danger);font-weight:600;
            background:var(--danger-dim);padding:2px 8px;border-radius:var(--radius-full);">
            ${p.days}d
          </span>
        </div>`;
    }).join('');

    // ── Soreness history (score 1-2) ───────────────────────────
    const soreEntries = history
      .filter((h) => h.score === 1 || h.score === 2)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 15);

    const STATUS_EMOJI = ['', '🟡', '🟠', '🔴'];
    const soreHTML = soreEntries.map((h) => {
      const dateLabel = new Date(h.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;
          padding:8px 14px;background:var(--bg-surface);border:1px solid var(--border);
          border-radius:var(--radius-md);font-size:0.875rem;">
          <span style="color:var(--text-secondary);">${dateLabel}</span>
          <span style="font-weight:600;">${groups[h.muscleId] || h.muscleName}</span>
          <span>${STATUS_EMOJI[h.score]} ${h.label}</span>
        </div>`;
    }).join('');

    return `
      <div style="display:flex;flex-direction:column;gap:16px;">

        <div>
          <div style="font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;
            color:var(--text-muted);margin-bottom:8px;">🔴 Injury Days by Muscle</div>
          <div style="display:flex;flex-direction:column;gap:6px;">${summaryRows}</div>
        </div>

        ${periods.length ? `
          <div>
            <div style="font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;
              color:var(--text-muted);margin-bottom:8px;">Injury Periods</div>
            <div style="display:flex;flex-direction:column;gap:6px;">${timelineHTML}</div>
          </div>` : ''}

        ${soreEntries.length ? `
          <div>
            <div style="font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;
              color:var(--text-muted);margin-bottom:8px;">Recent Soreness</div>
            <div style="display:flex;flex-direction:column;gap:6px;">${soreHTML}</div>
          </div>` : ''}

      </div>
    `;
  }

  // ── Event Binding ──────────────────────────────────────────

  function _bindEvents() {
    if (!_container) return;
    _container.addEventListener('click',  _handleClick);
    _container.addEventListener('change', _handleChange);
  }

  function _handleClick(e) {
    const t = e.target;

    // Tab switch
    const tabBtn = t.closest('[data-tab]');
    if (tabBtn && tabBtn.closest('#stats-tabs')) {
      _activeTab = tabBtn.dataset.tab;
      render(_container);
      afterRender(_container);
      return;
    }

    // PR row → jump to exercise progress
    const prRow = t.closest('[data-pr-ex]');
    if (prRow) {
      _selectedExId = prRow.dataset.prEx;
      _activeTab    = 'progress';
      render(_container);
      afterRender(_container);
      return;
    }

    // Log body stat
    if (t.closest('#log-body-btn')) {
      _logBodyStat();
      return;
    }

    // Delete body stat
    const delBtn = t.closest('[data-delete-body]');
    if (delBtn) {
      WT.Storage.deleteBodyStat(delBtn.dataset.deleteBody);
      render(_container);
      afterRender(_container);
      return;
    }

    // Add goal
    if (t.closest('#add-goal-btn')) {
      WT.Goals.showAddGoalModal(() => {
        render(_container);
        afterRender(_container);
      });
      return;
    }

    // Delete goal
    const delGoal = t.closest('[data-delete-goal]');
    if (delGoal) {
      WT.Storage.deleteGoal(delGoal.dataset.deleteGoal);
      render(_container);
      afterRender(_container);
      return;
    }
  }

  function _handleChange(e) {
    const t = e.target;
    if (t.id === 'progress-ex-select') {
      _selectedExId = t.value;
      const logs     = WT.Storage.getLogs();
      const unit     = WT.Storage.getSettings().weightUnit;
      const chartData = _getProgressData(_selectedExId, logs, unit);
      // Redraw chart + table without full re-render
      const tableEl = _container.querySelector('#progress-table');
      if (tableEl) tableEl.innerHTML = chartData.length > 1 ? _buildProgressTable(chartData, unit) : '';
      _drawProgressChart(chartData, unit);
    }
  }

  function _logBodyStat() {
    const dateEl   = _container.querySelector('#body-date');
    const weightEl = _container.querySelector('#body-weight');
    const notesEl  = _container.querySelector('#body-notes');

    const dateVal   = dateEl?.value;
    const weightVal = parseFloat(weightEl?.value);
    if (!dateVal || isNaN(weightVal) || weightVal <= 0) {
      WT.App.toast('Enter a valid weight.', 'error');
      return;
    }
    const unit = WT.Storage.getSettings().weightUnit;
    WT.Storage.saveBodyStat({
      id:     WT.App.uuid(),
      date:   dateVal,
      weight: weightVal,
      unit,
      notes:  notesEl?.value.trim() || '',
    });
    WT.App.toast('Weight logged!', 'success');

    // Check if any weight goals were achieved
    WT.Goals.checkAndNotify();

    render(_container);
    afterRender(_container);
  }

  // ── Chart Drawing ──────────────────────────────────────────

  function _drawActiveChart() {
    if (_activeTab === 'progress') {
      const logs  = WT.Storage.getLogs();
      const unit  = WT.Storage.getSettings().weightUnit;
      const data  = _getProgressData(_selectedExId, logs, unit);
      _drawProgressChart(data, unit);
    } else if (_activeTab === 'body') {
      const stats = WT.Storage.getBodyStats();
      const unit  = WT.Storage.getSettings().weightUnit;
      _drawBodyChart(stats, unit);
    }
  }

  function _getProgressData(exId, logs, unit) {
    if (!exId) return [];
    const points = [];
    logs.forEach((log) => {
      (log.exercises || []).forEach((ex) => {
        if (ex.id !== exId && ex.name !== exId) return;
        // Best set for this exercise in this session
        const best = ex.sets.reduce((b, s) => {
          if (s.weight == null) return b;
          return (s.weight > (b?.weight || 0)) ? s : b;
        }, null);
        if (best) {
          points.push({
            date:      log.date,
            value:     best.weight,
            reps:      best.reps || '?',
            dateLabel: new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          });
        }
      });
    });
    // Sort by date, dedupe (keep best per date)
    const dateMap = new Map();
    points.forEach((p) => {
      if (!dateMap.has(p.date) || p.value > dateMap.get(p.date).value) {
        dateMap.set(p.date, p);
      }
    });
    return [...dateMap.values()].sort((a, b) => a.date.localeCompare(b.date));
  }

  function _drawProgressChart(data, unit) {
    const canvas = _container?.querySelector('#progress-chart');
    if (!canvas) return;
    const label = WT.Exercises.getById(_selectedExId)?.name || _selectedExId || 'Exercise';
    _drawLineChart(canvas, data, unit, label);
  }

  function _drawBodyChart(stats, unit) {
    const canvas = _container?.querySelector('#body-chart');
    if (!canvas || !stats.length) return;
    const data = stats.map((s) => ({
      date:      s.date,
      value:     s.weight,
      reps:      null,
      dateLabel: new Date(s.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }));
    _drawLineChart(canvas, data, unit, 'Body Weight');
  }

  // Core canvas chart renderer
  function _drawLineChart(canvas, data, unit, title) {
    const dpr    = window.devicePixelRatio || 1;
    const w      = canvas.offsetWidth  || canvas.parentElement?.offsetWidth || 300;
    const h      = canvas.offsetHeight || 200;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Theme colors from CSS variables
    const style      = getComputedStyle(document.body);
    const accent     = style.getPropertyValue('--accent').trim()          || '#f97316';
    const borderCol  = style.getPropertyValue('--border').trim()          || '#2e2e2e';
    const textMuted  = style.getPropertyValue('--text-muted').trim()      || '#475569';
    const bgPage     = style.getPropertyValue('--bg-page').trim()         || '#0d0d0d';
    const textSec    = style.getPropertyValue('--text-secondary').trim()  || '#94a3b8';

    const pad = { top: 24, right: 16, bottom: 36, left: 48 };
    const cw  = w - pad.left - pad.right;
    const ch  = h - pad.top  - pad.bottom;

    ctx.clearRect(0, 0, w, h);

    if (!data.length) {
      ctx.fillStyle = textMuted;
      ctx.font      = '13px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('No data yet', w / 2, h / 2);
      return;
    }

    const values = data.map((d) => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range  = maxVal - minVal || 1;
    const vMin   = minVal - range * 0.1;
    const vMax   = maxVal + range * 0.1;
    const vRange = vMax - vMin;

    // Grid lines + Y labels
    const gridCount = 4;
    ctx.strokeStyle = borderCol;
    ctx.lineWidth   = 0.5;
    ctx.font        = `10px system-ui`;
    ctx.fillStyle   = textMuted;
    ctx.textAlign   = 'right';
    for (let i = 0; i <= gridCount; i++) {
      const y    = pad.top + (ch / gridCount) * i;
      const val  = vMax - (vRange / gridCount) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + cw, y);
      ctx.stroke();
      ctx.fillText(Math.round(val), pad.left - 4, y + 4);
    }

    // Map data to pixels
    const pts = data.map((d, i) => ({
      x: pad.left + (data.length > 1 ? (i / (data.length - 1)) * cw : cw / 2),
      y: pad.top  + ((vMax - d.value) / vRange) * ch,
      d,
    }));

    // Area fill
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i - 1].x + pts[i].x) / 2;
      ctx.bezierCurveTo(cpx, pts[i - 1].y, cpx, pts[i].y, pts[i].x, pts[i].y);
    }
    ctx.lineTo(pts[pts.length - 1].x, pad.top + ch);
    ctx.lineTo(pts[0].x, pad.top + ch);
    ctx.closePath();
    ctx.fillStyle = accent.replace(')', ', 0.12)').replace('rgb', 'rgba').replace('#f97316', 'rgba(249,115,22,0.12)');
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i - 1].x + pts[i].x) / 2;
      ctx.bezierCurveTo(cpx, pts[i - 1].y, cpx, pts[i].y, pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = accent;
    ctx.lineWidth   = 2;
    ctx.stroke();

    // X labels + dots
    const skipN  = Math.max(1, Math.ceil(pts.length / 5));
    ctx.font     = '10px system-ui';
    ctx.fillStyle = textMuted;
    ctx.textAlign = 'center';
    pts.forEach((pt, i) => {
      // Dot
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, i === pts.length - 1 ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.strokeStyle = bgPage;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // X label
      if (i === 0 || i === pts.length - 1 || i % skipN === 0) {
        ctx.fillStyle = textMuted;
        ctx.fillText(pt.d.dateLabel, pt.x, pad.top + ch + 18);
      }
    });

    // Title (latest value)
    const latest = data[data.length - 1];
    ctx.fillStyle = textSec;
    ctx.font      = 'bold 11px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText(`${title} · Latest: ${latest.value}${unit}`, pad.left, pad.top - 6);
  }

  return { render, afterRender, destroy };
})();
