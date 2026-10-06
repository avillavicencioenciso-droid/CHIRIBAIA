// Video 1 · ChiribaIA, el Asistente Inteligente BDPI  (16:9, ~84 s, estilo minimal con colores BDPI)
// Fuente de contenido: PROPUESTA_CHATBOT_PARA_LA_BDPI.docx + capturas de bdpi.cultura.gob.pe (cifras reales: 9,332 localidades, 3,632,248 personas).
import * as L from './engine/lib.js';
import { DUR, WORDS, LOCAL } from './vo/timing.js';   // lo genera gen_vo.py (ElevenLabs): duración de cada escena y tiempo de cada palabra

const W = 1920, H = 1080;
const INK = '#161616', ACC = '#B73341', DARK = '#8E1B35', GRAY = '#5F5C54', MUTED = '#8C8C88', LINE = '#E4E2DD';
const GREEN = '#2F9E62', AMBER = '#E3A324', RED = '#C23B3B';
const IMG = { logo: 'assets/logo-bdpi.png', buscador: 'assets/ref/bdpi-buscador.png' };

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
const T4 = [T(3, 'verde', 3, { lead: 0.3 }), T(3, 'amarillo', 6.5, { lead: 0.3 }), T(3, 'rojo', 9.5, { lead: 0.3 })];
const N8 = T(7, 'noviembre', 4, { lead: 0.1 }), A8 = T(7, 'abril', 6, { lead: 0 }) + 0.9;
const money = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ---------- escenas ----------
export default {
  style: 'minimal', format: '16:9', fps: 30, camera: false, chrome: false,
  person: false, mascot: { image: 'assets/pastor.png' }, actor: { x: 1560, y: 1000, h: 640 },
  palette: { accent: ACC, bg: '#FAFAF7' }, captions: true, words: WORDS,
  scenes: [
    // 1 · HOOK — el pastor entra saltando; la barra de búsqueda de la BDPI teclea su pregunta
    { type: 'story', dur: DUR[0], images: [IMG.logo], say: 'Soy ChiribaIA. Vengo a ayudarte a encontrar lo que buscas en la BDPI.',
      render(K, s, h) {
        const c = K.ctx; logo(K, 110, 56, 100, A(s, 0.1, 0.6));
        kicker(K, 'Asistente Inteligente BDPI', 112, 292, A(s, 0.3));
        K.cue('title', 0.35); rise(K, A(s, 0.35, 0.8), () => rich(K, '¿Y si en la BDPI\n*bastara con*\n*preguntar?*', 110, 420, 124, { lh: 1.0 }), 44);
        const tE = T(0, 'encontrar', 2.5, { lead: 0.3 }), bp = A(s, tE - 0.4, 0.6), q = '¿Qué quisiera conocer de los pueblos indígenas u originarios?', tp = L.clamp((s.t - tE) / 2.4);
        rise(K, bp, () => { card(K, 110, 740, 1060, 96, { r: 14, sh: 24 }); c.strokeStyle = INK; c.lineWidth = 2; L.rrect(c, 110, 740, 1060, 96, 14); c.stroke();
          K.cue('type', tE, { dur: 2.4 }); tx(K, q.slice(0, Math.ceil(q.length * tp)) + ((K.frame >> 3) % 2 && tp < 1 ? '|' : ''), 140, 800, 32, { c: INK });
          L.rrect(c, 1020, 756, 130, 64, 10); c.fillStyle = ACC; c.fill(); tx(K, 'Buscar', 1085, 798, 28, { w: 'm', c: '#fff', a: 'center' }); });
        // globo de diálogo del pastor
        const tH = T(0, 'hola', 0.1, { lead: 0.25 }), gp = A(s, tH, 0.5, L.E.back); if (gp > 0) { c.save(); c.translate(1520, 330); c.scale(gp, gp); c.translate(-1520, -330); c.fillStyle = DARK; L.rrect(c, 1230, 90, 590, 190, 44); c.fill(); c.beginPath(); c.moveTo(1560, 275); c.lineTo(1520, 345); c.lineTo(1630, 275); c.fill();
          tx(K, '¡Hola!', 1525, 170, 62, { w: 'b', c: '#fff', a: 'center' }); tx(K, 'Soy ChiribaIA, tu asistente de la BDPI.', 1525, 232, 32, { w: 'm', c: '#fff', a: 'center' }); c.restore(); K.cue('pop', tH); }
      },
      actor(t) { const e = L.E.out(L.clamp(t / 0.9)); return { x: L.lerp(2150, 1560, e), y: 1000, h: 640, pose: { hop: t < 0.9 ? Math.sin(e * Math.PI) * 60 : 0, rot: t > 1.2 ? 0.03 * Math.sin(t * 5) : 0 }, mood: 'happy' }; } },

    // 2 · EL PROBLEMA — cifras reales + el buscador actual con sus filtros
    { type: 'story', dur: DUR[1], trans: { type: 'pan', dur: 0.8 }, images: [IMG.logo, IMG.buscador], say: 'La BDPI reúne miles de localidades, pero hay que saber dónde buscar.',
      render(K, s, h) {
        logo(K, 110, 56, 80); kicker(K, 'El problema', 112, 230, A(s, 0.2));
        rise(K, A(s, 0.3, 0.7), () => rich(K, 'Mucha información,\n*difícil de encontrar*', 110, 320, 72));
        const t1 = T(1, 'nueve', 1.8, { lead: 0.1 }), t2 = T(1, 'tres', 5.7, { lead: 0.1 }), n1 = L.clamp((s.t - t1) / 1.8), n2 = L.clamp((s.t - t2) / 2.0);
        rise(K, A(s, t1 - 0.1, 0.6), () => { tx(K, money(9332 * L.E.out(n1)), 110, 560, 150, { w: 'b', c: ACC }); tx(K, 'localidades de pueblos indígenas u originarios', 114, 624, 30, { c: GRAY }); K.cue('count', t1); });
        rise(K, A(s, t2 - 0.1, 0.6), () => { tx(K, money(3632248 * L.E.out(n2)), 110, 740, 100, { w: 'b', c: INK }); tx(K, 'personas viven en esas localidades', 114, 796, 30, { c: GRAY }); K.cue('count', t2); });
        rise(K, A(s, t2 + 1.2, 0.6), () => tx(K, 'Cifras de la BDPI · se actualizan de forma permanente', 112, 850, 22, { c: MUTED }));
        const img = K.images[IMG.buscador], X = 990, Y = 120, WW = 840, sc = shot(K, img, X, Y, WW, A(s, 0.7, 0.9));
        const tC = T(1, 'saber', 10.2, { lead: 0.3 }), tP = T(1, 'filtro', 12.2, { lead: 0.2 });
        if (sc) { const cx = X + 1078 * sc, cy = Y + 322 * sc; L.circleOn(K.ctx, cx, cy, 340 * sc, 52 * sc, L.clamp((s.t - tC) / 1.4), ACC, { w: 6 }); K.cue('pop', tC);
          L.underlineOn(K.ctx, X + 754 * sc, Y + 893 * sc, 200 * sc, L.clamp((s.t - tP - 0.5) / 0.7), ACC, { lw: 6 });
          const bp = A(s, tP, 0.5, L.E.back); if (bp > 0) { K.ctx.save(); K.ctx.translate(X + 520, Y - 36); K.ctx.scale(bp, bp); pill(K, 'Hay que saber qué filtro usar', -190, -30, 26, { fill: ACC }); K.ctx.restore(); }
          const pp = A(s, tP + 0.7, 0.5, L.E.back); if (pp > 0) { K.ctx.save(); K.ctx.translate(X + 780 * sc, Y + 1000 * sc); K.ctx.scale(pp, pp); pill(K, '1,867 páginas de resultados', 0, -30, 26, { fill: INK }); K.ctx.restore(); } }
      },
      actor(t) { const a = L.clamp((t - 0.8) / 0.8); return { x: 1620, y: 1000, h: 170, pose: { rot: 0.03 * Math.sin(t * 3) }, mood: 'dot' }; } },

    // 3 · LA SOLUCIÓN — el chat del Asistente Inteligente BDPI
    { type: 'story', dur: DUR[2], trans: { type: 'pan', dur: 0.8 }, images: [IMG.logo], say: 'Preguntas con tus palabras y recibes una respuesta con su fuente.',
      render(K, s, h) {
        const c = K.ctx; logo(K, 110, 56, 80); kicker(K, 'La solución', 112, 330, A(s, 0.2));
        rise(K, A(s, 0.3, 0.8), () => rich(K, 'Solo\n*pregunta*', 110, 470, 140, { lh: 0.98 }));
        rise(K, A(s, 1.0, 0.6), () => { tx(K, 'Asistente Inteligente BDPI,', 114, 680, 34, { c: GRAY }); tx(K, 'integrado al portal.', 114, 726, 34, { c: GRAY }); });
        const cx = 840, cy = 120, cw = 990, ch = 700; rise(K, A(s, 0.5, 0.8), () => {
          card(K, cx, cy, cw, ch, { r: 30, sh: 56 }); c.save(); L.rrect(c, cx, cy, cw, 96, 30); c.clip(); c.fillStyle = DARK; c.fillRect(cx, cy, cw, 96); c.restore();
          c.fillStyle = '#fff'; c.beginPath(); c.arc(cx + 54, cy + 48, 30, 0, 7); c.fill(); const im = K.images[IMG.logo]; if (im) c.drawImage(im, cx + 31, cy + 34, 46, 21);
          tx(K, 'Asistente Inteligente BDPI', cx + 104, cy + 60, 32, { w: 'm', c: '#fff' }); c.fillStyle = '#6BE29A'; c.beginPath(); c.arc(cx + cw - 60, cy + 48, 8, 0, 7); c.fill();
          tx(K, 'EJEMPLO ILUSTRATIVO', cx + cw - 90, cy + 56, 16, { w: 'm', c: 'rgba(255,255,255,.75)', a: 'right', ls: 2 }); });
        // pregunta del usuario (tecleada)
        const q = '¿Qué pueblos indígenas u originarios están identificados en el Perú?', tQ = T(2, 'simplemente', 2.9, { lead: 0.2 }), qp = L.clamp((s.t - tQ) / 2.0);
        if (s.t > tQ - 0.1) { K.cue('type', tQ, { dur: 2 }); const bw = 700, bx = cx + cw - bw - 40, by = cy + 130; L.rrect(c, bx, by, bw, 118, 28); c.fillStyle = ACC; c.fill();
          c.save(); c.font = FONT(K, 'm', 30); const words = q.slice(0, Math.ceil(q.length * qp)).split(' '); let ln = '', yy = by + 52, lines = []; words.forEach(w => { if (c.measureText(ln + w).width > bw - 60) { lines.push(ln); ln = ''; } ln += w + ' '; }); lines.push(ln); c.restore(); lines.slice(0, 2).forEach((l, i) => tx(K, l, bx + 30, yy + i * 42, 30, { w: 'm', c: '#fff' })); }
        // "escribiendo…" y respuesta
        const tA = T(2, 'respuesta', 6.1, { lead: 0.3 }), tp = s.t > tQ + 2.2 && s.t < tA; if (tp) { const by = cy + 280; L.rrect(c, cx + 40, by, 150, 70, 35); c.fillStyle = '#F1F1EE'; c.fill(); for (let i = 0; i < 3; i++) { c.fillStyle = MUTED; c.globalAlpha = 0.4 + 0.6 * Math.max(0, Math.sin(s.t * 8 - i)); c.beginPath(); c.arc(cx + 80 + i * 32, by + 35, 8, 0, 7); c.fill(); c.globalAlpha = 1; } }
        const ap = A(s, tA, 0.7);
        rise(K, ap, () => { const by = cy + 280, bw = 780; L.rrect(c, cx + 40, by, bw, 150, 28); c.fillStyle = '#F1F1EE'; c.fill();
          tx(K, 'Según la BDPI, hay 55 pueblos indígenas u', cx + 70, by + 56, 30, { w: 'm' }); tx(K, 'originarios identificados.', cx + 70, by + 98, 30, { w: 'm' }); tx(K, 'Fuente: BDPI · información en actualización permanente', cx + 70, by + 134, 20, { c: MUTED }); K.cue('pop', tA); });
        ['Ver fuente', 'Abrir ficha', 'Ver mapa', 'Atención especializada'].forEach((b, i) => { const tc = [T(2, 'fuente', 7.6, { lead: 0.3 }), T(2, 'ficha', 8.5, { lead: 0.3 }), T(2, 'mapa', 9.6, { lead: 0.3 }), T(2, 'mapa', 9.6, { lead: 0.3 }) + 0.7][i], p = A(s, tc, 0.5, L.E.back); if (p > 0) { c.save(); const x0 = [cx + 40, cx + 220, cx + 410, cx + 570][i], y0 = cy + 470; c.translate(x0 + 80, y0 + 30); c.scale(p, p); c.translate(-(x0 + 80), -(y0 + 30)); pill(K, b, x0, y0, 24, { fill: '#fff', c: ACC, stroke: ACC }); c.restore(); K.cue('pop', tc); } });
        rise(K, A(s, tA + 1.2, 0.6), () => { L.rrect(c, cx + 40, cy + ch - 110, cw - 80, 70, 35); c.fillStyle = '#F6F6F3'; c.fill(); c.strokeStyle = LINE; c.lineWidth = 2; c.stroke(); tx(K, 'Pregunta sobre la información disponible…', cx + 80, cy + ch - 66, 24, { c: MUTED }); });
      },
      actor(t) { return { x: 330, y: 1000, h: 250, pose: { rot: 0.025 * Math.sin(t * 3) }, mood: 'happy' }; } },

    // 4 · SEMÁFORO
    { type: 'story', dur: DUR[3], trans: { type: 'drop', dur: 0.8 }, images: [IMG.logo], say: 'Respondo lo que puedo sustentar. Si hay que interpretar, aviso. Y si es especializado, derivo.',
      render(K, s, h) {
        const c = K.ctx; logo(K, 110, 56, 70); rise(K, A(s, 0.2, 0.7), () => rich(K, 'Cada pregunta, *su camino*', 110, 200, 78));
        [[GREEN, 'Consulta automática', ['Respuesta directa con', 'datos y contenidos', 'oficiales.'], 'Verde'], [AMBER, 'Con advertencia', ['Información general y', 'aviso cuando requiere', 'interpretación o revisión.'], 'Amarillo'], [RED, 'Consulta especializada', ['No se responde sola:', 'se genera un ticket y se', 'deriva a un profesional.'], 'Rojo']].forEach(([col, ti, ds, nm], i) => {
          const x = 130 + i * 570, y = 470, p = A(s, T4[i], 0.7);
          rise(K, p, () => { card(K, x, y, 520, 410, { r: 30 }); c.fillStyle = col; c.beginPath(); c.arc(x + 80, y + 90, 46, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(x + 66, y + 76, 14, 0, 7); c.fill();
            tx(K, nm.toUpperCase(), x + 150, y + 78, 22, { w: 'm', c: col, ls: 4 }); tx(K, ti, x + 40, y + 190, 40, { w: 'b' }); ds.forEach((d, k) => tx(K, d, x + 40, y + 250 + k * 40, 28, { c: GRAY })); });
          if (p > 0.1) K.cue('pop', T4[i]);
        });
      },
      actor(t) { const stops = [[390, T4[0] + 0.1], [960, T4[1] + 0.1], [1530, T4[2] + 0.1]]; let x = 390, y = 470;
        for (let i = 1; i < 3; i++) if (t >= stops[i][1] - 0.5) { const q = L.clamp((t - stops[i][1] + 0.5) / 0.5); x = L.lerp(stops[i - 1][0], stops[i][0], L.E.inOut(q)); y = 470 - Math.sin(q * Math.PI) * 120 * (q < 1 && q > 0 ? 1 : 0); }
        return { x, y, h: 235, pose: { hop: 0, rot: 0.03 * Math.sin(t * 4) }, mood: 'happy' }; } },

    // 5 · DERIVACIÓN — 4 equipos + ticket
    { type: 'story', dur: DUR[4], trans: { type: 'pan', dur: 0.8 }, images: [IMG.logo], say: 'Cada consulta llega al equipo correcto, con un ticket que no se pierde.',
      render(K, s, h) {
        const c = K.ctx; logo(K, 110, 56, 70); rise(K, A(s, 0.2, 0.7), () => rich(K, 'Al *especialista correcto*', 110, 200, 74));
        const T5 = [T(4, 'geografico', 3.1, { lead: 0.3 }), T(4, 'cuantitativo', 4.1, { lead: 0.3 }), T(4, 'cualitativo', 5.3, { lead: 0.3 }), T(4, 'especializado', 6.6, { lead: 0.3 })], tT = T(4, 'registrada', 8.6, { lead: 0.3 });
        const teams = [['Geográfico', 'Ubicación, localidades y mapas', 'pin'], ['Cuantitativo', 'Población, indicadores y cifras', 'bars'], ['Cualitativo', 'Historia, cultura y lengua', 'talk'], ['Especializado', 'Casos particulares y normativos', 'scale']];
        teams.forEach(([t1, t2, ic], i) => { const x = 110 + (i % 2) * 410, y = 290 + Math.floor(i / 2) * 230, p = A(s, T5[i], 0.6);
          rise(K, p, () => { card(K, x, y, 390, 200, { r: 24, sh: 30 }); c.save(); c.strokeStyle = ACC; c.fillStyle = ACC; c.lineWidth = 5; c.lineCap = c.lineJoin = 'round'; const ix = x + 54, iy = y + 58;
            if (ic === 'pin') { c.beginPath(); c.arc(ix, iy - 8, 18, Math.PI * 0.85, Math.PI * 2.15); c.lineTo(ix, iy + 30); c.closePath(); c.stroke(); c.beginPath(); c.arc(ix, iy - 8, 6, 0, 7); c.fill(); }
            if (ic === 'bars') { [[-22, 20], [-4, 40], [14, 58]].forEach(([dx, hh]) => c.fillRect(ix + dx - 7, iy + 28 - hh, 14, hh)); }
            if (ic === 'talk') { L.rrect(c, ix - 30, iy - 24, 60, 40, 12); c.stroke(); c.beginPath(); c.moveTo(ix - 8, iy + 16); c.lineTo(ix - 14, iy + 32); c.lineTo(ix + 6, iy + 16); c.stroke(); }
            if (ic === 'scale') { c.beginPath(); c.moveTo(ix, iy - 28); c.lineTo(ix, iy + 28); c.moveTo(ix - 28, iy - 14); c.lineTo(ix + 28, iy - 14); c.moveTo(ix - 28, iy - 14); c.lineTo(ix - 40, iy + 8); c.lineTo(ix - 16, iy + 8); c.closePath(); c.moveTo(ix + 28, iy - 14); c.lineTo(ix + 16, iy + 8); c.lineTo(ix + 40, iy + 8); c.closePath(); c.stroke(); }
            c.restore(); tx(K, t1, x + 28, y + 128, 34, { w: 'b' }); tx(K, t2, x + 28, y + 170, 22, { c: GRAY }); });
          if (p > 0.05) K.cue('pop', T5[i]); });
        // flecha hacia el ticket
        const ap = A(s, tT - 0.5, 0.7); if (ap > 0) { c.save(); c.strokeStyle = ACC; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(930, 500); c.lineTo(930 + 70 * ap, 500); c.stroke(); if (ap > 0.9) { c.beginPath(); c.moveTo(992, 484); c.lineTo(1010, 500); c.lineTo(992, 516); c.stroke(); } c.restore(); }
        const tp = A(s, tT, 0.8); rise(K, tp, () => { const x = 1030, y = 290, w = 790, hh = 560; card(K, x, y, w, hh, { r: 28, sh: 50 }); c.save(); L.rrect(c, x, y, w, 80, 28); c.clip(); c.fillStyle = INK; c.fillRect(x, y, w, 80); c.restore();
          tx(K, 'TICKET DE ATENCIÓN ESPECIALIZADA', x + 36, y + 52, 26, { w: 'm', c: '#fff', ls: 2 });
          [['Pregunta', 'Texto original del ciudadano'], ['Clasificación', 'Geográfico · Cuantitativo · Cualitativo · Especializado'], ['Fuentes consultadas', 'Registros, fichas, mapas o documentos'], ['Responsable', 'Profesional o equipo asignado']].forEach(([a, b], i) => { const yy = y + 130 + i * 78; const rp = A(s, tT + 0.4 + i * 0.4, 0.5); c.save(); c.globalAlpha = L.clamp(rp * 1.5); tx(K, a.toUpperCase(), x + 36, yy, 18, { w: 'm', c: ACC, ls: 2 }); tx(K, b, x + 36, yy + 34, 26, { c: INK }); c.fillStyle = LINE; c.fillRect(x + 36, yy + 52, w * 0.9 * rp, 1.5); c.restore(); });
          tx(K, 'ESTADO', x + 36, y + 470, 18, { w: 'm', c: ACC, ls: 2 }); const st = ['Nuevo', 'En revisión', 'Respondido', 'Cerrado']; let sx = x + 36; const tS = tT + 2.1, cur = Math.min(3, Math.max(0, Math.floor((s.t - tS) / 0.55)));
          st.forEach((nm, i) => { const on = s.t > tS && i <= cur; c.font = FONT(K, 'm', 22); const wd = c.measureText(nm).width + 34; L.rrect(c, sx, y + 485, wd, 46, 23); c.fillStyle = on ? (i === 3 ? GREEN : ACC) : '#F1F1EE'; c.fill(); tx(K, nm, sx + wd / 2, y + 516, 22, { w: 'm', c: on ? '#fff' : MUTED, a: 'center' }); sx += wd + 12; }); });
      },
      actor(t) { return { x: 250, y: 1000, h: 210, pose: { rot: 0.03 * Math.sin(t * 3) }, mood: 'dot' }; } },

    // 6 · MEMORIA INSTITUCIONAL — biblioteca + panel
    { type: 'story', dur: DUR[5], trans: { type: 'pan', dur: 0.8 }, images: [IMG.logo], say: 'Lo que el especialista valida queda guardado, y el panel muestra qué pregunta la gente.',
      render(K, s, h) {
        const c = K.ctx; logo(K, 110, 56, 70); rise(K, A(s, 0.2, 0.7), () => rich(K, 'Cada respuesta validada\n*se queda*', 110, 200, 70));
        // biblioteca: tarjetas apiladas
        const tV = T(5, 'valida', 1.6, { lead: 0.4 }), tPn = T(5, 'panel', 5.2, { lead: 0.3 });
        const items = [['Pregunta frecuente', ''], ['Respuesta validada', ''], ['Fuente institucional', ''], ['Fecha de validación', ''], ['Equipo responsable', '']];
        rise(K, A(s, 0.8, 0.6), () => tx(K, 'BIBLIOTECA DE CONOCIMIENTO', 112, 390, 20, { w: 'm', c: ACC, ls: 3 }));
        items.forEach(([a], i) => { const p = A(s, tV + i * 0.3, 0.5); rise(K, p, () => { card(K, 110, 420 + i * 82, 700, 68, { r: 18, sh: 18 }); c.fillStyle = ACC; c.beginPath(); c.arc(150, 454 + i * 82, 10, 0, 7); c.fill(); tx(K, a, 182, 464 + i * 82, 28, { w: 'm' }); }, 20); });
        const ap = A(s, T(5, 'conocimiento', 3.5, { lead: 0.1 }), 0.6); if (ap > 0) { c.save(); c.strokeStyle = ACC; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(850, 640); c.lineTo(850 + 70 * ap, 640); c.stroke(); if (ap > 0.9) { c.beginPath(); c.moveTo(912, 624); c.lineTo(930, 640); c.lineTo(912, 656); c.stroke(); } c.restore(); }
        // panel de control
        rise(K, A(s, tPn, 0.8), () => { const x = 960, y = 330, w = 860, hh = 520; card(K, x, y, w, hh, { r: 28, sh: 50 }); tx(K, 'PANEL DE CONTROL', x + 36, y + 56, 22, { w: 'm', c: ACC, ls: 3 }); tx(K, 'ILUSTRATIVO', x + w - 36, y + 56, 16, { w: 'm', c: MUTED, a: 'right', ls: 3 });
          const cells = [['Demanda', 'line'], ['Automatización', 'donut'], ['Derivación', 'bars'], ['Calidad', 'dots']];
          cells.forEach(([nm, kind], i) => { const bx = x + 36 + (i % 2) * 400, by = y + 90 + Math.floor(i / 2) * 210, p = A(s, tPn + 0.4 + i * 0.45, 0.6); c.save(); c.globalAlpha = L.clamp(p * 1.5); L.rrect(c, bx, by, 380, 190, 18); c.fillStyle = '#F6F6F3'; c.fill(); tx(K, nm, bx + 24, by + 40, 26, { w: 'm' });
            c.strokeStyle = ACC; c.fillStyle = ACC; c.lineWidth = 5; c.lineCap = c.lineJoin = 'round';
            if (kind === 'line') { c.beginPath(); [[0, 0.7], [0.2, 0.55], [0.4, 0.62], [0.6, 0.35], [0.8, 0.42], [1, 0.15]].forEach(([u, v], k) => { const px = bx + 30 + u * 320 * p, py = by + 70 + v * 90; k ? c.lineTo(px, py) : c.moveTo(px, py); }); c.stroke(); }
            if (kind === 'donut') { c.lineWidth = 16; c.strokeStyle = LINE; c.beginPath(); c.arc(bx + 190, by + 115, 40, 0, 7); c.stroke(); c.strokeStyle = ACC; c.beginPath(); c.arc(bx + 190, by + 115, 40, -Math.PI / 2, -Math.PI / 2 + Math.PI * 1.3 * p); c.stroke(); }
            if (kind === 'bars') { [60, 90, 45, 75].forEach((v, k) => c.fillRect(bx + 50 + k * 74, by + 170 - v * p, 44, v * p)); }
            if (kind === 'dots') { for (let k = 0; k < 5; k++) { c.globalAlpha = L.clamp(p * 1.5) * (k < 4 ? 1 : 0.3); c.beginPath(); c.arc(bx + 60 + k * 64, by + 120, 20, 0, 7); c.fill(); } }
            c.restore(); }); });
      },
      actor(t) { return { x: 1700, y: 1000, h: 150, pose: { rot: 0.03 * Math.sin(t * 3) }, mood: 'happy' }; } },

    // 7 · CONFIANZA — los cinco principios
    { type: 'story', dur: DUR[6], trans: { type: 'zoom', x: 0.885, y: 0.92, zoom: 4, dur: 0.9 }, images: [IMG.logo], say: 'Mi regla: si no tengo evidencia suficiente, no invento. Derivo.',
      render(K, s, h) {
        const c = K.ctx; logo(K, 110, 56, 70); rise(K, A(s, 0.2, 0.8), () => rich(K, 'Sin evidencia,\n*no invento.*\n*Derivo.*', 110, 330, 112, { lh: 1.0 }));
        ['Fuente oficial y trazable', 'No inventa información', 'Derivación inteligente', 'Supervisión humana', 'Mejora continua'].forEach((t1, i) => { const t7 = [T(6, 'oficial', 2.3, { lead: 0.4 }), T(6, 'invento', 6.4, { lead: 0.3 }), T(6, 'derivo', 7.4, { lead: 0.3 }), T(6, 'supervision', 9.3, { lead: 0.3 }), T(6, 'mejorando', 10.7, { lead: 0.3 })][i], y = 230 + i * 110, p = A(s, t7, 0.5);
          if (p > 0) { K.cue('pop', t7); c.save(); c.globalAlpha = L.clamp(p * 1.5); c.translate((1 - L.E.out(p)) * 50, 0); card(K, 1020, y - 44, 800, 86, { r: 20, sh: 20 }); c.fillStyle = ACC; c.beginPath(); c.arc(1076, y - 1, 24, 0, 7); c.fill();
            c.strokeStyle = '#fff'; c.lineWidth = 5; c.lineCap = c.lineJoin = 'round'; c.beginPath(); const q = L.clamp((p - 0.3) / 0.7); c.moveTo(1066, y - 1); if (q > 0) c.lineTo(1066 + 8 * Math.min(1, q * 2), y - 1 + 8 * Math.min(1, q * 2)); if (q > 0.5) c.lineTo(1074 + 14 * (q - 0.5) * 2, y + 7 - 18 * (q - 0.5) * 2); c.stroke();
            tx(K, t1, 1124, y + 12, 36, { w: 'm' }); c.restore(); } });
      },
      actor(t) { return { x: 440, y: 1000, h: 330, pose: { rot: 0.03 * Math.sin(t * 3) }, mood: 'happy' }; } },

    // 8 · PLAN Y METAS — línea de tiempo con el pastor caminando
    { type: 'story', dur: DUR[7], trans: { type: 'pan', dur: 0.8 }, images: [IMG.logo], say: 'Proponemos empezar con un piloto controlado de seis meses.',
      render(K, s, h) {
        const c = K.ctx; logo(K, 110, 56, 70); rise(K, A(s, 0.2, 0.7), () => rich(K, 'Piloto de *6 meses*', 110, 200, 82)); rise(K, A(s, 0.5, 0.7), () => tx(K, 'Noviembre 2026 – abril 2027', 112, 250, 30, { c: GRAY }));
        const steps = [['Nov 2026', 'Diagnóstico y fuentes'], ['Dic 2026', 'Diseño y reglas'], ['Ene 2027', 'Prototipo'], ['Feb 2027', 'Piloto interno'], ['Mar 2027', 'Tickets y biblioteca'], ['Abr 2027', 'Piloto público']];
        const lp = A(s, N8, A8 - N8, L.E.linear), y0 = 470; c.strokeStyle = LINE; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(130, y0); c.lineTo(1790, y0); c.stroke(); c.strokeStyle = ACC; c.beginPath(); c.moveTo(130, y0); c.lineTo(130 + 1660 * lp, y0); c.stroke();
        steps.forEach(([m, a], i) => { const x = 220 + i * 296, on = lp * 1660 + 130 >= x - 10; if (on) { const p = A(s, N8 + (x - 130) / 1660 * (A8 - N8), 0.5, L.E.back); c.fillStyle = ACC; c.beginPath(); c.arc(x, y0, 18 * p, 0, 7); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y0, 7 * p, 0, 7); c.fill();
          c.save(); c.globalAlpha = L.clamp(p * 1.4); tx(K, m, x, y0 + 64, 28, { w: 'b', a: 'center' }); tx(K, a, x, y0 + 102, 22, { c: GRAY, a: 'center' }); c.restore(); } });
        [['≥ 60 %', 'respuesta automática'], ['< 10 s', 'tiempo de respuesta'], ['≥ 90 %', 'derivación correcta']].forEach(([n, l], i) => { const tm = [T(7, 'sesenta', 9.3, { lead: 0.4 }), T(7, 'diez', 12.6, { lead: 0.4 }), T(7, 'noventa', 14.2, { lead: 0.4 })][i], p = A(s, tm, 0.6); rise(K, p, () => { card(K, 130 + i * 570, 700, 520, 190, { r: 26 }); tx(K, n, 130 + i * 570 + 260, 810, 84, { w: 'b', c: ACC, a: 'center' }); tx(K, l, 130 + i * 570 + 260, 860, 28, { c: GRAY, a: 'center' }); }); if (p > 0.05) K.cue('pop', tm); });
        rise(K, A(s, T(7, 'metas', 8.1, { lead: 0.2 }), 0.6), () => tx(K, 'METAS ORIENTATIVAS DEL PILOTO', 130, 676, 18, { w: 'm', c: ACC, ls: 3 }));
      },
      actor(t) { const q = L.clamp((t - N8) / (A8 - N8)), x = L.lerp(220, 1510, L.E.linear(q)); return { x, y: 458, h: 190, pose: q > 0 && q < 1 ? walk(t) : { rot: 0.03 * Math.sin(t * 3) }, mood: 'happy' }; } },

    // 9 · CIERRE — mensaje ejecutivo + pedido
    { type: 'story', dur: DUR[8], trans: { type: 'iris', x: 0.8, y: 0.8, dur: 0.9 }, images: [IMG.logo], say: 'Iniciemos el piloto. Que la BDPI, ahora, responda.',
      render(K, s, h) {
        const c = K.ctx; logo(K, 110, 56, 100, A(s, 0.1, 0.6)); kicker(K, 'La propuesta', 112, 270, A(s, 0.3));
        rise(K, A(s, 0.4, 0.9), () => rich(K, '“La propuesta es transformar la BDPI\nde una plataforma donde el ciudadano\ndebe *aprender a buscar*, en una plataforma\ndonde simplemente pueda *preguntar*.”', 110, 360, 50, { w: 'l', lh: 1.28 }), 40);
        const tI = T(8, 'iniciemos', 8.1, { lead: 0.2 }), bp = A(s, tI, 0.7, L.E.back); if (bp > 0) { K.cue('impact', tI); c.save(); c.translate(430, 735); c.scale(bp, bp); c.translate(-430, -735); L.rrect(c, 110, 680, 640, 110, 55); c.fillStyle = ACC; c.fill(); tx(K, 'Iniciemos el piloto', 430, 750, 44, { w: 'b', c: '#fff', a: 'center' }); c.restore(); }
        rise(K, A(s, tI + 0.8, 0.7), () => tx(K, 'Piloto controlado · 6 meses · calidad y trazabilidad primero', 112, 850, 26, { c: GRAY }));
      },
      actor(t) { const e = L.E.out(L.clamp(t / 0.9)); return { x: 1560, y: 1000, h: 640, pose: { rot: t > 1 ? 0.03 * Math.sin(t * 5) : 0 }, mood: 'happy' }; } },
  ],
};
