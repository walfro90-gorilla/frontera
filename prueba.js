// Prueba de humo del juego.  Uso:  node prueba.js   (DEBUG=1 para traza)
//
// Stubea THREE y el DOM lo justo para correr el script de index.html en Node y
// jugarlo solo: arranca, camina, dispara, se sube a carros y recorre los cuatro
// actos. Verifica que no truene ningún cuadro y que los sistemas de verdad se
// muevan (encargos, actos, calor, persecución, arresto).
//
// No reemplaza abrir el juego: no hay GPU aquí, así que nada de esto prueba que
// se vea bien. Prueba que la simulación no se rompa.
//
// Depende de la costura window.__frontera que index.html solo expone con #test.
const fs=require('fs'), path=require('path');
const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
const src=html.match(/<script>([\s\S]*?)<\/script>/)[1];

const g2d=()=>new Proxy({},{ get:(t,k)=>{
  if(k==='createRadialGradient'||k==='createLinearGradient')return ()=>({addColorStop(){}});
  if(k==='measureText')return ()=>({width:10});
  if(typeof k==='string'&&!(k in t))return ()=>{};
  return t[k];
}, set:()=>true });

const mkCanvas=()=>({width:0,height:0,getContext:()=>g2d(),
  addEventListener(){},querySelector:()=>({style:{}}),getBoundingClientRect:()=>({left:0,top:0,width:100,height:100}),
  style:{},classList:{add(){},remove(){},toggle(){}}});

const V3=class{constructor(x,y,z){this.x=x||0;this.y=y||0;this.z=z||0;}
  set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}};
const Obj=class{constructor(){this.position=new V3();this.rotation=new V3();
  this.scale=new V3(1,1,1);this.children=[];this.userData={};this.visible=true;}
  add(...o){this.children.push(...o);return this;}
  remove(){return this;}
  lookAt(){}
  updateProjectionMatrix(){}};
const Geo=class{constructor(){}translate(){return this;}};
const Mat=class{constructor(o){Object.assign(this,o||{});
  if(this.map&&!this.map.repeat)this.map.repeat={set(){}};
  this.color=new THREE.Color(o&&o.color);          // THREE real siempre expone un Color
  this.emissive=new THREE.Color(o&&o.emissive);}};

let assertFails=0;
const THREE={
  WebGLRenderer:class{constructor(){this.outputEncoding=0;}setPixelRatio(){}setSize(){}render(){}},
  PerspectiveCamera:class extends Obj{constructor(){super();this.aspect=1;}},
  Scene:class extends Obj{},
  Group:class extends Obj{},
  Mesh:class extends Obj{constructor(geo,mat){super();this.geometry=geo||new Geo();
    this.material=Array.isArray(mat)?mat[0]:(mat||new Mat());}},
  HemisphereLight:class extends Obj{constructor(){super();this.intensity=1;}},
  DirectionalLight:class extends Obj{constructor(){super();this.intensity=1;}},
  Fog:class{constructor(c,n,f){this.color=new THREE.Color(c);this.near=n;this.far=f;}},
  Color:class{constructor(h){this.h=h;}lerp(){return this;}setHex(h){this.h=h;return this;}},
  Vector3:V3,
  BoxGeometry:Geo,PlaneGeometry:Geo,CylinderGeometry:Geo,ConeGeometry:Geo,
  SphereGeometry:Geo,RingGeometry:Geo,
  CanvasTexture:class{constructor(){this.repeat={set(){}};this.wrapS=0;this.wrapT=0;this.anisotropy=1;}
    clone(){return new THREE.CanvasTexture();}},
  MeshLambertMaterial:Mat,MeshBasicMaterial:Mat,
  RepeatWrapping:1,DoubleSide:2,sRGBEncoding:3,
};

const handlers={};
const els={};
const el=id=>{
  if(els[id])return els[id];
  const cls=new Set();
  return els[id]={id,style:{},textContent:'',innerHTML:'',__cls:cls,
    classList:{add:c=>cls.add(c),remove:c=>cls.delete(c),
      toggle:(c,v)=>{v?cls.add(c):cls.delete(c);}},
    addEventListener(ev,fn){handlers[id+':'+ev]=fn;},
    querySelector:s=>el(id+' '+s),
    getBoundingClientRect:()=>({left:0,top:0,width:100,height:100}),
    setPointerCapture(){},width:176,height:176,getContext:()=>g2d()};
};

