const root   = document.documentElement;
const heroEl = document.querySelector('.hero');

// ── HIRING BANNER
(function() {
  const banner = document.getElementById('hireBanner');
  if (!banner) return;
  if (sessionStorage.getItem('hireBannerDismissed')) {
    banner.style.display = 'none';
    root.style.setProperty('--banner-h', '0px');
    return;
  }
  document.getElementById('hireClose').addEventListener('click', () => {
    banner.classList.add('dismissed');
    root.style.setProperty('--banner-h', '0px');
    setTimeout(() => { banner.style.display = 'none'; }, 380);
    sessionStorage.setItem('hireBannerDismissed', '1');
  });
})();

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

// ── LANGUAGE TOGGLE ──────────────────────────────────────
const LANG = {
  en: {
    'logo-sub':      'Fiber Optic Company',
    'nav-services':  'Services',
    'nav-about':     'About',
    'nav-why':       'Why Us',
    'nav-contact':   'Contact',
    'mob-services':  'Services',
    'mob-about':     'About',
    'mob-why':       'Why Us',
    'mob-contact':   'Contact',
    'hero-label':    'South Florida · Fiber Optic Specialists',
    'hero-title':    'Precision.<br><span class="hero-title-indent">Infrastructure.</span><br>Delivered.',
    'hero-sub':      'Licensed fiber optic installation, fusion splicing, and network infrastructure — built to last and delivered on time.',
    'hero-cta-quote':'Request a Quote',
    'hero-cta-svc':  'Our Services',
    'proof-val-2':   'Licensed',
    'proof-val-3':   'S. Florida',
    'proof-lbl-1':   'Miles Installed',
    'proof-lbl-2':   '&amp; Certified',
    'proof-lbl-3':   'Coverage',
    'proof-lbl-4':   'Emergency Response',
    'srv-eye':       'What We Do',
    'srv-title':     'Complete Fiber Optic Solutions',
    'srv-desc':      'End-to-end fiber infrastructure for commercial, municipal, and enterprise clients.',
    'srv1-h': 'Fiber Optic Installation',
    'srv1-p': 'Aerial and underground fiber installation for commercial buildings, campuses, municipalities, and enterprise networks.',
    'srv1-t1': 'Aerial', 'srv1-t2': 'Underground', 'srv1-t3': 'OSP &amp; ISP',
    'srv2-h': 'Fusion Splicing &amp; Testing',
    'srv2-p': 'Precision fusion splicing with full OTDR and ILM testing, certification, and documentation packages.',
    'srv2-t1': 'OTDR Testing', 'srv2-t2': 'ILM Certified', 'srv2-t3': 'Full Docs',
    'srv3-h': 'Conduit &amp; Missiling',
    'srv3-p': 'Expert conduit installation, missiling, and pull preparation engineered for future capacity and clean execution.',
    'srv3-t1': 'Conduit Install', 'srv3-t2': 'Missiling', 'srv3-t3': 'Pull Prep',
    'srv4-h': 'Network Infrastructure',
    'srv4-p': 'Structured cabling, data center fiber, and backbone network design and installation built for long-term scalability.',
    'srv4-t1': 'Structured Cabling', 'srv4-t2': 'Data Centers', 'srv4-t3': 'Backbone',
    'srv5-h': 'Quality &amp; Compliance',
    'srv5-p': 'Every project closed out with OTDR results, as-builts, QC reports, and sign-off packages for permit closeouts.',
    'srv5-t1': 'QC Reports', 'srv5-t2': 'As-Builts', 'srv5-t3': 'Code Compliant',
    'srv6-h': 'Emergency Services',
    'srv6-p': 'Network down? Rapid-response fiber repair and restoration to minimize downtime and get you back online fast.',
    'srv6-t1': 'Rapid Response', 'srv6-t2': 'Fiber Repair', 'srv6-t3': 'Restoration',
    'about-eye':   'Who We Are',
    'about-title': "South Florida's Trusted Fiber Experts",
    'about-desc':  "Lynks Inc is a South Florida fiber optic company built on craftsmanship, precision, and reliability. We partner with contractors, municipalities, developers, and enterprises to design and deploy fiber networks that perform — the first time.",
    'about-quote': '"From conduit to connection — we keep you linked."',
    'about-li1': '<span class="chk">✓</span>Licensed &amp; fully insured',
    'about-li2': '<span class="chk">✓</span>Certified fusion splicing technicians',
    'about-li3': '<span class="chk">✓</span>OSHA-compliant job sites',
    'about-li4': '<span class="chk">✓</span>OTDR-tested and documented deliverables',
    'about-li5': '<span class="chk">✓</span>Serving all of South Florida',
    'why-eye':   'The Lynks Advantage',
    'why-title': 'Why Clients Choose Us',
    'why1-h': 'On-Time Delivery',
    'why1-p': 'We treat your schedule like our own. Every project is planned and resourced to hit your deadlines without compromise.',
    'why2-h': 'Certified Technicians',
    'why2-p': 'Trained, certified crews equipped with top-tier fusion splicing and testing equipment — right the first time.',
    'why3-h': 'Full Documentation',
    'why3-p': 'OTDR results, as-builts, and QC reports on every job. Clean handoffs that satisfy inspectors and clients.',
    'why4-h': 'Safety First',
    'why4-p': 'OSHA-aligned practices, 811 compliance, and proper traffic control on every site protect people and property.',
    'why5-h': 'Local Expertise',
    'why5-p': "We know South Florida's terrain, permitting, and utilities — that knowledge saves you time and money.",
    'why6-h': 'Any Scale',
    'why6-p': 'One building or a regional backbone — we scope, plan, and execute at any scale with the same attention to detail.',
    'cta-title': 'Ready to Build Your Network?',
    'cta-sub':   'Send us your scope and get a clear, itemized proposal — usually same business day.',
    'ct-eye':          'Get In Touch',
    'ct-title':        "Let's Talk About<br>Your Project",
    'ct-desc':         'Have a project in mind? We respond with a clear proposal — usually the same business day.',
    'ct-lbl-tollfree': 'Toll Free',
    'ct-lbl-cell':     'Cell',
    'ct-lbl-email':    'Email',
    'ct-lbl-web':      'Website',
    'social-lbl':      'Follow Us',
    'form-title': 'Request a Quote',
    'lbl-fname': 'Full Name', 'lbl-fco': 'Company',
    'lbl-fph':  'Phone',     'lbl-fem': 'Email',
    'lbl-fsv':  'Service Needed', 'lbl-fmsg': 'Project Details',
    'fsubmit':  'Send Request',
    'f-note':   'We typically respond within the same business day.',
    'f-success':"Message sent. We'll be in touch shortly.",
    'fsv-0': 'Select a service…',
    'fsv-1': 'Fiber Optic Installation',
    'fsv-2': 'Fusion Splicing &amp; Testing',
    'fsv-3': 'Conduit &amp; Missiling',
    'fsv-4': 'Network Infrastructure',
    'fsv-5': 'Emergency / Rush Service',
    'fsv-6': 'Other / Not Sure',
    'ph-fname': 'John Smith',
    'ph-fco':   'Your Company',
    'ph-fmsg':  'Describe your project, location, scope, and timeline…',
    'foot-tagline': 'From conduit to connection — we keep you linked.',
    'foot-svc-h': 'Services', 'foot-ct-h': 'Contact',
    'foot-svc-1': 'Fiber Optic Installation',
    'foot-svc-2': 'Fusion Splicing &amp; Testing',
    'foot-svc-3': 'Conduit &amp; Missiling',
    'foot-svc-4': 'Network Infrastructure',
    'foot-svc-5': 'Quality &amp; Compliance',
    'foot-svc-6': 'Emergency Services',
  },
  es: {
    'logo-sub':      'Empresa de Fibra Óptica',
    'nav-services':  'Servicios',
    'nav-about':     'Nosotros',
    'nav-why':       'Por Qué',
    'nav-contact':   'Contacto',
    'mob-services':  'Servicios',
    'mob-about':     'Nosotros',
    'mob-why':       'Por Qué',
    'mob-contact':   'Contacto',
    'hero-label':    'Sur de Florida · Especialistas en Fibra Óptica',
    'hero-title':    'Precisión.<br><span class="hero-title-indent">Infraestructura.</span><br>Entregada.',
    'hero-sub':      'Instalación de fibra óptica, empalme por fusión e infraestructura de red con licencia — construida para durar y entregada a tiempo.',
    'hero-cta-quote':'Solicitar Cotización',
    'hero-cta-svc':  'Nuestros Servicios',
    'proof-val-2':   'Con Licencia',
    'proof-val-3':   'Sur de FL',
    'proof-lbl-1':   'Millas Instaladas',
    'proof-lbl-2':   'y Certificado',
    'proof-lbl-3':   'Cobertura',
    'proof-lbl-4':   'Respuesta de Emergencia',
    'srv-eye':   '¿Qué Hacemos?',
    'srv-title': 'Soluciones Completas de Fibra Óptica',
    'srv-desc':  'Infraestructura de fibra de extremo a extremo para clientes comerciales, municipales y empresariales.',
    'srv1-h': 'Instalación de Fibra Óptica',
    'srv1-p': 'Instalación de fibra aérea y subterránea para edificios comerciales, campus, municipios y redes empresariales.',
    'srv1-t1': 'Aéreo', 'srv1-t2': 'Subterráneo', 'srv1-t3': 'OSP &amp; ISP',
    'srv2-h': 'Empalme por Fusión y Pruebas',
    'srv2-p': 'Empalme por fusión de precisión con pruebas OTDR e ILM completas, certificación y documentación.',
    'srv2-t1': 'Pruebas OTDR', 'srv2-t2': 'Certificado ILM', 'srv2-t3': 'Docs Completos',
    'srv3-h': 'Ducto y Cañería',
    'srv3-p': 'Instalación experta de ductos, cañería y preparación de cables diseñados para capacidad futura y ejecución limpia.',
    'srv3-t1': 'Inst. de Ducto', 'srv3-t2': 'Cañería', 'srv3-t3': 'Prep. de Cable',
    'srv4-h': 'Infraestructura de Red',
    'srv4-p': 'Cableado estructurado, fibra para centros de datos y diseño de red troncal para escalabilidad a largo plazo.',
    'srv4-t1': 'Cable Estructurado', 'srv4-t2': 'Data Centers', 'srv4-t3': 'Red Troncal',
    'srv5-h': 'Calidad y Cumplimiento',
    'srv5-p': 'Cada proyecto se cierra con resultados OTDR, planos de obra, informes de QC y paquetes de permisos.',
    'srv5-t1': 'Informes QC', 'srv5-t2': 'Planos de Obra', 'srv5-t3': 'Cumple Normas',
    'srv6-h': 'Servicios de Emergencia',
    'srv6-p': '¿Red caída? Respuesta rápida para reparación y restauración de fibra para minimizar el tiempo de inactividad.',
    'srv6-t1': 'Resp. Rápida', 'srv6-t2': 'Rep. de Fibra', 'srv6-t3': 'Restauración',
    'about-eye':   'Quiénes Somos',
    'about-title': 'Los Expertos en Fibra de Confianza del Sur de Florida',
    'about-desc':  'Lynks Inc es una empresa de fibra óptica del Sur de Florida construida sobre artesanía, precisión y confiabilidad. Nos asociamos con contratistas, municipios, desarrolladores y empresas para diseñar e implementar redes de fibra que funcionan — desde la primera vez.',
    'about-quote': '"Del ducto a la conexión — te mantenemos enlazado."',
    'about-li1': '<span class="chk">✓</span>Licenciado y totalmente asegurado',
    'about-li2': '<span class="chk">✓</span>Técnicos certificados en empalme por fusión',
    'about-li3': '<span class="chk">✓</span>Sitios de trabajo en cumplimiento con OSHA',
    'about-li4': '<span class="chk">✓</span>Entregables probados con OTDR y documentados',
    'about-li5': '<span class="chk">✓</span>Sirviendo todo el Sur de Florida',
    'why-eye':   'La Ventaja Lynks',
    'why-title': 'Por Qué los Clientes nos Eligen',
    'why1-h': 'Entrega a Tiempo',
    'why1-p': 'Tratamos su cronograma como el nuestro. Cada proyecto se planifica para cumplir sus plazos sin compromisos.',
    'why2-h': 'Técnicos Certificados',
    'why2-p': 'Equipos entrenados y certificados con equipos de empalme y pruebas de primera clase — bien desde la primera vez.',
    'why3-h': 'Documentación Completa',
    'why3-p': 'Resultados OTDR, planos de obra e informes de QC en cada trabajo. Entregas limpias que satisfacen a inspectores y clientes.',
    'why4-h': 'Seguridad Primero',
    'why4-p': 'Prácticas alineadas con OSHA, cumplimiento 811 y control de tráfico adecuado en cada sitio protegen personas y propiedad.',
    'why5-h': 'Experiencia Local',
    'why5-p': 'Conocemos el terreno, los permisos y las instalaciones del Sur de Florida — ese conocimiento le ahorra tiempo y dinero.',
    'why6-h': 'Cualquier Escala',
    'why6-p': 'Un edificio o una red troncal regional — planificamos y ejecutamos a cualquier escala con la misma atención al detalle.',
    'cta-title': '¿Listo para Construir su Red?',
    'cta-sub':   'Envíenos su alcance y reciba una propuesta clara y detallada — generalmente el mismo día hábil.',
    'ct-eye':          'Contáctenos',
    'ct-title':        'Hablemos de<br>Su Proyecto',
    'ct-desc':         '¿Tiene un proyecto en mente? Respondemos con una propuesta clara — generalmente el mismo día hábil.',
    'ct-lbl-tollfree': 'Gratuito',
    'ct-lbl-cell':     'Celular',
    'ct-lbl-email':    'Email',
    'ct-lbl-web':      'Sitio Web',
    'social-lbl':      'Síguenos',
    'form-title': 'Solicitar Cotización',
    'lbl-fname': 'Nombre Completo', 'lbl-fco': 'Empresa',
    'lbl-fph':  'Teléfono',         'lbl-fem': 'Email',
    'lbl-fsv':  'Servicio Necesario', 'lbl-fmsg': 'Detalles del Proyecto',
    'fsubmit':  'Enviar Solicitud',
    'f-note':   'Generalmente respondemos dentro del mismo día hábil.',
    'f-success':'Mensaje enviado. Nos pondremos en contacto pronto.',
    'fsv-0': 'Seleccionar un servicio…',
    'fsv-1': 'Instalación de Fibra Óptica',
    'fsv-2': 'Empalme por Fusión y Pruebas',
    'fsv-3': 'Ducto y Cañería',
    'fsv-4': 'Infraestructura de Red',
    'fsv-5': 'Servicio de Emergencia',
    'fsv-6': 'Otro / No Estoy Seguro',
    'ph-fname': 'Juan García',
    'ph-fco':   'Su Empresa',
    'ph-fmsg':  'Describa su proyecto, ubicación, alcance y cronograma…',
    'foot-tagline': 'Del ducto a la conexión — te mantenemos enlazado.',
    'foot-svc-h': 'Servicios', 'foot-ct-h': 'Contacto',
    'foot-svc-1': 'Instalación de Fibra Óptica',
    'foot-svc-2': 'Empalme por Fusión y Pruebas',
    'foot-svc-3': 'Ducto y Cañería',
    'foot-svc-4': 'Infraestructura de Red',
    'foot-svc-5': 'Calidad y Cumplimiento',
    'foot-svc-6': 'Servicios de Emergencia',
  }
};

