# Node Type System Design

## Overview

Add typed nodes to the call flow graph editor. Six node types representing PBX components: SIP Trunk, DID, IVR, Ring Group, Call Queue, and Extension. Each type has distinct color and icon. Extensions are special — input-only, pre-seeded from a hardcoded list.

## Node Types

| Type | Key | Color | Hex | Output Port |
|------|-----|-------|-----|-------------|
| SIP Trunk | `sip-trunk` | Blue | `#3B82F6` | Yes |
| DID | `did` | Green | `#22C55E` | Yes |
| IVR | `ivr` | Orange | `#F59E0B` | Yes |
| Ring Group | `ring-group` | Cyan | `#06B6D4` | Yes |
| Call Queue | `call-queue` | Purple | `#8B5CF6` | Yes |
| Extension | `extension` | Grey | `#6B7280` | No |

## Model Changes

### NodeType Union

```typescript
type NodeType = 'sip-trunk' | 'did' | 'ivr' | 'ring-group' | 'call-queue' | 'extension';
```

### NodeModel Update

Add required `type` field:

```typescript
interface NodeModel {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  meta?: Record<string, unknown>;
}
```

### Node Type Registry

Constant map from `NodeType` to visual config:

```typescript
interface NodeTypeConfig {
  type: NodeType;
  label: string;         // display name in palette
  color: string;         // hex color
  icon: string;          // SVG path data
  hasOutputPort: boolean;
}
```

Single source of truth: `NODE_TYPE_CONFIGS: Record<NodeType, NodeTypeConfig>`.

## Node Rendering

### Visual Treatment
- Same rectangular shape as current nodes — soft corners (`rx="8"`)
- **Left color band**: 4px vertical stripe on left edge, filled with type color
- **Icon**: small SVG icon (14x14) positioned left of label text
- **Label**: shifted right to accommodate icon + color band
- Node dimensions stay 160x48

### Color Band Implementation
Additional `<rect>` element: `x="0" y="0" width="4" height="48" rx="8 0 0 8"` with fill from type config. Clip left corners to match node shape using `clipPath` or overlapping rects.

### Icon Implementation
Inline SVG `<path>` elements. No external icon font. Each type gets a simple, recognizable 14x14 icon:
- SIP Trunk: phone/line icon
- DID: hash/number icon
- IVR: menu/keypad icon
- Ring Group: group/users icon
- Call Queue: queue/list icon
- Extension: single user icon

### Port Visibility
- Extension nodes: no output port circle rendered, `onPortMouseDown` is a no-op
- All other types: output port on right edge (existing behavior)
- All types: input accepted (left edge hit area for edge drop target)

## Palette Changes

### Layout: Two Sections

**Top section — "COMPONENTS"**
- 5 draggable items: SIP Trunk, DID, IVR, Ring Group, Call Queue
- Each item shows: color dot/swatch + icon + label
- Drag sets `node-type` data transfer to type key (e.g., `'sip-trunk'`)

**Bottom section — "EXTENSIONS"**
- Header: "EXTENSIONS"
- Scrollable list of 12 hardcoded extensions
- Each item shows: extension number + name (e.g., "101 - John Smith")
- Drag sets `node-type` to `'extension'` and `extension-data` with id/number/name
- Smaller item styling to fit more in view

### Extension Seed Data

```typescript
const EXTENSIONS = [
  { number: '100', firstName: 'John', lastName: 'Smith' },
  { number: '101', firstName: 'Jane', lastName: 'Doe' },
  { number: '102', firstName: 'Mike', lastName: 'Johnson' },
  { number: '103', firstName: 'Sarah', lastName: 'Williams' },
  { number: '104', firstName: 'David', lastName: 'Brown' },
  { number: '105', firstName: 'Emily', lastName: 'Davis' },
  { number: '106', firstName: 'Chris', lastName: 'Miller' },
  { number: '107', firstName: 'Lisa', lastName: 'Wilson' },
  { number: '108', firstName: 'Tom', lastName: 'Moore' },
  { number: '109', firstName: 'Amy', lastName: 'Taylor' },
  { number: '110', firstName: 'Dan', lastName: 'Anderson' },
  { number: '111', firstName: 'Rachel', lastName: 'Thomas' },
];
```

## Edge Rules

- No type-based connection restrictions
- Extension nodes have no output port — cannot initiate edges
- All nodes accept incoming edges

## Drop Handling

### Component Drop (existing flow, updated)
1. User drags component from palette
2. `dataTransfer` contains `node-type` = type key
3. `onDrop` reads type, creates `NodeModel` with:
   - `type` from transfer data
   - `label` from `NODE_TYPE_CONFIGS[type].label`
   - Standard dimensions (160x48)

### Extension Drop (new flow)
1. User drags extension from extension list
2. `dataTransfer` contains `node-type` = `'extension'` and `extension-data` = JSON with number/name
3. `onDrop` reads both, creates `NodeModel` with:
   - `type: 'extension'`
   - `label: '${number} - ${firstName} ${lastName}'`
   - Standard dimensions
   - `meta: { extensionNumber, firstName, lastName }`

## What Does NOT Change

- Edge rendering (bezier curves, arrow markers)
- Pan/zoom behavior
- Selection model (rubber band, click select)
- Command pattern and undo/redo
- Node drag, inline rename, delete
- Graph state structure (just NodeModel gains `type` field)
- Canvas component logic (mostly)

## Files to Modify

| File | Change |
|------|--------|
| `models/graph.models.ts` | Add `NodeType`, add `type` to `NodeModel` |
| `components/graph-palette/graph-palette.component.ts` | Two sections, extension list, type configs |
| `components/graph-palette/graph-palette.component.html` | Two-section layout |
| `components/graph-palette/graph-palette.component.scss` | Extension list styling |
| `components/graph-node/graph-node.component.html` | Color band, icon, conditional port |
| `components/graph-node/graph-node.component.ts` | Type-aware port logic |
| `components/graph-node/graph-node.component.scss` | Color band styling |
| `graph-editor.component.ts` | Updated drop handler for type + extension data |
| `graph-editor-theme.scss` | Node type color CSS variables |

## New Files

| File | Purpose |
|------|---------|
| `models/node-types.ts` | `NodeType` union, `NodeTypeConfig`, `NODE_TYPE_CONFIGS`, `EXTENSIONS` seed data, SVG icon paths |
