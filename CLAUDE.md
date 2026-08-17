# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

Sandbox 3D de mundo abierto en **un solo archivo**: `index.html` (1771 líneas). Sin build step, sin
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

### Sistema de coordenadas

La rejilla **no es uniforme**: `EJESX` y `EJESZ` son tablas `[coordenada, nombre, ancho]` con las
avenidas reales de Juárez en su orden y separación relativa. 9 ejes X × 8 ejes Z → 8 × 7 manzanas.
**Norte = −Z.** Toda posición nueva pasa por estos accesores, nunca por aritmética a mano:

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

### Bucle

`bucle(now)`: `dt` topado a 0.05. `bloqueo>0` congela la simulación (arresto/noqueo) pero cámara,
ciclo día/noche, audio, HUD y minimapa siguen corriendo siempre.

### Día/noche por materiales compartidos

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
`avanzarActo()` congela el juego y saca la placa. **Agregar contenido de época = agregar una fila,
no código.**

### Dos calores

`calor.fed` y `calor.plaza`, 0–5 cada uno, con enfriamientos distintos (13 s contra 22 s: el Estado
olvida antes que el barrio). `calor.faccion` recuerda a quién le pegaste, para que sean sus sicarios
los que salgan. `actPersecucion()` maneja ambos con el mismo motor.

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
