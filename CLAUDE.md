# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

Sandbox 3D de mundo abierto en **un solo archivo**: `index.html` (2402 líneas). Sin build step, sin
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

**El rótulo va hacia la calle, no hacia adentro.** `cara` es la fachada y `frente = cara - lado*0.35`
la saca hacia la banqueta. Poner `+` en vez de `−` entierra los dieciséis rótulos dentro de su
propio muro y no se ve un solo neón, sin ningún error en consola. `prueba.js` tiene la regresión.

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
