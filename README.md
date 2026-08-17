# FRONTERA

Sandbox 3D de mundo abierto en un solo archivo HTML. Ciudad fronteriza procedural de 7×7
manzanas con tráfico, peatones, patrullas y encargos de entrega. Sin build step, sin
dependencias instaladas, sin un solo asset externo: geometría, texturas y audio se generan
por código en tiempo de carga.

**[▶ Jugar](https://walfro90-gorilla.github.io/frontera/)** · 48 KB · WebGL

---

## Qué hay adentro

- **A pie y al volante.** Te subes a cualquier auto con `F`, incluidos los del tráfico en movimiento.
- **Ciudad viva.** Los autos de tráfico navegan un grafo de intersecciones y frenan por el de
  adelante; los peatones recorren el perímetro de su manzana y huyen cuando sube el escándalo.
- **Armas.** Pistola de un blanco a distancia y escopeta de cono corto que tumba a varios de un
  tiro. Cada baja paga $45 y sube el calor.
- **Nivel de búsqueda.** Disparar, atropellar o chocar sube estrellas. Aparecen patrullas que persiguen con
  volumen de sirena según distancia. Trece segundos sin contacto visual y baja una estrella.
- **Encargos de entrega.** El pago escala con la distancia y la racha; el reloj corre y perderlo
  cuesta el multiplicador.
- **Ciclo día/noche de cuatro minutos.** Al anochecer se encienden solas las ventanas, las farolas
  y los faros de los autos.
- **Arresto y hospital.** Perder cuesta dinero, nunca la partida.

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
```

## Notas técnicas

Three.js r128 desde CDN, todo lo demás es código propio.

- **Ciudad.** El trazado de calles, banquetas, líneas de carril y cruces peatonales se dibuja una
  sola vez en un `<canvas>` de 2048² que se aplica como textura a un plano. Un draw call para
  toda la calle en lugar de miles de mallas.
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

- [ ] Motos y variación de manejo por clase de vehículo
- [ ] Misiones de persecución y de ruta fija con checkpoints
- [ ] Tiendas donde gastar el dinero
- [ ] Radio con música generada por Web Audio
- [ ] Sistema de reputación por zona

## Licencia

MIT. Mundo, mecánicas, arte y código son originales; no contiene propiedad intelectual de
terceros.

Hecho en Ciudad Juárez por [Gorilla Labs](https://github.com/walfro90-gorilla).
