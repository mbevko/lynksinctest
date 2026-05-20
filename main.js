// Nav scroll effect
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', scrollY > 40);
}, { passive: true });

// Mobile menu
const burger = document.getElementById('burger');
const mob    = document.getElementById('mobMenu');
burger.addEventListener('click', () => mob.classList.toggle('open'));
mob.querySelectorAll('a').forEach(l => l.addEventListener('click', () => mob.classList.remove('open')));

// Footer year
document.getElementById('yr').textContent = new Date().getFullYear();

// Scroll reveal
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('vis');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// Active nav link highlight
document.querySelectorAll('section[id]').forEach(sec => {
  new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      document.querySelectorAll('.nav-links a:not(.btn-nav)').forEach(l => l.classList.remove('active'));
      const a = document.querySelector(`.nav-links a[href="#${sec.id}"]`);
      if (a) a.classList.add('active');
    }
  }, { threshold: 0.4 }).observe(sec);
});

// Contact form validation + success state
document.getElementById('fsubmit').addEventListener('click', () => {
  const fields = {
    fname: document.getElementById('fname'),
    fph:   document.getElementById('fph'),
    fem:   document.getElementById('fem'),
  };

  let valid = true;
  Object.values(fields).forEach(el => {
    if (!el.value.trim()) {
      el.style.borderColor = '#ff4444';
      el.addEventListener('input', () => el.style.borderColor = '', { once: true });
      valid = false;
    }
  });
  if (!valid) return;

  document.getElementById('fsuccess').classList.add('show');
  setTimeout(() => {
    document.getElementById('fsuccess').classList.remove('show');
    ['fname','fco','fph','fem','fsv','fmsg'].forEach(id => {
      const el = document.getElementById(id);
      el.value = '';
      el.style.borderColor = '';
    });
  }, 4000);
});
