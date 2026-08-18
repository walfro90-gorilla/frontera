# FODA y plan de acción — FRONTERA

Diagnóstico del proyecto y qué hacer con él. Documento vivo: cuando algo del plan se cumpla,
se marca aquí y se vuelven a medir las cifras de abajo.

---

## Dónde está el proyecto

| Medida | Valor |
|---|---|
| Juego | `index.html` · 3,981 líneas · 192 KB · 43 secciones |
| Prueba | `prueba.js` · 459 líneas · 53 aserciones · 31 s por corrida |
| Documentación | 1,103 líneas entre `CLAUDE.md`, `HISTORIA.md` y `README.md` |
| Mundo | 231 edificios · 102 autos · 34 peatones · 26 sitios · 6 personajes |
| Escena | ~2,650 mallas al cargar · ~2,760 jugando · sin fugas · **FPS sin medir** |
| Contenido histórico | 16 hechos jugables · 4 actos · 22 fuentes citadas |
| Dependencias | Three.js r128 (MIT) guardada en `vendor/` · **cero llamadas a la red** |

---

## 🟩 Fortalezas

**La tesis y la mecánica dejaron de pelear.** Es el activo principal y es raro. Durante buena parte
del desarrollo hubo que contener el juego con reglas —matar civiles cuesta, no se puede colgar a
nadie, Salvárcar fuera de pantalla—. Con el protagonista reportero, el verbo del juego *es* mirar y
dejar constancia: ya no hay que sujetar nada.

**Rigor histórico verificable.** Cada fecha y cifra tiene fuente citada. Ya evitó tres errores de
época: la X de Sebastián (2013), el distribuidor vial de la Sanders (2012) y *«¿Qué quieren de
nosotros?»* mal fechada en 2011.

**La prueba de humo se paga sola.** Cazó bugs que ninguna revisión a ojo habría encontrado, y
ninguno tiraba error: rótulos de neón de espaldas, personajes naciendo dentro de edificios,
patrullas que no pasaban de 180 m, el reloj con seis horas de desfase, el periodicazo que se saltaba
solo con una tecla presionada.

**Costo marginal de contenido casi cero.** Un hecho nuevo es una fila. Un sitio, una llamada. Un
negocio de la Avenida Juárez, una fila.

**Documentación desproporcionada** —1,103 líneas para 3,981 de código— y anotando las trampas, no
solo la arquitectura.

## 🟥 Debilidades

**El rendimiento está medido a medias.** La escena tiene **~2,650 mallas al cargar y ~2,760
jugando** —tres veces más de lo que yo había estimado a ojo en la primera versión de este
documento—, sin fugas: entre el arranque y el final de una partida solo crecen ~120, que son los
sucesos vivos. El desglose: **12 mallas por auto × ~90 autos = 1,068**, 8 por persona × 34 = 272, y
~440 objetos de una sola malla entre edificios y utilería.

Lo que sigue sin saberse son **los FPS reales en GPU integrada**, porque `prueba.js` corre sin GPU.
El medidor ya existe (`P` o `index.html#perf`) y reporta fps, ms, llamadas de dibujo, pico,
triángulos y mínimos. Falta que alguien lo abra y anote el número aquí.

**Nada visual está verificado automáticamente.** La prueba corre sin GPU. Todo lo que se ve depende
de que alguien lo mire — ya falló dos veces seguidas con los mismos neones.

**Un archivo de 3,981 líneas** con 43 secciones y orden de carga frágil: dos errores de TDZ hasta
ahora, ambos con síntoma de pantalla negra sin mensaje.

**El arnés tiene sus propios bugs.** 459 líneas que también hay que mantener; ya tuvo livelock,
deadlock y deriva de fases.

**El balance nunca lo tocó un humano.** Pagos, racha, calor y cadencias salieron de una simulación,
no de alguien jugando.

**Sin menú, sin control de volumen, sin dificultad.** Accesibilidad limitada a
`prefers-reduced-motion`.

## 🟦 Oportunidades

**Nicho vacío.** No existe un juego serio sobre esto hecho desde Juárez. El ángulo del reportero lo
vuelve defendible ante prensa, academia y museos — cosa que el ángulo de sicario nunca habría sido.

**`HISTORIA.md` ya se sostiene solo** como documento, aparte del juego.

**Fechas con gancho:** aniversarios de Villas de Salvárcar (31 de enero) y del coche bomba (15 de
julio). UACJ, Museo de El Chamizal, El Diario.

**Es un link.** Corre en cualquier navegador, cabe en una laptop de exposición, se comparte sin
instalar nada.

**Festivales con carga documental:** A MAZE, IndieCade, Games for Change.

## 🟧 Amenazas

~~**Three.js desde CDN es un punto único de falla.**~~ **Resuelta.** Estaba en cdnjs y si retiraban
r128 el juego moría en silencio. Ahora va en `vendor/`, servido desde el repo: `index.html` no llama
a ningún dominio externo.

**Sensibilidad del tema.** Las familias siguen vivas. Un titular malintencionado puede hundirlo
aunque el contenido sea impecable. Mitigado a medias: las reglas editoriales están escritas y son
públicas en `HISTORIA.md`.

