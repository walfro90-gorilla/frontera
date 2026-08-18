# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

Sandbox 3D de mundo abierto en **un solo archivo**: `index.html` (3981 líneas). Sin build step, sin
`package.json`, sin linter. Única dependencia: Three.js **r128** por CDN. Todo lo demás —geometría,
texturas, audio— se genera por código al cargar. **Cero assets externos**: es una propiedad del
proyecto, no un accidente. No agregar imágenes, fuentes ni archivos de sonido.

El juego es una dramatización de la guerra del narco en Ciudad Juárez, 2008–2012. Antes de tocar
texto, personajes, facciones, misiones o el mapa: leer `HISTORIA.md`.

## Comandos

```bash
# correr: abrir index.html directo en el navegador, o
python3 -m http.server 8000        # http://localhost:8000

node prueba.js                     # prueba de humo (DEBUG=1 para traza por cuadro)
```

`prueba.js` stubea THREE y el DOM, corre el juego en Node y lo juega solo por los cuatro actos.
Verifica que ningún cuadro truene y que los sistemas se muevan de verdad (encargos, actos, calor,
persecución, arresto). **Correrlo después de cualquier cambio no trivial** — es lo único que separa
"compila" de "funciona", porque aquí no hay GPU y nada de esto prueba que se vea bien.

Depende de la costura `window.__frontera` que `index.html` solo expone con `#test` en la URL. Si
agregas estado que valga la pena verificar, expónlo ahí. Abrir `index.html#test` en el navegador
corre además los asserts de armas y geografía contra la consola.

Deploy: cada push a `main` dispara `.github/workflows/pages.yml`, que sube la raíz del repo tal cual
a GitHub Pages. No hay paso de compilación que pueda fallar; si el archivo está roto, se publica roto.

`push.sh` es bootstrap de una sola vez (`git init` + commit + `gh repo create`). **No volver a
correrlo** en este repo, ya está publicado.

## Estructura del código

Todo vive dentro de un IIFE al final de `index.html`, dividido en secciones con banners
`/* ═══ NOMBRE ═══ */`. Al agregar código, ponerlo en su sección y conservar los banners: son el
único índice del archivo. Identificadores en español, estilo compacto (varias sentencias por línea,
poco espacio en blanco) — igualarlo.

Para reencontrar los banners: `grep -n '/\* ═' index.html`. **El orden importa** — el archivo se
ejecuta de arriba abajo y buena parte del mundo se construye en tiempo de carga, no en funciones.
Las secciones que dependen de otras:

| Sección | Depende de |
|---|---|
| `GEOGRAFÍA` | nada — es la base, define `ejeX`/`ejeZ`/`PUENTES`/`Z*` |
| `ZONAS Y CONTROL DE PLAZA` | `GEOGRAFÍA` |
| `SUELO HORNEADO` | `ZONAS` (hornea el canvas con las zonas ya sorteadas) |
| `EDIFICIOS Y PROPS` | `ZONAS`, `TEXTURAS` — llena `edificios[]` y `luminarias[]` |
| `RÍO, BORDO, VALLA Y PUENTES` | `EDIFICIOS` (usa `matPoste`, `geoCaja`) y llena `vallaTramos[]` |
| `AVENIDA JUÁREZ` | `EDIFICIOS` (usa `bloque()`); las manzanas que flanquea las salta el generador normal vía `enTramoJuarez(i,j)` |
| `PERSONAJES` | `PERSONAS` (usa `persona()`) y **`edificios[]` ya lleno**, porque `despejar()` los saca de las paredes |
| `ACTOS Y ENCARGOS` | declara `acto`, que `PERSONAS` y `PERSONAJES` usan; sus `encargos` citan ids de `PERSONAJES` por nombre, resueltos en tiempo de ejecución |
| `POBLAR LA CIUDAD` | **todo lo anterior** — corre `PUENTES.forEach(puente)` y crea autos y peatones |
| `PRUEBAS` / `ARRANQUE` | el final, ya con todo construido |

Las declaraciones `const`/`let` a nivel de sección tienen TDZ: mover una sección hacia arriba o
usar un array antes de declararlo revienta al cargar, sin síntoma en el navegador más que pantalla
negra. `node prueba.js` lo detecta en un segundo — ya cazó exactamente ese bug con `vallaTramos`.

### Sistema de coordenadas

