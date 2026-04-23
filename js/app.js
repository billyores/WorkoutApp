// WT.App — Main app boot, router, and global utilities
window.WT = window.WT || {};

WT.App = (function () {

  // ── View registry ──────────────────────────────────────────
  const VIEWS = {
    log:      { component: () => WT.WorkoutLogger, navLabel: 'log'      },
    calendar: { component: () => WT.Calendar,      navLabel: 'calendar' },
    plans:    { component: () => WT.PlanBuilder,   navLabel: 'plans'    },
    history:  { component: () => WT.History,       navLabel: 'history'  },
    stats:    { component: () => WT.Stats,          navLabel: 'stats'    },
  };

  let _currentView      = null;
  let _currentComponent = null;

  // ── Boot ───────────────────────────────────────────────────

  function init() {
    _applySettings();
    _registerServiceWorker();
    _bindGlobalEvents();
    _bindSettingsDrawer();
    _navigateTo(_hashView() || 'log');
  }

  function _applySettings() {
    const settings = WT.Storage.getSettings();
    document.body.dataset.theme = settings.theme || 'dark';
  }

  function _registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    }
  }

  // ── Router ─────────────────────────────────────────────────

  function _hashView() {
    const hash = window.location.hash.replace('#', '');
    return VIEWS[hash] ? hash : null;
  }

  function _navigateTo(viewId) {
    if (!VIEWS[viewId]) viewId = 'log';
    if (_currentView === viewId) return;

    // Tear down current component
    if (_currentComponent && typeof _currentComponent.destroy === 'function') {
      _currentComponent.destroy();
    }

    _currentView      = viewId;
    _currentComponent = null;

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach((el) => {
      el.setAttribute('aria-current', el.dataset.view === viewId ? 'page' : 'false');
    });

    // Update header
    const titles = { log: 'Home', calendar: 'Calendar', plans: 'Plans', history: 'History', stats: 'Stats' };
    document.querySelector('.app-title').textContent = titles[viewId] || 'WorkTrack';

    // Render view
    const container = document.getElementById('view-container');
    container.innerHTML = '';
    container.scrollTop = 0;

    const view = VIEWS[viewId];
    const comp = view.component();
    comp.render(container);
    comp.afterRender(container);
    _currentComponent = comp;

    // Update hash without triggering hashchange handler
    history.replaceState(null, '', '#' + viewId);
  }

  function _bindGlobalEvents() {
    // Bottom nav clicks
    document.getElementById('bottom-nav').addEventListener('click', (e) => {
      const item = e.target.closest('.nav-item');
      if (item) {
        e.preventDefault();
        _navigateTo(item.dataset.view);
      }
    });

    // Settings button
    document.getElementById('settings-btn').addEventListener('click', () => {
      _openSettings();
    });

    // Handle hash changes (browser back/forward)
    window.addEventListener('hashchange', () => {
      const v = _hashView();
      if (v) _navigateTo(v);
    });

    // Modal backdrop click
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') closeModal();
    });

    // Keyboard: Escape closes modal/drawer
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
        _closeSettings();
      }
    });
  }

  // ── Settings Drawer ────────────────────────────────────────

  function _bindSettingsDrawer() {
    document.getElementById('close-settings-btn').addEventListener('click', _closeSettings);
    document.getElementById('drawer-backdrop').addEventListener('click', _closeSettings);

    // Height unit toggle
    document.querySelectorAll('[data-height-unit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const unit = btn.dataset.heightUnit;
        WT.Storage.saveSettings({ profileHeightUnit: unit });
        _applyHeightUnit(unit);
        _saveHeight(); // convert and re-save any already-entered value
      });
    });

    // Height inputs — save on blur
    ['profile-height-ft', 'profile-height-in', 'profile-height-cm'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('blur', _saveHeight);
    });

    // Injury checkboxes — delegated from the persistent container
    document.getElementById('profile-injuries').addEventListener('change', (e) => {
      const cb = e.target;
      if (!cb.matches('.injury-checkbox')) return;
      const muscleId   = cb.dataset.muscle;
      const muscleName = WT.Exercises.getMuscleGroups()[muscleId] || muscleId;
      const label      = cb.closest('.injury-check-label');
      const today      = todayStr();

      if (cb.checked) {
        // Add 7-day recovery window
        const recovDate = _addDays(today, 7);
        WT.Storage.saveMuscleStatus(muscleId, {
          score: 3, key: 'injured', label: 'Injured',
          lastUpdated: today, injuredDate: today, recoveryDate: recovDate,
        });
        WT.Storage.appendMuscleHistory({
          date: today, muscleId, muscleName, score: 3, key: 'injured', label: 'Injured',
        });
        if (label) label.classList.add('checked');
      } else {
        WT.Storage.clearMuscleStatus(muscleId);
        if (label) label.classList.remove('checked');
      }
    });

    // Theme toggle
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.themeToggle;
        WT.Storage.saveSettings({ theme });
        document.body.dataset.theme = theme;
        document.querySelectorAll('[data-theme-toggle]').forEach((b) =>
          b.classList.toggle('active', b.dataset.themeToggle === theme));
      });
    });

    // Weight unit toggle
    document.querySelectorAll('[data-unit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const unit = btn.dataset.unit;
        WT.Storage.saveSettings({ weightUnit: unit });
        document.querySelectorAll('[data-unit]').forEach((b) =>
          b.classList.toggle('active', b.dataset.unit === unit));
        toast(`Weight unit set to ${unit}`, 'info');
      });
    });

    // Week start toggle
    document.querySelectorAll('[data-weekstart]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const val = parseInt(btn.dataset.weekstart);
        WT.Storage.saveSettings({ startOfWeek: val });
        document.querySelectorAll('[data-weekstart]').forEach((b) =>
          b.classList.toggle('active', parseInt(b.dataset.weekstart) === val));
        toast(`Week starts on ${val === 0 ? 'Sunday' : 'Monday'}`, 'info');
      });
    });

    // Rest timer preset buttons
    document.querySelectorAll('[data-rest]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sec = parseInt(btn.dataset.rest);
        WT.Storage.saveSettings({ restTimerSec: sec });
        document.querySelectorAll('[data-rest]').forEach((b) =>
          b.classList.toggle('active', parseInt(b.dataset.rest) === sec));
        toast(`Default rest: ${sec >= 60 ? Math.floor(sec/60) + 'min' + (sec%60 ? ' ' + sec%60 + 's' : '') : sec + 's'}`, 'info');
      });
    });

    // Clear data
    document.getElementById('clear-data-btn').addEventListener('click', () => {
      if (confirm('Delete ALL workout data? This cannot be undone.')) {
        WT.Storage.clearAllData();
        _closeSettings();
        _navigateTo('log');
        toast('All data cleared.', 'info');
      }
    });
  }

  // ── About Me / Profile helpers ─────────────────────────────

  function _applyHeightUnit(unit) {
    const impRow = document.getElementById('height-imperial-row');
    const metRow = document.getElementById('height-metric-row');
    if (impRow) impRow.style.display = unit === 'imperial' ? 'flex' : 'none';
    if (metRow) metRow.style.display = unit === 'metric'   ? 'flex' : 'none';
    document.querySelectorAll('[data-height-unit]').forEach((b) =>
      b.classList.toggle('active', b.dataset.heightUnit === unit));
  }

  function _syncHeightInputs() {
    const settings = WT.Storage.getSettings();
    const unit     = settings.profileHeightUnit || 'imperial';
    const cm       = settings.profileHeightCm;
    _applyHeightUnit(unit);
    if (cm != null && cm > 0) {
      if (unit === 'imperial') {
        const totalIn = Math.round(cm / 2.54);
        const ftEl = document.getElementById('profile-height-ft');
        const inEl = document.getElementById('profile-height-in');
        if (ftEl) ftEl.value = Math.floor(totalIn / 12);
        if (inEl) inEl.value = totalIn % 12;
      } else {
        const cmEl = document.getElementById('profile-height-cm');
        if (cmEl) cmEl.value = cm;
      }
    }
  }

  function _saveHeight() {
    const settings = WT.Storage.getSettings();
    const unit     = settings.profileHeightUnit || 'imperial';
    let cm = null;
    if (unit === 'imperial') {
      const ft  = parseInt(document.getElementById('profile-height-ft')?.value)  || 0;
      const ins = parseInt(document.getElementById('profile-height-in')?.value) || 0;
      if (ft > 0 || ins > 0) cm = Math.round((ft * 12 + ins) * 2.54);
    } else {
      const raw = parseInt(document.getElementById('profile-height-cm')?.value) || 0;
      if (raw > 0) cm = raw;
    }
    if (cm != null) WT.Storage.saveSettings({ profileHeightCm: cm });
  }

  function _renderProfileInjuries() {
    const container = document.getElementById('profile-injuries');
    if (!container) return;
    const groups  = WT.Exercises.getMuscleGroups();
    const joints  = WT.Exercises.getJoints();
    const status  = WT.Storage.getMuscleStatus();

    function _checkboxes(map) {
      return Object.entries(map).map(([id, name]) => {
        const isInjured = status[id]?.score === 3;
        return `
          <label class="injury-check-label${isInjured ? ' checked' : ''}" data-muscle="${id}">
            <input type="checkbox" class="injury-checkbox" data-muscle="${id}"
              ${isInjured ? 'checked' : ''} style="accent-color:var(--danger);">
            <span>${name}</span>
          </label>
        `;
      }).join('');
    }

    container.innerHTML = `
      <div style="font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;
        color:var(--text-muted);margin-bottom:6px;">Muscles</div>
      <div class="injury-checkbox-grid" style="margin-bottom:14px;">
        ${_checkboxes(groups)}
      </div>
      <div style="font-size:0.6875rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;
        color:var(--text-muted);margin-bottom:6px;">Joints</div>
      <div class="injury-checkbox-grid">
        ${_checkboxes(joints)}
      </div>
    `;
  }

  function _addDays(dateStr, n) {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function _openSettings() {
    // Sync UI state with stored settings
    const settings = WT.Storage.getSettings();
    document.querySelectorAll('[data-unit]').forEach((btn) =>
      btn.classList.toggle('active', btn.dataset.unit === settings.weightUnit));
    document.querySelectorAll('[data-weekstart]').forEach((btn) =>
      btn.classList.toggle('active', parseInt(btn.dataset.weekstart) === settings.startOfWeek));
    document.querySelectorAll('[data-rest]').forEach((btn) =>
      btn.classList.toggle('active', parseInt(btn.dataset.rest) === settings.restTimerSec));
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) =>
      btn.classList.toggle('active', btn.dataset.themeToggle === settings.theme));

    // About Me: sync height inputs and re-render injury checkboxes
    _syncHeightInputs();
    _renderProfileInjuries();

    // Storage usage
    const usageEl = document.getElementById('storage-usage');
    if (usageEl) usageEl.textContent = `Storage used: ~${WT.Storage.getStorageUsageKB()} KB`;

    document.getElementById('settings-drawer').classList.remove('hidden');
    document.getElementById('drawer-backdrop').classList.remove('hidden');
  }

  function _closeSettings() {
    document.getElementById('settings-drawer').classList.add('hidden');
    document.getElementById('drawer-backdrop').classList.add('hidden');
  }

  // ── Modal ──────────────────────────────────────────────────

  function showModal(html) {
    const overlay   = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container');
    container.innerHTML = html;
    overlay.classList.remove('hidden');
    container.classList.remove('hidden');
  }

  function closeModal() {
    const overlay   = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container');
    overlay.classList.add('hidden');
    container.classList.add('hidden');
    container.innerHTML = '';
  }

  // ── Toast ──────────────────────────────────────────────────

  function toast(message, type = 'info') {
    const tc  = document.getElementById('toast-container');
    if (!tc) return;
    const el  = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    tc.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 350); }, 2600);
  }

  // ── Date / Time Utilities ──────────────────────────────────

  function todayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  function timeStr() {
    const d  = new Date();
    const h  = String(d.getHours()).padStart(2, '0');
    const m  = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  // ── UUID ───────────────────────────────────────────────────

  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  // ── Init when DOM is ready ─────────────────────────────────

  document.addEventListener('DOMContentLoaded', init);

  return { toast, showModal, closeModal, todayStr, timeStr, uuid };
})();
