/* Enter (motion-v2 E1-E6, 9 Nov 2026): one red screen is the loader, the lock and the door.
   The logo fills like a glass while the first screen really loads. The lock is one button: press and hold "Já, ég er 20 ára
   eða eldri" and it fills like a glass; when it is full the logo splits on its seam and the two halves part. Keyboard and
   assistive-tech activation does not need to hold (it fills by itself). Nothing about the visitor is stored except the
   boolean `viking-age-v1`. Plain rAF + WAAPI: it never waits for GSAP or Lenis from a CDN. */
(() => {
  'use strict';
  const html = document.documentElement, enter = document.querySelector('[data-enter]');
  if (!enter || !html.classList.contains('has-enter')) return;
  const $ = (s, r = enter) => r.querySelector(s), $$ = (s, r = enter) => [...r.querySelectorAll(s)];
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loader = html.classList.contains('has-loader') && !rm, needGate = html.dataset.age !== 'passed';
  const gate = $('[data-gate]'), hold = $('[data-hold]'), no = $('[data-age-no]'), msg = $('[data-gate-message]');
  const doors = [$('.enter__door--l'), $('.enter__door--r')], logos = $$('.enter__logo');
  const ease = { out: 'cubic-bezier(.16,1,.3,1)', io: 'cubic-bezier(.76,0,.24,1)' };
  const set = (k, v) => enter.style.setProperty(k, v), wait = ms => new Promise(r => setTimeout(r, ms));
  let opened = false;

  /* ---- E1: what the fill is really waiting for ---- */
  let done = 0;
  const decode = img => !img ? Promise.resolve() : img.decode ? img.decode().catch(() => {}) : new Promise(r => { img.complete ? r() : (img.onload = img.onerror = r); });
  const loaded = () => document.readyState === 'complete' ? Promise.resolve() : new Promise(r => addEventListener('load', r, { once: true }));
  if (loader) [[document.fonts && document.fonts.ready, .15], [decode(document.querySelector('.world img')), .45], [decode(document.querySelector('img.can')), .25], [loaded(), .15]]
    .forEach(([p, w]) => Promise.resolve(p).catch(() => {}).then(() => { done += w; }));
  function fill() {
    const t0 = performance.now(), MIN = 1500, CAP = 5000; let shown = 0;
    return new Promise(res => {
      const tick = now => {
        const t = now - t0, floor = 1 - Math.pow(1 - Math.min(1, t / MIN), 2.2);   // a cached load still reads as a moment
        const target = t >= CAP ? 1 : Math.min(done, floor);                       // never ahead of what is really loaded
        shown += (target - shown) * .14; if (target - shown < .002) shown = target;
        set('--fill', shown.toFixed(4));
        if (shown >= 1) return res();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }).then(() => wait(180));
  }

  /* ---- E2: the logo glides up, the lock appears under it ---- */
  async function showGate(animated) {
    set('--fill', 1);
    const dock = () => { const phone = innerWidth < 900; return `translateY(${innerHeight * (phone ? .165 : .19) - innerHeight / 2}px) scale(${phone ? .6 : .52})`; };
    logos.forEach(l => l.animate([{ transform: 'none' }, { transform: dock() }], { duration: animated ? 900 : 1, easing: ease.io, fill: 'forwards' }));
    addEventListener('resize', () => { if (opened) return; logos.forEach(l => { l.getAnimations().forEach(a => a.cancel()); l.style.transform = dock(); }); });   // the logo stays docked when the window or the phone turns
    enter.classList.add('is-gate'); const st = $('[data-enter-status]'); if (st) st.textContent = '';
    [...gate.children].forEach((k, i) => k.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: animated ? 800 : 1, easing: ease.out, delay: animated ? 640 + i * 70 : 0, fill: 'backwards' }));
    gate.focus({ preventScroll: true });     // the container, never the first control: nothing is highlighted on open
  }

  /* ---- E3: press and hold. Pointer must hold ~1.1 s; releasing early drains the glass in 260 ms.
         Enter / Space and assistive-tech activation (click with detail 0) fill it by themselves. Reduced motion: one press. ---- */
  const HOLD = 1100;
  let level = 0, held = false, auto = false, raf = 0, last = 0;
  const paint = () => hold.style.setProperty('--hold', level.toFixed(4));
  function frame(now) {
    const dt = Math.min(64, now - (last || now)); last = now;
    level = Math.max(0, Math.min(1, level + (held || auto ? dt / HOLD : -dt / 260)));
    paint();
    if (level >= 1) return pass();
    if (level > 0 || held || auto) raf = requestAnimationFrame(frame); else last = 0;
  }
  const kick = () => { cancelAnimationFrame(raf); last = 0; raf = requestAnimationFrame(frame); };
  if (rm) hold.addEventListener('click', () => { level = 1; paint(); pass(); });
  else {
    hold.addEventListener('pointerdown', e => { if (e.button || opened) return; held = true; try { hold.setPointerCapture(e.pointerId); } catch {} msg.textContent = ''; kick(); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => hold.addEventListener(t, () => { held = false; if (!auto) kick(); }));
    hold.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat && !opened) { e.preventDefault(); auto = true; msg.textContent = ''; kick(); } });
    hold.addEventListener('click', e => { if (e.detail === 0 && !auto && !held && !opened) { auto = true; msg.textContent = ''; kick(); } });
  }
  hold.addEventListener('contextmenu', e => e.preventDefault());
  no.addEventListener('click', () => { msg.textContent = msg.dataset.refusal; });
  gate.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const c = [hold, no], i = c.indexOf(document.activeElement);
    if (document.activeElement === gate || i < 0 || (!e.shiftKey && i === c.length - 1) || (e.shiftKey && i === 0)) { e.preventDefault(); (e.shiftKey ? c.at(-1) : c[0]).focus(); }
  });
  function pass() {
    if (opened) return;
    try { sessionStorage.setItem('viking-age-v1', '1'); } catch {}
    open();
  }

  /* ---- E4/E5: the doors ---- */
  async function open() {
    if (opened) return; opened = true;
    html.dataset.age = 'passed'; try { sessionStorage.setItem('viking-loaded', '1'); } catch {}
    enter.style.pointerEvents = 'none'; hold.disabled = true; no.disabled = true;
    const announce = () => { window.__vikingOpened = true; document.dispatchEvent(new CustomEvent('viking:open')); };
    if (rm) { announce(); enter.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' }); await wait(260); return finish(); }
    if (enter.classList.contains('is-gate')) { gate.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' }); await wait(260); gate.style.display = 'none'; }
    const o = { duration: 1250, easing: ease.io, fill: 'forwards' };
    doors[0].animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-101%)' }], o);
    doors[1].animate([{ transform: 'translateX(0)' }, { transform: 'translateX(101%)' }], o);
    announce();                                                         // site.js starts the arrival about 350 ms in
    await wait(1300); finish();
  }
  function finish() { html.classList.remove('has-enter', 'has-loader'); document.dispatchEvent(new CustomEvent('viking:entered')); }

  (async () => {
    try {
      if (loader) await fill();
      if (needGate) await showGate(loader); else await open();
    } catch { try { sessionStorage.setItem('viking-loaded', '1'); } catch {} opened = true; window.__vikingOpened = true; finish(); document.dispatchEvent(new CustomEvent('viking:open')); }
  })();
  setTimeout(() => { if (!opened && !needGate) open(); }, 12000);       // a stuck loader must never trap the page
})();
