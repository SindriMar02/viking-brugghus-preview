/* focus-guard (_tools/focus-guard): no focus ring after a tap or click; the README says why */
(function () {
  var root = document.documentElement;
  function set(v) { if (root.getAttribute('data-input') !== v) root.setAttribute('data-input', v); }
  addEventListener('pointerdown', function () { set('pointer'); }, true);
  addEventListener('keydown', function (e) {
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;
    set('key');
  }, true);
})();

/* Site shell for direction A "Opnun" (8 Nov 2026): gate, menu, word fitting, page-hero arrival, reveals, tilt, can morph. walk.js owns the home stage. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const html = document.documentElement, page = $('#page'), gate = $('[data-gate]');
  const rm = matchMedia('(prefers-reduced-motion: reduce)'), fine = matchMedia('(hover:hover) and (pointer:fine)');
  const gs = window.gsap, ST = window.ScrollTrigger;
  let lenis = null, lenisFrame = 0, revealContext = null, arrived = false;
  let gateOpen = html.classList.contains('has-enter'), menuOpen = false;
  const animations = new Set();
  // V1: a can that was flown in by the view transition skips the beer page's own can arrival.
  let flownIn = false;
  try { flownIn = sessionStorage.getItem('viking-vt') === location.pathname.split('/').filter(Boolean).pop(); sessionStorage.removeItem('viking-vt'); } catch {}
  html.dataset.flown = flownIn ? '1' : '0';
  function animate(el, frames, options) {
    if (!el || rm.matches || !el.animate) return null;
    const a = el.animate(frames, options); animations.add(a);
    a.finished.catch(() => {}).finally(() => animations.delete(a)); return a;
  }
  function lock() {
    html.style.overflow = gateOpen || menuOpen ? 'hidden' : '';
    if (gateOpen || menuOpen) lenis?.stop(); else lenis?.start();
  }
  function smoothSetup() {
    cancelAnimationFrame(lenisFrame); lenis?.destroy(); lenis = null;
    if (!rm.matches && fine.matches && window.Lenis) {
      lenis = new window.Lenis({ lerp: .11, smoothWheel: true });
      lenis.on('scroll', () => ST?.update());
      const frame = time => { lenis?.raf(time); lenisFrame = requestAnimationFrame(frame); };
      lenisFrame = requestAnimationFrame(frame); lock();
    }
    window.VIKING_UI = { get lenis() { return lenis; }, get reducedMotion() { return rm.matches; }, openWord, fitWords, get arrived() { return arrived; } };
  }
  function reveals() {
    revealContext?.revert(); revealContext = null;
    if (!gs || !ST || rm.matches) return;
    gs.registerPlugin(ST);
    revealContext = gs.context(() => {
      $$('.rv').forEach(el => {
        // Group offsets: 40 ms for range rows, 80 ms for ledger rows.
        const stagger = Number(el.dataset.revealDelay || 0);
        gs.fromTo(el, { opacity: 0, y: 26 }, { opacity: 1, y: 0, ease: 'none', delay: stagger,
          scrollTrigger: { trigger: el, start: 'top 96%', end: 'top 72%', scrub: .6 } });
        const swatch = $('.swatch', el);
        if (swatch) gs.fromTo(swatch, { y: 14 }, { y: 0, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 96%', end: 'top 72%', scrub: .6 } });
      });
    });
  }
  // The beer's name is set as large as it can be: each half fills the space between the can and the page edge (rails stay clear).
  function fitWords(root = document) {
    // Layout offsets, never getBoundingClientRect: the halves may be mid-animation (transforms) when this runs.
    const wide = innerWidth >= 900, margin = wide ? (innerWidth >= 1280 ? 72 : 56) : 12, cap = (wide ? .42 : .15) * innerHeight;
    $$('.word', root).forEach(w => {
      const a = $('.half--a', w), b = $('.half--b', w); if (!a || !b || !a.offsetWidth || !b.offsetWidth) return;
      const fs = parseFloat(getComputedStyle(w).fontSize), W = w.offsetWidth || innerWidth;
      const k = wide ? Math.min((a.offsetLeft + a.offsetWidth - margin) / a.offsetWidth, (W - b.offsetLeft - margin) / b.offsetWidth)
                     : (W - 2 * margin) / Math.max(a.offsetWidth, b.offsetWidth);
      w.style.setProperty('--fs', Math.max(24, Math.min(cap, fs * k)).toFixed(1) + 'px');
    });
  }
  // O1/O12: the word stands closed as one word, then slides open and the can rises through the gap. Animates wrappers only.
  function openWord(scope, { can = true, canFrom = '40px', world = true, duration = 1100 } = {}) {
    if (!scope || rm.matches) return;
    const opt = { duration, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' };
    const a = $('.half--a', scope), b = $('.half--b', scope);
    if (a && b) {
      // closed = the two halves touch at the centre line, so the name first reads as one word, then they part for the can
      if (innerWidth >= 900) {
        const mid = (a.offsetParent?.offsetWidth || innerWidth) / 2, da = mid - (a.offsetLeft + a.offsetWidth), db = b.offsetLeft - mid;
        animate(a, [{ transform: `translate(${da}px,-50%)` }, { transform: 'translate(0,-50%)' }], opt);
        animate(b, [{ transform: `translate(${-db}px,-50%)` }, { transform: 'translate(0,-50%)' }], opt);
      } else {
        const mid = (a.offsetParent?.offsetHeight || innerHeight) / 2, da = mid - (a.offsetTop + a.offsetHeight), db = b.offsetTop - mid;
        animate(a, [{ transform: `translateY(${da}px)` }, { transform: 'none' }], opt);
        animate(b, [{ transform: `translateY(${-db}px)` }, { transform: 'none' }], opt);
      }
    }
    const arrive = $('.can-arrive', scope) || $('.hero-can .can-object', scope);
    if (can && arrive) animate(arrive, [{ transform: `translateY(${canFrom})`, opacity: 0, offset: 0 }, { opacity: 1, offset: .3 }, { transform: 'none', opacity: 1 }], { ...opt, duration: duration - 100, delay: 120 });
    const pic = $('.world picture', scope);
    if (world && pic) animate(pic, [{ transform: 'scale(1.08)' }, { transform: 'none' }], { ...opt, duration: duration + 300 });
    $$('.rail span, .moment__links > span', scope).forEach((el, i) => animate(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 450 + i * 60, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
  }
  // The bar stands on the hero's own ground colour while the hero is under it, then returns to snow (same rule as the home stage).
  function heroBar(hero) {
    const g = getComputedStyle(hero).getPropertyValue('--ground').trim(); if (!/^#[0-9a-f]{6}$/i.test(g)) return;
    const lin = v => (v /= 255) <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
    const L = [1, 3, 5].map(i => lin(parseInt(g.slice(i, i + 2), 16))), light = .2126 * L[0] + .7152 * L[1] + .0722 * L[2] <= .28;
    const set = over => {
      if (over) { html.style.setProperty('--bar-ground', g); html.style.setProperty('--bar-ink', light ? 'var(--ljos)' : 'var(--blek)'); html.dataset.barTone = light ? 'light' : 'dark'; }
      else { html.style.removeProperty('--bar-ground'); html.style.removeProperty('--bar-ink'); delete html.dataset.barTone; }
    };
    new IntersectionObserver(([en]) => set(en.isIntersecting), { rootMargin: `0px 0px -${innerHeight - 80}px 0px` }).observe(hero);
  }
  // B1: the beer page's own arrival. The can's travel is the view transition (or a glide when there is none); the info slides in from the right as the can lands (no panel: it sits on the same world), line by line.
  const vtReady = () => new Promise(res => {
    const t = setTimeout(res, 450), ok = () => { clearTimeout(t); res(); };
    const go = () => Promise.resolve(window.__vt && window.__vt.ready).then(ok, ok);
    if (window.__vtSeen) go(); else addEventListener('pagereveal', () => setTimeout(go, 0), { once: true });
  });
  async function beerSequence() {
    const stage = $('[data-beer-stage]'); if (!stage) return;
    const clear = () => html.classList.remove('pre-beer', 'pre-can');
    setTimeout(clear, 8000);
    if (rm.matches || !stage.animate) { clear(); return; }
    await vtReady();
    const phone = innerWidth < 900, out = 'cubic-bezier(.16,1,.3,1)', io = 'cubic-bezier(.76,0,.24,1)', glide = 'cubic-bezier(.65,.02,.16,1)';
    const start = flownIn ? 550 : 350, run = [];
    const all = [], go = (el, frames, o) => { if (!el) return; const a = el.animate(frames, { fill: 'both', ...o }); animations.add(a); all.push(a); run.push(a.finished.catch(() => {})); };
    const can = $('.beer-can .hero-can', stage);
    if (!flownIn && can) go(can, [{ opacity: 0, transform: `translate(calc(-50% + ${phone ? 0 : 14}vw), calc(-50% + ${phone ? 5 : 0}vh))` }, { opacity: 1, transform: 'translate(-50%, -50%)' }], { duration: 1300, easing: glide, delay: 120 });
    go($('.beer-can .can-cast', stage), [{ opacity: 0 }, { opacity: .62 }], { duration: 800, easing: out, delay: start + 150 });
    go($('.beer-can .can-shadow', stage), [{ opacity: 0 }, { opacity: 1 }], { duration: 800, easing: out, delay: start + 150 });
    $$('[data-b]', stage).forEach((el, i) => {
      const fin = el.matches('.beer-eyebrow') ? .85 : el.matches('.beer-rule') ? .3 : 1, at = start + 250 + i * 90;
      if (el.matches('.beer-name')) {
        go(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 1, delay: at });
        $$('.ln>span', el).forEach((s, k) => go(s, [{ transform: 'translateY(112%)' }, { transform: 'none' }], { duration: 1000, easing: out, delay: at + k * 110 }));
      } else if (el.matches('.beer-rule')) go(el, [{ opacity: fin, transform: 'scaleX(0)' }, { opacity: fin, transform: 'none' }], { duration: 900, easing: io, delay: at });
      else go(el, [{ opacity: 0, transform: phone ? 'translateY(22px)' : 'translateX(44px)' }, { opacity: fin, transform: 'none' }], { duration: 900, easing: out, delay: at });
    });
    await Promise.all(run); all.forEach(a => a.cancel()); clear();                 // the final frame equals the CSS default, so handing back is invisible; the hover layer owns the shadow again
  }
  function arrival() {
    if (arrived) return; arrived = true; html.classList.add('ready');
    fitWords();
    animate($('[data-bar]'), [{ opacity: 0, transform: 'translateY(-10px)' }, { opacity: 1, transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards', delay: 450 });
    const hero = $('.hero-moment');
    if (hero) openWord(hero, { can: !flownIn, duration: 900 });
    if (hero) heroBar(hero);
    const stage = $('[data-beer-stage]'); if (stage) { heroBar(stage); beerSequence(); }
    document.dispatchEvent(new CustomEvent('viking:arrive'));
  }
  // The enter screen (enter.js) owns the loader, the lock and the doors; it tells us when the site may arrive. No-JS has no enter screen.
  const entering = html.classList.contains('has-enter');
  if (entering) { page.inert = true; page.setAttribute('aria-hidden', 'true'); lock(); }
  else arrival();
  const openSite = () => { page.inert = false; page.removeAttribute('aria-hidden'); setTimeout(arrival, rm.matches ? 0 : 350); };
  document.addEventListener('viking:open', openSite, { once: true });
  if (window.__vikingOpened && entering) openSite();
  document.addEventListener('viking:entered', () => {
    gateOpen = false; lock();
    if (document.body.dataset.page !== 'home') { const h = $('h1'); h?.setAttribute('tabindex', '-1'); h?.focus({ preventScroll: true }); } else $('#main')?.focus({ preventScroll: true });
  }, { once: true });
  const burger = $('[data-burger]'), menu = $('[data-mobmenu]');
  let closeTimer = 0;
  function menuInert(on) {
    $$('main, footer, .logo', page).forEach(el => { el.inert = on; });
  }
  function openMenu(e) {
    if (gateOpen) return;
    clearTimeout(closeTimer); menu.hidden = false; menu.inert = false; menu.classList.remove('closing');
    // Flush only when mounting from display:none; reversals keep the live transform.
    void menu.offsetHeight;
    menuOpen = true; menu.classList.add('open'); html.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true'); menuInert(true); lock();
    (e.detail === 0 ? $('a', menu) : menu).focus({ preventScroll: true });
  }
  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false; menu.inert = true; menu.classList.remove('open'); menu.classList.add('closing');
    burger.setAttribute('aria-expanded', 'false'); menuInert(false); lock();
    burger.focus({ preventScroll: true });
    closeTimer = setTimeout(() => {
      if (!menuOpen) { menu.hidden = true; menu.classList.remove('closing'); html.classList.remove('menu-open'); }
    }, rm.matches ? 150 : 200);
  }
  burger?.addEventListener('click', e => menuOpen ? closeMenu() : openMenu(e));
  $$('a', menu).forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menuOpen) { e.preventDefault(); closeMenu(); }
    if (e.key !== 'Tab' || !menuOpen) return;
    const panel = menu;
    const controls = [burger, ...$$('a', menu)];
    const current = controls.indexOf(document.activeElement);
    if (document.activeElement === panel || current < 0 || (!e.shiftKey && current === controls.length - 1) || (e.shiftKey && current === 0)) {
      e.preventDefault(); (e.shiftKey ? controls.at(-1) : controls[0]).focus();
    }
  });
  const barState = () => $('[data-bar]')?.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', barState, { passive: true }); barState();
  addEventListener('resize', () => { if (innerWidth >= 900) closeMenu(); });
  function hashLanding() {
    $$('.target-flash').forEach(el => el.classList.remove('target-flash'));
    let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (target?.classList.contains('find-row') && !rm.matches) {
      void target.offsetWidth; target.classList.add('target-flash');
    }
    $$('[data-language]').forEach(a => { const url = new URL(a.href); url.hash = location.hash; a.href = url.href; });
  }
  addEventListener('hashchange', hashLanding); hashLanding();
  // Route transition names are assigned to ONE selected source can; never to all duplicates.
  const destinationCan = $('[data-shared-can] .can');
  const destinationSlug = $('[data-shared-can]')?.dataset.sharedCan;
  if (destinationCan && !rm.matches) destinationCan.style.viewTransitionName = 'beer-can';
  document.addEventListener('click', e => {
    const a = e.target.closest('a'); if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const url = new URL(a.href);
    if (url.origin !== location.origin || !/\/(bjorinn|beer)\//.test(url.pathname) || rm.matches) return;
    const slug = url.pathname.split('/').filter(Boolean).at(-1), img = $('img.can', a);
    if (img) { $$('img.can').forEach(c => c.style.viewTransitionName = 'none'); img.style.viewTransitionName = 'beer-can'; }
  });
  // Non-home route focus is a container, with no highlight after pointer navigation.
  if (!gateOpen && document.body.dataset.page !== 'home') { const heading=$('h1'); heading?.setAttribute('tabindex','-1'); heading?.focus({preventScroll:true}); }
  // Independent physical layer, with no ownership conflict with the page arrival wrapper.
  const tiltStates = [];
  $$('[data-tilt]').forEach(host => {
    const lift = $('.can-lift', host), shadow = $('.can-shadow', host), sheen = $('.sheen', host), shade = $('.shade', host);
    const s = { host, lift, shadow, sheen, shade, t:0, h:0, x:0, y:0, tx:0, ty:0, raf:0, last:0 };
    tiltStates.push(s);
    const tick = now => {
      if (rm.matches || !fine.matches) { resetTilt(s); return; }
      const k = Math.min(1, ((now - (s.last || now)) || 16) / 1000 * 11); s.last = now;
      s.h += (s.t-s.h) * (s.t>s.h ? k : Math.min(1,k*1.4)); s.x += (s.tx-s.x)*k; s.y += (s.ty-s.y)*k;
      lift.style.transform = `translate3d(0,${-4.2*s.h}%,0) rotateY(${s.x*15*s.h}deg) rotateX(${-s.y*6*s.h}deg) rotateZ(${-s.x*1.4*s.h}deg)`;
      sheen.style.opacity = s.h*.85; sheen.style.backgroundPosition = `${50-s.x*46}% 0`;
      shade.style.opacity = s.h*.7; shade.style.backgroundPosition = `${50-s.x*30}% 0`;
      shadow.style.transform = `scale(${1-s.h*.16},${1-s.h*.10})`; shadow.style.opacity = 1-s.h*.45;
      const moving = Math.abs(s.t-s.h)>.002 || Math.abs(s.tx-s.x)>.002 || Math.abs(s.ty-s.y)>.002;
      s.raf = moving ? requestAnimationFrame(tick) : 0; if (!moving) s.last=0;
    };
    const kick=()=>{ if (!s.raf && fine.matches && !rm.matches) s.raf=requestAnimationFrame(tick); };
    host.addEventListener('pointermove',e=>{
      if (!fine.matches || rm.matches) return;
      const r=host.getBoundingClientRect(); s.t=1;s.tx=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1));s.ty=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1));kick();
    });
    const release=()=>{s.t=0;s.tx=0;s.ty=0;kick();};
    host.addEventListener('pointerleave',release);
    host.addEventListener('focusin',()=>{s.t=.45;s.tx=.45;s.ty=-.15;kick();});
    host.addEventListener('focusout',release);
  });
  function resetTilt(s) {
    cancelAnimationFrame(s.raf);Object.assign(s,{t:0,h:0,x:0,y:0,tx:0,ty:0,raf:0,last:0});
    [s.lift,s.shadow,s.sheen,s.shade].forEach(el=>{el.style.transform='';el.style.opacity='';});
  }
  const reconfigure = () => {
    animations.forEach(a=>a.cancel()); tiltStates.forEach(resetTilt);
    if (destinationCan) destinationCan.style.viewTransitionName=rm.matches?'none':'beer-can';
    reveals();smoothSetup();fitWords();ST?.refresh();
  };
  rm.addEventListener('change',reconfigure); fine.addEventListener('change',reconfigure);
  smoothSetup();reveals();
  const refresh=()=>{fitWords();ST?.refresh();};
  document.fonts?.ready.then(refresh);
  Promise.allSettled($$('img.can').map(img=>img.decode?.())).then(refresh);
  let resizeTimer;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(refresh,150);});
  addEventListener('pageshow',e=>{if(e.persisted){$$('img.can').forEach(c=>c.style.viewTransitionName='none');smoothSetup();refresh();}});
  addEventListener('pagehide',()=>{cancelAnimationFrame(lenisFrame);tiltStates.forEach(resetTilt);});

  addEventListener('pagereveal', e => { try { e.viewTransition?.types.add(document.body.dataset.page === 'beer' ? 'to-beer' : 'to-page'); } catch {} });
  /* V1: the can flies into its beer page. Cross-document view transition (Chrome 126+, Safari 18.2+): at pageswap exactly one can on this page
     is given the name the beer page's can already carries (CSS: .beer-world .can-lift .can). Browsers without it just crossfade. */
  addEventListener('pageswap', e => {
    if (!e.viewTransition || rm.matches) return;
    const url = e.activation && e.activation.entry && e.activation.entry.url, to = url && new URL(url);
    const m = to && to.pathname.match(/^\/(?:en\/beer|bjorinn)\/([^/]+)\/?$/);
    try { e.viewTransition.types.add(m ? 'to-beer' : 'to-page'); } catch {}
    if (!m) return;
    const beers = (window.VIKING && window.VIKING.beers) || [], i = beers.findIndex(x => x.slug === m[1]); if (i < 0) return;
    const seen = n => { if (!n) return null; const r = n.getBoundingClientRect(); return r.width > 20 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth ? n : null; };
    const mom = $(`.moment[data-slug="${m[1]}"]`), pinned = html.classList.contains('walk-on');
    const src = (mom && (!pinned || mom.classList.contains('is-on')) && seen($('img.can', mom))) || seen($(`[data-share-can="${m[1]}"] .can`)) || seen($('[data-shared-can] .can'));
    if (!src) return;                                              // from a page with no can to fly: plain crossfade
    if (src) src.style.viewTransitionName = 'beer-can';
    try { sessionStorage.setItem('viking-vt', m[1]); } catch {}
  });
})();