**Nombres reales de negocios** (Kentucky Club, Noa Noa). Riesgo bajo, no nulo.

**Un solo autor.** Si se abandona, se acaba.

---

## Plan de acción

Tamaños: **S** una sesión · **M** dos o tres · **L** más.
Cada tarea tiene criterio de aceptación, para que «hecho» no se discuta.

### P0 — Quitar lo que puede matar el proyecto sin avisar

| # | Tarea | Ataca | Tam. | Hecho cuando |
|---|---|---|---|---|
| 1 | ~~Anclar Three.js en el repo~~ ✅ | Amenaza CDN | S | **Hecho.** r128 (MIT, 603 KB) en `vendor/`, verificado que trae las clases que usa el juego. El HTML ya no llama a ningún dominio externo |
| 2 | ~~Medidor de rendimiento~~ ⚠️ | Debilidad de perf | S | **Medidor hecho** (`P` o `#perf`) y **mallas contadas: ~2,650 al cargar, ~2,760 jugando, sin fugas**. Falta lo que solo se puede hacer con GPU: **anotar los FPS reales aquí** |
| 3 | **Revisión visual sistema por sistema** con capturas | Debilidad visual | M | Existe una lista de los 20 sistemas con captura y visto bueno de cada uno |

### P1 — Que el juego aguante lo que ya tiene

| # | Tarea | Ataca | Tam. | Hecho cuando |
|---|---|---|---|---|
| 4 | **Bajar mallas**: los autos cuestan 12 cada uno y son el 40% de la escena. Fusionar carrocería o instanciar | Perf | M | Menos de 2,000 mallas sin perder densidad, y `PRESUPUESTO_MALLAS` bajado en `prueba.js` |
| 5 | **Aserción de orden de carga** en `prueba.js` | TDZ recurrente | S | Mover una sección hacia arriba hace fallar la prueba con mensaje claro |
| 6 | **Menú**: volumen, calidad (sombras/densidad), reiniciar partida | Accesibilidad | M | Se puede bajar el volumen y la densidad sin tocar código ni la URL |
| 7 | **Ambiente sonoro de ciudad**: tráfico lejano, viento, perros | Audio pobre | S | El silencio deja de notarse al estar parado en la calle |

### P2 — Que el juego sea bueno, no solo correcto

| # | Tarea | Ataca | Tam. | Hecho cuando |
|---|---|---|---|---|
| 8 | **Playtest con tres juarenses** que no sean el autor | Balance y registro | M | Hay notas de las tres sesiones, con lo que no se entendió y lo que incomodó |
| 9 | **Ajuste de balance** con lo que salga del playtest | Balance inventado | M | Los números cambiaron por evidencia y quedó anotado por qué |
| 10 | **Tutorial de treinta segundos**: primera asignación guiada | Curva de entrada | S | Alguien que nunca lo vio publica su primera nota sin preguntar nada |
| 11 | **Firmar tiene consecuencia narrativa**, no solo calor | Profundidad | M | En el acto IV, firmar o no cambia lo que dicen Marisol y Yoli |

### P3 — Que exista para alguien más

| # | Tarea | Ataca | Tam. | Hecho cuando |
|---|---|---|---|---|
| 12 | **Portada del repo**: capturas, video de treinta segundos, README en inglés | Difusión | M | Alguien que llega de fuera entiende qué es en diez segundos |
| 13 | **Nota de prensa / texto de sala** apoyado en `HISTORIA.md` | Institucional | S | Hay un texto de una cuartilla que se puede mandar tal cual |
| 14 | **Contacto en aniversario** (31 de enero o 15 de julio) | Oportunidad | S | Está mandado a UACJ, museo o redacción |
| 15 | **Festival con carga documental** | Difusión | M | Postulado a por lo menos uno |

---

## Riesgos que se aceptan a conciencia

- **Nombres de negocios reales** (Kentucky Club, Noa Noa). Son patrimonio de la avenida, aparecen
  como homenaje y el juego no les atribuye nada. Se sostiene.
- **Formas de monumentos inventadas** donde no había referencia confiable. Está declarado en
  `CLAUDE.md`; lo que se respeta es sitio, año y significado.
- **Un solo archivo.** El costo de partirlo hoy supera al de mantenerlo, mientras la prueba siga
  cazando los errores de orden de carga.
- **Un solo autor.** No hay plan para eso, y está bien que se diga.

---

## Cifras para volver a medir

Cuando se retome este documento, actualizar: líneas de `index.html`, mallas en escena, FPS en GPU
integrada, número de aserciones, hechos jugables y fuentes citadas. Si las mallas subieron y los FPS
no se midieron, la tarea 2 volvió a quedar pendiente.

`prueba.js` ya defiende dos de esas cifras solo: falla si la escena pasa de **3,200 mallas** o si
durante una partida se acumulan más de **600** respecto al arranque. Ese segundo umbral es el
detector de fugas, y sirvió: al ponerlo salió que cada balacera creaba noventa mallas de un solo uso
para los fogonazos, que ahora se reciclan.
