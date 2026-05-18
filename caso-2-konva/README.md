# Caso Practico 2 · Representacion visual interactiva de accidentes

Fase 3 implementada con React + Konva.

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
  - posicion (x, y)
  - rotacion
  - escala (scaleX, scaleY)
  - color y etiqueta
  - tamano por tipo (ancho/alto, radio, longitud)
- Controles de modelo:
  - bloquear/desbloquear elemento
  - enviar al frente por zIndex
  - eliminar elemento seleccionado
- Exportacion de la escena en formato `.json`.

## Modelo de datos utilizado

Cada elemento de la escena mantiene:

- `id`: identificador unico.
- `type`: tipo de elemento (`vehicle`, `obstacle`, `reference`).
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
- `version`: `3`

Ejemplo:

```json
{
  "id": "element-123",
  "type": "vehicle",
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
