/* My Dev Setup — every animation on this page is driven by anime.js (v3) */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const mk = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- title */
  const title = $('[data-split]');
  const words = title.textContent.trim().split(/\s+/);
  title.textContent = '';
  words.forEach((w, wi) => {
    const ws = document.createElement('span');
    ws.className = 'word';
    for (const ch of w) {
      const c = document.createElement('span');
      c.className = 'char';
      c.textContent = ch;
      if (wi === words.length - 1) c.style.color = 'var(--accent)';
      ws.appendChild(c);
    }
    title.appendChild(ws);
    if (wi < words.length - 1) title.appendChild(document.createTextNode(' '));
  });

  /* --------------------------------------------------- lighting modes */
  const MODES = {
    focus: { c: '#dbe7ff', beam: 0.14, glow: 0.18, fans: true },
    warm: { c: '#ffb066', beam: 0.13, glow: 0.2, fans: true },
    night: { c: '#5a6cff', beam: 0.04, glow: 0.12, fans: true },
    off: { c: '#2a2c36', beam: 0, glow: 0, fans: false },
  };
  let mode = 'focus';

  /* ------------------------------------------------------------ build SVG */
  // AULA keyboard: translucent keys lit by the desk-lighting colour
  const COLS = 14, ROWS = 5;
  const keys = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const k = mk('rect', { x: 428 + c * 20.6, y: 472 + r * 10.2, width: 17, height: 8, rx: 2, class: 'key lit', fill: MODES.focus.c, 'fill-opacity': 0.75 }, $('#keys'));
      k._i = keys.length;
      keys.push(k);
    }

  // light strip on the wall
  for (let i = 0; i < 48; i++) mk('circle', { cx: 150 + i * (900 / 47), cy: 96, r: 3, class: 'led lit', fill: MODES.focus.c }, $('#leds'));

  // IDE: file tree
  ['▾ dev-setup', '  index.html', '  main.js', '  setup3d.html', '  setup3d.js', '  style.css', '  README.md'].forEach((name, i) => {
    const y = 166 + i * 10;
    if (name.trim() === 'main.js') mk('rect', { x: 390, y: y - 7, width: 80, height: 10, fill: '#2a2a44' }, $('#tree'));
    const t = mk('text', { x: 396, y, class: 'svg-mono tiny', fill: name.includes('.js') ? '#ffcb6b' : '#b9bcdf', 'xml:space': 'preserve' }, $('#tree'));
    t.textContent = name;
  });

  // IDE: syntax-highlighted code, each line revealed by its own clip rect (typing effect)
  const CODE = `import anime from 'animejs';

// assemble the desk, one device at a time
const tl = anime.timeline({ easing: 'easeOutExpo' });
tl.add({ targets: '#desk', translateY: [90, 0] })
  .add({ targets: '.screen', opacity: [0, 1],
         delay: anime.stagger(140) })
  .add({ targets: '.key', scale: [0, 1],
         delay: anime.stagger(12, { from: 'center' }) });

// keep the code typing forever
function typeLine(el, i) {
  anime({ targets: el, width: [0, el.dataset.w],
          duration: 600, delay: i * 650 });
}`.split('\n');
  const SYN = { kw: '#c586ff', str: '#9ee68a', com: '#6a7090', num: '#ffcb6b', fn: '#6cb6ff', id: '#e6e8ff', pun: '#9aa0c8' };
  const tokenize = (line) => {
    const re = /(\/\/.*$)|('[^']*')|\b(import|from|const|function|return)\b|\b(\d+)\b|([A-Za-z_$][\w$]*)(?=\()|([A-Za-z_$][\w$]*)|(\s+)|(.)/g;
    const out = [];
    let m;
    while ((m = re.exec(line))) out.push([m[0], SYN[m[1] ? 'com' : m[2] ? 'str' : m[3] ? 'kw' : m[4] ? 'num' : m[5] ? 'fn' : m[6] ? 'id' : 'pun']]);
    return out;
  };
  const defs = $('#scene defs');
  const codeLines = CODE.map((str, i) => {
    const y = 166 + i * 11;
    const num = mk('text', { x: 486, y, class: 'svg-mono tiny', fill: '#4a4e6a', 'text-anchor': 'end' }, $('#code'));
    num.textContent = i + 1;
    const cp = mk('clipPath', { id: `cl${i}` }, defs);
    const clip = mk('rect', { x: 493, y: y - 8, width: 0, height: 11 }, cp);
    const text = mk('text', { x: 494, y, class: 'svg-mono', 'clip-path': `url(#cl${i})`, style: 'white-space:pre' }, $('#code'));
    for (const [txt, col] of tokenize(str)) {
      const ts = mk('tspan', { fill: col }, text);
      ts.textContent = txt;
    }
    return { str, y, clip, text };
  });
  const cursor = $('#cursor');

  // IDE terminal
  const termLines = [0, 1, 2].map((i) => mk('text', { x: 476, y: 349 + i * 9, class: 'svg-mono tiny', fill: '#9aa0c8', 'xml:space': 'preserve' }, $('#term')));
  const LOG = [
    ['$ npm run dev', '#e6e8ff'], ['  ready in 312 ms · http://localhost:5173/', '#9ee68a'], ['  hmr update /main.js', '#8b90a3'],
    ['  hmr update /style.css', '#8b90a3'], ['  ✓ 7 devices on the desk', '#9ee68a'], ['  hmr update /index.html', '#8b90a3'],
  ];

  // Dragon Touch: Claude reply lines
  const dtLines = [100, 96, 104, 70, 46].map((w, i) => mk('rect', { x: 204, y: 266 + i * 7, width: 0, height: 3.2, rx: 1.6, fill: '#f2efe8', opacity: 0.85, 'data-w': w }, $('#dt-lines')));

  // MacBook: test run
  const MB = [['$ npm test', '#e6e8ff'], [' PASS desk.test.js', '#9ee68a'], ['   ✓ builds the desk', '#9aa0c8'], [' PASS screens.test.js', '#9ee68a'], ['   ✓ IDE · Claude · tests', '#9aa0c8'], ['Tests: 7 passed', '#9ee68a'], ['$ git push origin main', '#e6e8ff']];
  const mbLines = MB.map(([txt, col], i) => {
    const t = mk('text', { x: 911, y: 324 + i * 10, class: 'svg-mono tiny', fill: col, 'xml:space': 'preserve', opacity: 0 }, $('#mb-lines'));
    t.textContent = txt;
    return t;
  });

  /* ------------------------------------------------------- setup cards */
  const ICON = {
    monitor: '<rect x="4" y="8" width="40" height="26" rx="3"/><path d="M20 34v6M28 34v6M14 40h20"/>',
    portable: '<rect x="6" y="12" width="36" height="22" rx="2"/><path d="M10 38l6-4M38 38l-6-4M8 38h32"/>',
    laptop: '<rect x="10" y="10" width="28" height="20" rx="2"/><path d="M4 36h40l-3-6H7z"/>',
    stand: '<path d="M6 22h36l-4 6H10z"/><circle cx="16" cy="34" r="4"/><circle cx="32" cy="34" r="4"/>',
    keyboard: '<rect x="3" y="14" width="42" height="20" rx="3"/><path d="M9 20h2M15 20h2M21 20h2M27 20h2M33 20h2M9 26h2M15 26h2M33 26h2M18 28h12"/>',
    mouse: '<rect x="14" y="6" width="20" height="36" rx="10"/><path d="M24 6v12"/>',
    mat: '<rect x="4" y="14" width="40" height="20" rx="3"/><path d="M8 18c10 3 20 8 32 12"/>',
  };
  const CARDS = [
    { id: 'aoc', icon: 'monitor', tag: 'AOC 27"', name: 'Main monitor', text: 'The IDE — file tree, tabs, code and the dev server in the terminal.', c: '#ff7a7a' },
    { id: 'dragon', icon: 'portable', tag: 'Dragon Touch 4K', name: 'Portable monitor', text: 'Ultra-thin 15.6" 4K side screen on its smart cover, kept for Claude.', c: '#d9a0ff' },
    { id: 'macbook', icon: 'laptop', tag: 'MacBook Air M1', name: 'Laptop', text: 'Runs the tests and git, and drives the other screens. Silent and fanless.', c: '#7aa2f7' },
    { id: 'stand', icon: 'stand', tag: 'Cooling stand', name: 'Laptop stand', text: 'Lifts the MacBook to eye level with two fans blowing underneath.', c: '#7dcfb6' },
    { id: 'keyboard', icon: 'keyboard', tag: 'AULA Transparent', name: 'Mechanical keyboard', text: 'Clear case and keycaps; the backlight follows the desk lighting.', c: '#9ece6a' },
    { id: 'mouse', icon: 'mouse', tag: 'Mouse', name: 'Mouse', text: 'Right-hand mouse on the big desk mat.', c: '#e0af68' },
    { id: 'mat', icon: 'mat', tag: 'Dota 2 XL', name: 'Desk mat', text: 'Extra-large mat that fits the keyboard and the mouse.', c: '#f7768e' },
  ];
  const SCENE_ID = { aoc: '#aoc', dragon: '#dragon', macbook: '#macbook', stand: '#stand', keyboard: '#keyboard', mouse: '#mouse', mat: '#mat' };
  CARDS.forEach((d) => {
    const a = document.createElement('article');
    a.className = 'card reveal';
    a.style.setProperty('--c', d.c);
    a.dataset.id = d.id;
    a.innerHTML = `<svg class="icon" viewBox="0 0 48 48" aria-hidden="true">${ICON[d.icon]}</svg><p class="tag">${d.tag}</p><h3>${d.name}</h3><p>${d.text}</p>`;
    $('#cards').appendChild(a);
  });

  /* ------------------------------------------------- lighting buttons */
  const fanSpin = anime({ targets: '.fan-blades', rotate: [0, 360], duration: 700, easing: 'linear', loop: true });

  const setMode = (m) => {
    mode = m;
    const M = MODES[m];
    anime({ targets: '.lit', fill: M.c, duration: 700, easing: 'easeOutQuad' });
    anime({ targets: '.lit-stroke', stroke: M.c, duration: 700, easing: 'easeOutQuad' });
    anime({ targets: '#desk-light', opacity: M.beam, duration: 700, easing: 'easeOutQuad' });
    anime({ targets: '#back-glow', opacity: M.glow, duration: 700, easing: 'easeOutQuad' });
    M.fans ? fanSpin.play() : fanSpin.pause();
  };
  $$('.mode').forEach((btn) =>
    btn.addEventListener('click', () => {
      $$('.mode').forEach((b) => b.classList.toggle('is-active', b === btn));
      anime({ targets: btn, scale: [0.85, 1], duration: 600, easing: 'easeOutElastic(1, .5)' });
      setMode(btn.dataset.mode);
      ripple(2 * COLS + 7);
    })
  );

  /* ---------------------------------------------------- key press ripple */
  const LAYOUT = { 1: '1234567890', 2: 'qwertyuiop', 3: 'asdfghjkl', 4: 'zxcvbnm' };
  const keyIndex = (key) => {
    if (key === ' ') return 4 * COLS + 6;
    const ch = key.toLowerCase();
    for (const [row, chars] of Object.entries(LAYOUT)) {
      const c = chars.indexOf(ch);
      if (c >= 0) return (row - 1) * COLS + c + 2 + (row > 2 ? row - 2 : 0);
    }
    return anime.random(0, keys.length - 1);
  };
  function ripple(idx) {
    anime({
      targets: keys,
      translateY: [{ value: 2.5, duration: 90 }, { value: 0, duration: 450 }],
      scale: [{ value: 0.82, duration: 90 }, { value: 1, duration: 450 }],
      delay: anime.stagger(26, { grid: [COLS, ROWS], from: idx }),
      easing: 'easeOutQuad',
    });
    anime({ targets: keys[idx], 'fill-opacity': [1, 0.75], duration: 500, easing: 'easeOutQuad' });
  }
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.repeat || e.target.closest('button, a')) return;
    if (e.key === ' ') e.preventDefault();
    if (e.key.length === 1) ripple(keyIndex(e.key));
  });
  $('#keys').addEventListener('click', (e) => e.target._i !== undefined && ripple(e.target._i));

  /* ------------------------------------------------------------ loops */
  // always on: mug steam, plant sway, cursor blink
  anime({ targets: '#steam path', translateY: [4, -14], opacity: [0, 0.9, 0], duration: 2400, easing: 'easeOutSine', delay: anime.stagger(450), loop: true });
  anime({ targets: '#leaves', rotate: [-2, 2], duration: 3200, direction: 'alternate', easing: 'easeInOutSine', loop: true });
  anime({ targets: cursor, opacity: [1, 0], duration: 500, direction: 'alternate', easing: 'steps(1)', loop: true });

  let loops = [];
  let timers = [];
  let running = false;
  const stopLoops = () => {
    running = false;
    loops.forEach((a) => a.pause());
    timers.forEach(clearTimeout);
    loops = [];
    timers = [];
  };

  // IDE: type the file line by line, hold, then start again
  const typeLoop = () => {
    if (!running) return;
    const tl = anime.timeline({ easing: 'linear', complete: typeLoop });
    tl.add({ targets: codeLines.map((l) => l.clip), width: 0, duration: 1 });
    for (const L of codeLines) {
      const w = L.text.getComputedTextLength();
      const d = Math.max(90, L.str.length * 26);
      tl.add({ targets: L.clip, width: [0, w + 2], duration: d })
        .add({ targets: cursor, x: [494, 494 + w + 1], y: [L.y - 7, L.y - 7], duration: d }, `-=${d}`);
    }
    tl.add({ targets: { v: 0 }, v: 1, duration: 2600 });
    loops.push(tl);
  };

  // IDE terminal: a new log line every 1.6 s
  let logIdx = 0;
  const pushLog = () => {
    if (!running) return;
    termLines.forEach((t, i) => {
      const [txt, col] = LOG[(logIdx + i) % LOG.length];
      t.textContent = txt;
      t.setAttribute('fill', col);
    });
    anime({ targets: termLines[2], opacity: [0, 1], translateY: [4, 0], duration: 400, easing: 'easeOutQuad' });
    logIdx++;
    timers.push(setTimeout(pushLog, 1600));
  };

  const startLoops = () => {
    if (running) return;
    running = true;
    typeLoop();
    pushLog();
    // Claude: question bubble, streamed answer, code block, then the next one
    const dt = anime.timeline({ easing: 'easeOutQuad', loop: true });
    dt.add({ targets: ['#dt-bubble', '#dt-code', ...dtLines], opacity: 0, duration: 1 })
      .add({ targets: dtLines, width: 0, duration: 1 })
      .add({ targets: '#dt-bubble', opacity: [0, 1], translateX: [10, 0], duration: 400 })
      .add({ targets: dtLines, opacity: [0.85, 0.85], duration: 1 })
      .add({ targets: dtLines, width: (el) => [0, +el.dataset.w], duration: 650, easing: 'linear', delay: anime.stagger(650) }, '+=500')
      .add({ targets: '#dt-code', opacity: [0, 1], duration: 400 })
      .add({ targets: ['#dt-bubble', '#dt-code', ...dtLines], opacity: 0, duration: 400 }, '+=2600');
    // MacBook: tests run, then git push
    const mb = anime.timeline({ easing: 'easeOutQuad', loop: true });
    mb.add({ targets: mbLines, opacity: 0, duration: 1 })
      .add({ targets: mbLines, opacity: [0, 1], translateX: [-4, 0], duration: 300, delay: anime.stagger(420) })
      .add({ targets: mbLines, opacity: 0, duration: 400 }, '+=2500');
    loops.push(dt, mb);
  };

  /* ---------------------------------------------------- boot sequence */
  let bootTl;
  const introTargets = ['.title .char', '.eyebrow', '.sub', '.controls', '.hint', '#desk', '#plant', '#dragon', '#aoc', '#stand', '#macbook', '#mat', '#mouse', '#mug', '#notebook', '.key', '.led', '#desk-light', '.screen-ui'];

  const boot = () => {
    if (bootTl) bootTl.pause();
    stopLoops();
    anime.set(introTargets.join(','), { opacity: 0 });

    bootTl = anime.timeline({ easing: 'easeOutExpo' });
    bootTl
      .add({ targets: '.title .char', translateY: ['0.6em', 0], opacity: [0, 1], duration: 900, delay: anime.stagger(30) })
      .add({ targets: ['.eyebrow', '.sub', '.controls', '.hint'], translateY: [20, 0], opacity: [0, 1], duration: 700, delay: anime.stagger(90) }, '-=800')
      .add({ targets: '#desk', translateY: [90, 0], opacity: [0, 1], duration: 900 }, '-=700')
      .add({ targets: ['#dragon', '#aoc', '#stand'], translateY: [-280, 0], opacity: [0, 1], duration: 1300, easing: 'easeOutElastic(1, .7)', delay: anime.stagger(140) }, '-=600')
      .add({ targets: '#macbook', translateY: [-220, 0], opacity: [0, 1], duration: 1100, easing: 'easeOutBounce' }, '-=900')
      .add({ targets: '#plant', translateY: [30, 0], opacity: [0, 1], duration: 700 }, '-=900')
      .add({ targets: '#mat', scaleX: [0, 1], opacity: [0, 1], duration: 700 }, '-=800')
      .add({ targets: ['#mouse', '#mug', '#notebook'], scale: [0, 1], opacity: [0, 1], duration: 700, easing: 'easeOutBack', delay: anime.stagger(90) }, '-=500')
      .add({ targets: '.key', scale: [0, 1], opacity: [0, 1], duration: 500, easing: 'easeOutBack', delay: anime.stagger(12, { grid: [COLS, ROWS], from: 'center' }) }, '-=600')
      .add({ targets: '.led', r: [0, 3], opacity: [0, 1], duration: 500, delay: anime.stagger(14, { from: 'center' }) }, '-=900')
      .add({ targets: '#desk-light', opacity: [0, MODES[mode].beam], duration: 900, easing: 'linear' }, '-=700')
      .add({ targets: '.screen-ui', opacity: [0, 1], duration: 500, easing: 'linear', delay: anime.stagger(250) }, '-=500');

    bootTl.finished.then(startLoops);
    if (reduceMotion) {
      bootTl.seek(bootTl.duration);
      startLoops();
    }
  };
  $('#replay').addEventListener('click', boot);
  boot();

  /* ------------------------------------------------------ mouse parallax */
  if (!reduceMotion) {
    $('.hero').addEventListener('mousemove', (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      anime.remove(['#layer-back', '#layer-front']);
      anime({ targets: '#layer-back', translateX: nx * -26, translateY: ny * -14, duration: 900, easing: 'easeOutQuad' });
      anime({ targets: '#layer-front', translateX: nx * 10, translateY: ny * 5, duration: 900, easing: 'easeOutQuad' });
    });
  }

  /* ------------------------------------------------- scroll reveal + stats */
  const countUp = (el) => {
    const o = { v: 0 };
    anime({ targets: o, v: +el.dataset.to, round: 1, duration: 2000, easing: 'easeOutExpo', update: () => (el.textContent = o.v) });
  };
  const io = new IntersectionObserver(
    (entries) => {
      const shown = entries.filter((e) => e.isIntersecting).map((e) => e.target);
      if (!shown.length) return;
      shown.forEach((el) => io.unobserve(el));
      anime({
        targets: shown,
        translateY: [40, 0],
        opacity: [0, 1],
        duration: 900,
        easing: 'easeOutExpo',
        delay: anime.stagger(100),
        begin: () => shown.forEach((el) => { const n = $('.num', el); if (n) countUp(n); }),
        complete: () => shown.forEach((el) => (el._revealed = true)),
      });
    },
    { threshold: 0.2 }
  );
  $$('.reveal').forEach((el) => io.observe(el));

  /* ------------------------------------------- card hover ↔ scene device */
  $$('.card').forEach((card) => {
    const iconParts = $$('.icon > *', card);
    card.addEventListener('mouseenter', () => {
      anime({ targets: iconParts, strokeDashoffset: [anime.setDashoffset, 0], duration: 900, easing: 'easeInOutSine', delay: anime.stagger(60) });
      anime({ targets: SCENE_ID[card.dataset.id], opacity: [0.35, 1], duration: 700, easing: 'easeOutQuad' });
    });
    card.addEventListener('mousemove', (e) => {
      if (!card._revealed) return;
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      anime.remove(card);
      anime({ targets: card, rotateY: px * 12, rotateX: py * -12, translateY: -5, duration: 400, easing: 'easeOutQuad' });
    });
    card.addEventListener('mouseleave', () => {
      anime.remove(card);
      anime({ targets: card, rotateY: 0, rotateX: 0, translateY: 0, duration: 900, easing: 'easeOutElastic(1, .5)' });
    });
  });
})();
