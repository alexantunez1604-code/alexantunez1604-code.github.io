import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { unzlibSync } from 'fflate';

/* Visor de modelos BIM exportados de Revit (IFC → formato .bim propio, ver tools/bim).
   - La geometría llega en celdas (sistema × nivel), cuantizada y comprimida; cada elemento conserva su rango de triángulos.
   - Cada elemento se enlaza con su fila de datos: clic → ficha con familia, tipo, nivel, material, fase y cantidades.
   - Vistas por sistema, material, nivel y fase; despiece por nivel o por sistema; section box con cara de corte rayada. */

export const SYS = {
  est: { l: 'Estructura', c: '#E3A74B', n: '#D4D8DB' },
  lsa: { l: 'Losas y pisos', c: '#8E9AA3', n: '#9AA3A9' },
  mur: { l: 'Muros', c: '#DDE1E3', n: '#E8EAEC' },
  cub: { l: 'Cubierta y techos', c: '#6F95B3', n: '#B3BABF' },
  car: { l: 'Carpintería y vidrio', c: '#8FCBE0', n: '#BCC8CF', glass: true },
  cir: { l: 'Escaleras y barandas', c: '#C58BB3', n: '#BEC4C8' },
  uni: { l: 'Uniones y anclajes', c: '#43BFA6', n: '#B2B9BE' },
  equ: { l: 'Equipamiento', c: '#C9C257', n: '#8F989E' },
  ter: { l: 'Terreno', c: '#4B585F', n: '#4B585F' },
  otr: { l: 'Otros', c: '#7A858D', n: '#99A2A8' }
};
export const MG = {
  con: { l: 'Concreto', c: '#9CA7AE' }, alb: { l: 'Albañilería', c: '#C8714F' }, mad: { l: 'Madera', c: '#D2A66A' },
  ace: { l: 'Acero y metal', c: '#6E9BD1' }, vid: { l: 'Vidrio', c: '#8FCBE0' }, aca: { l: 'Acabados', c: '#E3E1D8' },
  otr: { l: 'Otros materiales', c: '#7A858D' }, sin: { l: 'Sin material', c: '#4B555C' }
};
const PH = { 'Nueva construcción': '#DDE1E3', 'Existente': '#E3A74B', 'Sin fase': '#4B555C' };
export function lvlColor(i, n) {
  var a = new THREE.Color('#4C7FB8'), b = new THREE.Color('#F2D277');
  return '#' + a.lerp(b, n > 1 ? i / (n - 1) : .5).getHexString();
}
var ORDER = { ter: -1, est: 0, lsa: 1, mur: 2, car: 3, cub: 4, cir: 5, uni: 6, equ: 7, otr: 7 };
export var F = { tag: 0, cls: 1, ft: 2, lvl: 3, mat: 4, mg: 5, phase: 6, fun: 7, sys: 8, vol: 9, area: 10, len: 11, cod: 12, p0: 13, pn: 14, shown: 15, np: 16 };

function decode(u8) {
  var raw = unzlibSync(u8), dv = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
  if (String.fromCharCode(raw[0], raw[1], raw[2], raw[3]) !== 'BIM1') throw new Error('formato desconocido');
  var jl = dv.getUint32(4, true), lp = dv.getUint32(8, true);
  var head = JSON.parse(new TextDecoder().decode(raw.subarray(16, 16 + jl)));
  return { head: head, P: raw.subarray(16 + jl, 16 + jl + lp), I: raw.subarray(16 + jl + lp) };
}
function cellData(head, c, P, I) {
  var nv = c.nv, nt = c.nt, pb = P.subarray(c.op, c.op + c.lp), pos = new Float32Array(nv * 3), o = head.o, sc = head.sc;
  for (var a = 0; a < 3; a++) {
    var q = 0, lo = a * nv, hi = 3 * nv + a * nv;
    for (var i = 0; i < nv; i++) { q = (q + (pb[lo + i] | (pb[hi + i] << 8))) & 0xffff; pos[i * 3 + a] = o[a] + q * sc; }
  }
  var ib = I.subarray(c.oi, c.oi + c.li), n = nt * 3, idx = nv < 65536 ? new Uint16Array(n) : new Uint32Array(n), v = 0;
  for (var j = 0; j < n; j++) { v = (v + ((ib[j] | (ib[n + j] << 8) | (ib[2 * n + j] << 16) | (ib[3 * n + j] << 24)) | 0)) | 0; idx[j] = v; }
  /* rango de vértices de cada elemento: [ei, tri0, ntri, v0, v1] */
  var rg = new Int32Array(c.r.length * 5);
  for (var k = 0; k < c.r.length; k++) {
    var r = c.r[k], mn = 1e9, mx = -1;
    for (var t = r[1] * 3, e = (r[1] + r[2]) * 3; t < e; t++) { var x = idx[t]; if (x < mn) mn = x; if (x > mx) mx = x; }
    rg[k * 5] = r[0]; rg[k * 5 + 1] = r[1]; rg[k * 5 + 2] = r[2]; rg[k * 5 + 3] = mn; rg[k * 5 + 4] = mx;
  }
  return { pos: pos, idx: idx, rg: rg };
}

