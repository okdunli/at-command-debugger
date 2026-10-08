

(function () {
  'use strict';

  const ALIAS = {
    gauge: 'gauge', rocket: 'rocket', list: 'list', grid: 'layout-grid',
    check: 'check', terminal: 'terminal', gear: 'settings', info: 'info',
    search: 'search', sparkles: 'sparkles', database: 'database', key: 'key',
    send: 'send', globe: 'globe', wave: 'activity', shield: 'shield',
    clock: 'clock', download: 'download', antenna: 'antenna',
    shuffle: 'shuffle', stethoscope: 'stethoscope', reset: 'rotate-ccw',
    bolt: 'zap', plus: 'plus', edit: 'pencil', trash: 'trash-2',
    copy: 'copy', up: 'arrow-up', down: 'arrow-down', play: 'play',
    stop: 'square', export: 'upload', folder: 'folder', warning: 'triangle-alert',
    close: 'x', port: 'cable', link: 'link', history: 'history',
    bookmarks: 'bookmark',
  };

  function resolve(name) {
    if (!name) return 'circle';
    if (window.LUCIDE_ICONS && window.LUCIDE_ICONS.indexOf(name) >= 0) return name;
    return ALIAS[name] || name;
  }

  window.icon = function (name) {
    return '<i class="lci" data-lucide="' + resolve(name || 'circle') + '"></i>';
  };

  window.refreshIcons = function (root) {
    const scope = root || document;
    try {
      scope.querySelectorAll('[data-icon]').forEach(function (el) {
        if (el.dataset.iconDone) return;
        el.setAttribute('data-lucide', resolve(el.getAttribute('data-icon')));
        el.removeAttribute('data-icon');
        el.dataset.iconDone = '1';
      });
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons({
          nameAttr: 'data-lucide',
          attrs: { width: '1em', height: '1em', 'stroke-width': '1.9' },
        });
      }
    } catch (e) {  }
  };

  window.renderIcons = window.refreshIcons;
})();
