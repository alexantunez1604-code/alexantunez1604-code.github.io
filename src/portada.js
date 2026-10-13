/* Portada con modelo 3D (Pumarrinri) y método en cinco etapas (Puckllay). */
var $=function(i){return document.getElementById(i)};
function cl(x){return x<0?0:x>1?1:x}

/* ---------------- portada ---------------- */
export function initHero(o){
  var reduce=o.reduce;
  var stage=$('h3stage');if(!stage)return;
  var cv=$('h3cv'),view=$('h3view'),rail=$('xrail'),knob=$('xknob'),fillEl=$('xfill'),lvEl=$('xlv'),barEl=$('xbar'),tip=$('h3tip'),ov=document.querySelector('.hx-ov'),H=null,v=0,lis=[];

  /* barra superior mínima mientras se ve la portada: solo el nombre y "Menú" */
  var body=document.body,btn=$('mnBtn'),mnu=$('mnu');
  new IntersectionObserver(function(en){body.classList.toggle('hero-top',en[0].isIntersecting)},{rootMargin:'-70px 0px 0px 0px'}).observe(document.querySelector('.hero'));
  function mnuSet(on){if(!mnu)return;mnu.hidden=!on;btn.setAttribute('aria-expanded',on?'true':'false');body.classList.toggle('mnu-open',on)}
  if(btn&&mnu){
    btn.addEventListener('click',function(e){e.stopPropagation();mnuSet(mnu.hidden)});
    mnu.addEventListener('click',function(e){if(e.target.closest('a'))mnuSet(false)});
    document.addEventListener('click',function(e){if(!mnu.hidden&&!mnu.contains(e.target))mnuSet(false)});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!mnu.hidden){mnuSet(false);btn.focus()}});
    window.addEventListener('scroll',function(){if(!mnu.hidden&&!body.classList.contains('hero-top'))mnuSet(false)},{passive:true});
  }

  /* sin WebGL se queda el póster */
  var gl=null;try{var t=document.createElement('canvas');gl=t.getContext('webgl2')||t.getContext('webgl')}catch(e){}
  function off(){stage.classList.remove('gl');stage.classList.add('off');if(barEl)barEl.hidden=true}
  if(!gl){off();return}
  stage.classList.add('gl');

  /* barra vertical: arrastrarla hacia arriba abre el modelo */
  function setV(x,fromUser){
    x=x<0?0:x>1?1:x;v=x;
    knob.style.bottom='calc('+(x*100).toFixed(2)+'% - 8px)';fillEl.style.height=(x*100).toFixed(2)+'%';
    rail.setAttribute('aria-valuenow',Math.round(x*100));
    barEl.classList.toggle('open',x>.05);ov.classList.toggle('xo',x>.05);
    if(fromUser)barEl.classList.remove('nudge');
    if(H)H.setExplode(x);
  }
  function fromY(y){var r=rail.getBoundingClientRect();return 1-(y-r.top)/r.height}
  var drag=false;
  rail.addEventListener('pointerdown',function(e){drag=true;rail.setPointerCapture(e.pointerId);barEl.classList.add('drag');setV(fromY(e.clientY),true);e.preventDefault()});
  rail.addEventListener('pointermove',function(e){if(drag)setV(fromY(e.clientY),true)});
  function endDrag(e){if(!drag)return;drag=false;barEl.classList.remove('drag');try{rail.releasePointerCapture(e.pointerId)}catch(x){}}
  rail.addEventListener('pointerup',endDrag);rail.addEventListener('pointercancel',endDrag);
  rail.addEventListener('keydown',function(e){
    var k=e.key,d=0;
    if(k==='ArrowUp'||k==='ArrowRight')d=.1;else if(k==='ArrowDown'||k==='ArrowLeft')d=-.1;else if(k==='PageUp')d=.3;else if(k==='PageDown')d=-.3;
    else if(k==='Home'){setV(0,true);e.preventDefault();return}else if(k==='End'){setV(1,true);e.preventDefault();return}
    if(d){setV(v+d,true);e.preventDefault()}
  });

  function start(){
    import('./hero3d.js').then(function(m){
      H=m.createHero({stage:view,canvas:cv,reduce:reduce,tip:tip,still:!!import.meta.env.VITE_DEBUG&&/[?&]snap/.test(location.search)});
      if(import.meta.env.VITE_DEBUG&&/[?&](snap|dbg)/.test(location.search))window.__h3=H;
      /* niveles en el margen de la barra, de abajo hacia arriba */
      lvEl.textContent='';
      H.levels.forEach(function(l,i){
        var li=document.createElement('li');
        li.innerHTML='<button type="button"><b>0'+(i+1)+'</b><em>'+l.t+'</em></button><small>'+l.s+'</small>';
        var b=li.firstChild;
        b.addEventListener('mouseenter',function(){if(v>.05)H.focus(i)});b.addEventListener('mouseleave',function(){H.focus(null)});
        b.addEventListener('focus',function(){if(v>.05)H.focus(i)});b.addEventListener('blur',function(){H.focus(null)});
        b.addEventListener('click',function(){if(v>.05)H.focus(i)});
        lvEl.appendChild(li);lis[i]=li;
      });
      H.on(function(s){
        if(s.focus!==undefined){lis.forEach(function(li,j){li.classList.toggle('f',s.focus===j);li.classList.toggle('dim',s.focus!==null&&s.focus!==j)});barEl.classList.toggle('foc',s.focus!==null)}
        if(s.intro==='done'){barEl.classList.add('ready');if(!reduce&&v<.01)barEl.classList.add('nudge')}
      });
      return H.load('models/pumarrinri-modulo.glb');
    }).then(function(){
      stage.classList.add('on');H.render();
      barEl.classList.add('show');
      H.intro();
      if(v>0)H.setExplode(v);
    }).catch(function(e){console.warn('modelo 3D no disponible',e);off()});
  }
  /* se carga después de pintar la portada, para que el texto aparezca primero */
  var go=function(){setTimeout(start,reduce?200:120)};
  if(document.readyState==='complete')go();else window.addEventListener('load',go,{once:true});
}

