import { createBimViewer, SYS, MG, lvlColor, F } from './bimviewer.js';
import REG from './bimreg.js';

/* Ventana 01 · biblioteca de modelos BIM y su visor.
   Todo lo que se muestra sale del archivo .bim de cada modelo (geometría + datos del IFC); los textos salen de bimreg.js. */
var $ = function (id) { return document.getElementById(id); };
var by = {}; REG.models.forEach(function (m) { by[m.slug] = m; });
var n0 = function (n) { return Number(n).toLocaleString('en-US'); };
var nf = function (n, d) { return Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); };
function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); return n; }
var KIND = { inf: 'Modelo de información BIM', mue: 'Plantilla de muestra', dis: 'Modelo de diseño' };

export function initBim(o) {
  o = o || {};
  var reduce = !!o.reduce, b64 = !!o.b64, stage = $('bxs'), V = null, cur = null, H = null, metBuilt = false;
  var wide = window.matchMedia ? window.matchMedia('(min-width:901px)') : { matches: true };

  /* ---------- pestañas ---------- */
  function setTab(t) {
    document.querySelectorAll('#bxTabs .bxtab').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.t === t); });
    document.querySelectorAll('.bxpn').forEach(function (p) { p.hidden = p.dataset.t !== t; });
    if (t === 'met' && !metBuilt && H) buildMet();
  }
  document.querySelectorAll('#bxTabs .bxtab').forEach(function (b) { b.addEventListener('click', function () { setTab(b.dataset.t); }); });

  /* ---------- ficha de elemento ---------- */
  function str(i) { return i == null || i < 0 ? '' : H.strs[i]; }
  function row(dl, k, v) { if (v == null || v === '') return; dl.appendChild(el('dt', null, k)); dl.appendChild(el('dd', null, v)); }
  function showSel(info) {
    var chip = $('bxsel');
    if (!info) { chip.hidden = true; clear($('bxFic')).appendChild(el('p', 'small bxempty', 'Toca un elemento del modelo y aquí aparece su ficha: familia, tipo, nivel, material, fase, cantidades y todas las propiedades que trae el IFC.')); return; }
    var ei = info.ei, e = H.el[ei], ft = str(e[F.ft]) || 'Elemento', lvl = H.lv[e[F.lvl]], sys = SYS[H.sys[e[F.sys]]];
    $('bxsK').textContent = sys.l + ' · ' + (lvl && lvl.z != null ? lvl.n : 'sin nivel');
    $('bxsT').textContent = ft;
    chip.hidden = false;
    var box = clear($('bxFic'));
    box.appendChild(el('span', 'tech bxfk', sys.l + ' · ' + str(e[F.cls]).replace(/^Ifc/, 'Ifc')));
    box.appendChild(el('h4', 'bxft', ft));
    var dl = el('dl', 'bxd');
    row(dl, 'Nivel', lvl && lvl.z != null ? lvl.n : null);
    row(dl, 'Material', str(e[F.mat]) || 'Sin material');
    row(dl, 'Fase de creación', str(e[F.phase]));
    row(dl, 'Función', str(e[F.fun]));
    row(dl, 'Código de montaje', str(e[F.cod]));
    if (e[F.vol] != null) row(dl, 'Volumen', nf(e[F.vol], 3) + ' m³');
    if (e[F.area] != null) row(dl, 'Área', nf(e[F.area], 2) + ' m²');
    if (e[F.len] != null) row(dl, 'Longitud', nf(e[F.len], 2) + ' m');
    row(dl, 'Envolvente', nf(Math.max(info.dim.x, info.dim.z), 2) + ' × ' + nf(Math.min(info.dim.x, info.dim.z), 2) + ' × ' + nf(info.dim.y, 2) + ' m');
    row(dl, 'ID Revit', str(e[F.tag]));
    box.appendChild(dl);
    /* propiedades del IFC, agrupadas por conjunto */
    var groups = [], map = {}, p0 = e[F.p0], pn = e[F.pn];
    for (var i = p0; i < p0 + pn; i++) {
      var ps = str(H.pr[i * 3]), g = map[ps]; if (!g) { g = map[ps] = { n: ps, r: [] }; groups.push(g); }
      g.r.push([str(H.pr[i * 3 + 1]), str(H.pr[i * 3 + 2])]);
    }
    box.appendChild(el('h4', 'bxsub', 'Propiedades del IFC · ' + pn));
    groups.forEach(function (g, gi) {
      var d = el('details', 'bxps'); if (gi < 2) d.open = true;
      var s = el('summary'); s.appendChild(el('span', null, g.n)); s.appendChild(el('i', null, String(g.r.length))); d.appendChild(s);
      var l = el('dl', 'bxd sm'); g.r.forEach(function (r) { l.appendChild(el('dt', null, r[0])); l.appendChild(el('dd', null, r[1])); }); d.appendChild(l); box.appendChild(d);
    });
    if (wide.matches) setTab('fic');
  }
  $('bxsGo').addEventListener('click', function () { setTab('fic'); var p = document.querySelector('.bxp'); if (p && !wide.matches) p.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); });
  $('bxsX').addEventListener('click', function () { V.select(null); });
  var fr = $('bxF'); if (fr) fr.addEventListener('click', function () { var on = fr.getAttribute('aria-pressed') !== 'true'; fr.setAttribute('aria-pressed', on); $('bxs').classList.toggle('free', on); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('bxsel').hidden) V.select(null); });

  /* ---------- corte (section box) ---------- */
  var AXES = ['x', 'z', 'y'];
  function syncSec(st) {
    var sec = $('vsec'); sec.dataset.on = st.on; stage.classList.toggle('cuts', st.on);
    $('vSB').setAttribute('aria-pressed', st.on); $('vSB').textContent = st.on ? 'Apagar corte' : 'Activar corte'; $('vsOut').textContent = st.on ? 'Activo' : 'Apagado';
    $('bxHint').textContent = st.on ? 'arrastra las flechas para cortar' : 'arrastra para girar · toca un elemento';
    AXES.forEach(function (a) {
      var r = sec.querySelector('.ax[data-a="' + a + '"]'), ins = r.querySelectorAll('input'), f = st.f[a];
      ins[0].value = Math.round(f[0] * 1000); ins[1].value = Math.round(f[1] * 1000);
      r.querySelector('.trk b').style.cssText = '--a:' + (f[0] * 100) + '%;--b:' + (f[1] * 100) + '%';
      var off = a === 'y' ? st.off : 0;
      r.querySelector('output').textContent = nf(st.m[a][0] + off, 2).replace(/^-0\.00$/, '0.00') + ' – ' + nf(st.m[a][1] + off, 2) + ' m';
    });
  }
  function wireSec() {
    $('vSB').addEventListener('click', function () { V.sec.enable(!V.sec.isOn()); });
    document.querySelectorAll('#vsec .ax').forEach(function (r) {
      r.querySelectorAll('input').forEach(function (inp) { inp.addEventListener('input', function () { V.sec.set(r.dataset.a, inp.dataset.w, (+inp.value) / 1000); }); });
    });
    document.querySelectorAll('#vsec .pre [data-p]').forEach(function (b) { b.addEventListener('click', function () { if (!V.sec.isOn()) V.sec.enable(true); V.sec.preset(b.dataset.p); }); });
  }

  /* ---------- paneles del modelo cargado ---------- */
  function shownBy() {
    var c = {}; H.el.forEach(function (e) { if (e[F.shown]) { var k = H.sys[e[F.sys]]; c[k] = (c[k] || 0) + 1; } }); return c;
  }
  function toggleLi(ul, swatch, label, sub, count, on, handler, solo) {
    var li = el('li'), b = el('button', 'bxlt', null); b.type = 'button'; b.setAttribute('aria-pressed', on);
    var sw = el('i', 'bxsw'); sw.style.background = swatch; b.appendChild(sw);
    var t = el('span', 'bxlb', label); if (sub) t.appendChild(el('small', null, ' ' + sub)); b.appendChild(t);
    b.appendChild(el('span', 'bxct', count)); b.addEventListener('click', function () { var v = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', v); handler(v); });
    li.appendChild(b);
    if (solo) { var s = el('button', 'bxso', 'Solo'); s.type = 'button'; s.addEventListener('click', solo); li.appendChild(s); }
    ul.appendChild(li); return b;
  }
  function fillModel(m) {
    var st = H.st, dl = clear($('bxD'));
    row(dl, 'Origen', m.app + ' → ' + m.schema);
    row(dl, 'Elementos en el IFC', n0(st.n));
    row(dl, 'En el visor', n0(st.shown));
    row(dl, 'Tipos de elemento', n0(st.types));
    row(dl, 'Niveles', String(m.levels));
    row(dl, 'Peso del modelo', m.kb >= 1000 ? nf(m.kb / 1024, 1) + ' MB' : m.kb + ' KB');
    /* sistemas */
    var sb = shownBy(), ul = clear($('bxSys')), present = {}; H.cells.forEach(function (c) { present[H.sys[c.s]] = 1; });
    if (!present.ter) row(dl, 'Terreno', 'El IFC no trae terreno: el visor muestra una base neutra');
    H.sys.forEach(function (k) { if (!present[k] || k === 'ter') return; toggleLi(ul, SYS[k].c, SYS[k].l, null, n0(sb[k] || 0), true, function (on) { V.setSys(k, on); }); });
    /* niveles */
    var lu = clear($('bxLvl')), real = H.lv.length - 1;
    H.lv.forEach(function (l, i) {
      if (l.z == null || !l.c) return;
      var sub = (l.z >= 0 ? '+' : '−') + nf(Math.abs(l.z), 2) + ' m', chk;
      chk = toggleLi(lu, lvlColor(i, real), l.n, sub, n0(l.c), true, function (on) { V.setLevel(i, on); }, function () {
        V.onlyLevel(i); lu.querySelectorAll('.bxlt').forEach(function (b, k) { b.setAttribute('aria-pressed', b === chk); });
      });
    });
    var all = el('li'), ab = el('button', 'bxso wide', 'Mostrar todos los niveles'); ab.type = 'button';
    ab.addEventListener('click', function () { V.onlyLevel(null); lu.querySelectorAll('.bxlt').forEach(function (b) { b.setAttribute('aria-pressed', true); }); });
    all.appendChild(ab); lu.appendChild(all);
    /* materiales y fases (solo se ven en esas vistas) */
    var mg = {}, vols = {}; H.el.forEach(function (e) { var k = H.mg[e[F.mg]]; mg[k] = (mg[k] || 0) + 1; if (H.sys[e[F.sys]] !== 'ter' && e[F.vol]) vols[k] = (vols[k] || 0) + e[F.vol]; });
    var mu = clear($('bxMat')); H.mg.forEach(function (k) { if (!mg[k]) return; var li = el('li'), b = el('div', 'bxlt'); var sw = el('i', 'bxsw'); sw.style.background = MG[k].c; b.appendChild(sw); b.appendChild(el('span', 'bxlb', MG[k].l)); b.appendChild(el('span', 'bxct', n0(mg[k]) + (vols[k] ? ' · ' + nf(vols[k], 1) + ' m³' : ''))); li.appendChild(b); mu.appendChild(li); });
    var ph = {}; H.el.forEach(function (e) { var k = e[F.phase] >= 0 ? str(e[F.phase]) : 'Sin fase'; ph[k] = (ph[k] || 0) + 1; });
    var pu = clear($('bxPh')), pc = { 'Nueva construcción': '#DDE1E3', 'Existente': '#E3A74B', 'Sin fase': '#4B555C' };
    Object.keys(ph).forEach(function (k) { var li = el('li'), b = el('div', 'bxlt'); var sw = el('i', 'bxsw'); sw.style.background = pc[k] || '#7A858D'; b.appendChild(sw); b.appendChild(el('span', 'bxlb', k)); b.appendChild(el('span', 'bxct', n0(ph[k]))); li.appendChild(b); pu.appendChild(li); });
    $('bxFase').hidden = !ph['Existente'];
  }
  function buildQuality(m) {
    var st = H.st, box = clear($('bxCal'));
    function bar(l, p) {
      var d = el('div'); d.appendChild(el('span', null, l)); var i = el('i'), b = el('b'); b.style.setProperty('--w', Math.max(0, Math.min(100, p)) + '%'); i.appendChild(b); d.appendChild(i);
      d.appendChild(el('span', null, nf(p, p === 100 || p === 0 ? 0 : 1) + ' %')); box.appendChild(d);
    }
    bar('Con nivel', st.pLvl); bar('Con tipo definido', st.pType); bar('Con material nombrado', st.pMat); bar('Con fase de obra', st.pPhase); bar('Con cantidades', st.pQty);
    var d = el('div', 'bxavg'); d.appendChild(el('span', null, 'Propiedades por elemento')); d.appendChild(el('b', null, nf(st.props, 1))); d.appendChild(el('small', null, 'máximo ' + n0(st.propsMax))); box.appendChild(d);
    var note = 'Medido sobre los ' + n0(st.n) + ' elementos del IFC, tal como salió de Revit. «Cantidades» cuenta los elementos con volumen, área o longitud.';
    if (st.props < 10) note += ' Esta exportación (' + m.schema + ') trae pocas propiedades por elemento; sirve como modelo de diseño, no como modelo de información.';
    $('bxCalN').textContent = note;
    var cb = clear($('bxCmp')), sb = shownBy(), mx = 0; H.sys.forEach(function (k) { if (sb[k] > mx) mx = sb[k]; });
    H.sys.forEach(function (k) {
      if (!sb[k]) return; var d2 = el('div'); d2.appendChild(el('span', null, SYS[k].l)); var i = el('i'), b = el('b'); b.style.setProperty('--w', (sb[k] / mx * 100) + '%'); b.style.background = SYS[k].c; i.appendChild(b); d2.appendChild(i); d2.appendChild(el('span', null, n0(sb[k]))); cb.appendChild(d2);
    });
  }
  function buildMet() {
    metBuilt = true; var T = clear($('bxMet')), tot = 0;
    var th = el('thead'), tr = el('tr'); ['Tipo', 'Cant.', 'm³', 'm²', 'ml'].forEach(function (h, i) { tr.appendChild(el('th', i ? 'n' : null, h)); }); th.appendChild(tr); T.appendChild(th);
    var tb = el('tbody'); T.appendChild(tb);
    var cell = function (v, d) { return v > 0 ? nf(v, d) : '·'; };
    H.sys.forEach(function (k, si) {
      if (k === 'ter') return;
      var rows = H.sched.filter(function (r) { return r[0] === si; }); if (!rows.length) return;
      var sw = el('tr', 'bxgh'), td = el('td'); td.colSpan = 5; td.appendChild(el('i', 'bxsw')).style.background = SYS[k].c; td.appendChild(el('span', null, SYS[k].l)); td.appendChild(el('small', null, n0(rows.reduce(function (a, r) { return a + r[2]; }, 0)) + ' elementos')); sw.appendChild(td); tb.appendChild(sw);
      rows.forEach(function (r, i) { tot += r[2]; });
      rows.slice(0, 10).forEach(function (r) {
        var t = el('tr'); t.appendChild(el('td', 'bxtt', H.strs[r[1]])); t.appendChild(el('td', 'n', n0(r[2]))); t.appendChild(el('td', 'n', cell(r[3], 2))); t.appendChild(el('td', 'n', cell(r[4], 1))); t.appendChild(el('td', 'n', cell(r[5], 1))); tb.appendChild(t);
      });
      if (rows.length > 10) { var more = el('tr', 'bxmore'), c = el('td'); c.colSpan = 5; c.textContent = '+ ' + (rows.length - 10) + ' tipos más, con ' + n0(rows.slice(10).reduce(function (a, r) { return a + r[2]; }, 0)) + ' elementos'; more.appendChild(c); tb.appendChild(more); }
    });
    $('bxMetN').textContent = 'Cuadro de metrados que sale del propio modelo: cantidad, volumen, área y longitud por tipo, agrupados por sistema. Cantidades tal como salen de Revit en el IFC; «·» indica que el tipo no trae esa medida. Total: ' + n0(tot) + ' elementos (terreno aparte).';
  }

  /* ---------- carga de un modelo ---------- */
  var loader = $('bxload');
  function open(slug, opt) {
    var m = by[slug]; if (!m || !V) return Promise.resolve();
    opt = opt || {};
    if (cur === slug && V.ready()) { if (opt.scroll) $('visor').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); return Promise.resolve(); }
    cur = slug; metBuilt = false;
    document.querySelectorAll('.bxc').forEach(function (c) { c.setAttribute('aria-pressed', c.dataset.slug === slug); });
    $('bxK').textContent = KIND[m.g]; $('bxT').textContent = m.title + (m.g === 'inf' ? ' · ' + m.proj : ''); $('bxL').textContent = m.lede;
    $('bxCred').textContent = m.credit; $('bxCred').hidden = !m.credit;
    loader.textContent = 'Cargando ' + m.title; loader.classList.remove('off');
    V.select(null);
    if (opt.scroll) $('visor').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    return V.load('models/m-' + slug + '.bim', { b64: b64 }).then(function (h) {
      if (!h || cur !== slug) return;
      H = h; fillModel(m); buildQuality(m); clear($('bxMet')); $('bxMetN').textContent = '';
      var mode = 'sis'; V.setMode(mode); setModeBtn(mode); $('bxEx').value = 0; setExK('lvl');
      V.sec.enable(false); syncSec(V.sec.state()); setTab('mod'); showSel(null);
      $('bxR').setAttribute('aria-pressed', V.isAuto());
      loader.classList.add('off');
    }).catch(function (e) { console.error(e); loader.textContent = 'No se pudo cargar el modelo 3D'; loader.classList.remove('off'); });
  }
  function setModeBtn(m) {
    document.querySelectorAll('#bxModes .bxb').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.m === m); });
    $('bxMatW').hidden = m !== 'mat'; $('bxPhW').hidden = m !== 'fase';
  }
  var exK = 'lvl';
  function setExK(k) { exK = k; document.querySelectorAll('.bxex-k .bxb').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.k === k); }); }

  /* ---------- arranque ---------- */
  V = createBimViewer({
    stage: stage, canvas: $('bxc'), reduce: reduce, keepBuffer: !!o.keepBuffer,
    onInteract: function () { $('bxR').setAttribute('aria-pressed', 'false'); },
    onSelect: showSel, onSection: syncSec, onExplodeReset: function () { $('bxEx').value = 0; }
  });
  document.querySelectorAll('#bxModes .bxb').forEach(function (b) { b.addEventListener('click', function () { V.setMode(b.dataset.m); setModeBtn(b.dataset.m); }); });
  document.querySelectorAll('.bxex-k .bxb').forEach(function (b) { b.addEventListener('click', function () { setExK(b.dataset.k); V.explode(exK, (+$('bxEx').value) / 100); }); });
  $('bxEx').addEventListener('input', function () { V.explode(exK, (+this.value) / 100); });
  $('bxR').addEventListener('click', function () { var on = !V.isAuto(); V.auto(on); $('bxR').setAttribute('aria-pressed', on); });
  $('bxX').addEventListener('click', function () { V.reset(); });
  wireSec();
  document.querySelectorAll('.bxc').forEach(function (c) { c.addEventListener('click', function () { open(c.dataset.slug, { scroll: true }); }); });
  return { open: open, V: V, setMode: function (m) { V.setMode(m); setModeBtn(m); } };
}