// ── HIRING PAGE TRANSLATIONS (merged into LANG)
const HLANG = {
  en: {
    'h-nav-services':'Services','h-nav-about':'About','h-nav-contact':'Contact',
    'h-nav-back':'← Back to Site','h-nav-apply':'Apply Now',
    'h-mob-services':'Services','h-mob-about':'About','h-mob-contact':'Contact',
    'h-mob-back':'← Back to Site','h-mob-apply':'Apply Now',
    'h-hero-label':'South Florida · Fiber Optic Crews',
    'h-hero-title':'Now<br><span class="hero-title-indent">Hiring.</span>',
    'h-hero-sub':'Reliable. Professional. On Time. — Join the Lynks Inc crew and get paid competitive day rates on active South Florida fiber projects.',
    'h-cta-1':'View Open Positions','h-cta-2':'Apply Now',
    'h-proof-lbl-1':'Splicer / Hour','h-proof-lbl-2':'Missiling / Day',
    'h-proof-lbl-3':'Crew Teams','h-proof-val-4':'Active','h-proof-lbl-4':'Projects Now',
    'h-pos-eye':'Open Positions','h-pos-title':'Day Rate Crews Wanted',
    'h-pos-desc':"We're actively looking for reliable, skilled crews in South Florida. Both positions are team-based with immediate availability.",
    'h-badge-1':'Splicer Crew','h-rate-unit-1':'Per Hour','h-crew-1':'2-Man Splicing Crew',
    'h-pos-li1-1':'Experienced &amp; certified techs preferred',
    'h-pos-li1-2':'Fusion splicing &amp; OTDR knowledge required',
    'h-pos-li1-3':'Top-tier equipment available on-site',
    'h-pos-li1-4':'Quality workmanship expected on every job',
    'h-pos-li1-5':'Consistent project availability across South FL',
    'h-pos-apply-1':'Apply for This Position',
    'h-badge-2':'Missiling Crew','h-rate-unit-2':'Per Day','h-crew-2':'2-Man Missiling Crew',
    'h-pos-li2-1':'Fast &amp; efficient work pace required',
    'h-pos-li2-2':'Conduit missiling experience a plus',
    'h-pos-li2-3':'Safe &amp; reliable practices on every site',
    'h-pos-li2-4':'Meets all industry standards',
    'h-pos-li2-5':'Active South Florida projects — start soon',
    'h-pos-apply-2':'Apply for This Position',
    'h-why-eye':'Why Lynks Inc','h-why-title':'Why Work With Us',
    'h-wh1-h':'Reliable &amp; Professional','h-wh1-p':'We run tight crews, show up on time, and carry ourselves like pros on every job.',
    'h-wh2-h':'On-Time Every Time','h-wh2-p':'Our schedule is yours. We plan carefully and commit to deadlines without exceptions.',
    'h-wh3-h':'Quality Guaranteed','h-wh3-p':'High standards on every site. Work with a team that takes pride in clean results.',
    'h-wh4-h':'Safety Focused','h-wh4-p':'OSHA-aligned work sites with proper traffic control and full 811 compliance.',
    'h-wh5-h':'Steady South FL Work','h-wh5-p':'Active projects across all of South Florida mean consistent, ongoing opportunities.',
    'h-apply-eye':'Join the Team',
    'h-apply-title':"Let's Put Footage<br>in the Ground.",
    'h-apply-desc':"Send us your info and we'll reach out within the same business day. We're actively staffing projects and looking for solid crews right now.",
    'h-form-title':'Apply Now',
    'h-lbl-name':'Full Name','h-lbl-phone':'Phone','h-lbl-email':'Email',
    'h-lbl-pos':'Position','h-lbl-exp':'Years of Experience',
    'h-lbl-msg':"Anything else you'd like us to know?",
    'h-submit':'Submit Application',
    'h-f-note':'We typically reach out within the same business day.',
    'h-f-success':"Application received! We'll be in touch shortly.",
    'h-apos-0':'Select position…','h-apos-1':'Splicer Crew','h-apos-2':'Missiling Crew','h-apos-3':'Both / Either',
    'h-aexp-0':'Select experience…','h-aexp-1':'Less than 1 year','h-aexp-2':'1–2 years','h-aexp-3':'3–5 years','h-aexp-4':'5+ years',
    'h-ph-name':'John Smith','h-ph-msg':'Certifications, availability, crew size, equipment…',
  },
  es: {
    'h-nav-services':'Servicios','h-nav-about':'Nosotros','h-nav-contact':'Contacto',
    'h-nav-back':'← Volver al Sitio','h-nav-apply':'Aplicar Ahora',
    'h-mob-services':'Servicios','h-mob-about':'Nosotros','h-mob-contact':'Contacto',
    'h-mob-back':'← Volver al Sitio','h-mob-apply':'Aplicar Ahora',
    'h-hero-label':'Sur de Florida · Equipos de Fibra Óptica',
    'h-hero-title':'Ahora<br><span class="hero-title-indent">Contratando.</span>',
    'h-hero-sub':'Confiable. Profesional. A Tiempo. — Únete al equipo Lynks Inc y recibe tarifas competitivas en proyectos activos de fibra en el Sur de Florida.',
    'h-cta-1':'Ver Posiciones Abiertas','h-cta-2':'Aplicar Ahora',
    'h-proof-lbl-1':'Empalmador / Hora','h-proof-lbl-2':'Cañería / Día',
    'h-proof-lbl-3':'Equipos de Trabajo','h-proof-val-4':'Activos','h-proof-lbl-4':'Proyectos Ahora',
    'h-pos-eye':'Posiciones Abiertas','h-pos-title':'Se Buscan Equipos con Tarifa Diaria',
    'h-pos-desc':'Buscamos activamente equipos confiables y calificados en el Sur de Florida. Ambas posiciones son en equipo con disponibilidad inmediata.',
    'h-badge-1':'Equipo Empalmador','h-rate-unit-1':'Por Hora','h-crew-1':'Equipo de 2 Empalmadores',
    'h-pos-li1-1':'Técnicos experimentados y certificados preferidos',
    'h-pos-li1-2':'Conocimiento de empalme por fusión y OTDR requerido',
    'h-pos-li1-3':'Equipo de primera disponible en sitio',
    'h-pos-li1-4':'Trabajo de calidad esperado en cada trabajo',
    'h-pos-li1-5':'Disponibilidad constante de proyectos en el Sur de FL',
    'h-pos-apply-1':'Aplicar para Esta Posición',
    'h-badge-2':'Equipo de Cañería','h-rate-unit-2':'Por Día','h-crew-2':'Equipo de 2 para Cañería',
    'h-pos-li2-1':'Ritmo de trabajo rápido y eficiente requerido',
    'h-pos-li2-2':'Experiencia en cañería de conductos es una ventaja',
    'h-pos-li2-3':'Prácticas seguras y confiables en cada sitio',
    'h-pos-li2-4':'Cumple con todos los estándares de la industria',
    'h-pos-li2-5':'Proyectos activos en el Sur de Florida — inicio pronto',
    'h-pos-apply-2':'Aplicar para Esta Posición',
    'h-why-eye':'Por Qué Lynks Inc','h-why-title':'Por Qué Trabajar Con Nosotros',
    'h-wh1-h':'Confiable y Profesional','h-wh1-p':'Manejamos equipos organizados, llegamos a tiempo y nos comportamos como profesionales en cada trabajo.',
    'h-wh2-h':'Puntuales Siempre','h-wh2-p':'Nuestro horario es el suyo. Planificamos cuidadosamente y cumplimos los plazos sin excepciones.',
    'h-wh3-h':'Calidad Garantizada','h-wh3-p':'Altos estándares en cada sitio. Trabaje con un equipo que se enorgullece de resultados limpios.',
    'h-wh4-h':'Seguridad Primero','h-wh4-p':'Sitios de trabajo alineados con OSHA con control de tráfico adecuado y cumplimiento 811.',
    'h-wh5-h':'Trabajo Constante en Sur de FL','h-wh5-p':'Proyectos activos en todo el Sur de Florida significan oportunidades consistentes y continuas.',
    'h-apply-eye':'Únete al Equipo',
    'h-apply-title':'Pongamos Metraje<br>en el Suelo.',
    'h-apply-desc':'Envíenos su información y nos comunicaremos dentro del mismo día hábil. Estamos contratando activamente para proyectos.',
    'h-form-title':'Aplicar Ahora',
    'h-lbl-name':'Nombre Completo','h-lbl-phone':'Teléfono','h-lbl-email':'Email',
    'h-lbl-pos':'Posición','h-lbl-exp':'Años de Experiencia',
    'h-lbl-msg':'¿Algo más que quiera que sepamos?',
    'h-submit':'Enviar Solicitud',
    'h-f-note':'Generalmente nos comunicamos dentro del mismo día hábil.',
    'h-f-success':'¡Solicitud recibida! Nos pondremos en contacto pronto.',
    'h-apos-0':'Seleccionar posición…','h-apos-1':'Equipo Empalmador','h-apos-2':'Equipo de Cañería','h-apos-3':'Ambos / Cualquiera',
    'h-aexp-0':'Seleccionar experiencia…','h-aexp-1':'Menos de 1 año','h-aexp-2':'1–2 años','h-aexp-3':'3–5 años','h-aexp-4':'5+ años',
    'h-ph-name':'Juan García','h-ph-msg':'Certificaciones, disponibilidad, tamaño del equipo, equipo…',
  }
};
Object.assign(LANG.en, HLANG.en);
Object.assign(LANG.es, HLANG.es);