La rejilla **no es uniforme**: `EJESX` y `EJESZ` son tablas `[coordenada, nombre, ancho]` con las
avenidas reales de Juárez en su orden y separación relativa. 9 ejes X × 8 ejes Z → 8 × 7 manzanas.
**Norte = −Z.** Plano del mapa con nombres y zonas: `HISTORIA.md` §7.

Toda posición nueva pasa por estos accesores, nunca por aritmética a mano:

- `ejeX(i)` / `ejeZ(j)` — eje central de calzada
- `cenX(i)` / `cenZ(j)` — centro de manzana
- `anchoX(i)` / `anchoZ(j)` — ancho de calzada (varía por avenida)
- `calleDe(x,z)` — nombre del cruce más cercano, para el HUD

Al norte, en orden: `ZBORDO` (límite jugable) → `ZRIO` (canal del Bravo) → `ZVALLA` (valla gringa)
→ `ZPASO` (El Paso, no jugable). `chocaEdificios` frena en `ZBORDO` salvo en la calzada de un
puente, donde te detiene la garita, que es un AABB normal en `edificios[]`. **El Paso se ve y no se
pisa: eso no es una limitación técnica, es la premisa del juego.**

`zona[i][j]` (`'centro'|'colonia'|'lote'|'parque'|'maquila'|'chamizal'`) se sortea una vez y lo
consumen **dos** lugares: `texSuelo` (que lo hornea en un canvas de 2048²) y el bucle que construye
manzanas. Cambiar la lógica de zonas exige tocar ambos o el suelo pintado dejará de coincidir con
la geometría.

`plaza[i][j]` (0 La Línea · 1 Gente Nueva · 2 disputada) es una matriz aparte, del mismo tamaño, y
la reescribe `avanzaPlaza()` en cada acto: Sinaloa avanza de poniente a oriente. Se ve en el
minimapa y decide qué sicarios te caen encima.

### Entidades

Objetos planos `{malla, x, z, ang, ...}` donde `malla` es un `THREE.Group`. El estado de verdad son
`x/z/ang`; la malla se sincroniza al final de cada función de actualización. Nunca leer posición
desde la malla.

`autos[]` usa el campo **`clase`** como máquina de estados: `'parado'` → `'robado'` cuando el
jugador entra (`entrarSalir`), y de vuelta al salir. `'trafico'` navega el grafo de intersecciones
con `ni/nj` (nodo actual) y `ti/tj` (destino), eligiendo vecino con `vecino()` sin regresarse.
`'municipal'`, `'federal'`, `'militar'` y `'sicario'` se crean y destruyen dinámicamente
(`soltarPerseguidor` / `limpiar`) según el calor. `esPatrulla(clase)` distingue a los tres cuerpos
oficiales del sicario.

**Los perseguidores navegan el mismo grafo que el tráfico**, no van en línea recta: `haciaPresa()`
elige en cada nodo el vecino que más los acerca, y solo encaran directo a menos de 40 m. Sin eso se
quedan clavados contra las fachadas y nunca te alcanzan — `prueba.js` lo mide y falla si no llegan.

`peatones[]` tiene `tipo`: `'civil'`, `'halcon'` (te reporta y sube calor federal si andas caliente)
y `'sicario'` (te dispara si su facción es la que te trae ganas). `p.faccion` se toma de
`plaza[bi][bj]` al colocarlo.

**Toque de queda:** `actDiaNoche` publica `esNoche` (0–1) y `actPeatones` marca `p.encasa` cuando
pasa de 0.55 — los civiles se ocultan y dejan de moverse; los sicarios no. **Todo lo que apunte a
peatones tiene que filtrar `p.encasa`** además de `p.caido`: disparo, atropello y `cercaDeAlguien`
ya lo hacen. Olvidarlo deja matar gente invisible.

### Bucle

`bucle(now)`: `dt` topado a 0.05. `bloqueo>0` congela la simulación (arresto/noqueo) pero cámara,
ciclo día/noche, audio, HUD y minimapa siguen corriendo siempre.

### Día/noche por materiales compartidos

**`horaDia` 0 es medianoche**, 0.25 amanece, 0.5 mediodía, 0.75 anochece. El reloj del HUD es
`horaDia*24` **sin corrimientos**: durante mucho tiempo tuvo un `+6` y marcaba las nueve de la
mañana con el cielo negro. `prueba.js` compara la hora contra `esNoche` y falla si se separan.

