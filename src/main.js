import './style.css';
import './v10.css';
import './v12.css';
import './v20.css';
import './v30.css';
import { initHero, initEtapas } from './portada.js';
import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/latin-600.css';
import '@fontsource/cormorant-garamond/latin-300-italic.css';
import '@fontsource/cormorant-garamond/latin-400-italic.css';
import '@fontsource/cormorant-garamond/latin-500-italic.css';
import '@fontsource/cormorant-garamond/latin-600-italic.css';
import '@fontsource/barlow-condensed/latin-500.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/hanken-grotesk/latin-400.css';
import '@fontsource/hanken-grotesk/latin-500.css';
import '@fontsource/hanken-grotesk/latin-600.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

(function(){
var $=function(i){return document.getElementById(i)};
var reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ---------- generador pseudoaleatorio con semilla (miniaturas) ---------- */
function rnd(seed){var s=seed;return function(){s=(s*16807)%2147483647;return(s-1)/2147483646}}

/* ---------- ventana 01: biblioteca de modelos BIM y visor 3D (src/bim.js) ---------- */
(function(){
  var started=false,api=null;
  function start(){
    if(started)return;started=true;
    var vis=$('visor');
    import('./bim.js').then(function(m){
      var dbg=!!import.meta.env.VITE_DEBUG&&/[?&]debug/.test(location.search);
      api=m.initBim({reduce:reduce,b64:!!(vis&&vis.dataset.b64),keepBuffer:dbg});
      if(dbg)window.__bim=api;
      return api.open('gocta-1b');
    }).catch(function(e){console.error(e);var l=$('bxload');if(l){l.textContent='No se pudo cargar el visor 3D';l.classList.remove('off')}});
  }
  window.__startViewer=start;
})();

/* ---------- trayectoria ---------- */
var Y0=2019,Y1=2027,SP=Y1-Y0;
var JOBS=[
 {n:'AOZ Arquitectos',r:'Asistente de proyectos',a:2019,b:2024,sub:'2019 a 2023, Lima',pts:['Modelado 3D, planimetría y expedientes arquitectónicos.','Presentaciones y documentación técnica.','Proyectos: FIL Lima 2019, Plaza Túpac Amaru (Cusco), Escuela de Teatro Puckllay, Las Gaviotas de Chorrillos.','Apoyo académico en cátedra universitaria (UNI y ESAN).']},
 {n:'SRT E.I.R.L.',r:'Asistente de proyectos',a:2022,b:2024,sub:'2022 a 2023, Lima',pts:['Modelado 3D y planimetría técnica.','Renderizado de fachadas y ambientes interiores.','Proyectos: Alpes 1, Alpes 2, Gumont, Mástil 2.']},
 {n:'BRAVEN E.I.R.L.',r:'Supervisor de calidad de acabados (QA/QC)',a:2023,b:2025,sub:'2023 a 2024, edificio multifamiliar Alpes 2, 11 pisos',pts:['Supervisión diaria de acabados arquitectónicos.','Control de puertas, ventanas, enchapes, pintura, luminarias y mueblería fija.','Registro y seguimiento de observaciones, con cuadrillas, contratistas y proveedores.','Alpes 2: 24 departamentos controlados y unas 25 actas de observaciones corregidas en dos semanas de trabajo.']},
 {n:'BERMEZ',r:'Coordinador de obra',a:2024,b:2026,sub:'2024 a 2025, Las Lagunas, La Molina',pts:['Coordinación en obra de 4 viviendas de dos pisos y azotea, cada una con piscina.','Coordinación de excavaciones, concreto, albañilería, tarrajeo, piscinas e instalaciones sanitarias y eléctricas.','Seguimiento de partidas en campo, con metrados para valorizaciones y control de avance.','Coordinación con contratistas para evitar incompatibilidades constructivas.','Modelado as-built en Revit de las cuatro viviendas: arquitectura, estructuras, sanitarias y eléctricas.']},
 {n:'Bienestudio Arquitectura',r:'Coordinador de proyectos y expedientes, freelance',a:2025,b:2026.08,sub:'2025 a enero de 2026, Lima',pts:['Coordinación integral de expedientes arquitectónicos orientados a construcción.','Levantamiento de incompatibilidades con especialistas y propuesta de soluciones constructivas.','Proyectos: Gocta Andes Lodge, Pumarrinri Amazon Lodge, Hotel Tucán Suites.','Formación de practicantes y reducción de retrabajos.']},
 {n:'Proyectos DMD',r:'Coordinador de obra',a:2026.08,b:2026.42,sub:'febrero a mayo de 2026, Lima',pts:['Tiendas 3A (Grupo AJE, La Victoria): coordinador adjunto del residente, con 20 operarios a cargo; tienda entregada en 11 días calendario.','Monte Alegre (Surco): 23 baños y 46 ambientes enchapados en 9 departamentos, unos 2,981 m² controlados con valorización semanal.']},
 {n:'Fractal Construcciones Generales',r:'Coordinador de proyecto',a:2026.42,b:2026.67,sub:'junio a agosto de 2026, Nueva Cámara de Senadores',pts:['Operación integral de drywall, acabados e instalaciones sanitarias en obra pública institucional.','12 informes técnicos de adicionales con evidencia fotográfica georreferenciada.','Diferencia de +68.1 % entre el metrado contractual y el modelado en BIM.']},
 {n:'SolBIM',r:'Servicios BIM, negocio propio',a:2026.78,b:2026.78,now:true,sub:'en proceso, recibiendo proyectos',pts:['Servicios de modelado y coordinación BIM, y contenido de Revit.']},
 {n:'Universidad Nacional de Ingeniería',r:'Bachiller en Arquitectura',a:2019,b:2024.67,edu:true,sub:'2019 a 2024, grado otorgado en agosto de 2024',pts:['Bachiller en Arquitectura por la UNI.','Titulación en proceso: proyecto arquitectónico sensible al paisaje en Tuquillo, Huarmey.']}
];
(function(){
  var yr=$('years');for(var y=Y0;y<Y1;y++){var s=document.createElement('span');s.textContent=y;yr.appendChild(s)}
  var tl=$('tl');
  function show(i){var j=JOBS[i];tl.querySelectorAll('.tl-row').forEach(function(b,k){b.setAttribute('aria-pressed',k===i?'true':'false')});
    var d=$('tlD');d.textContent='';var a=document.createElement('div'),h=document.createElement('h3');h.textContent=j.r;var p=document.createElement('p');p.className='small';p.style.marginTop='10px';p.textContent=j.n+', '+j.sub;a.appendChild(h);a.appendChild(p);
    var u=document.createElement('ul');j.pts.forEach(function(t){var li=document.createElement('li');li.textContent=t;u.appendChild(li)});d.appendChild(a);d.appendChild(u)}
  JOBS.forEach(function(j,i){
    var r=document.createElement('button');r.type='button';r.className='tl-row';r.setAttribute('aria-pressed','false');
    var nm=document.createElement('div');nm.className='nm';nm.textContent=j.n;var sm=document.createElement('small');sm.textContent=j.r;nm.appendChild(sm);
    var tr=document.createElement('div');tr.className='tl-track';var b=document.createElement('div');b.className='tl-b'+(j.edu?' edu':'')+(j.open?' open':'');
    if(j.now){b.className='tl-now';b.style.left=((j.a-Y0)/SP*100)+'%'}else{b.style.left=((j.a-Y0)/SP*100)+'%';b.style.width=((j.b-j.a)/SP*100)+'%'}tr.appendChild(b);r.appendChild(nm);r.appendChild(tr);
    r.addEventListener('click',function(){show(i)});tl.appendChild(r)});
  show(6);
})();

/* ---------- ocho ejes del criterio de diseño: se trazan y el punto viaja a su sitio ---------- */
(function(){
  var P=[['Sobrio','Expresivo',100],['Preciso','Intuitivo',9],['Técnico','Poético',51],['Silencioso','Manifiesto',92],['Luminoso','Sombrío',79],['Orden','Gesto',78],['Futuro','Tierra',13],['Colectivo','De autor',87]];
  var w=$('tens');if(!w)return;
  var rows=[],mk=[];
  P.forEach(function(x,k){var i=document.createElement('i'),b=document.createElement('b'),v=Math.max(4,Math.min(96,x[2]));b.dataset.v=v;b.style.left=v+'%';i.appendChild(b);
    var a=document.createElement('span');a.textContent=x[0];var c=document.createElement('span');c.textContent=x[1];
    var r=document.createElement('div');r.className='ten';r.style.setProperty('--k',k);r.appendChild(a);r.appendChild(i);r.appendChild(c);w.appendChild(r);rows.push(r);mk.push(b)});
  /* al pasar el cursor por un eje, el polo más cercano al punto se marca */
  rows.forEach(function(r,k){var near=P[k][2]>=50?2:0;
    function on(){rows.forEach(function(q){q.classList.remove('hv','pl','pr')});r.classList.add('hv',near?'pr':'pl')}
    r.addEventListener('pointerenter',on);r.addEventListener('focus',on);r.tabIndex=0;
    r.addEventListener('pointerleave',function(){r.classList.remove('hv','pl','pr')});r.addEventListener('blur',function(){r.classList.remove('hv','pl','pr')})});
  function settle(){w.classList.add('in');mk.forEach(function(b){b.style.left=b.dataset.v+'%'})}
  function play(){
    if(reduce){settle();return}
    w.classList.remove('in','go');mk.forEach(function(b){b.style.transition='none';b.style.left='50%'});void w.offsetWidth;
    w.classList.add('go');
    mk.forEach(function(b,k){b.style.transition='';b.style.transitionDelay=(.55+k*.11)+'s';b.style.left=b.dataset.v+'%'});
    setTimeout(function(){w.classList.add('in')},700+P.length*110);
  }
  var rp=$('tensRp');if(rp)rp.addEventListener('click',play);
  if(reduce||!('IntersectionObserver' in window)){settle()}
  else{mk.forEach(function(b){b.style.left='50%'});
    var seen=false;var io=new IntersectionObserver(function(en){if(en[0].isIntersecting&&!seen){seen=true;io.disconnect();play()}},{threshold:.35});io.observe(w)}
})();

/* ---------- botones: rodillo de texto y casilla de interruptor ---------- */
function setLabel(b,t){var q=b.querySelectorAll('.bt>span');if(!q.length){b.textContent=t;return}q.forEach(function(x){x.textContent=t})}
function enhance(b){
  if(b.dataset.e)return;b.dataset.e='1';
  var t=b.textContent.trim(),lab=document.createElement('span'),a=document.createElement('span'),c=document.createElement('span');
  lab.className='bt';a.textContent=t;c.textContent=t;c.setAttribute('aria-hidden','true');lab.appendChild(a);lab.appendChild(c);
  b.textContent='';
  if(b.hasAttribute('aria-pressed')&&!b.classList.contains('t')){var sw=document.createElement('i');sw.className='sw';sw.setAttribute('aria-hidden','true');b.appendChild(sw)}
  b.appendChild(lab);
}
document.querySelectorAll('.btn').forEach(enhance);

/* ---------- ampliar imagen (lightbox) ---------- */
(function(){
  var lb=$('lb'),img=$('lbImg'),box=img.parentNode,T=$('lbT'),D=$('lbD'),H=$('lbH'),last=null;
  function open(el){
    last=el;var src=el.dataset.lb,im=el.querySelector('img');
    box.classList.remove('z');img.src=src;img.alt=im?im.alt:(el.dataset.t||'');T.textContent=el.dataset.t||'';D.textContent=el.dataset.d||'';
    H.textContent='Haz clic o toca la imagen para ver el detalle';lb.hidden=false;document.body.classList.add('lbo');if(window.__lenis)window.__lenis.stop();
    $('lbX').focus({preventScroll:true});
  }
  function close(){
    if(lb.hidden)return;lb.hidden=true;document.body.classList.remove('lbo');if(window.__lenis)window.__lenis.start();
    if(last){try{last.focus({preventScroll:true})}catch(e){}}
  }
  document.querySelectorAll('[data-lb]').forEach(function(el){el.addEventListener('click',function(e){e.preventDefault();open(el)});
    if(!el.matches('a,button')){if(!el.hasAttribute('tabindex'))el.tabIndex=0;if(!el.hasAttribute('role'))el.setAttribute('role','button');
      el.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open(el)}})}});
  box.addEventListener('click',function(){box.classList.toggle('z');H.textContent=box.classList.contains('z')?'Haz clic o toca la imagen para volver a verla entera':'Haz clic o toca la imagen para ver el detalle';box.scrollTop=0;box.scrollLeft=0});
  $('lbX').addEventListener('click',close);
  lb.querySelector('[data-lbx]').addEventListener('click',close);
  document.addEventListener('keydown',function(e){if(lb.hidden)return;if(e.key==='Escape')close();if(e.key==='Tab'){e.preventDefault();$('lbX').focus()}});
})();