const temporizadores=[];
let ahora=0;
const sandbox={
  THREE,
  document:{getElementById:id=>id==='c'?Object.assign(mkCanvas(),el(id)):el(id),
    querySelector:s=>el(s),createElement:()=>mkCanvas()},
  window:{AudioContext:undefined},
  addEventListener(ev,fn){handlers['win:'+ev]=fn;},
  matchMedia:()=>({matches:false}),
  devicePixelRatio:1,innerWidth:1280,innerHeight:720,
  location:{hash:'#test',reload(){}},
  performance,
  setTimeout:(fn,ms)=>{temporizadores.push({fn,t:ahora+(ms||0)});return 0;},
  requestAnimationFrame(fn){sandbox.__raf=fn;},
  console:{log:(...a)=>console.log(...a),
    assert:(c,m)=>{if(!c){assertFails++;console.error('ASSERT FALLÓ:',m);}},
    error:(...a)=>console.error(...a)},
  Math,JSON,Map,Set,Array,Object,String,Number,Date,Proxy,isNaN,parseInt,parseFloat,
};
sandbox.globalThis=sandbox;sandbox.window=sandbox;

const vm=require('vm');
vm.createContext(sandbox);
try{
  vm.runInContext(src,sandbox,{filename:'index.html'});
}catch(e){
  console.error('FALLÓ LA INICIALIZACIÓN:',e.message,'\n',e.stack.split('\n').slice(0,4).join('\n'));
  process.exit(1);
}
console.log('init ok');

// arrancar el juego como si el usuario diera clic y correr cuadros
const clic=handlers['jugar:click'];
if(!clic){console.error('no se registró el handler de #jugar');process.exit(1);}
clic();

const kd=handlers['win:keydown'], ku=handlers['win:keyup'];
const pd=handlers['c:pointerdown'], pm=handlers['win:pointermove'];
const seguir=handlers['plSeguir:click'];
if(!kd||!pd||!pm||!seguir){console.error('faltan handlers de entrada');process.exit(1);}
pd({clientX:0,clientY:0});                        // dejar el arrastre activo para girar cámara

const F=sandbox.window.__frontera;
if(!F){console.error('falta la costura de pruebas __frontera');process.exit(1);}

// Piloto en tres fases. El cerco va ANTES de la carrera por los actos porque el
// juego ahora sí termina: después del final queda congelado y no se puede medir nada.
//   1) calentarse a pie          2) quedarse quieto y ver si las patrullas llegan
//   3) empujarlo de marcador en marcador hasta el final
// Para llegar a los marcadores no escribo una IA de navegación: lo teletransporto.
const CUADROS=32000, CERCO_INI=2500, CERCO_FIN=11000;
let t=performance.now(), px=0, placaVista=0, actosVistos=new Set(), muerteVista=false, cercoMin=1e9, finalVisto=false;
const charlas=new Set(); const repartos=new Set();
let corridos=0;
try{
  for(let f=0;f<CUADROS;f++){
    corridos=f+1;
    t+=16.7;ahora=t;
    for(let k=temporizadores.length-1;k>=0;k--)
      if(temporizadores[k].t<=ahora){const x=temporizadores.splice(k,1)[0];x.fn();}
    const cerco = f>=CERCO_INI && f<CERCO_FIN;
    if(!cerco)kd({code:'KeyW',preventDefault(){}}); else ku({code:'KeyW'});
    if(f%(cerco?31:97)===0) kd({code:'KeyE',preventDefault(){}});   // disparar: calienta
    if(f%307===0) kd({code:'KeyQ',preventDefault(){}});
    if(!cerco&&f%601===0) kd({code:'KeyF',preventDefault(){}});
    if(f%40===0){ px+=140;pm({clientX:px,clientY:0}); }
    if(!cerco&&f%400===0){                                 // empujón al marcador
      const b=F.jugador.auto||F.jugador;
      b.x=F.mision.x;b.z=F.mision.z;
    }
    if(f===CERCO_INI){                                     // pararlo sobre una calle real
      if(F.jugador.auto)kd({code:'KeyF',preventDefault(){}});   // bajarse
      F.jugador.x=-20;F.jugador.z=-70;                     // Francisco Villa y A. González
    }
    // El marcador de recogida ES el personaje que da el encargo, así que basta con
    // apretar F ahí mismo. Nada de teletransportes extra: eso trababa la partida.
    if(!cerco&&f%400===3){
      if(F.jugador.auto)F.accionF();                   // bajarse para poder hablar
      for(let k=0;k<5;k++){
        F.accionF();
        const c=F.estado().charla;
        if(c)charlas.add(c);
      }
    }
    if(f%900===7)repartos.add(F.PERSONAJES.filter(p=>p.malla.visible).map(p=>p.id).join(','));
    // Salir del cerco con calor 5 significa que las patrullas te agarran cada rato
    // y el resto de la corrida se va en arrestos. Reaparecer es lo que haría el juego.
    if(f===CERCO_FIN)F.reaparecer();
    if(cerco&&f%60===0){                                   // medir qué tan cerca llegan
      const b=F.jugador.auto||F.jugador;let m=1e9;
      for(const a of F.autos)if(a.clase==='federal'||a.clase==='municipal'||a.clase==='militar')
        m=Math.min(m,Math.hypot(a.x-b.x,a.z-b.z));
      cercoMin=Math.min(cercoMin,m);
    }
    sandbox.__raf(t);
    if(el('placa').__cls.has('on')){
      if(F.estado().final){finalVisto=true;break;}         // fin del juego: fin de la prueba
      seguir();placaVista++;
    }
    actosVistos.add(F.estado().acto);
    if(F.jugador.salud<100||el('avisoT').textContent)muerteVista=el('avisoT').textContent||'daño';
    if(process.env.DEBUG&&f%3000===0)
      console.log('f='+f,'acto='+F.estado().acto,'hechos='+F.estado().hechos,
        'auto='+(F.jugador.auto?F.jugador.auto.clase:'no'),
        'mision='+F.mision.estado,'placas='+placaVista,
        'muertos='+JSON.stringify(F.muertos),'calor='+F.calor.fed+'/'+F.calor.plaza,
        'autos='+F.autos.length);
  }
}catch(e){
  console.error('FALLÓ EL BUCLE:',e.message,'\n',e.stack.split('\n').slice(0,5).join('\n'));
  process.exit(1);
}
console.log(corridos+' cuadros ok ('+Math.round(corridos*16.7/1000)+' s de juego simulado'+
  (finalVisto?', el juego llegó a su final':'')+')');
