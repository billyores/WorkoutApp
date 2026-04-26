// WT.Calendar — Monthly calendar with workout indicators and day detail
window.WT = window.WT || {};

WT.Calendar = (function () {

  let _container = null;
  let _year      = new Date().getFullYear();
  let _month     = new Date().getMonth(); // 0-indexed
  let _selectedDay = null;

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
    return `
      <div class="calendar-view">
        ${_buildCalendarCard()}
        <div id="day-detail-container"></div>
      </div>
    `;
  }

  function _buildCalendarCard() {
    const settings    = WT.Storage.getSettings();
    const startOfWeek = settings.startOfWeek; // 0=Sun, 1=Mon
    const monthName   = new Date(_year, _month, 1)
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const loggedDates  = WT.Storage.getLoggedDates();
    const injuredDates = WT.Storage.getInjuredDates();
    const activePlan   = WT.Storage.getActivePlan();
    const today        = WT.App.todayStr();

    // Day headers
    const dayNames   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const reordered  = [...dayNames.slice(startOfWeek), ...dayNames.slice(0, startOfWeek)];
    const headersHTML = reordered.map((d) => `<div class="calendar-day-header">${d}</div>`).join('');

    // Build cells
    const firstDay   = new Date(_year, _month, 1).getDay();
    const daysInMon  = new Date(_year, _month + 1, 0).getDate();
    const daysInPrev = new Date(_year, _month, 0).getDate();
    const offset     = (firstDay - startOfWeek + 7) % 7;

    let cellsHTML = '';

    // Previous month filler
    for (let i = offset - 1; i >= 0; i--) {
      const d   = daysInPrev - i;
      const dt  = _dateStr(_year, _month - 1, d);
      cellsHTML += _buildDayCell(dt, d, 'other-month', loggedDates, injuredDates, activePlan, today);
    }

    // Current month
    for (let d = 1; d <= daysInMon; d++) {
      const dt = _dateStr(_year, _month, d);
      cellsHTML += _buildDayCell(dt, d, '', loggedDates, injuredDates, activePlan, today);
    }

    // Next month filler
    const totalCells = Math.ceil((offset + daysInMon) / 7) * 7;
    const remaining  = totalCells - offset - daysInMon;
    for (let d = 1; d <= remaining; d++) {
      const dt = _dateStr(_year, _month + 1, d);
      cellsHTML += _buildDayCell(dt, d, 'other-month', loggedDates, injuredDates, activePlan, today);
    }

    return `
      <div class="card">
        <div class="card-body" style="padding:12px;">
          <div class="calendar-nav">
            <button class="icon-btn" id="cal-prev" aria-label="Previous month">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span class="calendar-month-label">${monthName}</span>
            <button class="icon-btn" id="cal-next" aria-label="Next month">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div class="calendar-grid">
            ${headersHTML}
            ${cellsHTML}
          </div>
          <div class="divider" style="margin:12px 0 8px;"></div>
          <div style="display:flex;gap:12px;justify-content:center;font-size:0.75rem;color:var(--text-muted);flex-wrap:wrap;">
            <span><span style="display:inline-block;width:8px;height:8px;background:var(--success);border-radius:50%;margin-right:4px;"></span>Logged</span>
            <span><span style="display:inline-block;width:8px;height:8px;border:2px solid var(--info);border-radius:50%;margin-right:4px;"></span>Planned</span>
            <span><span style="display:inline-block;width:8px;height:8px;background:var(--danger);border-radius:50%;margin-right:4px;"></span>Injury</span>
          </div>
        </div>
      </div>
    `;
  }

  function _buildDayCell(dateStr, dayNum, extraClass, loggedDates, injuredDates, activePlan, today) {
    const isToday    = dateStr === today;
    const hasLog     = loggedDates.has(dateStr);
    const hasInjury  = injuredDates.has(dateStr);
    const planDay    = activePlan ? WT.Plans.getPlannedDayForDate(activePlan, dateStr) : null;
    const isPlanned  = planDay && planDay.exercises && planDay.exercises.length > 0;
    const isSelected = dateStr === _selectedDay;

    let classes = `calendar-day ${extraClass}`;
    if (isToday)    classes += ' today';
    if (isSelected) classes += ' selected';
    if (hasInjury && !hasLog) classes += ' injury-day';

    let dotsHTML = '';
    if (hasLog)    dotsHTML += '<span class="day-dot logged"></span>';
    if (isPlanned) dotsHTML += '<span class="day-dot planned"></span>';
    if (hasInjury) dotsHTML += '<span class="day-dot injured-dot"></span>';

    return `
      <div class="${classes}" data-date="${dateStr}" role="button" tabindex="0" aria-label="${dateStr}">
        <span class="day-number">${dayNum}</span>
        ${dotsHTML ? `<div class="day-dots">${dotsHTML}</div>` : '<div class="day-dots"></div>'}
      </div>
    `;
  }

  function _buildDayDetail(dateStr) {
    const logs       = WT.Storage.getLogsByDate(dateStr);
    const activePlan = WT.Storage.getActivePlan();
    const planDay    = activePlan ? WT.Plans.getPlannedDayForDate(activePlan, dateStr) : null;
    const today      = WT.App.todayStr();
    const isFuture   = dateStr > today;

    const dateLabel = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    });

    let contentHTML = '';

    // Logged workouts for this day
    if (logs.length) {
      contentHTML += logs.map((log) => {
        const exercises = log.exercises || [];
        const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
        const muscles   = [...new Set(exercises.flatMap((ex) => ex.muscleGroups))];
        const groups    = WT.Exercises.getMuscleGroups();
        const muscleStr = muscles.slice(0, 4).map((m) => groups[m] || m).join(', ');

        return `
          <div class="workout-summary-row" data-log-id="${log.id}">
            <div class="workout-summary-icon">💪</div>
            <div class="workout-summary-info">
              <div class="workout-summary-name">${exercises.length} exercise${exercises.length !== 1 ? 's' : ''} · ${totalSets} sets</div>
              <div class="workout-summary-meta">${log.startTime || ''} · ${muscleStr}</div>
            </div>
            <button class="icon-btn edit-workout-btn" data-edit-log="${log.id}" aria-label="Edit workout"
              style="color:var(--text-muted);width:36px;height:36px;flex-shrink:0;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          </div>
        `;
      }).join('');
    }

    // Planned workout for this day
    if (planDay && planDay.exercises && planDay.exercises.length) {
      const planData   = WT.Plans.getById(activePlan.planId);
      const isComplete = activePlan.completedDays?.includes(dateStr);
      contentHTML += `
        <div style="padding:12px 16px;border-top:1px solid var(--border);">
          <div style="font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:8px;">
            ${isComplete ? '✅' : '📋'} Plan: ${planData?.name || ''}
          </div>
          <div style="font-weight:600;margin-bottom:6px;">${planDay.label}</div>
          ${planDay.exercises.map((ex) => `
            <div style="font-size:0.875rem;color:var(--text-secondary);padding:3px 0;">
              ${ex.name} — ${ex.targetSets}×${ex.targetReps}
            </div>
          `).join('')}
        </div>
      `;
    }

    // Injury / soreness entries for this day
    const muscleEntries = WT.Storage.getMuscleHistoryByDate(dateStr)
      .filter((h) => h.score > 0);
    const groups = WT.Exercises.getMuscleGroups();
    if (muscleEntries.length) {
      const STATUS_EMOJI = ['', '🟡', '🟠', '🔴'];
      contentHTML += `
        <div style="padding:10px 16px;border-top:1px solid var(--border);">
          <div style="font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:6px;">Muscle Status</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${muscleEntries.map((h) => `
              <span style="display:inline-flex;align-items:center;gap:4px;font-size:0.8125rem;
                font-weight:600;padding:3px 8px;border-radius:var(--radius-full);
                background:${h.score === 3 ? 'var(--danger-dim)' : h.score === 2 ? 'rgba(249,115,22,0.12)' : 'var(--warning-dim)'};
                color:${h.score === 3 ? 'var(--danger)' : h.score === 2 ? '#ea580c' : 'var(--warning)'};">
                ${STATUS_EMOJI[h.score]} ${groups[h.muscleId] || h.muscleName}
              </span>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Empty state
    if (!logs.length && (!planDay || !planDay.exercises?.length) && !muscleEntries.length) {
      contentHTML = `
        <div class="empty-state" style="padding:24px 16px;">
          <div class="empty-state-icon">${isFuture ? '📅' : '😴'}</div>
          <p>${isFuture ? 'No workout planned yet' : 'Rest day'}</p>
        </div>
      `;
    }

    return `
      <div class="day-detail fade-in">
        <div class="day-detail-header">
          <span class="day-detail-date">${dateLabel}</span>
          <button class="icon-btn" id="close-day-detail">✕</button>
        </div>
        ${contentHTML}
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

    // Month navigation
    if (t.closest('#cal-prev')) { _changeMonth(-1); return; }
    if (t.closest('#cal-next')) { _changeMonth(+1); return; }

    // Close day detail
    if (t.closest('#close-day-detail')) { _closeDayDetail(); return; }

    // Pencil edit button on a workout row
    const editBtn = t.closest('[data-edit-log]');
    if (editBtn) {
      WT.WorkoutLogger.showEditModal(editBtn.dataset.editLog, () => {
        _openDayDetail(_selectedDay);
      });
      return;
    }

    // Day cell click
    const dayCell = t.closest('.calendar-day');
    if (dayCell && dayCell.dataset.date) {
      _openDayDetail(dayCell.dataset.date);
      return;
    }
  }

  function _changeMonth(delta) {
    _month += delta;
    if (_month > 11) { _month = 0;  _year++; }
    if (_month < 0)  { _month = 11; _year--; }
    _selectedDay = null;

    const card = _container.querySelector('.card');
    if (card) card.outerHTML = _buildCalendarCard();

    // Re-render whole view for simplicity
    render(_container);
    afterRender(_container);
  }

  function _openDayDetail(dateStr) {
    _selectedDay = dateStr;
    // Update selected cell
    _container.querySelectorAll('.calendar-day').forEach((el) => {
      el.classList.toggle('selected', el.dataset.date === dateStr);
    });

    const dc = _container.querySelector('#day-detail-container');
    if (dc) {
      dc.innerHTML = _buildDayDetail(dateStr);
    }
  }

  function _closeDayDetail() {
    _selectedDay = null;
    _container.querySelectorAll('.calendar-day.selected').forEach((el) =>
      el.classList.remove('selected')
    );
    const dc = _container.querySelector('#day-detail-container');
    if (dc) dc.innerHTML = '';
  }

  // ── Helpers ────────────────────────────────────────────────

  function _dateStr(year, month, day) {
    // Normalize month overflow
    const d = new Date(year, month, day);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  return { render, afterRender, destroy };
})();
