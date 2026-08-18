# FRONTERA

Sandbox 3D de mundo abierto en un solo archivo HTML. **Ciudad Juárez, 2008–2012**: la guerra
del narco dramatizada como juego. Avenidas reales, el Río Bravo, la valla y los cuatro puentes
internacionales, con El Paso enfrente y fuera de tu alcance. Sin build step, sin dependencias
instaladas, sin un solo asset externo: geometría, texturas y audio se generan por código en
tiempo de carga.

**[▶ Jugar](https://walfro90-gorilla.github.io/frontera/)** · 124 KB · WebGL

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
- **Doce sitios que se explican solos.** Párate enfrente y el HUD te dice qué es y por qué importa:
  el asta del Chamizal, su museo, el Kentucky Club, el Noa Noa, la catedral y la misión de 1659, la
  lonchería, el bordo con su valla, los cuatro puentes y el letrero del Cerro Bola. Datos reales,
  sin sermón y sin detener el juego.
- **El Chamizal y la bandera monumental.** Las 177 hectáreas que el Bravo se llevó en 1864 y que
  México recuperó en 1967 tras cien años de reclamos, sin un tiro. En 1997 le pusieron el asta:
  100 metros, bandera de 50 × 28, a quinientos metros de la línea, para celebrarlo. Ondea de verdad
  —se le reescribe la malla cuadro a cuadro— y **se va manchando de sangre acto por acto**, según el
  acumulado real de muertos de cada año, más un poco de los que pongas tú. La mancha no se quita.
- **La Avenida Juárez.** La calle de la fiesta, del puente Santa Fe hacia el sur: bares, antros,
  restaurantes, hoteles, casas de cambio, farmacias de 24 horas y dentistas para el que cruzaba.
  Dieciséis negocios con su neón, que de noche prende. Y que se va apagando: en 2008 abre completa,
  en 2011 quedan cinco. El **Kentucky Club** aguanta los cuatro actos porque en la vida real es el
  último de los bares legendarios de la frontera que sigue de pie. Lo que cerró no quedó tapiado:
  se volvió refaccionaria, forrajería, pollería o estética, que es lo que de verdad pasó.
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
- **Toque de queda de facto.** Nadie lo decretó: al oscurecer los civiles se meten a su casa y los
  únicos que quedan en la calle son los sicarios. Así era.
- **Seis personajes con esquina fija.** Doña Chayo en su lonchería, El Diablo de La Línea, Marisol
  la reportera, El Kilo de Gente Nueva, Luz que busca a su hija, y Yoli tu hermana. Se les habla con
  `F`, dicen cosas distintas en cada acto, y **no se les puede disparar**: eso no es un descuido.
- **Los encargos los da alguien.** El marcador de recogida es la persona que te contrata, así que
  aprendes dónde para cada quien. El Diablo desaparece en el acto IV; en julio de 2011 lo agarraron,
  y el juego no te lo explica.
- **La lonchería de Doña Chayo.** En la esquina donde arrancas. Abre en 2008, aguanta la cuota, baja
  la cortina y acaba tapiada y quemada. Nadie te lo dice; lo ves al pasar.
- **Mordida.** La municipal se arregla con $400 porque La Línea está hecha de policías. La federal
  no: no por honesta, sino porque cobra más arriba y no de ti.
- **Ciclo día/noche de cuatro minutos.** Al anochecer se encienden solas las ventanas, las farolas,
  los faros de los autos y el rótulo de la lonchería.
- **Levantón y Cruz Roja.** Perder cuesta dinero, nunca la partida.
- **Mapa brújula.** El minimapa es redondo y gira contigo: tú siempre apuntas arriba y el norte se
  pasea por el aro, como en GTA. Clic (o `T`) lo abre a pantalla completa, fijo al norte, con los
  nombres de las avenidas, y ahí pones hasta nueve **pines de seguimiento**. El HUD te dice a
  cuántos metros está el más cercano. La Av. Juárez se ve prendida en el mapa y se va apagando.
- **Tiene final. Al cerrar el acto IV salen las cifras reales, tu propio contador de muertos al
  lado del de la ciudad, y la sentencia de 2024. La partida se guarda sola; `#nuevo` en la URL la
  borra.

## Controles

| Tecla | Acción |
|---|---|
| `W A S D` | Caminar / conducir |
| `Shift` | Correr |
| `Espacio` | Saltar / freno de mano |
| `F` | Hablar, o subir y bajar del auto (según lo que tengas enfrente) |
| `E` | Disparar (solo a pie) |
| `Q` | Cambiar de arma |
| `G` | Dar mordida a la municipal ($400) |
| `T` o clic al minimapa | Abrir el mapa grande |
| `Esc` | Cerrar el mapa |
| Arrastrar mouse | Girar cámara |
| Rueda | Acercar o alejar |
| `R` | Enderezar auto |
| `M` | Silenciar |

En dispositivos táctiles aparece un joystick virtual con botones de gas, acción y fuego. En el HUD,
el nombre del arma es tocable para cambiarla y el dinero es tocable para dar mordida.

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
- **El bajo de los antros.** Un oscilador filtrado a 220 Hz con envolvente por golpe, cuyo volumen
  sale de tu distancia lateral a la Av. Juárez, de la hora y del acto. Se oye como música saliendo
  por una pared, se acerca cuando te acercas, y en 2011 casi no se oye.
- **Balazos.** Un solo buffer de ruido con caída exponencial, generado al arrancar y filtrado
  distinto por arma: la escopeta pasa por un lowpass más grave que la pistola. Un buffer, dos armas.
- **Partida guardada.** `localStorage` y `JSON.stringify`. Cinco campos, sin librería.
- **Audio.** Motor con oscilador sierra filtrado por lowpass mapeado a velocidad; sirena de dos
  tonos; efectos con osciladores de vida corta. Todo Web Audio, cero archivos.

## Por hacer

- [ ] Que los encargos cambien según de qué facción cobres
- [ ] Que Luz te vaya dando el mapa de los tiraderos
- [ ] Motos y variación de manejo por clase de vehículo
- [ ] Tiendas donde gastar el dinero
- [ ] Radio con locutor y música generada por Web Audio
- [ ] El coche bomba del acto III como evento del mundo

## Licencia

MIT. Mundo, mecánicas, arte y código son originales; no contiene propiedad intelectual de
terceros.

Hecho en Ciudad Juárez por [Gorilla Labs](https://github.com/walfro90-gorilla).