`horaDia` ∈ [0,1) es la única variable de tiempo. `actDiaNoche` sube `emissiveIntensity` recorriendo
`materialesFachada`, `matFoco` y `matFaro` — un puñado de materiales, no miles de mallas. Por eso
`matEdificio()` cachea en `cacheMat` por `(paleta, repeatU, repeatV)`: las fachadas comparten
material a propósito. **Geometría emisiva nueva debe registrar su material en uno de esos arrays o
no se encenderá de noche.**

### Cámaras y el bucle de la nota

**El jugador es reportero y no puede matar a nadie.** `CAMARAS[]` sustituyó a las armas conservando
los mismos campos geométricos (`alcance`, `cono`) porque el problema es idéntico: qué entra en el
encuadre. Lo que cambió es qué pasa al apretar. `ARMAS` sigue existiendo como alias de `CAMARAS`
para no romper llamadas viejas, y `disparar()` como alias de `fotografiar()`.

El bucle tiene **tres tramos**, no dos: `mision.estado` va `'asignacion'` → `'escena'` → `'cierre'`.
En la escena hay que llamar `fotografiar()` con el asunto en el encuadre `mision.pide` veces;
`cerrarEscena()` reapunta el marcador a la redacción. El color del marcador dice en qué tramo vas:
oro, azul, verde.

Cada fila de `encargos` es `[titulo, texto, dadorId, lugarClave, fotos]`, y **cada una es una
noticia real de ese año**. `lugarDe(clave)` resuelve contra `LUGARES`, un registro que cada sección
llena con sus propios puntos. Agregar una noticia es agregar una fila y, si hace falta, un
`LUGARES.x` donde se construye el lugar.

`enMira()` cuenta como encuadre cualquier cosa a menos de 6 m: a bocajarro no hay que apuntar.

### La ciudad en guerra

`actSucesos()` mantiene entre uno y cuatro hechos vivos cerca del jugador, escalados por `RIOT[acto]`
(2010 al tope). Cada uno se arma con entidades normales y se borra entero al vencer su vida o al
alejarse 500 m. Tipos: `levanton`, `balacera`, `persecucion`.

**Las entidades de un suceso no las toca nadie más.** Llevan `quieto`, `presa` o una clase de
`esAmbiente()`, y con eso las saltan `actPersecucion()` —no persiguen al jugador—, `actTrafico()`,
`autoCercano()` —no te las puedes robar— y `limpiar()`. Los peatones guionizados llevan `p.guion` y
`actPeatones()` los ignora. **Si agregas un sistema que recorra `autos[]` o `peatones[]`, respeta
esas banderas** o los sucesos se deshacen solos.

Fotografiar un hecho paga `PAGO_BANQUETA[acto]` **una vez** (`S.fotografiado`) y suma a `notas` y
`registrados`: es la nota de banqueta, y es lo que convierte el caos ambiental en material del
jugador en vez de decorado.

El helicóptero es uno solo, orbitando al jugador a 62 m de altura; `actHeli()` va en el grupo que
siempre corre y su reflector se prende con `esNoche`.

### El chalán y el stand-up

`chalan` es Beto, el camarógrafo. `actChalan()` lo lleva detrás del jugador y **lo sienta en la
cápsula cuando `jugador.auto===MOTO`** — de ahí que la moto tenga sidecar. Se teletransporta si
queda a más de 60 m, porque perder al camarógrafo bloquearía la misión.

El bucle tiene cuatro tramos: `asignacion` → `escena` → **`grabar`** → `cierre`. En `grabar` hay que
estar a pie, cerca de Beto y quieto 2.6 s; moverse, alejarse o subirse a un vehículo corta la toma.
Al terminar, `capturarDesde()` toma la imagen **desde la posición de Beto mirando a Jimmy** — esa es
la toma que sale en el noticiero, y por eso `capturar()` se generalizó a `capturarDesde(fov, desde,
hacia, ocultar)`: la foto fija oculta al jugador, el stand-up no.

### Del papel a la tele

`periodicazo()` guarda `ultimaFirmada` y `cerrarPeriodico()` **encadena a `noticiero()`** en vez de
continuar la partida; quien continúa es `cerrarNoticiero()`. Los dos paneles tienen su cerrojo
(`perioT`, `teleT`) por la misma razón: con una tecla de movimiento presionada la animación se
saltaba sola.