let currentLang = 'en';

function applyLang(lang) {
  // innerHTML elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = LANG[lang][el.getAttribute('data-i18n')];
    if (val !== undefined) el.innerHTML = val;
  });
  // placeholder elements
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const val = LANG[lang][el.getAttribute('data-i18n-ph')];
    if (val !== undefined) el.placeholder = val;
  });
  // select options
  document.querySelectorAll('[data-i18n-select]').forEach(sel => {
    const prefix = sel.getAttribute('data-i18n-select');
    Array.from(sel.options).forEach((opt, i) => {
      const val = LANG[lang][`${prefix}-${i}`];
      if (val !== undefined) opt.innerHTML = val;
    });
  });
  // footer copyright (has dynamic year span)
  const yr = new Date().getFullYear();
  const copyEl = document.getElementById('foot-copy-p');
  if (copyEl) {
    copyEl.innerHTML = lang === 'es'
      ? `&copy; ${yr} Lynks Inc. Todos los derechos reservados. &nbsp;&middot;&nbsp; Sur de Florida`
      : `&copy; ${yr} Lynks Inc. All rights reserved. &nbsp;&middot;&nbsp; South Florida`;
  }
  // update html lang + toggle button labels
  document.documentElement.lang = lang;
  document.querySelectorAll('.lang-toggle').forEach(btn => {
    btn.textContent = lang === 'es' ? 'EN' : 'ES';
  });
}

document.querySelectorAll('.lang-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'es' : 'en';
    applyLang(currentLang);
  });
});

// Initialize English (also hydrates footer year without needing #yr span)
applyLang('en');

// ── CONTACT FORM
const fsubmitEl = document.getElementById('fsubmit');
if (fsubmitEl) fsubmitEl.addEventListener('click', async () => {
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

  // Submit to Netlify Forms via AJAX (no page redirect)
  const form = document.getElementById('cform');
  const body = new URLSearchParams();
  body.append('form-name', 'contact');
  new FormData(form).forEach((val, key) => body.append(key, val));
  try {
    await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
  } catch (_) {}

  document.getElementById('fsuccess').classList.add('show');
  setTimeout(() => {
    document.getElementById('fsuccess').classList.remove('show');
    ['fname','fco','fph','fem','fsv','fmsg'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.value = ''; el.style.borderColor = ''; }
    });
  }, 4000);
});