/* ---------- cifras con dibujo propio ---------- */
(function(){
  var cards=[].slice.call(document.querySelectorAll('.num[data-k]'));if(!cards.length)return;
  var IDLE='Recorre el dibujo con el cursor o el dedo.';
  var fmtN=function(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,',')};
  var V={};
  /* 12 informes: hojas apiladas */
  V.inf=function(card){
    var viz=card.querySelector('.viz'),vd=card.querySelector('.vd'),r=rnd(5),sh=[],cur=-1;
    viz.classList.add('v-inf');
    for(var k=0;k<12;k++){var e=document.createElement('i');e.className='sh1';e.style.setProperty('--k',k);e.style.setProperty('--r',((r()-.5)*10).toFixed(1)+'deg');
      e.style.setProperty('--px',-Math.floor(r()*500)+'px');e.style.setProperty('--py',-Math.floor(r()*700)+'px');e.dataset.n=(k<9?'0':'')+(k+1);viz.appendChild(e);sh.push(e)}
    function hv(k){if(k===cur)return;cur=k;sh.forEach(function(s,i){s.classList.toggle('hv',i===k)});vd.textContent=k<0?IDLE:'Informe '+(k+1)+' de 12, con evidencia fotográfica georreferenciada.'}
    function at(e){var b=viz.getBoundingClientRect(),w=b.width-40;return Math.max(0,Math.min(11,Math.round((e.clientX-b.left-20)/(w/11))))}
    viz.addEventListener('pointermove',function(e){hv(at(e))});viz.addEventListener('pointerdown',function(e){hv(at(e))});
    viz.addEventListener('pointerleave',function(){hv(-1)});
    vd.textContent=IDLE;
    return {run:function(){hv(-1)},rest:function(){hv(-1)}};
  };
  /* +68.1%: dos barras con la diferencia marcada */
  V.met=function(card){
    var viz=card.querySelector('.viz'),vd=card.querySelector('.vd');
    viz.classList.add('v-met');
    viz.innerHTML='<div class="row r1"><span class="lb2">Metrado contractual</span><div class="mbar mb1"></div></div>'+
      '<div class="row r2"><span class="lb2">Metrado ejecutado (as-built en BIM)</span><div class="mbar mb2"><i class="base"></i><i class="diff"><b>+68.1 %</b></i></div></div><i class="ref"></i>';
    var T={r1:'Metrado contractual: es la base, 100.',base:'Metrado ejecutado, validado con el as-built modelado en BIM: 168.1 sobre esa base de 100.',diff:'Lo ejecutado superó al contrato en 68.1 %. El as-built modelado sustentó la diferencia y se aprobaron los adicionales.'};
    function hv(e){var t=e.target.closest?e.target.closest('.diff,.base,.row.r1'):null,k=!t?null:t.classList.contains('diff')?'diff':t.classList.contains('base')?'base':'r1';
      viz.classList.toggle('hd',k==='diff');viz.querySelector('.r1').classList.toggle('hv',k==='r1');viz.querySelector('.r2').classList.toggle('hv',k==='base');
      vd.textContent=k?T[k]:IDLE}
    viz.addEventListener('pointermove',hv);viz.addEventListener('pointerdown',hv);
    viz.addEventListener('pointerleave',function(){viz.classList.remove('hd');viz.querySelectorAll('.hv').forEach(function(x){x.classList.remove('hv')});vd.textContent=IDLE});
    vd.textContent=IDLE;
    return {run:function(){},rest:function(){}};
  };
  /* 197 puntos de drenaje */
  V.dre=function(card){
    var viz=card.querySelector('.viz'),vd=card.querySelector('.vd'),dots=[],tw=null,o={v:0},cur=-1;
    viz.classList.add('v-dre');
    for(var i=0;i<200;i++){var e=document.createElement('i');e.style.setProperty('--i',i);if(i>=197)e.className='z';viz.appendChild(e);dots.push(e)}
    function msg(n){vd.textContent=n+' de 197 puntos verificados en campo.'}
    function hv(k){if(k===cur)return;if(cur>=0){[cur,cur-1,cur+1,cur-20,cur+20].forEach(function(j){if(dots[j])dots[j].classList.remove('hv','nr')})}
      cur=k;if(k>=0){dots[k].classList.add('hv');[k-1,k+1,k-20,k+20].forEach(function(j){if(dots[j]&&j<197&&j>=0)dots[j].classList.add('nr')});vd.textContent='Punto '+(k+1)+' de 197, contrastado con el proyecto aprobado.'}else vd.textContent=IDLE}
    function at(e){var b=viz.getBoundingClientRect(),c=Math.floor((e.clientX-b.left)/b.width*20),rr=Math.floor((e.clientY-b.top)/b.height*10),k=Math.max(0,Math.min(19,c))+20*Math.max(0,Math.min(9,rr));return k<197?k:-1}
    viz.addEventListener('pointermove',function(e){hv(at(e))});viz.addEventListener('pointerdown',function(e){hv(at(e))});viz.addEventListener('pointerleave',function(){hv(-1)});
    function done(){dots.forEach(function(d,i){if(i<197)d.classList.add('ok')});viz.classList.add('done');msg(197)}
    vd.textContent=IDLE;
    return {
      run:function(){if(tw)tw.kill();viz.classList.remove('done');dots.forEach(function(d){d.classList.remove('ok')});
        if(reduce){done();vd.textContent=IDLE;return}
        void viz.offsetWidth;dots.forEach(function(d,i){if(i<197)d.classList.add('ok')});
        o.v=0;msg(0);tw=gsap.to(o,{v:197,duration:197*.009+.05,delay:.6,ease:'none',onUpdate:function(){if(cur<0)msg(Math.round(o.v))},onComplete:function(){viz.classList.add('done');if(cur<0)vd.textContent=IDLE}})},
      rest:function(){if(tw){tw.kill();tw=null}viz.classList.remove('done');dots.forEach(function(d){d.classList.remove('ok')});vd.textContent=IDLE;if(reduce)done()},
      init:function(){if(reduce){done();vd.textContent=IDLE}}
    };
  };
  /* 2,981 m²: una celda por metro cuadrado */
  V.ench=function(card){
    var viz=card.querySelector('.viz'),vd=card.querySelector('.vd'),cv=document.createElement('canvas'),ctx=cv.getContext('2d'),sc=document.createElement('i'),R=rnd(9);
    var COLS=80,ROWS=38,TOT=2981,n=0,W=0,H=0,dpr=1,tw=null,o={v:0},col=[];
    viz.classList.add('v-ench');viz.appendChild(cv);sc.className='scan';viz.appendChild(sc);
    /* tono de cada celda: del azul al verde azulado, con variación como piezas de enchape */
    for(var c=0;c<COLS;c++){for(var r=0;r<ROWS;r++){var t=c/COLS,v=(R()-.5)*14;
      col[c*ROWS+r]='rgb('+Math.round(62-16*t+v)+','+Math.round(92+35*t+v)+','+Math.round(134-4*t+v)+')'}}
    function cell(i,on){var c=Math.floor(i/ROWS),r=i%ROWS,cw=W/COLS,ch=H/ROWS,g=Math.max(.5,cw*.17);
      ctx.clearRect(c*cw,r*ch,cw,ch);ctx.fillStyle=on?col[i]:'rgba(20,22,23,.1)';ctx.fillRect(c*cw+g/2,r*ch+g/2,cw-g,ch-g)}
    function full(){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);for(var i=0;i<TOT;i++)cell(i,i<n)}
    function size(){var b=viz.getBoundingClientRect();if(!b.width)return;dpr=Math.min(2,window.devicePixelRatio||1);W=b.width;H=b.height;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);full()}
    function set(m){m=Math.max(0,Math.min(TOT,Math.round(m)));if(m===n)return;var a=n;n=m;ctx.setTransform(dpr,0,0,dpr,0,0);
      if(m>a){for(var i=a;i<m;i++)cell(i,true)}else{for(var j=m;j<a;j++)cell(j,false)}
      sc.style.left=(n/TOT*W)+'px'}
    function msg(){vd.textContent=fmtN(n)+' m² controlados. Cada celda es 1 m².'}
    function kill(){if(tw){tw.kill();tw=null}}
    function at(e){var b=viz.getBoundingClientRect();return (e.clientX-b.left)/b.width*TOT}
    viz.addEventListener('pointermove',function(e){kill();viz.classList.add('hd');set(at(e));msg()});
    viz.addEventListener('pointerdown',function(e){kill();viz.classList.add('hd');set(at(e));msg()});
    viz.addEventListener('pointerleave',function(){viz.classList.remove('hd');kill();if(reduce){set(TOT)}else{o.v=n;tw=gsap.to(o,{v:TOT,duration:.9,ease:'power2.out',onUpdate:function(){set(o.v)},onComplete:function(){vd.textContent=IDLE}})}});
    window.addEventListener('resize',size);
    vd.textContent=IDLE;
    return {
      run:function(){size();kill();set(0);if(reduce){set(TOT);return}o.v=0;tw=gsap.to(o,{v:TOT,duration:2.6,delay:.7,ease:'power2.inOut',onUpdate:function(){set(o.v);if(!viz.classList.contains('hd'))vd.textContent=fmtN(n)+' m² controlados.'},onComplete:function(){vd.textContent=IDLE}})},
      rest:function(){kill();set(0);vd.textContent=IDLE},
      init:function(){size();if(reduce){set(TOT)}}
    };
  };
  cards.forEach(function(card){
    var k=card.dataset.k,api=V[k]&&V[k](card);if(!api)return;
    card.addEventListener('numrun',function(){api.run()});
    card.addEventListener('numrest',function(){api.rest()});
    var rp=card.querySelector('[data-rp]');if(rp)rp.addEventListener('click',function(){card.dispatchEvent(new Event('numreplay'))});
    if(api.init)api.init();
  });
})();