### La moto de Jimmy

`MOTO` es un `autos[]` normal de `clase:'moto'`, así que hereda física, colisión, cámara y HUD sin
código aparte. Lo que la distingue: **`limpiar()` la salta explícitamente** y `entrarSalir()` no le
cambia la clase a `'robado'`, porque es suya. Si algún día se toca cualquiera de esas dos, la moto
desaparece a media partida y el jugador se queda a pie sin explicación.

`fisicaAuto()` la trata aparte: más aceleración y giro, menos punta, y **umbral de golpe 13 en vez
de 22** con casi el doble de daño. Es una clásica con cápsula, no una deportiva.

**Desde el sidecar sí se fotografía**, y es la única excepción a "bájate para la foto". Por eso
`fotografiar()` y `capturar()` toman el punto de vista de `posJugador()` y no de `jugador.x/z`, que
está congelado mientras vas montado. Arriba de 9 m/s la toma se rechaza por movida.

### Línea de tiempo

`publicadas` es el registro real de progreso: `'acto:indice' -> firmada`. `encargoIdx` dice cuál se
está cubriendo, y `nuevaOferta()` lo respeta salvo que ya esté publicado, en cuyo caso cae al
`primerPendiente()`. `hechos` sigue existiendo como contador para el avance de acto, pero **la
verdad de qué se cubrió está en `publicadas`**, que es lo que se guarda y lo que pinta la línea.

`pintarLinea()` reconstruye el panel al abrir; solo los hechos **del año en curso y sin publicar**
son clicables, porque una foto de 2008 no se toma en 2011. Los de años futuros van en gris y sin
fecha: la cronología se descubre al avanzar.

**Las fotos son fotos de verdad.** `capturar(lente)` rinde la escena a un `WebGLRenderTarget` de
336×189 desde la posición de Jimmy mirando a `camAng`, con `camera.fov` en 20 para el teleobjetivo o
68 para el gran angular, y con `jugador.malla` oculto para que no salga su propia espalda. Después
`readRenderTargetPixels` y un blit a un `<canvas>` **invirtiendo la Y**, porque WebGL entrega las
filas de abajo hacia arriba. Los lienzos se guardan en `mision.tomas` y son los que se insertan en
la portada; el blanco y negro lo pone un `filter` de CSS, no el render.

Va envuelto en `try/catch` que repone `jugador.malla.visible`: si el contexto se pierde a media
captura, lo peor que puede pasar es quedarse sin foto, no invisible.

**El periodicazo tiene cerrojo.** `perioT` bloquea el cierre durante 0.9 s. Sin eso, como la portada
se cierra con cualquier tecla y el jugador normalmente trae `W` presionada, **la animación se
saltaba sola y nadie la veía nunca**. El cerrojo se descuenta en `bucle()` antes del `return` de
pausa, porque durante la portada el juego está pausado.

**El crédito de la foto es la decisión central del juego.** `completar()` ya no paga: llama a
`pedirFirma()`, que pausa y muestra `#firma`. `resolverFirma(firmada)` aplica todo — pago ×1.6 o
×0.7, racha, `firmadas`/`anonimas` — y de ahí sale el avance de acto. Firmar sube calor de plaza,
**dos niveles a partir del acto III**, así que la partida se pone cara justo cuando la historia dice
que se puso cara. Las teclas `1` y `2` se atienden **antes** del guardia de `jugando`, igual que
`Escape` del mapa, porque la decisión ocurre con el juego pausado.

Si alguien agrega un camino que llame a `resolverFirma` sin pasar por `pedirFirma`, el flag
`esperandoFirma` lo bloquea salvo que pase `silencio` — que es como el encargo sin paga se salta la
pregunta.

Lo único que queda de violencia del jugador es `atropellar()`, que es un accidente y **siempre
cuesta**: nunca paga. `prueba.js` falla si alguien reintroduce una recompensa por víctimas.

### Armas

`ARMAS[]` es tabla de datos (`alcance`, `cono`, `blancos`, `cadencia`, `retro`, `tono`); agregar un
arma es agregar una entrada, no código. `disparar()` es hitscan por cono contra `peatones`:
`enMira()` filtra por alcance y ángulo respecto a `camAng`, ordena por distancia y se queda con los
primeros `blancos`. Sin proyectiles ni `THREE.Raycaster`.

