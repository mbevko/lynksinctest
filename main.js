const root   = document.documentElement;
const heroEl = document.querySelector('.hero');

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

// ─────────────────────────────────────────────────────────
// METALLIC LIGHT SYSTEM
//
// Two separate tracks:
//   currentShimmer  — the "logical" shimmer target (set by load/idle/scroll)
//   displayShimmer  — the "visual" shimmer that slowly lerps toward the target
//
// The background hotspot (--shine-x / --shine-y) updates immediately so it
// stays fast and punchy. The text color (--shimmer) and its shadow follow
// with a gentle lag, giving the letters a slower, smoother transition.
// ─────────────────────────────────────────────────────────

let currentShimmer = 200;   // target (fast)
let displayShimmer  = 200;  // visual (slow — lerps toward target)
let loadDone        = false;

// How quickly text colour follows the target.
// 0.04 = ~0.7s visible lag at 60fps — noticeably slower than the background.
const LERP = 0.04;

// ── Easing
function easeOutQuart(t)    { return 1 - Math.pow(1 - t, 4); }
function easeInOutCubic(t)  { return t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }

// ── Shadow helper (driven by displayShimmer, not currentShimmer)
function updateTitleShadow(shimmer) {
  const progress = Math.max(0, Math.min((200 - shimmer) / 200, 1));
  const sx  = +(progress * 16 - 8).toFixed(1);
  const gx  = +(-sx * 0.3).toFixed(1);
  root.style.setProperty(
    '--title-shadow',
    `drop-shadow(${sx}px 5px 18px rgba(0,0,0,0.85)) ` +
    `drop-shadow(${gx}px -1px 10px rgba(255,255,255,0.06))`
  );
}

// ── TEXT LERP LOOP ────────────────────────────────────────
// Runs every frame. Slowly moves displayShimmer toward currentShimmer,
// then applies both the gradient position and the reactive shadow.
// Everything else (background light) is set directly and skips this loop.
(function lerpLoop() {
  const diff = currentShimmer - displayShimmer;
  if (Math.abs(diff) > 0.05) {
    displayShimmer += diff * LERP;
    root.style.setProperty('--shimmer', displayShimmer.toFixed(2) + '%');
    updateTitleShadow(displayShimmer);
  }
  requestAnimationFrame(lerpLoop);
})();

// ── LOAD SWEEP ────────────────────────────────────────────
// Animates the background hotspot fast (direct).
// Sets currentShimmer as target — the lerp loop picks it up at its own pace.
function playLoadSweep() {
  const duration     = 2200;
  const start        = performance.now();
  const shimmerFrom  = 200,  shimmerTo  = 40;
  const sxFrom       = 130,  sxTo       = 50;
  const syFrom       = -90,  syTo       = -30;

  function frame(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased    = easeOutQuart(progress);

    // Target shimmer — text will slowly follow via lerp
    currentShimmer = shimmerFrom + (shimmerTo - shimmerFrom) * eased;

    // Background hotspot — immediate, stays fast
    root.style.setProperty('--shine-x', (sxFrom + (sxTo - sxFrom) * eased) + '%');
    root.style.setProperty('--shine-y', (syFrom + (syTo - syFrom) * eased) + '%');

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      loadDone = true;
      idlePulse();
    }
  }

  setTimeout(() => requestAnimationFrame(frame), 200);
}

// ── IDLE PULSE ────────────────────────────────────────────
// Background: animates at 1800ms — fast, punchy.
// Text shimmer: currentShimmer oscillates at the same rate,
// but displayShimmer only catches up slowly — so the colour
// change feels smooth and lags behind naturally.
let idleFrame = null;
function idlePulse() {
  const duration    = 1800;
  const start       = performance.now();
  const baseShimmer = currentShimmer;

  function pulse(now) {
    if (!loadDone) return;
    const t     = ((now - start) % (duration * 2)) / duration;
    const wave  = t <= 1 ? t : 2 - t;
    const eased = easeInOutCubic(wave);

    if (scrollY < 80) {
      // Text target — lerp loop handles display
      currentShimmer = baseShimmer + (eased * 44) - 22;

      // Background — direct, stays fast
      const sx = 38 + (eased * 28);
      const sy = -52 + (eased * 48);
      root.style.setProperty('--shine-x', sx + '%');
      root.style.setProperty('--shine-y', sy + '%');
    }
    idleFrame = requestAnimationFrame(pulse);
  }
  idleFrame = requestAnimationFrame(pulse);
}

// ── SCROLL DRIVE ──────────────────────────────────────────
function onScroll() {
  if (!heroEl || !loadDone) return;
  const progress = Math.min(scrollY / (heroEl.offsetHeight * 0.7), 1);

  if (progress > 0.02) {
    if (idleFrame) { cancelAnimationFrame(idleFrame); idleFrame = null; }

    // Text target — lerp loop handles display
    currentShimmer = 40 - (progress * 40);

    // Background — direct, stays fast
    root.style.setProperty('--shine-x', (50 + progress * 20) + '%');
    root.style.setProperty('--shine-y', (-30 + progress * 120) + '%');

  } else if (progress <= 0.02 && !idleFrame) {
    idlePulse();
  }
}

window.addEventListener('scroll', onScroll, { passive: true });

// ── KICK OFF
playLoadSweep();

// ── CONTACT FORM
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
