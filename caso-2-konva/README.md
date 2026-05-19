# Caso Práctico 2 - Representación Visual Interactiva de Accidentes

Aplicación web desarrollada con React y Konva para modelar, editar y documentar escenas de accidente de forma visual, estructurada y exportable.

![Demo del caso práctico 2](./public/caso2.gif)

## 1. Contexto del Enunciado

El objetivo del caso práctico es construir una interfaz gráfica que permita:

1. Añadir, posicionar y mover elementos básicos de una escena.
2. Mantener un modelo de datos estructurado de la escena.
3. Visualizar o exportar esa información en JSON.

Este repositorio cubre ese alcance y agrega mejoras de nivel producto para una entrega más robusta.

## 2. Cumplimiento de Objetivos del Caso

### Objetivo 1 - Interacción gráfica básica (añadir, posicionar, mover)

Cumplimiento base:

- Elementos soportados: `vehicle`, `obstacle`, `reference`.
- Alta de elementos desde toolbar.
- Posicionamiento visual en canvas.
- Drag and drop para mover elementos.

**PLUS**:

- Selección por click/touch.
- Transformaciones con Konva Transformer: rotación con snaps, escalado y límites mínimos.
- Bloqueo/desbloqueo por elemento.
- Control de orden visual (`zIndex`) con acción "enviar al frente".
- UI responsive del lienzo.

### Objetivo 2 - Modelo de datos de escena

Cumplimiento base:

- Modelo unificado por elemento con tipo, posición y propiedades principales.
- Estado reactivo sincronizado entre canvas e inspector.

**PLUS**:

- Metadatos técnicos por elemento (`createdAt`, `updatedAt`, `locked`, `zIndex`).
- Versionado de snapshot de escena.
- Validación y normalización de snapshots antes de cargar/exportar.
- Arquitectura modular por hooks para mantener claridad y escalabilidad.

### Objetivo 3 - Visualización/exportación JSON

Cumplimiento base:

- Inspector JSON en vivo.
- Exportación de escena a archivo `.json`.

**PLUS**:

- Persistencia de borrador en `localStorage` (guardar, cargar, eliminar).
- Validación previa de consistencia antes de exportar.
- Feedback de estado (success, info, warning, error) para todas las operaciones.

## 3. Alcance Adicional Implementado (Valor Extra)

Además del enunciado base, se implementó una capa de reconstrucción temporal del accidente:

- Timeline por keyframes `T1` a `T5` por objeto.
- Replay interpolado multi-actor entre segmentos.
- Indicador del segmento activo durante reproducción.
- Exportación del replay en video `.webm`.
- Atajos de teclado para flujo operativo rápido.
- Confirmaciones accesibles para acciones destructivas.

## 4. Entregables del Caso

- Código fuente completo.
- Instrucciones de ejecución local.
- Explicación del modelo de datos.

## 5. Stack Tecnológico

- React 19
- TypeScript
- Vite
- Konva + React Konva
- ESLint
- Vitest

## 6. Arquitectura de Software

La aplicación se organiza en capas ligeras y responsabilidades separadas:

- `src/hooks/useStageSize.ts`: calcula tamaño responsive del canvas.
- `src/hooks/useKeyboardShortcuts.ts`: centraliza atajos globales.
- `src/hooks/useSceneElementEditor.ts`: edición de elementos de escena.
- `src/hooks/useSceneDangerActions.ts`: confirmaciones y acciones destructivas.
- `src/hooks/useScenePersistenceActions.ts`: persistencia y export JSON.
- `src/hooks/useReplayController.ts`: timeline, replay y export video.
- `src/app/scenePersistence.ts`: hidratación/validación de snapshot.
- `src/app/replayUtils.ts`: utilidades puras de replay.

Decisión arquitectónica principal:

- Separar "interacción", "persistencia" y "timeline" en hooks dedicados para mejorar legibilidad, testabilidad y evolución incremental.

## 7. Modelo de Datos

### 7.1 Estructura de elemento

Cada `SceneElement` incluye:

- `id`
- `type`: `vehicle` | `obstacle` | `reference`
- `status`: `free` | `occupied`
- `zoneType`: `vehicle-zone` | `obstacle-zone` | `reference-zone`
- `x`, `y`, `rotation`, `scaleX`, `scaleY`
- `zIndex`, `locked`
- `createdAt`, `updatedAt`
- `properties` (shape dependiente del tipo)

### 7.2 Estructura de snapshot

La escena exportada incluye:

- `version`
- `generatedAt`
- `selectedElementId`
- `meta` (`canvasWidth`, `canvasHeight`, `gridSize`, `background`)
- `elements`

Ejemplo de elemento:

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
    "label": "Vehículo 1",
    "color": "#38bdf8",
    "width": 76,
    "height": 36
  }
}
```

## 8. Flujo Funcional de Usuario

1. Crear elementos desde la toolbar.
2. Ajustar propiedades desde el inspector.
3. Capturar keyframes por elemento en T1-T5.
4. Reproducir timeline para validar la narrativa del evento.
5. Exportar JSON y, opcionalmente, video replay.

## 9. Atajos de Teclado

- `Supr` o `Backspace`: eliminar seleccionado.
- `Ctrl + S`: guardar borrador.
- `Ctrl + L`: cargar borrador.
- `Ctrl + E`: exportar JSON.
- `Ctrl + P`: iniciar/detener replay.
- `Ctrl + Shift + V`: exportar replay en video.
- `Esc`: cerrar confirmación o detener replay.

## 10. Instrucciones de Ejecución

Desde `caso-2-konva/`:

```bash
npm install
npm run dev
```

Aplicación en desarrollo:

- `http://localhost:5173`

Build y preview:

```bash
npm run build
npm run preview
```

Validaciones de calidad:

```bash
npm run lint
npm run test
```

## 11. Criterios de Valoración y Evidencia

### Simplicidad de la solución

- UI directa con toolbar + inspector + JSON en vivo.
- Modelo único de escena con serialización estable.

### Claridad del código

- Lógica particionada por responsabilidad en hooks.
- Utilidades puras separadas para validación y replay.

### Uso adecuado de React y Konva

- Estado declarativo en React.
- Manipulación gráfica en Konva con transformer y drag.
- Sincronización entre interacción visual y estado estructurado.

### Transformación a datos estructurados

- Cada interacción actualiza `SceneElement`.
- Snapshot versionado exportable a JSON.
- Replay temporal persistido por keyframes por objeto.

## 12. Roadmap Técnico

- Incrementar cobertura de tests para hooks de negocio.
- Exportación de escena a PNG.
- Plantillas de escenarios predefinidos.
- Persistencia remota en backend.

## Autor

GhersonSA

## Licencia

Uso académico y demostrativo.