**`matar(p, porArma)` es la única puerta para toda muerte de peatón** y el precio depende de a quién
mataste: sicario paga y sube calor de plaza, halcón no paga, **civil te cuesta $300, te truena el
calor federal y cierra los negocios de la cuadra** (`cerradas[i][j]`, que `puntoCalle()` respeta al
sortear encargos). El calor por evento lo sube quien llama, no `matar` — así un escopetazo de 4
bajas cuesta una estrella y no cuatro. Lo llaman `disparar()` y el atropello en `actAutoJugador`.

Solo se dispara a pie.

### Actos

`ACTOS[]` es tabla de datos: año, título, texto de la placa, dato histórico y lista de encargos.
`acto` (0–3) indexa todo: encargos, pago por sicario, qué cuerpo policiaco patrulla, cuánta valla
hay levantada (`actoValla()`, porque la valla se construyó de verdad entre 2008 y 2009), cuánto ha
avanzado Sinaloa (`avanzaPlaza()`) y qué dice la radio. Cada `ENCARGOS_POR_ACTO` completados,
`avanzarActo()` congela el juego (`jugando=false`) y saca la placa; el botón *SEGUIR* la reanuda y
pide el siguiente encargo. **Agregar contenido de época = agregar una fila, no código.**

Los encargos de cada acto salen **en secuencia**, no al azar (`encargos[hechos % n]`): el orden de
la tabla *es* el guion del acto. `fallar()` no incrementa `hechos`, así que un encargo perdido se
repite en vez de saltarse.

`cerrar()` termina el juego al completar el acto IV: cifras reales, tu contador de muertos junto al
de la ciudad y la sentencia de 2024 (reglas de tono 2 y 6). Borra la partida guardada y el botón
recarga. No hay final en el que ganes la plaza, y eso es deliberado — `HISTORIA.md` §10.

### Partida guardada

`localStorage` bajo `CLAVE`, cinco campos, `guardar()` al completar encargo, al avanzar de acto y al
perder. `cargar()` corre en ARRANQUE **antes** de `actoValla()`/`avanzaPlaza()`/`actoLoncheria()`,
porque el mundo tiene que quedar en el acto que se cargó. Dos escapes por URL: `#nuevo` borra la
partida, `#test` ni lee ni escribe (si no, `prueba.js` sería no determinista).

### Dos calores

`calor.fed` y `calor.plaza`, 0–5 cada uno, con enfriamientos distintos (13 s contra 22 s: el Estado
olvida antes que el barrio). `calor.faccion` recuerda a quién le pegaste, para que sean sus sicarios
los que salgan. `actPersecucion()` maneja ambos con el mismo motor.

`mordida()` (tecla `G`, o tocar el dinero en el HUD) baja un nivel de calor federal por $400, pero
**solo contra una patrulla `'municipal'`**. Federal y militar rechazan. No es balance: es que La
Línea está hecha de policías municipales y la federal cobra más arriba y no de ti.

### Personajes

`PERSONAJES[]` es tabla de datos: `id`, nombre, papel, color de ropa, esquina fija, `desde`/`hasta`
(actos en los que existe) y `lineas[acto]` — un arreglo de frases por acto, vacío si en ese acto no
sale. Agregar gente es agregar una fila. `actoPersonajes()` prende y apaga las mallas por acto; la
llaman `avanzarActo()` y ARRANQUE.

**A los personajes no se les puede disparar.** `disparar()` y el atropello solo miran `peatones[]`,
y ellos viven en `PERSONAJES[]`. No es un descuido: es la decisión de no dejar que el jugador mate a
la señora de la lonchería ni a la madre que busca a su hija. Si algún día se comparten arrays,
hay que reponer la exclusión a mano.

**El encargo lo da alguien.** El tercer campo de cada fila de `encargos` es el `id` de quien lo
entrega, y `nuevaOferta()` pone el marcador de recogida junto a esa persona en vez de en una calle
al azar. Al aceptar, `briefing()` muestra el texto del encargo como diálogo suyo. La entrega sí es
en un `puntoCalle()` cualquiera. **Todo `id` que aparezca en `encargos` tiene que estar en escena en
ese acto** (`desde`/`hasta`) o el marcador cae en una calle al azar y se pierde el hilo.

