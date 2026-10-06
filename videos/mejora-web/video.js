// Video 2 · Mejora del contenido de la plataforma web de la BDPI  (16:9, estilo minimal con colores BDPI)
// Referencias: capturas de bdpi.cultura.gob.pe y, como referente, atlas.inpi.gob.mx / catalogo.inpi.gob.mx (solo interfaz, sin fotos de personas).
import * as L from './engine/lib.js';
import { DUR, WORDS, LOCAL } from './vo/timing.js';   // lo genera gen_vo.py (ElevenLabs): duración de cada escena y tiempo de cada palabra

const W = 1920, H = 1080;
const INK = '#161616', ACC = '#B73341', DARK = '#8E1B35', GRAY = '#5F5C54', MUTED = '#8C8C88', LINE = '#E4E2DD';
const GREEN = '#2F9E62', AMBER = '#E3A324', RED = '#C23B3B';
const IMG = { logo: 'assets/logo-bdpi.png', buscador: 'assets/ref/bdpi-buscador.png', aimara: 'assets/crop-aimara.png', mapa: 'assets/ref/bdpi-mapa.webp', accesos: 'assets/crop-accesos.png', catFicha: 'assets/ref/catalogo-ficha.png' };

// ---------- helpers ----------
const FONT = (K, w, sz) => w === 'b' ? K.S.type.semi(sz) : w === 'm' ? K.S.type.bodyEm(sz) : w === 'l' ? K.S.type.display(sz) : K.S.type.body(sz);
function tx(K, s, x, y, sz, o = {}) { L.text(K.ctx, s, x, y, { font: FONT(K, o.w || 'r', sz), color: o.c || INK, align: o.a || 'left', alpha: o.al ?? 1, ls: o.ls || 0 }); }
// título con *énfasis* y saltos de línea; devuelve el ancho máximo
function rich(K, str, x, y, sz, o = {}) {
  const c = K.ctx; c.save(); c.textBaseline = 'alphabetic'; c.textAlign = 'left'; c.globalAlpha = o.al ?? 1; let wmax = 0;
  str.split('\n').forEach((ln, i) => {
    const parts = ln.split('*'); c.font = FONT(K, o.w || 'b', sz); if (o.ls) c.letterSpacing = o.ls + 'px';
    const ws = parts.map(p => c.measureText(p).width), tot = ws.reduce((a, b) => a + b, 0); wmax = Math.max(wmax, tot);
    let cx = o.a === 'center' ? x - tot / 2 : x;
    parts.forEach((p, j) => { c.fillStyle = j % 2 ? (o.em || ACC) : (o.c || INK); c.fillText(p, cx, y + i * sz * (o.lh || 1.06)); cx += ws[j]; });
  });
  c.restore(); return wmax;
}
// entrada: sube y aparece
function rise(K, p, fn, dy = 36) { if (p <= 0) return; const c = K.ctx, e = L.E.out(L.clamp(p)); c.save(); c.globalAlpha *= L.clamp(p * 1.5); c.translate(0, (1 - e) * dy); fn(); c.restore(); }
function card(K, x, y, w, h, o = {}) { const c = K.ctx; c.save(); c.shadowColor = 'rgba(20,20,20,.10)'; c.shadowBlur = o.sh ?? 44; c.shadowOffsetY = 16; L.rrect(c, x, y, w, h, o.r ?? 26); c.fillStyle = o.fill || '#FFFFFF'; c.fill(); c.shadowColor = 'transparent'; if (o.stroke) { c.strokeStyle = o.stroke; c.lineWidth = o.lw || 2; c.stroke(); } c.restore(); }
function pill(K, str, x, y, sz, o = {}) { const c = K.ctx; c.font = FONT(K, o.w || 'm', sz); const w = c.measureText(str).width + sz * 1.3, h = sz * 1.9; L.rrect(c, x, y, w, h, h / 2); c.fillStyle = o.fill || ACC; c.fill(); if (o.stroke) { c.strokeStyle = o.stroke; c.lineWidth = 2; c.stroke(); } L.text(c, str, x + w / 2, y + h * 0.66, { font: FONT(K, o.w || 'm', sz), color: o.c || '#fff', align: 'center' }); return w; }
function logo(K, x, y, h, p = 1) { const im = K.images[IMG.logo]; if (!im || p <= 0) return; const w = im.width * h / im.height; K.ctx.save(); K.ctx.globalAlpha = L.clamp(p); K.ctx.drawImage(im, x, y, w, h); K.ctx.restore(); return w; }
function kicker(K, str, x, y, p = 1) { tx(K, str.toUpperCase(), x, y, 22, { w: 'm', c: ACC, ls: 4, al: L.clamp(p * 1.5) }); }
// captura con esquinas redondeadas y sombra; devuelve escala
function shot(K, img, x, y, w, p, o = {}) {
  if (!img || p <= 0) return 0; const e = L.E.out(L.clamp(p)), s = w / img.width, h = img.height * s, c = K.ctx, X = x + (1 - e) * (o.from ?? 90);
  c.save(); c.globalAlpha = L.clamp(p * 1.4); c.shadowColor = 'rgba(20,20,20,.20)'; c.shadowBlur = 50; c.shadowOffsetY = 18; L.rrect(c, X, y, w, h, 16); c.fillStyle = '#fff'; c.fill(); c.shadowColor = 'transparent';
  L.rrect(c, X, y, w, h, 16); c.clip(); c.drawImage(img, X, y, w, h); c.restore(); return s;
}
const walk = t => ({ walk: t * 18, hop: Math.abs(Math.sin(t * 9)) * 14 });
const A = (s, a, d = 0.6, e) => Math.max(0, L.prog(s.t, a, d, e));
// T(escena, palabra): segundo (local a la escena) en que la voz dice esa palabra, menos `lead`; `fb` si no aparece. {n} = n-ésima aparición.
const norm = w => w.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
const T = (i, k, fb = 0, o = {}) => { const m = LOCAL[i].filter(w => norm(w.w) === norm(k))[o.n || 0]; return m ? Math.max(0, m.s - (o.lead ?? 0.15)) : fb; };
const money = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');


