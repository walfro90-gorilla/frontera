# FRONTERA

Sandbox 3D de mundo abierto en un solo archivo HTML. **Ciudad Juárez, 2008–2012**: la guerra
del narco dramatizada como juego. Avenidas reales, el Río Bravo, la valla y los cuatro puentes
internacionales, con El Paso enfrente y fuera de tu alcance. Sin build step, sin dependencias
instaladas, sin un solo asset externo: geometría, texturas y audio se generan por código en
tiempo de carga.

**[▶ Jugar](https://walfro90-gorilla.github.io/frontera/)** · 78 KB · WebGL

> Dramatización. Las organizaciones criminales y las corporaciones policiacas llevan su nombre
> documentado; las personas reales aparecen con nombre paródico. Las víctimas reales de esos
> años no son contenido jugable. El contexto completo, las fuentes y las reglas editoriales
> están en **[HISTORIA.md](HISTORIA.md)**.

---

## Qué hay adentro

- **La ciudad de verdad.** Nueve avenidas con nombre real en su orden y posición relativa: Lerdo,
  Juárez, Francisco Villa, Abraham Lincoln, de las Américas, Waterfill, 16 de Septiembre, Vicente
  Guerrero, Triunfo de la República. Zona Centro con su catedral, el Chamizal junto al río,
  colonias de casas pegadas, maquilas al sur y la Sierra de Juárez al poniente con su letrero.
- **La frontera.** El Bravo como el canal de concreto que es, el bordo, la valla del lado gringo y
  los cuatro puentes internacionales: Paso del Norte, Stanton–Lerdo, Córdova–Américas y Zaragoza.
  Llegas a la garita y ahí te quedas. El Paso se ve, no se pisa.
- **Cuatro actos, 2008 a 2012.** Cada acto cambia el año, los encargos, quién patrulla la calle y
  cuánta valla hay levantada. Entre uno y otro, una placa con lo que pasó de verdad ese año.
- **Dos calores.** El **federal** (militares y municipales hasta 2010, Policía Federal después) y
  el de **plaza** (la facción a la que le pegaste te manda sicarios). Suben por razones distintas
  y se enfrían a ritmos distintos: el Estado olvida antes que el barrio.
- **Control de plaza.** Cada manzana es de La Línea, de Gente Nueva o está disputada. Se ve en el
  minimapa y cambia acto por acto: Sinaloa avanza de poniente a oriente hasta ganar la ciudad.
- **Peatones que no son decorado.** Civiles, halcones que te reportan si andas caliente, y sicarios
  que te disparan si le pegaste a los suyos.
- **Matar civiles cuesta.** Sicarios pagan; un civil te quita $300, te truena el calor federal y
  baja las cortinas de la cuadra: ahí ya no hay encargos por un rato.
- **Ciclo día/noche de cuatro minutos.** Al anochecer se encienden solas las ventanas, las farolas
  y los faros de los autos.
- **Levantón y Cruz Roja.** Perder cuesta dinero, nunca la partida.

## Controles

| Tecla | Acción |
|---|---|
| `W A S D` | Caminar / conducir |
| `Shift` | Correr |
| `Espacio` | Saltar / freno de mano |
| `F` | Subir o bajar del auto |
| `E` | Disparar (solo a pie) |
| `Q` | Cambiar de arma |
| Arrastrar mouse | Girar cámara |
| Rueda | Acercar o alejar |
| `R` | Enderezar auto |
| `M` | Silenciar |

En dispositivos táctiles aparece un joystick virtual con botones de gas, acción y fuego; el nombre
del arma en el HUD es tocable para cambiarla.

## Correrlo local

Abrir `index.html` en el navegador es suficiente. Si prefieres servirlo:

```bash
python3 -m http.server 8000   # http://localhost:8000
node prueba.js                # prueba de humo: juega solo los cuatro actos
```

## Notas técnicas

Three.js r128 desde CDN, todo lo demás es código propio.

- **El mapa.** No usa datos de OpenStreetMap: son ejes a mano con las coordenadas de las avenidas
  reales, en su orden y separación relativa. A 1:1 Juárez son 25 km y el 95% sería colonia
  repetida; comprimido cabe en un mapa jugable de 1.2 × 1 km y se reconoce igual. El costo de
  OSM habría sido megas de datos y reescribir el grafo de tráfico para polilíneas arbitrarias.
- **Ciudad.** El trazado de calles, banquetas, líneas de carril y cruces peatonales se dibuja una
  sola vez en un `<canvas>` de 2048² que se aplica como textura a un plano. Un draw call para
  toda la calle en lugar de miles de mallas.
- **Persecución.** Las patrullas no van en línea recta: siguen el mismo grafo de intersecciones
  que el tráfico, eligiendo en cada nodo el vecino que más las acerca, y solo se van derecho
  cuando ya están a menos de 40 m. Sin eso se quedan clavadas contra las fachadas.
- **Colonias.** Una malla por hilera de casas, no una por casa. Menos draw calls y además es
  como se ve Juárez de verdad: casas pegadas de una planta.
- **Fachadas.** Cada edificio recibe dos texturas generadas: la base con ventanas apagadas y un
  `emissiveMap` con las encendidas. La noche solo sube `emissiveIntensity` de forma global.
- **Sombras.** Sin shadow map: una mancha radial en un plano bajo cada entidad. Se ve bien y
  cuesta casi nada en GPU integrada.
- **Colisiones.** Círculo contra AABB con resolución por el eje de menor penetración. Sin motor
  de física.
- **Disparo.** Hitscan por cono: alcance y ángulo contra la dirección de la cámara. Sin proyectiles,
  sin raycaster, sin recorrer geometría.
- **Audio.** Motor con oscilador sierra filtrado por lowpass mapeado a velocidad; sirena de dos
  tonos; efectos con osciladores de vida corta. Todo Web Audio, cero archivos.

## Por hacer

- [ ] Encargos guionizados por acto en vez de generados (los textos ya están, falta el guion)
- [ ] Personajes con los que se hable: Doña Chayo, Marisol, El Diablo, Luz
- [ ] Motos y variación de manejo por clase de vehículo
- [ ] Tiendas donde gastar el dinero
- [ ] Radio con locutor y música generada por Web Audio
- [ ] El coche bomba del acto III como evento del mundo

## Licencia

MIT. Mundo, mecánicas, arte y código son originales; no contiene propiedad intelectual de
terceros.

Hecho en Ciudad Juárez por [Gorilla Labs](https://github.com/walfro90-gorilla).