### Diálogo

Una línea a la vez, sin árbol: `charla` guarda con quién hablas y `charlaI` en qué línea vas.
`charlaI>=1e8` marca un briefing, que se cierra con la siguiente pulsación. `actPersonajes()` corta
la plática sola si te alejas o te subes al carro.

**`accionF()` es la única tecla de acción** y decide por contexto: si hay plática, avanza; si no y
hay alguien cerca a pie, habla; si no, entra o sale del carro. El HUD dice cuál toca, así que no
hizo falta otra tecla ni otro botón táctil. `entrarSalir()` sigue existiendo pero **ya nadie debe
llamarla directo desde entradas** — todo pasa por `accionF()`.

### Periférico

**El anillo no está en `EJESX`/`EJESZ` a propósito.** La retícula modela una traza urbana con
cruces, banquetas y manzanas; un periférico no es eso. `PERIF[]` lo describe aparte (eje, posición,
extremos, ancho), tiene su carpeta propia, su tráfico propio (`actPeriferico`, waypoints de ida y
vuelta sin grafo) y `calleDe()` lo consulta antes que la retícula.

Por eso hay dos juegos de límites: `XMIN/XMAX/ZSUR` son el borde de la mancha urbana y de la textura
horneada del suelo; **`LIMX0/LIMX1/LIMZ1` son el límite jugable**, que llega hasta el anillo. Meter
el anillo a la textura del suelo habría bajado la resolución de toda la ciudad.

### Colgados y sucesos

Los colgados van **como paisaje, nunca como mecánica**: `disparar()` no los toca, no dan dinero y no
existe forma de colgar a nadie. Al acercarte, `actColgados()` cierra los negocios de esa manzana y
lo reporta la radio — cuesta, no paga. Si algún día alguien los conecta a una recompensa, está
rompiendo la regla de tono 1 y el §10 de `HISTORIA.md`.

`restosBomba` y `memorial` son grupos que `actoSucesos()` prende en el acto III y nunca apaga. El
estallido suena en el manejador de *SEGUIR* de la placa, no en `avanzarActo()`, para que se oiga
cuando el jugador ya tiene el control y no detrás de una pantalla negra.

El encargo **Llevar flores** tiene destino fijo: `aceptar()` lo manda al memorial en vez de a un
`puntoCalle()` cualquiera.

**`crearColgados()` se llama desde ARRANQUE, no en su sección.** Usa `persona()`, que necesita
`PIEL` y `ROPA`, declaradas más abajo en `PERSONAS`: construirlos donde están definidos revienta por
TDZ. Es el mismo tropiezo que documenta la tabla de orden de carga, y `node prueba.js` lo cazó al
primer intento.

### Sitios

`SITIOS[]` es un registro al que **cada sección empuja los suyos** con `sitio({x,z,r,tipo,nombre,
texto})`, en vez de una lista central que se desincroniza. `actSitios()` busca el más cercano dentro
de su radio y lo anuncia en el panel `#sitio` tras 0.4 s; se oculta al salir o al abrir una plática.
Corre en el grupo que siempre se ejecuta, así que funciona manejando y con la simulación congelada.

Sustituyó al aviso especial que tenían las garitas: era el mismo mecanismo resuelto para un solo
caso. Si agregas un monumento, agrega su `sitio()` al lado y ya.

`prueba.js` se para frente a los doce y falla si alguno no se anuncia, si le falta dato, o si está
metido en un edificio con un radio que no alcanza a salir de él.

### Landmarks fijos contra el generador

**`liberar(x,z,hw,hd)` antes de construir cualquier landmark de coordenada fija.** Las manzanas se
generan al azar y una casa puede caer encima de la catedral, la lonchería, el museo o el asta —el
mismo problema que tenían los personajes, resuelto al revés: en vez de mover el monumento, se le
quita de encima lo que el generador ya puso. Por eso `bloque()` guarda `malla` en el registro de
`edificios[]`: sin esa referencia no se podría sacar de la escena.

### Estadio y monumentos

El graderío del estadio es **un solo `CylinderGeometry` abierto escalado a óvalo** (`scale.set(RX,1,RZ)`
sobre radio 1), no un anillo de mallas: una llamada de dibujo para toda la tribuna. La colisión sí es
un anillo de catorce AABB, porque `chocaEdificios` solo entiende cajas.

