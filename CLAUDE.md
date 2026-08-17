# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

Sandbox 3D de mundo abierto en **un solo archivo**: `index.html` (1064 líneas). Sin build step, sin
`package.json`, sin tests, sin linter. Única dependencia: Three.js **r128** por CDN. Todo lo demás
—geometría, texturas, audio— se genera por código al cargar. **Cero assets externos**: es una
propiedad del proyecto, no un accidente. No agregar imágenes, fuentes ni archivos de sonido.

## Comandos

```bash
# correr: abrir index.html directo en el navegador, o
python3 -m http.server 8000        # http://localhost:8000
```

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

`MANZANAS=7`, `CELDA=70`, `CALLE=16`, `MITAD=245`. `nodo(i) = -MITAD + i*CELDA` convierte índice de
rejilla a coordenada de mundo. **Toda posición nueva debe pasar por `nodo()`**:

- `nodo(i)` = eje central de calle (8 ejes por lado, `i` de 0 a 7)
- `nodo(i)+CELDA/2` = centro de manzana (`i` de 0 a 6)

`tipo[i][j]` (`'parque'|'lote'|'ciudad'`) se sortea una vez al inicio y lo consumen **dos** lugares:
`texSuelo` (que lo hornea en un canvas de 2048²) y el bucle que construye manzanas. Cambiar la
lógica de tipos exige tocar ambos o el suelo pintado dejará de coincidir con la geometría.

### Entidades

Objetos planos `{malla, x, z, ang, ...}` donde `malla` es un `THREE.Group`. El estado de verdad son
`x/z/ang`; la malla se sincroniza al final de cada función de actualización. Nunca leer posición
desde la malla.

`autos[]` usa el campo **`clase`** como máquina de estados: `'parado'` → `'robado'` cuando el
jugador entra (`entrarSalir`), y de vuelta al salir. `'trafico'` navega el grafo de intersecciones
con `ni/nj` (nodo actual) y `ti/tj` (destino), eligiendo vecino con `vecino()` sin regresarse.
`'policia'` se crea y destruye dinámicamente (`actPolicia` / `limpiarPolicias`) según
`jugador.estrellas`.

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

`matar(p)` paga y tumba al peatón; **el calor lo sube quien llama**, no `matar` — así un escopetazo
de 4 bajas cuesta una estrella y no cuatro. Lo llaman `disparar()` y el atropello en
`actAutoJugador`.

Solo se dispara a pie. Comprobación: abrir `index.html#test` y ver la consola (asserts de `enMira`).

### Colisiones

`chocaEdificios(p, r)` — círculo contra AABB, resuelve por el eje de menor penetración y **muta
`p.x`/`p.z` in situ**. Cubre edificios y el límite del mapa. No hay motor de física. Entidad contra
entidad es ad hoc dentro de `actAutoJugador` (atropellos y choques).

### Rendimiento (restricciones deliberadas)

Sin shadow maps: `sombra()` pone una mancha radial en un plano bajo cada entidad. La calle entera es
un draw call (textura de canvas sobre un plano). `pixelRatio` topado a 1.5. Objetivo: GPU integrada.

### Audio

`iniciarAudio()` corre en el click de *ENTRAR A LA CIUDAD* — requisito de gesto de usuario, no
moverlo antes. Los osciladores de motor y sirena viven permanentemente y se controlan por ganancia;
los efectos puntuales usan `pip(freq, vol, tipo)` con osciladores de vida corta.

### HUD

`ui` cachea todas las referencias del DOM; el texto pasa por ahí. `aviso3()` = toast temporal,
`ui.aviso` = pantalla grande de arresto/noqueo. El minimapa se redibuja completo cada frame en
`minimapa()` con culling manual por distancia.

## Contexto adicional

El README lista la lista de pendientes (motos, misiones de persecución, tiendas, radio, reputación)
y las notas técnicas orientadas a jugador.
