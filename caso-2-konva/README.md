# Caso Practico 2 · Representacion visual interactiva de accidentes

Fase 1 implementada con React + Konva.

## Alcance de esta fase

- Layout dividido en dos paneles:
  - Izquierda: lienzo interactivo Konva.
  - Derecha: vista JSON de la escena en tiempo real.
- Toolbar para anadir elementos base:
  - Vehiculo
  - Obstaculo
  - Referencia
- Drag and drop de todos los elementos sobre el lienzo.
- Exportacion de la escena en formato `.json`.

## Modelo de datos utilizado

Cada elemento de la escena mantiene:

- `id`: identificador unico.
- `type`: tipo de elemento (`vehicle`, `obstacle`, `reference`).
- `x`, `y`: posicion en el lienzo.
- `rotation`: rotacion actual.
- `properties`: propiedades principales por tipo (por ejemplo color, label, tamano/radio/longitud).

Ejemplo:

```json
{
  "id": "element-123",
  "type": "vehicle",
  "x": 310,
  "y": 180,
  "rotation": 0,
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