**Las formas de los monumentos son interpretación.** Lo que se respeta es el sitio, el año y lo que
significan; no se pretende reproducir la escultura. Si algún día se ajustan las formas, el texto del
`sitio()` es lo que no debe cambiar sin volver a verificar la fuente.

### El Chamizal y la bandera

`FX,FZ` es el asta: 100 m, bandera de 50 × 28 m, medidas reales. **Se izó en 1997**, o sea que es de
época — a diferencia de la X de Sebastián, que es de 2013 y por eso no aparece.

`actBandera()` ondea reescribiendo **solo la Z** de cada vértice de `geoBandera` con dos senos
desfasados, amplificados por `u` (0 en el asta, 1 en la punta). La malla se construye una vez; por
cuadro solo se toca el atributo y se marca `needsUpdate`. Se llama **también con el juego pausado**,
para que no se congele detrás de la placa o del mapa.

`actoBandera()` repinta el lienzo entero —franjas, emblema y manchas— y sube `texBandera.needsUpdate`.
El nivel sale de `SANGRE[acto]`, que es el **acumulado real** de homicidios 2008→2011 normalizado
(0.16, 0.43, 0.79, 1.00), más hasta 0.12 de los muertos que lleve el jugador. Es monótono a
propósito: la sangre no se lava aunque en 2011 bajaran los homicidios. `prueba.js` verifica que
ondee y que la mancha crezca.

### Avenida Juárez

`NEGOCIOS[]` es tabla de datos: nombre, giro, color de fondo, color de tinta, **`aguante`** (0–1) y
**`despues`** (en qué se convirtió al cerrar, o `null`). `actoJuarez()` compara `aguante` contra
`AGUANTE[acto]`: 16 abiertos en 2008, 5 en 2011. El que cierra y tiene `despues` cambia de rótulo
—refaccionaria, forrajería, estética, que es lo que de verdad pasó en la zona— y el que no, se
tapia. Agregar un negocio es agregar una fila.

Los rótulos **no van en `materialesFachada`**: su emisivo lo maneja `actDiaNoche` en un bucle aparte
sobre `antros`, porque solo debe prender el neón de los que siguen abiertos. Un negocio muerto no
brilla aunque sea de noche.

El tramo lo construye su propia sección: el generador de manzanas salta `enTramoJuarez(i,j)`
(`i∈{2,3}, j∈{0,1}`) o los edificios genéricos se encimarían con las fachadas. Por eso la sección
también rellena el interior de esas manzanas: si no, quedan huecas y se ve el desierto por atrás.

**El rótulo tiene que salir del muro Y mirar a la calle.** Los neones estuvieron invisibles dos
veces seguidas por dos causas distintas:

1. *Posición.* `cara` es la fachada y `frente = cara - lado*0.6` la saca hacia la banqueta. Con `+`
   en vez de `−`, los dieciséis quedan dentro de su propio muro.
2. *Orientación.* Un `PlaneGeometry` mira a `+Z`; girado `+π/2` en Y su normal queda en `+X`. El
   muro poniente (`lado=-1`) necesita `+π/2`, así que la rotación es **`-lado*Math.PI/2`**. Con
   `lado` a secas quedan de espaldas y, siendo `FrontSide`, no se ven desde la calle.

Ninguna de las dos tira un error: la calle se construye completa y simplemente no hay neón. Revisar
posición no basta — `prueba.js` comprueba además que la normal apunte hacia afuera del edificio, y
el material va en `DoubleSide` como seguro.

**La fachada de la Juárez es familia aparte** (`F_JUAREZ`, 3 columnas × 2 filas). Las texturas de
`'centro'` traen 5 filas de ventanas por repetición: un local de 10 m con esa textura se ve como un
edificio de diez pisos. Las filas del tejido tienen que corresponder a la altura real.

### Colocación de personajes

**`despejar(x,z,r)` no es opcional.** Las esquinas de `PERSONAJES` son a mano, pero las manzanas se
generan al azar en cada partida: sin esto, dos a cuatro personajes nacen dentro de un edificio, su
marcador de recogida cae en la pared y **el encargo se vuelve imposible de tomar** — la partida se
atora en ese acto para siempre. Se corre al construir, con `r=8` para que quepan la persona y su
marcador. Por eso la sección `PERSONAJES` tiene que ir después de que `edificios[]` esté lleno.
`prueba.js` tiene la regresión.

