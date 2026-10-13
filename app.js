/* More, cafetería de barrio — concepto de WebsoriaStudio */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const limita = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const calma = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Portada: zoom hacia el interior de la taza ---------- */
  const hero = $('[data-hero]');
  const fijo = $('[data-hero-fijo]');
  const taza = $('[data-taza]');
  const cafe = $('[data-cafe]');
  const letras = $$('[data-letra]');
  const heroPie = $('[data-hero-pie]');
  const heroPista = $('[data-hero-pista]');
  const nav = $('[data-nav]');
  let reposo = null; // posición de la taza sin transformar

  function mideTaza() {
    taza.style.transform = '';
    const t = taza.getBoundingClientRect();
    const f = fijo.getBoundingClientRect();
    reposo = {
      dx: t.left + t.width / 2 - (f.left + f.width / 2),
      dy: t.top + t.height / 2 - (f.top + f.height / 2),
      escala: (Math.hypot(f.width, f.height) / cafe.getBoundingClientRect().width) * 1.08
    };
  }

  function pintaHero(vh) {
    const recorrido = hero.offsetHeight - vh;
    const p = recorrido > 0 ? limita(scrollY / recorrido) : 0;

    if (p <= 0.001) {
      if (hero.classList.contains('lista')) {
        taza.style.transform = '';
        letras.forEach(l => { l.style.transform = ''; l.style.opacity = ''; });
        heroPie.style.opacity = heroPista.style.opacity = '';
        heroPie.style.transform = '';
        cafe.style.setProperty('--liso', 0);
      }
      reposo = null;
      return p;
    }

    hero.classList.add('lista');
    if (!reposo) mideTaza();

    const e = p * p * (3 - 2 * p);
    const centra = limita(p * 1.8);
    const escala = Math.pow(reposo.escala, e);
    taza.style.transform =
      `translate(${-reposo.dx * centra}px, ${-reposo.dy * centra}px) scale(${escala}) rotate(${e * 50}deg)`;
    cafe.style.setProperty('--liso', limita((p - 0.45) / 0.4));

    const fuera = limita(p * 2.2);
    letras.forEach(l => {
      const lado = l.dataset.letra === 'izq' ? -1 : 1;
      l.style.transform = `translateX(${lado * fuera * 70}vw)`;
      l.style.opacity = 1 - fuera;
    });
    const pie = limita(p * 5);
    heroPie.style.opacity = heroPista.style.opacity = 1 - pie;
    heroPie.style.transform = `translateY(${pie * 2}rem)`;
    return p;
  }

  /* ---------- Titulares que se ensanchan con el scroll ---------- */
  const anchos = $$('[data-ancho]').map(el => {
    // "mínimo máximo tramo": el tramo es la fracción de pantalla que tarda en abrirse
    const [min, max, tramo = 0.62] = (el.dataset.ancho || '50 125').split(' ').map(Number);
    return { el, min, max, tramo };
  });

  // limita la anchura máxima de cada titular a lo que cabe en su columna
  function ajustaAnchos() {
    const rango = document.createRange();
    for (const a of anchos) {
      const mide = w => {
        a.el.style.setProperty('--w', w);
        rango.selectNodeContents(a.el);
        return rango.getBoundingClientRect().width;
      };
      const wMin = mide(a.min);
      const wMax = mide(a.max);
      const hueco = a.el.clientWidth;
      a.tope = wMax <= hueco ? a.max
        : a.min + (a.max - a.min) * limita((hueco - wMin) / (wMax - wMin)) * 0.97;
      a.el.style.setProperty('--w', calma ? Math.min(105, a.tope) : a.min);
    }
  }

  function pintaAnchos(vh) {
    for (const { el, min, tope, tramo } of anchos) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      const t = limita((vh - r.top) / (vh * tramo));
      el.style.setProperty('--w', (min + (tope - min) * t).toFixed(1));
    }
  }

  /* ---------- Paralaje de las fotos ---------- */
  const paralajes = $$('[data-paralaje]').map(m => ({ m, img: $('img', m) }));

  function pintaParalaje(vh) {
    for (const { m, img } of paralajes) {
      const r = m.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      const t = (r.top + r.height / 2 - vh / 2) / vh;
      img.style.transform = `translateY(${(t * -9).toFixed(2)}%)`;
    }
  }

  /* ---------- Navegación: color según la sección y ocultar al bajar ---------- */
  const oscuras = $$('.mas, .mezcla, .pie');
  let ultimoY = scrollY;

  function pintaNav(vh, p) {
    const y = scrollY;
    const enHero = y < hero.offsetHeight - 60;
    const sobreOscuro = (enHero && p > 0.55) || oscuras.some(s => {
      const r = s.getBoundingClientRect();
      return r.top < 40 && r.bottom > 40;
    });
    nav.classList.toggle('sobre-oscuro', sobreOscuro);
    nav.classList.toggle('con-fondo', !enHero && !sobreOscuro);
    nav.classList.toggle('oculta', !enHero && y > ultimoY + 4);
    if (y < ultimoY - 4 || enHero) nav.classList.remove('oculta');
    ultimoY = y;
  }

  let pendiente = false;
  function pinta() {
    pendiente = false;
    const vh = innerHeight;
    const p = calma ? 0 : pintaHero(vh);
    if (!calma) { pintaAnchos(vh); pintaParalaje(vh); }
    pintaNav(vh, p);
  }
  function pide() {
    if (!pendiente) { pendiente = true; requestAnimationFrame(pinta); }
  }
  addEventListener('scroll', pide, { passive: true });
  addEventListener('resize', () => { reposo = null; ajustaAnchos(); pide(); });
  // la entrada es una animación CSS; al acabar, el scroll toma el control
  setTimeout(() => { hero.classList.add('lista'); pide(); }, 2400);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { reposo = null; ajustaAnchos(); pide(); });
  ajustaAnchos();
  pide();

  /* ---------- Fotos: aparecen al entrar en pantalla ---------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entradas => {
      entradas.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('visto'); io.unobserve(en.target); }
      });
    }, { threshold: 0.2 });
    $$('[data-ver]').forEach(el => io.observe(el));
  } else {
    $$('[data-ver]').forEach(el => el.classList.add('visto'));
  }

  /* ---------- Carta: filtros y foto que sigue al cursor ---------- */
  const filas = $$('[data-lista] li');
  const filtros = $$('[data-filtros] button');

  filtros.forEach(b => b.addEventListener('click', () => {
    filtros.forEach(o => o.setAttribute('aria-pressed', String(o === b)));
    let i = 0;
    filas.forEach(li => {
      const ver = b.dataset.filtro === 'todo' || li.dataset.cat === b.dataset.filtro;
      li.hidden = !ver;
      li.classList.remove('entra');
      if (ver) {
        li.style.animationDelay = `${i++ * 45}ms`;
        void li.offsetWidth;
        li.classList.add('entra');
      }
    });
  }));

  const previa = $('[data-previa]');
  if (previa && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const img = new Image();
    img.alt = '';
    img.decoding = 'async';
    const url = id => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=560&h=700&q=70`;
    let x = 0, y = 0, tx = 0, ty = 0, activo = false, bucle = 0;

    const sigue = () => {
      const vx = tx - x;
      x += vx * 0.16;
      y += (ty - y) * 0.16;
      previa.style.transform = `translate(${x}px, ${y}px) rotate(${limita(vx * 0.12, -12, 12)}deg)`;
      bucle = activo || Math.abs(vx) > 0.5 ? requestAnimationFrame(sigue) : 0;
    };

    $('[data-lista]').addEventListener('pointermove', ev => {
      tx = ev.clientX + 28;
      ty = ev.clientY - previa.offsetHeight / 2;
      tx = Math.min(tx, innerWidth - previa.offsetWidth - 16);
      ty = limita(ty, 16, innerHeight - previa.offsetHeight - 16);
      if (!activo) { x = tx; y = ty; }
    });
    filas.forEach(li => {
      li.addEventListener('pointerenter', () => {
        const src = url(li.dataset.img);
        if (img.src !== src) img.src = src;
        if (!img.isConnected) previa.append(img);
        requestAnimationFrame(() => {
          activo = true;
          previa.classList.add('visible');
          if (!bucle) bucle = requestAnimationFrame(sigue);
        });
      });
      li.addEventListener('pointerleave', () => { activo = false; previa.classList.remove('visible'); });
    });
    addEventListener('scroll', () => { activo = false; previa.classList.remove('visible'); }, { passive: true });
  }

  /* ---------- Mezclador ---------- */
  const mezcla = $('[data-mezcla]');
  if (mezcla) {
    const limites = { cafe: [1, 3], leche: [0, 3], espuma: [0, 2] };
    const estado = { cafe: 1, leche: 0, espuma: 0 };
    const marco = $('.vaso-marco', mezcla);
    const nombreEl = $('[data-nombre]', mezcla);
    const precioEl = $('[data-precio]', mezcla);
    const UNIDAD = 11.5; // % de la altura del vaso por cada medida

    const nombre = ({ cafe: c, leche: l, espuma: e }) => {
      if (l === 0) {
        if (e > 0) return c > 1 ? 'Macchiato doble' : 'Macchiato';
        return ['Espresso', 'Espresso doble', 'Triple, ¿todo bien?'][c - 1];
      }
      if (l === 1) return ['Cortado', 'Flat white', 'Capuchino'][e];
      if (l === 2) return ['Café con leche', 'Latte', 'Capuchino grande'][e];
      return e === 0 ? 'Leche manchada' : 'Latte grande';
    };

    const pintaMezcla = () => {
      for (const k of Object.keys(estado)) {
        $(`[data-capa="${k}"]`, mezcla).style.height = `${estado[k] * UNIDAD}%`;
        const control = $(`[data-control="${k}"]`, mezcla);
        $('[data-valor]', control).textContent = estado[k];
        $('[data-d="-1"]', control).disabled = estado[k] <= limites[k][0];
        $('[data-d="1"]', control).disabled = estado[k] >= limites[k][1];
      }
      const n = nombre(estado);
      if (nombreEl.textContent !== n) {
        nombreEl.textContent = n;
        nombreEl.classList.remove('cambia');
        void nombreEl.offsetWidth;
        nombreEl.classList.add('cambia');
      }
      precioEl.textContent = (1.6 + (estado.cafe - 1) * 0.6 + estado.leche * 0.4 + estado.espuma * 0.2).toFixed(2);
    };

    mezcla.addEventListener('click', ev => {
      const b = ev.target.closest('button[data-d]');
      if (!b) return;
      const k = b.closest('[data-control]').dataset.control;
      estado[k] = limita(estado[k] + Number(b.dataset.d), ...limites[k]);
      pintaMezcla();
      marco.classList.remove('salpica');
      void marco.offsetWidth;
      marco.classList.add('salpica');
    });
    pintaMezcla();
  }

  /* ---------- Horario: día de hoy y estado de apertura ---------- */
  const tabla = $('[data-horario]');
  const estadoEl = $('[data-estado]');
  if (tabla && estadoEl) {
    const ahora = new Date();
    const minutos = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const filaDe = dia => $$('tr', tabla).find(tr => tr.dataset.dias.split(',').includes(String(dia)));
    const hoy = filaDe(ahora.getDay());
    const m = ahora.getHours() * 60 + ahora.getMinutes();
    hoy.classList.add('hoy');

    let texto;
    if (m >= minutos(hoy.dataset.abre) && m < minutos(hoy.dataset.cierra)) {
      texto = `Abierto ahora, hasta las ${hoy.dataset.cierra}`;
      estadoEl.classList.add('abierto');
    } else if (m < minutos(hoy.dataset.abre)) {
      texto = `Cerrado. Abrimos hoy a las ${hoy.dataset.abre}`;
    } else {
      texto = `Cerrado. Abrimos mañana a las ${filaDe((ahora.getDay() + 1) % 7).dataset.abre}`;
    }
    estadoEl.textContent = texto;
    estadoEl.hidden = false;
  }
})();
