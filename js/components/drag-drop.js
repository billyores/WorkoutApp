// WT.DragDrop — Pointer Events drag engine for reordering vertical lists
// Works with both Android touch and desktop mouse via the unified Pointer Events API
window.WT = window.WT || {};

WT.DragDrop = (function () {
  const zones = new Map(); // containerEl → zone config

  function registerZone(containerEl, options) {
    if (!containerEl) return;
    const zone = {
      container:  containerEl,
      selector:   options.selector  || '.draggable',
      handleSel:  options.handleSel || '.drag-handle',
      onReorder:  options.onReorder || null,
      storageKey: options.storageKey || null,
    };
    zones.set(containerEl, zone);
    _attachHandlers(zone);
    return zone;
  }

  function unregisterZone(containerEl) {
    const zone = zones.get(containerEl);
    if (zone) {
      containerEl.removeEventListener('pointerdown', zone._handler);
      zones.delete(containerEl);
    }
  }

  function unregisterAll() {
    zones.forEach((zone, el) => unregisterZone(el));
  }

  function _attachHandlers(zone) {
    const handler = (e) => _onPointerDown(e, zone);
    zone._handler = handler;
    zone.container.addEventListener('pointerdown', handler);
  }

  function _onPointerDown(e, zone) {
    const handle = e.target.closest(zone.handleSel);
    if (!handle) return;

    const item = handle.closest(zone.selector);
    if (!item) return;

    e.preventDefault();
    e.stopPropagation();

    const container  = zone.container;
    const rect       = item.getBoundingClientRect();
    const offsetY    = e.clientY - rect.top;

    // Create ghost clone
    const ghost = item.cloneNode(true);
    ghost.className += ' drag-ghost';
    ghost.style.cssText = [
      `position:fixed`,
      `top:${rect.top}px`,
      `left:${rect.left}px`,
      `width:${rect.width}px`,
      `height:${rect.height}px`,
      `pointer-events:none`,
      `z-index:9999`,
      `margin:0`,
    ].join(';');
    document.body.appendChild(ghost);

    // Create placeholder
    const placeholder = document.createElement('div');
    placeholder.className = 'drag-placeholder';
    placeholder.style.height = rect.height + 'px';
    item.parentNode.insertBefore(placeholder, item);
    item.classList.add('invisible');

    // Capture pointer so we keep getting events even if finger moves fast
    item.setPointerCapture(e.pointerId);

    function onPointerMove(me) {
      ghost.style.top = (me.clientY - offsetY) + 'px';
      _shiftItems(container, zone.selector, placeholder, me.clientY);
    }

    function onPointerUp() {
      // Place real item where placeholder is
      placeholder.parentNode.insertBefore(item, placeholder);
      placeholder.remove();
      ghost.remove();
      item.classList.remove('invisible');

      item.removeEventListener('pointermove', onPointerMove);
      item.removeEventListener('pointerup',   onPointerUp);
      item.removeEventListener('pointercancel', onPointerUp);

      // Build new order from data-id attributes
      const items    = Array.from(container.querySelectorAll(zone.selector));
      const newOrder = items.map((el) => el.dataset.id).filter(Boolean);

      if (zone.storageKey) {
        WT.Storage.saveLayout(zone.storageKey, newOrder);
      }
      if (zone.onReorder) zone.onReorder(newOrder);

      // Dispatch custom event for any listeners
      container.dispatchEvent(new CustomEvent('wt:reorder', { detail: { order: newOrder }, bubbles: true }));
    }

    item.addEventListener('pointermove',   onPointerMove);
    item.addEventListener('pointerup',     onPointerUp);
    item.addEventListener('pointercancel', onPointerUp);
  }

  // Move the placeholder to the correct position based on current drag Y
  function _shiftItems(container, selector, placeholder, clientY) {
    const items = Array.from(container.querySelectorAll(selector + ':not(.invisible)'));
    for (const sibling of items) {
      if (sibling === placeholder) continue;
      const sibRect = sibling.getBoundingClientRect();
      const midY    = sibRect.top + sibRect.height / 2;
      if (clientY < midY) {
        container.insertBefore(placeholder, sibling);
        return;
      }
    }
    // Append at end
    container.appendChild(placeholder);
  }

  return { registerZone, unregisterZone, unregisterAll };
})();
