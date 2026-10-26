/* LUMINA · Casas en Funes — comportamiento del sitio
   Contenido dinámico (tipologías, masterplan, avance de obra) desde window.LUMINA (src/data/*.json). */
(function () {
  'use strict';
  var D = window.LUMINA || {};
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var html = document.documentElement;
  var L = function (es, en) { return '<span class="l-es">' + es + '</span><span class="l-en">' + en + '</span>'; };
  var MESES = {
    es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  };
  function mes(ym, lang) { var p = String(ym).split('-'); var m = MESES[lang][+p[1] - 1]; return (lang === 'es' ? m + ' ' : m + ' ') + p[0]; }
  function mesL(ym) { return L(mes(ym, 'es'), mes(ym, 'en')); }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- Idioma ---------- */
  function setLang(lang, save) {
    if (lang !== 'es' && lang !== 'en') lang = 'es';
    html.lang = lang;
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
    $$('[data-alt-en]').forEach(function (img) {
      if (!img.dataset.altEs) img.dataset.altEs = img.alt;
      img.alt = lang === 'en' ? img.dataset.altEn : img.dataset.altEs;
    });
    $$('option[data-es]').forEach(function (o) { o.textContent = o.dataset[lang]; });
    document.title = lang === 'en' ? 'Lumina · Homes in Funes' : 'Lumina · Casas en Funes';
    if (save) store('lumina-lang', lang);
  }
  var q = (location.search.match(/[?&]lang=(es|en)/) || [])[1];
  setLang(q || store('lumina-lang') || 'es');
  $$('.lang button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.lang, true); }); });

  /* ---------- Barra ---------- */
  var bar = $('#bar'), wa = $('#fab'), burger = $('#burger');
  function onScroll() {
    var y = window.scrollY;
    bar.classList.toggle('solid', y > window.innerHeight * 0.72);
    wa.classList.toggle('on', y > window.innerHeight * 0.9);
  }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  burger.addEventListener('click', function () {
    var open = !bar.classList.contains('open'); bar.classList.toggle('open', open); burger.setAttribute('aria-expanded', String(open));
  });
  $$('#nav a').forEach(function (a) { a.addEventListener('click', function () { bar.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }); });
  // sección activa
  var links = $$('#nav a');
  if ('IntersectionObserver' in window) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) so.observe(s); });
  }

  /* ---------- Lightbox ---------- */
  var lb = $('#lb'), lbImg = $('img', lb);
  function openLb(src, alt, plan) { lbImg.src = src; lbImg.alt = alt || ''; lb.classList.toggle('plan-mode', !!plan); lb.classList.add('on'); $('.lb-x', lb).focus(); }
  function closeLb() { lb.classList.remove('on'); }
  lb.addEventListener('click', function (e) { if (e.target !== lbImg) closeLb(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLb(); });

  /* ---------- Galerías (gprev / gnext / dots) ---------- */
  function gallery(root) {
    var track = $('.gtrack', root), slides = $$('.gslide', track), n = slides.length, i = 0, timer;
    if (n < 2) return;
    var prev = document.createElement('button'), next = document.createElement('button'), dots = document.createElement('div'), count = document.createElement('span');
    prev.className = 'gprev'; next.className = 'gnext'; dots.className = 'gdots'; count.className = 'gcount';
    prev.type = next.type = 'button'; prev.setAttribute('aria-label', 'Anterior'); next.setAttribute('aria-label', 'Siguiente');
    prev.innerHTML = D.icons.izq; next.innerHTML = D.icons.der;
    slides.forEach(function (s, k) {
      var d = document.createElement('button'); d.type = 'button'; d.setAttribute('aria-label', String(k + 1));
      d.addEventListener('click', function () { go(k); }); dots.appendChild(d);
      s.addEventListener('click', function () { var im = $('img', s); openLb(im.src, im.alt); });
    });
    root.appendChild(prev); root.appendChild(next); root.appendChild(dots); root.appendChild(count);
    function go(k) {
      i = (k + n) % n; track.style.transform = 'translateX(' + (-100 * i) + '%)';
      $$('button', dots).forEach(function (d, j) { d.setAttribute('aria-current', String(j === i)); });
      count.textContent = (i + 1) + ' / ' + n; restart();
    }
    function restart() { clearInterval(timer); timer = setInterval(function () { if (!document.hidden && inView) go(i + 1); }, 6000); }
    prev.addEventListener('click', function () { go(i - 1); });
    next.addEventListener('click', function () { go(i + 1); });
    var x0 = null;
    root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1)); x0 = null; });
    var inView = false;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }).observe(root);
    go(0);
  }

  /* ---------- Tipologías ---------- */
  var U = D.unidades || { tipologias: {}, lotes: [] };
  function lotesDe(t) { return U.lotes.filter(function (l) { return String(l.tipo) === String(t); }).map(function (l) { return l.n; }); }
  var tipos = $('#tipos');
  Object.keys(U.tipologias).forEach(function (t, idx) {
    var d = U.tipologias[t], ls = lotesDe(t);
    var el = document.createElement('div');
    el.className = 'tipo' + (idx === 0 ? ' on' : ''); el.id = 'tipo-' + t; el.setAttribute('role', 'tabpanel'); el.setAttribute('aria-labelledby', 'tab-' + t);
    el.innerHTML =
      '<div class="plan" tabindex="0" role="button" aria-label="Ampliar plano">' +
        '<span class="plan-zoom">' + D.icons.zoom + '</span>' +
        '<img src="' + d.planta + '" alt="Planta baja y planta alta · Unidad ' + t + '" loading="lazy">' +
        '<div class="plan-labels"><span>' + L('Planta baja', 'Ground floor') + '</span><span>' + L('Planta alta', 'Upper floor') + '</span></div>' +
      '</div>' +
      '<div class="tipo-data">' +
        '<h3>' + L('Unidad ' + t, 'Unit ' + t) + '</h3>' +
        '<p class="muted">' + L(d.frente + ' m de frente · ' + d.profundidad + ' m de profundidad', d.frente + ' m wide · ' + d.profundidad + ' m deep') + '</p>' +
        '<ul class="specs">' +
          '<li>' + L('Superficie de lote', 'Plot area') + '<b>' + d.lote + '<small>m²</small></b></li>' +
          '<li>' + L('Superficie cubierta', 'Covered area') + '<b>' + d.cubierta + '<small>m²</small></b></li>' +
          '<li>' + L('Superficie semicubierta', 'Semi-covered area') + '<b>' + d.semicubierta + '<small>m²</small></b></li>' +
          '<li>' + L('Pileta', 'Pool') + '<b>' + d.pileta + '<small>m</small></b></li>' +
        '</ul>' +
        '<div class="chips" aria-label="Casas">' + '<span class="chip">' + L(ls.length + ' casas', ls.length + ' homes') + '</span>' +
          ls.map(function (n) { return '<a class="chip num" href="#masterplan" data-lot="' + n + '">' + n + '</a>'; }).join('') + '</div>' +
        '<div class="btns"><a class="btn btn-solid" href="#contacto" data-interes="u' + t + '">' + L('Consultar por esta unidad', 'Enquire about this unit') + D.icons.flecha + '</a></div>' +
      '</div>';
    tipos.appendChild(el);
    var plan = $('.plan', el); var openPlan = function () { openLb($('img', plan).src, $('img', plan).alt, true); };
    plan.addEventListener('click', openPlan); plan.addEventListener('keydown', function (e) { if (e.key === 'Enter') openPlan(); });
  });
  $$('.tabs [role="tab"]').forEach(function (tab) {
    tab.addEventListener('click', function () {
      $$('.tabs [role="tab"]').forEach(function (b) { b.setAttribute('aria-selected', String(b === tab)); });
      $$('.tipo').forEach(function (p) { p.classList.toggle('on', p.id === tab.getAttribute('aria-controls')); });
    });
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-lot]'); if (a) { setTimeout(function () { selectLot(+a.dataset.lot); }, 350); }
    var b = e.target.closest('[data-interes]'); if (b) { var s = $('#f-interes'); if (s) s.value = b.dataset.interes; }
  });

  /* ---------- Masterplan ---------- */
  var mp = $('#masterplan'), svg = $('#mp-svg'), card = $('#mp-card'), legend = $('#legend');
  var NS = 'http://www.w3.org/2000/svg', MPI = U.masterplan || { w: 948, h: 534 };
  svg.setAttribute('viewBox', '0 0 ' + MPI.w + ' ' + MPI.h);
  var LEG = {
    tipo: [['rgba(104,94,86,.45)', L('Unidad 1 · 11 m de frente', 'Unit 1 · 11 m wide')], ['rgba(93,97,71,.7)', L('Unidad 2 · 9 m de frente', 'Unit 2 · 9 m wide')]],
    etapa: [['rgba(111,117,86,.8)', L('Etapa 1', 'Stage 1')], ['rgba(160,135,112,.8)', L('Etapa 2', 'Stage 2')], ['rgba(201,195,181,.95)', L('Etapa 3', 'Stage 3')]]
  };
  function drawLegend(mode) { legend.innerHTML = LEG[mode].map(function (x) { return '<span><i style="background:' + x[0] + '"></i>' + x[1] + '</span>'; }).join(''); }
  U.lotes.forEach(function (l) {
    var r = l.rect, x = r[0], y = r[1], w = r[2], h = r[3];
    var g = document.createElementNS(NS, 'g');
    var rc = document.createElementNS(NS, 'rect');
    rc.setAttribute('x', x); rc.setAttribute('y', y); rc.setAttribute('width', w); rc.setAttribute('height', h);
    rc.setAttribute('class', 'lot'); rc.setAttribute('data-n', l.n); rc.setAttribute('data-tipo', l.tipo); rc.setAttribute('data-etapa', l.etapa);
    rc.setAttribute('tabindex', '0'); rc.setAttribute('role', 'button'); rc.setAttribute('aria-label', 'Casa ' + l.n);
    rc.addEventListener('click', function () { selectLot(l.n); });
    rc.addEventListener('mouseenter', function () { if (!card.dataset.locked) showLot(l.n); });
    rc.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectLot(l.n); } });
    g.appendChild(rc); svg.appendChild(g);
  });
  function etapaDe(n) { var E = (D.obra && D.obra.etapas) || []; for (var k = 0; k < E.length; k++) if (E[k].viviendas.indexOf(n) > -1) return E[k]; return null; }
  function showLot(n) {
    var l = U.lotes.filter(function (x) { return x.n === n; })[0]; if (!l) return;
    var t = U.tipologias[l.tipo], e = etapaDe(n);
    $$('.lot', svg).forEach(function (r) { r.classList.toggle('sel', +r.dataset.n === n); });
    card.innerHTML =
      '<span class="k">' + L('Casa', 'Home') + '</span><div class="big">' + n + '</div>' +
      '<span class="tag ' + (l.tipo === 1 ? 'tag-adv' : 'tag-func') + '" style="align-self:flex-start">' + L('Unidad ' + l.tipo, 'Unit ' + l.tipo) + '</span>' +
      '<ul class="specs">' +
        '<li>' + L('Lote', 'Plot') + '<b>≈ ' + l.lote + '<small>m²</small></b></li>' +
        '<li>' + L('Cubierta', 'Covered') + '<b>' + t.cubierta + '<small>m²</small></b></li>' +
        '<li>' + L('Semicubierta', 'Semi-covered') + '<b>' + t.semicubierta + '<small>m²</small></b></li>' +
        '<li>' + L('Frente', 'Width') + '<b>' + t.frente + '<small>m</small></b></li>' +
        (e ? '<li>' + L('Etapa de obra', 'Construction stage') + '<b>' + e.n + '</b></li>' : '') +
      '</ul>' +
      '<div class="btns"><a class="btn btn-solid" href="#contacto" data-interes="u' + l.tipo + '">' + L('Consultar por la casa ' + n, 'Enquire about home ' + n) + '</a></div>';
  }
  function selectLot(n) { card.dataset.locked = '1'; showLot(n); }
  function emptyCard() {
    card.innerHTML = '<span class="k">Masterplan</span><div class="big">14</div><p class="mp-empty">' + L('Pasá el cursor o tocá una casa del plano para ver su información.', 'Hover over or tap a home on the plan to see its details.') + '</p>' +
      '<ul class="specs"><li>' + L('Unidad 1', 'Unit 1') + '<b>' + lotesDe(1).length + '</b></li><li>' + L('Unidad 2', 'Unit 2') + '<b>' + lotesDe(2).length + '</b></li></ul>' +
      '<div class="btns"><a class="btn btn-solid" href="#tipologias">' + L('Ver tipologías', 'See floor plans') + '</a></div>';
  }
  svg.addEventListener('mouseleave', function () { if (!card.dataset.locked) { $$('.lot', svg).forEach(function (r) { r.classList.remove('sel'); }); emptyCard(); } });
  $$('.seg button').forEach(function (b) {
    b.addEventListener('click', function () {
      mp.dataset.mode = b.dataset.mode; drawLegend(b.dataset.mode);
      $$('.seg button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    });
  });
  drawLegend('tipo'); emptyCard();

  /* ---------- Avance de obra ---------- */
  var O = D.obra || {};
  if (O.porcentajes) $('#obra-fuente').innerHTML = L(O.porcentajes.fuente_es + ' · ' + mes(O.porcentajes.fecha, 'es'), O.porcentajes.fuente_en + ' · ' + mes(O.porcentajes.fecha, 'en'));
  var et = $('#etapas');
  (O.etapas || []).forEach(function (e, k) {
    var v = e.viviendas, rango = v[0] + (v.length > 1 ? '–' + v[v.length - 1] : '');
    var el = document.createElement('article'); el.className = 'etapa rv' + (k ? ' d' + k : '');
    el.innerHTML =
      '<div class="etapa-head"><div><span class="k">' + L('Etapa ' + e.n, 'Stage ' + e.n) + '</span><h3>' + L('Casas ' + rango, 'Homes ' + rango) + '</h3></div>' +
        '<div class="pct" data-to="' + e.avance + '"><span>' + e.avance + '</span><small>%</small></div></div>' +
      '<div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + e.avance + '" aria-label="Etapa ' + e.n + '"><i data-w="' + e.avance + '"></i></div>' +
      '<div><div class="k2">' + L('Tareas programadas · ' + mes(O.tareas.mes, 'es'), 'Scheduled for ' + mes(O.tareas.mes, 'en')) + '</div><ul>' +
        e.trabajos_es.map(function (t, j) { return '<li>' + L(t, e.trabajos_en[j]) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="lots">' + v.map(function (n) { return '<a class="chip num" href="#masterplan" data-lot="' + n + '">' + n + '</a>'; }).join('') + '</div>';
    et.appendChild(el);
  });
  function countUp(el) {
    var to = +el.dataset.to, s = $('span', el), t0 = null, dur = 1600;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { s.textContent = to; return; }
    (function step(ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / dur); s.textContent = Math.round(to * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(step); })(performance.now());
  }
  var G = O.galeria || [], V = O.video || {};
  var gtr = $('#gal-obra .gtrack');
  G.forEach(function (f) {
    var el = document.createElement('figure'); el.className = 'gslide';
    el.innerHTML = '<img src="' + f.src + '" alt="' + f.es + ' · ' + mes(f.fecha, 'es') + '" data-alt-en="' + f.en + ' · ' + mes(f.fecha, 'en') + '" loading="lazy">' +
      '<figcaption>' + L(f.es + ' · ' + mes(f.fecha, 'es'), f.en + ' · ' + mes(f.fecha, 'en')) + '</figcaption>';
    gtr.appendChild(el);
  });
  if (G.length) {
    var ult = G[0].fecha;
    $('#obra-relev').innerHTML = L('Fotos actualizadas a ' + mes(ult, 'es') + ' · fuente: Jauke Desarrollos', 'Photos updated ' + mes(ult, 'en') + ' · source: Jauke Desarrollos');
  }
  if (V.fecha) $('#vcard-date').innerHTML = L('Relevamiento de ' + mes(V.fecha, 'es'), mes(V.fecha, 'en') + ' survey');
  var vcard = $('#vcard');
  function playVideo() {
    if (vcard.classList.contains('playing') || !V.src) return;
    var v = document.createElement('video'); v.src = V.src; v.controls = true; v.playsInline = true; v.autoplay = true;
    vcard.appendChild(v); vcard.classList.add('playing'); v.play().catch(function () {});
  }
  vcard.addEventListener('click', playVideo); vcard.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playVideo(); } });

  $$('[data-gal]').forEach(gallery);
  setLang(html.lang); // aplica alt en inglés a las imágenes generadas

  /* ---------- Reveal + medidores ---------- */
  var rvs = $$('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; var t = e.target; t.classList.add('in'); io.unobserve(t);
        if (t.classList.contains('etapa')) { $('.meter i', t).style.width = $('.meter i', t).dataset.w + '%'; countUp($('.pct', t)); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    rvs.forEach(function (r) { io.observe(r); });
  } else rvs.forEach(function (r) { r.classList.add('in'); });

  /* ---------- Video del predio (autoplay solo en vista) y mapa diferido ---------- */
  $$('video[data-autoplay]').forEach(function (v) {
    // Loop silencioso: arranca solo y se pausa cuando sale de pantalla (ahorra batería)
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
    var play = function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    if (v.readyState >= 2) play(); else v.addEventListener('loadeddata', play, { once: true });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { if (es[0].isIntersecting) play(); else v.pause(); }, { threshold: 0.1 }).observe(v);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) play(); });
  });
  var map = $('#map');
  if (map) {
    var loadMap = function () {
      if (map.dataset.done) return; map.dataset.done = '1';
      var f = document.createElement('iframe'); f.src = map.dataset.src; f.loading = 'lazy'; f.title = 'Mapa · Los Girasoles 3231, Funes'; f.referrerPolicy = 'no-referrer-when-downgrade';
      map.appendChild(f);
    };
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { if (es[0].isIntersecting) loadMap(); }, { rootMargin: '400px' }).observe(map); else loadMap();
  }

  /* ---------- Formulario → WhatsApp ---------- */
  var form = $('#form');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    $$('[required]', form).forEach(function (i) { var bad = !i.value.trim() || (i.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(i.value)); i.classList.toggle('err', bad); if (bad) ok = false; });
    if (!ok) { var first = $('.err', form); if (first) first.focus(); return; }
    var f = form.elements, lang = html.lang, sel = f.interes.options[f.interes.selectedIndex].textContent;
    var txt = (lang === 'en' ? 'Hi! I would like information about Lumina Funes.' : '¡Hola! Quiero información sobre Lumina Funes.') +
      '\n\n' + (lang === 'en' ? 'Name: ' : 'Nombre: ') + f.nombre.value.trim() + ' ' + f.apellido.value.trim() +
      '\nEmail: ' + f.email.value.trim() + '\n' + (lang === 'en' ? 'Phone: ' : 'Teléfono: ') + f.telefono.value.trim() +
      '\n' + (lang === 'en' ? 'Interested in: ' : 'Me interesa: ') + sel +
      (f.mensaje.value.trim() ? '\n\n' + f.mensaje.value.trim() : '');
    window.open('https://wa.me/' + D.links.whatsapp_numero + '?text=' + encodeURIComponent(txt), '_blank', 'noopener');
    $('#form-ok').classList.add('on');
  });

  /* Tapa del brochure: descarga el del idioma activo */
  $('#broch-cover').addEventListener('click', function () { $('#dl-' + html.lang).click(); });

  $('#year').textContent = new Date().getFullYear();
})();