// imagen recortada (cover, alineada arriba-izquierda) dentro de una tarjeta con sombra; devuelve la escala usada
function pic(K, img, x, y, w, h, p, o = {}) {
  if (!img || p <= 0) return 0; const e = L.E.out(L.clamp(p)), s = Math.max(w / img.width, h / img.height), c = K.ctx, Y = y + (1 - e) * (o.dy ?? 40);
  c.save(); c.globalAlpha = L.clamp(p * 1.4); c.shadowColor = 'rgba(20,20,20,.18)'; c.shadowBlur = 44; c.shadowOffsetY = 16; L.rrect(c, x, Y, w, h, 18); c.fillStyle = '#fff'; c.fill(); c.shadowColor = 'transparent';
  L.rrect(c, x, Y, w, h, 18); c.clip(); c.drawImage(img, x, Y, img.width * s, img.height * s); c.restore(); return s;
}
// iconos simples de trazo (kind: speaker | photo | play | note | text | bubble | pin | star | people | map)
function icon(K, kind, x, y, s, color = ACC, p = 1) {
  if (p <= 0) return; const c = K.ctx; c.save(); c.translate(x, y); c.scale(s * p, s * p); c.strokeStyle = color; c.fillStyle = color; c.lineWidth = 6; c.lineCap = c.lineJoin = 'round';
  if (kind === 'speaker') { c.beginPath(); c.moveTo(-34, -14); c.lineTo(-14, -14); c.lineTo(10, -34); c.lineTo(10, 34); c.lineTo(-14, 14); c.lineTo(-34, 14); c.closePath(); c.stroke(); [18, 32].forEach((r, i) => { c.beginPath(); c.arc(10, 0, r, -0.9, 0.9); c.stroke(); }); }
  if (kind === 'photo') { L.rrect(c, -40, -32, 80, 64, 10); c.stroke(); c.beginPath(); c.arc(-18, -12, 7, 0, 7); c.fill(); c.beginPath(); c.moveTo(-40, 24); c.lineTo(-14, 0); c.lineTo(6, 18); c.lineTo(20, 4); c.lineTo(40, 26); c.stroke(); }
  if (kind === 'play') { L.rrect(c, -42, -30, 84, 60, 14); c.stroke(); c.beginPath(); c.moveTo(-9, -15); c.lineTo(-9, 15); c.lineTo(17, 0); c.closePath(); c.fill(); }
  if (kind === 'note') { c.beginPath(); c.moveTo(10, -36); c.lineTo(10, 18); c.stroke(); c.beginPath(); c.arc(-4, 22, 14, 0, 7); c.fill(); c.beginPath(); c.moveTo(10, -36); c.quadraticCurveTo(14, -16, 32, -14); c.stroke(); }
  if (kind === 'text') { [-22, -4, 14].forEach((yy, i) => { c.beginPath(); c.moveTo(-34, yy); c.lineTo(i === 2 ? 8 : 34, yy); c.stroke(); }); }
  if (kind === 'bubble') { L.rrect(c, -36, -28, 72, 50, 14); c.stroke(); c.beginPath(); c.moveTo(-14, 22); c.lineTo(-22, 38); c.lineTo(2, 22); c.stroke(); }
  if (kind === 'pin') { c.beginPath(); c.arc(0, -10, 24, Math.PI * 0.85, Math.PI * 2.15); c.lineTo(0, 38); c.closePath(); c.stroke(); c.beginPath(); c.arc(0, -10, 7, 0, 7); c.fill(); }
  if (kind === 'star') { L.star(c, 0, 0, 36, 5, 0.45); c.stroke(); }
  if (kind === 'people') { [[-18, 0], [18, 0]].forEach(([dx]) => { c.beginPath(); c.arc(dx, -16, 11, 0, 7); c.stroke(); c.beginPath(); c.arc(dx, 24, 22, Math.PI, 0); c.stroke(); }); }
  if (kind === 'map') { c.beginPath(); c.moveTo(-38, -26); c.lineTo(-13, -34); c.lineTo(13, -26); c.lineTo(38, -34); c.lineTo(38, 28); c.lineTo(13, 36); c.lineTo(-13, 28); c.lineTo(-38, 36); c.closePath(); c.stroke(); c.beginPath(); c.moveTo(-13, -34); c.lineTo(-13, 28); c.moveTo(13, -26); c.lineTo(13, 36); c.stroke(); }
  c.restore();
}
const tickDot = (K, x, y, p) => { if (p <= 0) return; const c = K.ctx; c.save(); c.translate(x, y); c.scale(L.E.back(L.clamp(p)), L.E.back(L.clamp(p))); c.fillStyle = GREEN; c.beginPath(); c.arc(0, 0, 24, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 5; c.lineCap = c.lineJoin = 'round'; c.beginPath(); c.moveTo(-9, 1); c.lineTo(-2, 8); c.lineTo(10, -8); c.stroke(); c.restore(); };
const TAG = (K, str, x, y, a = 'left') => tx(K, str, x, y, 16, { w: 'm', c: MUTED, a, ls: 3 });

// ---------- escenas ----------
const BLK = [['Síntesis', 'text'], ['Lengua', 'bubble'], ['Territorio', 'pin'], ['Cultura e identidad', 'star'], ['Población', 'people'], ['Mapa', 'map']];
const ATLAS = ['Síntesis etnográfica', 'Lengua', 'Ubicación', 'Estadísticas', 'Música', 'Arte', 'Video', 'Fotografías'];
const rest = (t, base = 0) => 0.03 * Math.sin(t * 3 + base);

export default {
  style: 'minimal', format: '16:9', fps: 30, camera: false, chrome: false,
  person: false, mascot: { image: 'assets/pastor.png' }, actor: { x: 1560, y: 1000, h: 640 },
  palette: { accent: ACC, bg: '#FAFAF7' }, captions: true, words: WORDS,
  scenes: [
    // 1 · HOOK — los datos ya están; que cobren vida
    { type: 'story', dur: DUR[0], images: [IMG.logo, IMG.accesos], say: '',
      render(K, s, h) {
        const c = K.ctx; logo(K, 110, 56, 100, A(s, 0.1, 0.6)); kicker(K, 'Mejora del contenido de la web', 112, 292, A(s, 0.3));
        K.cue('title', 0.35); rise(K, A(s, 0.35, 0.8), () => rich(K, 'Los datos ya\nestán. Ahora, que\n*cobren vida.*', 110, 420, 118, { lh: 1.0 }), 44);
        const tA = T(0, 'datos', 2.9, { lead: 0.2 }), im = K.images[IMG.accesos];
        rise(K, A(s, tA, 0.7), () => { tx(K, 'ACCESOS ACTUALES DE LA PORTADA DE LA BDPI', 112, 722, 16, { w: 'm', c: MUTED, ls: 3 }); });
        pic(K, im, 110, 740, 1000, 208, A(s, tA, 0.8), { dy: 30 }); if (A(s, tA, 0.8) > 0.05) K.cue('pop', tA);
        const tH = T(0, 'hola', 0.1, { lead: 0.25 }), gp = A(s, tH, 0.5, L.E.back); if (gp > 0) { c.save(); c.translate(1520, 330); c.scale(gp, gp); c.translate(-1520, -330); c.fillStyle = DARK; L.rrect(c, 1230, 90, 590, 190, 44); c.fill(); c.beginPath(); c.moveTo(1560, 275); c.lineTo(1520, 345); c.lineTo(1630, 275); c.fill();
          tx(K, '¡Hola de nuevo!', 1525, 168, 54, { w: 'b', c: '#fff', a: 'center' }); tx(K, 'Hoy: cómo mejorar la web de la BDPI.', 1525, 232, 28, { w: 'm', c: '#fff', a: 'center' }); c.restore(); K.cue('pop', tH); }
      },
      actor(t) { const e = L.E.out(L.clamp(t / 0.9)); return { x: L.lerp(2150, 1560, e), y: 1000, h: 640, pose: { hop: t < 0.9 ? Math.sin(e * Math.PI) * 60 : 0, rot: t > 1.2 ? rest(t * 1.6) : 0 }, mood: 'happy' }; } },

    // 2 · LO QUE YA FUNCIONA — tres piezas reales de la BDPI
    { type: 'story', dur: DUR[1], trans: { type: 'pan', dur: 0.8 }, images: [IMG.logo, IMG.buscador, IMG.aimara, IMG.mapa], say: '',
      render(K, s, h) {
        const c = K.ctx; logo(K, 110, 56, 70); kicker(K, 'Lo que ya funciona', 112, 170, A(s, 0.2)); rise(K, A(s, 0.3, 0.7), () => rich(K, 'Una base *sólida*', 110, 255, 72));
        const items = [[IMG.buscador, 'buscador', 'Buscador de localidades', 'Filtros por departamento, provincia y distrito'], [IMG.aimara, 'fichas', 'Ficha por pueblo', 'Pestañas: Pueblo, Lengua y Mapa'], [IMG.mapa, 'mapa', 'Mapa interactivo con capas', 'Localidades, reservas PIACI, lengua predominante…']];
        items.forEach(([src, kw, t1, t2], i) => { const x = 80 + i * 600, tk = T(1, kw, 3.2 + i * 2, { lead: 0.3 }), p = A(s, tk, 0.8);
          pic(K, K.images[src], x, 320, 560, 340, p); if (p > 0.05) K.cue('pop', tk);
          rise(K, A(s, tk + 0.2, 0.6), () => { tx(K, t1, x + 4, 722, 32, { w: 'b' }); tx(K, t2, x + 4, 762, 22, { c: GRAY }); }); tickDot(K, x + 520, 360, A(s, tk + 0.5, 0.5)); });
        const td = T(1, 'descargas', 8.8, { lead: 0.3 }); rise(K, A(s, td, 0.6), () => { pill(K, 'Descarga de listados oficiales y de la ficha de cada pueblo', 84, 820, 28, { fill: ACC }); }); if (A(s, td, 0.6) > 0.05) K.cue('pop', td);
      },
      actor(t) { return { x: 1760, y: 1000, h: 140, pose: { rot: rest(t) }, mood: 'dot' }; } },

    // 3 · EL REFERENTE — INPI México (solo interfaz)
    { type: 'story', dur: DUR[2], trans: { type: 'pan', dur: 0.8 }, images: [IMG.logo, IMG.catFicha], say: '',
      render(K, s, h) {
        const c = K.ctx; logo(K, 110, 56, 70); kicker(K, 'El referente', 112, 170, A(s, 0.2)); rise(K, A(s, 0.3, 0.7), () => rich(K, 'México: el *INPI*', 110, 255, 72));
        const ta = T(2, 'atlas', 2.8, { lead: 0.3 }), to = T(2, 'organiza', 4.3, { lead: 0.2 }), tc = T(2, 'catalogo', 7, { lead: 0.3 }), tp = T(2, 'pestanas', 11.4, { lead: 0.6 });
        rise(K, A(s, ta, 0.7), () => { card(K, 80, 320, 800, 520, { r: 26 }); tx(K, 'ATLAS DE LOS PUEBLOS INDÍGENAS', 116, 372, 18, { w: 'm', c: ACC, ls: 3 }); tx(K, 'Ejemplo: la página de un pueblo', 116, 410, 26, { c: GRAY }); }); if (A(s, ta, 0.7) > 0.05) K.cue('pop', ta);
        ATLAS.forEach((nm, i) => { const x = 116 + (i % 4) * 190, y = 450 + Math.floor(i / 4) * 160, p = A(s, to + i * 0.22, 0.45, L.E.back); if (p <= 0) return; c.save(); c.translate(x + 85, y + 65); c.scale(p, p); c.translate(-85, -65);
          L.rrect(c, 0, 0, 170, 130, 16); c.fillStyle = [ACC, '#C85A66', DARK, '#D9808A'][(i + (i > 3 ? 2 : 0)) % 4]; c.fill(); if (nm.includes(' ')) { const [w1, w2] = nm.split(' '); tx(K, w1, 85, 62, 21, { w: 'm', c: '#fff', a: 'center' }); tx(K, w2, 85, 92, 21, { w: 'm', c: '#fff', a: 'center' }); } else tx(K, nm, 85, 76, 24, { w: 'm', c: '#fff', a: 'center' }); c.restore(); });
        const sc = pic(K, K.images[IMG.catFicha], 1000, 320, 820, 500, A(s, tc, 0.8)); if (A(s, tc, 0.8) > 0.05) K.cue('pop', tc);
        if (sc) { rise(K, A(s, tc + 0.3, 0.6), () => tx(K, 'CATÁLOGO · FICHA DE COMUNIDAD CON PESTAÑAS', 1002, 862, 16, { w: 'm', c: ACC, ls: 3 })); L.circleOn(c, 1000 + 805 * sc, 320 + 503 * sc, 555 * sc, 34 * sc, L.clamp((s.t - tp) / 1.1), ACC, { w: 5 }); }
        rise(K, A(s, 1.2, 0.6), () => tx(K, 'Referencia: atlas.inpi.gob.mx · catalogo.inpi.gob.mx (INPI e INALI, México). Solo se muestra la interfaz.', 84, 905, 20, { c: MUTED }));
      },
      actor(t) { return { x: 1780, y: 1000, h: 120, pose: { rot: rest(t) }, mood: 'dot' }; } },

    // 4 · MEJORA 1 — fichas enriquecidas
    { type: 'story', dur: DUR[3], trans: { type: 'drop', dur: 0.8 }, images: [IMG.logo, IMG.aimara], say: '',
      render(K, s, h) {
        const c = K.ctx; logo(K, 110, 56, 70); kicker(K, 'Mejora 1', 112, 170, A(s, 0.2)); rise(K, A(s, 0.3, 0.7), () => rich(K, 'Fichas *enriquecidas*', 110, 255, 72));
        rise(K, A(s, 0.7, 0.7), () => { tx(K, 'HOY · FICHA DEL PUEBLO AIMARA', 84, 330, 16, { w: 'm', c: MUTED, ls: 3 }); }); pic(K, K.images[IMG.aimara], 80, 350, 700, 400, A(s, 0.7, 0.8));
        rise(K, A(s, 1.2, 0.6), () => tx(K, 'Información valiosa, en secciones de texto.', 84, 800, 26, { c: GRAY }));
        const tb = T(3, 'bloques', 4.5, { lead: 0.3 }), ap = A(s, tb - 0.4, 0.6); if (ap > 0) { c.save(); c.strokeStyle = ACC; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(810, 550); c.lineTo(810 + 70 * ap, 550); c.stroke(); if (ap > 0.9) { c.beginPath(); c.moveTo(872, 534); c.lineTo(890, 550); c.lineTo(872, 566); c.stroke(); } c.restore(); }
        rise(K, A(s, tb, 0.7), () => { card(K, 920, 330, 920, 520, { r: 28, sh: 50 }); tx(K, 'Pueblo Aimara', 960, 400, 44, { w: 'b' }); TAG(K, 'PROPUESTA ILUSTRATIVA', 1800, 396, 'right'); c.fillStyle = LINE; c.fillRect(960, 424, 840, 2); });
        const kw = ['sintesis', 'lengua', 'territorio', 'cultura', 'poblacion', 'mapa'];
        BLK.forEach(([nm, ic], i) => { const x = 960 + (i % 3) * 285, y = 460 + Math.floor(i / 3) * 190, tk = T(3, kw[i], 5.5 + i * 0.6, { lead: 0.3 }), p = A(s, tk, 0.5, L.E.back); if (p <= 0) return; K.cue('pop', tk);
          c.save(); c.translate(x + 130, y + 80); c.scale(p, p); c.translate(-130, -80); L.rrect(c, 0, 0, 260, 170, 18); c.fillStyle = '#F6F6F3'; c.fill(); icon(K, ic, 130, 62, 0.95); tx(K, nm, 130, 140, nm.length > 12 ? 22 : 26, { w: 'm', a: 'center' }); c.restore(); });
      },
      actor(t) { return { x: 150, y: 1000, h: 150, pose: { rot: rest(t) }, mood: 'happy' }; } },

    // 5 · MEJORA 2 — contenido multimedia
    { type: 'story', dur: DUR[4], trans: { type: 'pan', dur: 0.8 }, images: [IMG.logo], say: '',
      render(K, s, h) {
        const c = K.ctx; logo(K, 110, 56, 70); kicker(K, 'Mejora 2', 112, 170, A(s, 0.2)); rise(K, A(s, 0.3, 0.7), () => rich(K, 'Contenido *multimedia*', 110, 255, 72)); TAG(K, 'PROPUESTA ILUSTRATIVA', 1840, 200, 'right');
        [['speaker', 'Audios en lengua originaria', 'audios'], ['photo', 'Fotografías', 'fotografias'], ['play', 'Video', 'video'], ['note', 'Música', 'musica']].forEach(([ic, nm, kw], i) => { const x = 80 + i * 445, tk = T(4, kw, 3.5 + i * 1.2, { lead: 0.3 }), p = A(s, tk, 0.6);
          rise(K, p, () => { card(K, x, 310, 410, 400, { r: 28 }); icon(K, ic, x + 205, 470, 2.1, ACC, L.E.back(L.clamp(p))); tx(K, nm, x + 205, 620, nm.length > 14 ? 30 : 38, { w: 'b', a: 'center' }); }); if (p > 0.05) K.cue('pop', tk); });
        const tp = T(4, 'participacion', 8.6, { lead: 0.3 }), bp = A(s, tp, 0.7, L.E.back); if (bp > 0) { c.save(); c.translate(960, 800); c.scale(bp, bp); c.translate(-960, -800); L.rrect(c, 240, 760, 1440, 100, 50); c.fillStyle = DARK; c.fill(); tickDot(K, 310, 810, 1); tx(K, 'Con la participación y el consentimiento de los pueblos', 1000, 825, 40, { w: 'm', c: '#fff', a: 'center' }); c.restore(); K.cue('impact', tp); }
      },
      actor(t) { return { x: 1760, y: 1000, h: 130, pose: { rot: rest(t) }, mood: 'happy' }; } },

    // 6 · MEJORA 3 — el mapa abre la ficha del pueblo y las fichas de localidades (con datos estadísticos y vínculo)
    { type: 'story', dur: DUR[5], trans: { type: 'pan', dur: 0.8 }, images: [IMG.logo, IMG.mapa], say: '',
      render(K, s, h) {
        const c = K.ctx; logo(K, 110, 56, 70); kicker(K, 'Mejora 3', 112, 170, A(s, 0.2)); rise(K, A(s, 0.3, 0.7), () => rich(K, 'Mapa y fichas *conectados*', 110, 255, 72));
        const tm = T(5, 'mapa', 2, { lead: 0.2 }), X = 80, Y = 310, WW = 880, sc = pic(K, K.images[IMG.mapa], X, Y, WW, 560, A(s, tm, 0.8)); if (sc) K.cue('pop', tm);
        const tt = T(5, 'territorio', 4.8, { lead: 0.2 }), tp = T(5, 'pueblo', 6.6, { lead: 0.2 }), tl = T(5, 'localidad', 8.5, { lead: 0.3 }), te = T(5, 'estadistica', 10.4, { lead: 0.3 }), tv = T(5, 'vinculo', 11.8, { lead: 0.2 }), tb = T(5, 'comunidad', 14.6, { lead: 1.0 });
        const link = (q, ty) => { if (q <= 0 || !sc) return; const cx = X + 1100 * sc, cy = Y + 880 * sc, x0 = cx + 90 * sc, y0 = cy - 20; c.save(); c.strokeStyle = ACC; c.lineWidth = 4; c.setLineDash([10, 10]); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + (1020 - x0) * q, y0 + (ty - y0) * q); c.stroke(); c.restore(); };
        if (sc) L.circleOn(c, X + 1100 * sc, Y + 880 * sc, 90 * sc, 70 * sc, L.clamp((s.t - tt) / 0.9), ACC, { w: 6 });
        link(L.clamp((s.t - tp + 0.3) / 0.7), 395); link(L.clamp((s.t - tl + 0.3) / 0.7), 650);
        // ficha del pueblo
        rise(K, A(s, tp, 0.7), () => { card(K, 1020, 310, 800, 170, { r: 26, sh: 40 }); TAG(K, 'FICHA DEL PUEBLO · EJEMPLO ILUSTRATIVO', 1056, 350); tx(K, 'Aimara', 1056, 410, 48, { w: 'b', c: ACC }); tx(K, 'Moquegua, Puno y Tacna', 1056, 450, 24, { c: GRAY }); pill(K, 'Ver ficha del pueblo', 1500, 396, 22, { fill: ACC }); }); if (A(s, tp, 0.7) > 0.05) K.cue('pop', tp);
        // ficha de localidad: datos del buscador de la BDPI + información estadística + vínculo
        rise(K, A(s, tl, 0.7), () => { card(K, 1020, 500, 800, 300, { r: 26, sh: 40 }); TAG(K, 'FICHA DE LOCALIDAD · EJEMPLO ILUSTRATIVO', 1056, 540); tx(K, 'Localidad seleccionada', 1056, 592, 36, { w: 'b' }); tx(K, 'Tipo de localidad · Distrito · Provincia · Reconocimiento · Titulación', 1056, 628, 20, { c: GRAY }); }); if (A(s, tl, 0.7) > 0.05) K.cue('pop', tl);
        [['Población', 'bars'], ['Indicadores sociales', 'dots'], ['Lengua', 'line']].forEach(([nm, kind], i) => { const x = 1056 + i * 252, y = 650, p = A(s, te + i * 0.4, 0.5); if (p <= 0) return; c.save(); c.globalAlpha = L.clamp(p * 1.5); L.rrect(c, x, y, 236, 84, 14); c.fillStyle = '#F6F6F3'; c.fill(); tx(K, nm, x + 16, y + 28, nm.length > 12 ? 19 : 22, { w: 'm' });
          c.strokeStyle = ACC; c.fillStyle = ACC; c.lineWidth = 4; c.lineCap = c.lineJoin = 'round';
          if (kind === 'bars') [14, 26, 18, 32].forEach((v, k) => c.fillRect(x + 16 + k * 22, y + 76 - v * p, 14, v * p));
          if (kind === 'dots') for (let k = 0; k < 5; k++) { c.globalAlpha = L.clamp(p * 1.5) * (k < 4 ? 1 : 0.3); c.beginPath(); c.arc(x + 24 + k * 30, y + 58, 9, 0, 7); c.fill(); }
          if (kind === 'line') { c.beginPath(); [[0, .8], [.3, .5], [.6, .65], [1, .2]].forEach(([u, v], k) => { const px = x + 16 + u * 150 * p, py = y + 42 + v * 30; k ? c.lineTo(px, py) : c.moveTo(px, py); }); c.stroke(); }
          c.restore(); });
        const bp = A(s, tv, 0.6, L.E.back); if (bp > 0) { c.save(); c.translate(1260, 765); c.scale(bp, bp); c.translate(-1260, -765); pill(K, 'Ver ficha detallada de la localidad  →', 1056, 752, 22, { fill: ACC }); c.restore(); K.cue('pop', tv); }
        rise(K, A(s, tb, 0.7), () => { L.rrect(c, 1020, 818, 800, 62, 31); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke(); tx(K, 'Buscar por comunidad…', 1060, 858, 26, { c: MUTED }); }); if (A(s, tb, 0.7) > 0.05) K.cue('pop', tb);
      },
      actor(t) { return { x: 1760, y: 1000, h: 110, pose: { rot: rest(t) }, mood: 'dot' }; } },

    // 7 · CHIRIBAIA — la puerta de entrada
    { type: 'story', dur: DUR[6], trans: { type: 'pan', dur: 0.8 }, images: [IMG.logo], say: '',
      render(K, s, h) {
        const c = K.ctx; logo(K, 110, 56, 80); kicker(K, 'La puerta de entrada', 112, 330, A(s, 0.2));
        rise(K, A(s, 0.3, 0.8), () => rich(K, 'Pregunta.\n*Llega a la ficha.*', 110, 450, 88, { lh: 1.02 }));
        const cx = 840, cy = 120, cw = 990, ch = 600; rise(K, A(s, 0.5, 0.8), () => {
          card(K, cx, cy, cw, ch, { r: 30, sh: 56 }); c.save(); L.rrect(c, cx, cy, cw, 96, 30); c.clip(); c.fillStyle = DARK; c.fillRect(cx, cy, cw, 96); c.restore();
          c.fillStyle = '#fff'; c.beginPath(); c.arc(cx + 54, cy + 48, 30, 0, 7); c.fill(); const im = K.images[IMG.logo]; if (im) c.drawImage(im, cx + 31, cy + 34, 46, 21);
          tx(K, 'Asistente Inteligente BDPI', cx + 104, cy + 60, 32, { w: 'm', c: '#fff' }); c.fillStyle = '#6BE29A'; c.beginPath(); c.arc(cx + cw - 60, cy + 48, 8, 0, 7); c.fill(); tx(K, 'EJEMPLO ILUSTRATIVO', cx + cw - 90, cy + 56, 16, { w: 'm', c: 'rgba(255,255,255,.75)', a: 'right', ls: 2 }); });
        const q = '¿Dónde vive el pueblo Aimara?', tq = T(6, 'preguntas', 3.1, { lead: 0.1 }), qp = L.clamp((s.t - tq) / 1.3);
        if (s.t > tq - 0.1) { K.cue('type', tq, { dur: 1.3 }); const bw = 560, bx = cx + cw - bw - 40, by = cy + 130; L.rrect(c, bx, by, bw, 80, 28); c.fillStyle = ACC; c.fill(); tx(K, q.slice(0, Math.ceil(q.length * qp)), bx + 30, by + 52, 30, { w: 'm', c: '#fff' }); }
        const tA = T(6, 'llevo', 5.2, { lead: 0.1 }), tp = s.t > tq + 1.4 && s.t < tA; if (tp) { const by = cy + 250; L.rrect(c, cx + 40, by, 150, 70, 35); c.fillStyle = '#F1F1EE'; c.fill(); for (let i = 0; i < 3; i++) { c.fillStyle = MUTED; c.globalAlpha = 0.4 + 0.6 * Math.max(0, Math.sin(s.t * 8 - i)); c.beginPath(); c.arc(cx + 80 + i * 32, by + 35, 8, 0, 7); c.fill(); c.globalAlpha = 1; } }
        rise(K, A(s, tA, 0.7), () => { const by = cy + 250; L.rrect(c, cx + 40, by, 780, 190, 28); c.fillStyle = '#F1F1EE'; c.fill(); ['El pueblo Aimara se ubica en el altiplano', 'peruano, principalmente en Moquegua,', 'Puno y Tacna.'].forEach((l, i) => tx(K, l, cx + 70, by + 56 + i * 42, 30, { w: 'm' })); tx(K, 'Fuente: BDPI · ficha del pueblo Aimara', cx + 70, by + 172, 20, { c: MUTED }); K.cue('pop', tA); });
        [['Abrir ficha del pueblo', T(6, 'ficha', 6, { lead: 0.2 }), cx + 40], ['Ver mapa', T(6, 'mapa', 6.5, { lead: 0.2 }), cx + 400]].forEach(([b, tk, x0]) => { const p = A(s, tk, 0.5, L.E.back); if (p > 0) { c.save(); c.translate(x0 + 100, cy + 495); c.scale(p, p); c.translate(-(x0 + 100), -(cy + 495)); pill(K, b, x0, cy + 470, 26, { fill: '#fff', c: ACC, stroke: ACC }); c.restore(); K.cue('pop', tk); } });
      },
      actor(t) { return { x: 330, y: 1000, h: 250, pose: { rot: rest(t) }, mood: 'happy' }; } },

    // 8 · CIERRE — hoja de ruta
    { type: 'story', dur: DUR[7], trans: { type: 'iris', x: 0.8, y: 0.8, dur: 0.9 }, images: [IMG.logo], say: '',
      render(K, s, h) {
        const c = K.ctx; logo(K, 110, 56, 100, A(s, 0.1, 0.6)); kicker(K, 'La propuesta', 112, 270, A(s, 0.3));
        rise(K, A(s, 0.4, 0.9), () => rich(K, 'La BDPI ya tiene\nlos datos.\n*Hagamos que cuenten\nsu historia.*', 110, 380, 86, { lh: 1.06 }), 40);
        const tI = T(8 - 1, 'disenemos', 5.6, { lead: 0.2 }), bp = A(s, tI, 0.7, L.E.back); if (bp > 0) { K.cue('impact', tI); c.save(); c.translate(480, 805); c.scale(bp, bp); c.translate(-480, -805); L.rrect(c, 110, 750, 740, 110, 55); c.fillStyle = ACC; c.fill(); tx(K, 'Diseñemos la hoja de ruta', 480, 820, 44, { w: 'b', c: '#fff', a: 'center' }); c.restore(); }
        rise(K, A(s, tI + 0.8, 0.7), () => tx(K, 'Alcances, fuentes y plazos por definir con el equipo de la BDPI', 112, 905, 24, { c: GRAY }));
      },
      actor(t) { return { x: 1560, y: 1000, h: 640, pose: { rot: t > 1 ? rest(t * 1.6) : 0 }, mood: 'happy' }; } },
  ],
};