/* ---------------- método: cinco hojas sobre una plancha ---------------- */
export function initEtapas(o){
  var gsap=o.gsap,ScrollTrigger=o.ScrollTrigger,reduce=o.reduce;
  var etp=$('etp');if(!etp)return;
  var layers=[].slice.call(etp.querySelectorAll('.pl-st')),scan=etp.querySelector('.pl-scan'),stamp=etp.querySelector('.pl-stamp'),
      lis=[].slice.call(etp.querySelectorAll('#etNav li')),btns=[].slice.call(etp.querySelectorAll('#etNav button')),
      pairs=[].slice.call(etp.querySelectorAll('.pl-pairs .pr')),pt=[],items=[].slice.call(etp.querySelectorAll('.cj-r')),
      crs=[].slice.call(etp.querySelectorAll('.pl-draw .cr')),nums=[].slice.call(etp.querySelectorAll('[data-c]')),
      more=$('etMore'),fi=$('etFicha'),xb=$('etClose'),
      S=layers.length,AT=[.05,1.5,2.5,3.5,4.5],ST_=[0,1.1,2.1,3.1,4.1,5],st=null,mode='',cur=-1,intro=null,introW=0,done=false,lastS=0,io=null;
  var mq=matchMedia('(min-width:720px) and (min-height:480px)');

  /* ficha completa: se despliega sobre el cajetín (escritorio) o debajo (apilado) */
  function setFi(on){
    fi.classList.toggle('open',on);more.setAttribute('aria-expanded',on?'true':'false');
    fi.setAttribute('aria-hidden',on?'false':'true');xb.tabIndex=on?0:-1;
  }
  more.addEventListener('click',function(){setFi(!fi.classList.contains('open'))});
  xb.addEventListener('click',function(){setFi(false);more.focus()});
  etp.addEventListener('keydown',function(e){if(e.key==='Escape'&&fi.classList.contains('open')){setFi(false);more.focus()}});

  /* plano y obra: el par se marca al pasar el cursor, y una vez al llegar a la etapa */
  function hl(k){pairs.forEach(function(p,j){p.classList.toggle('hl',j===k)})}
  function clearP(){pt.forEach(function(t){t.kill()});pt=[]}
  function runPairs(){clearP();if(reduce||mode!=='pin')return;pt.push(gsap.delayedCall(1.3,function(){hl(0)}),gsap.delayedCall(2.7,function(){hl(1)}),gsap.delayedCall(4.1,function(){hl(-1)}))}
  pairs.forEach(function(p,k){p.addEventListener('mouseenter',function(){clearP();hl(k)});p.addEventListener('mouseleave',function(){hl(-1)})});

  function toStage(i){
    if(st){
      var y=st.start+(AT[i]/S)*(st.end-st.start);
      if(window.__lenis)window.__lenis.scrollTo(y,{duration:1.2});else window.scrollTo({top:y,behavior:'smooth'});
    }else layers[i].scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
  }
  btns.forEach(function(b){b.addEventListener('click',function(){toStage(+b.dataset.i)})});

  function fmt(el,v){var d=+(el.dataset.d||0);el.textContent=(d?v.toFixed(d):Math.round(v)+'').replace('.',',')}
  function finals(){nums.forEach(function(el){fmt(el,+el.dataset.c)})}
  function wipe(k,s){return k===0?introW:cl((s-(k-.25))/.7)}

  /* cada etapa es una hoja que entra volando desde abajo a la derecha, se asienta y queda apilada bajo la siguiente */
  function render(s){
    var k,e=[],eo=[];
    lastS=s;
    for(k=0;k<S;k++){e[k]=wipe(k,s);eo[k]=1-Math.pow(1-e[k],3)}
    for(k=0;k<S;k++){
      var L=layers[k];
      if(e[k]<=0){L.style.visibility='hidden';L.classList.remove('bk');continue}
      var d=0,j;for(j=k+1;j<S;j++)d+=eo[j];
      var en=1-eo[k],lift=4*eo[k]*(1-eo[k]);
      L.style.visibility='visible';
      L.style.opacity=Math.min(1,eo[k]*3).toFixed(3);
      L.style.transform='translate(calc('+(en*58).toFixed(2)+'% - '+(d*18).toFixed(1)+'px),calc('+(en*16).toFixed(2)+'% - '+(d*24).toFixed(1)+'px)) rotate('+(en*5.5).toFixed(2)+'deg) scale(1)';
      L.style.setProperty('--lift',lift.toFixed(3));
      L.style.setProperty('--en',en.toFixed(3));
      L.style.setProperty('--en2',Math.min(1,en*1.6).toFixed(3));
      L.style.setProperty('--dim',Math.min(d,2.2).toFixed(3));
      
    }
    if(scan)scan.style.opacity=0;
    var i=s<ST_[1]?0:s<ST_[2]?1:s<ST_[3]?2:s<ST_[4]?3:4;
    if(i!==cur){
      cur=i;
      lis.forEach(function(li,k2){li.classList.toggle('on',k2===i);li.classList.toggle('ok',k2<i)});
      btns.forEach(function(b,k2){b.setAttribute('aria-pressed',k2===i?'true':'false')});
      if(fi.classList.contains('open'))setFi(false);
      if(i===3)runPairs();else{clearP();hl(-1)}
    }
    lis.forEach(function(li,k2){var f=k2<i?1:k2>i?0:cl((s-ST_[k2])/(ST_[k2+1]-ST_[k2]));li.style.setProperty('--f',f.toFixed(3))});
    if(stamp)stamp.classList.toggle('on',s>S-.55);
  }

  /* entrada: el marco, el cajetín fila por fila, las cifras y el barrido del boceto */
  function hideForIntro(){
    introW=0;gsap.set(items,{opacity:0,y:14});gsap.set(crs,{opacity:0});
    nums.forEach(function(el){el.textContent='0'});
  }
  function playIntro(){
    if(intro||done)return;
    var proxy={w:0};
    intro=gsap.timeline({defaults:{ease:'power3.out'},onComplete:function(){done=true;render(lastS)}});
    intro.to(crs,{opacity:1,duration:.5,stagger:.06},0)
      .to(items,{opacity:1,y:0,duration:.7,stagger:.1,clearProps:'opacity,transform'},.1)
      .to(proxy,{w:1,duration:1.6,ease:'power2.inOut',onUpdate:function(){introW=proxy.w;render(lastS)}},.35);
    nums.forEach(function(el){var c={v:0},tgt=+el.dataset.c;intro.to(c,{v:tgt,duration:1.5,ease:'power2.out',onUpdate:function(){fmt(el,c.v)}},.5)});
  }
  function finishIntro(){
    if(done)return;
    if(intro){intro.progress(1)}
    else{gsap.set(items,{clearProps:'opacity,transform'});gsap.set(crs,{opacity:1});finals();introW=1;render(lastS)}
    done=true;
  }

  function clear(){
    layers.forEach(function(L){L.style.cssText='';L.classList.remove('bk','in')});
    if(scan)scan.style.cssText='';
    if(stamp)stamp.classList.remove('on');
    gsap.set(items,{clearProps:'opacity,transform'});gsap.set(crs,{clearProps:'opacity'});
    lis.forEach(function(li){li.style.removeProperty('--f');li.classList.remove('ok')});
    finals();
  }

  function setMode(m){
    if(m===mode)return;mode=m;
    if(st){st.kill();st=null}
    if(io){io.disconnect();io=null}
    if(intro){intro.kill();intro=null}
    clear();cur=-1;clearP();hl(-1);setFi(false);done=false;
    if(m==='pin'){
      etp.classList.add('pin');etp.classList.remove('flat');
      if(reduce){finishIntro()}else{hideForIntro();render(0)}
      st=ScrollTrigger.create({trigger:etp,start:'top 72',end:'+='+(S*750),pin:true,anticipatePin:1,scrub:.5,refreshPriority:10,
        onUpdate:function(t){if(t.progress>0&&!done)finishIntro();render(t.progress*S)}});
      if(!reduce)ScrollTrigger.create({trigger:etp,start:'top 82%',once:true,onEnter:playIntro});
    }else{
      etp.classList.add('flat');etp.classList.remove('pin');
      done=true;
      if(!reduce&&'IntersectionObserver' in window){
        io=new IntersectionObserver(function(en){en.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -12% 0px'});
        layers.forEach(function(L){io.observe(L)});
      }else layers.forEach(function(L){L.classList.add('in')});
    }
  }
  function decide(){setMode(mq.matches?'pin':'flat')}
  decide();
  (mq.addEventListener?mq.addEventListener('change',function(){decide();ScrollTrigger.refresh()}):mq.addListener(function(){decide();ScrollTrigger.refresh()}));
}
