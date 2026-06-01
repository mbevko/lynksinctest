const root    = document.documentElement;
const heroEl  = document.querySelector('.hero');

// ── NAV scroll
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', scrollY > 50);
}, { passive: true });

// ── Mobile menu
const burger = document.getElementById('burger');
const mob    = document.getElementById('mobMenu');
burger.addEventListener('click', () => mob.classList.toggle('open'));
mob.querySelectorAll('a').forEach(l => l.addEventListener('click', () => mob.classList.remove('open')));

// ── Year
document.getElementById('yr').textContent = new Date().getFullYear();

// ── Scroll reveal
const ro = new IntersectionObserver(es => {
  es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); ro.unobserve(e.target); }});
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => ro.observe(el));

// ── Active nav
document.querySelectorAll('section[id]').forEach(sec => {
  new IntersectionObserver(es => {
    if (es[0].isIntersecting) {
      document.querySelectorAll('.nav-links a:not(.btn)').forEach(l => l.classList.remove('active'));
      const a = document.querySelector(`.nav-links a[href="#${sec.id}"]`);
      if (a) a.classList.add('active');
    }
  }, { threshold: 0.4 }).observe(sec);
});

// ─────────────────────────────────────────────────────────────
// METALLIC LIGHT EFFECT
// Two parts:
//  1. LOAD SWEEP  — plays once on page load, dramatic sweep across title + bg
//  2. SCROLL DRIVE — continues moving the light as user scrolls the hero
// ─────────────────────────────────────────────────────────────

// Easing functions
function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
function easeInOutCubic(t) { return t < .5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; }

// ── SHADOW HELPER ─────────────────────────────────────────────
// As shimmer goes 200→0 the light moves right-to-left.
// Shadow cast OPPOSITE the light: starts at left (-8px) → shifts to right (+8px).
// A faint counter-glow on the light side adds just enough depth to pop.
function updateTitleShadow(shimmer) {
  const progress = Math.max(0, Math.min((200 - shimmer) / 200, 1)); // 0=light right, 1=light left
  const sx  = +(progress * 16 - 8).toFixed(1);   // -8px … +8px
  const sy  = 5;
  const blur= 18;
  const gx  = +(-sx * 0.3).toFixed(1);            // faint rim on light side
  root.style.setProperty(
    '--title-shadow',
    `drop-shadow(${sx}px ${sy}px ${blur}px rgba(0,0,0,0.85)) ` +
    `drop-shadow(${gx}px -1px 10px rgba(255,255,255,0.06))`
  );
}

// Current shimmer position — JS owns this after load animation
let currentShimmer = 200; // starts at 200% (far right, off-screen)
let loadDone = false;

// ── LOAD SWEEP ──────────────────────────────────────────────
// Sweeps the bright white+teal highlight across the title from right to left
// Also moves the background radial hotspot dramatically across the hero
function playLoadSweep() {
  const duration = 2200; // ms — long enough to be dramatic but not slow
  const start    = performance.now();

  // Text shimmer: 200% → 40% (sweeps the gradient left, revealing orange then white then teal)
  const shimmerFrom = 200;
  const shimmerTo   = 40;

  // Background hotspot: starts top-right corner, sweeps to center
  const sxFrom = 130, sxTo = 50;
  const syFrom = -90, syTo = -30;

  function frame(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = easeOutQuart(progress);

    // Update text shimmer + reactive shadow
    currentShimmer = shimmerFrom + (shimmerTo - shimmerFrom) * eased;
    root.style.setProperty('--shimmer', currentShimmer + '%');
    updateTitleShadow(currentShimmer);

    // Update background hotspot
    const sx = sxFrom + (sxTo - sxFrom) * eased;
    const sy = syFrom + (syTo - syFrom) * eased;
    root.style.setProperty('--shine-x', sx + '%');
    root.style.setProperty('--shine-y', sy + '%');

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      loadDone = true;
      // Kick off a subtle idle pulse after load sweep
      idlePulse();
    }
  }

  // Delay slightly so the page/fonts have rendered
  setTimeout(() => requestAnimationFrame(frame), 200);
}

// ── IDLE PULSE ───────────────────────────────────────────────
// Faster, wider oscillation so the metallic "breathing" is clearly visible
let idleFrame = null;
function idlePulse() {
  const duration = 1800;        // full sweep in 1.8s — noticeably faster
  const start    = performance.now();
  const baseShimmer = currentShimmer;

  function pulse(now) {
    if (!loadDone) return;
    const t     = ((now - start) % (duration * 2)) / duration;
    const wave  = t <= 1 ? t : 2 - t;   // triangle 0→1→0
    const eased = easeInOutCubic(wave);

    // Shimmer swings ±22 — wide enough to visibly move the highlight band
    const s = baseShimmer + (eased * 44) - 22;
    if (scrollY < 80) {
      root.style.setProperty('--shimmer', s + '%');
      updateTitleShadow(s);

      // Background hotspot: sweeps diagonally so light visibly travels the surface
      const sx = 38 + (eased * 28);      // 38% → 66% (wide horizontal sweep)
      const sy = -52 + (eased * 48);     // -52% → -4% (dramatic vertical drop)
      root.style.setProperty('--shine-x', sx + '%');
      root.style.setProperty('--shine-y', sy + '%');
    }
    idleFrame = requestAnimationFrame(pulse);
  }
  idleFrame = requestAnimationFrame(pulse);
}

// ── SCROLL DRIVE ─────────────────────────────────────────────
// As the user scrolls through the hero, the light continues moving
function onScroll() {
  if (!heroEl || !loadDone) return;

  const heroH    = heroEl.offsetHeight;
  const progress = Math.min(scrollY / (heroH * 0.7), 1);

  if (progress > 0.02) {
    // Cancel idle pulse — scroll takes over
    if (idleFrame) { cancelAnimationFrame(idleFrame); idleFrame = null; }

    // Text shimmer: 40% → 0% as you scroll (sweeps further left)
    const s = 40 - (progress * 40);
    currentShimmer = s;
    root.style.setProperty('--shimmer', s + '%');
    updateTitleShadow(s);

    // Background hotspot: moves downward as plate "tilts"
    const sx = 50 + (progress * 20);
    const sy = -30 + (progress * 120);
    root.style.setProperty('--shine-x', sx + '%');
    root.style.setProperty('--shine-y', sy + '%');
  } else if (progress <= 0.02 && !idleFrame) {
    // Back near top — resume idle
    idlePulse();
  }
}

window.addEventListener('scroll', onScroll, { passive: true });

// ── KICK OFF ─────────────────────────────────────────────────
playLoadSweep();

// ── CONTACT FORM ─────────────────────────────────────────────
document.getElementById('fsubmit').addEventListener('click', () => {
  const f = {
    name:  document.getElementById('fname'),
    phone: document.getElementById('fph'),
    email: document.getElementById('fem'),
  };
  let ok = true;
  Object.values(f).forEach(el => {
    if (!el.value.trim()) {
      el.style.borderColor = 'rgba(220,60,40,.7)';
      el.addEventListener('input', () => el.style.borderColor = '', { once: true });
      ok = false;
    }
  });
  if (!ok) return;
  document.getElementById('fsuccess').classList.add('show');
  setTimeout(() => {
    document.getElementById('fsuccess').classList.remove('show');
    ['fname','fco','fph','fem','fsv','fmsg'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.value = ''; el.style.borderColor = ''; }
    });
  }, 4000);
});
