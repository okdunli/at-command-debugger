
(function () {
  'use strict';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const S = {
    boot: null,
    config: null,
    buttons: [],
    logs: [],
    maxLogs: 2000,
    logFilter: { type: 'all', kw: '', hex: false },
    page: 'dashboard',
    preset: null,
    presetParams: {},
    cmdCache: {},
    selected: new Set(),
    progress: null,
    busy: false,
    lastResult: null,
    history: [],
    histIdx: -1,
    running: false,
    seenItems: 0,
    lastProgressKey: '',
    profiles: [],
    profileId: '',
    dockOpen: false,
    seenSummary: new Set(),
    pollSeq: null,
    loopSending: false,
  };


  async function call(method, args) {
    args = args || {};
    const api = window.pywebview && window.pywebview.api;
    if (api) {
      try {

        if (typeof api.invoke === 'function') {
          const res = await api.invoke(method, args);
          return res || {};
        }
        if (typeof api.call === 'function') {
          const res = await api.call({ method: method, args: args });
          return res || {};
        }
      } catch (e) {
        console.warn('pywebview call failed', method, e);
      }
    }
    try {
      const r = await fetch('/api/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: method, args: args }),
      });
      return await r.json();
    } catch (e) {
      console.error('http call failed', method, e);
      return { ok: false, error: '后端通信失败：' + e };
    }
  }

  async function callList(method, args) {
    const r = await call(method, args);
    if (Array.isArray(r)) return r;
    if (r && Array.isArray(r.result)) return r.result;
    if (r && Array.isArray(r.buttons)) return r.buttons;
    if (r && Array.isArray(r.ports)) return r.ports;
    return [];
  }


  function toast(msg, type, ms) {
    const layer = $('#toastLayer');
    const el = document.createElement('div');
    el.className = 'toast ' + (type || 'info');
    const ico = type === 'ok' ? 'circle-check' : type === 'err'
      ? 'octagon-alert' : type === 'warn' ? 'triangle-alert' : 'info';
    el.innerHTML = '<span class="toast-ico">' + window.icon(ico) + '</span><span>'
      + esc(msg) + '</span>';
    layer.appendChild(el);
    window.refreshIcons(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 300);
    }, ms || (type === 'err' ? 4200 : 2600));
  }

  function ripple(e) {
    const btn = e.currentTarget;
    if (!btn || S.config && S.config.ui && S.config.ui.animation === false) return;
    const rect = btn.getBoundingClientRect();
    const d = Math.max(rect.width, rect.height);
    const span = document.createElement('span');
    span.className = 'ripple';
    span.style.width = span.style.height = d + 'px';
    span.style.left = (e.clientX - rect.left - d / 2) + 'px';
    span.style.top = (e.clientY - rect.top - d / 2) + 'px';
    btn.style.position = btn.style.position || 'relative';
    btn.appendChild(span);
    setTimeout(() => span.remove(), 560);
  }

  function bindRipple() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.primary-btn, .ghost-btn, .chip, .ubtn, .quick, .nav-item');
      if (btn) ripple.call(null, { currentTarget: btn, clientX: e.clientX, clientY: e.clientY });
    }, true);
  }


  function modal(title, bodyHtml, buttons) {
    $('#modalTitle').textContent = title;
    $('#modalBody').innerHTML = bodyHtml;
    const foot = $('#modalFoot');
    foot.innerHTML = '';
    (buttons || []).forEach((b) => {
      const btn = document.createElement('button');
      btn.className = b.cls || 'ghost-btn';
      btn.textContent = b.text;
      btn.onclick = () => {
        if (b.onClick && b.onClick() === false) return;
        if (!b.keepOpen) closeModal();
      };
      foot.appendChild(btn);
    });
    $('#modalLayer').hidden = false;
    window.renderIcons($('#modalBody'));
    return $('#modalBody');
  }

  function closeModal() { $('#modalLayer').hidden = true; }


  function showShortcuts() {
    const rows = [
      ['Ctrl + Enter', '发送指令（多行框内）'],
      ['↑ / ↓', '发送框历史指令回溯（光标在首/尾时）'],
      ['Ctrl + L', '清空日志'],
      ['Ctrl + F', '聚焦日志搜索'],
      ['Ctrl + H', 'HEX 视图切换'],
      ['Ctrl + T', '时间戳显示切换'],
      ['Ctrl + M', '添加收藏'],
      ['Ctrl + 滚轮', '串口终端字号调节'],
      ['Esc', '分级关闭：自动补全 → 面板 → 弹窗'],
      ['F1', '打开本帮助'],
    ];
    modal('快捷键', '<div class="kbd-list">' + rows.map(([k, d]) =>
      '<div class="kbd-row"><span class="kbd">' + esc(k) + '</span>' +
      '<span>' + esc(d) + '</span></div>').join('') + '</div>',
      [{ text: '知道了', cls: 'primary-btn' }]);
  }


  function goto(page) {
    S.page = page;
    $$('.nav-item').forEach((n) => n.classList.toggle('active', n.dataset.page === page));
    $$('.page').forEach((p) => p.classList.toggle('active', p.id === 'page-' + page));
    const main = $('#main');
    main.scrollTop = 0;
    if (page === 'terminal') setTimeout(scrollTerm, 60);
    if (page === 'logs') setTimeout(() => {
      const el = $('#logAll');
      if (el) el.scrollTop = el.scrollHeight;
    }, 60);
    try {
      if (('#' + page) !== location.hash) history.replaceState(null, '', '#' + page);
    } catch (e) {  }

    if (S.config && S.config.ui && S.config.ui.last_page !== page) {

      call('save_config', { patch: { ui: { last_page: page } } })
        .then((r) => { if (r && r.config) S.config = r.config; }).catch(() => {});
    }
  }


  function logClass(text) {
    const t = (text || '').trim();
    if (/^AT_ERROR|^AT_PARAM_ERROR|^AT_BUSY_ERROR|^AT_NO_NET|^AT_RX_ERROR|^AT_DUTY|^AT_CRYPTO/.test(t)) return 'err';
    if (t === 'OK') return 'ok';
    if (t.startsWith('+EVT')) return 'evt';
    return '';
  }

  function logLine(item, withTs) {
    const d = document.createElement('div');
    d.className = 'log-line';
    d.title = '点击复制该行内容';
    const ts = new Date((item.ts || Date.now() / 1000) * 1000);
    const t = ts.toTimeString().slice(0, 8) + '.' +
      String(Math.floor((ts % 1000))).padStart(3, '0').slice(0, 3);
    let html = '';
    if (withTs) html += '<span class="log-ts">' + t + '</span>';
    const dirCls = item.dir || 'rx';
    const dirText = dirCls === 'tx' ? 'TX' : dirCls === 'sys' ? 'SYS'
      : dirCls === 'mark' ? 'MARK' : 'RX';
    if (dirCls === 'mark') d.classList.add('log-mark-line');
    html += '<span class="log-dir ' + dirCls + '">' + dirText + '</span>';
    const hexView = S.logFilter && S.logFilter.hex && item.hex;
    const cls = dirCls === 'mark' ? 'mark'
      : hexView ? 'hex' : logClass(item.text) + (item.sim ? ' sim' : '');
    const raw = String(hexView ? item.hex : (item.text || ''));
    let body = esc(raw);

    const kw = !hexView && S.logFilter && S.logFilter.kw;
    if (kw) {
      const kwe = esc(kw).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      try {
        body = body.replace(new RegExp(kwe, 'gi'),
          (m) => '<mark class="hl">' + m + '</mark>');
      } catch (e) {  }
    }
    html += '<span class="log-text ' + cls + '">' + body + '</span>';
    if (item.err && item.err.length) {
      const e0 = item.err[0];
      d.classList.add('has-err');
      html += '<span class="log-err-tag" title="' +
        esc((e0.hint || '') ) + '">' + esc(e0.code) + ' · ' +
        esc(e0.meaning) + '</span>';
    }
    d.innerHTML = html;
    return d;
  }


  const SERIAL_DIRS = { tx: 1, rx: 1 };
  function isSerial(ev) { return SERIAL_DIRS[ev.dir || 'rx'] === 1; }
  function isProgram(ev) { return !isSerial(ev); }
  function termFilter() {
    const f = S.logFilter || {};
    return { type: ['all', 'tx', 'rx'].indexOf(f.type) >= 0 ? f.type : 'all',
             kw: f.kw || '', hex: f.hex };
  }
  function logMatches(item, f) {
    f = f || S.logFilter || {};
    if (f.type === 'err' && !(item.err && item.err.length)) return false;
    if (f.type === 'tx' && (item.dir || 'rx') !== 'tx') return false;
    if (f.type === 'rx' && (item.dir || 'rx') !== 'rx') return false;
    if (f.type === 'sys' && (item.dir || 'rx') !== 'sys') return false;
    if (f.type === 'mark' && (item.dir || 'rx') !== 'mark') return false;
    if (f.kw) {
      const kw = f.kw.toUpperCase();
      const hit = (item.text || '').toUpperCase().includes(kw) ||
        (item.hex || '').toUpperCase().includes(kw);
      if (!hit) return false;
    }
    return true;
  }

  function updateLogStats() {
    let tx = 0, rx = 0, sys = 0, err = 0, mark = 0;
    (S.logs || []).forEach((ev) => {
      const dir = ev.dir || 'rx';
      if (dir === 'tx') tx++;
      else if (dir === 'sys') sys++;
      else if (dir === 'mark') mark++;
      else rx++;
      if (ev.err && ev.err.length) err++;
    });
    $('#stTx') && ($('#stTx').textContent = tx);
    $('#stRx') && ($('#stRx').textContent = rx);
    $('#stSys') && ($('#stSys').textContent = sys);
    $('#stErr') && ($('#stErr').textContent = err);
    $('#stMark') && ($('#stMark').textContent = mark);
    $('#stTotal') && ($('#stTotal').textContent = (S.logs || []).length);
  }

  function rerenderLogs() {
    const showTs = !(S.config && S.config.ui && S.config.ui.timestamps === false);
    const term = $('#terminal');
    const all = $('#logAll');
    const dock = $('#dockList');
    if (!term || !dock) return;
    const source = (S.logs || []).slice(-(S.maxLogs || 2000));
    const tf = termFilter();
    const filtering = tf.type !== 'all' || !!tf.kw;
    const termTail = source
      .filter((ev) => isSerial(ev) && logMatches(ev, tf)).slice(-2000);
    const af = S.logFilter2 || { type: 'all' };

    const progTail = source.filter((ev) => isProgram(ev) && logMatches(ev, af)).slice(-2000);

    const serialTail = source.filter((ev) => isSerial(ev) && logMatches(ev, tf)).slice(-200);
    term.innerHTML = termTail.map((ev) => logLine(ev, showTs).outerHTML).join('');
    if (all) all.innerHTML = progTail.map((ev) => logLine(ev, showTs).outerHTML).join('');
    dock.innerHTML = serialTail.map((ev) => logLine(ev, showTs).outerHTML).join('');
    updateLogStats();
    if (!filtering) scrollTerm();
  }

  function pushLogs(events) {
    if (!events || !events.length) return;
    const showTs = !(S.config && S.config.ui && S.config.ui.timestamps === false);
    const term = $('#terminal');
    const all = $('#logAll');
    const dock = $('#dockList');
    let firstErr = null;
    events.forEach((ev) => {
      S.logs.push(ev);
      if (ev.err && ev.err.length && !firstErr) firstErr = ev;
    });
    if (S.logs.length > (S.maxLogs || 2000)) {
      S.logs = S.logs.slice(-(S.maxLogs || 2000));
    }
    const tf = termFilter();
    const filtering = tf.type !== 'all' || !!tf.kw;
    if (filtering || (S.logFilter2 && (S.logFilter2.type !== 'all' || S.logFilter2.kw))) {

      rerenderLogs();
    } else {
      events.forEach((ev) => {
        if (isSerial(ev) && logMatches(ev, tf)) term.appendChild(logLine(ev, showTs));
        if (all && isProgram(ev) && logMatches(ev, tf)) all.appendChild(logLine(ev, showTs));
        if (dock && isSerial(ev)) dock.appendChild(logLine(ev, showTs));
      });
      while (term.children.length > (S.maxLogs || 2000)) term.removeChild(term.firstChild);
      if (all) while (all.children.length > (S.maxLogs || 2000)) all.removeChild(all.firstChild);
      if (dock) while (dock.children.length > 200) dock.removeChild(dock.firstChild);
      updateLogStats();
      const auto = !(S.config && S.config.ui && S.config.ui.auto_scroll === false);
      if (auto && $('#chkAutoScroll') && $('#chkAutoScroll').checked) scrollTerm();
    }
    updateDock(filtering ? false :
      !(S.config && S.config.ui && S.config.ui.auto_scroll === false));
    if (firstErr) {
      const e0 = firstErr.err[0];
      toast('「' + e0.code + '」' + e0.meaning +
        (firstErr.text && firstErr.text !== e0.code ? '（' + firstErr.text + '）' : ''),
        e0.severity === 'warn' ? 'warn' : 'err');
    }
  }

  function scrollTerm() {
    const t = $('#terminal');
    t.scrollTop = t.scrollHeight;
  }


  function updateDock(autoScroll) {
    const dock = $('#dockList');
    const latest = $('#dockLatest');
    const count = $('#dockCount');

    const serial = (S.logs || []).filter(isSerial);
    const last = serial.length ? serial[serial.length - 1] : null;
    if (latest) {
      const dir = !last ? '' : (last.dir === 'tx' ? '↑ ' : '↓ ');
      latest.textContent = last ? dir + last.text : '暂无串口日志';
    }
    if (count) count.textContent = serial.length + ' 条';
    if (!dock) return;
    const emptyEl = dock.querySelector('.dock-empty');
    if (emptyEl) emptyEl.remove();
    if (!dock.children.length) {
      dock.innerHTML = '<div class="dock-empty">暂无串口日志</div>';
    } else if (autoScroll && S.dockOpen) {
      dock.scrollTop = dock.scrollHeight;
    }
  }

  function setDockOpen(open) {
    S.dockOpen = !!open;
    const panel = $('#dockPanel');
    if (panel) panel.hidden = !S.dockOpen;
    const caret = $('#dockCaret');
    if (caret) caret.textContent = S.dockOpen ? '收起 ▼' : '展开 ▲';
    updateDock(true);
  }

  function clearLogs() {
    const term = $('#terminal');
    const dock = $('#dockList');
    const all = $('#logAll');
    if (term) term.innerHTML = '';
    if (dock) dock.innerHTML = '';
    if (all) all.innerHTML = '';
    S.logs = [];
    updateDock(false);
    updateLogStats();
  }


  async function boot() {
    const data = await call('get_boot');
    S.boot = data;
    S.config = data.config || {};
    if (!data || !data.config) {
      toast('后端数据获取失败，界面内容可能不完整', 'err');
    }
    if (data.instance) {
      toast('当前为独立实例 ' + data.instance + '：数据目录独立，串口配置为空。'
        + '关闭所有本程序窗口后重新打开，即可回到主实例（原有配置与收藏都在）。',
        'warn', 9000);
    }
    S.buttons = data.buttons || [];
    S.profiles = data.profiles || [];
    S.profileId = data.profile_id || '';
    S.maxLogs = (S.config.ui && S.config.ui.max_log_lines) || 2000;
    S.history = (data.history && data.history.length) ? data.history : S.history;

    S.logFilter.hex = !!(S.config.ui && S.config.ui.hex_view);
    const hexChk = $('#chkHexView');
    if (hexChk) hexChk.checked = S.logFilter.hex;

    const tsChk = $('#chkTimestamp');
    if (tsChk) tsChk.checked = !(S.config.ui && S.config.ui.timestamps === false);
    const asChk = $('#chkAutoScroll');
    if (asChk) asChk.checked = !(S.config.ui && S.config.ui.auto_scroll === false);

    callList('get_commands', {}).then((list) => { S.cmdSuggest = list || []; });

    for (const step of [applyTheme, applyTermFont, applyBrand,
                        renderProfilePickers, renderAll]) {
      try { step(); } catch (e) { console.error('boot step failed', step.name, e); }
    }
    startPoll();
    syncSerialUI();

    try {
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
        if (((S.config && S.config.ui && S.config.ui.theme) || 'dark') === 'auto') applyTheme();
      });
    } catch (e) {  }
    try {
      const hash = (location.hash || '').slice(1);
      if (hash && $('#page-' + hash)) goto(hash);
      else {
        const last = S.config && S.config.ui && S.config.ui.last_page;
        if (last && last !== 'home' && $('#page-' + last)) goto(last);
      }
    } catch (e) {  }
    setTimeout(() => {
      const sp = $('#splash');
      sp.classList.add('hide');
      setTimeout(() => { sp.style.display = 'none'; }, 520);
    }, 620);
  }


  function applyBrand() {
    const b = S.boot || {};
    const brand = b.brand || b.app || 'AT指令调试台';
    const ver = 'v' + (b.version || '1.0.0');
    document.title = brand;
    const set = (sel, text) => { const el = $(sel); if (el) el.textContent = text; };
    set('#brandName', brand);
    set('#brandVersion', ver);
    set('#splashTitle', brand);

    const intro = String(b.profile_intro || '').trim();
    set('#splashSub', intro || b.subtitle || '跨平台 AT 指令测试上位机');
    set('#sbVersion', ver + (b.profile_name ? ' · ' + b.profile_name : ''));
    set('#aboutSub', brand + ' · ' + (b.subtitle || '跨平台 AT 指令测试上位机'));
  }


  function renderAll() {
    const b = S.boot || {};
    $('#sbPlatform').textContent = b.platform || '-';
    $('#sbDataDir').textContent = b.data_dir || '';
    $('#dataDirText').textContent = '数据目录：' + (b.data_dir || '-');
    const pd = $('#profileDirText');
    if (pd) pd.textContent = '配置集目录：' + (b.profiles_dir || '-');
    $('#cmdCount').textContent = '共 ' + b.command_count + ' 条指令';
    $('#suiteCount').textContent = '共 ' + b.case_count + ' 个用例';
    const pc = $('#profileCount');
    if (pc) pc.textContent = S.profiles.length + ' 个配置集';
    renderSerialBar();
    renderDashboard();
    renderPresets();
    renderCmdCats();
    renderCommands();
    renderButtons();
    renderErrCodes();
    renderSuites();
    renderSettings();
    renderAbout();
    document.body.dataset.edit = (S.boot && S.boot.edit_mode) ? 'on' : 'off';
    window.renderIcons(document);
    syncPinStates();
  }


  function profileLabel(p) {
    return (p.name || p.id);
  }

  function renderProfilePickers() {
    const optionHtml = S.profiles.map((p) =>
      '<option value="' + esc(p.id) + '"' +
      (p.id === S.profileId ? ' selected' : '') + '>' +
      esc(profileLabel(p)) + '</option>').join('');

    const pick = $('#profilePicker');
    const sel = $('#selProfile');
    if (pick && sel) {

      pick.hidden = false;
      sel.innerHTML = optionHtml;
      sel.onchange = () => switchProfile(sel.value);
    }
    const ssel = $('#setSelProfile');
    if (ssel) {
      ssel.innerHTML = optionHtml ||
        '<option value="">（无可用配置集）</option>';
      ssel.onchange = () => switchProfile(ssel.value);
    }
    const hint = $('#setProfileHint');
    if (hint) {
      const cur = S.profiles.find((p) => p.id === S.profileId) || {};
      hint.textContent = cur.source === 'user'
        ? '用户配置集（可编辑、可删除）'
        : '内置配置集（可直接编辑，也可复制为自定义）';
    }
  }

  async function switchProfile(id) {
    if (!id || id === S.profileId) return;
    if (S.running) return toast('任务执行中，暂不能切换配置集', 'warn');
    const r = await call('switch_profile', { profile_id: id });
    if (!r || !r.ok) return toast((r && r.error) || '切换失败', 'err');
    await reloadAfterProfileChange();
    toast('已切换到「' + ((r.profile && r.profile.name) || id) + '」', 'ok');
  }

  async function reloadAfterProfileChange() {
    const data = await call('get_boot');
    S.boot = data;
    S.config = data.config || S.config;
    S.buttons = data.buttons || [];
    S.profiles = data.profiles || [];
    S.profileId = data.profile_id || '';
    S.preset = null;
    S.presetParams = {};
    S.selected = new Set();
    S.cmdCache = {};

    callList('get_commands', {}).then((list) => { S.cmdSuggest = list || []; });
    cmdCat = '';
    cmdKeyword = '';
    const search = $('#cmdSearch');
    if (search) search.value = '';
    $('#runPanel').hidden = true;
    $('#suitePanel').hidden = true;
    applyTheme();
    applyTermFont();
    applyBrand();
    renderProfilePickers();
    renderAll();
    try {
      const hash = (location.hash || '').slice(1);
      if (hash && $('#page-' + hash)) goto(hash);
      else {
        const last = S.config && S.config.ui && S.config.ui.last_page;
        if (last && last !== 'home' && $('#page-' + last)) goto(last);
      }
    } catch (e) {  }
  }


  function updatePinBtn() {
    const btn = $('#btnPin');
    if (btn) btn.classList.toggle('on',
      !!(S.config && S.config.window && S.config.window.topmost));
  }

  function applyTheme() {
    const ui = (S.config && S.config.ui) || {};
    let theme = ui.theme || 'dark';
    if (theme === 'auto') {
      theme = (window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
    }
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.accent = ui.accent || 'blue';
    applyCustomAccent(ui.accent_custom);
    document.documentElement.style.setProperty('--fs', (ui.font_size || 13) + 'px');
    document.documentElement.dataset.anim = ui.animation === false ? 'off' : 'on';
    const sc = parseFloat(ui.ui_scale);
    const scale = isFinite(sc) && sc >= 0.7 && sc <= 1.5 ? sc : 1.0;
    document.body.style.zoom = scale === 1.0 ? '' : String(scale);
    updatePinBtn();
  }


  function applyCustomAccent(hexRaw) {
    const root = document.documentElement;
    const hex = String(hexRaw || '').trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
      ['--accent', '--accent-2', '--accent-soft'].forEach((v) =>
        root.style.removeProperty(v));
      return;
    }
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const mix = (c) => Math.round(c + (255 - c) * 0.35);
    root.style.setProperty('--accent', hex);
    root.style.setProperty('--accent-2',
      'rgb(' + mix(r) + ',' + mix(g) + ',' + mix(b) + ')');
    root.style.setProperty('--accent-soft',
      'rgba(' + r + ',' + g + ',' + b + ',0.16)');
  }


  function applyTermFont() {
    const n = (S.config && S.config.ui && S.config.ui.term_font_size) || 13;
    ['#terminal', '#logAll'].forEach((sel) => {
      const el = $(sel);
      if (el) el.style.fontSize = n + 'px';
    });
  }


  // 标准 UART 波特率预设（110 ~ 2000000，外加大部分 WiFi/Combo 模组用到的高速率）。
  // 来自 Wikipedia / serialport crate / CH340 数据手册的常用档位。
  const BAUD_PRESETS = [
    110, 300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 28800, 38400,
    56000, 57600, 74880, 115200, 128000, 153600, 230400, 256000, 460800,
    500000, 576000, 921600, 1000000, 1152000, 1500000, 2000000,
    3000000, 4000000, 6000000
  ];
  const BAUD_MIN = 110, BAUD_MAX = 6000000;


  function readBaud() {
    const el = $('#selBaud');
    if (!el) return 9600;
    const n = parseInt(String(el.value).trim(), 10);
    if (!isFinite(n) || n < BAUD_MIN || n > BAUD_MAX) {
      toast('波特率需为 ' + BAUD_MIN + '~' + BAUD_MAX + ' 的数字，已还原', 'warn');
      el.value = String((S.config.serial || {}).baudrate || 9600);
      return null;
    }
    return n;
  }

  function renderSerialBar() {
    const bar = $('#serialBar');
    if (!bar) return;
    const ports = (S.boot && S.boot.ports) || [];
    const cur = (S.config.serial || {}).port || '';
    const baud = (S.config.serial || {}).baudrate || 9600;
    let opts = ports.map((p) => '<option value="' + esc(p.device) + '"' +
      (p.device === cur ? ' selected' : '') + '>' + esc(p.name) +
      (p.description ? ' — ' + esc(p.description.slice(0, 28)) : '') +
      '</option>').join('');
    if (cur && !ports.some((p) => p.device === cur)) {
      opts = '<option value="' + esc(cur) + '" selected>' + esc(cur) +
        '（未检测到）</option>' + opts;
    }
    const dlOpts = BAUD_PRESETS.slice();
    if (!dlOpts.includes(Number(baud))) dlOpts.push(Number(baud));
    dlOpts.sort((a, b) => a - b);
    bar.innerHTML =
      '<select class="mini-select" id="selPort" style="min-width:190px">' + opts + '</select>' +
      '<input class="mini-select" id="selBaud" list="baudList" inputmode="numeric" ' +
      'spellcheck="false" autocomplete="off" value="' + esc(String(baud)) + '" ' +
      'title="波特率：点箭头下拉选择，或直接输入自定义值（' + BAUD_MIN + '~' + BAUD_MAX + '，回车生效）">' +
      '<datalist id="baudList">' +
      dlOpts.map((b) => '<option value="' + b + '">').join('') +
      '</datalist>' +
      '<button style="transform: translateY(0)!important" class="ghost-btn" id="btnRefreshPorts" title="刷新端口">' +
      window.icon('refresh-cw') + '</button>' +
      '<button style="transform: translateY(0)!important" class="primary-btn" id="btnConnect">连接</button>' +
      '<button style="transform: translateY(0)!important" class="ghost-btn serial-pin" id="btnDTR" title="切换 DTR 引脚电平（部分模组需低电平才正常发送，高电平会复位/进 bootloader）"><span class="pin-label">DTR↓</span></button>' +
      '<button style="transform: translateY(0)!important" class="ghost-btn serial-pin" id="btnRTS" title="切换 RTS 引脚电平（部分模组用 RTS 进 bootloader）"><span class="pin-label">RTS↓</span></button>';
    window.refreshIcons(bar);
    $('#btnConnect').onclick = onConnect;
    $('#btnRefreshPorts').onclick = async () => {
      const r = await callList('list_ports');
      if (S.boot) S.boot.ports = r;
      renderSerialBar();
      toast('端口列表已刷新', 'ok');
    };

    const wirePin = (id, api) => {
      const b = $('#' + id);
      if (!b) return;
      b.onclick = async () => {
        if (!S.connected) return toast('请先连接串口', 'warn');
        const on = b.dataset.on !== '1';
        const r = await call(api, { state: on });
        if (r && r.ok) {
          b.dataset.on = on ? '1' : '0';
          const label = b.querySelector('.pin-label');
          const compact = b.querySelector('.pin-compact');
          const txt = (id === 'btnDTR' ? 'DTR' : 'RTS') + (on ? '↑' : '↓');
          if (label) label.textContent = txt;
          if (compact) compact.textContent = (id === 'btnDTR' ? 'D' : 'R') + (on ? '↑' : '↓');
          b.classList.toggle('pin-on', on);
          toast((id === 'btnDTR' ? 'DTR' : 'RTS') + (on ? ' 高电平' : ' 低电平'), 'info');
        } else if (r) {
          toast(r.error || '操作失败', 'err');
        }
      };
    };
    wirePin('btnDTR', 'set_dtr');
    wirePin('btnRTS', 'set_rts');
    const syncSerial = async () => {
      const port = $('#selPort') ? $('#selPort').value : '';
      const baud = readBaud();
      if (baud == null) return;
      const r = await call('save_config',
        { patch: { serial: { port: port, baudrate: baud } } }).catch(() => null);
      if (r && r.config) {
        S.config = r.config;
        syncSerialUI();
      }
      if (r && r.serial_applied) {
        const sa = r.serial_applied;
        if (sa.ok && (sa.applied || []).length) {
          toast(sa.reconnected ? '串口参数已应用，已自动重连' :
            '串口参数已即时生效：' + sa.applied.join(', '), 'ok');
        } else if (!sa.ok) {
          toast('串口参数应用失败：' + (sa.error || '未知错误'), 'err');
        }
      }
    };
    if ($('#selPort')) $('#selPort').addEventListener('change', syncSerial);
    if ($('#selBaud')) $('#selBaud').addEventListener('change', syncSerial);

    applyBusyUI();
  }

  async function onConnect() {
    const btn = $('#btnConnect');
    if (S.connected) {
      await call('disconnect');
      toast('已断开串口', 'info');
      return;
    }
    const port = $('#selPort') ? $('#selPort').value : '';
    const baud = readBaud();
    if (baud == null) return;
    btn.textContent = '连接中…';
    btn.disabled = true;
    const r = await call('connect', { port: port, baudrate: baud });
    btn.disabled = false;
    btn.textContent = '连接';
    if (r && r.ok) {
      toast('已连接 ' + (r.port || port), 'ok');
      const saved = await call('save_config',
        { patch: { serial: { port: r.port || port, baudrate: baud } } });
      if (saved && saved.config) S.config = saved.config;
      syncSerialUI();
    } else {
      toast('连接失败：' + ((r && r.error) || '未知错误'), 'err');
    }
  }


  let pollTimer = null;
  function startPoll() {

    if (S.polling) return;
    S.polling = true;

    const tick = async () => {
      let cost = 0;
      try { const t0 = performance.now(); await poll(); cost = performance.now() - t0; }
      catch (e) { console.error('poll tick error', e); }
      const busy = S.connected || S.running ||
        (S.progress && S.progress.active && !S.progress.finished);
      const delay = busy ? 120 : 400;
      const dynamic = Math.min(600, Math.max(80, Math.round(cost * 2)));
      pollTimer = setTimeout(tick, busy ? Math.max(80, delay - dynamic) : delay);
    };
    tick();
  }

  async function poll() {
    const d = await call('poll', S.pollSeq == null ? {} : { last_seq: S.pollSeq });
    if (!d) return;
    if (d.events && d.events.length) pushLogs(d.events);
    if (d.js && d.js.length) runJsTasks(d.js);
    if (typeof d.seq === 'number') S.pollSeq = d.seq;
    S.connected = !!(d.status && d.status.connected);
    updateConn(d.status);
    if (d.loop_send) syncLoopSend(d.loop_send);

    if (d.status && d.status.pins) {
      const p = d.status.pins;
      const upd = (id, v) => {
        const b = $('#' + id);
        if (!b) return;
        const on = !!v;
        b.dataset.on = on ? '1' : '0';
        const label = b.querySelector('.pin-label');
        const compact = b.querySelector('.pin-compact');
        const txt = (id === 'btnDTR' ? 'DTR' : 'RTS') + (on ? '↑' : '↓');
        if (label) label.textContent = txt;
        if (compact) compact.textContent = (id === 'btnDTR' ? 'D' : 'R') + (on ? '↑' : '↓');
        b.classList.toggle('pin-on', on);
      };
      if ('dtr' in p) upd('btnDTR', p.dtr);
      if ('rts' in p) upd('btnRTS', p.rts);
    }

    if (d.ports && d.ports.changed) {
      S.boot.ports = d.ports.list || [];
      renderSerialBar();
      (d.ports.added || []).forEach((p) =>
        toast('检测到新串口：' + p, 'ok'));
      (d.ports.removed || []).forEach((p) => {
        if (S.connected && d.status && d.status.port === p) {
          toast('串口 ' + p + ' 已拔出', 'err');
        } else {
          toast('串口已移除：' + p, 'warn');
        }
      });
    }
    if (d.progress) handleProgress(d.progress);
    S.running = !!d.running;
    const busy = !!d.busy || S.bulkRunning;
    if (busy !== S.busy) { S.busy = busy; applyBusyUI(); }
    else if (S.bulkRunning && !document.body.classList.contains('busy')) {
      applyBusyUI();
    }
    const b = $('#btnConnect');
    if (b) {
      b.textContent = S.connected ? '断开' : '连接';
      b.classList.toggle('ghost-btn', false);
    }
  }


  async   function runJsTasks(tasks) {
    for (const t of tasks) {
      let value = null, error = '';
      try {

        value = (0, eval)(t.script);

      } catch (e) {
        error = String(e && e.message || e);
      }
      try { await call('report_js', { tag: t.tag, value, error }); }
      catch (e) {  }
    }
  }


  function busyState() {
    return !!(S.bulkRunning || S.busy);
  }
  function applyBusyUI() {
    const busy = busyState();
    document.body.classList.toggle('busy', busy);
    ['cmdInput', 'btnSend', 'sendMode', 'chkAppendCRLF', 'btnConnect',
     'selPort', 'selBaud', 'btnRefreshPorts',
     'btnBulkRun', 'bulkText', 'bulkDelay', 'bulkStopErr',
     'btnPresetRun', 'btnRunSuite', 'btnLoopSend',
    ].forEach((id) => {
      const el = $('#' + id);
      if (el) el.disabled = busy;
    });

    $('#btnBulkStop') && ($('#btnBulkStop').disabled = !S.bulkRunning);
  }

  function updateConn(status) {
    const pill = $('#connPill');
    pill.classList.toggle('on', !!(status && status.connected));
    pill.querySelector('.conn-text').textContent =
      status && status.connected ? (status.port || '已连接') : '未连接';
    const sb = $('#sbPort');
    sb.textContent = status && status.connected
      ? (status.port + (status.virtual ? '（虚拟）' : '')) : '未连接';
    sb.classList.toggle('on', !!(status && status.connected));
    $('#sbBaud').textContent = status ? status.baudrate + ' baud' : '';

    const up = $('#sbUptime');
    if (up) {
      if (status && status.connected && status.connected_at) {
        const sec = Math.max(0, Math.floor(Date.now() / 1000 - status.connected_at));
        const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60),
          s = sec % 60;
        const two = (n) => String(n).padStart(2, '0');
        up.textContent = '⏱ ' + (h ? h + ':' + two(m) + ':' + two(s)
          : two(m) + ':' + two(s));
        up.hidden = false;
        const sep = $('#sbUptimeSep');
        if (sep) sep.hidden = false;
      } else {
        up.hidden = true;
        const sep = $('#sbUptimeSep');
        if (sep) sep.hidden = true;
      }
    }
    if (status && status.bytes_in != null) {

      const nowMs = Date.now();
      let rateText = '';
      const samp = S.byteSamp || (S.byteSamp = { t: 0, in: 0, out: 0 });
      if (samp.t && nowMs > samp.t &&
          status.bytes_in >= samp.in && status.bytes_out >= samp.out &&
          status.connected) {
        const dt = (nowMs - samp.t) / 1000;
        const rin = (status.bytes_in - samp.in) / dt;
        const rout = (status.bytes_out - samp.out) / dt;
        const fmt = (v) => v >= 1024
          ? (v / 1024).toFixed(1) + 'KB/s' : Math.round(v) + 'B/s';
        const parts = [];
        if (rin >= 1) parts.push('↓' + fmt(rin));
        if (rout >= 1) parts.push('↑' + fmt(rout));
        rateText = parts.length ? ' · ' + parts.join(' ') : '';
      }
      samp.t = nowMs;
      samp.in = status.bytes_in;
      samp.out = status.bytes_out;
      $('#sbBytes') && ($('#sbBytes').textContent =
        '↑' + status.bytes_out + ' ↓' + status.bytes_in + ' B' + rateText);
    }

    if (status && status.pins) {
      setPinBtn('#btnDTR', !!status.pins.dtr, 'DTR');
      setPinBtn('#btnRTS', !!status.pins.rts, 'RTS');
    }

    if (status && !status.connected) {
      if (S.sigTimer) { clearInterval(S.sigTimer); S.sigTimer = null;
        $('#sigPanel') && ($('#sigPanel').hidden = true);
        $('#btnSignal') && $('#btnSignal').classList.remove('pin-on'); }
      if (S.macro) { S.macro = null; setMacroBtn(false); }
    }
  }


  function handleProgress(p) {
    S.progress = p;
    if (!p || !p.kind) return;
    const isNew = (p.started_at !== S.lastStarted) || (p.kind !== S.lastKind);
    if (isNew) {
      S.lastStarted = p.started_at;
      S.lastKind = p.kind;
      S.seenItems = 0;
      if (p.kind === 'suite') {
        $('#suitePanel').hidden = false;
        $('#suiteTable').innerHTML = '';
        $('#suiteSummary').innerHTML = '';
      } else {
        $('#runPanel').hidden = false;
        $('#runList').innerHTML = '';
      }
    }
    const items = p.items || [];
    if (items.length !== S.seenItems) {
      for (let i = S.seenItems; i < items.length; i++) addProgressItem(items[i], p.kind);
      S.seenItems = items.length;
    }
    const total = p.total || 0;
    const done = p.done || 0;
    const pct = total ? Math.round(done / total * 100) : 0;
    if (p.kind === 'suite') {
      $('#suiteFill').style.width = pct + '%';
      $('#suiteText').textContent = done + ' / ' + total;
    } else {
      $('#runFill').style.width = pct + '%';
      $('#runText').textContent = done + ' / ' + total;
    }
    if (p.finished && p.summary) {

      const sumKey = p.kind + '|' + p.started_at;
      if (!S.seenSummary.has(sumKey)) {
        S.seenSummary.add(sumKey);
        if (S.seenSummary.size > 50) S.seenSummary = new Set(
          Array.from(S.seenSummary).slice(-20));
        S.lastResult = p.summary;
        renderSummary(p.summary, p.kind);
        const ok = p.summary.failed === 0;

        if (!ok) toast('执行完成：通过 ' + p.summary.passed + '/' + p.summary.total +
          '，失败 ' + p.summary.failed, 'warn');
        if (p.summary.baseline) {
          const b = p.summary.baseline;
          toast('基线对比：' + b.same + ' 一致 / ' + b.changed + ' 有差异',
            b.changed ? 'warn' : 'ok');
          showBaselineDiff(b);
        }
        refreshLastResult();
      }
    }
  }


  function respValues(item) {
    const st = String(item.status || '').trim();
    return (item.lines || []).map((l) => String(l).trim())
      .filter((l) => l && l !== st);
  }

  function addProgressItem(item, kind) {
    const list = kind === 'suite' ? $('#suiteTable') : $('#runList');
    if (kind === 'suite') {
      const table = $('#suiteTable');
      if (!table.querySelector('thead')) {
        table.innerHTML = '<thead><tr><th>#</th><th>用例</th><th>指令</th>' +
          '<th>返回值</th><th>结果</th><th>说明</th><th>耗时</th></tr></thead><tbody></tbody>';
      }
      const tb = table.querySelector('tbody');
      const tr = document.createElement('tr');
      const ok = item.ok;
      const badge = item.skipped ? '<span class="run-badge skip">跳过</span>'
        : ok ? '<span class="run-badge ok">通过</span>'
          : '<span class="run-badge fail">失败</span>';
      const resp = respValues(item);
      tr.innerHTML = '<td>' + (item.index || '') + '</td><td>' + esc(item.name || '') +
        '</td><td><code>' + esc(item.cmd || '') + '</code></td>' +
        '<td class="mono resp-cell">' +
        (resp.length ? esc(resp.join('\n')) : '<span class="dim">-</span>') +
        '</td><td>' + badge +
        '</td><td>' + esc(item.reason || '') + '</td><td>' +
        (item.duration || 0) + 's</td>';
      tb.appendChild(tr);
      table.parentElement.scrollTop = table.parentElement.scrollHeight;
      return;
    }
    const el = document.createElement('div');
    el.className = 'run-item ' + (item.ok ? 'ok' : 'fail');
    const resp = respValues(item);
    el.innerHTML = '<span class="run-badge ' + (item.ok ? 'ok' : 'fail') + '">' +
      (item.ok ? 'OK' : '失败') + '</span><span class="run-cmd">' +
      esc(item.cmd || '') + '</span>' +
      (item.label && item.label !== item.cmd ? '<span class="step-label">' +
        esc(item.label) + '</span>' : '') +
      '<span class="run-note">' + esc(item.error || item.status || item.note || '') +
      ' · ' + (item.duration || 0) + 's</span>' +
      (resp.length ? '<div class="run-resp"><span class="rr-label">返回</span>' +
        '<code>' + esc(resp.join('\n')) + '</code></div>' : '');
    list.appendChild(el);
    list.scrollTop = list.scrollHeight;
  }

  function renderSummary(sum, kind) {
    const box = kind === 'suite' ? $('#suiteSummary') : $('#lastResultBody');
    const rate = sum.total ? Math.round(sum.passed / sum.total * 100) : 0;
    box.innerHTML =
      '<div class="sum-pill">总计<b>' + sum.total + '</b></div>' +
      '<div class="sum-pill ok">通过<b>' + sum.passed + '</b></div>' +
      '<div class="sum-pill fail">失败<b>' + sum.failed + '</b></div>' +
      '<div class="sum-pill">跳过<b>' + (sum.skipped || 0) + '</b></div>' +
      '<div class="sum-pill">通过率<b>' + rate + '%</b></div>' +
      '<div class="sum-pill">耗时<b>' + (sum.duration || 0) + 's</b></div>';
  }

  async function refreshLastResult() {
    const r = await call('get_last_result');
    if (r) {
      $('#lastResultPanel').hidden = false;
      const sum = {
        total: r.total || 0, passed: r.passed || 0,
        failed: r.failed || 0, skipped: r.skipped || 0, duration: r.duration || 0,
      };
      renderSummary(sum, 'dash');

      const box = $('#lastResultBody');
      const results = r.results || [];
      if (!box || !results.length) return;
      const rows = results.map((it) => {
        const resp = respValues(it);
        const badge = it.skipped ? '<span class="run-badge skip">跳过</span>'
          : it.ok ? '<span class="run-badge ok">通过</span>'
            : '<span class="run-badge fail">失败</span>';
        return '<tr><td>' + esc(it.label || it.name || it.cmd || '') +
          '</td><td><code>' + esc(it.cmd || '') + '</code></td>' +
          '<td class="mono resp-cell">' +
          (resp.length ? esc(resp.join('\n')) : '<span class="dim">-</span>') +
          '</td><td>' + badge + '</td></tr>';
      }).join('');
      box.insertAdjacentHTML('beforeend',
        '<div class="result-table-wrap" style="margin-top:10px">' +
        '<table class="result-table"><thead><tr><th>步骤</th><th>指令</th>' +
        '<th>模组返回</th><th>结果</th></tr></thead><tbody>' + rows +
        '</tbody></table></div>');
    }
  }


  function renderDashboard() {
    const b = S.boot || {};
    const pinned = (b.home && b.home.pinned) || [];
    const stats = [
      { k: '指令总数', v: b.command_count || 0, acc: true },
      { k: '测试用例', v: b.case_count || 0 },
      { k: '场景模板', v: (b.presets || []).length },
      { k: '快速操作', v: pinned.length },
      { k: '常用功能', v: (S.buttons || []).length },
    ];
    $('#statRow').innerHTML = stats.map((s, i) =>
      '<div class="stat" style="animation-delay:' + (i * 60) + 'ms">' +
      '<div class="stat-k">' + esc(s.k) + '</div><div class="stat-v' +
      (s.acc ? ' acc' : '') + '">' + esc(s.v) + '</div></div>').join('');
    const intro = $('#profileIntro');
    if (intro) intro.textContent = (b.home && b.home.intro) || '';
    const httpChip = $('#httpChip');
    if (httpChip) {
      if (b.http_url) {
        httpChip.hidden = false;
        httpChip.dataset.url = b.http_url;
        httpChip.title = '点击复制访问链接';
        httpChip.innerHTML = '<span class="hc-ico">' + window.icon('server') +
          '</span>HTTP 服务：<span class="mono">' + esc(b.http_url) +
          '</span><span class="hc-copy">' + window.icon('copy') + '复制</span>';
        httpChip.onclick = async () => {
          const url = httpChip.dataset.url || '';
          if (!url) return;
          try {
            await navigator.clipboard.writeText(url);
            toast('链接已复制：' + url, 'ok');
          } catch (e) {
            copyText(url);
          }
          httpChip.classList.add('copied');
          setTimeout(() => httpChip.classList.remove('copied'), 1200);
        };
        window.refreshIcons(httpChip);
      } else {
        httpChip.hidden = true;
      }
    }
    renderQuickActions();
  }


  function renderQuickActions() {
    const home = (S.boot && S.boot.home) || {};
    const list = home.pinned || [];
    const grid = $('#quickGrid');
    if (!grid) return;
    if (!list.length) {
      grid.innerHTML = '<div class="dock-empty">还没有收藏任何快速操作。' +
        '去「一键配置 / 常用功能 / 测试套件」点卡片上的 ★ 即可钉到首页。</div>';
      return;
    }
    grid.innerHTML = list.map((a, i) =>
      '<div class="quick" data-ref="' + esc(a.ref) + '" style="animation-delay:' +
      (i * 40) + 'ms">' +
      '<span class="qi">' + window.icon(a.icon || 'bolt') + '</span>' +
      '<span class="qt">' + esc(a.name) + '</span>' +
      '<span class="qs">' + esc(a.sub || '') + '</span>' +
      '</div>').join('');
    $$('#quickGrid .quick').forEach((card) => {
      card.onclick = () => runPinned(card.dataset.ref);
    });
    window.renderIcons($('#quickGrid'));
  }

  async function runPinned(ref) {
    if (busyState()) return toast('有批量任务正在执行，请先等待完成或停止', 'warn');
    const r = await call('run_pinned', { ref: ref }).catch(() => null);
    if (!r) return toast('执行失败：无响应', 'err');
    if (r.need_params) {
      const parts = ref.split(':');
      if (parts[0] === 'preset') { goto('presets'); selectPreset(parts[1]); }
      return;
    }
    if (r.ok) {
      const name = ((S.boot.home && S.boot.home.pinned) || [])
        .find((p) => p.ref === ref);
      toast('开始执行：' + ((name && name.name) || '操作'), 'ok');
      const kind = ref.split(':')[0];
      goto(kind === 'preset' ? 'presets' : (kind === 'suite' ? 'suites' : 'terminal'));
    } else {
      toast(r.error || '执行失败', 'err');
    }
  }

  async function unpinItem(ref) {
    const [k, id] = ref.split(':');
    const r = await call('unpin_item', { kind: k, item_id: id }).catch(() => null);
    if (r && r.ok) {
      S.boot.home = r;
      renderQuickActions();
      syncPinStates();
      toast('已取消收藏', 'ok');
    } else {
      toast((r && r.error) || '取消收藏失败', 'err');
    }
  }

  async function pinItem(kind, id) {
    const r = await call('pin_item', { kind: kind, item_id: id }).catch(() => null);
    if (!r || !r.ok) return toast((r && r.error) || '收藏失败', 'err');
    S.boot.home = r;
    renderQuickActions();
    syncPinStates();
    toast('已钉到首页快速操作', 'ok');
  }


  function syncPinStates() {
    const home = (S.boot && S.boot.home) || {};
    const set = new Set((home.pinned || []).map((p) => p.kind + ':' + p.id));
    $$('[data-pinref]').forEach((el) => {
      const ref = el.dataset.pinref;
      const lit = set.has(ref);
      el.classList.toggle('pinned', lit);
      el.title = lit ? '取消收藏' : '钉到首页快速操作';
    });
  }



  function scriptHeader(title, desc) {
    return ['# ==============================================',
      '# ' + ((S.boot && S.boot.profile_name) || 'AT 模组') + ' · ' + title,
      '# 导出自 AT指令调试台 · ' + new Date().toLocaleString(),
      desc ? '# 说明：' + desc : null,
      '# 用法：逐行发送 AT 指令；# 开头为注释，WAIT 表示等待事件',
      '# ==============================================']
      .filter(Boolean).join('\r\n');
  }
  function buildPresetScript(p) {
    const lines = [scriptHeader('一键场景：' + p.name, p.desc)];
    if (p.fields && p.fields.length) {
      lines.push('', '# 本场景需要以下参数（替换指令中的 {key} 占位符）：');
      p.fields.forEach((f) => lines.push('#   {' + f.key + '}  ' + (f.label || '') +
        (f.default ? '，默认 ' + f.default : '')));
    }
    (p.steps || []).forEach((st, i) => {
      lines.push('', '# --- 步骤 ' + (i + 1) + ' ---');
      if (st.note) lines.push('# 注：' + st.note);
      if (st.expect) lines.push('# 期望：' + st.expect);
      lines.push(st.cmd);
      if (st.wait_event) lines.push('WAIT ' + st.wait_event);
    });
    return lines.join('\r\n') + '\r\n';
  }
  function buildSuiteScript(s) {
    const lines = [scriptHeader('测试套件：' + s.name + '（' + s.cases.length + ' 用例）', s.desc)];
    (s.cases || []).forEach((c, i) => {
      lines.push('', '# [用例 ' + (i + 1) + '] ' + c.name +
        (c.skip ? '（默认跳过）' : ''));
      if (c.note) lines.push('# 注：' + c.note);
      if (c.expect) lines.push('# 期望：' + c.expect);
      lines.push(c.cmd);
    });
    return lines.join('\r\n') + '\r\n';
  }
  function downloadText(fname, text) {
    const blob = new Blob(['\ufeff' + text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  }
  function exportPresetScript(id) {
    const p = ((S.boot && S.boot.presets) || []).find((x) => x.id === id);
    if (!p) return toast('找不到该场景', 'err');
    downloadText(((S.boot && S.boot.profile_id) || 'at') + '-' + id + '.at.txt',
      buildPresetScript(p));
    toast('已导出 AT 脚本：' + p.name, 'ok');
  }
  function exportSuiteScript(id) {
    const s = ((S.boot && S.boot.suites) || []).find((x) => x.id === id);
    if (!s) return toast('找不到该套件', 'err');
    downloadText(((S.boot && S.boot.profile_id) || 'at') + '-suite-' + id + '.at.txt',
      buildSuiteScript(s));
    toast('已导出 AT 脚本：' + s.name, 'ok');
  }

  function renderPresets() {
    const list = (S.boot && S.boot.presets) || [];
    $('#presetGrid').innerHTML = list.map((p, i) =>
      '<div class="preset-card' + (p.danger ? ' danger' : '') + '" data-id="' +
      esc(p.id) + '" data-accent="' + esc(p.accent || 'blue') + '" style="animation-delay:' +
      (i * 45) + 'ms">' +
      '<div class="pc-glow"></div>' +
      '<div class="pc-actions">' +
      '<button class="pin-btn" data-pinref="preset:' + esc(p.id) +
      '" title="钉到首页快速操作">' + window.icon('star') + '</button>' +
      '<button class="pin-btn" data-act="export" title="导出 AT 脚本（可回放文本）">' +
      window.icon('download') + '</button>' +
      '</div>' +
      '<div class="pc-tools edit-only">' +
      '<button data-act="edit" title="编辑">' + window.icon('edit') + '</button>' +
      '<button data-act="del" title="删除">' + window.icon('trash') + '</button>' +
      '</div>' +
      '<div class="pc-ico">' + window.icon(p.icon || 'bolt') + '</div><div class="pc-name">' +
      esc(p.name) + '</div><div class="pc-desc">' + esc(p.desc) + '</div></div>').join('');
    $$('#presetGrid .preset-card').forEach((card) => {
      const id = card.dataset.id;
      card.onclick = (e) => {
        if (e.target.closest('.pc-tools button') || e.target.closest('.pin-btn')) return;
        selectPreset(id);
      };
      const pin = card.querySelector('[data-pinref]');
      if (pin) pin.onclick = () => togglePin('preset', id);
      const expB = card.querySelector('[data-act="export"]');
      if (expB) expB.onclick = (e) => { e.stopPropagation(); exportPresetScript(id); };
      const editB = card.querySelector('[data-act="edit"]');
      if (editB) editB.onclick = () => editPreset(id);
      const delB = card.querySelector('[data-act="del"]');
      if (delB) delB.onclick = () => delPreset(id);
    });
    bindGridDnd($('#presetGrid'), '.preset-card', async (ids) => {
      const r = await call('reorder_presets', { ids: ids });
      if (r && r.ok) { S.boot.presets = r.presets; toast('已保存顺序', 'ok'); }
      else toast((r && r.error) || '保存顺序失败', 'err');
    });
    window.renderIcons($('#presetGrid'));
  }


  function bindGridDnd(container, itemSel, onCommit) {
    if (!container) return;
    const edit = (S.boot && S.boot.edit_mode);
    let dragEl = null;
    container.querySelectorAll(itemSel).forEach((el) => {
      el.draggable = !!edit;
      el.addEventListener('dragstart', (e) => {
        if (!edit) return;
        dragEl = el; el.classList.add('dragging');
        try { e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', el.dataset.id || ''); } catch (_) {}
      });
      el.addEventListener('dragend', () => {
        el.classList.remove('dragging'); dragEl = null;
      });
      el.addEventListener('dragover', (e) => {
        if (!edit || !dragEl || dragEl === el) return;
        e.preventDefault();
        const r = el.getBoundingClientRect();
        const after = (e.clientX - r.left) > r.width / 2;
        container.insertBefore(dragEl, after ? el.nextSibling : el);
      });
      el.addEventListener('drop', (e) => {
        if (!edit || !dragEl || dragEl === el) return;
        e.preventDefault();
        const ids = Array.from(container.querySelectorAll(itemSel))
          .map((x) => x.dataset.id).filter(Boolean);
        onCommit(ids);
      });
    });
  }

  async function togglePin(kind, id) {
    const lit = false;
    const set = new Set(((S.boot.home && S.boot.home.pinned) || [])
      .map((p) => p.kind + ':' + p.id));
    if (set.has(kind + ':' + id)) await unpinItem(kind + ':' + id);
    else await pinItem(kind, id);
  }

  async function delPreset(id) {
    const p = ((S.boot && S.boot.presets) || []).find((x) => x.id === id);
    modal('删除场景', '<p>确定删除「' + esc(p ? p.name : id) + '」？</p>',
      [{ text: '取消' }, {
        text: '删除', cls: 'primary-btn', onClick: async () => {
          const r = await call('delete_preset', { preset_id: id });
          if (!r || !r.ok) return toast((r && r.error) || '删除失败', 'err'), false;
          S.boot.presets = r.presets || S.boot.presets;
          renderPresets(); renderDashboard(); syncPinStates();
          toast('已删除', 'ok');
        },
      }]);
  }

  function editPreset(id) {
    const list = (S.boot && S.boot.presets) || [];
    const p = id ? list.find((x) => x.id === id) : null;
    const data = p ? JSON.parse(JSON.stringify(p)) : {
      id: '', name: '', desc: '', icon: 'rocket', accent: 'blue',
      danger: false, fields: [], steps: [],
    };
    const body =
      '<div class="form-grid">' +
      '<div class="field"><label>标识（英文/数字，唯一）</label>' +
      '<input class="inp" id="pId" value="' + esc(data.id) + '"' +
      (id ? ' disabled' : '') + '></div>' +
      '<div class="field"><label>名称</label><input class="inp" id="pName" value="' +
      esc(data.name) + '"></div>' +
      '<div class="field"><label>图标</label>' +
      '<button type="button" class="icon-pick-btn" id="pIcon">' +
      window.icon(data.icon) + '</button> <span class="hint" id="pIconName">' +
      esc(data.icon) + '</span></div>' +
      '<div class="field"><label>强调色</label><select class="sel" id="pAccent">' +
      ['blue', 'violet', 'teal', 'amber', 'rose'].map((c) =>
        '<option value="' + c + '"' + (c === data.accent ? ' selected' : '') +
        '>' + c + '</option>').join('') + '</select></div>' +
      '<div class="field field-wide"><label>描述</label><input class="inp" id="pDesc" value="' +
      esc(data.desc) + '"></div>' +
      '<div class="field"><label>危险操作</label><label class="switch">' +
      '<input type="checkbox" id="pDanger"' + (data.danger ? ' checked' : '') +
      '><span>擦除/复位类</span></label></div>' +
      '</div>' +
      '<div class="field" style="margin-top:10px"><label>参数定义（JSON 数组，可空）</label>' +
      '<textarea class="inp mono" id="pFields" rows="5" placeholder=\'[{"key":"deui","label":"DevEUI","type":"hex","size":8}]\'>' +
      esc(JSON.stringify(data.fields || [], null, 1)) + '</textarea>' +
      '<span class="hint">字段：key/label/type(text|number|select|bool|hex)/default/options/when/size</span></div>' +
      '<div class="field" style="margin-top:8px"><label>指令步骤（JSON 数组）</label>' +
      '<textarea class="inp mono" id="pSteps" rows="8" placeholder=\'[{"cmd":"AT+VER=?"}]\'>' +
      esc(JSON.stringify(data.steps || [], null, 1)) + '</textarea>' +
      '<span class="hint">支持 {参数} 占位符与 when 条件；每条：cmd/label/delay/wait_event/expect/note</span></div>';
    modal(id ? '编辑场景' : '新建场景', body, [
      { text: '取消' },
      {
        text: '保存', cls: 'primary-btn', onClick: async () => {
          const payload = {
            id: (id || $('#pId').value.trim()),
            name: $('#pName').value.trim() || '未命名',
            icon: data.icon, accent: $('#pAccent').value,
            desc: $('#pDesc').value.trim(), danger: $('#pDanger').checked,
          };
          try {
            payload.fields = JSON.parse($('#pFields').value || '[]');
            payload.steps = JSON.parse($('#pSteps').value || '[]');
          } catch (e) {
            toast('JSON 解析失败：' + e.message, 'err'); return false;
          }
          if (!payload.id) { toast('请填写标识', 'warn'); return false; }
          const r = id ? await call('update_preset', { preset_id: id, payload })
            : await call('add_preset', { payload });
          if (!r || !r.ok) return toast((r && r.error) || '保存失败', 'err'), false;
          S.boot.presets = r.presets || S.boot.presets;
          renderPresets(); renderDashboard(); syncPinStates();
          toast('已保存', 'ok');
        },
      },
    ]);
    const iconBtn = $('#pIcon');
    if (iconBtn) iconBtn.onclick = () => iconPicker(data.icon, (n) => {
      data.icon = n; iconBtn.innerHTML = window.icon(n);
      $('#pIconName').textContent = n; window.renderIcons(iconBtn);
    });
  }


  function iconPicker(current, onPick) {
    const names = (window.LUCIDE_ICONS || []).slice();
    const body =
      '<div class="icon-picker">' +
      '<input class="inp" id="ipSearch" placeholder="搜索图标，如 battery / wifi / rocket">' +
      '<div class="icon-grid" id="ipGrid"></div></div>';
    modal('选择图标', body, [{ text: '取消' }]);
    const grid = $('#ipGrid');
    const render = (filter) => {
      const kw = (filter || '').toLowerCase();
      const list = kw ? names.filter((n) => n.indexOf(kw) >= 0) : names;
      grid.innerHTML = list.map((n) =>
        '<button type="button" class="ic-cell' + (n === current ? ' on' : '') +
        '" data-n="' + esc(n) + '" title="' + esc(n) + '">' +
        window.icon(n) + '<span>' + esc(n) + '</span></button>').join('');
      $$('.ic-cell', grid).forEach((b) => {
        b.onclick = () => { onPick(b.dataset.n); closeModal(); };
      });
      window.renderIcons(grid);
    };
    render('');
    const s = $('#ipSearch');
    if (s) s.oninput = () => render(s.value);
    setTimeout(() => s && s.focus(), 30);
  }

  function selectPreset(id) {
    const p = ((S.boot && S.boot.presets) || []).find((x) => x.id === id);
    if (!p) return;
    S.preset = p;
    S.presetParams = {};
    (p.fields || []).forEach((f) => { S.presetParams[f.key] = f.default; });
    $$('#presetGrid .preset-card').forEach((c) =>
      c.classList.toggle('on', c.dataset.id === id));
    $('#presetPanel').hidden = false;
    $('#presetTitle').textContent = p.name;
    renderPresetForm();
    $('#stepsPreview').hidden = true;
    $('#presetPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderPresetForm() {
    const p = S.preset;
    if (!p) return;
    $('#presetForm').innerHTML = (p.fields || []).map(fieldHtml).join('');
    window.renderIcons($('#presetForm'));
    (p.fields || []).forEach(bindField);
  }

  function fieldHtml(f) {
    const v = S.presetParams[f.key];
    let inner = '';
    if (f.type === 'select') {
      inner = '<select class="sel" data-k="' + esc(f.key) + '">' +
        (f.options || []).map((o) => '<option value="' + esc(o.value) + '"' +
          (String(o.value) === String(v) ? ' selected' : '') + '>' +
          esc(o.label) + '</option>').join('') + '</select>';
    } else if (f.type === 'bool') {
      inner = '<label class="switch"><input type="checkbox" data-k="' +
        esc(f.key) + '"' + (v ? ' checked' : '') + '><span>启用</span></label>';
    } else if (f.type === 'textarea') {
      inner = '<textarea class="inp" rows="2" data-k="' + esc(f.key) + '">' +
        esc(v == null ? '' : v) + '</textarea>';
    } else if (f.type === 'int') {
      inner = '<input class="inp" type="number" data-k="' + esc(f.key) +
        '" value="' + esc(v == null ? '' : v) + '"' +
        (f.min != null ? ' min="' + f.min + '"' : '') +
        (f.max != null ? ' max="' + f.max + '"' : '') + '>';
    } else {
      inner = '<input class="inp" type="text" data-k="' + esc(f.key) +
        '" value="' + esc(v == null ? '' : v) + '"' +
        (f.type === 'hex' ? ' data-hex="' + f.size + '"' : '') + '>';
    }
    return '<div class="field"><label>' + esc(f.label) + '</label>' + inner +
      '<span class="hint" data-hint="' + esc(f.key) + '"></span></div>';
  }

  function bindField(f) {
    const el = $('#presetForm [data-k="' + f.key + '"]');
    if (!el) return;
    const handler = () => {
      if (el.type === 'checkbox') S.presetParams[f.key] = el.checked;
      else S.presetParams[f.key] = el.value;
      if (f.type === 'hex') validateHexField(el, f);
    };
    el.addEventListener('change', handler);
    el.addEventListener('input', handler);
  }

  function validateHexField(el, f) {
    const size = parseInt(el.dataset.hex || '16', 10);
    const raw = el.value.replace(/[^0-9A-Fa-f]/g, '');
    const hint = $('[data-hint="' + f.key + '"]');
    if (!raw) {
      el.classList.remove('ok'); el.classList.add('err');
      if (hint) hint.textContent = '不能为空';
      return false;
    }
    if (raw.length !== size * 2) {
      el.classList.remove('ok'); el.classList.add('err');
      if (hint) hint.textContent = '应为 ' + size + ' 字节（' + (size * 2) + ' 个十六进制字符）';
      return false;
    }
    el.classList.remove('err'); el.classList.add('ok');
    if (hint) hint.textContent = '✓ 格式正确';
    return true;
  }

  async function previewPreset() {
    if (!S.preset) return;
    const r = await call('preview_preset',
      { preset_id: S.preset.id, params: S.presetParams });
    const box = $('#stepsPreview');
    if (!r || !r.steps) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = '<div class="group-title">指令序列（' + r.count + ' 步）</div>' +
      r.steps.map((s, i) => '<div class="step-item" style="animation-delay:' +
        (i * 28) + 'ms"><span class="step-no">' + (i + 1) + '</span>' +
        '<span class="step-cmd">' + esc(s.cmd) + '</span>' +
        (s.label && s.label !== s.cmd ? '<span class="step-label">' +
          esc(s.label) + '</span>' : '') +
        (s.wait_event ? '<span class="step-label">等待事件 ' +
          s.wait_event + 's</span>' : '') + '</div>').join('');
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function runPreset() {
    if (!S.preset) return;
    if (!S.connected) return toast('请先连接串口', 'warn');
    if (S.preset.danger) {
      modal('危险操作确认',
        '<p>即将执行「' + esc(S.preset.name) + '」，该操作会擦除模组上下文并复位。确定继续？</p>',
        [{ text: '取消' },
         { text: '确认执行', cls: 'primary-btn', onClick: doRunPreset }]);
      return;
    }
    doRunPreset();
  }

  async function doRunPreset() {
    if (busyState()) return toast('有批量任务正在执行，请先等待完成或停止', 'warn');
    const r = await call('run_preset',
      { preset_id: S.preset.id, params: S.presetParams });
    if (r && r.ok) {
      toast('开始执行：' + S.preset.name, 'ok');
      $('#runPanel').hidden = false;
      $('#runPanel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      toast((r && r.error) || '执行失败', 'err');
    }
  }


  let cmdCat = '';
  let cmdKeyword = '';

  function renderCmdCats() {
    const cats = (S.boot && S.boot.categories) || [];
    $('#cmdCats').innerHTML = '<button class="chip" data-cat="">全部</button>' +
      cats.map((c) => '<button class="chip" data-cat="' + esc(c.id) + '">' +
        esc(c.name) + '</button>').join('');
    $$('#cmdCats .chip').forEach((c) => {
      c.onclick = () => {
        cmdCat = c.dataset.cat;
        $$('#cmdCats .chip').forEach((x) => x.classList.toggle('on', x === c));
        renderCommands();
      };
    });
    syncCmdCatChips();
  }

  function syncCmdCatChips() {
    $$('#cmdCats .chip').forEach((x) =>
      x.classList.toggle('on', (x.dataset.cat || '') === cmdCat));
  }

  async function renderCommands() {
    const cmds = await callList('get_commands',
      { category: cmdCat, keyword: cmdKeyword });
    $('#cmdList').innerHTML = cmds.length ? cmds.map((c, i) => {
      const modes = (c.modes || []);
      return '<div class="cmd-card" draggable="true" data-id="' + esc(c.id) +
        '" data-cat="' + esc(c.category || '') + '" style="animation-delay:' + (i * 22) + 'ms">' +
        '<div class="cmd-top"><span class="cmd-name">' + esc(c.name) +
        '</span><span class="cmd-cat">' + esc(catName(c.category)) + '</span>' +
        (c.dangerous ? '<span class="cmd-cat" style="color:var(--err)">危险</span>' : '') +
        '<span class="cmd-tools edit-only">' +
        '<button data-act="edit" title="编辑">' + window.icon('edit') + '</button>' +
        '<button data-act="del" title="删除">' + window.icon('trash') + '</button>' +
        '</span></div><div class="cmd-sum">' + esc(c.summary) + '</div>' +
        '<div class="cmd-detail" data-detail="' + esc(c.id) + '"></div></div>';
    }).join('') : '<div class="empty">没有匹配的指令</div>';
    $$('#cmdList .cmd-card').forEach((card) => {
      const id = card.dataset.id;
      const top = card.querySelector('.cmd-top');
      top.onclick = (e) => {
        if (e.target.closest('.cmd-tools button')) return;
        toggleCmd(card);
      };
      const eb = card.querySelector('[data-act="edit"]');
      if (eb) eb.onclick = (e) => { e.stopPropagation(); editCommand(id); };
      const db = card.querySelector('[data-act="del"]');
      if (db) db.onclick = (e) => { e.stopPropagation(); delCommand(id); };
    });
    bindCmdDnd();
    window.renderIcons($('#cmdList'));
  }


  function bindCmdDnd() {
    const edit = (S.boot && S.boot.edit_mode);
    let dragEl = null;
    const list = $('#cmdList');
    list.querySelectorAll('.cmd-card').forEach((el) => {
      el.draggable = !!edit;
      el.addEventListener('dragstart', (e) => {
        if (!edit) return;
        dragEl = el; el.classList.add('dragging');
        try { e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', el.dataset.id); } catch (_) {}
      });
      el.addEventListener('dragend', () => {
        el.classList.remove('dragging'); dragEl = null;
        $$('#cmdCats .chip').forEach((c) => c.classList.remove('drag-over'));
      });
      el.addEventListener('dragover', (e) => {
        if (!edit || !dragEl || dragEl === el) return;
        if (dragEl.dataset.cat !== el.dataset.cat) return;
        e.preventDefault();
        const r = el.getBoundingClientRect();
        const after = (e.clientY - r.top) > r.height / 2;
        list.insertBefore(dragEl, after ? el.nextSibling : el);
      });
      el.addEventListener('drop', async (e) => {
        if (!edit || !dragEl || dragEl === el) return;
        e.preventDefault();
        await persistCmdOrder();
      });
    });
    $$('#cmdCats .chip').forEach((chip) => {
      chip.addEventListener('dragover', (e) => {
        if (edit && dragEl) { e.preventDefault(); chip.classList.add('drag-over'); }
      });
      chip.addEventListener('dragleave', () => chip.classList.remove('drag-over'));
      chip.addEventListener('drop', async (e) => {
        if (!edit || !dragEl) return;
        e.preventDefault();
        chip.classList.remove('drag-over');
        const targetCat = chip.dataset.cat || '';
        if ((dragEl.dataset.cat || '') === targetCat) return;
        const r = await call('update_command', {
          cmd_id: dragEl.dataset.id,
          payload: { category: targetCat },
        });
        if (r && r.ok) {
          toast('已移动到「' + (catName(targetCat) || '未分类') + '」', 'ok');
          renderCommands();
        } else toast((r && r.error) || '移动失败', 'err');
      });
    });
  }

  async function persistCmdOrder() {
    const ids = $$('#cmdList .cmd-card').map((el) => el.dataset.id);
    const r = await call('reorder_commands', { ids: ids });
    if (r && r.ok) toast('已保存顺序', 'ok');
    else toast((r && r.error) || '保存顺序失败', 'err');
  }

  async function delCommand(id) {
    modal('删除指令', '<p>确定删除指令「' + esc(id) + '」？</p>',
      [{ text: '取消' }, {
        text: '删除', cls: 'primary-btn', onClick: async () => {
          const r = await call('delete_command', { cmd_id: id });
          if (!r || !r.ok) return toast((r && r.error) || '删除失败', 'err'), false;
          toast('已删除', 'ok');
          renderCommands(); renderDashboard();
        },
      }]);
  }

  async function editCommand(id) {
    let c = null;
    if (id) {
      const list = await callList('get_commands', { keyword: id });
      c = (list || []).find((x) => x.id === id) || null;
    }
    const data = c ? JSON.parse(JSON.stringify(c)) : {
      id: '', name: '', category: 'general', summary: '', desc: '',
      modes: ['run'], params: [], results: [], example: [], delay: 0.3,
    };
    const cats = (S.boot && S.boot.categories) || [];
    const catField = catPickerField('分类', cats, data.category, 'cCat');
    const body =
      '<div class="form-grid">' +
      '<div class="field"><label>指令 ID（英文，唯一）</label><input class="inp" id="cId" value="' +
      esc(data.id) + '"' + (id ? ' disabled' : '') + '></div>' +
      '<div class="field"><label>名称/别名</label><input class="inp" id="cName" value="' +
      esc(data.name) + '"></div>' +
      catField.html +
      '<div class="field field-wide"><label>一句话说明</label><input class="inp" id="cSum" value="' +
      esc(data.summary) + '"></div>' +
      '<div class="field field-wide"><label>详细描述</label><textarea class="inp" id="cDesc" rows="3">' +
      esc(data.desc) + '</textarea></div>' +
      '<div class="field"><label>模式（逗号分隔：set/get/run/help）</label><input class="inp" id="cModes" value="' +
      esc((data.modes || []).join(',')) + '"></div>' +
      '<div class="field"><label>指令间隔（秒）</label><input class="inp" id="cDelay" type="number" step="0.05" value="' +
      esc(data.delay) + '"></div>' +
      '</div>' +
      '<div class="field" style="margin-top:10px"><label>参数定义（JSON 数组）</label>' +
      '<textarea class="inp mono" id="cParams" rows="4" placeholder=\'[{"name":"value","desc":"值","type":"text"}]\'>' +
      esc(JSON.stringify(data.params || [], null, 1)) + '</textarea></div>' +
      '<div class="field" style="margin-top:8px"><label>示例（JSON 数组）</label>' +
      '<textarea class="inp mono" id="cExample" rows="3" placeholder=\'["AT+VER=?"]\'>' +
      esc(JSON.stringify(data.example || [], null, 1)) + '</textarea></div>' +
      '<div class="field" style="margin-top:8px"><label>可能返回（JSON 数组）</label>' +
      '<textarea class="inp mono" id="cResults" rows="3">' +
      esc(JSON.stringify(data.results || [], null, 1)) + '</textarea></div>';
    modal(id ? '编辑指令' : '新建指令', body, [
      { text: '取消' },
      {
        text: '保存', cls: 'primary-btn', onClick: async () => {
          const payload = {
            id: (id || $('#cId').value.trim()).toUpperCase(),
            name: $('#cName').value.trim() || $('#cId').value.trim(),
            category: catField.get(),
            summary: $('#cSum').value.trim(),
            desc: $('#cDesc').value.trim(),
            modes: $('#cModes').value.split(',').map((s) => s.trim()).filter(Boolean),
            delay: parseFloat($('#cDelay').value) || 0.3,
          };
          try {
            payload.params = JSON.parse($('#cParams').value || '[]');
            payload.example = JSON.parse($('#cExample').value || '[]');
            payload.results = JSON.parse($('#cResults').value || '[]');
          } catch (e) { toast('JSON 解析失败：' + e.message, 'err'); return false; }
          if (!payload.id) { toast('请填写指令 ID', 'warn'); return false; }
          const r = id ? await call('update_command', { cmd_id: id, payload })
            : await call('add_command', { payload });
          if (!r || !r.ok) return toast((r && r.error) || '保存失败', 'err'), false;
          toast('已保存', 'ok'); renderCommands(); renderDashboard();
        },
      },
    ]);
    catField.bind($('#modalBody'));
  }

  function catName(id) {
    const c = ((S.boot && S.boot.categories) || []).find((x) => x.id === id);
    return c ? c.name : id;
  }


  function catPickerField(label, existing, current, fieldId) {
    const fid = fieldId || 'catPick';
    const cur = current || (existing[0] || '');
    const isKnown = existing.some((v) => (v.id || v) === cur);
    const options = existing.map((v) => {
      const id = v.id || v, name = v.name || v;
      return '<option value="' + esc(id) + '"' +
        (id === cur ? ' selected' : '') + '>' + esc(name) + '</option>';
    });
    const html =
      '<div class="field"><label>' + esc(label) + '</label>' +
      '<select class="sel" id="' + fid + '" style="display:' +
      (isKnown || !cur ? '' : 'none') + '">' + options +
      '<option value="__custom__"' + (!isKnown && cur ? ' selected' : '') +
      '>＋ 自定义…</option></select>' +
      '<input class="inp" id="' + fid + 'Custom" placeholder="输入新分类名称，回车确认" ' +
      'style="display:' + (isKnown || !cur ? 'none' : '') + '" value="' +
      (isKnown ? '' : esc(cur)) + '">' +
      '</div>';
    return {
      html: html,
      get: () => {
        const sel = document.getElementById(fid);
        const inp = document.getElementById(fid + 'Custom');
        if (sel && sel.value === '__custom__') {
          return (inp && inp.value.trim()) || (existing[0] || '').id || '';
        }
        return sel ? sel.value : '';
      },
      bind: (root) => {
        const sel = root ? root.querySelector('#' + fid) :
          document.getElementById(fid);
        if (!sel) return;
        sel.onchange = () => {
          const inp = document.getElementById(fid + 'Custom');
          const custom = sel.value === '__custom__';
          if (inp) inp.style.display = custom ? '' : 'none';
          if (sel) sel.style.display = custom ? 'none' : '';
          if (custom && inp) inp.focus();
        };
      },
    };
  }

  function toggleCmd(card) {
    const id = card.dataset.id;
    const box = card.querySelector('.cmd-detail');
    if (card.classList.contains('open')) {
      card.classList.remove('open');
      return;
    }
    $$('#cmdList .cmd-card.open').forEach((c) => c.classList.remove('open'));
    card.classList.add('open');
    if (box.dataset.loaded === '1') return;
    callList('get_commands', { keyword: id }).then((list) => {
      const c = (list || []).find((x) => x.id === id) || { id: id };
      box.innerHTML = renderCmdDetail(c);
      box.dataset.loaded = '1';
      window.renderIcons(box);
      bindCmdActions(box, c);
    });
  }

  function renderCmdDetail(c) {
    const params = c.params || [];
    let html = '<div class="cmd-desc">' + esc(c.desc || '') + '</div>';
    if (params.length) {
      html += params.map((p) => {
        let input = '';
        if (p.type === 'choice') {
          input = '<select class="sel" data-p="' + esc(p.name) + '">' +
            (p.choices || []).map((o) => '<option value="' + esc(o) + '"' +
              (String(o) === String(p.default) ? ' selected' : '') + '>' +
              esc(o) + '</option>').join('') + '</select>';
        } else {
          input = '<input class="inp" type="text" data-p="' + esc(p.name) +
            '" value="' + esc(p.default == null ? '' : p.default) + '">';
        }
        return '<div class="param-row"><div class="field" style="flex:2">' +
          '<label>' + esc(p.desc || p.name) + '</label>' + input +
          '<span class="hint" data-ph="' + esc(p.name) + '"></span></div></div>';
      }).join('');
    }
    html += '<div class="cmd-code">示例：' + esc((c.example || []).join('  →  ')) + '</div>';
    if ((c.results || []).length) {
      html += '<div class="cmd-meta">返回：' + esc((c.results || []).join(' / ')) + '</div>';
    }
    html += '<div class="cmd-actions"></div>';
    return html;
  }

  function bindCmdActions(box, c) {
    const acts = box.querySelector('.cmd-actions');
    const modes = c.modes || [];
    const buttons = [];
    if (modes.indexOf('set') >= 0 || (c.params || []).length) {
      buttons.push({ text: '设置（写入）', mode: 'set' });
    }
    if (modes.indexOf('get') >= 0) buttons.push({ text: '读取', mode: 'get' });
    if (modes.indexOf('run') >= 0) buttons.push({ text: '执行', mode: 'run' });
    buttons.push({ text: '帮助', mode: 'help' });
    acts.innerHTML = buttons.map((b) => '<button class="ghost-btn" data-mode="' +
      b.mode + '">' + b.text + '</button>').join('') +
      '<button class="ghost-btn" data-mode="copy">复制</button>';
    $$('button[data-mode]', acts).forEach((btn) => {
      btn.onclick = async () => {
        const mode = btn.dataset.mode;
        let value = '';
        const fields = $$('input[data-p], select[data-p]', box);
        if (fields.length) {
          value = fields.map((el) => String(el.value == null ? '' : el.value).trim())
            .filter((v) => v !== '').join(',');
        }
        if (mode === 'copy') {
          const r = await call('build_command_preview',
            { cmd_id: c.id, value: value, mode: modes.indexOf('set') >= 0 ? 'auto' : 'get' });
          copyText(r.cmd || c.id);
          return;
        }
        let cmd = '';
        if (mode === 'set') {
          const r = await call('build_command_preview',
            { cmd_id: c.id, value: value, mode: 'auto' });
          cmd = r.cmd;
          const v = await call('validate_command', { cmd_id: c.id, value: value });
          if (v && v.ok === false && (c.params || []).length) {
            toast('参数校验失败：' + (v.message || ''), 'err');
            const hint = box.querySelector('[data-ph]');
            if (hint) hint.textContent = v.message || '';
            if (fields.length) fields.forEach((el) => el.classList.add('err'));
            return;
          }
        } else {
          const r = await call('build_command_preview', { cmd_id: c.id, mode: mode });
          cmd = r.cmd;
        }
        if (c.dangerous) {
          modal('确认发送', '<p>该指令可能导致模组复位或擦除上下文：</p>' +
            '<div class="cmd-code">' + esc(cmd) + '</div>',
            [{ text: '取消' }, {
              text: '发送', cls: 'primary-btn',
              onClick: () => doSend(cmd),
            }]);
          return;
        }
        doSend(cmd);
      };
    });
  }

  async function doSend(cmd, opts) {
    if (!S.connected) return toast('请先连接串口', 'warn');
    const r = await call('send_command', Object.assign({ cmd: cmd }, opts || {}));
    const rtt = r && r.duration != null ? Math.round(r.duration * 1000) : null;
    if (r && r.ok) {
      toast('已发送：' + cmd + ' → ' + (r.status || 'OK') +
        (rtt != null && rtt > 0 ? '（' + rtt + ' ms）' : ''), 'ok');
    } else {
      toast('发送失败：' + ((r && (r.error || r.status)) || '超时') +
        (rtt != null && rtt > 0 ? '（' + rtt + ' ms）' : ''), 'err');
      if (r && r.hint) setTimeout(() => toast(r.hint, 'warn', 9000), 350);
    }
    return r;
  }

  function copyText(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      toast('已复制：' + text, 'ok');
    } catch (e) {
      toast('复制失败', 'err');
    }
  }


  function renderButtons() {
    const groups = {};
    (S.buttons || []).forEach((b) => {
      const g = b.group || '未分组';
      (groups[g] = groups[g] || []).push(b);
    });
    const keys = Object.keys(groups);
    $('#btnGroups').innerHTML = keys.length ? keys.map((g) =>
      '<div class="btn-group-block" data-group="' + esc(g) + '"><div class="group-title">' +
      '<span class="grip" draggable="false">' + window.icon('grip-vertical') + '</span>' +
      esc(g) + ' · ' + groups[g].length + '</div><div class="btn-grid">' +
      groups[g].map((b, i) => {
        const cmds = (b.commands || []).join(' ; ');
        return '<div class="ubtn" draggable="true" data-id="' + esc(b.id) +
          '" data-group="' + esc(g) + '" data-color="' +
          esc(b.color || 'blue') + '" style="animation-delay:' + (i * 40) + 'ms">' +
          '<div class="ub-run"></div>' +
          '<button class="pin-btn" data-pinref="button:' + esc(b.id) +
          '" title="钉到首页快速操作">' + window.icon('star') + '</button>' +
          '<div class="ub-ico">' +
          window.icon(b.icon || 'bolt') + '</div><div class="ub-name">' +
          esc(b.name) + '</div><div class="ub-cmds" title="' + esc(cmds) + '">' +
          esc(cmds || '（无指令）') + '</div><div class="ub-tools edit-only">' +
          '<button data-act="edit" title="编辑">' + window.icon('edit') + '</button>' +
          '<button data-act="copy" title="复制">' + window.icon('copy') + '</button>' +
          '<button data-act="del" title="删除">' + window.icon('trash') + '</button>' +
          '</div></div>';
      }).join('') + '</div></div>').join('')
      : '<div class="empty">还没有按钮，点击右上角「新建按钮」添加</div>';
    window.renderIcons($('#btnGroups'));
    $$('#btnGroups .ubtn').forEach((el) => {
      el.onclick = (e) => {
        const tool = e.target.closest('.ub-tools button');
        const pin = e.target.closest('.pin-btn');
        const id = el.dataset.id;
        if (pin) { e.stopPropagation(); togglePin('button', id); return; }
        if (tool) {
          e.stopPropagation();
          const act = tool.dataset.act;
          if (act === 'edit') editButton(id);
          if (act === 'del') delButton(id);
          if (act === 'copy') dupButton(id);
          return;
        }
        runButton(id, el);
      };
    });
    bindButtonsDnd();
  }


  function bindButtonsDnd() {
    const edit = (S.boot && S.boot.edit_mode);
    let dragBtn = null;
    $$('#btnGroups .ubtn').forEach((el) => {
      el.draggable = !!edit;
      el.addEventListener('dragstart', (e) => {
        if (!edit) return;
        dragBtn = el; el.classList.add('dragging');
        try { e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', el.dataset.id); } catch (_) {}
      });
      el.addEventListener('dragend', () => {
        el.classList.remove('dragging'); dragBtn = null;
        $$('#btnGroups .btn-group-block').forEach((b) => b.classList.remove('drag-over'));
      });
      el.addEventListener('dragover', (e) => {
        if (!edit || !dragBtn || dragBtn === el) return;
        if (dragBtn.dataset.group !== el.dataset.group) return;
        e.preventDefault();
        const r = el.getBoundingClientRect();
        const after = (e.clientY - r.top) > r.height / 2;
        el.parentNode.insertBefore(dragBtn, after ? el.nextSibling : el);
      });
      el.addEventListener('drop', async (e) => {
        if (!edit || !dragBtn || dragBtn === el) return;
        e.preventDefault();
        await persistButtonOrder(el.dataset.group);
      });
    });
    $$('#btnGroups .btn-group-block').forEach((block) => {
      block.addEventListener('dragover', (e) => {
        if (edit && dragBtn) { e.preventDefault(); block.classList.add('drag-over'); }
      });
      block.addEventListener('dragleave', () => block.classList.remove('drag-over'));
      block.addEventListener('drop', async (e) => {
        if (!edit || !dragBtn) return;
        e.preventDefault();
        block.classList.remove('drag-over');
        const targetGroup = block.dataset.group;
        if (dragBtn.dataset.group === targetGroup) {
          await persistButtonOrder(targetGroup);
          return;
        }
        const r = await call('set_button_group',
          { button_id: dragBtn.dataset.id, group: targetGroup });
        if (r && r.ok) {
          S.buttons = r.buttons || S.buttons;
          renderButtons();
          toast('已移动到「' + targetGroup + '」', 'ok');
        } else toast((r && r.error) || '移动失败', 'err');
      });
    });
  }

  async function persistButtonOrder(group) {
    const ids = [];
    $$('#btnGroups .btn-group-block').forEach((block) => {
      if (block.dataset.group !== group) return;
      block.querySelectorAll('.ubtn').forEach((el) => ids.push(el.dataset.id));
    });
    const r = await call('reorder_buttons', { ids: ids });
    if (r && r.ok) {
      S.buttons = r.buttons || S.buttons;
      toast('已保存顺序', 'ok');
    } else toast((r && r.error) || '保存顺序失败', 'err');
  }

  async function runButton(id, el) {
    if (!S.connected) return toast('请先连接串口', 'warn');
    if (el) el.classList.add('running');
    const r = await call('run_button', { button_id: id, ctx: {} });
    setTimeout(() => el && el.classList.remove('running'), 1200);
    if (r && r.ok) {
      toast('开始执行按钮指令', 'ok');
      goto('presets');
    } else {
      toast((r && r.error) || '执行失败', 'err');
    }
  }

  async function moveButton(id, dir) {
    await call('move_button', { button_id: id, direction: dir });
    S.buttons = await callList('get_buttons');
    renderButtons();
  }

  async function dupButton(id) {
    await call('duplicate_button', { button_id: id });
    S.buttons = await callList('get_buttons');
    renderButtons();
    renderDashboard();
    toast('已复制按钮', 'ok');
  }

  async function delButton(id) {
    const b = (S.buttons || []).find((x) => x.id === id);
    modal('删除按钮', '<p>确定删除「' + esc(b ? b.name : id) + '」？</p>',
      [{ text: '取消' }, {
        text: '删除', cls: 'primary-btn', onClick: async () => {
          await call('delete_button', { button_id: id });
          S.buttons = await callList('get_buttons');
          renderButtons();
          renderDashboard();
          toast('已删除', 'ok');
        },
      }]);
  }

  const COLOR_CHOICES = [
    { v: 'blue', n: '蓝' }, { v: 'violet', n: '紫' }, { v: 'teal', n: '青' },
    { v: 'amber', n: '橙' }, { v: 'rose', n: '粉' },
  ];

  function editButton(id) {
    const b = id ? (S.buttons || []).find((x) => x.id === id) : null;
    const data = b ? Object.assign({}, b) : {
      name: '', icon: 'bolt', color: 'blue', group: '自定义',
      commands: ['AT'], delay: 0.35, note: '',
    };
    const existingGroups = Array.from(new Set((S.buttons || [])
      .map((b) => b.group || '未分组'))).map((g) => ({ id: g, name: g }));
    const groupField = catPickerField('分组', existingGroups,
      data.group || '自定义', 'bGroupPick');
    const body =
      '<div class="form-grid">' +
      '<div class="field"><label>名称</label><input class="inp" id="bName" value="' +
      esc(data.name) + '" placeholder="例如：读取电量"></div>' +
      groupField.html +
      '<div class="field"><label>图标</label>' +
      '<button type="button" class="icon-pick-btn" id="bIcon">' +
      window.icon(data.icon) + '</button> <span class="hint" id="bIconName">' +
      esc(data.icon) + '</span></div>' +
      '<div class="field"><label>颜色</label><select class="sel" id="bColor">' +
      COLOR_CHOICES.map((c) => '<option value="' + c.v + '"' +
        (c.v === data.color ? ' selected' : '') + '>' + c.n + '</option>').join('') +
      '</select></div>' +
      '<div class="field"><label>指令间隔（秒）</label><input class="inp" id="bDelay" type="number" step="0.05" min="0" value="' +
      esc(data.delay) + '"></div>' +
      '<div class="field"><label>备注</label><input class="inp" id="bNote" value="' +
      esc(data.note) + '"></div>' +
      '</div>' +
      '<div class="field" style="margin-top:12px"><label>指令序列（每行一条，支持 {变量} 占位符）</label>' +
      '<textarea class="inp" id="bCmds" rows="5" placeholder="AT+VER=?&#10;AT+BAT=?">' +
      esc((data.commands || []).join('\n')) + '</textarea>' +
      '<span class="hint">常用变量：{port} {payload} {deui}，执行时可在调用处传入</span></div>';

    modal(id ? '编辑按钮' : '新建按钮', body, [
      { text: '取消' },
      {
        text: '保存', cls: 'primary-btn', onClick: async () => {
          const payload = {
            name: $('#bName').value.trim() || '未命名',
            icon: data.icon || 'bolt',
            color: $('#bColor').value,
            group: groupField.get() || '自定义',
            delay: parseFloat($('#bDelay').value) || 0.35,
            note: $('#bNote').value,
            commands: $('#bCmds').value.split('\n'),
          };
          if (id) await call('update_button', { button_id: id, payload: payload });
          else await call('add_button', { payload: payload });
          S.buttons = await callList('get_buttons');
          renderButtons();
          renderDashboard();
          toast('已保存', 'ok');
        },
      },
    ]);
    groupField.bind($('#modalBody'));
    const iconBtn = $('#bIcon');
    if (iconBtn) iconBtn.onclick = () => iconPicker(data.icon, (n) => {
      data.icon = n; iconBtn.innerHTML = window.icon(n);
      $('#bIconName').textContent = n; window.renderIcons(iconBtn);
    });
  }


  function renderSuites() {
    const suites = (S.boot && S.boot.suites) || [];
    const edit = (S.boot && S.boot.edit_mode);
    S.selected = new Set();
    suites.forEach((s) => s.cases.forEach((c) => {
      if (!c.skip && !c.dangerous) S.selected.add(c.id);
    }));
    $('#suiteList').innerHTML = suites.map((s, i) =>
      '<div class="panel" data-suite="' + esc(s.id) + '" style="animation-delay:' + (i * 50) + 'ms">' +
      '<div class="panel-head"><span class="nav-ico">' + window.icon(s.icon || 'check') +
      '</span><h3>' + esc(s.name) + '</h3><span class="cmd-cat">' +
      s.cases.length + ' 个用例</span><div class="head-actions">' +
      '<button class="ghost-btn" data-sel="' + esc(s.id) + '">全选本组</button>' +
      '<button class="ghost-btn" data-clr="' + esc(s.id) + '">清空本组</button>' +
      '<button class="ghost-btn" data-exp="' + esc(s.id) + '" title="导出为可回放的 AT 脚本文本">' +
      window.icon('download') + '导出脚本</button>' +
      '</div><div class="suite-tools edit-only">' +
      '<button class="pin-btn" data-pinref="suite:' + esc(s.id) +
      '" title="钉到首页快速操作">' + window.icon('star') + '</button>' +
      '<button data-act="edit" title="编辑">' + window.icon('edit') + '</button>' +
      '<button data-act="del" title="删除">' + window.icon('trash') + '</button>' +
      '</div></div><div class="cmd-meta" style="margin-bottom:8px">' +
      esc(s.desc) + '</div><div class="chip-row">' +
      s.cases.map((c) => '<button class="chip' + (edit ? ' dnd' : '') +
        (S.selected.has(c.id) ? ' on' : '') + '" data-case="' + esc(c.id) + '" title="' +
        esc(c.cmd + (c.note ? ' — ' + c.note : '')) + '">' +
        (edit ? '<span class="drag-h" title="拖动排序">⠿</span>' : '') +
        esc(c.id) + ' ' + esc(c.name) + (c.skip ? '（默认跳过）' : '') + '</button>').join('') +
      '</div></div>').join('');
    window.renderIcons($('#suiteList'));
    $$('#suiteList .chip').forEach((c) => {
      c.onclick = (e) => {
        if (e.target.closest('.drag-h')) return;
        const id = c.dataset.case;
        if (S.selected.has(id)) { S.selected.delete(id); c.classList.remove('on'); }
        else { S.selected.add(id); c.classList.add('on'); }
      };
    });
    $$('#suiteList [data-sel]').forEach((b) => {
      b.onclick = () => {
        const s = suites.find((x) => x.id === b.dataset.sel);
        s.cases.forEach((c) => S.selected.add(c.id));
        syncChips();
      };
    });
    $$('#suiteList [data-clr]').forEach((b) => {
      b.onclick = () => {
        const s = suites.find((x) => x.id === b.dataset.clr);
        s.cases.forEach((c) => S.selected.delete(c.id));
        syncChips();
      };
    });
    $$('#suiteList [data-exp]').forEach((b) => {
      b.onclick = () => exportSuiteScript(b.dataset.exp);
    });
    $$('#suiteList .suite-tools').forEach((tools) => {
      const panel = tools.closest('.panel');
      const sid = panel && panel.dataset.suite;
      const pin = tools.querySelector('.pin-btn');
      if (pin) pin.onclick = () => togglePin('suite', sid);
      const eb = tools.querySelector('[data-act="edit"]');
      if (eb) eb.onclick = () => editSuite(sid);
      const db = tools.querySelector('[data-act="del"]');
      if (db) db.onclick = () => delSuite(sid);
    });
    bindSuiteDnd();
    window.renderIcons($('#suiteList'));
  }

  let _dragChip = null;
  function bindSuiteDnd() {
    const edit = (S.boot && S.boot.edit_mode);
    $$('#suiteList .panel').forEach((panel) => {
      const sid = panel.dataset.suite;
      const suite = ((S.boot && S.boot.suites) || []).find((x) => x.id === sid);
      const row = panel.querySelector('.chip-row');
      if (!suite || !row) return;
      $$('.chip', row).forEach((chip) => {
        chip.draggable = !!edit;
        chip.addEventListener('dragstart', (e) => {
          if (!edit) return;
          _dragChip = chip; chip.classList.add('dragging');
          try {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', chip.dataset.case);
          } catch (_) { /* ignore */ }
        });
        chip.addEventListener('dragend', () => {
          chip.classList.remove('dragging'); _dragChip = null;
        });
        chip.addEventListener('dragover', (e) => {
          if (!edit || !_dragChip || _dragChip === chip) return;
          e.preventDefault();
          const r = chip.getBoundingClientRect();
          const after = (e.clientY - r.top) > r.height / 2;
          row.insertBefore(_dragChip, after ? chip.nextSibling : chip);
        });
        chip.addEventListener('drop', async (e) => {
          if (!edit || !_dragChip || _dragChip === chip) return;
          e.preventDefault();
          const order = $$('.chip', row).map((c) => c.dataset.case);
          suite.cases = order.map((cid) =>
            suite.cases.find((c) => c.id === cid)).filter(Boolean);
          const r = await call('set_suite_cases',
            { suite_id: sid, cases: suite.cases });
          if (!r || !r.ok) {
            toast((r && r.error) || '保存顺序失败', 'err');
            renderSuites();
          } else {
            toast('已更新用例顺序', 'ok');
          }
        });
      });
    });
  }

  async function delSuite(id) {
    const s = ((S.boot && S.boot.suites) || []).find((x) => x.id === id);
    modal('删除套件', '<p>确定删除「' + esc(s ? s.name : id) + '」？</p>',
      [{ text: '取消' }, {
        text: '删除', cls: 'primary-btn', onClick: async () => {
          const r = await call('delete_suite', { suite_id: id });
          if (!r || !r.ok) return toast((r && r.error) || '删除失败', 'err'), false;
          S.boot.suites = r.suites || S.boot.suites;
          renderSuites(); renderDashboard(); syncPinStates();
          toast('已删除', 'ok');
        },
      }]);
  }

  function editSuite(id) {
    const list = (S.boot && S.boot.suites) || [];
    const s = id ? list.find((x) => x.id === id) : null;
    const data = s ? JSON.parse(JSON.stringify(s)) : {
      id: '', name: '', desc: '', icon: 'check', cases: [],
    };
    const body =
      '<div class="form-grid">' +
      '<div class="field"><label>标识（英文/数字，唯一）</label>' +
      '<input class="inp" id="sId" value="' + esc(data.id) + '"' +
      (id ? ' disabled' : '') + '></div>' +
      '<div class="field"><label>名称</label><input class="inp" id="sName" value="' +
      esc(data.name) + '"></div>' +
      '<div class="field"><label>图标</label>' +
      '<button type="button" class="icon-pick-btn" id="sIcon">' +
      window.icon(data.icon) + '</button> <span class="hint" id="sIconName">' +
      esc(data.icon) + '</span></div>' +
      '<div class="field field-wide"><label>描述</label><input class="inp" id="sDesc" value="' +
      esc(data.desc) + '"></div>' +
      '</div>' +
      '<div class="field" style="margin-top:10px"><label>用例（JSON 数组）</label>' +
      '<textarea class="inp mono" id="sCases" rows="10" placeholder=\'[{"id":"c1","name":"读取版本","cmd":"AT+VER=?"}]\'>' +
      esc(JSON.stringify(data.cases || [], null, 1)) + '</textarea>' +
      '<span class="hint">每条：id / name / title / cmd / skip / dangerous / expect / note</span></div>';
    modal(id ? '编辑套件' : '新建套件', body, [
      { text: '取消' },
      {
        text: '保存', cls: 'primary-btn', onClick: async () => {
          const payload = {
            id: (id || $('#sId').value.trim()),
            name: $('#sName').value.trim() || '未命名',
            icon: data.icon, desc: $('#sDesc').value.trim(),
          };
          try { payload.cases = JSON.parse($('#sCases').value || '[]'); }
          catch (e) { toast('JSON 解析失败：' + e.message, 'err'); return false; }
          if (!payload.id) { toast('请填写标识', 'warn'); return false; }
          const r = id ? await call('update_suite', { suite_id: id, payload })
            : await call('add_suite', { payload });
          if (!r || !r.ok) return toast((r && r.error) || '保存失败', 'err'), false;
          S.boot.suites = r.suites || S.boot.suites;
          renderSuites(); renderDashboard(); syncPinStates();
          toast('已保存', 'ok');
        },
      },
    ]);
    const iconBtn = $('#sIcon');
    if (iconBtn) iconBtn.onclick = () => iconPicker(data.icon, (n) => {
      data.icon = n; iconBtn.innerHTML = window.icon(n);
      $('#sIconName').textContent = n; window.renderIcons(iconBtn);
    });
  }

  function syncChips() {
    $$('#suiteList .chip').forEach((c) =>
      c.classList.toggle('on', S.selected.has(c.dataset.case)));
  }

  async function runSuite() {
    if (!S.connected) return toast('请先连接串口', 'warn');
    if (busyState()) return toast('有批量任务正在执行，请先等待完成或停止', 'warn');
    if (!S.selected.size) return toast('请至少选择一个用例', 'warn');
    const r = await call('run_suite', {
      case_ids: Array.from(S.selected),
      baseline: S.compareBaseline || '',
    });
    S.compareBaseline = '';
    if (r && r.ok) {
      $('#suitePanel').hidden = false;
      toast('开始运行 ' + r.count + ' 个用例' +
        (r.baseline ? '（对比基线：' + r.baseline + '）' : ''), 'ok');
      $('#suitePanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else toast((r && r.error) || '运行失败', 'err');
  }


  function renderSettings() {
    const c = S.config || {};
    const ser = c.serial || {}, pro = c.protocol || {},
      ui = c.ui || {}, beh = c.behavior || {}, wincfg = c.window || {};
    $('#formSerial').innerHTML = [
      fieldNum('波特率', ser.baudrate, 'ser_baud', 110, 6000000),
      fieldSel('数据位', ser.bytesize, 'ser_bs', [5, 6, 7, 8]),
      fieldSel('校验位', ser.parity, 'ser_par', ['N', 'E', 'O', 'M', 'S']),
      fieldSel('停止位', ser.stopbits, 'ser_sb', [1, 1.5, 2]),
      fieldSel('流控', ser.flowcontrol, 'ser_fc',
        [{ v: 'none', n: '无' }, { v: 'rtscts', n: 'RTS/CTS' },
         { v: 'xonxoff', n: 'XON/XOFF' }]),
      fieldNum('读超时（秒）', ser.timeout, 'ser_to', 0.1, 30),
      fieldBool('断线自动重连', ser.auto_reconnect, 'ser_auto'),
    ].join('');
    $('#formProtocol').innerHTML = [
      fieldSel('行结束符', pro.line_ending, 'pro_le', ['CRLF', 'CR', 'LF']),
      fieldNum('指令间隔（秒）', pro.command_delay, 'pro_delay', 0, 10),
      fieldNum('响应超时（秒）', pro.read_timeout, 'pro_to', 0.5, 60),
      fieldBool('忽略模组回显', pro.strip_echo, 'pro_echo'),
    ].join('');
    $('#formUI').innerHTML = [
      fieldSel('主题', ui.theme, 'ui_theme',
        [{ v: 'dark', n: '深色' }, { v: 'light', n: '浅色' },
         { v: 'auto', n: '跟随系统' }]),
      fieldSel('强调色', ui.accent, 'ui_accent',
        [{ v: 'blue', n: '蓝' }, { v: 'violet', n: '紫' },
         { v: 'teal', n: '青' }, { v: 'amber', n: '橙' }]),
      '<div class="field"><label>自定义强调色（hex，留空用预设）</label>' +
        '<div class="accent-custom">' +
        '<input type="color" id="uiAccentPick" title="取色器" value="' +
        (/^#[0-9a-fA-F]{6}$/.test(String(ui.accent_custom || '').trim())
          ? String(ui.accent_custom).trim() : '#58a6ff') + '">' +
        '<input class="inp" type="text" data-cfg="ui_accent_custom" ' +
        'placeholder="如 #58A6FF" maxlength="7" spellcheck="false" value="' +
        esc(String(ui.accent_custom || '').trim()) + '"></div></div>',
      fieldRange('窗口透明度', ui.window_opacity, 'ui_opacity', 40, 100),
      fieldBool('窗口置顶', wincfg.topmost, 'win_top'),
      fieldNum('字号（px）', ui.font_size, 'ui_fs', 12, 20),
      fieldSel('界面缩放', ui.ui_scale, 'ui_scale',
        [{ v: 0.85, n: '85% 紧凑' }, { v: 0.9, n: '90%' }, { v: 0.95, n: '95%' },
         { v: 1.0, n: '100% 标准' }, { v: 1.05, n: '105%' }, { v: 1.1, n: '110%' },
         { v: 1.15, n: '115% 放大' }]),
      fieldBool('界面动画', ui.animation, 'ui_anim'),
      fieldBool('日志自动滚动', ui.auto_scroll, 'ui_scroll'),
      fieldBool('显示时间戳', ui.timestamps, 'ui_ts'),
    ].join('');
    $('#formBehavior').innerHTML = [
      fieldBool('记住发送历史', beh.save_history, 'beh_hist'),
      fieldNum('历史条数上限', beh.history_limit, 'beh_histmax', 10, 1000),
      fieldBool('启用内置 HTTP 服务（浏览器模式）', beh.http_server, 'beh_http'),
      fieldNum('HTTP 端口（0=自动）', beh.http_port, 'beh_port', 0, 65535),
      fieldBool('执行前二次确认', beh.confirm_before_run, 'beh_confirm'),
      fieldBool('启动时自动连接上次串口', beh.auto_connect, 'beh_autoconn'),
    ].join('');
    bindSettings();
    bindProfileMeta();
    bindSettingsTabs();
    refreshWinSize();
  }

  function fieldNum(label, val, key, min, max) {
    return '<div class="field"><label>' + label + '</label>' +
      '<input class="inp" type="number" data-cfg="' + key + '" value="' +
      esc(val == null ? '' : val) + '"' + (min != null ? ' min="' + min + '"' : '') +
      (max != null ? ' max="' + max + '"' : '') + '></div>';
  }

  function fieldSel(label, val, key, opts) {
    const list = opts.map((o) => typeof o === 'object'
      ? { v: o.v, n: o.n } : { v: o, n: String(o) });
    return '<div class="field"><label>' + label + '</label><select class="sel" data-cfg="' +
      key + '">' + list.map((o) => '<option value="' + esc(o.v) + '"' +
      (String(o.v) === String(val) ? ' selected' : '') + '>' + esc(o.n) +
      '</option>').join('') + '</select></div>';
  }

  function fieldBool(label, val, key) {
    return '<div class="field"><label>' + label + '</label>' +
      '<label class="switch"><input type="checkbox" data-cfg="' + key + '"' +
      (val ? ' checked' : '') + '><span>启用</span></label></div>';
  }

  function fieldRange(label, val, key, min, max) {
    let n = parseFloat(val);
    if (!isFinite(n)) n = 100;
    n = Math.max(min, Math.min(max, n));
    return '<div class="field"><label>' + label + '</label>' +
      '<div class="range-row"><input type="range" data-cfg="' + key +
      '" min="' + min + '" max="' + max + '" step="1" value="' + n + '">' +
      '<span class="range-val">' + n + '%</span></div></div>';
  }

  const CFG_MAP = {
    ser_baud: ['serial', 'baudrate', 'num'], ser_bs: ['serial', 'bytesize', 'num'],
    ser_par: ['serial', 'parity', 'str'], ser_sb: ['serial', 'stopbits', 'num'],
    ser_fc: ['serial', 'flowcontrol', 'str'],
    ser_to: ['serial', 'timeout', 'num'], ser_auto: ['serial', 'auto_reconnect', 'bool'],
    pro_le: ['protocol', 'line_ending', 'str'],
    pro_delay: ['protocol', 'command_delay', 'num'],
    pro_to: ['protocol', 'read_timeout', 'num'],
    pro_echo: ['protocol', 'strip_echo', 'bool'],
    ui_theme: ['ui', 'theme', 'str'], ui_accent: ['ui', 'accent', 'str'],
    ui_accent_custom: ['ui', 'accent_custom', 'str'],
    ui_opacity: ['ui', 'window_opacity', 'num'],
    win_top: ['window', 'topmost', 'bool'],
    ui_fs: ['ui', 'font_size', 'num'],
    ui_scale: ['ui', 'ui_scale', 'num'],
    ui_anim: ['ui', 'animation', 'bool'], ui_scroll: ['ui', 'auto_scroll', 'bool'],
    ui_ts: ['ui', 'timestamps', 'bool'],
    beh_hist: ['behavior', 'save_history', 'bool'],
    beh_histmax: ['behavior', 'history_limit', 'num'],
    beh_http: ['behavior', 'http_server', 'bool'],
    beh_port: ['behavior', 'http_port', 'num'],
    beh_confirm: ['behavior', 'confirm_before_run', 'bool'],
    beh_autoconn: ['behavior', 'auto_connect', 'bool'],
  };


  function syncSerialUI() {
    const c = S.config || {};
    const ser = c.serial || {};
    const port = $('#selPort');
    if (port && ser.port && port.value !== ser.port) {
      const has = Array.from(port.options).some((o) => o.value === ser.port);
      if (has) port.value = ser.port;
    }
    const baud = $('#selBaud');
    if (baud && ser.baudrate && String(baud.value) !== String(ser.baudrate)) {
      baud.value = String(ser.baudrate);
    }
    $$('[data-cfg]').forEach((el) => {
      const m = CFG_MAP[el.dataset.cfg];
      if (!m) return;
      const val = (c[m[0]] || {})[m[1]];
      if (val == null) return;
      if (m[2] === 'bool') el.checked = !!val;
      else if (String(el.value) !== String(val)) el.value = String(val);
    });
    const pick = $('#uiAccentPick');
    if (pick) {
      const hex = String((c.ui || {}).accent_custom || '').trim();
      pick.value = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : '#58a6ff';
    }
    const sb = $('#sbBaud');
    if (sb) sb.textContent = ser.baudrate ? ser.baudrate + ' baud' : '';
  }

  function bindSettings() {
    const map = CFG_MAP;
    $$('[data-cfg]').forEach((el) => {
      const handler = async () => {
        const m = map[el.dataset.cfg];
        if (!m) return;
        let value;
        if (m[2] === 'bool') value = el.checked;
        else if (m[2] === 'num') value = parseFloat(el.value);
        else value = el.value;
        const patch = {};
        patch[m[0]] = {};
        patch[m[0]][m[1]] = value;
        const r = await call('save_config', { patch: patch });
        if (r && r.config) {
          S.config = r.config;
          S.maxLogs = (r.config.ui && r.config.ui.max_log_lines) || 2000;
          if (m[0] === 'ui') applyTheme();
          if (r.serial_applied) {
            const sa = r.serial_applied;
            if (sa.ok) toast('串口参数已应用，已自动重连', 'ok');
            else toast('串口参数应用失败：' + (sa.error || '未知错误'), 'err');
          }
          if (el.dataset.cfg === 'ui_opacity') {
            call('set_window_opacity', { percent: value });
          }
          if (el.dataset.cfg === 'win_top') {
            call('set_topmost', { on: value, save: false });
            updatePinBtn();
          }
          syncSerialUI();
          if (m[0] === 'serial') renderSerialBar();
          if (m[0] === 'ui') rerenderLogs();
        }
      };
      if (el.type === 'range') {
        el.addEventListener('input', () => {
          const out = el.parentElement &&
            el.parentElement.querySelector('.range-val');
          if (out) out.textContent = el.value + '%';
          if (el.dataset.cfg === 'ui_opacity') {
            const now = Date.now();
            if (!el._opacityLast || now - el._opacityLast >= 40) {
              el._opacityLast = now;
              call('set_window_opacity', { percent: parseFloat(el.value) });
            }
          }
        });
      }
      el.addEventListener('change', handler);
    });

    const pick = $('#uiAccentPick');
    if (pick) pick.addEventListener('input', async () => {
      const hex = pick.value.toUpperCase();
      const txt = document.querySelector('[data-cfg="ui_accent_custom"]');
      if (txt) txt.value = hex;
      const r = await call('save_config',
        { patch: { ui: { accent_custom: hex } } });
      if (r && r.config) { S.config = r.config; applyTheme(); }
    });
  }

  function bindProfileMeta() {
    const b = S.boot || {};
    const setV = (sel, val) => { const el = $(sel); if (el) el.value = val || ''; };
    setV('#metaVersion', b.profile_version);
    setV('#metaAuthor', b.profile_author);
    setV('#metaDate', b.profile_release_date);
    setV('#metaWebsite', b.profile_website);
    setV('#metaIntro', b.profile_intro);
    const saveBtn = $('#btnSaveMeta');
    if (saveBtn) saveBtn.onclick = async () => {
      const meta = {
        version: $('#metaVersion').value.trim(),
        author: $('#metaAuthor').value.trim(),
        release_date: $('#metaDate').value.trim(),
        website: $('#metaWebsite').value.trim(),
        intro: $('#metaIntro').value.trim(),
      };
      const r = await call('update_profile_meta', { meta });
      if (!r || !r.ok) return toast((r && r.error) || '保存失败', 'err');
      S.boot.profile_version = meta.version;
      S.boot.profile_author = meta.author;
      S.boot.profile_release_date = meta.release_date;
      S.boot.profile_website = meta.website;
      S.boot.profile_intro = meta.intro;
      if (S.boot.home) S.boot.home.intro = meta.intro;
      renderDashboard(); renderAbout();
      toast('已保存配置集信息', 'ok');
    };
    const chk = $('#chkEditMode');
    if (chk) {
      chk.checked = !!(S.boot && S.boot.edit_mode);
      chk.onchange = async () => {
        const on = chk.checked;
        const r = await call('save_config', { patch: { profile: { edit_mode: on } } });
        if (r && r.config) S.config = r.config;
        S.boot.edit_mode = on;
        document.body.dataset.edit = on ? 'on' : 'off';
        renderAll();
        toast(on ? '已开启编辑：可新增 / 修改 / 删除'
          : '已关闭编辑：隐藏全部编辑按钮', 'ok');
      };
    }
  }

  async function runSelfTest() {
    const box = $('#selftestBox');
    box.hidden = false;
    box.innerHTML = '<div class="st-item">正在自检…</div>';
    const r = await call('selftest');
    const checks = (r && r.checks) || [];
    box.innerHTML = checks.map((c, i) =>
      '<div class="st-item" style="animation-delay:' + (i * 35) + 'ms">' +
      '<span class="st-flag ' + (c.ok ? 'ok' : 'fail') + '">' +
      (c.ok ? 'OK' : 'FAIL') + '</span><span>' + esc(c.name) +
      '</span><span class="st-detail">' + esc(c.detail || '') + '</span></div>').join('');
    toast(r && r.ok ? '自检全部通过' : '自检存在失败项', r && r.ok ? 'ok' : 'warn');
  }



  let errCodes = [];
  let errInfo = null;
  async function renderErrCodes() {
    const r = await call('get_error_codes').catch(() => null);
    if (!r || !r.ok) return;
    errCodes = r.codes || [];
    errInfo = r.info || null;
    paintErrCodes();
  }

  function paintErrSource() {
    const btn = $('#btnErrSource');
    if (!btn) return;
    if (!errInfo) { btn.textContent = '来源：--'; return; }
    const srcName = errInfo.source === 'custom' ? '自定义（本配置集）' : '固件默认';
    btn.textContent = '来源：' + srcName + ' · ' + (errInfo.count || 0) + ' 条';
    btn.title = '错误码库跟随当前配置集（' + (errInfo.profile || '-') +
      '）\n' + (errInfo.file || '');
  }

  function paintErrCodes() {
    const list = $('#errList');
    if (!list) return;
    const kw = ($('#errSearch') && $('#errSearch').value.trim().toUpperCase()) || '';
    const items = errCodes.filter((c) =>
      !kw || (c.code + c.meaning + c.hint).toUpperCase().includes(kw));
    const cnt = $('#errCount');
    if (cnt) cnt.textContent = '共 ' + errCodes.length + ' 个错误码 / 事件' +
      (errInfo && errInfo.source === 'custom' ? '（自定义库）' : '');
    paintErrSource();
    const sevName = { ok: '正常', info: '提示', warn: '警告', err: '错误', fatal: '严重' };
    list.innerHTML = items.length ? items.map((c, i) => {
      const idx = errCodes.indexOf(c);
      return '<div class="err-card sev-' + c.severity + '" style="animation-delay:' +
      (i * 30) + 'ms">' +
      '<div class="err-top"><span class="err-code mono">' + esc(c.code) +
      '</span><span class="err-sev">' + (sevName[c.severity] || c.severity) +
      '</span><span class="err-type">' + (c.type === 'event' ? '事件' : '状态码') +
      '</span><button class="err-edit ghost-btn" data-idx="' + idx +
      '" title="编辑该条目">' + window.icon('edit') + '</button>' +
      '<button class="err-del ghost-btn" data-idx="' + idx + '" title="从当前配置集错误码库删除">' +
      window.icon('trash') + '</button></div>' +
      '<div class="err-meaning">' + esc(c.meaning) + '</div>' +
      (c.hint ? '<div class="err-hint"><span class="log-dir sys">建议</span>' +
        esc(c.hint) + '</div>' : '') +
      '</div>';
    }).join('') : '<div class="empty">没有匹配的错误码</div>';
    list.querySelectorAll('.err-del').forEach((b) => {
      b.onclick = async () => {
        const i = parseInt(b.dataset.idx, 10);
        if (!(i >= 0 && i < errCodes.length)) return;
        errCodes.splice(i, 1);
        const r = await call('save_error_codes', { codes: errCodes });
        if (r && r.ok) {
          errCodes = r.codes || errCodes;
          errInfo = r.info || errInfo;
          toast('已删除该错误码', 'ok');
          paintErrCodes();
        } else toast((r && r.error) || '保存失败', 'err');
      };
    });
    list.querySelectorAll('.err-edit').forEach((b) => {
      b.onclick = () => errEditDialog(parseInt(b.dataset.idx, 10));
    });
    window.refreshIcons(list);
  }

  function errEditDialog(idx) {
    const c = errCodes[idx];
    if (!c) return;
    const sevOpt = (v, label) =>
      '<option value="' + v + '"' + (c.severity === v ? ' selected' : '') +
      '>' + label + '</option>';
    const body =
      '<div class="field"><label>错误码 / 事件关键字</label>' +
      '<input class="inp" id="errEditCode" value="' + esc(c.code) + '"></div>' +
      '<div class="field"><label>级别</label><select class="inp" id="errEditSev">' +
      sevOpt('err', '错误') + sevOpt('warn', '警告') + sevOpt('fatal', '严重') +
      sevOpt('ok', '正常') + sevOpt('info', '提示') + '</select></div>' +
      '<div class="field"><label>类型</label><select class="inp" id="errEditType">' +
      '<option value="status"' + (c.type !== 'event' ? ' selected' : '') +
      '>状态码</option><option value="event"' +
      (c.type === 'event' ? ' selected' : '') + '>事件</option></select></div>' +
      '<div class="field"><label>含义</label>' +
      '<input class="inp" id="errEditMeaning" value="' + esc(c.meaning || '') + '"></div>' +
      '<div class="field"><label>处置建议</label>' +
      '<input class="inp" id="errEditHint" value="' + esc(c.hint || '') + '"></div>' +
      '<span class="hint">修改默认库条目会自动把整个库保存为当前配置集的自定义库。</span>';
    modal('编辑错误码', body, [
      { text: '取消' },
      { text: '保存', cls: 'primary-btn', onClick: async () => {
          const code = ($('#errEditCode').value || '').trim();
          if (!code) return toast('错误码不能为空', 'warn');
          errCodes[idx] = {
            code, severity: $('#errEditSev').value, type: $('#errEditType').value,
            meaning: ($('#errEditMeaning').value || '').trim(),
            hint: ($('#errEditHint').value || '').trim(),
          };
          const r = await call('save_error_codes', { codes: errCodes });
          if (r && r.ok) {
            errCodes = r.codes || errCodes;
            errInfo = r.info || errInfo;
            toast('已更新 ' + code, 'ok');
            paintErrCodes();
          } else toast((r && r.error) || '保存失败', 'err');
        } },
    ]);
  }

  function errAddDialog() {
    const body =
      '<div class="field"><label>错误码 / 事件关键字</label>' +
      '<input class="inp" id="errNewCode" placeholder="如 ERR+SEND:03"></div>' +
      '<div class="field"><label>级别</label><select class="inp" id="errNewSev">' +
      '<option value="err">错误</option><option value="warn">警告</option>' +
      '<option value="fatal">严重</option><option value="ok">正常</option>' +
      '<option value="info">提示</option></select></div>' +
      '<div class="field"><label>类型</label><select class="inp" id="errNewType">' +
      '<option value="status">状态码</option><option value="event">事件</option></select></div>' +
      '<div class="field"><label>含义</label>' +
      '<input class="inp" id="errNewMeaning" placeholder="这条错误代表什么"></div>' +
      '<div class="field"><label>处置建议</label>' +
      '<input class="inp" id="errNewHint" placeholder="遇到时应该怎么处理"></div>' +
      '<span class="hint">保存到当前配置集（' + (errInfo ? errInfo.profile : '-') +
      '）的自定义错误码库，不影响其他配置集。</span>';
    modal('新增错误码', body, [
      { text: '取消' },
      { text: '保存', cls: 'primary-btn', onClick: async () => {
          const code = ($('#errNewCode').value || '').trim();
          if (!code) return toast('错误码不能为空', 'warn');
          errCodes.push({
            code, severity: $('#errNewSev').value, type: $('#errNewType').value,
            meaning: ($('#errNewMeaning').value || '').trim(),
            hint: ($('#errNewHint').value || '').trim(),
          });
          const r = await call('save_error_codes', { codes: errCodes });
          if (r && r.ok) {
            errCodes = r.codes || errCodes;
            errInfo = r.info || errInfo;
            toast('已新增错误码 ' + code, 'ok');
            paintErrCodes();
          } else toast((r && r.error) || '保存失败', 'err');
        } },
    ]);
  }


  function setPinBtn(sel, on, name) {
    const b = $(sel);
    if (!b) return;
    b.classList.toggle('pin-on', !!on);
    b.title = name + ' 当前：' + (on ? '高电平' : '低电平') +
      '（点击切换）';
  }

  function showLoopBanner(count) {
    const b = $('#loopBanner'); if (!b) return;
    const txt = b.querySelector('.lb-text');
    if (txt) txt.textContent = '循环发送进行中…' +
      (typeof count === 'number' && count > 0 ? '已发 ' + count + ' 次' : '');
    b.hidden = false;
  }
  function hideLoopBanner() { const b = $('#loopBanner'); if (b) b.hidden = true; }
  function syncLoopSend(info) {
    // 由 poll() 驱动：任何一端（软件/网页）启动或停止循环，所有界面同步浮条
    if (info && info.running) { S.loopSending = true; showLoopBanner(info.count); }
    else if (S.loopSending) { S.loopSending = false; hideLoopBanner(); }
  }
  async function stopLoopSendNow() {
    try { await call('stop_loop_send'); } catch (e) {}
    S.loopSending = false; hideLoopBanner();
    toast('已停止循环发送', 'ok');
  }

  async function loopSendDialog() {
    if (!S.connected) return toast('请先连接串口', 'warn');
    const st = await call('loop_send_status').catch(() => null);
    if (st && st.running) {
      S.loopSending = true; showLoopBanner(st.count);
      modal('循环发送', '<p>循环发送进行中，已发送 <b>' + (st.count || 0) +
        '</b> 次。</p>', [
        { text: '关闭' },
        { text: '停止发送', cls: 'danger-btn', onClick: async () => {
            await stopLoopSendNow();
          } },
      ]);
      return;
    }
    const body =
      '<div class="field"><label>发送内容</label>' +
      '<input class="inp" id="lsCmd" placeholder="AT+CSQ 或 HEX：01 03 00 00"></div>' +
      '<div class="field"><label>格式</label><select class="inp" id="lsMode">' +
      '<option value="text">文本（自动加行结束符）</option>' +
      '<option value="hex">HEX（原始字节）</option></select></div>' +
      '<div class="field"><label>间隔（毫秒，最小 50）</label>' +
      '<input class="inp" id="lsInt" type="number" value="1000" min="50"></div>' +
      '<div class="field"><label>重复次数（0 = 无限循环）</label>' +
      '<input class="inp" id="lsRep" type="number" value="0" min="0"></div>' +
      '<span class="hint">发送期间将锁定其他下发入口（发送栏/批量/套件/预设）；断开串口会自动停止。也可直接点界面底部「停止循环发送」按钮退出。</span>';
    modal('循环发送', body, [
      { text: '取消' },
      { text: '开始', cls: 'primary-btn', onClick: async () => {
          const r = await call('start_loop_send', {
            cmd: $('#lsCmd').value.trim(),
            interval_ms: parseInt($('#lsInt').value, 10) || 1000,
            repeat: parseInt($('#lsRep').value, 10) || 0,
            mode: $('#lsMode').value,
          });
          if (r && r.ok) {
            S.loopSending = true; showLoopBanner(0);
            toast('循环发送已启动', 'ok');
          }
          else toast((r && r.error) || '启动失败', 'err');
        } },
    ]);
  }

  async function autoReplyDialog() {
    const cur = await call('get_auto_reply').catch(() => null);
    const rule = (cur && cur.rule) || null;
    const body =
      '<div class="field"><label>触发关键字（收到包含该关键字的行后自动回复；留空 = 关闭）</label>' +
      '<input class="inp" id="arKw" value="' + esc(rule ? rule.keyword : '') +
      '" placeholder="例如：Incoming data"></div>' +
      '<div class="field"><label>回复内容</label>' +
      '<input class="inp" id="arRep" value="' + esc(rule ? rule.reply : '') +
      '" placeholder="AT+CSQ 或 HEX：4F 4B"></div>' +
      '<div class="field"><label>回复格式</label><select class="inp" id="arMode">' +
      '<option value="text"' + (rule && rule.mode === 'text' ? ' selected' : '') + '>文本（自动加行结束符）</option>' +
      '<option value="hex"' + (rule && rule.mode === 'hex' ? ' selected' : '') + '>HEX（原始字节）</option></select></div>' +
      '<div class="field"><label>延时（毫秒）</label>' +
      '<input class="inp" id="arDelay" type="number" value="' + (rule ? rule.delay_ms : 100) + '" min="0"></div>';
    modal('自动应答', body, [
      { text: '取消' },
      { text: rule ? '保存' : '启用', cls: 'primary-btn', onClick: async () => {
          const r = await call('set_auto_reply', {
            keyword: $('#arKw').value.trim(),
            reply: $('#arRep').value,
            delay_ms: parseInt($('#arDelay').value, 10) || 0,
            mode: $('#arMode').value,
          });
          if (r && r.ok) {
            S.autoReply = r.keyword || null;
            toast(r.enabled ? '自动应答已启用：' + r.keyword : '自动应答已关闭', 'ok');
          } else toast((r && r.error) || '设置失败', 'err');
        } },
      { text: '关闭应答', cls: 'danger-btn', onClick: async () => {
          await call('set_auto_reply', { keyword: '' });
          S.autoReply = null;
          toast('自动应答已关闭', 'ok');
        } },
    ]);
  }


  function setMacroBtn(recording) {
    const b = $('#btnMacro');
    if (!b) return;
    b.classList.toggle('recording', !!recording);
    b.title = recording
      ? '录制中：点击停止并保存为按钮'
      : '录制手动发送的指令序列，一键生成常用按钮';
  }

  function stopMacroDialog() {
    const cmds = S.macro || [];
    const body =
      '<div class="field"><label>已录制 ' + cmds.length + ' 条指令</label>' +
      '<textarea class="inp" id="mcCmds" rows="6">' + esc(cmds.join('\n')) + '</textarea>' +
      '<span class="hint">一行一条指令，可增删改后再保存</span></div>' +
      '<div class="field"><label>按钮名称</label>' +
      '<input class="inp" id="mcName" value="宏 ' +
      new Date().toTimeString().slice(0, 5) + '"></div>' +
      '<div class="field"><label>分组</label>' +
      '<input class="inp" id="mcGroup" value="宏"></div>';
    modal('宏录制完成', body, [
      { text: '丢弃', cls: 'danger-btn', onClick: () => { S.macro = null; setMacroBtn(false); } },
      { text: '关闭' },
      { text: '保存为按钮', cls: 'primary-btn', onClick: async () => {
          const list = $('#mcCmds').value.replace(/\r/g, '').split('\n')
            .map((s) => s.trim()).filter(Boolean);
          if (!list.length) return toast('指令序列为空', 'warn');
          const r = await call('add_button', {
            name: $('#mcName').value.trim() || '宏',
            group: $('#mcGroup').value.trim() || '宏',
            icon: 'history', color: 'violet',
            commands: list, delay: 0.35,
          });
          if (r && r.ok) {
            S.macro = null; setMacroBtn(false);
            S.buttons = await callList('get_buttons');
            renderButtons(); renderDashboard();
            toast('已保存为常用按钮', 'ok');
          } else toast((r && r.error) || '保存失败', 'err');
        } },
    ]);
    S.macro = null; setMacroBtn(false);
  }


  function drawSpark() {
    const canvas = $('#sigCanvas');
    if (!canvas || !S.sigHist || !S.sigHist.length) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const hasSnr = S.sigHist.some((p) => typeof p.snr === 'number');
    const snrEl = $('#sigSnr');
    if (snrEl) {
      snrEl.hidden = !hasSnr;
      if (hasSnr) {
        const lastSnr = [...S.sigHist].reverse().find((p) => typeof p.snr === 'number');
        snrEl.textContent = 'SNR ' + (lastSnr ? lastSnr.snr : '--') + ' dB';
      }
    }

    const rvals = S.sigHist.map((p) => p.rssi);
    const svals = S.sigHist.filter((p) => typeof p.snr === 'number')
      .map((p) => p.snr);
    const rLo = Math.min(...rvals) - 3, rHi = Math.max(...rvals) + 3;
    const sLo = svals.length ? Math.min(...svals) - 2 : 0;
    const sHi = svals.length ? Math.max(...svals) + 2 : 1;
    const rSpan = Math.max(6, rHi - rLo);
    const sSpan = Math.max(4, sHi - sLo);
    const style = getComputedStyle(document.documentElement);
    const accent = style.getPropertyValue('--accent').trim() || '#58a6ff';
    const okc = style.getPropertyValue('--ok').trim() || '#3fb950';

    ctx.strokeStyle = 'rgba(128,128,128,.18)';
    ctx.lineWidth = 1;
    for (let g = 1; g < 4; g++) {
      ctx.beginPath(); ctx.moveTo(0, h * g / 4); ctx.lineTo(w, h * g / 4); ctx.stroke();
    }
    const px = (i) => 4 + i * ((w - 8) / Math.max(1, S.sigHist.length - 1));
    const rpy = (v) => h - 6 - ((v - rLo) / rSpan) * (h - 12);
    const spy = (v) => h - 6 - ((v - sLo) / sSpan) * (h - 12);

    ctx.beginPath();
    ctx.moveTo(px(0), h);
    S.sigHist.forEach((p, i) => ctx.lineTo(px(i), rpy(p.rssi)));
    ctx.lineTo(px(S.sigHist.length - 1), h);
    ctx.closePath();
    ctx.fillStyle = accent + '22';
    ctx.fill();

    ctx.beginPath();
    S.sigHist.forEach((p, i) =>
      i ? ctx.lineTo(px(i), rpy(p.rssi)) : ctx.moveTo(px(i), rpy(p.rssi)));
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (hasSnr) {
      ctx.beginPath();
      let started = false;
      S.sigHist.forEach((p, i) => {
        if (typeof p.snr !== 'number') return;
        if (!started) { ctx.moveTo(px(i), spy(p.snr)); started = true; }
        else ctx.lineTo(px(i), spy(p.snr));
      });
      ctx.strokeStyle = okc;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const last = S.sigHist[S.sigHist.length - 1];
    ctx.beginPath();
    ctx.arc(px(S.sigHist.length - 1), rpy(last.rssi), 3.5, 0, Math.PI * 2);
    ctx.fillStyle = okc;
    ctx.fill();

    S.sigHist.forEach((p, i) => {
      const txN = p.tx || 0, rxN = p.rx || 0;
      if (!txN && !rxN) return;
      const x = px(i);
      if (txN) {
        ctx.strokeStyle = accent;
        ctx.lineWidth = txN > 3 ? 3 : 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(x, h - 2); ctx.lineTo(x, h - 14); ctx.stroke();
        ctx.setLineDash([]);
      }
      if (rxN) {
        ctx.strokeStyle = okc;
        ctx.lineWidth = rxN > 6 ? 3 : 1.5;
        ctx.setLineDash([2, 4]);
        ctx.beginPath(); ctx.moveTo(x + (txN ? 2.5 : 0), 2); ctx.lineTo(x + (txN ? 2.5 : 0), 12); ctx.stroke();
        ctx.setLineDash([]);
      }
    });
  }

  async function sigSample() {
    if (!S.connected) return;

    const since = (S.sigHist && S.sigHist.length)
      ? S.sigHist[S.sigHist.length - 1].ts : 0;
    let txN = 0, rxN = 0;
    S.logs.forEach((ev) => {
      if ((ev.ts || 0) <= since) return;
      if (ev.dir === 'tx') txN++;
      else if (ev.dir === 'rx') rxN++;
    });
    const r = await call('read_signal');
    if (r && r.ok && typeof r.rssi === 'number') {
      const pt = { ts: Date.now(), rssi: r.rssi, tx: txN, rx: rxN };
      if (typeof r.snr === 'number') pt.snr = r.snr;
      S.sigHist.push(pt);
      if (S.sigHist.length > 60) S.sigHist.shift();
      $('#sigValue').textContent = r.rssi + ' dBm';
      const vals = S.sigHist.map((p) => p.rssi);
      let stat = 'min ' + Math.min(...vals) + ' / max ' + Math.max(...vals);
      const snrVals = S.sigHist.filter((p) => typeof p.snr === 'number')
        .map((p) => p.snr);
      if (snrVals.length) {
        stat += ' · SNR ' + Math.min(...snrVals).toFixed(1) + ' ~ ' +
          Math.max(...snrVals).toFixed(1);
      }
      $('#sigStat').textContent = stat;
      drawSpark();
    } else if (r && r.error) {
      $('#sigValue').textContent = r.error;
    }
  }

  function toggleSignal() {
    const panel = $('#sigPanel');
    if (S.sigTimer) {
      clearInterval(S.sigTimer); S.sigTimer = null;
      panel.hidden = true;
      $('#btnSignal').classList.remove('pin-on');
      toast('信号监控已停止', 'info');
      return;
    }
    if (!S.connected) return toast('请先连接串口', 'warn');
    S.sigHist = [];
    panel.hidden = false;
    $('#btnSignal').classList.add('pin-on');
    $('#sigValue').textContent = '采样中…';
    sigSample();
    S.sigTimer = setInterval(sigSample, 2000);
    toast('信号监控已开启（每 2 秒采样）', 'ok');
  }


  function favList() {
    const f = S.config && S.config.ui && S.config.ui.favorites;
    return Array.isArray(f) ? f : [];
  }
  async function favToggle(text) {
    const t = String(text || '').trim();
    if (!t) return toast('先输入指令再收藏', 'warn');
    const list = favList();
    const idx = list.findIndex((x) => (x.text || x) === t);
    if (idx >= 0) {
      list.splice(idx, 1);
      toast('已取消收藏：' + t, 'info');
    } else {
      list.unshift({ text: t });
      toast('已收藏：' + t, 'ok');
    }
    const r = await call('save_config', { patch: { ui: { favorites: list } } });
    if (r && r.config) S.config = r.config;
    syncFavBtn(t);
  }
  function syncFavBtn(text) {
    const b = $('#btnFavAdd');
    if (!b) return;
    const on = favList().some((x) => (x.text || x) === String(text || '').trim());
    b.classList.toggle('pin-on', on);
    b.title = on ? '取消收藏当前指令' : '收藏当前输入的指令';
  }
  function favDialog() {
    const list = favList();
    const rows = list.length ? list.map((x, i) => {
      const text = x.text || x;
      return '<div class="fav-row" data-i="' + i + '">' +
        '<button class="ghost-btn fav-use mono" data-i="' + i + '" title="填入发送栏">' +
        esc(text) + '</button>' +
        '<button class="ghost-btn fav-move" data-up="' + i + '" title="上移"' +
        (i === 0 ? ' disabled' : '') + '>' + window.icon('chevron-up') + '</button>' +
        '<button class="ghost-btn fav-move" data-down="' + i + '" title="下移"' +
        (i === list.length - 1 ? ' disabled' : '') + '>' + window.icon('chevron-down') +
        '</button>' +
        '<button class="ghost-btn danger" data-del="' + i + '" title="删除">' +
        window.icon('trash') + '</button></div>';
    }).join('') : '<div class="empty">还没有收藏。在发送栏输入指令后点 ⭐ 即可收藏，之后从这里一键回填。</div>';
    modal('指令收藏夹', '<div class="fav-list">' + rows + '</div>' +
      '<p class="hint" style="margin-top:8px">收藏保存在本机配置中，与配置集无关；点击指令回填发送栏（不自动发送），↑↓ 调整顺序。</p>', [
      { text: '关闭' },
    ]);
    $$('#modalBody .fav-use').forEach((b) => {
      b.onclick = () => {
        const item = favList()[parseInt(b.dataset.i, 10)] || {};
        const input = $('#cmdInput');
        if (input) {
          input.value = item.text || item;
          input.focus();
        }
        closeModal();
        toast('已填入发送栏', 'ok');
      };
    });
    $$('#modalBody [data-del]').forEach((b) => {
      b.onclick = async () => {
        const list2 = favList();
        list2.splice(parseInt(b.dataset.del, 10), 1);
        const r = await call('save_config', { patch: { ui: { favorites: list2 } } });
        if (r && r.config) S.config = r.config;
        closeModal();
        favDialog();
      };
    });
    $$('#modalBody [data-up], #modalBody [data-down]').forEach((b) => {
      b.onclick = async () => {
        const list2 = favList();
        const i = parseInt(b.dataset.up != null ? b.dataset.up : b.dataset.down, 10);
        const j = b.dataset.up != null ? i - 1 : i + 1;
        if (!(i >= 0 && i < list2.length) || !(j >= 0 && j < list2.length)) return;
        const tmp = list2[i]; list2[i] = list2[j]; list2[j] = tmp;
        const r = await call('save_config', { patch: { ui: { favorites: list2 } } });
        if (r && r.config) S.config = r.config;
        closeModal();
        favDialog();
      };
    });
    window.renderIcons($('#modalBody'));
  }


  function toggleBulkPanel() {
    const p = $('#bulkPanel');
    if (!p) return;
    p.hidden = !p.hidden;
    $('#btnBulk') && $('#btnBulk').classList.toggle('pin-on', !p.hidden);
  }
  async function bulkRun() {
    if (!S.connected) return toast('请先连接串口', 'warn');
    if (S.bulkRunning) return;
    if (busyState()) return toast('有批量任务正在执行，请先等待完成或停止', 'warn');
    const raw = ($('#bulkText') ? $('#bulkText').value : '') || '';
    const lines = raw.split('\n').map((s) => s.trim())
      .filter((s) => s && !s.startsWith('#'));
    if (!lines.length) return toast('没有可发送的指令', 'warn');
    const delay = Math.max(0, parseInt(($('#bulkDelay') || {}).value, 10) || 300);
    const stopErr = !!(($('#bulkStopErr') || {}).checked);
    S.bulkRunning = true; S.bulkStop = false;
    applyBusyUI();
    const fill = $('#bulkFill'), ptxt = $('#bulkProgText');
    $('#bulkProg') && ($('#bulkProg').hidden = false);
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    let sent = 0, failed = 0, idx = 0;
    const t0 = performance.now();
    toast('批量发送：共 ' + lines.length + ' 条', 'info');
    for (; idx < lines.length; idx++) {
      const line = lines[idx];
      if (S.bulkStop) break;
      if (fill) fill.style.width =
        Math.round((idx / lines.length) * 100) + '%';
      if (ptxt) ptxt.textContent = '第 ' + (idx + 1) + ' / ' +
        lines.length + ' 条 · ' + line.slice(0, 48);
      const waitM = /^WAIT\s+([\d.]+)$/i.exec(line);
      if (waitM) { await sleep(parseFloat(waitM[1]) * 1000); continue; }
      if (!/^AT/i.test(line)) { failed++; continue; }
      const r = await call('send_command', { cmd: line });
      if (r && r.ok) sent++;
      else {
        failed++;
        if (stopErr) { toast('第 ' + (sent + failed) + ' 条失败（' + line + '），已停止', 'err'); break; }
      }
      await sleep(delay);
    }
    if (fill) fill.style.width = '100%';
    if (ptxt) ptxt.textContent =
      '结束：成功 ' + sent + ' / 失败 ' + failed +
      (S.bulkStop ? '（已手动停止）' : '') +
      '，耗时 ' + ((performance.now() - t0) / 1000).toFixed(1) + ' 秒';
    S.bulkRunning = false;
    applyBusyUI();
    toast('批量发送结束：成功 ' + sent + ' / 失败 ' + failed +
      '，耗时 ' + ((performance.now() - t0) / 1000).toFixed(1) + ' 秒',
      failed ? 'warn' : 'ok');
  }
  function bulkStop() { S.bulkStop = true; }


  function addBookmark() {
    const body = '<div class="field"><label>标记备注（可留空）</label>' +
      '<input type="text" id="bmNote" placeholder="例如：这里开始测入网 / 出现异常"></div>';
    modal('插入日志标记', body, [
      { text: '取消' },
      { text: '插入', primary: true, onclick: () => {
        const note = ($('#bmNote') ? $('#bmNote').value : '').trim();
        const ev = { dir: 'mark', ts: Date.now() / 1000,
          text: note ? '◆ ' + note : '◆ 用户标记' };
        S.logs.push(ev);
        rerenderLogs();
        toast('已插入标记', 'ok');
      } },
    ]);
    $('#bmNote') && $('#bmNote').focus();
  }


  async function saveBaselineDialog() {
    if (!S.lastResult || !S.lastResult.total) {
      return toast('还没有套件结果，请先运行一次', 'warn');
    }
    const def = new Date().toTimeString().slice(0, 5).replace(':', '') +
      '-' + ((S.boot && S.boot.profile_id) || 'at');
    const body = '<div class="field"><label>基线名称</label>' +
      '<input type="text" id="blName" value="' + esc(def) + '"></div>' +
      '<p class="hint">保存最近一次套件运行的每条用例响应快照（' +
      S.lastResult.total + ' 用例），之后可作为对比基准。</p>';
    modal('保存基线', body, [
      { text: '取消' },
      { text: '保存', primary: true, onclick: async () => {
        const name = ($('#blName') ? $('#blName').value : '').trim();
        const r = await call('save_baseline', { name: name });
        if (r && r.ok) toast('基线已保存：' + r.name + '（' + r.count + ' 用例）', 'ok');
        else toast((r && r.error) || '保存失败', 'err');
      } },
    ]);
  }
  async function compareRunDialog() {
    const r = await call('list_baselines').catch(() => null);
    const baselines = (r && r.baselines) || [];
    if (!baselines.length) return toast('还没有基线，请先「保存基线」', 'warn');
    const rows = baselines.map((b, i) =>
      '<label class="bl-row"><input type="radio" name="blPick" value="' +
      esc(b.name) + '"' + (i === 0 ? ' checked' : '') + '> <b>' + esc(b.name) +
      '</b><span class="bl-meta">' + esc(b.profile_name || b.profile || '') +
      ' · ' + b.count + ' 用例 · ' + esc(b.created) + '</span></label>').join('');
    modal('对比运行（选基线）',
      '<div class="bl-list">' + rows + '</div>' +
      '<p class="hint">用所选基线重跑当前勾选用例：完成后逐条对比状态与响应行，差异高亮。适合固件升级前后回归、实机 vs SIM 对比。</p>', [
      { text: '取消' },
      { text: '开始对比运行', primary: true, onclick: async () => {
        const pick = document.querySelector('input[name="blPick"]:checked');
        if (!pick) return;
        closeModal();
        S.compareBaseline = pick.value;
        runSuite();
      } },
    ]);
  }
  function showBaselineDiff(b) {
    const icon = (v) => v === true ? '<span class="diff-ok">PASS</span>'
      : v === false ? '<span class="diff-bad">FAIL</span>' : '—';
    const rows = (b.diffs || []).map((d) =>
      '<div class="diff-row">' +
      '<div class="diff-head"><b class="mono">' + esc(d.id) + '</b> ' +
      esc(d.name) + '<span class="diff-cmd mono">' + esc(d.cmd) + '</span></div>' +
      '<div class="diff-line">状态：' + esc(d.b_status || '—') + ' → ' +
      esc(d.n_status || '—') + '　判定：' + icon(d.b_ok) + ' → ' + icon(d.n_ok) + '</div>' +
      (d.removed.length ? '<div class="diff-line bad">− ' +
        d.removed.map(esc).join('<br>− ') + '</div>' : '') +
      (d.added.length ? '<div class="diff-line good">+ ' +
        d.added.map(esc).join('<br>+ ') + '</div>' : '') +
      '</div>').join('');
    const clean = b.changed === 0;
    modal('基线对比：' + b.name,
      '<div class="diff-sum">' +
      '<span class="st-chip"><b>' + b.same + '</b> 一致</span>' +
      '<span class="st-chip ' + (clean ? '' : 'err') + '"><b>' + b.changed +
      '</b> 有差异</span>' +
      (b.missing ? '<span class="st-chip"><b>' + b.missing + '</b> 新增用例</span>' : '') +
      (b.extra ? '<span class="st-chip"><b>' + b.extra + '</b> 基线独有</span>' : '') +
      '</div>' +
      (rows ? '<div class="diff-list">' + rows + '</div>'
        : '<p class="hint" style="margin-top:10px">全部用例响应与基线一致，回归通过。</p>'), [
      { text: '关闭' },
    ]);
  }


  async function logFilesDialog() {
    const r = await call('list_session_logs').catch(() => null);
    if (!r || !r.ok) return toast('读取日志列表失败', 'err');
    const sessions = r.sessions || [];
    const cur = r.current || {};
    const body = sessions.length ?
      '<div class="session-list">' + sessions.map((s) =>
        '<div class="session-row" data-name="' + esc(s.name) + '">' +
        '<div class="ss-info"><div class="ss-name mono">' + esc(s.name) + '</div>' +
        '<div class="ss-meta">' + s.count + ' 行 · ' +
        (s.size / 1024).toFixed(1) + ' KB · ' +
        esc(s.port || '') + '</div></div>' +
        '<div class="ss-actions">' +
        '<button class="ghost-btn" data-act="view">查看</button>' +
        '<button class="ghost-btn" data-act="export">导出</button>' +
        '<button class="ghost-btn" data-act="open">打开</button>' +
        '<button class="ghost-btn danger" data-act="del">删除</button>' +
        '</div></div>').join('') + '</div>'
      : '<div class="empty">还没有会话日志。连接串口后，每次会话都会自动保存一份记录文件。</div>' +
        (cur.path ? '<div class="mono small">当前会话：' + esc(cur.path) + '</div>' : '');
    modal('串口日志文件', body + '<p class="hint" style="margin-top:8px">每次连接自动生成新记录文件（不撞名）；「查看」把历史日志复原到终端；导出支持 txt 格式，也可从数据目录 logs/ 拿到 jsonl 原始文件。</p>', [
      { text: '关闭' },
    ]);
    $$('#modalBody .session-row').forEach((row) => {
      const name = row.dataset.name;
      row.querySelectorAll('[data-act]').forEach((btn) => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          const act = btn.dataset.act;
          if (act === 'export') {
            const er = await call('export_session_log', { name: name, fmt: 'txt' });
            if (er && er.ok) { toast('已导出：' + er.path, 'ok'); await call('open_path', { path: er.path }); }
            else toast((er && er.error) || '导出失败', 'err');
          } else if (act === 'view') {
            const vr = await call('read_session_log', { name: name });
            if (vr && vr.ok) {
              closeModal();
              S.logs = vr.events.slice(-((S.maxLogs || 2000)));
              rerenderLogs();
              goto('terminal');
              toast('已复原 ' + vr.count + ' 行历史日志', 'ok');
            } else toast((vr && vr.error) || '读取失败', 'err');
          } else if (act === 'open') {
            const sr = sessions.find((s) => s.name === name);
            if (sr) await call('open_path', { path: sr.path });
          } else if (act === 'del') {
            const dr = await call('delete_session_log', { name: name });
            if (dr && dr.ok) { row.remove(); toast('已删除', 'ok'); }
            else toast('删除失败', 'err');
          }
        };
      });
    });
  }


  function bindSettingsTabs() {
    $$('#setTabs .set-tab').forEach((tab) => {
      tab.onclick = () => {
        $$('#setTabs .set-tab').forEach((t) => t.classList.toggle('active', t === tab));
        $$('.set-page').forEach((p) =>
          p.classList.toggle('active', p.dataset.tabpage === tab.dataset.tab));
      };
    });
  }

  function renderAbout() {
    const b = S.boot || {};
    const rows = [
      ['应用版本', 'v' + (b.version || '1.0.0')],
      ['当前配置集', (b.profile_name || '-') +
        '（' + (b.profile_id || '-') + '）'],
      ['模组文档', b.profile_doc || b.profile_version || '-'],
      ['运行平台', b.platform || '-'],
      ['Python 平台', b.python_platform || '-'],
      ['打包运行', b.frozen ? '是' : '否（源码运行）'],
      ['数据目录', b.data_dir || '-'],
      ['配置集目录', b.profiles_dir || '-'],
      ['指令条数', b.command_count + ' 条'],
      ['测试用例', b.case_count + ' 个'],
    ];
    $('#aboutInfo').innerHTML = rows.map((r) =>
      '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>').join('');

    const presetCount = ((b.presets) || []).length;
    const suiteCount = ((b.suites) || []).length;
    const cats = ((b.categories) || []).length;
    const features = [
      '配置集（OEM）：' + S.profiles.length + ' 个可用，切换即整体换装，' +
        '导入配置包即可适配新模组',
      '一键配置：' + presetCount + ' 个场景模板，填表即可批量下发完整指令流程',
      '指令库：' + b.command_count + ' 条指令，分 ' + cats + ' 类，含参数校验与示例',
      '测试套件：' + suiteCount + ' 大类 ' + b.case_count + ' 个用例，' +
        '支持回读校验与报告导出',
      '自定义按钮：多指令序列、分组、变量占位符，按配置集隔离持久化',
      '虚拟设备：无需硬件即可完整自测全流程',
      '三端兼容：Windows / macOS / Linux 同一套代码',
    ];
    const ul = $('#aboutFeatures');
    if (ul) ul.innerHTML = features.map((f) => '<li>' + esc(f) + '</li>').join('');
  }


  function newProfileDialog() {
    const body =
      '<div class="form-grid">' +
      '<div class="field"><label>标识（英文，用于目录名）</label>' +
      '<input class="inp" id="npId" placeholder="例如 acme900">' +
      '<span class="hint">只能小写字母/数字/-/_，须以字母数字开头</span></div>' +
      '<div class="field"><label>显示名称</label>' +
      '<input class="inp" id="npName" placeholder="例如 ACME-900 模组"></div>' +
      '<div class="field"><label>品牌名（标题栏显示）</label>' +
      '<input class="inp" id="npBrand" placeholder="留空则同显示名称"></div>' +
      '<div class="field"><label>副标题</label>' +
      '<input class="inp" id="npSub" placeholder="例如 ACME-900 · 私有 AT 指令集"></div>' +
      '</div>' +
      '<div class="field" style="margin-top:10px"><label>起点</label>' +
      '<select class="sel" id="npBase">' +
      '<option value="">空白配置（从零开始）</option>' +
      S.profiles.map((p) => '<option value="' + esc(p.id) + '">复制自：' +
        esc(p.name) + '</option>').join('') +
      '</select>' +
      '<span class="hint">选「复制自」可把现有模组的指令库/场景/套件作为模板，改起来最快</span>' +
      '</div>';
    modal('新建配置集', body, [
      { text: '取消' },
      {
        text: '创建并切换', cls: 'primary-btn', onClick: async () => {
          const id = ($('#npId').value || '').trim().toLowerCase();
          if (!id) { toast('请填写标识', 'warn'); return false; }
          const r = await call('new_profile', {
            profile_id: id,
            name: ($('#npName').value || '').trim(),
            brand: ($('#npBrand').value || '').trim(),
            subtitle: ($('#npSub').value || '').trim(),
            base: $('#npBase').value,
          });
          if (!r || !r.ok) { toast((r && r.error) || '创建失败', 'err'); return false; }
          await switchProfile(id);
        },
      },
    ]);
  }

  function duplicateProfileDialog() {
    const cur = S.profiles.find((p) => p.id === S.profileId) || {};
    const body =
      '<div class="form-grid">' +
      '<div class="field"><label>新标识</label>' +
      '<input class="inp" id="dpId" value="' + esc((cur.id || '') + '-copy') + '"></div>' +
      '<div class="field"><label>新名称</label>' +
      '<input class="inp" id="dpName" value="' + esc((cur.name || '') + ' 副本') + '"></div>' +
      '</div>' +
      '<p class="small" style="color:var(--text-dim);margin-top:10px">' +
      '会完整复制指令库、场景、套件与默认按钮，随后可直接编辑。</p>';
    modal('复制当前配置集', body, [
      { text: '取消' },
      {
        text: '复制并切换', cls: 'primary-btn', onClick: async () => {
          const id = ($('#dpId').value || '').trim().toLowerCase();
          if (!id) { toast('请填写标识', 'warn'); return false; }
          const r = await call('duplicate_profile', {
            profile_id: S.profileId, new_id: id,
            new_name: ($('#dpName').value || '').trim(),
          });
          if (!r || !r.ok) { toast((r && r.error) || '复制失败', 'err'); return false; }
          await switchProfile(id);
        },
      },
    ]);
  }

  function importProfileDialog() {
    const body =
      '<div class="field"><label>粘贴配置集 JSON 包</label>' +
      '<textarea class="inp" id="ipJson" rows="9" ' +
      'placeholder=\'{"kind":"at-command-debugger-profile","profile":{...}}\'></textarea>' +
      '<span class="hint">也可只粘贴 profile 对象本身；可与「导出当前」得到的内容互通</span></div>' +
      '<div class="field" style="margin-top:8px"><label>覆盖标识（可选）</label>' +
      '<input class="inp" id="ipId" placeholder="留空=沿用包内 id，冲突时自动加序号">' +
      '<span class="hint">想让导入的配置用指定目录名时填写</span></div>';
    modal('导入配置集', body, [
      { text: '取消' },
      {
        text: '导入', cls: 'primary-btn', onClick: async () => {
          const text = ($('#ipJson').value || '').trim();
          if (!text) { toast('请粘贴 JSON 内容', 'warn'); return false; }
          const r = await call('import_profile', {
            data: text, override_id: ($('#ipId').value || '').trim().toLowerCase(),
          });
          if (!r || !r.ok) { toast((r && r.error) || '导入失败', 'err'); return false; }
          S.profiles = r.profiles || S.profiles;
          renderProfilePickers();
          toast('已导入「' + ((r.profile && r.profile.name) || '') + '」', 'ok');
        },
      },
    ]);
  }

  async function exportCurrentProfile() {
    const r = await call('export_profile', { profile_id: S.profileId });
    if (r && r.ok) {
      toast('已导出：' + r.path, 'ok');
      await call('open_path', { path: r.path });
    } else toast((r && r.error) || '导出失败', 'err');
  }

  function deleteProfileDialog() {
    const cur = S.profiles.find((p) => p.id === S.profileId) || {};
    if (cur.source !== 'user') {
      toast('内置配置集不可删除，可先「复制当前」再改', 'warn');
      return;
    }
    modal('删除配置集',
      '<p>确定删除「' + esc(cur.name || cur.id) + '」？</p>' +
      '<p class="small" style="color:var(--text-dim)">该配置集的目录与其中自定义按钮会一并移除，' +
      '不可恢复。当前会切换回默认配置集。</p>',
      [{ text: '取消' }, {
        text: '删除', cls: 'primary-btn', onClick: async () => {
          const r = await call('delete_profile', { profile_id: S.profileId });
          if (!r || !r.ok) { toast((r && r.error) || '删除失败', 'err'); return false; }
          S.profiles = r.profiles || [];
          const fallback = (S.profiles[0] || {}).id || '';
          if (fallback) await switchProfile(fallback);
          else await reloadAfterProfileChange();
          toast('已删除', 'ok');
        },
      }]);
  }


  async function exportReport(fmt) {
    const r = await call('export_report', { fmt: fmt });
    if (r && r.ok) {
      toast('已导出：' + r.path, 'ok');
      await call('open_path', { path: r.path });
    } else toast((r && r.error) || '导出失败', 'err');
  }


  function bindAll() {
    applyBusyUI();
    $$('.nav-item').forEach((n) => { n.onclick = () => goto(n.dataset.page); });
    $$('[data-goto]').forEach((b) => {
      b.onclick = () => goto(b.dataset.goto);
    });
    bindDock();
    const errSearch = $('#errSearch');
    if (errSearch) errSearch.addEventListener('input', paintErrCodes);
    $('#btnErrSource').onclick = () => {
      if (!errInfo) return;
      modal('错误码库来源', '<p>当前配置集：<b>' + esc(errInfo.profile || '-') +
        '</b>（' + esc(errInfo.style) + ' 固件风格）</p>' +
        '<p>来源：' + (errInfo.source === 'custom' ?
        '本配置集自定义错误码库' : '固件风格默认库') + '，共 ' +
        (errInfo.count || 0) + ' 条。</p>' +
        '<p class="hint mono" style="word-break:break-all">' + esc(errInfo.file || '') +
        '</p>' +
        '<p class="hint">切换配置集时错误码库会自动跟随切换；新增/删除会写入上面的自定义文件。</p>',
        [{ text: '关闭' }]);
    };
    $('#btnErrAdd').onclick = errAddDialog;
    $('#btnErrReset').onclick = () => {
      modal('还原默认错误码库', '<p>将删除当前配置集的自定义错误码库，' +
        '还原为「' + esc((errInfo && errInfo.style) || '') + '」固件风格默认内容。</p>',
        [{ text: '取消' }, {
          text: '还原', cls: 'danger-btn', onClick: async () => {
            const r = await call('reset_error_codes');
            if (r && r.ok) {
              errCodes = r.codes || [];
              errInfo = r.info || null;
              paintErrCodes();
              toast('已还原为默认错误码库', 'ok');
            } else toast((r && r.error) || '还原失败', 'err');
          } }]);
    };
    $('#btnPresetPreview').onclick = previewPreset;
    $('#btnPresetRun').onclick = runPreset;
    $('#btnCancelRun').onclick = async () => {
      await call('cancel_run');
      toast('已请求停止', 'info');
    };
    $('#btnCancelSuite').onclick = $('#btnCancelRun').onclick;
    $('#btnRunSuite').onclick = runSuite;
    $('#btnSelAll').onclick = () => {
      ((S.boot && S.boot.suites) || []).forEach((s) =>
        s.cases.forEach((c) => S.selected.add(c.id)));
      syncChips();
    };
    $('#btnSelNone').onclick = () => { S.selected.clear(); syncChips(); };
    $('#btnSelSafe').onclick = () => {
      S.selected.clear();
      ((S.boot && S.boot.suites) || []).forEach((s) =>
        s.cases.forEach((c) => { if (!c.skip && !c.dangerous) S.selected.add(c.id); }));
      syncChips();
    };
    $('#btnExportMd').onclick = () => exportReport('md');
    $('#btnExportCsv').onclick = () => exportReport('csv');
    $('#btnExportHtml').onclick = () => exportReport('html');
    $('#btnExportJson').onclick = () => exportReport('json');
    $('#btnExportDash').onclick = () => exportReport('md');
    $('#btnAddBtn').onclick = () => editButton(null);
    $('#btnAddPreset').onclick = () => editPreset(null);
    $('#btnAddSuite').onclick = () => editSuite(null);
    $('#btnAddCmd').onclick = () => editCommand(null);
    $('#btnImport').onclick = doImport;
    $('#btnExportBtns').onclick = async () => {
      const r = await call('export_buttons');
      if (r && r.ok) { toast('已导出：' + r.path, 'ok'); await call('open_path', { path: r.path }); }
    };
    $('#btnResetBtns').onclick = async () => {
      modal('恢复默认按钮', '<p>将清空自定义按钮并恢复内置 5 个，确定？</p>',
        [{ text: '取消' }, {
          text: '确定', cls: 'primary-btn', onClick: async () => {
            await call('reset_buttons');
            S.buttons = await callList('get_buttons');
            renderButtons();
            renderDashboard();
            toast('已恢复默认', 'ok');
          },
        }]);
    };
    $('#btnFavAdd').onclick = () => favToggle($('#cmdInput') ? $('#cmdInput').value : '');
    $('#btnFavList').onclick = favDialog;
    $('#btnBulk').onclick = toggleBulkPanel;
    $('#btnBulkRun').onclick = bulkRun;
    $('#btnBulkStop').onclick = bulkStop;
    $('#btnMark').onclick = addBookmark;
    $('#btnSaveBaseline').onclick = saveBaselineDialog;
    $('#btnCompareRun').onclick = compareRunDialog;
    syncFavBtn($('#cmdInput') ? $('#cmdInput').value : '');
    $('#btnSend').onclick = sendFromBar;

    const appendCrLf = $('#chkAppendCRLF');
    if (appendCrLf) {
      const saved = !!(S.config && S.config.ui &&
        S.config.ui.append_crlf !== false);
      appendCrLf.checked = saved;
      appendCrLf.addEventListener('change', () => {
        call('save_config',
          { patch: { ui: { append_crlf: appendCrLf.checked } } });
        toast(appendCrLf.checked ? '已开启：文本发送自动追加换行' :
          '已关闭：文本发送裸发，不带换行', 'info');
      });
    }

    const cmdInput = $('#cmdInput');
    if (cmdInput) {
      cmdInput.addEventListener('input', () => {
        syncFavBtn(cmdInput.value);

        cmdInput.style.height = 'auto';
        const maxH = parseInt(getComputedStyle(cmdInput).lineHeight, 10) * 5 || 96;
        cmdInput.style.height = Math.min(cmdInput.scrollHeight, maxH) + 'px';
      });
    }

    ['#terminal', '#logAll'].forEach((sel) => {
      const el = $(sel);
      if (!el) return;
      el.addEventListener('wheel', (e) => {
        if (!e.ctrlKey || !(S.config && S.config.ui)) return;
        e.preventDefault();
        const cur = S.config.ui.term_font_size || 13;
        const next = Math.min(22, Math.max(10, cur + (e.deltaY < 0 ? 1 : -1)));
        if (next === cur) return;
        S.config.ui.term_font_size = next;
        applyTermFont();
        clearTimeout(window.__termFontTimer);
        window.__termFontTimer = setTimeout(() =>
          call('save_config', { patch: { ui: { term_font_size: next } } }), 300);
      }, { passive: false });
      el.addEventListener('click', (e) => {
        const line = e.target.closest('.log-line');
        if (!line) return;
        const t = line.querySelector('.log-text');
        if (t && t.textContent) copyText(t.textContent);
      });
    });
    $('#cmdInput').addEventListener('keydown', onCmdKey);
    $('#cmdInput').addEventListener('input', acUpdate);
    $('#cmdInput').addEventListener('blur', () => setTimeout(acClose, 180));
    $('#cmdSearch').addEventListener('input', (e) => {
      cmdKeyword = e.target.value.trim();
      clearTimeout(window.__cmdTimer);
      window.__cmdTimer = setTimeout(renderCommands, 220);
    });
    $('#chkAutoScroll').addEventListener('change', (e) => {
      call('save_config', { patch: { ui: { auto_scroll: e.target.checked } } });
      if (e.target.checked) scrollTerm();
    });
    $('#chkTimestamp').addEventListener('change', (e) => {
      call('save_config', { patch: { ui: { timestamps: e.target.checked } } });
      rerenderLogs();
    });

    function bindLogFilter(chipsSel, searchSel, target) {
      $$(chipsSel + ' .chip').forEach((chip) => {
        chip.onclick = () => {
          $$(chipsSel + ' .chip').forEach((c) => c.classList.remove('on'));
          chip.classList.add('on');
          target.type = chip.dataset.type || 'all';
          rerenderLogs();
        };
      });
      const box = $(searchSel);
      if (box) box.addEventListener('input', (e) => {
        target.kw = e.target.value.trim();
        clearTimeout(window.__logFilterTimer);
        window.__logFilterTimer = setTimeout(rerenderLogs, 160);
      });
    }
    bindLogFilter('#logChips', '#logSearch', S.logFilter);
    S.logFilter2 = { type: 'all', kw: '' };
    bindLogFilter('#logChips2', '#logSearch2', S.logFilter2);
    $('#btnClearLog2').onclick = () => {
      clearLogs();
      toast('日志已清空', 'ok');
    };
    $('#btnExportLog2').onclick = async () => {
      const r = await call('export_logs', { logs: S.logs.filter(isProgram).slice(-2000) });
      if (r && r.ok) { toast('已导出程序日志：' + r.path, 'ok'); await call('open_path', { path: r.path }); }
    };
    $('#btnLogFiles2').onclick = logFilesDialog;
    $('#chkHexView').addEventListener('change', (e) => {
      S.logFilter.hex = e.target.checked;
      call('save_config', { patch: { ui: { hex_view: e.target.checked } } });
      rerenderLogs();
    });
    $('#btnClearLog').onclick = () => {
      clearLogs();
      toast('日志已清空', 'ok');
    };
    $('#btnLogFiles').onclick = logFilesDialog;
    $('#btnMacro').onclick = () => {
      if (!S.macro) {
        if (!S.connected) return toast('请先连接串口', 'warn');
        S.macro = [];
        setMacroBtn(true);
        toast('宏录制已开始：手动发送的每条指令都会被记录', 'ok');
      } else stopMacroDialog();
    };
    $('#btnSignal').onclick = toggleSignal;
    $('#btnLoopSend').onclick = loopSendDialog;
    $('#btnAutoReply').onclick = autoReplyDialog;
    const bs = $('#btnLoopStop'); if (bs) bs.onclick = stopLoopSendNow;


    $('#btnResetCounters').onclick = async () => {
      const r = await call('reset_counters');
      toast(r && r.ok ? '收发计数已清零' : ((r && r.error) || '失败'),
        r && r.ok ? 'ok' : 'err');
    };
    $('#btnOpenLogs').onclick = async () => {
      const r = await call('open_logs_folder');
      if (!r || !r.ok) toast((r && r.error) || '打开失败', 'err');
    };
    $('#btnExportLog').onclick = async () => {
      const r = await call('export_logs', { logs: S.logs.filter(isSerial).slice(-2000) });
      if (r && r.ok) { toast('已导出串口日志：' + r.path, 'ok'); await call('open_path', { path: r.path }); }
    };
    $('#btnOpenData').onclick = async () => {
      const r = await call('open_data_folder');
      toast(r && r.ok ? '已打开数据目录' : r.path, 'info');
    };
    $('#btnProfileNew').onclick = newProfileDialog;
    $('#btnProfileDup').onclick = duplicateProfileDialog;
    $('#btnProfileImport').onclick = importProfileDialog;
    $('#btnProfileExport').onclick = exportCurrentProfile;
    $('#btnProfileDel').onclick = deleteProfileDialog;
    $('#btnProfileDir').onclick = async () => {
      const r = await call('open_profiles_dir');
      toast(r && r.ok ? '已打开配置集目录' : ((r && r.path) || '打开失败'), 'info');
    };
    $('#btnSelfTest').onclick = runSelfTest;
    $('#btnResetCfg').onclick = async () => {
      modal('恢复默认设置', '<p>串口与界面设置会恢复默认值（按钮数据不受影响）。</p>',
        [{ text: '取消' }, {
          text: '确定', cls: 'primary-btn', onClick: async () => {
            const r = await call('reset_config');
            if (r && r.config) { S.config = r.config; applyTheme(); renderSettings(); }
            toast('已恢复默认设置', 'ok');
          },
        }]);
    };
    $('#modalClose').onclick = closeModal;
    $('#modalBackdrop').onclick = closeModal;
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        showShortcuts();
        return;
      }
      if (e.key === 'Escape') {

        const ac = $('#acBox');
        if (ac && !ac.hidden) { acClose(); return; }
        const bulk = $('#bulkPanel');
        if (bulk && !bulk.hidden) { bulk.hidden = true; return; }
        const sig = $('#sigPanel');
        if (sig && !sig.hidden) { sig.hidden = true; return; }
        closeModal();
      }

      if (e.ctrlKey && !e.altKey && !e.shiftKey) {
        const k = (e.key || '').toLowerCase();
        if (k === 'l') {
          e.preventDefault();
          clearLogs(); updateLogStats(); toast('日志已清空', 'ok');
        } else if (k === 'f') {
          e.preventDefault();
          const box = $('#logSearch');
          if (box) { box.focus(); box.select(); }
        } else if (k === 'h') {
          e.preventDefault();
          const chk = $('#chkHexView');
          chk.checked = !chk.checked;
          chk.dispatchEvent(new Event('change'));
        } else if (k === 't') {
          e.preventDefault();
          const chk = $('#chkTimestamp');
          chk.checked = !chk.checked;
          chk.dispatchEvent(new Event('change'));
        } else if (k === 'm') {
          e.preventDefault();
          addBookmark();
        }
      }
    });



    const inApp = () => !!(window.pywebview && window.pywebview.api);
    $('#btnMin').onclick = () => {
      if (inApp()) call('window_system_command', { command: 'minimize' }).catch(() => {});
    };
    $('#btnMax').onclick = () => { toggleMaximize(); };
    $('#btnClose').onclick = () => { call('close_window').catch(() => {}); };
    $('#btnPin').onclick = async () => {
      if (!inApp()) return;
      const cur = !!(S.config && S.config.window && S.config.window.topmost);
      const r = await call('set_topmost', { on: !cur });
      if (r && r.ok) {
        S.config.window = S.config.window || {};
        S.config.window.topmost = r.topmost;
        updatePinBtn();
        toast(r.topmost ? '窗口已置顶' : '已取消置顶', 'ok');
      }
    };
    $('#btnHelp').onclick = () => showShortcuts();

    const sbBytes = $('#sbBytes');
    if (sbBytes) sbBytes.onclick = async () => {
      if (!S.connected) return;
      const r = await call('reset_counters');
      if (r && r.ok !== false) {
        S.byteSamp = { t: 0, in: 0, out: 0 };
        toast('收发计数已清零', 'ok');
      }
    };

    bindTitlebarDrag();
    bindResize();
    bindWindowPresets();
    bindRipple();
    bindGlobalKeys();
  }

  function bindGlobalKeys() {
    // F11：用「最大化」代替浏览器原生全屏，这样全屏时任务栏依然保留
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F11' && !!(window.pywebview && window.pywebview.api)) {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        toggleMaximize();
      }
    });
  }



  function bindTitlebarDrag() {
    const area = $('.titlebar-drag');
    if (!area) return;

    let dragging = false;

    const isControl = (el) => !!el.closest(
      'select, input, button, .serial-bar, .profile-picker, .no-drag');

    const ready = () => !!(window.pywebview && window.pywebview.api);

    area.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (isControl(e.target)) return;
      if (dragging) return;

      if (!ready()) { jsDragWindow(e); return; }
      e.preventDefault();
      dragging = true;

      call('start_window_drag').then((r) => {
        dragging = false;
        if (!(r && r.ok)) {
          if (r && r.error) jsDragWindow(e);
          return;
        }
        if (r.rect && r.rect.ok) {
          _winRect = r.rect;
          paintWinSize(r.rect);
        }
        refreshWinSize();
      }).catch(() => { dragging = false; });
    });

    area.addEventListener('dblclick', (e) => {
      if (isControl(e.target)) return;
      toggleMaximize();
    });

    area.addEventListener('contextmenu', (e) => {
      if (!ready()) return;
      e.preventDefault();
      call('window_system_menu').catch(() => {});
    });
  }


  async function jsDragWindow(e) {
    if (!(window.pywebview && window.pywebview._jsApiCallback)) return;
    e.preventDefault();
    const rect0 = await call('get_window_rect').catch(() => null);
    if (!rect0 || !rect0.ok) return;
    const x0 = rect0.x, y0 = rect0.y, sx = e.screenX, sy = e.screenY;
    let moved = false;
    const onMove = (ev) => {
      moved = true;
      window.pywebview._jsApiCallback('pywebviewMoveWindow',
        [x0 + ev.screenX - sx, y0 + ev.screenY - sy], '');
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove, true);
      window.removeEventListener('mouseup', onUp, true);
      if (moved) {
        call('commit_window_state').catch(() => {});
        refreshWinSize();
      }
    };
    window.addEventListener('mousemove', onMove, true);
    window.addEventListener('mouseup', onUp, true);
  }

  let _maximized = false;
  function toggleMaximize() {
    if (!(window.pywebview && window.pywebview.api)) return;
    call('toggle_maximize').then((r) => {
      if (r && r.ok) _maximized = !!r.maximized;
      refreshWinSize();
    }).catch(() => {});
  }


  function bindDock() {
    const bar = $('#dockBar');
    if (bar) bar.onclick = () => setDockOpen(!S.dockOpen);
    const collapse = $('#dockCollapse');
    if (collapse) collapse.onclick = () => setDockOpen(false);
    const goto1 = $('#dockGotoTerm');
    if (goto1) goto1.onclick = () => { setDockOpen(false); goto('terminal'); };
    const exp = $('#dockExport');
    if (exp) exp.onclick = async () => {
      const r = await call('export_logs', { logs: S.logs.filter(isSerial).slice(-2000) });
      if (r && r.ok) { toast('已导出串口日志：' + r.path, 'ok'); await call('open_path', { path: r.path }); }
    };
    const clr = $('#dockClear');
    if (clr) clr.onclick = () => { clearLogs(); toast('日志已清空', 'ok'); };
    setDockOpen(false);
  }

  function bindWindowPresets() {
    const sels = '#btnWinSmall, #btnWinDefault, #btnWinLarge, #btnWinMax';
    const ready = () => !!(window.pywebview && window.pywebview.api);
    const enable = () => $$(sels).forEach((el) => {
      el.disabled = false;
      el.title = '';
    });
    const setSize = async (w, h) => {
      const r = await call('resize_window', { width: w, height: h, fix_point: 'se' });
      if (r && r.ok) {
        _maximized = false;
        await call('commit_window_state').catch(() => {});
      }
      refreshWinSize();
    };
    const wire = (sel, fn) => {
      const el = $(sel);
      if (el) el.onclick = fn;
    };
    wire('#btnWinSmall', () => setSize(1080, 700));
    wire('#btnWinDefault', () => setSize(1120, 720));
    wire('#btnWinLarge', () => setSize(1400, 880));
    wire('#btnWinMax', () => toggleMaximize());
    if (ready()) {
      enable();
    } else {
      $$(sels).forEach((el) => { el.disabled = true; el.title = '浏览器模式下不可用'; });
      window.addEventListener('pywebviewready', enable);
    }
    refreshWinSize();
  }

  let _winRect = null;
  function paintWinSize(r) {
    const el = $('#winSizeText');
    if (!el) return;
    el.textContent = (r && r.ok)
      ? '当前窗口：' + r.width + ' × ' + r.height + '　位置 (' + r.x + ', ' + r.y + ')'
      : '窗口尺寸暂不可读';
  }

  async function refreshWinSize() {
    const el = $('#winSizeText');
    if (!el) return;
    if (!(window.pywebview && window.pywebview.api)) {
      el.textContent = '浏览器模式：窗口大小由浏览器控制（可用 alt+ 快捷键或 F11 全屏）';
      return;
    }
    const r = await call('get_window_rect').catch(() => null);
    if (r && r.ok) _winRect = r;
    paintWinSize(r);
  }


  function bindResize() {
    const layer = $('#resizeLayer');
    const hud = $('#sizeHud');
    const hudText = $('#sizeHudText');
    if (!layer) return;

    let bound = false;

    const enable = () => {
      if (bound) { layer.hidden = false; return; }
      bound = true;
      layer.hidden = false;
      attachResize(layer, hud, hudText);
    };

    if (window.pywebview && window.pywebview.api) {
      enable();
      return;
    }

    window.addEventListener('pywebviewready', enable);
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (window.pywebview && window.pywebview.api) {
        clearInterval(timer);
        enable();
      } else if (tries > 25) {
        clearInterval(timer);
      }
    }, 120);
  }

  const RZ_MIN_W = 1120, RZ_MIN_H = 640;
  function resizeTarget(dir, w0, h0, dx, dy) {
    let w = w0, h = h0;
    if (dir.indexOf('e') >= 0) w = w0 + dx;
    if (dir.indexOf('w') >= 0) w = w0 - dx;
    if (dir.indexOf('s') >= 0) h = h0 + dy;
    if (dir.indexOf('n') >= 0) h = h0 - dy;
    return [Math.max(RZ_MIN_W, Math.round(w)), Math.max(RZ_MIN_H, Math.round(h))];
  }
  window.__AT_RESIZE_TARGET = resizeTarget;

  function attachResize(layer, hud, hudText) {
    let gen = 0, dragging = false, hudTimer = 0;
    let inFlight = false, target = null, targetGen = 0;

    function flush() {
      if (!target || targetGen !== gen) { inFlight = false; target = null; return; }
      const p = target;
      target = null;
      inFlight = true;
      call('resize_window', { width: p[0], height: p[1], fix_point: p[2] })
        .then(flush).catch(flush);
    }

    function push(w, h, dir, my) {
      if (my !== gen) return;
      target = [w, h, dir];
      targetGen = my;
      if (!inFlight) flush();
    }

    function cancel() {
      target = null;
      inFlight = false;
      targetGen = 0;
    }

    $$('.rsz', layer).forEach((handle) => {
      handle.addEventListener('mousedown', async (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        const dir = handle.dataset.dir || 'se';
        const sx = e.screenX, sy = e.screenY;
        cancel();
        const my = ++gen;
        dragging = true;
        _maximized = false;
        document.body.classList.add('resizing');
        clearTimeout(hudTimer);

        const rect = await call('get_window_rect').catch(() => null);
        if (my !== gen) return;
        const w0 = (rect && rect.ok) ? rect.width : Math.round(window.outerWidth);
        const h0 = (rect && rect.ok) ? rect.height : Math.round(window.outerHeight);
        hudText.textContent = w0 + ' × ' + h0;
        hud.hidden = false;

        const onMove = (ev) => {
          if (my !== gen) return;
          const xy = resizeTarget(dir, w0, h0, ev.screenX - sx, ev.screenY - sy);
          hudText.textContent = xy[0] + ' × ' + xy[1];
          push(xy[0], xy[1], dir, my);
        };
        const onUp = () => {
          window.removeEventListener('mousemove', onMove, true);
          window.removeEventListener('mouseup', onUp, true);
          if (my !== gen) return;
          gen++;
          cancel();
          dragging = false;
          document.body.classList.remove('resizing');
          hudTimer = setTimeout(() => { if (!dragging) hud.hidden = true; }, 800);
          call('commit_window_state').catch(() => {});
          refreshWinSize();
        };
        window.addEventListener('mousemove', onMove, true);
        window.addEventListener('mouseup', onUp, true);
      });
    });
  }

  async function sendFromBar() {
    const input = $('#cmdInput');
    const text = input.value.trim();
    if (!text) return;
    if (busyState()) return toast('批量任务执行中，已锁定下发', 'warn');
    if (!S.connected) return toast('请先连接串口', 'warn');
    const mode = $('#sendMode').value;
    if (mode === 'hex') {
      const r = await call('send_raw_hex', { hex_str: text });
      toast(r && r.ok ? '已发送 ' + r.written + ' 字节' : (r && r.error) || '发送失败',
        r && r.ok ? 'ok' : 'err');
    } else {
      const appendCrLf = $('#chkAppendCRLF');
      const opts = (appendCrLf && appendCrLf.checked)
        ? null
        : { line_ending: 'NONE' };
      const r = await doSend(text, opts);
      if (r && r.ok) {
        S.history.unshift(text);
        S.histIdx = -1;
        input.value = '';

        input.rows = 1;
        input.style.height = 'auto';
        acClose();
        if (Array.isArray(S.macro)) S.macro.push(text);
      }
    }
  }


  let acItems = [], acIdx = -1;

  function acClose() {
    acItems = []; acIdx = -1;
    const box = $('#acBox');
    if (box) { box.hidden = true; box.innerHTML = ''; }
  }

  function acUpdate() {
    const box = $('#acBox'), inp = $('#cmdInput');
    if (!box || !inp) return;
    const raw = inp.value.trim().toUpperCase().replace(/\s+/g, '');
    const pool = S.cmdSuggest || [];
    if (!pool.length || raw.length < 2 || !raw.startsWith('AT')) return acClose();
    const base = raw.replace(/^AT\+?/, 'AT+');
    acItems = pool.filter((c) => c.id && c.id.toUpperCase().startsWith(base) &&
      c.id.toUpperCase() !== base).slice(0, 8);
    if (!acItems.length) return acClose();
    acIdx = -1;
    box.innerHTML = acItems.map((c, i) =>
      '<div class="ac-item" data-i="' + i + '" title="' +
      esc(c.desc || c.summary || '') + '"><b>' + esc(c.id) + '</b>' +
      '<span>' + esc(c.summary || '') + '</span></div>').join('');
    box.hidden = false;
    window.renderIcons(box);
    $$('.ac-item', box).forEach((el) => {
      el.onclick = () => acPick(parseInt(el.dataset.i, 10));
    });
  }

  function acMove(delta) {
    if (!acItems.length) return;
    acIdx = (acIdx + delta + acItems.length) % acItems.length;
    $$('#acBox .ac-item').forEach((el, i) =>
      el.classList.toggle('on', i === acIdx));
  }

  function acPick(i) {
    const inp = $('#cmdInput');
    const item = acItems[i != null ? i : acIdx];
    if (!item) return;
    inp.value = item.id;
    acClose();
    inp.focus();
  }

  function onCmdKey(e) {
    const box = $('#acBox');
    const acOpen = box && !box.hidden && acItems.length;
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      // Ctrl+Enter 永远直接发送，即使候选框开着也不选词
      e.preventDefault();
      if (acOpen) acClose();
      sendFromBar();
      return;
    }
    if (e.key === 'ArrowDown') {
      if (acOpen) { e.preventDefault(); acMove(1); return; }
    } else if (e.key === 'ArrowUp') {
      if (acOpen) { e.preventDefault(); acMove(-1); return; }
    } else if (acOpen && (e.key === 'Tab' || e.key === 'Enter')) {
      e.preventDefault();
      acPick(acIdx >= 0 ? acIdx : 0);
      return;
    } else if (e.key === 'Escape' && acOpen) {
      acClose();
      return;
    }

    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && S.history.length) {
      const t = e.target, start = t.selectionStart || 0, end = t.selectionEnd || 0;
      const len = t.value.length;
      if (e.key === 'ArrowUp' && start === 0 && end === 0) {
        e.preventDefault();
        S.histIdx = Math.min(S.histIdx + 1, S.history.length - 1);
        t.value = S.histIdx < 0 ? '' : S.history[S.histIdx];
      } else if (e.key === 'ArrowDown' && start === len && end === len) {
        e.preventDefault();
        S.histIdx = Math.max(S.histIdx - 1, -1);
        t.value = S.histIdx < 0 ? '' : S.history[S.histIdx];
      }
    }
  }

  async function doImport() {
    const body = '<div class="field"><label>粘贴按钮 JSON 内容</label>' +
      '<textarea class="inp" id="impText" rows="8" placeholder=\'{"buttons":[...]}\'></textarea>' +
      '<span class="hint">可通过「导出」得到同样格式的文件，复制内容粘贴到这里</span></div>';
    modal('导入按钮', body, [
      { text: '取消' },
      {
        text: '导入', cls: 'primary-btn', onClick: async () => {
          const text = $('#impText').value;
          const r = await call('import_buttons', { data: text });
          if (r && r.ok) {
            S.buttons = await callList('get_buttons');
            renderButtons();
            renderDashboard();
            toast('已导入 ' + r.count + ' 个按钮', 'ok');
          } else toast((r && r.error) || '导入失败', 'err');
        },
      },
    ]);
  }



  window.__AT = { S, call, toast, modal, closeModal, goto, esc, syncSerialUI };


  function isDesktopLoad() {
    return location.protocol === 'file:' ||
      new URLSearchParams(location.search).has('desktop');
  }

  function waitForBridge(timeout = 10000) {
    if (!isDesktopLoad()) return Promise.resolve(false);
    const ready = () => !!(window.pywebview && window.pywebview.api &&
      Object.keys(window.pywebview.api).length > 0);
    return new Promise((resolve) => {
      if (ready()) return resolve(true);
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearInterval(timer);
        window.removeEventListener('pywebviewready', onReady);
        resolve(ready());
      };
      const onReady = () => setTimeout(finish, 60);
      const timer = setInterval(() => { if (ready()) finish(); }, 100);
      window.addEventListener('pywebviewready', onReady);
      setTimeout(finish, timeout);
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    try { bindAll(); } catch (e) { console.error('bindAll failed', e); }
    const desktop = await waitForBridge();

    document.documentElement.classList.toggle('is-web', !desktop);
    boot();
    startPoll();
  });
})();
