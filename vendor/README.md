# vendor

Dependencias de terceros guardadas en el repo a propósito.

## three.min.js

Three.js **r128**, licencia MIT, © 2010-2021 Three.js Authors. El aviso de licencia va dentro del
propio archivo, en su cabecera.

Estaba en `cdnjs.cloudflare.com` y se trajo aquí porque era el **único punto de falla externo** del
proyecto: si retiraban esa versión, el juego dejaba de arrancar sin ningún mensaje. Ahora
`index.html` no le pide nada a la red.

Son 603 KB, más que el juego entero, y aun así vale la pena: es la diferencia entre un archivo que
va a seguir corriendo en diez años y uno que depende de que alguien más mantenga una URL.

### Para actualizar la versión

```bash
curl -sS -o vendor/three.min.js https://cdnjs.cloudflare.com/ajax/libs/three.js/rXXX/three.min.js
node -e "const T=require('./vendor/three.min.js');console.log(T.REVISION)"
node prueba.js
```

Y después **abrir el juego**: la prueba corre sin GPU y no detecta cambios de API de render.
r128 es de 2021 y el juego usa `outputEncoding`, `MeshLambertMaterial` con `emissiveMap` y
`readRenderTargetPixels`; versiones nuevas movieron varias de esas cosas de lugar.
