# Caso Practico 2 · Representacion visual interactiva de accidentes

Fase 8 (bonus) implementada con React + Konva.

## Alcance de esta fase

- Layout dividido en dos paneles:
  - Izquierda: lienzo interactivo Konva.
  - Derecha: vista JSON de la escena en tiempo real.
- Toolbar para anadir elementos base:
  - Vehiculo
  - Obstaculo
  - Referencia
- Drag and drop de todos los elementos sobre el lienzo.
- Seleccion de elementos desde el canvas.
- Interacciones de transformacion con Konva Transformer:
  - rotacion con snap angular
  - escala mediante handlers
  - limites minimos para evitar colapso visual
- Inspector para editar propiedades principales:
  - estado (`free` | `occupied`)
  - tipo de zona (`vehicle-zone` | `obstacle-zone` | `reference-zone`)
  - posicion (x, y)
  - rotacion
  - escala (scaleX, scaleY)
  - color y etiqueta
  - tamano por tipo (ancho/alto, radio, longitud)
- Controles de modelo:
  - bloquear/desbloquear elemento
  - enviar al frente por zIndex
  - eliminar elemento seleccionado
- Persistencia de borrador en `localStorage`:
  - guardar borrador
  - cargar borrador
  - eliminar borrador
- Exportacion de la escena en formato `.json` con validacion previa.
- Pulido UX para demo tecnica:
  - atajos de teclado para acciones frecuentes
  - confirmacion en acciones destructivas
  - botones deshabilitados cuando no aplican
  - feedback visual contextual (success/info/warning/error)
- Replay tipo VAR por keyframes:
  - captura de T1 a T5 por objeto seleccionado
  - reproduccion interpolada entre keyframes
  - visualizacion del segmento activo (T1 -> T2 -> T3 -> T4 -> T5)
  - composicion de la animacion con multiples objetos simultaneamente
  - exportacion del replay como video `.webm`

## Atajos de teclado

- `Supr` o `Backspace`: eliminar elemento seleccionado.
- `Ctrl + S`: guardar borrador en localStorage.
- `Ctrl + L`: cargar borrador desde localStorage.
- `Ctrl + E`: exportar JSON.
- `Ctrl + P`: iniciar/detener replay.
- `Ctrl + Shift + V`: exportar replay en video.
- `Esc`: detener replay activo.

## Modelo de datos utilizado

Cada elemento de la escena mantiene:

- `id`: identificador unico.
- `type`: tipo de elemento (`vehicle`, `obstacle`, `reference`).
- `status`: estado del elemento (`free`, `occupied`).
- `zoneType`: clasificacion de zona del elemento.
- `x`, `y`: posicion en el lienzo.
- `rotation`: rotacion actual.
- `scaleX`, `scaleY`: escala del elemento.
- `zIndex`: orden de renderizado.
- `locked`: bloquea o habilita el arrastre.
- `createdAt`, `updatedAt`: trazabilidad temporal.
- `properties`: propiedades principales por tipo (por ejemplo color, label, tamano/radio/longitud).

Ademas, la escena exporta metadatos:

- `meta.canvasWidth`, `meta.canvasHeight`
- `meta.gridSize`
- `meta.background`
- `selectedElementId`
- `version`: `4`

Ejemplo:

```json
{
  "id": "element-123",
  "type": "vehicle",
  "status": "free",
  "zoneType": "vehicle-zone",
  "x": 310,
  "y": 180,
  "rotation": 0,
  "scaleX": 1,
  "scaleY": 1,
  "zIndex": 0,
  "locked": false,
  "createdAt": "2026-05-19T10:00:00.000Z",
  "updatedAt": "2026-05-19T10:00:00.000Z",
  "properties": {
    "label": "Vehiculo 1",
    "color": "#38bdf8",
    "width": 76,
    "height": 36
  }
}
```

## Ejecucion local

Desde `caso-2-konva/`:

```bash
npm install
npm run dev
```

Build de produccion:

```bash
npm run build
npm run preview
```
