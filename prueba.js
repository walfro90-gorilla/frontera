// Prueba de humo del juego.  Uso:  node prueba.js   (DEBUG=1 para traza)
//
// Stubea THREE y el DOM lo justo para correr el script de index.html en Node y
// jugarlo solo, en tres fases:
//   1) calentarse a pie
//   2) quedarse quieto y medir si las patrullas de verdad llegan
//   3) recorrer los cuatro actos hasta el final, hablando con quien dé el encargo
// Verifica que no truene ningún cuadro y que los sistemas se muevan de verdad:
// encargos, actos, calor, persecución, arresto, diálogo, reparto por acto,
// la lonchería degradándose y la placa de cierre.
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
// PlaneGeometry de verdad necesita atributos: la bandera del Chamizal reescribe
// la Z de cada vértice en cada cuadro para ondear.
const Attr=class{
  constructor(n,w,ws){
    this.count=n;this._x=new Float64Array(n);this._z=new Float64Array(n);
    this.needsUpdate=false;
    for(let i=0;i<n;i++)this._x[i]=-w/2+((i%(ws+1))/ws)*w;
  }
  getX(i){return this._x[i];} getZ(i){return this._z[i];} setZ(i,v){this._z[i]=v;}
};
const Geo=class{
  constructor(w,h,ws,hs){
    const cols=(ws|0)||1, rows=(hs|0)||1;
    this.attributes={position:new Attr((cols+1)*(rows+1), w||1, cols)};
  }
  translate(){return this;}
};
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
  SphereGeometry:Geo,RingGeometry:Geo,TorusGeometry:Geo,CircleGeometry:Geo,
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
const SIT_INI=400, SIT_PASO=44;
const CUADROS=44000;
// Las fases van encadenadas al número de sitios. Antes eran números fijos y al
// crecer la lista la fase de sitios se metió encima de la del mapa, que pausa el
// juego: los sitios no se anunciaban y parecía bug del juego.
const SIT_FIN0=SIT_INI+SIT_PASO*sandbox.window.__frontera.SITIOS.length;
const MAPA_ABRE=SIT_FIN0+40, MAPA_CIERRA=SIT_FIN0+110;
const CERCO_INI=SIT_FIN0+260, CERCO_FIN=CERCO_INI+8000;
let t=performance.now(), px=0, placaVista=0, actosVistos=new Set(), muerteVista=false, cercoMin=1e9, finalVisto=false;
const charlas=new Set(); const repartos=new Set(); const abiertos=[];
const sitiosVistos=new Set();
const colgadosPorActo=new Set();
let bombaVista=false, memorialVisto=false;
let mapaProbado='no se probó';
const manchas=[];
let relojMal=null, horasVistas=new Set();
let corridos=0;
try{
  for(let f=0;f<CUADROS;f++){
    corridos=f+1;
    t+=16.7;ahora=t;
    for(let k=temporizadores.length-1;k>=0;k--)
      if(temporizadores[k].t<=ahora){const x=temporizadores.splice(k,1)[0];x.fn();}
    // recorrido de sitios: pararse frente a cada uno y ver si el panel lo anuncia
    const SIT_FIN=SIT_INI+SIT_PASO*F.SITIOS.length;
    const enSitios = f>=SIT_INI && f<SIT_FIN;
    if(enSitios){
      const k=Math.floor((f-SIT_INI)/SIT_PASO), fase=(f-SIT_INI)%SIT_PASO, s0=F.SITIOS[k];
      if(fase===0){ if(F.jugador.auto)F.accionF(); F.jugador.x=s0.x; F.jugador.z=s0.z+2; }
      if(fase===SIT_PASO-3 && el('sitio').__cls.has('on') &&
         el('sitioNombre').textContent===s0.nombre) sitiosVistos.add(s0.nombre);
    }
    const cerco = f>=CERCO_INI && f<CERCO_FIN;
    if(!cerco)kd({code:'KeyW',preventDefault(){}}); else ku({code:'KeyW'});
    if(f%(cerco?31:397)===0) kd({code:'KeyE',preventDefault(){}});  // disparar: calienta
    if(f%307===0) kd({code:'KeyQ',preventDefault(){}});
    if(!cerco&&f%601===0) kd({code:'KeyF',preventDefault(){}});
    if(f%40===0){ px+=140;pm({clientX:px,clientY:0}); }
    // El bucle ahora es asignación → escena → redacción, y en la escena hay que
    // disparar la cámara. Se empuja más seguido y se fotografía sin descanso:
    // la propia cadencia del lente limita cuántas entran.
    if(!cerco&&!enSitios&&f%200===0){
      const b=F.jugador.auto||F.jugador;
      b.x=F.mision.x;b.z=F.mision.z;
    }
    if(!cerco&&!enSitios&&F.estado().estadoMision==='escena'){
      if(F.jugador.auto)F.accionF();                      // no se fotografía manejando
      F.fotografiar();
    }
    if(f===CERCO_INI){                                     // pararlo sobre una calle real
      if(F.jugador.auto)kd({code:'KeyF',preventDefault(){}});   // bajarse
      F.jugador.x=-20;F.jugador.z=-70;                     // Francisco Villa y A. González
    }
    // El marcador de recogida ES el personaje que da el encargo, así que basta con
    // apretar F ahí mismo. Nada de teletransportes extra: eso trababa la partida.
    if(!cerco&&!enSitios&&f%400===3){
      if(F.jugador.auto)F.accionF();                   // bajarse para poder hablar
      for(let k=0;k<5;k++){
        F.accionF();
        const c=F.estado().charla;
        if(c)charlas.add(c);
      }
    }
    if(f%900===7)abiertos.push(F.estado().abiertos);
    if(f%900===7)repartos.add(F.PERSONAJES.filter(p=>p.malla.visible).map(p=>p.id).join(','));
    // Salir del cerco con calor 5 significa que las patrullas te agarran cada rato
    // y el resto de la corrida se va en arrestos. Reaparecer es lo que haría el juego.
    if(f===CERCO_FIN)F.reaparecer();
    // mapa grande: abrir con pines puestos, dibujar y cerrar
    if(f===MAPA_ABRE-30)F.pines.push({x:-120,z:-250},{x:240,z:100},{x:-400,z:300});
    if(f===MAPA_ABRE){F.abrirMapa();mapaProbado=F.estado().mapa&&!F.estado().jugando?'abrió y pausó':'NO pausó';}
    if(f===MAPA_CIERRA){F.cerrarMapa();
      if(F.estado().mapa||!F.estado().jugando)mapaProbado='NO cerró bien';}
    if(cerco&&f%300===0)F.calor.fed=Math.max(F.calor.fed,4);   // garantizar perseguidores
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
    {const e=F.estado();
     colgadosPorActo.add(e.acto+':'+e.colgados);
     if(e.bomba)bombaVista=true;
     if(e.memorial)memorialVisto=true;
     if(e.acto<2&&(e.bomba||e.memorial))bombaVista='ANTES DE TIEMPO';}
    {const m=F.estado().mancha;if(!manchas.length||manchas[manchas.length-1]!==m)manchas.push(m);}
    // el reloj mentía seis horas: marcaba las nueve de la mañana con el cielo negro
    {const hh=parseInt(el('hora').textContent,10), n=F.estado().noche;
     if(!isNaN(hh)){
       horasVistas.add(hh);
       if(hh>=11&&hh<=14&&n>0.5)relojMal='dice '+hh+'h con noche '+n.toFixed(2);
       if((hh>=23||hh<=3)&&n<0.5)relojMal='dice '+hh+'h con noche '+n.toFixed(2);
     }}
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
  notas:s.notas, registrados:s.registrados, atropellados:s.atropellados,
  hablóCon:[...charlas].join(', ')||'nadie', repartosDistintos:repartos.size,
  negociosAbiertos:Math.max(...abiertos)+' → '+Math.min(...abiertos)+' de '+F.antros.length,
  mapa:mapaProbado, pines:F.pines.length, reloj:relojMal||'cuadra con la luz',
  banderaMancha:manchas.map(v=>v.toFixed(2)).join(' → '),
  sitios:sitiosVistos.size+' de '+F.SITIOS.length,
  colgados:[...colgadosPorActo].sort().join(' '), bomba:bombaVista, memorial:memorialVisto,
  horasVistas:horasVistas.size,
};
console.log('estado final:',JSON.stringify(est,null,1));
// los sistemas tienen que haberse movido, no solo no tronar
const exige=(c,m)=>{if(!c){assertFails++;console.error('NO SE EJERCITÓ:',m);}};
exige(est.calle.indexOf(' y ')>0,'el nombre de calle se resuelve');
exige(est.encargo!=='Sin encargo','el sistema de encargos corrió');
exige(placaVista>0,'se avanzó de acto y salió la placa');
exige(s.acto>0,'el acto avanzó');
// El jugador es reportero: publica notas y no cobra por matar. Que nadie
// reintroduzca una recompensa por víctimas sin que esto falle.
exige(s.notas>=12,'se publicaron notas en los cuatro actos ('+s.notas+')');
exige(s.registrados>0,'se registraron muertos en las notas ('+s.registrados+')');
exige(typeof F.CAMARAS[0].sujetos==='number'&&!('blancos' in F.CAMARAS[0]),
  'los lentes son lentes, no armas');
exige(actosVistos.size>=4,'se recorrieron los cuatro actos (vistos: '+[...actosVistos]+')');
exige(muerteVista,'corrió el castigo por perder (levantado/noqueado o daño)');
exige(F.autos.length>0,'quedan autos en el mundo');
exige(F.peatones.length>0,'quedan peatones en el mundo');
exige(cercoMin<40,'las patrullas alcanzan al jugador en la calle (llegaron a '+Math.round(cercoMin)+' m)');
exige(finalVisto,'el juego llega a su final y saca la placa de cierre');
exige(s.cortina,'la lonchería baja la cortina al avanzar los actos');
exige(charlas.size>=4,'se habló con varios personajes (fueron '+charlas.size+': '+[...charlas]+')');
exige([...charlas].some(c=>c==='luz'||c==='kilo'||c==='marisol'),
  'se habló con alguien que solo aparece en actos tardíos');
exige(repartos.size>=3,'el reparto cambia de acto a acto (repartos vistos: '+repartos.size+')');
// regresión: los personajes nacían dentro de edificios y su encargo era intomable
const atrapados=F.PERSONAJES.filter(p=>
  F.edificios.some(e=>Math.abs(p.x-e.x)<e.hw+1&&Math.abs(p.z-e.z)<e.hd+1));
exige(!atrapados.length,'ningún personaje quedó dentro de un edificio ('+
  atrapados.map(p=>p.id)+')');
// Regresión doble de los rótulos de neón. Estuvieron invisibles dos veces seguidas:
// primero enterrados 0.25 m dentro del muro, después bien puestos pero girados al
// revés, o sea de espaldas a la calle y con FrontSide. Revisar posición no basta:
// hay que comprobar que la normal del plano apunte hacia afuera del edificio.
const rotulosMalos=F.antros.filter(a=>{
  const normalX=Math.sin(a.rot.rotation.y);
  const haciaCalle=a.x-a.cx;
  const dentro=F.edificios.some(e=>Math.abs(a.x-e.x)<e.hw&&Math.abs(a.z-e.z)<e.hd);
  return dentro || normalX*haciaCalle<=0;
});
exige(!rotulosMalos.length,'los rótulos salen del muro y miran a la calle ('+
  rotulosMalos.length+' mal: '+rotulosMalos.map(a=>a.nombre)+')');
const zs=F.geoBandera.attributes.position;
let onda=0;
for(let i=0;i<zs.count;i++)onda=Math.max(onda,Math.abs(zs.getZ(i)));
exige(onda>0.5,'la bandera del Chamizal ondea (amplitud '+onda.toFixed(2)+' m)');
exige(bombaVista===true,'los restos del coche bomba salen en el acto III y no antes');
exige(memorialVisto,'el memorial de Salvárcar aparece en el acto III');
exige([...colgadosPorActo].some(v=>v.startsWith('2:4')),
  'en 2010 hay más colgados que en ningún otro acto ('+[...colgadosPorActo].sort().join(' ')+')');
// todos los sitios deben tener dato y poder anunciarse: uno mudo o metido en un
// edificio no se descubre nunca y el dato se pierde
const sitiosSinDato=F.SITIOS.filter(s=>!s.nombre||!s.texto||!s.tipo||s.texto.length<40);
exige(!sitiosSinDato.length,'todos los sitios traen dato ('+sitiosSinDato.map(s=>s.nombre)+')');
// Un sitio SÍ puede estar centrado en su monumento —la bandera, la catedral—; lo
// que no puede es que el radio no alcance a salir del muro, porque entonces no hay
// dónde pararse para que se anuncie.
const sitiosEncerrados=F.SITIOS.filter(s=>{
  const e=F.edificios.find(e=>Math.abs(s.x-e.x)<e.hw&&Math.abs(s.z-e.z)<e.hd);
  return e && s.r <= Math.max(e.hw,e.hd)+8;
});
exige(!sitiosEncerrados.length,'todo sitio dentro de un edificio tiene radio para salir de él ('+
  sitiosEncerrados.map(s=>s.nombre)+')');
exige(sitiosVistos.size===F.SITIOS.length,'cada sitio se anuncia al pararte enfrente ('+
  sitiosVistos.size+' de '+F.SITIOS.length+'; faltaron: '+
  F.SITIOS.filter(s=>!sitiosVistos.has(s.nombre)).map(s=>s.nombre)+')');
exige(manchas.length>=3&&manchas[manchas.length-1]>manchas[0],
  'la bandera se va manchando acto por acto ('+manchas.map(v=>v.toFixed(2)).join(' → ')+')');
exige(!relojMal,'el reloj cuadra con la luz del cielo ('+relojMal+')');
exige(horasVistas.size>=18,'se recorrió un día completo ('+horasVistas.size+' horas vistas)');
exige(mapaProbado==='abrió y pausó','el mapa grande abre, pausa, dibuja y cierra ('+mapaProbado+')');
exige(F.pines.length===3,'los pines sobreviven la partida');
exige(Math.max(...abiertos)===F.antros.length,'en 2008 la Av. Juárez abre completa');
exige(Math.min(...abiertos)<=6,'la Av. Juárez se apaga acto por acto (quedaron '+Math.min(...abiertos)+')');
process.exit(assertFails?1:0);
