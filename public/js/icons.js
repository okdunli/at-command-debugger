

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
    // lucide 改过名的旧图标名（配置集/按钮里存的是老名字，新版包里没有）。
    'edit-3': 'pencil-line', 'arrow-down-square': 'square-arrow-down',
    'alert-triangle': 'triangle-alert', 'alert-circle': 'circle-alert',
    'check-circle': 'circle-check', 'check-square': 'square-check',
    'help-circle': 'circle-help', 'x-circle': 'circle-x',
    'bar-chart': 'chart-column', 'line-chart': 'chart-line',
    'more-horizontal': 'ellipsis', 'more-vertical': 'ellipsis-vertical',
  };

  function resolve(name) {
    if (!name) return 'circle';
    if (window.LUCIDE_ICONS && window.LUCIDE_ICONS.indexOf(name) >= 0) return name;
    const alias = ALIAS[name];
    if (alias && window.LUCIDE_ICONS && window.LUCIDE_ICONS.indexOf(alias) >= 0) return alias;
    return alias || name;
  }

  window.icon = function (name) {
    return '<i class="lci" data-lucide="' + resolve(name || 'circle') + '"></i>';
  };

  // 供 .rose 组件直接绑定动态图标名（配置集里的 icon 字段是用户数据，
  // 可能是旧 lucide 名，必须走 resolve 映射，否则渲染成空白方块）。
  window.resolveIcon = resolve;

  window.refreshIcons = function (root) {
    const scope = root || document;
    try {
      let converted = 0;
      scope.querySelectorAll('[data-icon]').forEach(function (el) {
        if (el.dataset.iconDone) return;
        el.setAttribute('data-lucide', resolve(el.getAttribute('data-icon')));
        el.removeAttribute('data-icon');
        el.dataset.iconDone = '1';
        converted++;
      });
      // 动态绑定的图标名（配置集/按钮里的 icon 字段）可能是旧 lucide 名，
      // 直接放进 data-lucide 会渲染成空白方块——这里按 resolve() 映射改名。
      scope.querySelectorAll('[data-lucide]').forEach(function (el) {
        if (el.dataset.iconResolved) return;
        const raw = el.getAttribute('data-lucide');
        if (!raw) return;
        const fixed = resolve(raw);
        if (fixed !== raw) el.setAttribute('data-lucide', fixed);
        el.dataset.iconResolved = '1';
      });
      // 除上面由 data-icon 转换来的元素外，组件里 icon() 直接产出的
      // <i data-lucide="..."> 也需要 lucide 处理。只要还有「未渲染且未标记失败」
      // 的 data-lucide 元素，就重建一次；重建后仍无 svg 的说明图标名不在打包
      // 集合内，标记 iconFailed 不再重试——否则每 500ms 全页重建，造成界面闪烁。
      var pending = 0;
      scope.querySelectorAll('[data-lucide]').forEach(function (el) {
        if (!el.querySelector('svg') && !el.dataset.iconFailed) pending++;
      });
      if ((converted || pending) && window.lucide && typeof window.lucide.createIcons === 'function') {
        // lucide 的 createIcons 会对所有 [data-lucide] 执行 replaceChild——
        // 包括已经渲染好的 svg（svg 也带 data-lucide 属性）。不摘掉的话
        // 一次调用就全页重建 299 个图标节点（每 500ms sweep 一轮 = 持续闪烁）。
        // 这里先把已渲染的 svg 暂时摘除属性，只让新元素被转换，然后恢复。
        var painted = [];
        scope.querySelectorAll('svg[data-lucide]').forEach(function (el) {
          painted.push([el, el.getAttribute('data-lucide')]);
          el.removeAttribute('data-lucide');
        });
        window.lucide.createIcons({
          nameAttr: 'data-lucide',
          attrs: { width: '1em', height: '1em', 'stroke-width': '1.9' },
        });
        painted.forEach(function (p) { p[0].setAttribute('data-lucide', p[1]); });
        // lucide 会把认识的 [data-lucide] 替换成 svg；剩下没有 svg 的就是未知图标名，
        // 标记后不再反复尝试（避免死循环式重建）。
        scope.querySelectorAll('[data-lucide]').forEach(function (el) {
          if (!el.querySelector('svg')) el.dataset.iconFailed = '1';
        });
      }
    } catch (e) {  }
  };

  window.renderIcons = window.refreshIcons;
})();
