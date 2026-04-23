// WT.History — Past sessions list, stats, and CSV export/import
window.WT = window.WT || {};

WT.History = (function () {

  let _container  = null;
  let _expandedId = null;

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
    const logs = WT.Storage.getLogs().slice().reverse(); // newest first

    // Stats
    const totalSessions = [...new Set(logs.map((l) => l.date))].length;
    const totalSets     = logs.reduce((acc, l) =>
      acc + (l.exercises || []).reduce((a, ex) => a + ex.sets.length, 0), 0);
    const streak        = _calcStreak();

    return `
      <div class="history-view">
        <!-- Stats row -->
        <div class="history-stats-row">
          <div class="stat-box">
            <div class="stat-value">${totalSessions}</div>
            <div class="stat-label">Sessions</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${totalSets}</div>
            <div class="stat-label">Total Sets</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">${streak}</div>
            <div class="stat-label">Day Streak 🔥</div>
          </div>
        </div>

        <!-- Export / Import -->
        <div class="card">
          <div class="card-body" style="padding:12px 16px;">
            <div style="font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:10px;">
              Backup & Restore
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn btn-secondary btn-sm" id="export-csv-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export CSV
              </button>
              <label class="btn btn-secondary btn-sm" style="cursor:pointer;" title="Import CSV to restore or merge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Import CSV
                <input type="file" id="import-csv-input" accept=".csv" style="display:none;">
              </label>
              <button class="btn btn-secondary btn-sm" id="export-json-btn" title="Full JSON backup (includes plans & settings)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Full Backup
              </button>
              <label class="btn btn-secondary btn-sm" style="cursor:pointer;" title="Restore from full JSON backup">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Restore
                <input type="file" id="import-json-input" accept=".json" style="display:none;">
              </label>
            </div>
            <p style="margin-top:8px;font-size:0.75rem;color:var(--text-muted);">
              Save exported files to Google Drive for cross-device backup.
            </p>
          </div>
        </div>

        ${logs.length === 0
          ? `<div class="empty-state">
              <div class="empty-state-icon">📝</div>
              <h3>No workouts yet</h3>
              <p>Log your first session and it will appear here.</p>
            </div>`
          : logs.map((log) => _buildSessionCard(log)).join('')
        }
      </div>
    `;
  }

  function _buildSessionCard(log) {
    const exercises  = log.exercises || [];
    const totalSets  = exercises.reduce((a, ex) => a + ex.sets.length, 0);
    const settings   = WT.Storage.getSettings();
    const unit       = settings.weightUnit;

    // Collect unique muscle groups
    const muscles  = [...new Set(exercises.flatMap((ex) => ex.muscleGroups))];
    const groups   = WT.Exercises.getMuscleGroups();
    const isExpanded = _expandedId === log.id;

    const dateLabel = new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });

    const duration = (log.startTime && log.endTime)
      ? _calcDuration(log.startTime, log.endTime) : null;

    return `
      <div class="history-session-card" data-log-id="${log.id}">
        <div class="history-session-header">
          <div>
            <div class="history-session-date">${dateLabel}</div>
            <div class="history-session-meta">
              ${log.startTime ? log.startTime + ' · ' : ''}
              ${exercises.length} exercise${exercises.length !== 1 ? 's' : ''} · ${totalSets} sets
              ${duration ? ' · ' + duration : ''}
            </div>
          </div>
          <div style="display:flex;gap:6px;align-items:center;">
            <button class="icon-btn" style="width:32px;height:32px;" data-share-log="${log.id}" aria-label="Share session">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>
            <button class="icon-btn" style="width:32px;height:32px;" data-delete-log="${log.id}" aria-label="Delete session">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            </button>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              style="color:var(--text-muted);transition:transform 0.2s;transform:rotate(${isExpanded ? 90 : 0}deg)">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
        <div class="history-session-badges">
          ${muscles.slice(0, 6).map((m) => `<span class="badge badge-muscle">${groups[m] || m}</span>`).join('')}
          ${log.planRef ? '<span class="badge badge-plan">Plan</span>' : ''}
        </div>
        ${isExpanded ? _buildSessionDetail(log, unit) : ''}
      </div>
    `;
  }

  function _buildSessionDetail(log, unit) {
    const exercises = log.exercises || [];
    const records   = WT.Storage.getPRs();

    return `
      <div class="history-detail">
        ${exercises.map((ex) => {
          const topSet = ex.sets.reduce((best, s) => {
            if (!s.weight) return best;
            return (s.weight || 0) > (best?.weight || 0) ? s : best;
          }, null);
          const setsSummary = ex.sets
            .map((s) => ex.isBodyweight
              ? `${s.reps || '?'}×BW`
              : `${s.reps || '?'}×${s.weight || '?'}${unit}`)
            .join(' · ');
          const pr = records[ex.id];
          const isPR = pr && topSet && topSet.weight === pr.maxWeight && pr.logId === log.id;
          return `
            <div class="history-exercise-row">
              <div>
                <div class="history-exercise-name">
                  ${ex.name}
                  ${isPR ? '<span class="badge" style="background:var(--warning-dim);color:var(--warning);margin-left:6px;">PR</span>' : ''}
                </div>
                <div style="font-size:0.8125rem;color:var(--text-muted);margin-top:2px;">${setsSummary}</div>
              </div>
              ${topSet ? `<div class="history-exercise-sets">Best: ${topSet.reps}×${topSet.weight}${unit}</div>` : ''}
            </div>
          `;
        }).join('')}
        ${log.notes ? `<div style="font-size:0.875rem;color:var(--text-secondary);margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">📝 ${log.notes}</div>` : ''}
      </div>
    `;
  }

  // ── Event Binding ──────────────────────────────────────────

  function _bindEvents() {
    if (!_container) return;
    _container.addEventListener('click', _handleClick);

    // CSV import
    const csvInput = _container.querySelector('#import-csv-input');
    if (csvInput) csvInput.addEventListener('change', (e) => _importCSV(e.target.files[0]));

    // JSON import
    const jsonInput = _container.querySelector('#import-json-input');
    if (jsonInput) jsonInput.addEventListener('change', (e) => _importJSON(e.target.files[0]));
  }

  function _handleClick(e) {
    const t = e.target;

    // Export CSV
    if (t.closest('#export-csv-btn')) { _exportCSV(); return; }

    // Export JSON
    if (t.closest('#export-json-btn')) { _exportJSON(); return; }

    // Share session
    const shareBtn = t.closest('[data-share-log]');
    if (shareBtn) {
      const log = WT.Storage.getLogs().find((l) => l.id === shareBtn.dataset.shareLog);
      if (log) _shareSession(log);
      return;
    }

    // Delete session
    const delBtn = t.closest('[data-delete-log]');
    if (delBtn) {
      const id = delBtn.dataset.deleteLog;
      if (confirm('Delete this workout session?')) {
        WT.Storage.deleteLog(id);
        if (_expandedId === id) _expandedId = null;
        render(_container);
        afterRender(_container);
      }
      return;
    }

    // Expand/collapse session card
    const card = t.closest('.history-session-card');
    if (card && !t.closest('[data-delete-log]')) {
      const id = card.dataset.logId;
      _expandedId = _expandedId === id ? null : id;
      render(_container);
      afterRender(_container);
    }
  }

  // ── Share Workout ──────────────────────────────────────────

  function _shareSession(log) {
    const text = _buildShareText(log);
    if (navigator.share) {
      navigator.share({ title: 'My Workout — WorkTrack', text }).catch(() => {});
    } else if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        WT.App.toast('Copied to clipboard!', 'success');
      }).catch(() => {
        WT.App.toast('Share not available on this browser.', 'error');
      });
    } else {
      WT.App.toast('Share not supported on this browser.', 'error');
    }
  }

  function _buildShareText(log) {
    const settings  = WT.Storage.getSettings();
    const unit      = settings.weightUnit;
    const dateLabel = new Date(log.date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
    const records = WT.Storage.getPRs();

    let text = `💪 WorkTrack — ${dateLabel}\n`;
    if (log.startTime) text += `⏱ ${log.startTime}`;
    const dur = log.startTime && log.endTime ? _calcDuration(log.startTime, log.endTime) : null;
    if (dur) text += ` · ${dur}`;
    text += '\n\n';

    (log.exercises || []).forEach((ex) => {
      const setStr = ex.sets
        .filter((s) => s.reps)
        .map((s) => ex.isBodyweight ? `${s.reps}×BW` : `${s.reps}×${s.weight}${unit}`)
        .join(', ');
      const pr = records[ex.id];
      const topWeight = ex.sets.reduce((m, s) => Math.max(m, s.weight || 0), 0);
      const prFlag = pr && topWeight === pr.maxWeight && pr.logId === log.id ? ' 🏆 PR!' : '';
      text += `${ex.name}: ${setStr}${prFlag}\n`;
    });

    const totalSets = (log.exercises || []).reduce((a, e) => a + e.sets.length, 0);
    text += `\nTotal: ${totalSets} sets`;
    if (log.notes) text += `\nNotes: ${log.notes}`;
    text += '\n\nLogged with WorkTrack 🏋️';
    return text;
  }

  // ── CSV Export / Import ────────────────────────────────────

  function _exportCSV() {
    const logs = WT.Storage.getLogs();
    if (!logs.length) { WT.App.toast('No workouts to export.', 'info'); return; }

    const rows = [
      // Header row
      ['date', 'startTime', 'endTime', 'exercise', 'muscleGroups', 'isBodyweight', 'setNumber', 'reps', 'weight', 'weightUnit', 'notes', 'planId'],
    ];

    const unit = WT.Storage.getSettings().weightUnit;

    logs.forEach((log) => {
      (log.exercises || []).forEach((ex) => {
        ex.sets.forEach((set, si) => {
          rows.push([
            log.date         || '',
            log.startTime    || '',
            log.endTime      || '',
            ex.name          || '',
            (ex.muscleGroups || []).join('|'),
            ex.isBodyweight  ? '1' : '0',
            si + 1,
            set.reps         != null ? set.reps   : '',
            set.weight       != null ? set.weight : '',
            unit,
            log.notes        || '',
            log.planRef?.planId || '',
          ]);
        });
      });
    });

    const csv = rows.map((r) =>
      r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    _downloadFile(csv, `worktrack-export-${WT.App.todayStr()}.csv`, 'text/csv');
    WT.App.toast(`Exported ${logs.length} sessions to CSV.`, 'success');
  }

  function _importCSV(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text     = e.target.result;
        const lines    = text.split('\n').filter((l) => l.trim());
        const headers  = _parseCSVRow(lines[0]);
        const idx      = (h) => headers.indexOf(h);

        // Group rows by (date + startTime) — each unique combo is one session
        const sessionMap = new Map();
        for (let i = 1; i < lines.length; i++) {
          const cols = _parseCSVRow(lines[i]);
          if (!cols.length || !cols[idx('date')]) continue;
          const key = `${cols[idx('date')]}__${cols[idx('startTime')]}`;
          if (!sessionMap.has(key)) {
            sessionMap.set(key, {
              id:        WT.App.uuid(),
              date:      cols[idx('date')],
              startTime: cols[idx('startTime')]  || '',
              endTime:   cols[idx('endTime')]    || '',
              exercises: [],
              notes:     cols[idx('notes')]      || '',
              planRef:   cols[idx('planId')] ? { planId: cols[idx('planId')] } : null,
            });
          }
          const session  = sessionMap.get(key);
          const exName   = cols[idx('exercise')];
          if (!exName) continue;

          let exercise = session.exercises.find((ex) => ex.name === exName);
          if (!exercise) {
            exercise = {
              id:           '',
              name:         exName,
              muscleGroups: (cols[idx('muscleGroups')] || '').split('|').filter(Boolean),
              isBodyweight: cols[idx('isBodyweight')] === '1',
              sets:         [],
            };
            session.exercises.push(exercise);
          }
          exercise.sets.push({
            setNumber: parseInt(cols[idx('setNumber')]) || exercise.sets.length + 1,
            reps:      cols[idx('reps')]   ? parseFloat(cols[idx('reps')])   : null,
            weight:    cols[idx('weight')] ? parseFloat(cols[idx('weight')]) : null,
            done:      true,
          });
        }

        let imported = 0;
        sessionMap.forEach((session) => {
          WT.Storage.saveLog(session);
          imported++;
        });

        render(_container);
        afterRender(_container);
        WT.App.toast(`Imported ${imported} sessions from CSV.`, 'success');
      } catch (err) {
        console.error('[WT.History] CSV import error:', err);
        WT.App.toast('Import failed — check CSV format.', 'error');
      }
    };
    reader.readAsText(file);
  }

  function _parseCSVRow(line) {
    const result  = [];
    let current   = '';
    let inQuotes  = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else { inQuotes = !inQuotes; }
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  // ── Full JSON Backup / Restore ─────────────────────────────

  function _exportJSON() {
    const backup = {
      version:     '1.0',
      exportedAt:  new Date().toISOString(),
      settings:    WT.Storage.getSettings(),
      logs:        WT.Storage.getLogs(),
      activePlan:  WT.Storage.getActivePlan(),
    };
    _downloadFile(JSON.stringify(backup, null, 2),
      `worktrack-backup-${WT.App.todayStr()}.json`, 'application/json');
    WT.App.toast('Full backup downloaded.', 'success');
  }

  function _importJSON(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        if (!backup.logs) throw new Error('Invalid backup file');

        if (!confirm(`Restore ${backup.logs.length} sessions from backup dated ${backup.exportedAt?.slice(0,10) || 'unknown'}? This will merge with existing data.`)) return;

        backup.logs.forEach((log) => WT.Storage.saveLog(log));
        if (backup.settings) WT.Storage.saveSettings(backup.settings);
        if (backup.activePlan) WT.Storage.saveActivePlan(backup.activePlan);

        render(_container);
        afterRender(_container);
        WT.App.toast('Backup restored successfully.', 'success');
      } catch (err) {
        console.error('[WT.History] JSON restore error:', err);
        WT.App.toast('Restore failed — invalid backup file.', 'error');
      }
    };
    reader.readAsText(file);
  }

  // ── Utilities ──────────────────────────────────────────────

  function _downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function _calcDuration(startTime, endTime) {
    try {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const mins = (eh * 60 + em) - (sh * 60 + sm);
      if (mins <= 0) return null;
      return `${mins}min`;
    } catch (e) { return null; }
  }

  function _calcStreak() {
    const loggedDates = [...WT.Storage.getLoggedDates()].sort().reverse();
    if (!loggedDates.length) return 0;

    const today    = WT.App.todayStr();
    let streak     = 0;
    let checkDate  = today;

    for (const d of loggedDates) {
      if (d === checkDate) {
        streak++;
        // Move checkDate back 1 day
        const prev = new Date(checkDate + 'T00:00:00');
        prev.setDate(prev.getDate() - 1);
        checkDate = prev.toISOString().slice(0, 10);
      } else if (d < checkDate) {
        // Gap found — but allow today to not count yet
        if (checkDate === today) {
          // Check if yesterday is in the set
          const prev = new Date(today + 'T00:00:00');
          prev.setDate(prev.getDate() - 1);
          checkDate = prev.toISOString().slice(0, 10);
          if (d === checkDate) {
            streak++;
            const p2 = new Date(checkDate + 'T00:00:00');
            p2.setDate(p2.getDate() - 1);
            checkDate = p2.toISOString().slice(0, 10);
          } else {
            break;
          }
        } else {
          break;
        }
      }
    }
    return streak;
  }

  return { render, afterRender, destroy };
})();