export function createBimViewer(opts) {
  var stage = opts.stage, canvas = opts.canvas, reduce = !!opts.reduce;
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.keepBuffer });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.type = THREE.PCFShadowMap; renderer.localClippingEnabled = true;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 2000);
  var controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = .08; controls.maxPolarAngle = Math.PI * 0.495; controls.screenSpacePanning = false;
  controls.autoRotate = !reduce; controls.autoRotateSpeed = .7;
  canvas.style.touchAction = ''; /* lo decide el CSS: en celular un dedo desplaza la página; «Giro libre» y el corte lo reservan para el modelo */
  scene.add(new THREE.HemisphereLight(0xe1e5e8, 0x1f2428, 1.1));
  var sun = new THREE.DirectionalLight(0xffffff, 2.0); sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = .03;
  scene.add(sun); scene.add(sun.target);

  /* planos de corte compartidos */
  var planes = []; for (var pi = 0; pi < 6; pi++) planes.push(new THREE.Plane(new THREE.Vector3(1, 0, 0), 1e4));
  var capU = { uCap: { value: 0 }, uPx: { value: renderer.getPixelRatio() } };
  function cap(m) {
    m.onBeforeCompile = function (sh) {
      sh.uniforms.uCap = capU.uCap; sh.uniforms.uPx = capU.uPx;
      sh.fragmentShader = 'uniform float uCap;uniform float uPx;\n' + sh.fragmentShader.replace('#include <dithering_fragment>',
        '#include <dithering_fragment>\n if(uCap>.5&&!gl_FrontFacing){float d=(gl_FragCoord.x+gl_FragCoord.y)/uPx;float h=1.-smoothstep(.5,1.3,mod(d,6.));gl_FragColor=vec4(mix(vec3(.075,.13,.15),vec3(.56,.78,.76),h*.7),1.);}');
    };
    m.customProgramCacheKey = function () { return 'cap2'; };
    return m;
  }
  function clip(m) { m.clippingPlanes = planes; m.clipShadows = true; return m; }
  var MATS = clip(cap(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9, metalness: 0, flatShading: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 })));
  var MATG = clip(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .12, metalness: 0, flatShading: true, transparent: true, opacity: .42, depthWrite: false, side: THREE.DoubleSide }));
  var EDM = clip(new THREE.LineBasicMaterial({ color: 0x14181c, transparent: true, opacity: .5 }));
  var HLM = clip(new THREE.MeshBasicMaterial({ color: 0xc8402f, transparent: true, opacity: .62, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  var HLL = clip(new THREE.LineBasicMaterial({ color: 0xff9a86, transparent: true, opacity: 1, depthTest: false }));

  var H = null, cells = [], root = new THREE.Group(), shadowPlane = null, groundMesh = null, vx = 0, vz = 0; scene.add(root);
  var mode = 'nat', visSys = {}, visLvl = {}, need = true, visible = true, drag = false, ready = false, home = {}, anim = null;
  var bbox = new THREE.Box3(), size = new THREE.Vector3(), ctr = new THREE.Vector3(), expl = { kind: 'lvl', t: 0 };
  var selFx = [], loadId = 0;

  function resize() {
    var w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); need = true; if (ready) fit(true);
  }
  function fit(keep) {
    var a = Math.max(.5, camera.aspect), k = (1.04) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * Math.max(1, .95 / Math.min(1, a));
    var dAll = size.length() * .5 * k, d = (H && H.fc ? H.fc[2] : size.length() * .5) * k;   /* fc: la edificación, cuando el terreno es mucho más grande */
    home.d = d; var az = .62, el = .46;
    home.pos = new THREE.Vector3(vx + d * Math.sin(az) * Math.cos(el), ctr.y + d * Math.sin(el) * 1.0, vz + d * Math.cos(az) * Math.cos(el));
    home.tgt = new THREE.Vector3(vx, ctr.y, vz); home.tgt.y -= size.y * .06;
    controls.minDistance = d * .18; controls.maxDistance = Math.max(d * 2.6, dAll * 1.3);
    if (!keep) { camera.position.copy(home.pos); controls.target.copy(home.tgt); controls.update(); }
  }
  function reset() { fly(home.pos, home.tgt, 700); }
  function fly(pos, tgt, ms) {
    if (reduce || !ms) { camera.position.copy(pos); controls.target.copy(tgt); controls.update(); need = true; anim = null; return; }
    anim = { t0: performance.now(), ms: ms, p0: camera.position.clone(), p1: pos.clone(), g0: controls.target.clone(), g1: tgt.clone() }; need = true;
  }
  function stepAnim(now) {
    if (!anim) return false;
    var k = Math.min(1, (now - anim.t0) / anim.ms); k = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    camera.position.lerpVectors(anim.p0, anim.p1, k); controls.target.lerpVectors(anim.g0, anim.g1, k); controls.update();
    if (k >= 1) anim = null; return true;
  }

  /* ---------------- color por vista ---------------- */
  var _c = new THREE.Color();
  function colorOf(ei, c) {
    var e = H.el[ei], hex;
    if (mode === 'sis') hex = SYS[H.sys[e[F.sys]]].c;
    else if (mode === 'mat') hex = MG[H.mg[e[F.mg]]].c;
    else if (mode === 'niv') hex = e[F.lvl] === H.lv.length - 1 ? '#6A757D' : lvlColor(e[F.lvl], H.lv.length - 1);
    else if (mode === 'fase') hex = PH[e[F.phase] >= 0 ? H.strs[e[F.phase]] : 'Sin fase'] || PH['Sin fase'];
    else hex = SYS[H.sys[e[F.sys]]].n;
    return _c.set(hex);
  }
  function paint() {
    if (!H) return;
    cells.forEach(function (c) {
      var col = c.geom.attributes.color.array, rg = c.rg;
      for (var k = 0; k < rg.length; k += 5) {
        var cc = colorOf(rg[k]), r = cc.r, g = cc.g, b = cc.b;
        for (var v = rg[k + 3]; v <= rg[k + 4]; v++) { col[v * 3] = r; col[v * 3 + 1] = g; col[v * 3 + 2] = b; }
      }
      c.geom.attributes.color.needsUpdate = true;
    });
    EDM.opacity = mode === 'nat' ? .5 : .38; need = true;
  }

  /* ---------------- carga ---------------- */
  function clearModel() {
    clearFx();
    cells.forEach(function (c) { c.mesh.removeFromParent(); c.geom.dispose(); if (c.edges) c.edges.geometry.dispose(); });
    cells = []; if (groundMesh) { groundMesh.removeFromParent(); groundMesh.geometry.dispose(); groundMesh = null; }
    if (shadowPlane) { shadowPlane.removeFromParent(); shadowPlane.geometry.dispose(); shadowPlane = null; }
    H = null; ready = false;
  }
  function load(url, o) {
    o = o || {}; var my = ++loadId;
    return (o.b64 ? fetch(url + '.txt').then(function (r) { if (!r.ok) throw new Error('modelo no disponible'); return r.text(); }).then(function (t) {
      var bin = atob(t.trim()), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u;
    }) : fetch(url).then(function (r) { if (!r.ok) throw new Error('modelo no disponible'); return r.arrayBuffer(); }).then(function (b) { return new Uint8Array(b); }))
      .then(function (u8) {
        if (my !== loadId) return null;
        clearModel();
        var d = decode(u8); H = d.head; var tris = 0;
        H.cells.forEach(function (c) {
          var cd = cellData(H, c, d.P, d.I), g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.BufferAttribute(cd.pos, 3));
          g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(cd.pos.length), 3));
          g.setIndex(new THREE.BufferAttribute(cd.idx, 1));
          var key = H.sys[c.s], m = new THREE.Mesh(g, SYS[key].glass ? MATG : MATS);
          m.castShadow = !SYS[key].glass; m.receiveShadow = !SYS[key].glass; if (SYS[key].glass) m.renderOrder = 2;
          root.add(m); tris += c.nt;
          cells.push({ mesh: m, geom: g, rg: cd.rg, s: c.s, l: c.l, key: key, nt: c.nt, idx: cd.idx, edges: null });
          m.userData.ci = cells.length - 1;
        });
        visSys = {}; visLvl = {}; H.sys.forEach(function (k) { visSys[k] = true; }); H.lv.forEach(function (_, i) { visLvl[i] = true; });
        bbox.min.set(H.bb[0][0], H.bb[0][1], H.bb[0][2]); bbox.max.set(H.bb[1][0], H.bb[1][1], H.bb[1][2]);
        bbox.getSize(size); bbox.getCenter(ctr); vx = H.fc ? H.fc[0] : ctr.x; vz = H.fc ? H.fc[1] : ctr.z;
        if (!cells.some(function (c) { return c.key === 'ter'; })) {   /* el IFC no trae terreno: base neutra de apoyo, para que siempre haya suelo */
          groundMesh = new THREE.Mesh(new THREE.PlaneGeometry(size.x + 12, size.z + 12), clip(new THREE.MeshStandardMaterial({ color: 0x4b585f, roughness: .95, metalness: 0, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 })));
          groundMesh.rotation.x = -Math.PI / 2; groundMesh.position.set(ctr.x, bbox.min.y - .03, ctr.z); groundMesh.receiveShadow = true; groundMesh.raycast = function () { }; root.add(groundMesh);
        }
        var shadows = tris < 170000; renderer.shadowMap.enabled = shadows; sun.castShadow = shadows;
        MATS.needsUpdate = true; MATG.needsUpdate = true;
        if (shadows) {
          shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(size.x * 3, size.z * 3), new THREE.ShadowMaterial({ opacity: .32 }));
          shadowPlane.rotation.x = -Math.PI / 2; shadowPlane.position.set(ctr.x, bbox.min.y - .02, ctr.z); shadowPlane.receiveShadow = true; scene.add(shadowPlane);
        }
        var R = Math.max(size.x, size.z, size.y);
        sun.position.set(ctr.x - R * .5, bbox.max.y + R * .9, ctr.z + R * .6); sun.target.position.copy(ctr);
        var s = R * .75; sun.shadow.camera.left = -s; sun.shadow.camera.right = s; sun.shadow.camera.top = s; sun.shadow.camera.bottom = -s; sun.shadow.camera.near = .5; sun.shadow.camera.far = R * 4; sun.shadow.camera.updateProjectionMatrix();
        mode = 'nat'; expl.t = 0; paint(); applyVis(); sec.on = false; ov.visible = false; capU.uCap.value = 0; setPlanes();
        fit(); buildSection(); ready = true; need = true; controls.autoRotate = !reduce;
        queueEdges(tris);
        return H;
      });
  }

  /* aristas: se calculan por celda y por turnos, para pintar el modelo antes */
  function queueEdges(tris) {
    var my = loadId, list = cells.slice(), light = tris > 230000;
    (function next() {
      if (my !== loadId || !list.length) return;
      var c = list.shift();
      if (light && (c.key === 'car' || c.key === 'uni' || c.key === 'equ' || c.key === 'ter')) { setTimeout(next, 0); return; }
      var eg = new THREE.EdgesGeometry(c.geom, 32), e = new THREE.LineSegments(eg, EDM);
      e.raycast = function () { }; c.mesh.add(e); c.edges = e; need = true;
      setTimeout(next, 16);
    })();
  }

  /* ---------------- visibilidad, despiece ---------------- */
  function applyVis() {
    cells.forEach(function (c) { c.mesh.visible = c.key === 'ter' || (!!visSys[c.key] && !!visLvl[c.l]); }); need = true;   /* el terreno siempre se muestra */
  }
  function setSys(k, on) { if (k === 'ter') return; visSys[k] = !!on; applyVis(); }
  function setLevel(i, on) { visLvl[i] = !!on; applyVis(); }
  function onlyLevel(i) { Object.keys(visLvl).forEach(function (k) { visLvl[k] = (i == null) || (+k === i); }); applyVis(); }
  function explode(kind, t) {
    expl.kind = kind; expl.t = t;
    var nl = H ? H.lv.length : 1, spread = size.y * 1.0;
    cells.forEach(function (c) {
      var rank = kind === 'sys' ? (ORDER[c.key] || 0) : (c.l === nl - 1 ? 0 : c.l);
      var ranks = kind === 'sys' ? 8 : Math.max(2, nl - 1);
      c.mesh.position.y = t * spread / ranks * rank * (kind === 'sys' ? .9 : 1.2);
      c.mesh.updateMatrix();
    });
    if (t > 0 && sec.on) secEnable(false);
    need = true;
  }

  /* ======================= SECTION BOX ======================= */
  var sec = { on: false, lo: new THREE.Vector3(), hi: new THREE.Vector3(), min: new THREE.Vector3(), max: new THREE.Vector3() };
  var ov = new THREE.Group(); ov.visible = false; scene.add(ov);
  var boxLines = null, handles = [], hover = null, dragH = null;
  var AX = ['x', 'y', 'z'], GAP = .03, HC = { idle: 0xe9edef, hover: 0xe9806e, drag: 0xc8402f };
  function buildSection() {
    ov.children.slice().forEach(function (o) { ov.remove(o); }); handles = []; boxLines = null;
    var pad = .04; sec.lo.copy(bbox.min).addScalar(-pad); sec.hi.copy(bbox.max).addScalar(pad); sec.min.copy(sec.lo); sec.max.copy(sec.hi);
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(24 * 3), 3));
    boxLines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xe9806e, transparent: true, opacity: .85, depthTest: false }));
    boxLines.renderOrder = 20; boxLines.frustumCulled = false; boxLines.raycast = function () { }; ov.add(boxLines);
    var cone = new THREE.ConeGeometry(.5, 1.3, 18);
    for (var a = 0; a < 3; a++) for (var s = -1; s <= 1; s += 2) {
      var h = new THREE.Group();
      var m = new THREE.Mesh(cone, new THREE.MeshBasicMaterial({ color: HC.idle, depthTest: false, transparent: true, opacity: .95 })); m.renderOrder = 21;
      var ring = new THREE.Mesh(new THREE.TorusGeometry(.78, .07, 8, 28), new THREE.MeshBasicMaterial({ color: HC.idle, depthTest: false, transparent: true, opacity: .7 })); ring.renderOrder = 21;
      var hit = new THREE.Mesh(new THREE.SphereGeometry(1.9, 10, 8), new THREE.MeshBasicMaterial({ visible: false }));
      h.add(m); h.add(ring); h.add(hit); h.userData = { axis: a, sign: s, cone: m, ring: ring, hit: hit }; ov.add(h); handles.push(h);
    }
    syncSection(true);
  }
  function setPlanes() {
    var on = sec.on;
    for (var a = 0; a < 3; a++) {
      var n1 = new THREE.Vector3(), n2 = new THREE.Vector3(); n1.setComponent(a, 1); n2.setComponent(a, -1);
      planes[a * 2].set(n1, on ? -sec.min.getComponent(a) : 1e4); planes[a * 2 + 1].set(n2, on ? sec.max.getComponent(a) : 1e4);
    }
    capU.uCap.value = on ? 1 : 0;
  }
  function syncSection(silent) {
    setPlanes(); var mn = sec.min, mx = sec.max;
    if (boxLines) {
      var p = boxLines.geometry.attributes.position, c = [[mn.x, mn.y, mn.z], [mx.x, mn.y, mn.z], [mx.x, mn.y, mx.z], [mn.x, mn.y, mx.z], [mn.x, mx.y, mn.z], [mx.x, mx.y, mn.z], [mx.x, mx.y, mx.z], [mn.x, mx.y, mx.z]];
      var E = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7], i = 0;
      E.forEach(function (k) { p.setXYZ(i++, c[k][0], c[k][1], c[k][2]); }); p.needsUpdate = true;
    }
    var cx = (mn.x + mx.x) / 2, cy = (mn.y + mx.y) / 2, cz = (mn.z + mx.z) / 2;
    handles.forEach(function (h) {
      var u = h.userData, v = new THREE.Vector3(cx, cy, cz); v.setComponent(u.axis, u.sign < 0 ? mn.getComponent(u.axis) : mx.getComponent(u.axis));
      u.base = v; var d = new THREE.Vector3(); d.setComponent(u.axis, u.sign); u.dir = d;
      u.cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); u.ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d);
    });
    scaleHandles(); need = true; if (!silent && opts.onSection) opts.onSection(secState());
  }
  function scaleHandles() {
    handles.forEach(function (h) {
      var u = h.userData; if (!u.base) return;
      var dist = camera.position.distanceTo(u.base), k = dist * .0185;
      h.scale.setScalar(k); h.position.copy(u.base).addScaledVector(u.dir, k * .85);
      u.cone.position.set(0, 0, 0); u.ring.position.copy(u.dir).multiplyScalar(-.75);
    });
    declutter();
  }
  /* evita asas encimadas: oculta las de un eje paralelo a la mirada (vista en planta o en corte) y, si dos caen a menos de ~7.5 % del alto del visor, la más lejana */
  function declutter() {
    var cw = canvas.clientWidth || 1, ch = canvas.clientHeight || 1, cam = camera.position, pts = [];
    handles.forEach(function (h) {
      var u = h.userData; if (!u.base) return; h.visible = true;
      var toCam = new THREE.Vector3().subVectors(cam, u.base).normalize();
      if (Math.abs(u.dir.dot(toCam)) > .93) { h.visible = false; return; }
      var p = h.position.clone().project(camera);
      pts.push({ h: h, x: (p.x * .5 + .5) * cw, y: (-p.y * .5 + .5) * ch, d: cam.distanceTo(h.position) });
    });
    var min = ch * .075;
    for (var i = 0; i < pts.length; i++) for (var j = i + 1; j < pts.length; j++) {
      var a = pts[i], b = pts[j]; if (!a.h.visible || !b.h.visible) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) < min) (a.d > b.d ? a : b).h.visible = false;
    }
  }
  function secState() {
    var f = {}, m = {}, sz = {};
    AX.forEach(function (a, i) {
      var lo = sec.lo.getComponent(i), hi = sec.hi.getComponent(i), span = hi - lo;
      f[a] = [(sec.min.getComponent(i) - lo) / span, (sec.max.getComponent(i) - lo) / span]; m[a] = [sec.min.getComponent(i) - lo, sec.max.getComponent(i) - lo]; sz[a] = span;
    });
    return { on: sec.on, f: f, m: m, span: sz, off: sec.lo.y };
  }
  function secEnable(on) {
    sec.on = !!on; ov.visible = sec.on;
    if (sec.on) { controls.autoRotate = false; if (expl.t > 0) { explode(expl.kind, 0); if (opts.onExplodeReset) opts.onExplodeReset(); } if (opts.onInteract) opts.onInteract(); }
    if (!sec.on && hover) { tint(hover, HC.idle); hover = null; canvas.style.cursor = ''; }
    syncSection();
  }
  function secSet(axis, which, frac, silent) {
    var i = AX.indexOf(axis); if (i < 0) return;
    var lo = sec.lo.getComponent(i), hi = sec.hi.getComponent(i), span = hi - lo, v = lo + THREE.MathUtils.clamp(frac, 0, 1) * span;
    if (which === 'lo') sec.min.setComponent(i, Math.min(v, sec.max.getComponent(i) - GAP * span)); else sec.max.setComponent(i, Math.max(v, sec.min.getComponent(i) + GAP * span));
    if (!sec.on) secEnable(true); else syncSection(silent);
  }
  function secSetAll(f) {
    AX.forEach(function (a, i) { var lo = sec.lo.getComponent(i), span = sec.hi.getComponent(i) - lo; sec.min.setComponent(i, lo + f[a][0] * span); sec.max.setComponent(i, lo + f[a][1] * span); });
    if (!sec.on) secEnable(true); else syncSection();
  }
  function secReset() { secSetAll({ x: [0, 1], y: [0, 1], z: [0, 1] }); }
  var V3 = function (x, y, z) { return new THREE.Vector3(x, y, z); };
  function preset(name) {
    var longX = size.x >= size.z, d = home.d * 1.05, y0 = 0;
    if (H && H.base != null) {   /* el corte en planta va 1.3 m sobre el primer nivel con contenido, no sobre la cimentación */
      var cl = H.lv.filter(function (l) { return l.z != null && l.c > 0; }), mx = Math.max.apply(null, cl.map(function (l) { return l.c; }));
      var l0 = cl.filter(function (l) { return l.c >= .25 * mx; })[0]; if (l0) y0 = Math.max(0, l0.z - H.base);
    }
    var y1 = Math.min(1, (y0 + 1.3 - sec.lo.y) / (sec.hi.y - sec.lo.y));
    if (name === 'full') { secReset(); fly(home.pos, home.tgt, 800); return; }
    if (name === 'planta') { secSetAll({ x: [0, 1], y: [0, y1], z: [0, 1] }); fly(V3(vx, bbox.min.y + d * .98, vz + d * .1), V3(vx, bbox.min.y + .4, vz), 900); return; }
    var lon = longX ? { x: [0, 1], y: [0, 1], z: [0, .5] } : { x: [0, .5], y: [0, 1], z: [0, 1] };
    var tra = longX ? { x: [0, .5], y: [0, 1], z: [0, 1] } : { x: [0, 1], y: [0, 1], z: [0, .5] };
    var tg = V3(vx, ctr.y, vz), dl = d * .92, dt = d * .7;
    if (name === 'long') { secSetAll(lon); fly(longX ? V3(tg.x + dl * .1, tg.y + dl * .3, tg.z + dl) : V3(tg.x + dl, tg.y + dl * .3, tg.z + dl * .1), tg, 900); return; }
    if (name === 'trans') { secSetAll(tra); fly(longX ? V3(tg.x + dt, tg.y + dt * .3, tg.z + dt * .1) : V3(tg.x + dt * .1, tg.y + dt * .3, tg.z + dt), tg, 900); }
  }

  /* ---------------- puntero ---------------- */
  var ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), down = null;
  function setRay(e) { var r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera); }
  function hitHandle(e) {
    if (!sec.on || !handles.length) return null; setRay(e);
    var hs = ray.intersectObjects(handles.filter(function (h) { return h.visible; }).map(function (h) { return h.userData.hit; }), false); return hs.length ? hs[0].object.parent : null;
  }
  function tint(h, c) { h.userData.cone.material.color.setHex(c); h.userData.ring.material.color.setHex(c); need = true; }
  function axisT(h) {
    var u = h.userData, P = u.base, dv = u.dir, ro = ray.ray.origin, rd = ray.ray.direction;
    var w = new THREE.Vector3().subVectors(P, ro), b = dv.dot(rd), d = dv.dot(w), e = rd.dot(w), den = 1 - b * b;
    if (Math.abs(den) < 1e-4) return null; return (b * e - d) / den;
  }
  canvas.addEventListener('pointerdown', function (e) {
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
    var h = hitHandle(e); if (!h) return; var t = axisT(h); if (t == null) return;
    e.stopImmediatePropagation(); e.preventDefault();
    dragH = { h: h, t0: t, v0: h.userData.sign < 0 ? sec.min.getComponent(h.userData.axis) : sec.max.getComponent(h.userData.axis) };
    tint(h, HC.drag); try { canvas.setPointerCapture(e.pointerId); } catch (_) { }
    controls.autoRotate = false; anim = null; if (opts.onInteract) opts.onInteract();
  }, true);
  canvas.addEventListener('pointermove', function (e) {
    if (dragH) {
      setRay(e); var u = dragH.h.userData, t = axisT(dragH.h); if (t == null) return;
      var i = u.axis, lo = sec.lo.getComponent(i), hi = sec.hi.getComponent(i), span = hi - lo, v = dragH.v0 + (t - dragH.t0);
      if (u.sign < 0) sec.min.setComponent(i, THREE.MathUtils.clamp(v, lo, sec.max.getComponent(i) - GAP * span));
      else sec.max.setComponent(i, THREE.MathUtils.clamp(v, sec.min.getComponent(i) + GAP * span, hi));
      syncSection(); return;
    }
    if (!sec.on || e.buttons) return;
    var h = hitHandle(e); if (h !== hover) { if (hover) tint(hover, HC.idle); hover = h; if (h) tint(h, HC.hover); canvas.style.cursor = h ? 'grab' : ''; }
  });
  function endDrag(e) { if (dragH) { tint(dragH.h, HC.idle); dragH = null; canvas.style.cursor = ''; try { canvas.releasePointerCapture(e.pointerId); } catch (_) { } } }
  canvas.addEventListener('pointerup', function (e) {
    var was = !!dragH; endDrag(e); if (was || !down) return;
    var dx = e.clientX - down.x, dy = e.clientY - down.y; if (dx * dx + dy * dy > 25 || performance.now() - down.t > 700) return; pick(e);
  });
  canvas.addEventListener('pointercancel', endDrag);

  /* ---------------- selección ---------------- */
  function inBox(p) { if (!sec.on) return true; var e = .002; return p.x >= sec.min.x - e && p.x <= sec.max.x + e && p.y >= sec.min.y - e && p.y <= sec.max.y + e && p.z >= sec.min.z - e && p.z <= sec.max.z + e; }
  function clearFx() { selFx.forEach(function (o) { o.removeFromParent(); if (o.geometry && o.userData.own) o.geometry.dispose(); }); selFx = []; }
  function pick(e) {
    if (!ready) return; setRay(e);
    var list = cells.filter(function (c) { return c.mesh.visible; }).map(function (c) { return c.mesh; });
    var hits = ray.intersectObjects(list, false), hit = null;
    for (var i = 0; i < hits.length; i++) { if (inBox(hits[i].point)) { hit = hits[i]; break; } }
    if (!hit) { select(-1); return; }
    var c = cells[hit.object.userData.ci], rg = c.rg, lo = 0, hi = rg.length / 5 - 1, f = hit.faceIndex;
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (rg[mid * 5 + 1] <= f) lo = mid; else hi = mid - 1; }
    select(rg[lo * 5], c, lo);
  }
  function select(ei, c, k) {
    clearFx();
    if (ei < 0 || !H) { need = true; if (opts.onSelect) opts.onSelect(null); return; }
    if (!c) { /* búsqueda por índice de elemento */
      for (var ci = 0; ci < cells.length && !c; ci++) { var rg0 = cells[ci].rg; for (var q = 0; q < rg0.length; q += 5) if (rg0[q] === ei) { c = cells[ci]; k = q / 5; break; } }
      if (!c) { if (opts.onSelect) opts.onSelect(null); return; }
    }
    var rg = c.rg, t0 = rg[k * 5 + 1], nt = rg[k * 5 + 2];
    var sg = new THREE.BufferGeometry(); sg.setAttribute('position', c.geom.attributes.position);
    sg.setIndex(new THREE.BufferAttribute(c.idx.subarray(t0 * 3, (t0 + nt) * 3), 1));
    var h = new THREE.Mesh(sg, HLM); h.raycast = function () { }; h.renderOrder = 3; c.mesh.add(h); selFx.push(h);
    var eg = new THREE.EdgesGeometry(sg, 20), l = new THREE.LineSegments(eg, HLL); l.raycast = function () { }; l.renderOrder = 22; l.userData.own = 1; c.mesh.add(l); selFx.push(l);
    sg.computeBoundingBox(); var bb = sg.boundingBox, sz = new THREE.Vector3(); bb.getSize(sz);
    need = true;
    if (opts.onSelect) opts.onSelect({ ei: ei, dim: { x: sz.x, y: sz.y, z: sz.z } });
  }

  function snapshot(w, hgt, bg, angle) {
    var pw = stage.clientWidth, ph = stage.clientHeight, pr = renderer.getPixelRatio();
    var keepPos = camera.position.clone(), keepTgt = controls.target.clone(), wasOv = ov.visible; ov.visible = false;
    renderer.setPixelRatio(1); capU.uPx.value = 1; renderer.setSize(w, hgt, false); camera.aspect = w / hgt; camera.updateProjectionMatrix(); fit(true);
    var a = angle || {}; var d = home.d * (a.d || .92), az = a.az != null ? a.az : .62, el = a.el != null ? a.el : .46;
    camera.position.set(home.tgt.x + d * Math.sin(az) * Math.cos(el), home.tgt.y + d * Math.sin(el), home.tgt.z + d * Math.cos(az) * Math.cos(el)); camera.lookAt(home.tgt);
    renderer.setClearColor(bg || 0x14181c, 1); renderer.render(scene, camera);
    var url = canvas.toDataURL('image/webp', .86);
    renderer.setClearColor(0x000000, 0); renderer.setPixelRatio(pr); capU.uPx.value = pr; renderer.setSize(pw, ph, false); ov.visible = wasOv;
    camera.aspect = pw / ph; camera.updateProjectionMatrix(); fit(true); camera.position.copy(keepPos); controls.target.copy(keepTgt); controls.update(); need = true;
    return url;
  }

  controls.addEventListener('start', function () { drag = true; controls.autoRotate = false; anim = null; if (opts.onInteract) opts.onInteract(); });
  controls.addEventListener('end', function () { drag = false; });
  controls.addEventListener('change', function () { need = true; if (sec.on) scaleHandles(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) need = true; }).observe(stage);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);
  resize();
  (function loop(now) {
    requestAnimationFrame(loop);
    if (!ready || !visible) return;
    var moving = controls.autoRotate || drag, an = stepAnim(now || performance.now());
    if (controls.update() || moving || need || an) { if (sec.on) scaleHandles(); renderer.render(scene, camera); need = false; }
  })();

  return {
    load: load, head: function () { return H; }, setMode: function (m) { mode = m; paint(); }, getMode: function () { return mode; },
    setSys: setSys, setLevel: setLevel, onlyLevel: onlyLevel, explode: explode, select: function (ei) { select(ei == null ? -1 : ei); },
    reset: reset, auto: function (on) { controls.autoRotate = on; need = true; }, isAuto: function () { return controls.autoRotate; },
    snapshot: snapshot, sec: { enable: secEnable, isOn: function () { return sec.on; }, set: secSet, state: secState, reset: secReset, preset: preset },
    ready: function () { return ready; }, edgesDone: function () { return cells.every(function (c) { return c.edges || c.key === 'car' || c.key === 'uni' || c.key === 'equ' || c.key === 'ter'; }); },
    _r: renderer, _cam: camera, _scene: scene, _cells: function () { return cells; }
  };
}
