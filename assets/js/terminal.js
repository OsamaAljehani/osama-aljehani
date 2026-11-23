(() => {
  const root = document.documentElement;
  const body = document.body;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (_) {} }
  };
  const home = (document.querySelector('.sb-os') || {}).href || '/';

  /* ---------- Sound (Web Audio, synthesised; starts after first user gesture) ---------- */
  let audio = null;
  let soundOn = store.get('osama-sound') !== 'off';
  const unlock = () => {
    if (audio || !soundOn) return;
    try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {}
  };
  ['keydown', 'pointerdown'].forEach(ev => window.addEventListener(ev, unlock, { capture: true, passive: true }));
  const click = (strength = 1) => {
    if (!soundOn || !audio || audio.state !== 'running') { if (audio && audio.state === 'suspended') audio.resume(); if (!audio || audio.state !== 'running') return; }
    const t = audio.currentTime;
    const len = 0.018 + Math.random() * 0.01;
    const buf = audio.createBuffer(1, Math.ceil(audio.sampleRate * len), audio.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    const src = audio.createBufferSource(); src.buffer = buf;
    const bp = audio.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800 + Math.random() * 900; bp.Q.value = 1.2;
    const g = audio.createGain(); g.gain.value = 0.16 * strength;
    src.connect(bp).connect(g).connect(audio.destination); src.start(t);
  };
  const beep = (freq = 880, dur = 0.12) => {
    if (!soundOn || !audio || audio.state !== 'running') return;
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = 'square'; o.frequency.value = freq; g.gain.value = 0.035;
    g.gain.setTargetAtTime(0, audio.currentTime + dur * 0.7, 0.02);
    o.connect(g).connect(audio.destination); o.start(); o.stop(audio.currentTime + dur);
  };
  const soundBtn = document.querySelector('[data-sound-toggle]');
  const renderSound = () => {
    if (!soundBtn) return;
    soundBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
    soundBtn.querySelector('[data-sound-label]').textContent = soundOn ? 'الصوت: تشغيل' : 'الصوت: إيقاف';
  };
  const toggleSound = () => { soundOn = !soundOn; store.set('osama-sound', soundOn ? 'on' : 'off'); if (soundOn) { unlock(); setTimeout(() => beep(1200, .06), 30); } renderSound(); return soundOn; };
  if (soundBtn) soundBtn.addEventListener('click', toggleSound);
  renderSound();

  /* ---------- Clock & phosphor ---------- */
  const clock = document.querySelector('[data-clock]');
  const tick = () => { if (clock) clock.textContent = new Date().toLocaleTimeString('en-GB', { timeZone: 'America/New_York', hour12: false }); };
  tick(); setInterval(tick, 1000);
  const togglePhosphor = () => {
    root.dataset.phosphor = root.dataset.phosphor === 'amber' ? 'green' : 'amber';
    store.set('osama-phosphor', root.dataset.phosphor);
    return root.dataset.phosphor;
  };
  document.querySelectorAll('[data-phosphor-toggle]').forEach(b => b.addEventListener('click', togglePhosphor));

  /* ---------- Virtual file system ---------- */
  let fs = [];
  try { fs = JSON.parse(document.getElementById('fs-index').textContent); } catch (_) {}
  let cwd = (body.dataset.cwd || '').toUpperCase();
  const cwdPath = () => 'C:\\OSAMA' + (cwd ? '\\' + cwd : '');
  const inDir = dir => fs.filter(f => f.dir === dir);
  const resolve = arg => {
    let a = arg.toUpperCase().replace(/\//g, '\\').replace(/^C:\\OSAMA\\?/, '').replace(/^\\/, '');
    let dir = cwd, name = a;
    if (a.includes('\\')) { const parts = a.split('\\'); name = parts.pop(); dir = parts.join('\\'); if (dir === '..') dir = ''; }
    const pool = inDir(dir).concat(dir === cwd ? [] : []);
    return pool.find(f => f.name === name) || pool.find(f => f.name.split('.')[0] === name) ||
           fs.find(f => f.name === name) || fs.find(f => f.name.split('.')[0] === name && f.type === 'dir');
  };

  /* ---------- Console ---------- */
  const out = document.querySelector('[data-out]');
  const form = document.querySelector('[data-prompt]');
  const input = document.querySelector('[data-cmd]');
  const promptLabel = form && form.querySelector('.prompt');
  const history = JSON.parse(sessionStorage.getItem('osama-history') || '[]');
  let hIndex = history.length;

  const print = (text, cls) => {
    const el = document.createElement('pre');
    if (cls) el.className = cls;
    el.textContent = text;
    out.appendChild(el);
    return el;
  };
  const printAr = text => { const p = document.createElement('p'); p.className = 'out-ar'; p.dir = 'rtl'; p.textContent = text; out.appendChild(p); };
  const go = url => { print('Loading...', 'out-dim'); setTimeout(() => { window.location.href = url; }, reduce ? 0 : 180); };
  const pad = (s, n) => (s + ' '.repeat(n)).slice(0, n);

  const listing = dir => {
    const items = inDir(dir);
    if (dir) items.unshift({ name: '..', type: 'dir', title: 'رجوع' });
    print(` Directory of C:\\OSAMA${dir ? '\\' + dir : ''}\n`, 'out-dim');
    items.forEach(f => {
      const [n, e = ''] = f.name.split('.');
      const line = document.createElement('div');
      line.className = 'out-row';
      line.innerHTML = '';
      const a = document.createElement('a');
      a.href = f.name === '..' ? (body.dataset.up || home) : f.url;
      a.textContent = `${pad(n, 9)}${pad(e, 4)}${f.type === 'dir' ? '<DIR>' : '     '}`;
      a.dir = 'ltr';
      const t = document.createElement('span'); t.dir = 'rtl'; t.textContent = f.title || '';
      line.append(a, t); out.appendChild(line);
    });
    print(`        ${items.length} File(s)        640K bytes free`, 'out-dim');
  };

  const HELP = [
    ['HELP', 'عرض هذه القائمة'],
    ['DIR', 'عرض محتويات المجلد الحالي'],
    ['CD <folder>', 'الدخول إلى مجلد، مثل CD ISSUES أو CD .. للرجوع'],
    ['OPEN <file>', 'فتح ملف، مثل OPEN ABOUT.TXT (أو TYPE)'],
    ['LATEST', 'فتح آخر عدد'],
    ['SUBSCRIBE', 'الاشتراك في الرسالة الأسبوعية'],
    ['COLOR', 'التبديل بين الأخضر والكهرماني'],
    ['SOUND', 'تشغيل صوت لوحة المفاتيح أو إيقافه'],
    ['CLS', 'مسح الشاشة'],
    ['DATE / TIME / VER', 'التاريخ والوقت وإصدار النظام']
  ];

  const aliases = { 'مساعدة': 'HELP', 'افتح': 'OPEN', 'اشترك': 'SUBSCRIBE', 'رجوع': 'CD ..', 'الرئيسية': 'CD \\', 'مسح': 'CLS', 'LS': 'DIR', 'CAT': 'TYPE', 'START': 'OPEN', 'RUN': 'OPEN', '?': 'HELP', 'CLEAR': 'CLS', 'COLOUR': 'COLOR' };

  const run = raw => {
    let line = raw.trim();
    print(`${cwdPath()}>${line.toUpperCase()}`, 'out-echo');
    if (!line) return;
    history.push(line); if (history.length > 30) history.shift(); hIndex = history.length;
    try { sessionStorage.setItem('osama-history', JSON.stringify(history)); } catch (_) {}
    let [cmd, ...rest] = line.split(/\s+/);
    if (aliases[cmd] || aliases[cmd.toUpperCase()]) { const ex = (aliases[cmd] || aliases[cmd.toUpperCase()]).split(' '); cmd = ex[0]; rest = ex.slice(1).concat(rest); }
    cmd = cmd.toUpperCase();
    const arg = rest.join(' ');
    // "CD.." and "CD\" shorthands
    if (/^CD(\.\.|\\)$/.test(cmd)) { rest = [cmd.slice(2)]; cmd = 'CD'; }
    switch (cmd) {
      case 'HELP':
        print('OSAMA-DOS 1.0  —  Commands', 'out-dim');
        HELP.forEach(([c, d]) => { const r = document.createElement('div'); r.className = 'out-row'; const a = document.createElement('code'); a.dir = 'ltr'; a.textContent = pad(c, 18); const s = document.createElement('span'); s.dir = 'rtl'; s.textContent = d; r.append(a, s); out.appendChild(r); });
        break;
      case 'DIR': listing(cwd); break;
      case 'CD': case 'CHDIR': {
        const target = (rest.join(' ') || '').toUpperCase();
        if (!target) { print(cwdPath()); break; }
        if (target === '..') { go(cwd ? home : home); break; }
        if (target === '\\' || target === 'C:\\OSAMA' || target === '/') { go(home); break; }
        const d = fs.find(f => f.type === 'dir' && f.name === target.replace(/^\\/, ''));
        if (d) go(d.url); else print('Invalid directory');
        break;
      }
      case 'OPEN': case 'TYPE': case 'EDIT': {
        if (!arg) { print('Required parameter missing'); break; }
        const f = resolve(arg);
        if (f) go(f.url); else { print('File not found - ' + arg.toUpperCase()); }
        break;
      }
      case 'LATEST': { const f = fs.find(x => x.name === 'LATEST.TXT'); f ? go(f.url) : print('File not found - LATEST.TXT'); break; }
      case 'SUBSCRIBE': case 'SUBSCRIB': case 'SUBSCRIB.EXE': { const f = fs.find(x => x.name === 'SUBSCRIB.EXE'); f ? go(f.url) : print('Bad command or file name'); break; }
      case 'ABOUT': case 'WHOAMI': { const f = fs.find(x => x.name === 'ABOUT.TXT'); f ? go(f.url) : print('File not found'); break; }
      case 'COLOR': print(`Phosphor: ${togglePhosphor().toUpperCase()}`); break;
      case 'SOUND': print(`Sound: ${toggleSound() ? 'ON' : 'OFF'}`); break;
      case 'CLS': out.textContent = ''; document.querySelectorAll('.screen > :not([data-console])').forEach(el => { if (!el.classList.contains('banner')) el.hidden = true; }); break;
      case 'DATE': print('Current date is ' + new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'America/New_York' })); break;
      case 'TIME': print('Current time is ' + new Date().toLocaleTimeString('en-GB', { timeZone: 'America/New_York' }) + ' (Washington)'); break;
      case 'VER': print('OSAMA-DOS Version 1.0\n(C) Osama Aljehani, Washington D.C.'); break;
      case 'EXIT': go(home); break;
      case 'FORMAT': case 'DEL': case 'ERASE': case 'RD': case 'DELTREE': print('Access denied'); beep(220, .2); break;
      default: {
        const f = resolve(cmd);
        if (f) { go(f.url); break; }
        print('Bad command or file name'); beep(220, .15);
        printAr('اكتب HELP لعرض الأوامر المتاحة.');
      }
    }
    form.scrollIntoView({ block: 'end', behavior: reduce ? 'auto' : 'smooth' });
  };

  const sizeInput = () => { if (input) input.style.width = Math.max(1, input.value.length + 1) + 'ch'; };
  if (form && input) {
    sizeInput();
    input.addEventListener('input', () => { sizeInput(); click(); });
    form.addEventListener('submit', e => { e.preventDefault(); click(1.4); run(input.value); input.value = ''; sizeInput(); });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowUp') { e.preventDefault(); if (hIndex > 0) { input.value = history[--hIndex]; sizeInput(); } }
      else if (e.key === 'ArrowDown') { e.preventDefault(); if (hIndex < history.length - 1) { input.value = history[++hIndex]; } else { hIndex = history.length; input.value = ''; } sizeInput(); }
      else if (e.key === 'Tab') {
        const v = input.value; const m = v.match(/^(\S+\s+)?(\S*)$/); if (!m) return;
        const part = (m[2] || '').toUpperCase(); if (!part && !m[1]) return;
        e.preventDefault();
        const cands = inDir(cwd).concat(cwd ? [] : []).map(f => f.name).filter(n => n.startsWith(part));
        if (cands.length === 1) { input.value = (m[1] || '') + cands[0]; sizeInput(); }
        else if (cands.length > 1) { print(cands.join('   ')); }
      } else if (e.key === 'Escape') { input.blur(); }
      else if (e.key.length === 1 || e.key === 'Backspace') { /* sound handled on input */ }
    });
    input.addEventListener('focus', () => form.classList.add('is-focused'));
    input.addEventListener('blur', () => form.classList.remove('is-focused'));
    form.addEventListener('click', () => input.focus());
    if (promptLabel) promptLabel.textContent = cwdPath() + '>';
  }

  /* ---------- Global keys ---------- */
  const rows = () => Array.from(document.querySelectorAll('[data-listing] [data-row]'));
  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA');
    const fkey = document.querySelector(`.fkeys [data-key="${e.key}"]`);
    if (fkey) { e.preventDefault(); click(); fkey.click(); return; }
    if (typing) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const list = rows(); if (!list.length) return;
      e.preventDefault(); click(0.7);
      const i = list.indexOf(document.activeElement);
      const next = e.key === 'ArrowDown' ? (i < 0 ? 0 : Math.min(i + 1, list.length - 1)) : (i < 0 ? list.length - 1 : Math.max(i - 1, 0));
      list[next].focus();
      return;
    }
    if (e.key === 'Enter' && document.activeElement && document.activeElement.matches('[data-row]')) { click(1.4); return; }
    if (e.key === 'Escape') {
      const esc = document.querySelector('[data-esc]');
      const up = esc ? esc.href : (!body.classList.contains('is-home') ? (body.dataset.up || home) : null);
      if (up) { e.preventDefault(); window.location.href = up; }
      return;
    }
    // Start typing anywhere -> focus the prompt
    if (input && e.key.length === 1 && !e.repeat) {
      input.focus();
      // the character itself lands in the input because focus happens before default action
    }
  });

  /* ---------- 404 echo ---------- */
  const p404 = document.querySelector('[data-404-path]');
  if (p404) p404.textContent = decodeURIComponent(location.pathname).toUpperCase().replace(/\//g, '\\');

  /* ---------- Typing animation ---------- */
  const typeIn = () => {
    const cmds = Array.from(document.querySelectorAll('.screen .cmd .typed'));
    if (reduce || !cmds.length) return;
    // Hide everything after each command until it has been "typed"
    const groups = cmds.map(span => {
      const text = span.textContent; span.textContent = '';
      const line = span.closest('.cmd');
      const after = [];
      let el = line.nextElementSibling;
      while (el && !(el.classList.contains('cmd') && el.querySelector('.typed')) && !el.matches('[data-console]') && !el.matches('.hint')) { after.push(el); el = el.nextElementSibling; }
      after.forEach(a => a.classList.add('is-pending'));
      return { span, text, after };
    });
    const tail = Array.from(document.querySelectorAll('[data-console], .hint'));
    tail.forEach(el => el.classList.add('is-pending'));
    let skipped = false, timer;
    const finish = () => {
      skipped = true; clearTimeout(timer);
      groups.forEach(g => { g.span.textContent = g.text; g.after.forEach(a => a.classList.remove('is-pending')); });
      tail.forEach(el => el.classList.remove('is-pending'));
      document.querySelectorAll('[data-row].is-pending-row').forEach(r => r.classList.remove('is-pending-row'));
      window.removeEventListener('keydown', finish, true); window.removeEventListener('pointerdown', finish, true);
    };
    window.addEventListener('keydown', finish, true); window.addEventListener('pointerdown', finish, true);
    let gi = 0, ci = 0;
    const step = () => {
      if (skipped) return;
      const g = groups[gi];
      if (!g) { finish(); return; }
      if (ci < g.text.length) {
        g.span.textContent += g.text[ci++];
        if (ci % 2) click(0.6);
        timer = setTimeout(step, 38 + Math.random() * 40);
        return;
      }
      // reveal output; listing rows appear one by one
      click(1.2);
      g.after.forEach(a => a.classList.remove('is-pending'));
      const rowsHere = g.after.flatMap(a => Array.from(a.querySelectorAll('[data-row]')));
      rowsHere.forEach(r => r.classList.add('is-pending-row'));
      let ri = 0;
      const rowStep = () => {
        if (skipped) return;
        if (ri < rowsHere.length) { rowsHere[ri++].classList.remove('is-pending-row'); timer = setTimeout(rowStep, 45); return; }
        gi++; ci = 0; timer = setTimeout(step, 220);
      };
      timer = setTimeout(rowStep, 120);
    };
    timer = setTimeout(step, 250);
  };

  /* ---------- Boot sequence (home, once per session) ---------- */
  const boot = document.querySelector('[data-boot]');
  let booted = true;
  try { booted = sessionStorage.getItem('osama-booted') === '1'; sessionStorage.setItem('osama-booted', '1'); } catch (_) {}
  if (!boot || reduce || booted) { typeIn(); return; }
  const bootOut = boot.querySelector('[data-boot-text]');
  const lines = [
    'OSAMA-BIOS (C) 1986  Washington Systems Inc.',
    '',
    'Memory Test: 640K OK',
    'Detecting drives... C: WASHINGTON',
    '',
    'Starting OSAMA-DOS 1.0...',
    'Loading ARABIC.SYS ............ OK',
    'Loading NEWS.SYS .............. OK',
    'Loading POLITICS.DRV .......... OK',
    'Loading ECONOMY.DRV ........... OK',
    ''
  ];
  boot.hidden = false;
  let i = 0, timer, ended = false;
  const done = () => { if (ended) return; ended = true; clearTimeout(timer); boot.hidden = true; document.removeEventListener('keydown', done, true); boot.removeEventListener('click', done); typeIn(); };
  const step = () => {
    if (i >= lines.length) { timer = setTimeout(done, 400); return; }
    bootOut.textContent += lines[i++] + '\n';
    if (i === 3) beep(988, .09);
    timer = setTimeout(step, lines[i - 1] === '' ? 60 : 110);
  };
  boot.addEventListener('click', done);
  document.addEventListener('keydown', done, true);
  step();
})();