### Mapas

Un solo dibujante, `dibujarMundo(g,S,cx,cz,esc,giro,grande)`, sirve a los dos mapas: recibe qué
punto del mundo va al centro, la escala en píxeles por metro y el giro. Los dos lo llaman con
parámetros distintos y nada se duplica.

**El minimapa es brújula, no plano.** Va recortado a un círculo, el mundo gira `ang - π` y el
jugador se dibuja fijo apuntando arriba. La marca de norte se calcula aparte en
`(-sin ang, cos ang)` desde el centro: si vas al sur, la N queda abajo. El marcador del encargo se
pega al borde del círculo cuando queda fuera, no al borde de un cuadrado.

**El mapa grande** (`#mapa`, `mapaGrande()`) es cuadrado, fijo al norte, cubre `GX0..GX1 × GZ0..GZ1`
—toda la ciudad más El Paso— y rotula las avenidas en los bordes. Se abre con clic al minimapa o
`T`, **pausa el juego** (`jugando=false`) y se cierra con `Esc`, el botón, o clic fuera del lienzo.

`pines[]` son los pines de seguimiento, máximo nueve. `pinEn()` convierte el clic a coordenadas de
mundo y alterna: si caes cerca de uno existente lo quita, si no lo pone. Se dibujan en los dos mapas
y el HUD muestra la distancia al más cercano junto al nombre de la calle. **No se guardan** en la
partida: son de la sesión.

`Escape` y `T` se atienden **antes** del `if(!jugando)return` del manejador de teclado, porque con
el mapa abierto el juego está pausado y si no, no habría cómo cerrarlo.

### La lonchería

`loncheria` es el único edificio con estado narrativo. `actoLoncheria()` la degrada por acto —
rótulo, cortina, color de muro— y la llaman `avanzarActo()` y ARRANQUE. Es el termómetro del juego
y no dice una sola línea: se ve al pasar. Está en la esquina donde arranca el jugador a propósito.

### Colisiones

`chocaEdificios(p, r)` — círculo contra AABB, resuelve por el eje de menor penetración y **muta
`p.x`/`p.z` in situ**. Cubre edificios y el límite del mapa. No hay motor de física. Entidad contra
entidad es ad hoc dentro de `actAutoJugador` (atropellos y choques).

### Rendimiento (restricciones deliberadas)

Sin shadow maps: `sombra()` pone una mancha radial en un plano bajo cada entidad. La calle entera es
un draw call (textura de canvas sobre un plano). `pixelRatio` topado a 1.5. Objetivo: GPU integrada.

Las colonias se construyen **una malla por hilera de casas**, no una por casa: ~150 edificios en
lugar de ~350. Y de paso es más fiel, porque Juárez son casas pegadas de una planta. `chocaEdificios`
recorre `edificios[]` linealmente en cada llamada, así que ese conteo es el presupuesto real — si
sube mucho, la colisión se nota antes que el render.

### Audio

`iniciarAudio()` corre en el click de *ENTRAR A LA CIUDAD* — requisito de gesto de usuario, no
moverlo antes. Los osciladores de motor y sirena viven permanentemente y se controlan por ganancia;
los efectos puntuales usan `pip(freq, vol, tipo)` con osciladores de vida corta.

### HUD

`ui` cachea todas las referencias del DOM; el texto pasa por ahí. `aviso3()` = toast temporal,
`ui.aviso` = pantalla grande de arresto/noqueo. El minimapa se redibuja completo cada frame en
`minimapa()` con culling manual por distancia.

## Contexto narrativo

`HISTORIA.md` es la biblia del juego: Ciudad Juárez 2008–2012, dramatización de la guerra del narco.
**Leerlo antes de tocar texto, personajes, facciones o misiones.** Reglas que no se negocian y que
ese archivo detalla: organizaciones con nombre real, personas reales con nombre paródico, víctimas
reales fuera del contenido jugable, y matar civiles cuesta en vez de pagar. Su sección *Reskin de
sistemas* mapea cada mecánica ya existente a su significado narrativo.

## Contexto adicional

El README lista la lista de pendientes (motos, misiones de persecución, tiendas, radio, reputación)
y las notas técnicas orientadas a jugador.
