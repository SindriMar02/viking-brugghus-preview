/* Home stage, direction A "Opnun" (MOTION.md O1 to O10). Desktop with motion: a pinned stage whose state is a pure function of scroll progress.
   Phone / reduced motion / no JS: the same moments are full-screen pages (snap on phones), with entrance animations only when motion is allowed. */
(() => {
  'use strict';
  const walk = document.querySelector('[data-walk]'); if (!walk) return;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const html = document.documentElement, stage = $('[data-stage]', walk), strip = $('.strip', walk), dusk = $('[data-dusk]', walk);
  const rm = matchMedia('(prefers-reduced-motion: reduce)'), wide = matchMedia('(min-width: 900px)'), fine = matchMedia('(hover:hover) and (pointer:fine)');
  const UI = () => window.VIKING_UI || {};
  const M = $$('.moment', stage).map(el => ({
    el, world: $('.world', el), win: $('.world__in', el), img: $('.world img', el), dim: $('[data-dimmer]', el),
    chars: $$('.ch', el), swap: $('.can-swap', el), rails: $$('.rail', el), links: $('.moment__links', el),
    tone: el.dataset.tone, toneM: el.dataset.toneM, ground: el.style.getPropertyValue('--ground'), act: el.dataset.act
  }));
  const N = M.length, DUSK = 7, HOLD = .42, TAIL = .55;
  const SEG = M.slice(0, -1).map((_, i) => i === DUSK ? 1.8 : 1);
  const cum = [0]; SEG.forEach(s => cum.push(cum[cum.length - 1] + s));
  const TOTAL = cum[N - 1] + TAIL;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const span = (u, a, b) => clamp((u - a) / (b - a));
  const ease = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  const count = $('[data-count]'), actLabel = $('[data-act]'), marker = $('[data-marker]', walk), jumps = $$('[data-jump]', walk), actDivider = $('.index__act', walk);
  const acts = { urval: actLabel?.textContent || '', jol: walk.closest('html').lang === 'en' ? 'Christmas' : 'Jólin' };
  let on = false, vh = innerHeight, top = 0, frame = 0, pair = [-1, -1], domI = -1, centers = [];

  /* ---------- shared bar/strip tone ---------- */
  function setTone(m, phone) {
    const light = (phone ? m.el.dataset.groundTone : m.el.dataset.groundTone) === 'light';
    html.style.setProperty('--bar-ground', m.ground);
    html.style.setProperty('--bar-ink', light ? 'var(--ljos)' : 'var(--blek)');
    html.dataset.barTone = light ? 'light' : 'dark';
  }
  function clearTone() { html.style.removeProperty('--bar-ground'); html.style.removeProperty('--bar-ink'); delete html.dataset.barTone; }

  /* ---------- pinned mode ---------- */
  function measure() {
    vh = innerHeight;
    walk.style.height = ((TOTAL + 1) * vh) + 'px';
    top = walk.getBoundingClientRect().top + scrollY;
    const box = $('.index', walk)?.getBoundingClientRect();
    centers = jumps.map(a => { const r = a.getBoundingClientRect(); return box ? r.left + r.width / 2 - box.left - 14 : 0; });
  }
  function resetMoment(m) {
    m.el.classList.remove('is-vis', 'is-on', 'is-live');
    m.world.style.transform = m.world.style.opacity = m.world.style.clipPath = m.world.style.zIndex = '';
    if (m.dim) m.dim.style.opacity = '';
    m.chars.forEach(c => { c.style.transform = ''; });
    m.swap.style.transform = m.swap.style.opacity = '';
    [...m.rails, m.links].forEach(el => { el.style.opacity = ''; el.style.translate = ''; });
  }
  const setChars = (m, fn) => { const n = m.chars.length, s = .32 / n; m.chars.forEach((c, k) => { c.style.transform = `translate3d(0,${fn(k, s).toFixed(2)}%,0)`; }); };
  function render() {
    frame = 0; if (!on) return;
    const y = clamp((scrollY - top) / vh, 0, TOTAL);
    let i = N - 1, t = 0;
    for (let k = 0; k < N - 1; k++) if (y < cum[k + 1]) { i = k; t = (y - cum[k]) / SEG[k]; break; }
    const u = i < N - 1 ? span(t, HOLD, 1) : 0, e = ease(u);
    const A = M[i], B = u > 0 ? M[i + 1] : null;
    if (pair[0] !== i || pair[1] !== (B ? i + 1 : -1)) {
      M.forEach((m, k) => { if (k !== i && !(B && k === i + 1)) resetMoment(m); });
      A.el.classList.add('is-vis', 'is-live'); A.world.style.zIndex = 1;
      if (B) { B.el.classList.add('is-vis', 'is-live'); B.world.style.zIndex = 2; B.el.style.zIndex = 2; A.el.style.zIndex = 1; }
      else A.el.style.zIndex = '';
      pair = [i, B ? i + 1 : -1];
      [i + 1, i + 2].forEach(k => M[k]?.img?.decode?.().catch(() => {}));
    }
    const drift = tt => 1 - 2 * clamp(tt);
    // O4 world: outgoing drifts up and grows; incoming settles from larger (crossfade), or is cut in by the dusk edge (O6)
    A.world.style.transform = `translate3d(0,${(drift(t) - 4 * e).toFixed(3)}%,0) scale(${(1 + .05 * e).toFixed(4)})`;
    if (B) {
      B.world.style.transform = `translate3d(0,${(1 + 3 * (1 - e)).toFixed(3)}%,0) scale(${(1.1 - .1 * e).toFixed(4)})`;
      if (i === DUSK) {
        B.world.style.opacity = 1;
        B.world.style.clipPath = `inset(0 0 0 ${(100 * (1 - ease(span(u, 0, .75)))).toFixed(2)}%)`;
        if (B.dim) B.dim.style.opacity = (.62 * (1 - ease(span(u, .35, 1)))).toFixed(3);
      } else {
        B.world.style.opacity = ease(span(u, .08, .7)).toFixed(3); B.world.style.clipPath = '';
      }
      // O3 letters roll out of their slots, the next name rolls in
      setChars(A, (k, s) => -110 * ease(span(u, k * s, k * s + .42)));
      setChars(B, (k, s) => 110 * (1 - ease(span(u, .22 + k * s, .22 + k * s + .42))));
      // O5 cans
      const ao = ease(span(u, 0, .5)), bi = ease(span(u, .3, 1));
      A.swap.style.transform = `translate3d(0,${(-16 * ao).toFixed(2)}vh,0) scale(${(1 - .06 * ao).toFixed(4)})`; A.swap.style.opacity = (1 - ao).toFixed(3);
      B.swap.style.transform = `translate3d(0,${(26 * (1 - bi)).toFixed(2)}vh,0)`; B.swap.style.opacity = ease(span(u, .3, .42)).toFixed(3);
      // O7 rails and links
      const ro = ease(span(u, 0, .38)), ri = ease(span(u, .5, .88));
      [...A.rails, A.links].forEach(el => { el.style.opacity = (1 - ro).toFixed(3); el.style.translate = `0 ${(-12 * ro).toFixed(1)}px`; });
      [...B.rails, B.links].forEach(el => { el.style.opacity = ri.toFixed(3); el.style.translate = `0 ${(12 * (1 - ri)).toFixed(1)}px`; });
    } else {
      A.chars.forEach(c => { c.style.transform = ''; }); A.swap.style.transform = ''; A.swap.style.opacity = '';
      [...A.rails, A.links].forEach(el => { el.style.opacity = ''; el.style.translate = ''; });
      if (A.dim) A.dim.style.opacity = 0;
      A.world.style.opacity = ''; A.world.style.clipPath = '';
    }
    // O8/O9: index marker scrubs; dominant beer flips at u = .5
    const d = B && u >= .5 ? i + 1 : i;
    if (marker && centers.length) marker.style.setProperty('--mx', (centers[i] + ((centers[i + 1] ?? centers[i]) - centers[i]) * (B ? e : 0)).toFixed(1) + 'px');
    if (actDivider) actDivider.classList.toggle('lit', i > DUSK || (i === DUSK && u > .5));
    if (d !== domI) setDominant(d);
  }
  function setDominant(d) {
    const prev = domI; domI = d; const m = M[d];
    M.forEach((x, k) => x.el.classList.toggle('is-on', k === d));
    jumps.forEach((a, k) => { a.classList.toggle('on', k === d); if (k === d) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
    if (on || wide.matches) setTone(m, false); else setTone(m, true);
    if (count) { count.textContent = String(d + 1).padStart(2, '0'); if (prev >= 0 && !rm.matches) { count.classList.remove('tick'); void count.offsetWidth; count.classList.add('tick'); } }
    if (actLabel) actLabel.textContent = acts[m.act] || actLabel.textContent;
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };

  /* ---------- pointer parallax on the world (O10), separate element from the scroll-owned world ---------- */
  const P = { x: 0, y: 0, tx: 0, ty: 0, raf: 0, last: 0 };
  function ptick(now) {
    const k = Math.min(1, ((now - (P.last || now)) || 16) / 1000 * 11); P.last = now;
    P.x += (P.tx - P.x) * k; P.y += (P.ty - P.y) * k;
    const tf = `translate3d(${(-1.2 * P.x).toFixed(3)}%,${(-1.2 * P.y).toFixed(3)}%,0) scale(1.025)`;
    M.forEach(m => { if (m.el.classList.contains('is-vis')) m.win.style.transform = tf; });
    const moving = Math.abs(P.tx - P.x) > .001 || Math.abs(P.ty - P.y) > .001;
    P.raf = moving ? requestAnimationFrame(ptick) : 0; if (!moving) P.last = 0;
  }
  stage.addEventListener('pointermove', e => {
    if (!on || !fine.matches || rm.matches) return;
    P.tx = e.clientX / innerWidth * 2 - 1; P.ty = e.clientY / innerHeight * 2 - 1;
    if (!P.raf) P.raf = requestAnimationFrame(ptick);
  });
  stage.addEventListener('pointerleave', () => { P.tx = P.ty = 0; if (on && !P.raf) P.raf = requestAnimationFrame(ptick); });

  /* ---------- index jump (O8) ---------- */
  jumps.forEach(a => a.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    const j = +a.dataset.jump; e.preventDefault();
    if (on) {
      const y = top + cum[j] * vh + 2, lenis = UI().lenis;
      if (lenis) lenis.scrollTo(y, { duration: 1.2, easing: t => 1 - Math.pow(2, -10 * t) }); else scrollTo({ top: y, behavior: rm.matches ? 'auto' : 'smooth' });
    } else M[j].el.scrollIntoView({ behavior: rm.matches ? 'auto' : 'smooth' });
  }));

  /* ---------- static mode: phone snap pages / reduced motion ---------- */
  let io = null;
  const shown = new WeakSet();
  function enter(m) {
    if (rm.matches || !m.el.isConnected) return;
    const opt = { easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' };
    m.chars.forEach((c, k) => c.animate([{ transform: 'translate3d(0,110%,0)' }, { transform: 'none' }], { ...opt, duration: 620, delay: k * 28 }));
    $('.can-arrive', m.el)?.animate([{ transform: 'translateY(40px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { ...opt, duration: 700, delay: 80 });
    $('.world picture', m.el)?.animate([{ transform: 'scale(1.06)' }, { transform: 'none' }], { ...opt, duration: 900 });
    $$('.rail span, .moment__links > span, .moment__count', m.el).forEach((el, i) => el.animate([{ opacity: 0 }, { opacity: 1 }], { ...opt, duration: 400, delay: 200 + i * 50 }));
  }
  function staticSetup() {
    io?.disconnect();
    io = new IntersectionObserver(entries => entries.forEach(en => {
      const m = M.find(x => x.el === en.target); if (!m) return;
      if (en.intersectionRatio >= .6) { setDominant(M.indexOf(m)); if (!shown.has(m.el)) { shown.add(m.el); if (UI().arrived && M.indexOf(m) > 0) enter(m); } }
      else if (en.intersectionRatio < .15) shown.delete(m.el);
    }), { threshold: [0, .15, .6] });
    M.forEach(m => io.observe(m.el));
    duskFrame();
  }
  // O6 phone: the dusk band, one hard edge sweeping up as it scrolls through
  let dframe = 0;
  function duskFrame() {
    dframe = 0; if (on || !dusk || rm.matches) return;
    // p = 0 when the band's top is half way up the screen, .5 when the band fills it, 1 when half of it has left: the edge is seen travelling
    const r = dusk.getBoundingClientRect(), p = clamp((innerHeight * .5 - r.top) / innerHeight);
    dusk.style.setProperty('--edge', (100 * (1 - ease(p))).toFixed(2) + '%');
  }

  /* ---------- mode switch ---------- */
  function setup() {
    const want = wide.matches && !rm.matches;
    // Keep the beer the visitor is on across a resize or a mode switch (scroll offsets mean different things in each layout).
    const inWalk = walk.getBoundingClientRect().bottom > innerHeight * .5 && walk.getBoundingClientRect().top < innerHeight * .5;
    const keepP = on ? clamp((scrollY - top) / vh, 0, TOTAL) : null, keepI = domI;
    if (want === on && io !== null === !want) { if (on) { measure(); if (inWalk && keepP !== null) scrollTo(0, top + keepP * vh); render(); } return; }
    on = want; pair = [-1, -1]; domI = -1;
    html.classList.toggle('walk-on', on);
    M.forEach(resetMoment); M.forEach(m => { m.el.style.zIndex = ''; m.win.style.transform = ''; });
    if (on) {
      io?.disconnect(); io = null; dusk?.style.removeProperty('--edge');
      UI().fitWords?.(); measure(); if (keepI >= 0 && inWalk) scrollTo(0, top + cum[keepI] * vh); render();
    } else {
      walk.style.height = ''; UI().fitWords?.(); if (keepI >= 0 && inWalk) M[keepI].el.scrollIntoView(); staticSetup();
    }
  }
  addEventListener('scroll', () => { if (on) schedule(); else if (!dframe) dframe = requestAnimationFrame(duskFrame); }, { passive: true });
  // Past the stage the bar goes back to snow (home only).
  const after = $('[data-outro]');
  if (after) new IntersectionObserver(([en]) => { if (en.boundingClientRect.top < 80 && en.isIntersecting || en.boundingClientRect.bottom < 0) clearTone(); else if (domI >= 0) setTone(M[domI], !on); }, { rootMargin: '-80px 0px 0px 0px', threshold: [0, 1] }).observe(after);
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(setup, 120); });
  wide.addEventListener('change', setup); rm.addEventListener('change', setup);
  document.fonts?.ready.then(() => { UI().fitWords?.(); if (on) { measure(); render(); } });
  // Fetch and decode every world and can one by one after the first paint, so no switch waits on a download or a decode.
  function preload() {
    const queue = M.flatMap(m => [m.img, ...$$('img.can', m.el)]).filter(Boolean);
    const next = () => { const img = queue.shift(); if (!img) return; img.loading = 'eager'; (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).finally(() => setTimeout(next, 40)); };
    next();
  }
  addEventListener('load', () => { (window.requestIdleCallback || setTimeout)(preload, { timeout: 1200 }); if (on) { measure(); render(); } });
  addEventListener('pageshow', e => { if (e.persisted) setup(); });
  setup();

  /* ---------- O1/O2 arrival ---------- */
  function arrive() {
    if (rm.matches) return;
    const first = M[on ? Math.max(0, domI) : 0];
    UI().openWord?.(first.el, { canFrom: on ? '34vh' : '40px', duration: 1100 });
    if (on && strip) strip.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: 450, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
    if (on) jumps.forEach((a, k) => a.animate([{ opacity: 0 }, { opacity: a.classList.contains('on') ? 1 : .6 }], { duration: 400, delay: 500 + k * 20, fill: 'backwards' }));
  }
  if (UI().arrived) arrive(); else document.addEventListener('viking:arrive', arrive, { once: true });
})();