/* ================= v1.0: seis ventanas, miniaturas y contacto ================= */
(function(){
  var panel=$('vpanel'),ORDER=['bim','obra','presupuestos','diseno','concursos','docencia'];
  var SHORT={bim:'BIM',obra:'Obra',presupuestos:'Presupuestos',diseno:'Diseño',concursos:'Concursos',docencia:'Docencia'};
  var TOPIC={bim:'Modelado y coordinación BIM',obra:'Supervisión y coordinación de obra',presupuestos:'Presupuestos y adicionales',diseno:'Asistencia de diseño',concursos:'Concursos e investigación',docencia:'Docencia'};
  var arts={};ORDER.forEach(function(k){arts[k]=$('w-'+k)});
  var cards=[].slice.call(document.querySelectorAll('.vcard')),tabs=[].slice.call(panel.querySelectorAll('.vtabs [data-w]')),navL=[].slice.call(document.querySelectorAll('.bar nav a[data-w]'));
  var cur=null,INIT={},LEAVE={};
  function goTo(el,off){if(window.__lenis&&!reduce)window.__lenis.scrollTo(el,{offset:off,duration:1.3});else el.scrollIntoView({behavior:reduce?'auto':'smooth'})}
  function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}

  /* ---------- contacto: cajetín de encargo ---------- */
  var MAIL='alexantunez1604@gmail.com',tipo='';
  var topics=[].slice.call(document.querySelectorAll('#topics [data-t]'));
  var fU=$('encU'),fP=$('encP'),fN=$('encN'),fD=$('encD'),pvB=$('encPv'),pvS=$('subjT'),lnk=$('encMail'),frm=$('enc');
  function one(v){return String(v||'').replace(/\s+/g,' ').trim()}
  function compose(){
    var t=one(tipo),u=one(fU.value),pl=one(fP.value),n=one(fN.value),d=String(fD.value||'').replace(/\r/g,'').trim();
    var subj=t?'Consulta · '+t:'Consulta de proyecto',L=['Hola, Alexander:','','Quisiera consultarte por un encargo.',''];
    if(t)L.push('Tipo: '+t);if(u)L.push('Ubicación: '+u);if(pl)L.push('Plazo previsto: '+pl);
    if(L[L.length-1]!=='')L.push('');
    if(d){L.push(d);L.push('')}
    L.push(n?'Gracias,':'Gracias.');if(n)L.push(n);
    return {subj:subj,body:L.join('\n')};
  }
  function refresh(){
    var m=compose();pvS.textContent=m.subj;pvB.textContent=m.body;
    lnk.setAttribute('href','mailto:'+MAIL+'?subject='+encodeURIComponent(m.subj)+'&body='+encodeURIComponent(m.body.replace(/\n/g,'\r\n')));
  }
  function setTopic(t){
    tipo=t||'';
    topics.forEach(function(b){b.setAttribute('aria-pressed',b.dataset.t===tipo?'true':'false')});
    refresh();
  }
  function copyTxt(b,txt,idle,done,sel){
    function ok(){setLabel(b,done);b.classList.add('ok');setTimeout(function(){setLabel(b,idle);b.classList.remove('ok')},1900)}
    function fb(){var r=document.createRange();r.selectNodeContents(sel);var s=getSelection();s.removeAllRanges();s.addRange(r);setLabel(b,'Seleccionado, cópialo');setTimeout(function(){setLabel(b,idle)},1800)}
    try{navigator.clipboard.writeText(txt).then(ok,fb)}catch(e){fb()}
  }
  topics.forEach(function(b){b.addEventListener('click',function(){setTopic(b.getAttribute('aria-pressed')==='true'?'':b.dataset.t)})});
  document.querySelectorAll('[data-topic]').forEach(function(a){a.addEventListener('click',function(){setTopic(a.dataset.topic)})});
  [fU,fP,fN,fD].forEach(function(f){f.addEventListener('input',refresh)});
  frm.addEventListener('submit',function(e){e.preventDefault()});
  $('subjB').addEventListener('click',function(){copyTxt($('subjB'),compose().subj,'Copiar asunto','Asunto copiado',pvS)});
  $('encCopy').addEventListener('click',function(){copyTxt($('encCopy'),compose().body,'Copiar mensaje','Mensaje copiado',pvB)});
  $('mailB').addEventListener('click',function(){copyTxt($('mailB'),$('mailT').textContent,'Copiar correo','Correo copiado',$('mailT'))});
  refresh();

  /* ---------- abrir y cerrar ventanas ---------- */
  function toPanel(){
    var y=Math.max(0,panel.getBoundingClientRect().top+window.scrollY-60);
    if(window.__lenis&&!reduce)window.__lenis.scrollTo(y,{duration:1.1});else window.scrollTo({top:y,behavior:reduce?'auto':'smooth'});
  }
  function mark(id){
    cards.forEach(function(c){var on=c.dataset.w===id;if(on)c.setAttribute('aria-current','true');else c.removeAttribute('aria-current');
      var g=c.querySelector('.vgo');if(g)g.textContent=on?'Ventana abierta':'Abrir ventana'});
    navL.forEach(function(a){a.classList.toggle('on',a.dataset.w===id)});
  }
  function openW(id,o){
    o=o||{};if(!arts[id])return;
    if(cur===id&&!panel.hidden){if(!o.noScroll)toPanel();return}
    if(cur){arts[cur].querySelectorAll('.num').forEach(function(c){c.dispatchEvent(new Event('numrest'))});if(LEAVE[cur])LEAVE[cur]()}
    cur=id;panel.hidden=false;var cc=document.querySelector('.cur');if(cc)cc.classList.remove('on');
    ORDER.forEach(function(k){arts[k].hidden=k!==id});
    tabs.forEach(function(t){var on=t.dataset.w===id;t.setAttribute('aria-selected',on?'true':'false');t.tabIndex=on?0:-1;
      if(on){var p=t.parentNode;p.scrollLeft=Math.max(0,t.offsetLeft-24)}});
    mark(id);
    try{history.replaceState(null,'','#'+id)}catch(e){}
    if(id==='bim'&&window.__startViewer)window.__startViewer();
    if(INIT[id])INIT[id]();
    ScrollTrigger.refresh();
    if(!reduce&&!o.noAnim)gsap.fromTo(arts[id].children,{y:26,opacity:0},{y:0,opacity:1,duration:.8,ease:'power3.out',stagger:.07,clearProps:'transform,opacity'});
    if(!o.noScroll)requestAnimationFrame(toPanel);
  }
  function closeW(){
    if(cur){arts[cur].querySelectorAll('.num').forEach(function(c){c.dispatchEvent(new Event('numrest'))});if(LEAVE[cur])LEAVE[cur]()}
    cur=null;panel.hidden=true;ORDER.forEach(function(k){arts[k].hidden=true});
    tabs.forEach(function(t){t.setAttribute('aria-selected','false')});
    mark(null);
    try{history.replaceState(null,'','#ventanas')}catch(e){}
    ScrollTrigger.refresh();goTo($('ventanas'),-58);
  }
  window.__openW=openW;
  document.querySelectorAll('a[data-w]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();openW(a.dataset.w)})});
  tabs.forEach(function(t,i){
    t.addEventListener('click',function(){openW(t.dataset.w)});
    t.addEventListener('keydown',function(e){var d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(!d)return;e.preventDefault();var n=tabs[(i+d+tabs.length)%tabs.length];n.focus();openW(n.dataset.w,{noScroll:true})});
  });
  $('vclose').addEventListener('click',closeW);
  /* pie de cada ventana: anterior, consultar, siguiente */
  ORDER.forEach(function(id,i){
    var a=arts[id],nv=el('div','wnav'),pv=ORDER[(i+5)%6],nx=ORDER[(i+1)%6];
    var bp=el('button','btn t sm','← '+SHORT[pv]),bc=el('button','btn cta','Consultarme sobre esto'),bn=el('button','btn t sm',SHORT[nx]+' →');
    [bp,bc,bn].forEach(function(b){b.type='button'});
    bp.addEventListener('click',function(){openW(pv)});bn.addEventListener('click',function(){openW(nx)});
    bc.addEventListener('click',function(){setTopic(TOPIC[id]);goTo($('contacto'),-58)});
    nv.appendChild(bp);nv.appendChild(bc);nv.appendChild(bn);a.appendChild(nv);[bp,bc,bn].forEach(enhance);
  });

  /* ---------- pestañas simples ---------- */
  function tabset(sel,key,pre,after){
    var bs=[].slice.call(document.querySelectorAll(sel));
    bs.forEach(function(t,i){
      function go(){
        bs.forEach(function(x){var on=x===t;x.setAttribute('aria-selected',on?'true':'false');x.tabIndex=on?0:-1;$(pre+x.dataset[key]).hidden=!on});
        ScrollTrigger.refresh();
        var pn=$(pre+t.dataset[key]);
        if(!reduce)gsap.fromTo(pn,{y:18,opacity:0},{y:0,opacity:1,duration:.6,ease:'power3.out',clearProps:'transform,opacity'});
        if(after)after(t.dataset[key]);
      }
      t.addEventListener('click',go);
      t.addEventListener('keydown',function(e){var d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(!d)return;e.preventDefault();var n=bs[(i+d+bs.length)%bs.length];n.focus();n.click()});
    });
  }
  tabset('.qtabs [data-q]','q','q-',function(k){var no=$('qno');if(no)no.textContent={perfil:'Hoja 01 / 03',tray:'Hoja 02 / 03',form:'Hoja 03 / 03'}[k]||no.textContent;if(k==='tray'&&!reduce)gsap.fromTo('.tl-b',{scaleX:0},{scaleX:1,duration:1.1,ease:'power3.out',stagger:.09})});
  tabset('.qtabs [data-c]','c','c-',null);

  /* ---------- 02 · Obra: cuatro obras en pestañas ---------- */
  (function(){
    /* Alpes 2: una celda por departamento */
    var ga=document.querySelector('#oxA .oxa-g'),fa=document.querySelector('#oxA figcaption'),idl=fa.textContent,cells=[];
    for(var i=0;i<24;i++){var c=el('i',null,i+1);c.style.setProperty('--k',i);ga.appendChild(c);cells.push(c)}
    function hvA(k){cells.forEach(function(c,i){c.classList.toggle('hv',i===k)});fa.textContent=k<0?idl:'Departamento '+(k+1)+' de 24: 6 ml de mueblería, 6 puertas y 15 m² de enchape.'}
    function atA(e){var b=ga.getBoundingClientRect(),c=Math.max(0,Math.min(7,Math.floor((e.clientX-b.left)/b.width*8))),r=Math.max(0,Math.min(2,Math.floor((e.clientY-b.top)/b.height*3)));return r*8+c}
    ga.addEventListener('pointermove',function(e){hvA(atA(e))});ga.addEventListener('pointerdown',function(e){hvA(atA(e))});ga.addEventListener('pointerleave',function(){hvA(-1)});
    /* Tiendas 3A: once días calendario */
    var gc=document.querySelector('#oxC .oxc-d');
    for(var d=0;d<11;d++){var s=el('i',d===10?'end':null,d+1);s.style.setProperty('--k',d);gc.appendChild(s)}
    function run(k){var p=$('ob-'+k);if(!p)return;p.classList.remove('go');void p.offsetWidth;p.classList.add('go');
      /* si una cifra ya está a la vista al cambiar de obra, que arranque aunque el disparador no haya vuelto a entrar */
      setTimeout(function(){if(p.hidden)return;p.querySelectorAll('.num').forEach(function(c){var r=c.getBoundingClientRect();if(r.height&&r.top<innerHeight*.86&&r.bottom>innerHeight*.06&&!c.classList.contains('on'))c.dispatchEvent(new Event('numreplay'))})},450)}
    tabset('.oxs [data-o]','o','ob-',run);
    INIT.obra=function(){var p=document.querySelector('.oxp:not([hidden])');if(p)run(p.dataset.o)};
  })();

  /* ---------- 03 · Presupuestos: el proceso paso a paso ---------- */
  (function(){
    var STEPS=[
      ['Hallazgo en campo','Se identifica en obra una partida, un metrado o una condición que difiere de lo contratado.'],
      ['Evidencia fotográfica','Se registra con fotografías georreferenciadas, para que cada hallazgo se pueda ubicar y comprobar.'],
      ['Contraste con el proyecto','Se compara lo encontrado con los planos aprobados y se clasifica y cuantifica cada diferencia.'],
      ['Metrado en BIM','Se modela y se mide la partida en el modelo, para dar respaldo a la cantidad.'],
      ['APU y presupuesto','Se costea con análisis de precios unitarios y se arma el presupuesto del adicional.'],
      ['Informe técnico','Se sustenta ante el comitente con un informe que reúne la evidencia, el metrado y el costo.']
    ];
    var rail=$('stRail'),sd=$('stD'),sb=$('stPlay'),els=[],tm=null,played=false;
    STEPS.forEach(function(s,i){
      var b=el('button','st');b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-selected','false');
      b.appendChild(el('span','dot tech',i+1));b.appendChild(el('b',null,s[0]));
      b.addEventListener('click',function(){stop();show(i)});rail.appendChild(b);els.push(b);
    });
    function show(i){
      els.forEach(function(b,k){b.setAttribute('aria-selected',k===i?'true':'false');b.classList.toggle('done',k<i)});
      sd.textContent='';sd.appendChild(el('span','tech','Paso '+(i+1)+' de '+STEPS.length));sd.appendChild(el('b',null,STEPS[i][0]));sd.appendChild(el('p',null,STEPS[i][1]));
      if(!reduce){sd.classList.remove('fl');void sd.offsetWidth;sd.classList.add('fl')}
    }
    function stop(){if(tm){clearInterval(tm);tm=null;setLabel(sb,'Ver el proceso')}}
    function play(){stop();var i=0;show(0);setLabel(sb,'Detener');tm=setInterval(function(){i++;if(i>=STEPS.length){stop();return}show(i)},2400)}
    sb.addEventListener('click',function(){if(tm)stop();else play()});
    show(0);
    INIT.presupuestos=function(){if(played||reduce)return;played=true;setTimeout(function(){if(cur==='presupuestos'&&!tm)play()},1400)};
    LEAVE.presupuestos=stop;
  })();

  /* ---------- 05 · Investigación: correlaciones ---------- */
  (function(){
    /* nombre, r, clase, r numérico, % que explica (r al cuadrado), lectura propia de cada factor */
    var C=[
      ['Complejidad','−0.677','negativa fuerte',-0.677,'46 %','Cuantos más elementos distintos hay en la imagen, menos se prefiere. Es el factor que más pesa: explica cerca de la mitad de la variación de la preferencia.'],
      ['Área edificada','−0.673','negativa fuerte',-0.673,'45 %','Cuanto más área construida se ve, menos se prefiere el paisaje. Junto con la complejidad, es uno de los dos factores dominantes.'],
      ['Intervención humana','−0.624','negativa fuerte',-0.624,'39 %','Movimiento de tierras, cercos, sombrillas y estacionamientos, sin contar edificios, también restan preferencia.'],
      ['Imaginabilidad','−0.544','negativa fuerte',-0.544,'30 %','Las vistas que más se recuerdan son las más intervenidas, y son las menos preferidas: lo memorable no es lo preferido. El informe la señala como la medición menos estandarizada del estudio.'],
      ['Terreno natural','+0.31','positiva débil',0.31,'10 %','Es el atributo positivo más asociado a la preferencia, pero explica solo una décima parte. Asociación débil: por sí sola no permite concluir un efecto.'],
      ['Cuerpo de agua','+0.276','positiva débil',0.276,'8 %','Más agua visible, algo más de preferencia. Explica menos del 10 %: asociación débil, no concluyente.'],
      ['Terreno abierto','+0.249','positiva débil',0.249,'6 %','Asociación débil. Importa sobre todo por su relación inversa con el área construida: cuando una sube, la otra baja.'],
      ['Vegetación','+0.054','sin relación',0.054,'0.3 %','Sin relación. En esta playa la vegetación son sobre todo algas en zonas rocosas y ocupa muy poco de la imagen, así que este indicador no mide bien su efecto.']
    ];
    var rows=$('corrRows'),d=$('corrD'),idle=d.textContent,box=$('corr');
    var sc=el('div','cscale');sc.setAttribute('aria-hidden','true');sc.appendChild(el('span'));
    var sx=el('div');['−1','0','+1'].forEach(function(t){sx.appendChild(el('span',null,t))});sc.appendChild(sx);sc.appendChild(el('span','tech','r'));sc.appendChild(el('span','tech','explica'));rows.appendChild(sc);
    var els=[];
    C.forEach(function(c,i){
      var r=el('button','cr');r.type='button';
      var n=el('span','cn',c[0]);n.appendChild(el('small',null,'correlación '+c[2]));
      var t=el('span','ct'),b=el('b',c[3]<0?'neg':'pos');b.style.setProperty('--a',Math.abs(c[3]));b.style.setProperty('--i',i);t.appendChild(b);
      r.appendChild(n);r.appendChild(t);r.appendChild(el('span','cv tech',c[1]));r.appendChild(el('span','cx tech',c[4]));
      function on(){els.forEach(function(x){x.classList.toggle('hv',x===r)});d.textContent='';d.appendChild(el('b','tech',c[0]+' · r = '+c[1]+' · explica '+c[4]));d.appendChild(el('span',null,c[5]))}
      r.addEventListener('pointerenter',on);r.addEventListener('focus',on);r.addEventListener('click',on);
      rows.appendChild(r);els.push(r);
    });
    rows.addEventListener('pointerleave',function(){els.forEach(function(x){x.classList.remove('hv')});d.textContent=idle});
    if('IntersectionObserver' in window){var io=new IntersectionObserver(function(en){if(en[0].isIntersecting){box.classList.add('in');io.disconnect()}},{threshold:.3});io.observe(box)}else box.classList.add('in');
  })();

  /* ---------- 06 · Docencia: lista desplegable de experiencias ---------- */
  (function(){
    var acc=$('acc');if(!acc)return;
    [].slice.call(acc.querySelectorAll('.ac')).forEach(function(it){var b=it.querySelector('.acb');
      b.addEventListener('click',function(){var o=it.classList.toggle('open');b.setAttribute('aria-expanded',o?'true':'false')})});
  })();

  /* ---------- 06 · Docencia: Revit I, sesión por sesión ---------- */
  (function(){
    var SES=[
      ['Estructura','Introducción a Revit y estructura del proyecto arquitectónico',['Configuración inicial del archivo, unidades, niveles y ejes.','Vistas básicas: plantas, cortes y 3D.','Navegación eficiente y primeros atajos.'],'Comprensión estructural del sistema, evitando el modelado prematuro: primero se entiende cómo piensa Revit.','El estudiante comprende la lógica base del programa y estructura correctamente un archivo arquitectónico desde cero.'],
      ['Muros','Muros y configuración espacial básica',['Muros perimetrales e interiores de la vivienda.','Alturas y restricciones de los muros.','Revisión del proyecto con cortes automáticos.'],'Aprendizaje espacial y no gráfico: entender el proyecto en sección y volumen, no solo en planta.','El estudiante modela la envolvente básica del proyecto y comprende cómo las decisiones en planta afectan el espacio tridimensional.'],
      ['Vanos y losas','Vanos y losas: construcción del espacio habitable',['Inserción y ajuste de puertas y ventanas.','Losas de entrepiso y de techo.','Revisión espacial del proyecto en 3D.'],'Aprendizaje contextualizado: cada herramienta responde a una necesidad arquitectónica real.','El estudiante configura espacios habitables coherentes y empieza a leer su proyecto como un conjunto funcional y espacial.'],
      ['Lectura espacial','Lectura espacial y coordinación del proyecto',['Importación de un plano DWG como referencia.','Correcciones a partir de cortes y vistas 3D.','Organización del navegador de proyecto.'],'Retroalimentación visual: usar el modelo para tomar decisiones arquitectónicas informadas.','El estudiante usa Revit como herramienta de control espacial y de coordinación básica del proyecto.'],
      ['Escaleras y cubiertas','Circulación vertical y cubiertas',['Escaleras con criterios arquitectónicos.','Ajuste de niveles y conexiones verticales.','Cubiertas simples y corrección de conflictos.'],'Resolución de problemas: se enfrentan de forma guiada las herramientas más complejas del software.','El estudiante resuelve la circulación vertical y completa la volumetría general del proyecto.'],
      ['Documentación','Documentación arquitectónica básica',['Acotado, textos y etiquetas.','Organización de vistas para presentación.','Hojas con planos arquitectónicos.'],'Práctica profesional: claridad, legibilidad y orden.','El estudiante produce un set básico de planos arquitectónicos correctamente organizados.'],
      ['Cierre','Integración final y cierre del proyecto',['Revisión integral del proyecto.','Ajustes finales del modelo y de los planos.','Presentación del proyecto completo.'],'Aprendizaje integrador: se consolida lo trabajado sesión a sesión en un solo resultado coherente.','El estudiante entrega un proyecto arquitectónico básico, técnicamente coherente y documentado en Revit.']
    ];
    var rail=$('bdRail'),bs=$('bdS'),els=[];
    SES.forEach(function(s,i){
      var b=el('button','bs');b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-selected','false');
      b.appendChild(el('span','bn','0'+(i+1)));b.appendChild(el('span','bl2',s[0]));
      b.addEventListener('click',function(){show(i)});rail.appendChild(b);els.push(b);
    });
    function show(i){
      var s=SES[i];els.forEach(function(b,k){b.setAttribute('aria-selected',k===i?'true':'false')});
      bs.textContent='';
      var L=el('div'),R=el('div');
      L.appendChild(el('span','tech','Sesión '+(i+1)+' de '+SES.length+' · 3 horas'));L.appendChild(el('h5',null,s[1]));
      var u=el('ul');s[2].forEach(function(t){u.appendChild(el('li',null,t))});L.appendChild(u);
      L.appendChild(el('p','crit','Criterio pedagógico: '+s[3]));
      R.appendChild(el('span','pen','lo que se logra'));R.appendChild(el('p','logro',s[4]));
      bs.appendChild(L);bs.appendChild(R);
      if(!reduce){bs.classList.remove('fl');void bs.offsetWidth;bs.classList.add('fl')}
    }
    rail.addEventListener('keydown',function(e){var d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(!d)return;var k=els.findIndex(function(b){return b.getAttribute('aria-selected')==='true'}),n=(k+d+els.length)%els.length;e.preventDefault();els[n].focus();show(n)});
    show(0);
  })();

  /* ---------- miniaturas ---------- */
  (function(){
    /* Obra: la burbuja sigue al cursor; si queda entre las marcas, la obra queda conforme */
    var m=document.querySelector('.m-obra');
    if(m){
      var lev=m.querySelector('.lev'),bub=m.querySelector('.bub');
      function move(e){
        var lr=lev.getBoundingClientRect(),cx=lr.left+lr.width/2,lim=Math.max(30,lev.offsetWidth/2-26);
        if(!m.classList.contains('live')){
          var br=bub.getBoundingClientRect();m.style.setProperty('--bx',Math.max(-lim,Math.min(lim,(br.left+br.width/2)-cx))+'px');
          m.classList.add('live');void m.offsetWidth;
        }
        var mr=m.getBoundingClientRect(),bx=Math.max(-lim,Math.min(lim,(e.clientX-cx)));
        m.style.setProperty('--bx',bx+'px');
        m.style.setProperty('--rot',(Math.max(-1,Math.min(1,(e.clientY-(mr.top+mr.height/2))/(mr.height/2)))*-9).toFixed(1)+'deg');
        m.classList.toggle('ok',Math.abs(bx)<10);
      }
      function leave(){m.classList.remove('live','ok');m.style.removeProperty('--rot')}
      m.addEventListener('pointermove',move);m.addEventListener('pointerdown',move);m.addEventListener('pointerleave',leave);
    }
    /* en pantallas táctiles no hay cursor: la miniatura se anima sola al quedar a la vista */
    if(matchMedia('(hover:none)').matches&&'IntersectionObserver' in window){
      var io=new IntersectionObserver(function(en){en.forEach(function(x){x.target.classList.toggle('act',x.isIntersecting&&x.intersectionRatio>=.6)})},{threshold:[0,.6,1]});
      cards.forEach(function(c){io.observe(c)});
    }
    /* entrada escalonada de las tarjetas */
    if(!reduce&&'IntersectionObserver' in window){
      cards.forEach(function(c,i){c.style.setProperty('--dl',(i%3)*.12+'s')});
      var io2=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io2.unobserve(x.target)}})},{threshold:.12});
      cards.forEach(function(c){io2.observe(c)});
    }else cards.forEach(function(c){c.classList.add('in')});
  })();

  /* enlaces directos a una ventana: #bim, #obra, #presupuestos, #diseno, #concursos, #docencia */
  function fromHash(o){var h=location.hash.slice(1);if(ORDER.indexOf(h)>=0)openW(h,o)}
  window.addEventListener('hashchange',function(){fromHash({})});
  if(ORDER.indexOf(location.hash.slice(1))>=0){
    var go=function(){setTimeout(function(){fromHash({noAnim:true})},60)};
    if(document.readyState==='complete')go();else window.addEventListener('load',go);
  }
})();

