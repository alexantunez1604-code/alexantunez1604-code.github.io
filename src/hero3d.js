import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/* Modelo de portada: Módulo de 3 habitaciones, Pumarrinri Amazon Lodge (Bienestudio Arquitectura).
   - El GLB viene del IFC de Revit, agrupado en diez categorías y estas en cuatro niveles:
       1 Suelo · 2 Estructura de madera · 3 Muros · 4 Cubierta
   - Entrada: el modelo aparece como líneas que suben y se rellenan de masa (una sola vez por carga de página).
   - La explosión es continua: la controla una barra vertical (setExplode 0..1).
   - Con el modelo explotado, al pasar el cursor (o tocar) un nivel se aísla y se resalta; el resto queda en gris.
   - Orbita con el puntero; no captura la rueda: el scroll sigue siendo de la página. */
export function createHero(opts){
  var stage=opts.stage,canvas=opts.canvas,reduce=!!opts.reduce,still=!!opts.still,tipEl=opts.tip||null;
  var renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.NeutralToneMapping||THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
  renderer.localClippingEnabled=true;

  var scene=new THREE.Scene();
  var camera=new THREE.PerspectiveCamera(30,1,0.1,900);
  var controls=new OrbitControls(camera,canvas);
  controls.enableDamping=true;controls.dampingFactor=.07;controls.enableZoom=false;controls.enablePan=false;
  controls.maxPolarAngle=Math.PI*.49;controls.minPolarAngle=Math.PI*.18;
  controls.autoRotate=false;controls.autoRotateSpeed=.7;
  canvas.style.touchAction='pan-y';

  scene.add(new THREE.HemisphereLight(0xffffff,0x8d979e,1.05));
  var sun=new THREE.DirectionalLight(0xffffff,2.3);scene.add(sun);scene.add(sun.target);
  var fill=new THREE.DirectionalLight(0xdfe8ee,.55);scene.add(fill);

  var INK=0x14181C,ACC=new THREE.Color(0xC8402F);
  var LV=[
    {k:['terreno','cimentacion','losas','contencion','detalle'],t:'Suelo',s:'Cimentación, losas, muros de contención y detalles'},
    {k:['estructura','entrepiso'],t:'Estructura de madera',s:'Pilares y vigas'},
    {k:['muros','carpinteria'],t:'Muros',s:'Wood frame, quincha, carpintería y vidrio'},
    {k:['cubierta'],t:'Cubierta',s:'Paneles, canaletas y remates'}
  ];
  var SKIP={terreno:1,contencion:1,losas:1,detalle:1};
  var ORDER=[],LOF={};LV.forEach(function(l,i){l.k.forEach(function(k){ORDER.push(k);LOF[k]=i})});

  /* planos de recorte de la entrada: uno para las líneas y otro, más atrás, para la masa */
  var pLine=new THREE.Plane(new THREE.Vector3(0,-1,0),-1e4),pFill=new THREE.Plane(new THREE.Vector3(0,-1,0),-1e4);
  function mat(c,r,m){return new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m||0,side:THREE.DoubleSide,clippingPlanes:[pFill]})}
  var MAT={
    terreno:mat(0xc3cacf,1),
    cimentacion:mat(0xa7b0b6,.95),
    losas:mat(0xd2d8dc,.95),
    contencion:mat(0x9aa4ab,1),
    detalle:mat(0x7d8890,.8,.05),
    estructura:mat(0x6c7780,.7,.05),
    entrepiso:mat(0xb1b9bf,.85),
    muros:mat(0xe7eaec,.92),
    carpinteria:new THREE.MeshPhysicalMaterial({color:0x9db0be,roughness:.12,metalness:0,transparent:true,opacity:.34,depthWrite:false,side:THREE.DoubleSide,clippingPlanes:[pFill]}),
    cubierta:mat(0x2b3138,.55,.25)
  };
  var EDGE={terreno:0,cimentacion:.34,losas:.16,contencion:.22,detalle:.3,estructura:.42,entrepiso:.2,muros:.38,carpinteria:0,cubierta:0};
  var base={},edges={},bcol={};Object.keys(MAT).forEach(function(k){base[k]={o:MAT[k].opacity,t:MAT[k].transparent,w:MAT[k].depthWrite};bcol[k]=MAT[k].color.clone();edges[k]=[]});
  var alpha={},fo={},foT={},tint={},tintT={};ORDER.forEach(function(k){alpha[k]=1;fo[k]=1;foT[k]=1;tint[k]=0;tintT[k]=0});
  var focusOn=null,lift=[0,0,0,0];

  var groups={},hb=1,ctr=new THREE.Vector3(),size=new THREE.Vector3(),home={},ready=false;
  var ex={v:0,to:0};
  var listeners=[];
  var lvBox=[],lvOff=[0,0,0,0],lvCtr=[0,0,0,0],foot=null,stackTop=0,lowY=0,guides=null,plates=[],pick=[],shadow=null,ring=null;
  function emit(s){listeners.forEach(function(f){f(s)})}

  function resize(){
    var w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();fit();
  }
  function fit(){
    if(!ready)return;
    var asp=camera.aspect,t=Math.tan(THREE.MathUtils.degToRad(camera.fov/2)),r=Math.max(size.x,size.z)*.5;
    /* cerrado: el volumen ocupa cerca de la mitad de la altura y cabe a lo ancho en pantallas angostas */
    home.d=Math.max((r*1.72)/t,(r*1.9)/(t*Math.max(.3,asp)));
    /* abierto: alto de la pila y radio en planta, vistos a unos 20° */
    var el=THREE.MathUtils.degToRad(20),rxz=Math.hypot(size.x,size.z)*.5*.92;
    var halfV=((stackTop-lowY)*.5*Math.cos(el)+rxz*Math.sin(el))*1.12,halfH=rxz*1.05;
    home.dx=Math.max(home.d*1.02,halfV/t,halfH/(t*Math.max(.3,asp)));
  }
  var PHI_EX=THREE.MathUtils.degToRad(72),lastE=0;
  function placeCamera(snapPhi){
    var e=ex.v;e=e*e*(3-2*e);
    var d=home.d+(home.dx-home.d)*e;
    var dir=new THREE.Vector3().subVectors(camera.position,controls.target);if(dir.lengthSq()<1e-6)dir.set(.62,.5,.86);
    dir.normalize();
    /* el ángulo de vista sigue a la barra solo mientras se mueve; fuera de eso lo manda el usuario */
    if(Math.abs(e-lastE)>1e-4||snapPhi){
      var sp=new THREE.Spherical().setFromVector3(dir),to=home.phi+(PHI_EX-home.phi)*e;
      sp.phi=snapPhi?to:sp.phi+(to-sp.phi)*.2;dir.setFromSpherical(sp);
    }
    lastE=e;
    var yH=ctr.y+hb*.1-home.d*.04,yX=(lowY+stackTop)*.5-hb*.04;
    controls.target.set(ctr.x,yH+(yX-yH)*e,ctr.z);
    camera.position.copy(controls.target).addScaledVector(dir,d);
  }

  /* ---- carga ---- */
  function load(url,onProgress){
    return new Promise(function(res,rej){
      function done(g){
        var root=g.scene,box=new THREE.Box3();
        ORDER.forEach(function(k){
          var n=root.getObjectByName(k);if(!n)return;
          var grp=new THREE.Group();grp.name=k;
          var meshes=[];n.traverse(function(o){if(o.isMesh)meshes.push(o)});
          meshes.forEach(function(o){
            o.material=MAT[k];o.userData.lv=LOF[k];
            var em=new THREE.LineBasicMaterial({color:INK,transparent:true,opacity:0,clippingPlanes:[pLine]});
            edges[k].push({m:em,o:EDGE[k]||0});
            if(k!=='terreno'){var e=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,32),em);e.userData.edge=true;o.add(e)}
            grp.add(o);pick.push(o);
          });
          scene.add(grp);groups[k]=grp;
        });
        if(!Object.keys(groups).length){rej(new Error('modelo vacío'));return}
        var gb={};Object.keys(groups).forEach(function(k){gb[k]=new THREE.Box3().setFromObject(groups[k])});
        ['cimentacion','estructura','entrepiso','muros','carpinteria','cubierta'].forEach(function(k){if(gb[k])box.union(gb[k])});
        LV.forEach(function(l,i){
          var b=new THREE.Box3();
          l.k.forEach(function(k){if(gb[k]&&!SKIP[k])b.union(gb[k])});
          if(b.isEmpty()&&gb[l.k[0]])b.union(gb[l.k[0]]);
          lvBox[i]=b;
        });
        var all=new THREE.Box3();Object.keys(groups).forEach(function(k){all.union(gb[k])});
        all.getSize(size);all.getCenter(ctr);
        hb=Math.max(2,box.max.y-box.min.y);
        ctr.y=box.min.y+(box.max.y-box.min.y)*.5;
        var bb=new THREE.Box3();['estructura','muros','cubierta'].forEach(function(k){if(gb[k])bb.union(gb[k])});
        foot={x0:bb.min.x,x1:bb.max.x,z0:bb.min.z,z1:bb.max.z};
        /* separación entre niveles al abrir: amplia y pareja, para que cada grupo se lea por separado */
        var gap=hb*.34,slab=hb*.14,top=(lvBox[0].isEmpty()?0:lvBox[0].max.y)+slab;
        for(var i=1;i<4;i++){
          lvOff[i]=top+gap-lvBox[i].min.y;
          top=lvBox[i].max.y+lvOff[i];
        }
        stackTop=top;lowY=all.min.y;
        for(i=0;i<4;i++){lvCtr[i]=(lvBox[i].min.y+lvBox[i].max.y)*.5}
        /* anillo de apoyo y sombra de contacto: el modelo apoya sobre el papel */
        var R=Math.max(size.x,size.z)*.7,seg=[],N=120;
        for(i=0;i<N;i++){var a=i/N*Math.PI*2,b2=(i+1)/N*Math.PI*2;seg.push(Math.cos(a)*R,0,Math.sin(a)*R,Math.cos(b2)*R,0,Math.sin(b2)*R)}
        var rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.Float32BufferAttribute(seg,3));
        ring=new THREE.LineSegments(rg,new THREE.LineBasicMaterial({color:INK,transparent:true,opacity:.2}));
        ring.position.set(ctr.x,all.min.y-hb*.04,ctr.z);scene.add(ring);
        var cv=document.createElement('canvas');cv.width=cv.height=256;var cx=cv.getContext('2d'),gr=cx.createRadialGradient(128,128,0,128,128,128);
        gr.addColorStop(0,'rgba(20,24,28,.27)');gr.addColorStop(.55,'rgba(20,24,28,.12)');gr.addColorStop(1,'rgba(20,24,28,0)');cx.fillStyle=gr;cx.fillRect(0,0,256,256);
        var tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
        shadow=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,toneMapped:false,opacity:0}));
        shadow.rotation.x=-Math.PI/2;shadow.scale.setScalar(R*3.1);shadow.position.set(ctr.x,all.min.y-hb*.041,ctr.z);shadow.renderOrder=-1;scene.add(shadow);
        /* marcos de nivel y guías verticales, en tinta fina */
        var pm=new THREE.LineBasicMaterial({color:INK,transparent:true,opacity:0});
        for(i=1;i<4;i++){
          var y0=lvBox[i].min.y-hb*.01,p=[foot.x0,y0,foot.z0,foot.x1,y0,foot.z0,foot.x1,y0,foot.z1,foot.x0,y0,foot.z1];
          var pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
          var lp=new THREE.LineLoop(pg,pm);lp.visible=false;scene.add(lp);plates[i]=lp;
        }
        var gm=new THREE.LineDashedMaterial({color:INK,transparent:true,opacity:0,dashSize:hb*.05,gapSize:hb*.04});
        var gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(new Array(24).fill(0),3));
        guides=new THREE.LineSegments(gg,gm);guides.visible=false;guides.frustumCulled=false;scene.add(guides);guides.userData.m=gm;plates.m=pm;
        var L=Math.max(size.x,size.z);
        sun.position.set(ctr.x-L*.5,stackTop+L*.5,ctr.z+L*.6);sun.target.position.copy(ctr);
        fill.position.set(ctr.x+L*.8,all.max.y*.6+hb,ctr.z-L*.6);fill.target=sun.target;
        ready=true;
        /* estado inicial: nada visible hasta que corra la entrada (o todo, si no hay entrada) */
        if(still||reduce){pLine.constant=pFill.constant=1e4;if(shadow)shadow.material.opacity=1}
        else{pLine.constant=pFill.constant=lowY-1}
        ORDER.forEach(function(k){if(groups[k])paint(k)});
        fit();
        camera.position.set(ctr.x+home.d*.62,ctr.y+home.d*.42,ctr.z+home.d*.86);
        home.phi=new THREE.Spherical().setFromVector3(camera.position.clone().sub(new THREE.Vector3(ctr.x,ctr.y,ctr.z))).phi;
        controls.target.set(ctr.x,ctr.y,ctr.z);placeCamera(true);controls.update();
        applyExplode();
        res({size:size.clone()});
      }
      function fromB64(){
        return fetch(url+'.txt').then(function(r){if(!r.ok)throw new Error('modelo no disponible');return r.text()}).then(function(t){
          var bin=atob(t.trim()),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u.buffer});
      }
      new GLTFLoader().load(url,done,function(e){if(onProgress&&e.total)onProgress(e.loaded/e.total)},function(){
        fromB64().then(function(buf){new GLTFLoader().parse(buf,'',done,rej)}).catch(rej);
      });
    });
  }

  /* ---- entrada: líneas que suben, masa que las sigue ---- */
  var intro=null,dbgT=null;
  function startIntro(){
    if(!ready||intro)return;
    if(still||reduce){pLine.constant=pFill.constant=1e4;if(shadow)shadow.material.opacity=1;emit({intro:'done'});return}
    intro={t0:performance.now(),dur:3300,top:all_top()+hb*.04};
    controls.autoRotate=true;controls.autoRotateSpeed=1.1;
  }
  function all_top(){var m=-1e9;ORDER.forEach(function(k){if(groups[k]){var b=new THREE.Box3().setFromObject(groups[k]);if(b.max.y>m)m=b.max.y}});return m}
  function ease3(x){x=x<0?0:x>1?1:x;return x*x*(3-2*x)}
  function stepIntro(now){
    if(!intro)return false;
    var t=(dbgT!==null)?dbgT:now-intro.t0,H=intro.top-lowY;
    var a=ease3(t/1900),b=ease3((t-950)/1900);
    pLine.constant=lowY+H*a+(a>=1?1e4:0);pFill.constant=lowY+H*b+(b>=1?1e4:0);
    /* las líneas se aclaran al final, cuando la masa ya cubrió todo */
    var kLine=1-ease3((t-2300)/900);
    ORDER.forEach(function(k){(edges[k]||[]).forEach(function(x){x.m.opacity=x.o+(.7-x.o)*kLine})});
    if(shadow)shadow.material.opacity=ease3((t-700)/1800);
    if(ring)ring.material.opacity=.2*ease3((t-300)/1500);
    if(t>=intro.dur&&dbgT===null){
      intro=null;pLine.constant=pFill.constant=1e4;ORDER.forEach(function(k){if(groups[k])paint(k)});
      controls.autoRotateSpeed=.7;emit({intro:'done'});
    }
    return true;
  }

  /* ---- opacidad y color: foco ---- */
  function paint(k){
    var m=MAT[k],b=base[k],f=alpha[k]*fo[k];
    if(f>=.999){m.opacity=b.o;m.transparent=b.t;m.depthWrite=b.w}
    else{m.transparent=true;m.depthWrite=false;m.opacity=b.o*f}
    m.color.copy(bcol[k]).lerp(ACC,tint[k]);
    if(!intro)(edges[k]||[]).forEach(function(x){x.m.opacity=x.o*f});
  }
  function focus(i){
    i=(i===null||i===undefined)?null:i;
    if(i===focusOn)return;
    focusOn=i;
    ORDER.forEach(function(k){var on=(focusOn===null||LOF[k]===focusOn);foT[k]=on?1:.1;tintT[k]=(focusOn!==null&&LOF[k]===focusOn)?.9:0});
    emit({focus:focusOn});
  }
  function stepFocus(){
    var ch=false;
    ORDER.forEach(function(k){if(!groups[k])return;
      var d=foT[k]-fo[k],dt=tintT[k]-tint[k];
      if(Math.abs(d)>.002||Math.abs(dt)>.002){fo[k]+=d*.18;tint[k]+=dt*.18;ch=true;paint(k)}
      else if(fo[k]!==foT[k]||tint[k]!==tintT[k]){fo[k]=foT[k];tint[k]=tintT[k];ch=true;paint(k)}
    });
    for(var i=0;i<4;i++){var lt=(focusOn===i)?hb*.045:0;if(Math.abs(lt-lift[i])>hb*.0004){lift[i]+=(lt-lift[i])*.2;ch=true}else lift[i]=lt}
    if(ch)applyExplode();
    return ch;
  }

  /* ---- explosión ---- */
  function applyExplode(){
    var e=ex.v;e=e*e*(3-2*e);
    ORDER.forEach(function(k){var g=groups[k];if(!g)return;g.position.y=lvOff[LOF[k]]*e+lift[LOF[k]]*e});
    for(var i=1;i<4;i++){var p=plates[i];if(!p)continue;p.visible=e>.01;p.position.y=lvOff[i]*e}
    if(plates.m)plates.m.opacity=.3*e;
    if(guides){
      guides.visible=e>.01;guides.userData.m.opacity=.34*e;
      var a=guides.geometry.attributes.position,y1=stackTop*e+lvBox[3].max.y*(1-e);
      var cs=[[foot.x0,foot.z0],[foot.x1,foot.z0],[foot.x1,foot.z1],[foot.x0,foot.z1]];
      for(var j=0;j<4;j++){a.setXYZ(j*2,cs[j][0],0,cs[j][1]);a.setXYZ(j*2+1,cs[j][0],y1,cs[j][1])}
      a.needsUpdate=true;guides.computeLineDistances();
    }
  }
  function setExplode(v){
    v=v<0?0:v>1?1:v;ex.to=v;
    if(reduce){ex.v=v;applyExplode();placeCamera(true);controls.update()}
    emit({explode:v});
  }

  /* ---- selección con el puntero (solo si el modelo está abierto) ---- */
  var ray=new THREE.Raycaster(),mv=new THREE.Vector2(),ptr={x:0,y:0,dirty:false,in:false,touch:false},dragging=false,lastRay=0,hoverLv=null;
  function hit(){
    var r=canvas.getBoundingClientRect();
    mv.set(((ptr.x-r.left)/r.width)*2-1,-((ptr.y-r.top)/r.height)*2+1);
    ray.setFromCamera(mv,camera);
    var h=ray.intersectObjects(pick,false);
    for(var i=0;i<h.length;i++){if(h[i].object.visible!==false&&h[i].object.parent&&h[i].object.parent.visible!==false)return h[i].object.userData.lv}
    return null;
  }
  function tip(i){
    if(!tipEl)return;
    if(i===null||i===undefined){tipEl.hidden=true;return}
    tipEl.firstElementChild.textContent=(i+1)+' · '+LV[i].t;tipEl.lastElementChild.textContent=LV[i].s;tipEl.hidden=false;placeTip();
  }
  function placeTip(){
    if(!tipEl||tipEl.hidden)return;
    var r=stage.getBoundingClientRect(),w=tipEl.offsetWidth,h=tipEl.offsetHeight;
    var x=ptr.x-r.left+16,y=ptr.y-r.top+16;
    if(x+w>r.width-10)x=ptr.x-r.left-w-16;
    if(y+h>r.height-10)y=ptr.y-r.top-h-16;
    tipEl.style.transform='translate('+Math.max(8,x).toFixed(0)+'px,'+Math.max(8,y).toFixed(0)+'px)';
  }
  var open=function(){return ex.v>.05};
  canvas.addEventListener('pointermove',function(e){
    ptr.x=e.clientX;ptr.y=e.clientY;ptr.touch=e.pointerType!=='mouse';
    if(ptr.touch)return;
    ptr.in=true;ptr.dirty=true;placeTip();
  });
  canvas.addEventListener('pointerleave',function(){ptr.in=false;ptr.dirty=false;if(hoverLv!==null){hoverLv=null;focus(null);tip(null)}});
  var down=null;
  canvas.addEventListener('pointerdown',function(e){down={x:e.clientX,y:e.clientY}});
  canvas.addEventListener('pointerup',function(e){
    if(!down||e.pointerType==='mouse'){down=null;return}
    var mvd=Math.hypot(e.clientX-down.x,e.clientY-down.y);down=null;
    if(mvd>8)return;
    if(!open()){focus(null);tip(null);return}
    ptr.x=e.clientX;ptr.y=e.clientY;
    var i=hit();hoverLv=(i===focusOn)?null:i;focus(hoverLv);tip(hoverLv);
  });
  function stepHover(now){
    if(!ptr.dirty||dragging)return;
    if(now-lastRay<60)return;lastRay=now;ptr.dirty=false;
    var i=open()&&ptr.in?hit():null;
    if(i!==hoverLv){hoverLv=i;focus(i);tip(i)}
  }
  /* el cierre de la barra apaga cualquier aislamiento */
  function closeFocus(){if(!open()){hoverLv=null;if(focusOn!==null)focus(null);tip(null)}}

  /* ---- bucle ---- */
  var vis=true,hid=false,last=0,raf=0,autoOK=!reduce;
  function frame(now){
    raf=requestAnimationFrame(frame);
    if(!ready||!vis||hid)return;
    stepIntro(now);stepFocus();stepHover(now);
    if(Math.abs(ex.to-ex.v)>.0008){ex.v+=(ex.to-ex.v)*Math.min(1,.1*(now-last||16)/16);applyExplode();placeCamera(false);closeFocus()}
    else if(ex.v!==ex.to){ex.v=ex.to;applyExplode();placeCamera(false);closeFocus()}
    if(!intro)controls.autoRotate=autoOK&&ex.v<.03&&focusOn===null;
    controls.update();renderer.render(scene,camera);last=now;
  }
  new IntersectionObserver(function(en){vis=en[0].isIntersecting}).observe(stage);
  document.addEventListener('visibilitychange',function(){hid=document.hidden});
  window.addEventListener('resize',resize);
  var rt=0;
  controls.addEventListener('start',function(){dragging=true;autoOK=false;clearTimeout(rt)});
  controls.addEventListener('end',function(){dragging=false;ptr.dirty=ptr.in;clearTimeout(rt);if(!reduce)rt=setTimeout(function(){autoOK=true},3600)});
  resize();raf=requestAnimationFrame(frame);

  return {load:load,intro:startIntro,setExplode:setExplode,focus:focus,levels:LV,on:function(f){listeners.push(f)},
    value:function(){return ex.to},dbg:function(t){dbgT=t},
    snap:function(){placeCamera(true);controls.update();renderer.render(scene,camera);return canvas.toDataURL('image/png')},
    render:function(){if(ready){placeCamera(true);controls.update();renderer.render(scene,camera)}},
    destroy:function(){cancelAnimationFrame(raf);renderer.dispose()}};
}
