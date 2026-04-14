# Graph Editor Component — Design Spec
**Date:** 2026-04-13
**Phase:** 1 — Generic Directed Graph Editor

---

## Phases

- **Phase 0 (scaffold):** Generate bare Angular project (angular.json, package.json, tsconfig, app shell). User runs `npm run start` to verify before any feature work begins.
- **Phase 1 (this spec):** Build the generic directed graph editor component.
- **Phase 2 (future):** Typed nodes and edge routing for call flow semantics.

---

## Overview

A reusable Angular standalone component that renders an interactive directed graph on an SVG canvas. Designed as a self-contained folder with zero external dependencies — consumers copy `graph-editor/` into any Angular 17+ project and import `GraphEditorComponent`.

This is Phase 1 of a call flow creator tool. Phase 2 will extend nodes with typed semantics (DID, IVR, Ring Group, Call Queue, Extension) and edges with routing metadata (IVR key presses, forwarding rules). The data model is designed to accommodate this without breaking the public interface.

---

## Architecture

```
GraphEditorComponent (shell — public API surface)
├── @Input()  graph: GraphModel
├── @Output() graphChange: EventEmitter<GraphModel>
│
├── GraphPaletteComponent       (left sidebar, node type list)
├── GraphCanvasComponent        (SVG viewport, pan/zoom, rubber-band select)
│   ├── GraphNodeComponent      (per-node SVG group — label, ports, edit/delete icons)
│   └── GraphEdgeComponent      (per-edge SVG path — arrow, label placeholder)
│
└── GraphEditorService          (internal signals state + command history)
    ├── nodes: Signal<Node[]>          ← provided in GraphEditorComponent scope
    ├── edges: Signal<Edge[]>             so multiple editor instances on the
    ├── selectedIds: Signal<Set<string>>  same page each get their own service
    ├── viewTransform: Signal<{x, y, scale}>
    ├── execute(cmd: Command): void
    ├── undo(): void
    └── redo(): void
```

`GraphEditorComponent` is the only public-facing piece. It syncs `@Input() graph` into the service on change and emits `graphChange` after every mutating command. All child components are internal implementation details.

---

## Data Model

```typescript
// Public types — exported from index.ts

interface GraphModel {
  nodes: NodeModel[];
  edges: EdgeModel[];
}

interface NodeModel {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;    // default: 160
  height: number;   // default: 48
  meta?: Record<string, unknown>;  // Phase 2 hook: node type, config, etc.
}

interface EdgeModel {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;                  // Phase 2 hook: IVR key press label, etc.
  meta?: Record<string, unknown>;  // Phase 2 hook: routing rules, etc.
}
```

### Command Pattern (internal)

State is immutable per command. Each command returns a new state snapshot — undo walks the stack backward.

```typescript
interface Command {
  execute(state: GraphState): GraphState;
  undo(state: GraphState): GraphState;
}
```

Commands: `AddNodeCommand`, `MoveNodeCommand`, `RenameNodeCommand`, `DeleteNodeCommand`, `AddEdgeCommand`, `DeleteEdgeCommand`.

---

## UX & Interactions

### Canvas
- SVG viewport with a single `<g transform="translate(x,y) scale(s)">` wrapper
- **Zoom:** scroll wheel, centered on cursor; `+`/`-` buttons bottom-right; "Fit to screen" button
- **Pan:** click+drag empty canvas area
- **Deselect:** click empty canvas
- **Multi-select:** rubber-band drag on empty canvas

### Palette (left sidebar)
- Phase 1: single "Node" type, drag onto canvas to place
- Drag preview follows cursor; drop position accounts for current pan/zoom transform
- Phase 2: typed node types appear here as distinct items

### Nodes
- Default size: 160×48px, rounded rectangle
- Drag node body → move; snaps to 8px grid
- Hover → reveals **✏️** icon (top-right), **✕** icon (top-left), port handle (right edge center)
- **✏️** click → inline `<foreignObject>` text input for label edit; confirm on `Enter` or blur
- **✕** click → delete node + all connected edges
- `Delete` / `Backspace` key → delete selected node(s) and their edges

### Edges
- Drag from port handle (right edge of node) → live preview bezier line follows cursor
- Drop on target node body → edge created
- Drop on empty canvas → cancelled (no edge created)
- Edges render as SVG cubic bezier paths with arrowhead marker
- Click edge → select it; `Delete` key removes selected edge

### Undo / Redo
- `Cmd+Z` / `Ctrl+Z` → undo last command
- `Cmd+Shift+Z` / `Ctrl+Shift+Z` → redo

---

## Project Structure

```
call-flow-creator/
├── src/
│   └── app/
│       └── graph-editor/                    ← reusable component (copy this folder)
│           ├── index.ts                     ← public API barrel export
│           ├── graph-editor.component.ts    ← public entry point
│           ├── graph-editor.service.ts      ← signals state + command history
│           ├── commands/
│           │   ├── add-node.command.ts
│           │   ├── move-node.command.ts
│           │   ├── rename-node.command.ts
│           │   ├── delete-node.command.ts
│           │   ├── add-edge.command.ts
│           │   └── delete-edge.command.ts
│           ├── components/
│           │   ├── graph-canvas/
│           │   │   ├── graph-canvas.component.ts
│           │   │   └── graph-canvas.component.html
│           │   ├── graph-node/
│           │   │   ├── graph-node.component.ts
│           │   │   └── graph-node.component.html
│           │   ├── graph-edge/
│           │   │   ├── graph-edge.component.ts
│           │   │   └── graph-edge.component.html
│           │   └── graph-palette/
│           │       ├── graph-palette.component.ts
│           │       └── graph-palette.component.html
│           └── models/
│               └── graph.models.ts
│
└── src/app/app.component.ts                 ← demo shell for this project
```

### Public API (index.ts exports)
```typescript
export { GraphEditorComponent } from './graph-editor.component';
export type { GraphModel, NodeModel, EdgeModel } from './models/graph.models';
```

Consumers import only `GraphEditorComponent` and the model types. Internal components are never exported.

### Usage in another Angular project
```typescript
// app.component.ts
import { GraphEditorComponent, GraphModel } from './graph-editor';

@Component({
  imports: [GraphEditorComponent],
  template: `<app-graph-editor [graph]="graph" (graphChange)="onGraphChange($event)" />`
})
export class AppComponent {
  graph: GraphModel = { nodes: [], edges: [] };
  onGraphChange(g: GraphModel) { this.graph = g; }
}
```

---

## Out of Scope (Phase 1)

- Node types (DID, IVR, Ring Group, Call Queue, Extension)
- Edge routing metadata (IVR key press labels, forwarding rules)
- Properties panel / side drawer for node config
- Minimap
- Copy/paste nodes
- Export (PNG, JSON download)
- Keyboard shortcuts beyond Delete and Undo/Redo

---

## Phase 2 Extension Points

- `NodeModel.meta` → node type, icon, color, configuration fields
- `EdgeModel.meta` → routing rule, label (e.g. "Press 1")
- `GraphPaletteComponent` → add typed node items
- `GraphNodeComponent` → render type-specific appearance based on `meta.type`
- Properties panel (new component) → edit `meta` fields on selected node