/* ================= v0.6: scroll suave y animación con motor ================= */
(function(){
  var root=document.documentElement;root.classList.add('js');if(reduce)root.classList.add('rm');
  gsap.registerPlugin(ScrollTrigger);
  var lenis=null;
  if(!reduce){
    lenis=new Lenis({lerp:.1,smoothWheel:true});window.__lenis=lenis;
    lenis.on('scroll',ScrollTrigger.update);
    gsap.ticker.add(function(t){lenis.raf(t*1000)});gsap.ticker.lagSmoothing(0);
  }
  /* etapas del método ligadas al scroll (primero: el pin cambia las posiciones de todo lo que sigue) */
  initEtapas({gsap:gsap,ScrollTrigger:ScrollTrigger,reduce:reduce});
  document.querySelectorAll('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){
    var t=document.querySelector(a.getAttribute('href'));if(!t)return;
    if(lenis){e.preventDefault();var vb=t.closest('.vw')&&document.querySelector('.vbar');lenis.scrollTo(t,{offset:-58-(vb?vb.offsetHeight:0),duration:1.3})}
  })});
  /* nav activa */
  var links={};document.querySelectorAll('.bar nav a').forEach(function(a){links[a.getAttribute('href').slice(1)]=a});
  Object.keys(links).forEach(function(id){var el=document.getElementById(id);if(!el)return;
    ScrollTrigger.create({trigger:el,start:'top 55%',end:'bottom 55%',onToggle:function(s){links[id].classList.toggle('on',s.isActive);if(s.isActive)document.querySelectorAll('.bar nav a[data-w]').forEach(function(a){a.classList.remove('on')})}})});
  gsap.to('.progress i',{scaleX:1,ease:'none',scrollTrigger:{start:0,end:'max',scrub:.3}});
  if(reduce){initHero({gsap:gsap,reduce:true});window.addEventListener('load',function(){ScrollTrigger.refresh()});return}
  /* entrada del inicio */
  initHero({gsap:gsap,reduce:reduce});
  gsap.timeline({defaults:{ease:'power3.out'}})
    .fromTo('.hx-id .eyebrow',{y:14,opacity:0},{y:0,opacity:1,duration:.9,delay:.3})
    .fromTo('.nm1',{y:30,opacity:0},{y:0,opacity:1,duration:1},'-=.6')
    .fromTo('.nm2',{y:46,opacity:0},{y:0,opacity:1,duration:1.2},'-=.8')
    .fromTo('.hx-write,.hx-cap',{opacity:0},{opacity:1,duration:1},'-=.6');
  /* revelados al entrar */
  var sel='.sh h2,.sh p,.quote,.mind>div>p,.ten,.prin>div,.svc>div,.fmt>div,.tl-row,.tl-d,.contact h2,.mail';
  gsap.utils.toArray(sel).forEach(function(el){if(el.closest('.vpanel')||el.closest('[hidden]'))return;el.setAttribute('data-rv','')});
  ScrollTrigger.batch('[data-rv]',{start:'top 88%',end:'max',once:true,onEnter:function(b){gsap.to(b,{opacity:1,y:0,duration:.9,ease:'power3.out',stagger:.08,overwrite:true})}});
  /* cifras: parten de 0 cada vez que entran en pantalla y suben hasta su valor */
  gsap.utils.toArray('.num').forEach(function(card,idx){
    var el=card.querySelector('strong'),raw=el.textContent,m=raw.match(/[\d][\d.,]*/);if(!m)return;
    var numStr=m[0],hasComma=/,/.test(numStr),dec=(numStr.split('.')[1]||'').length,n=parseFloat(numStr.replace(/,/g,''));
    var pre=raw.slice(0,m.index),post=raw.slice(m.index+numStr.length),o={v:0},tw=null;
    function fmt(v){var s=v.toFixed(dec);if(hasComma){var p=s.split('.');p[0]=p[0].replace(/\B(?=(\d{3})+(?!\d))/g,',');s=p.join('.')}return pre+s+post}
    function stop(){if(tw){tw.kill();tw=null}}
    function rest(){stop();o.v=0;el.textContent=fmt(0);card.classList.remove('on');card.dispatchEvent(new Event('numrest'))}
    function run(){stop();o.v=0;el.textContent=fmt(0);card.classList.add('on');card.dispatchEvent(new Event('numrun'));
      tw=gsap.to(o,{v:n,duration:2.2,delay:.15+idx*.12,ease:'power3.out',onUpdate:function(){el.textContent=fmt(o.v)},onComplete:function(){el.textContent=raw;tw=null}})}
    rest();
    card.addEventListener('numreplay',function(){rest();void card.offsetWidth;run()});
    ScrollTrigger.create({trigger:card,start:'top 86%',end:'bottom 6%',onEnter:run,onEnterBack:run,onLeave:rest,onLeaveBack:rest,onUpdate:function(s){if(s.isActive&&!card.classList.contains('on'))run()}});
  });
  /* líneas de cota que se dibujan al entrar */
  gsap.utils.toArray('.cota').forEach(function(c){ScrollTrigger.create({trigger:c,start:'top 92%',once:true,onEnter:function(){c.classList.add('in')}})});
  if(matchMedia('(pointer:fine)').matches){
    /* caja que sigue al cursor sobre las piezas que se pueden abrir */
    var cur=document.createElement('div'),ci=document.createElement('span');cur.className='cur';ci.className='ci';cur.appendChild(ci);cur.setAttribute('aria-hidden','true');document.body.appendChild(cur);
    document.documentElement.classList.add('has-cur');
    var cx=gsap.quickTo(cur,'x',{duration:.4,ease:'power3'}),cy=gsap.quickTo(cur,'y',{duration:.4,ease:'power3'}),shown=false;
    document.addEventListener('pointermove',function(e){cx(e.clientX);cy(e.clientY);
      var t=e.target.closest?e.target.closest('[data-cur]'):null;
      if(t){if(ci.textContent!==t.dataset.cur)ci.textContent=t.dataset.cur;if(!shown){gsap.set(cur,{x:e.clientX,y:e.clientY});shown=true}cur.classList.add('on')}else{cur.classList.remove('on');shown=false}},{passive:true});
    document.addEventListener('pointerleave',function(){cur.classList.remove('on')});
  }
  /* panorámica: la imagen se desplaza un poco más despacio que la página */
  var pano=document.querySelector('.pano');
  if(pano){
    pano.querySelectorAll('img').forEach(function(im){gsap.fromTo(im,{yPercent:-3},{yPercent:3,ease:'none',scrollTrigger:{trigger:pano,start:'top bottom',end:'bottom top',scrub:true}})});
  }
  /* barras de trayectoria */
  gsap.set('.tl-b',{scaleX:0,transformOrigin:'0 50%'});
  ScrollTrigger.create({trigger:'#tl',start:'top 80%',once:true,onEnter:function(){gsap.to('.tl-b',{scaleX:1,duration:1.1,ease:'power3.out',stagger:.09})}});
  window.addEventListener('load',function(){ScrollTrigger.refresh()});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){ScrollTrigger.refresh()});
})();

})();