const s=F.estado();
const est={
  acto:s.acto, anio:s.anio, encargosDelActo:s.hechos, placas:placaVista,
  dinero:el('dinero').textContent, muertos:JSON.stringify(F.muertos),
  calor:JSON.stringify(F.calor), autosVivos:F.autos.length,
  calle:el('calle').textContent, encargo:el('mtitulo').textContent,
  saludJugador:Math.round(F.jugador.salud), castigo:muerteVista||'ninguno', patrullaMasCerca:Math.round(cercoMin),
  final:s.final, cortinaLoncheria:s.cortina, noche:s.noche.toFixed(2),
  hablóCon:[...charlas].join(', ')||'nadie', repartosDistintos:repartos.size,
};
console.log('estado final:',JSON.stringify(est,null,1));
// los sistemas tienen que haberse movido, no solo no tronar
const exige=(c,m)=>{if(!c){assertFails++;console.error('NO SE EJERCITÓ:',m);}};
exige(est.calle.indexOf(' y ')>0,'el nombre de calle se resuelve');
exige(est.encargo!=='Sin encargo','el sistema de encargos corrió');
exige(placaVista>0,'se avanzó de acto y salió la placa');
exige(s.acto>0,'el acto avanzó');
exige(actosVistos.size>=4,'se recorrieron los cuatro actos (vistos: '+[...actosVistos]+')');
exige(muerteVista,'corrió el castigo por perder (levantado/noqueado o daño)');
exige(F.autos.length>0,'quedan autos en el mundo');
exige(F.peatones.length>0,'quedan peatones en el mundo');
exige(cercoMin<40,'las patrullas alcanzan al jugador en la calle (llegaron a '+Math.round(cercoMin)+' m)');
exige(finalVisto,'el juego llega a su final y saca la placa de cierre');
exige(s.cortina,'la lonchería baja la cortina al avanzar los actos');
exige(charlas.size>=4,'se habló con varios personajes (fueron '+charlas.size+': '+[...charlas]+')');
exige(charlas.has('chayo'),'Doña Chayo está desde el primer acto');
exige([...charlas].some(c=>c==='luz'||c==='kilo'||c==='marisol'),
  'se habló con alguien que solo aparece en actos tardíos');
exige(repartos.size>=3,'el reparto cambia de acto a acto (repartos vistos: '+repartos.size+')');
process.exit(assertFails?1:0);
