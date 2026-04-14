# Node Type System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 6 typed PBX node types (SIP Trunk, DID, IVR, Ring Group, Call Queue, Extension) with distinct colors, icons, and an extension panel in the palette.

**Architecture:** Add `NodeType` union and `NODE_TYPE_CONFIGS` registry to a new `node-types.ts` file. Update `NodeModel` with required `type` field. Palette gets two sections (components + extensions). Node component renders color band + icon based on type. Extension nodes have no output port.

**Tech Stack:** Angular 21, TypeScript, SVG, Vitest

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/app/graph-editor/models/node-types.ts` | Create | `NodeType` union, `NodeTypeConfig` interface, `NODE_TYPE_CONFIGS` registry, `EXTENSIONS` seed data, SVG icon path constants |
| `src/app/graph-editor/models/node-types.spec.ts` | Create | Tests for node type registry and extension data |
| `src/app/graph-editor/models/graph.models.ts` | Modify | Add `type: NodeType` to `NodeModel` |
| `src/app/graph-editor/models/graph.models.spec.ts` | Modify | Update test fixtures with `type` field |
| `src/app/graph-editor/commands/commands.spec.ts` | Modify | Update test fixtures with `type` field |
| `src/app/graph-editor/components/graph-palette/graph-palette.component.ts` | Modify | Two-section palette: components + extensions |
| `src/app/graph-editor/components/graph-palette/graph-palette.component.html` | Modify | Two-section template with extension list |
| `src/app/graph-editor/components/graph-palette/graph-palette.component.scss` | Modify | Extension section styling, color dots |
| `src/app/graph-editor/components/graph-palette/graph-palette.component.spec.ts` | Modify | Update tests for new palette structure |
| `src/app/graph-editor/components/graph-node/graph-node.component.ts` | Modify | Import type config, expose color/icon/port-visibility |
| `src/app/graph-editor/components/graph-node/graph-node.component.html` | Modify | Add color band, icon, conditional output port |
| `src/app/graph-editor/components/graph-node/graph-node.component.scss` | Modify | Color band and icon styles |
| `src/app/graph-editor/graph-editor.component.ts` | Modify | Type-aware drop handler, extension drop support |

---

### Task 1: Create Node Type Registry

**Files:**
- Create: `src/app/graph-editor/models/node-types.ts`
- Create: `src/app/graph-editor/models/node-types.spec.ts`

- [ ] **Step 1: Write failing tests for node type registry**

Create `src/app/graph-editor/models/node-types.spec.ts`:

```typescript
import {
  NodeType, NODE_TYPES, NodeTypeConfig, NODE_TYPE_CONFIGS,
  EXTENSIONS, ExtensionEntry
} from './node-types';

describe('Node Type Registry', () => {
  it('NODE_TYPES contains all 6 types', () => {
    expect(NODE_TYPES).toEqual([
      'sip-trunk', 'did', 'ivr', 'ring-group', 'call-queue', 'extension'
    ]);
  });

  it('NODE_TYPE_CONFIGS has entry for every type', () => {
    for (const t of NODE_TYPES) {
      expect(NODE_TYPE_CONFIGS[t]).toBeDefined();
      expect(NODE_TYPE_CONFIGS[t].type).toBe(t);
      expect(NODE_TYPE_CONFIGS[t].label).toBeTruthy();
      expect(NODE_TYPE_CONFIGS[t].color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(NODE_TYPE_CONFIGS[t].iconPath).toBeTruthy();
      expect(typeof NODE_TYPE_CONFIGS[t].hasOutputPort).toBe('boolean');
    }
  });

  it('extension type has no output port', () => {
    expect(NODE_TYPE_CONFIGS['extension'].hasOutputPort).toBe(false);
  });

  it('all non-extension types have output port', () => {
    const nonExt = NODE_TYPES.filter(t => t !== 'extension');
    for (const t of nonExt) {
      expect(NODE_TYPE_CONFIGS[t].hasOutputPort).toBe(true);
    }
  });
});

describe('Extension Seed Data', () => {
  it('EXTENSIONS has 12 entries', () => {
    expect(EXTENSIONS).toHaveLength(12);
  });

  it('each extension has number, firstName, lastName', () => {
    for (const ext of EXTENSIONS) {
      expect(ext.number).toMatch(/^\d{3}$/);
      expect(ext.firstName).toBeTruthy();
      expect(ext.lastName).toBeTruthy();
    }
  });

  it('extension numbers are unique', () => {
    const numbers = EXTENSIONS.map(e => e.number);
    expect(new Set(numbers).size).toBe(numbers.length);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/app/graph-editor/models/node-types.spec.ts`
Expected: FAIL — cannot resolve `./node-types`

- [ ] **Step 3: Create node-types.ts with types, configs, icons, and seed data**

Create `src/app/graph-editor/models/node-types.ts`:

```typescript
export type NodeType = 'sip-trunk' | 'did' | 'ivr' | 'ring-group' | 'call-queue' | 'extension';

export const NODE_TYPES: NodeType[] = [
  'sip-trunk', 'did', 'ivr', 'ring-group', 'call-queue', 'extension'
];

export interface NodeTypeConfig {
  type: NodeType;
  label: string;
  color: string;
  iconPath: string;
  hasOutputPort: boolean;
}

// SVG path data for 14x14 viewBox icons
const ICON_SIP_TRUNK = 'M3 1h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2zm1 3v2h2V4H4zm4 0v2h2V4H8zM4 8v2h2V8H4zm4 0v2h2V8H8z';
const ICON_DID = 'M4 1v12M10 1v12M1 4h12M1 10h12';
const ICON_IVR = 'M2 2h10v3H2zm0 4.5h4.5v5.5H2zm5.5 0H12v5.5H7.5z';
const ICON_RING_GROUP = 'M7 6a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm-4.5 7.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4M2 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM12 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z';
const ICON_CALL_QUEUE = 'M1 3h12M1 7h12M1 11h8M10 10l2 2 2-2';
const ICON_EXTENSION = 'M7 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5 7c0-2.8 2.2-5 5-5s5 2.2 5 5';

export const NODE_TYPE_CONFIGS: Record<NodeType, NodeTypeConfig> = {
  'sip-trunk': {
    type: 'sip-trunk',
    label: 'SIP Trunk',
    color: '#3B82F6',
    iconPath: ICON_SIP_TRUNK,
    hasOutputPort: true,
  },
  'did': {
    type: 'did',
    label: 'DID',
    color: '#22C55E',
    iconPath: ICON_DID,
    hasOutputPort: true,
  },
  'ivr': {
    type: 'ivr',
    label: 'IVR',
    color: '#F59E0B',
    iconPath: ICON_IVR,
    hasOutputPort: true,
  },
  'ring-group': {
    type: 'ring-group',
    label: 'Ring Group',
    color: '#06B6D4',
    iconPath: ICON_RING_GROUP,
    hasOutputPort: true,
  },
  'call-queue': {
    type: 'call-queue',
    label: 'Call Queue',
    color: '#8B5CF6',
    iconPath: ICON_CALL_QUEUE,
    hasOutputPort: true,
  },
  'extension': {
    type: 'extension',
    label: 'Extension',
    color: '#6B7280',
    iconPath: ICON_EXTENSION,
    hasOutputPort: false,
  },
};

export interface ExtensionEntry {
  number: string;
  firstName: string;
  lastName: string;
}

export const EXTENSIONS: ExtensionEntry[] = [
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

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/app/graph-editor/models/node-types.spec.ts`
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/graph-editor/models/node-types.ts src/app/graph-editor/models/node-types.spec.ts
git commit -m "feat: add node type registry with configs and extension seed data"
```

---

### Task 2: Update NodeModel with Type Field

**Files:**
- Modify: `src/app/graph-editor/models/graph.models.ts`
- Modify: `src/app/graph-editor/models/graph.models.spec.ts`
- Modify: `src/app/graph-editor/commands/commands.spec.ts`

- [ ] **Step 1: Update graph.models.ts — add type to NodeModel**

In `src/app/graph-editor/models/graph.models.ts`, add import and field:

```typescript
import { NodeType } from './node-types';

export interface NodeModel {
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

`EdgeModel`, `GraphModel`, `GraphState`, `ViewTransform` stay unchanged.

- [ ] **Step 2: Update graph.models.spec.ts — add type to fixtures**

In `src/app/graph-editor/models/graph.models.spec.ts`, update the node fixture:

```typescript
import { GraphModel, NodeModel, EdgeModel } from './graph.models';

describe('GraphModel types', () => {
  it('should construct a valid NodeModel with defaults', () => {
    const node: NodeModel = {
      id: 'n1',
      type: 'sip-trunk',
      label: 'Test Node',
      x: 0,
      y: 0,
      width: 160,
      height: 48,
    };
    expect(node.id).toBe('n1');
    expect(node.type).toBe('sip-trunk');
    expect(node.meta).toBeUndefined();
  });

  it('should construct a valid EdgeModel', () => {
    const edge: EdgeModel = {
      id: 'e1',
      sourceId: 'n1',
      targetId: 'n2',
    };
    expect(edge.label).toBeUndefined();
    expect(edge.meta).toBeUndefined();
  });

  it('should construct a valid GraphModel', () => {
    const graph: GraphModel = { nodes: [], edges: [] };
    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });
});
```

- [ ] **Step 3: Update commands.spec.ts — add type to node fixtures**

In `src/app/graph-editor/commands/commands.spec.ts`, update the top-level node constants:

```typescript
const node1: NodeModel = { id: 'n1', type: 'sip-trunk', label: 'A', x: 10, y: 20, width: 160, height: 48 };
const node2: NodeModel = { id: 'n2', type: 'did', label: 'B', x: 200, y: 20, width: 160, height: 48 };
```

All test bodies stay the same — they don't assert on type.

- [ ] **Step 4: Run all tests to verify everything passes**

Run: `npx vitest run`
Expected: All tests PASS (type is just a new required field on the interface, no runtime behavior changes yet)

- [ ] **Step 5: Commit**

```bash
git add src/app/graph-editor/models/graph.models.ts src/app/graph-editor/models/graph.models.spec.ts src/app/graph-editor/commands/commands.spec.ts
git commit -m "feat: add required type field to NodeModel"
```

---

### Task 3: Update Palette — Two Sections with Extension List

**Files:**
- Modify: `src/app/graph-editor/components/graph-palette/graph-palette.component.ts`
- Modify: `src/app/graph-editor/components/graph-palette/graph-palette.component.html`
- Modify: `src/app/graph-editor/components/graph-palette/graph-palette.component.scss`
- Modify: `src/app/graph-editor/components/graph-palette/graph-palette.component.spec.ts`

- [ ] **Step 1: Write failing tests for new palette structure**

Replace contents of `src/app/graph-editor/components/graph-palette/graph-palette.component.spec.ts`:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GraphPaletteComponent } from './graph-palette.component';
import { vi } from 'vitest';

describe('GraphPaletteComponent', () => {
  let fixture: ComponentFixture<GraphPaletteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphPaletteComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(GraphPaletteComponent);
    fixture.detectChanges();
  });

  it('renders the palette sidebar', () => {
    const aside = fixture.nativeElement.querySelector('.palette');
    expect(aside).toBeTruthy();
  });

  it('renders COMPONENTS section with 5 items', () => {
    const header = fixture.nativeElement.querySelector('.palette-section-header');
    expect(header.textContent).toContain('COMPONENTS');
    const items = fixture.nativeElement.querySelectorAll('.component-item');
    expect(items.length).toBe(5);
  });

  it('renders EXTENSIONS section with 12 items', () => {
    const headers = fixture.nativeElement.querySelectorAll('.palette-section-header');
    const extHeader = Array.from(headers).find((h: any) => h.textContent.includes('EXTENSIONS'));
    expect(extHeader).toBeTruthy();
    const items = fixture.nativeElement.querySelectorAll('.extension-item');
    expect(items.length).toBe(12);
  });

  it('component items have correct data-type attributes', () => {
    const types = ['sip-trunk', 'did', 'ivr', 'ring-group', 'call-queue'];
    for (const t of types) {
      const item = fixture.nativeElement.querySelector(`[data-type="${t}"]`);
      expect(item).toBeTruthy();
    }
  });

  it('component item sets node-type on dragstart', () => {
    const item = fixture.nativeElement.querySelector('[data-type="sip-trunk"]');
    const setData = vi.fn();
    const dt = { setData, effectAllowed: '' };
    const event = new Event('dragstart', { bubbles: true }) as any;
    event.dataTransfer = dt;
    item.dispatchEvent(event);
    expect(setData).toHaveBeenCalledWith('node-type', 'sip-trunk');
  });

  it('extension item sets node-type and extension-data on dragstart', () => {
    const item = fixture.nativeElement.querySelector('.extension-item');
    const setData = vi.fn();
    const dt = { setData, effectAllowed: '' };
    const event = new Event('dragstart', { bubbles: true }) as any;
    event.dataTransfer = dt;
    item.dispatchEvent(event);
    expect(setData).toHaveBeenCalledWith('node-type', 'extension');
    expect(setData).toHaveBeenCalledWith('extension-data', expect.any(String));
    const extData = JSON.parse(setData.mock.calls.find((c: any) => c[0] === 'extension-data')[1]);
    expect(extData.number).toBeTruthy();
    expect(extData.firstName).toBeTruthy();
    expect(extData.lastName).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/app/graph-editor/components/graph-palette/graph-palette.component.spec.ts`
Expected: FAIL — no `.component-item`, no `.extension-item`, no COMPONENTS header

- [ ] **Step 3: Update palette component TypeScript**

Replace `src/app/graph-editor/components/graph-palette/graph-palette.component.ts`:

```typescript
import { Component } from '@angular/core';
import {
  NODE_TYPE_CONFIGS, NodeType, EXTENSIONS, ExtensionEntry
} from '../../models/node-types';

@Component({
  selector: 'app-graph-palette',
  standalone: true,
  templateUrl: './graph-palette.component.html',
  styleUrl: './graph-palette.component.scss',
})
export class GraphPaletteComponent {
  readonly componentTypes = (
    ['sip-trunk', 'did', 'ivr', 'ring-group', 'call-queue'] as NodeType[]
  ).map(type => NODE_TYPE_CONFIGS[type]);

  readonly extensions = EXTENSIONS;

  onComponentDragStart(event: DragEvent, type: NodeType): void {
    event.dataTransfer!.setData('node-type', type);
    event.dataTransfer!.effectAllowed = 'copy';
  }

  onExtensionDragStart(event: DragEvent, ext: ExtensionEntry): void {
    event.dataTransfer!.setData('node-type', 'extension');
    event.dataTransfer!.setData('extension-data', JSON.stringify(ext));
    event.dataTransfer!.effectAllowed = 'copy';
  }
}
```

- [ ] **Step 4: Update palette template**

Replace `src/app/graph-editor/components/graph-palette/graph-palette.component.html`:

```html
<aside class="palette">
  <!-- Components section -->
  <div class="palette-section">
    <div class="palette-section-header">
      <span class="palette-header-text">COMPONENTS</span>
    </div>
    <div class="palette-items">
      @for (item of componentTypes; track item.type) {
        <div class="palette-item component-item"
             [attr.data-type]="item.type"
             draggable="true"
             (dragstart)="onComponentDragStart($event, item.type)">
          <span class="palette-color-dot" [style.background]="item.color"></span>
          <span class="palette-item-label">{{ item.label }}</span>
        </div>
      }
    </div>
  </div>

  <!-- Extensions section -->
  <div class="palette-section extensions-section">
    <div class="palette-section-header">
      <span class="palette-header-text">EXTENSIONS</span>
    </div>
    <div class="palette-items extension-list">
      @for (ext of extensions; track ext.number) {
        <div class="palette-item extension-item"
             draggable="true"
             (dragstart)="onExtensionDragStart($event, ext)">
          <span class="extension-number">{{ ext.number }}</span>
          <span class="palette-item-label">{{ ext.firstName }} {{ ext.lastName }}</span>
        </div>
      }
    </div>
  </div>
</aside>
```

- [ ] **Step 5: Update palette styles**

Replace `src/app/graph-editor/components/graph-palette/graph-palette.component.scss`:

```scss
:host {
  display: flex;
  flex-direction: column;
}

.palette {
  width: var(--palette-width);
  min-width: var(--palette-width);
  height: 100%;
  background: var(--palette-bg);
  border-right: 1px solid var(--palette-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.palette-section {
  display: flex;
  flex-direction: column;
}

.extensions-section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .extension-list {
    overflow-y: auto;
    flex: 1;
  }
}

.palette-section-header {
  padding: 16px 16px 10px;
  border-bottom: 1px solid var(--palette-border);
}

.palette-header-text {
  font-family: var(--palette-label-font);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--palette-label);
}

.palette-items {
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.palette-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--palette-item-bg);
  border: 1px solid var(--palette-item-border);
  border-radius: 6px;
  cursor: grab;
  user-select: none;
  transition: background 0.12s, border-color 0.12s;

  &:hover {
    background: var(--palette-item-bg-hover);
    border-color: var(--palette-item-border-hover);
  }

  &:active {
    cursor: grabbing;
  }
}

.palette-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.palette-item-label {
  font-family: var(--palette-label-font);
  font-size: 12px;
  font-weight: 500;
  color: var(--node-label-color);
  letter-spacing: 0.02em;
}

.extension-item {
  padding: 7px 12px;
}

.extension-number {
  font-family: var(--palette-label-font);
  font-size: 11px;
  font-weight: 600;
  color: var(--palette-label);
  min-width: 28px;
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/app/graph-editor/components/graph-palette/graph-palette.component.spec.ts`
Expected: All 6 tests PASS

- [ ] **Step 7: Commit**

```bash
git add src/app/graph-editor/components/graph-palette/
git commit -m "feat: two-section palette with components and extensions"
```

---

### Task 4: Update Node Rendering — Color Band, Icon, Conditional Port

**Files:**
- Modify: `src/app/graph-editor/components/graph-node/graph-node.component.ts`
- Modify: `src/app/graph-editor/components/graph-node/graph-node.component.html`
- Modify: `src/app/graph-editor/components/graph-node/graph-node.component.scss`

- [ ] **Step 1: Update graph-node component TypeScript**

In `src/app/graph-editor/components/graph-node/graph-node.component.ts`, add type-aware computed properties.

Add import at top:

```typescript
import { NODE_TYPE_CONFIGS } from '../../models/node-types';
```

Add these computed properties to the class body (after the existing `isSelected` computed):

```typescript
protected get typeConfig() {
  return NODE_TYPE_CONFIGS[this.node.type] ?? NODE_TYPE_CONFIGS['extension'];
}

protected get hasOutputPort(): boolean {
  return this.typeConfig.hasOutputPort;
}
```

Update `onPortMouseDown` to be a no-op for extension nodes:

```typescript
onPortMouseDown(event: MouseEvent): void {
  if (!this.hasOutputPort) return;
  event.stopPropagation();
  const portX = this.node.x + this.node.width;
  const portY = this.node.y + this.node.height / 2;
  this.portDragStart.emit({ sourceId: this.node.id, position: { x: portX, y: portY } });
}
```

- [ ] **Step 2: Update graph-node template**

Replace `src/app/graph-editor/components/graph-node/graph-node.component.html`:

```html
<svg:g class="graph-node"
   [attr.transform]="transform"
   (mouseenter)="onMouseEnter()"
   (mouseleave)="onMouseLeave()"
   (mousedown)="onNodeMouseDown($event)"
   (mouseup)="onNodeMouseUp($event)">

  <!-- Node body -->
  <svg:rect class="node-rect"
        [class.is-selected]="isSelected()"
        [class.is-hovered]="isHovered && !isSelected()"
        x="0" y="0"
        [attr.width]="node.width"
        [attr.height]="node.height"
        rx="8" ry="8" />

  <!-- Color band (left edge) -->
  <svg:rect class="node-color-band"
        x="0" y="0"
        width="4"
        [attr.height]="node.height"
        [attr.fill]="typeConfig.color"
        rx="8" ry="0" />
  <!-- Overlay to clip right side of color band rounded corners -->
  <svg:rect class="node-color-band"
        x="4" y="0"
        width="1"
        [attr.height]="node.height"
        [attr.fill]="typeConfig.color" />
  <!-- Clip top-right and bottom-right of band by overlaying node bg -->
  <svg:clipPath [attr.id]="'band-clip-' + node.id">
    <svg:rect x="0" y="0" width="5" [attr.height]="node.height" rx="8" ry="8" />
  </svg:clipPath>
  <svg:rect [attr.clip-path]="'url(#band-clip-' + node.id + ')'"
        x="0" y="0"
        width="5"
        [attr.height]="node.height"
        [attr.fill]="typeConfig.color" />

  <!-- Type icon -->
  <svg:g [attr.transform]="'translate(12, ' + (node.height / 2 - 7) + ')'">
    <svg:path [attr.d]="typeConfig.iconPath"
              class="node-type-icon"
              [attr.stroke]="typeConfig.color"
              fill="none"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round" />
  </svg:g>

  <!-- Label (text mode) -->
  @if (!isEditing) {
    <svg:text class="node-label"
          [attr.x]="32"
          [attr.y]="node.height / 2 + 1"
          dominant-baseline="middle"
          text-anchor="start">
      {{ node.label }}
    </svg:text>
  }

  <!-- Inline edit mode -->
  @if (isEditing) {
    <svg:foreignObject x="30" y="6"
                   [attr.width]="node.width - 36"
                   [attr.height]="node.height - 12">
      <input #editInput
             class="node-edit-input"
             type="text"
             [(ngModel)]="editLabel"
             (blur)="confirmEdit()"
             (keydown)="onEditKeydown($event)"
             (mousedown)="$event.stopPropagation()" />
    </svg:foreignObject>
  }

  <!-- Hover actions (shown on hover, hidden otherwise) -->
  @if (isHovered && !isEditing) {

    <!-- Edit icon — top right -->
    <svg:g class="node-action"
       [attr.transform]="'translate(' + (node.width - 22) + ', 4)'"
       (mousedown)="startEdit($event)">
      <svg:rect class="action-bg" x="0" y="0" width="18" height="18" rx="4" />
      <svg:text class="action-icon" x="9" y="9" dominant-baseline="middle" text-anchor="middle">&#x270E;</svg:text>
    </svg:g>

    <!-- Delete icon — top left (shifted right to not overlap color band) -->
    <svg:g class="node-action delete-action"
       transform="translate(8, 4)"
       (mousedown)="deleteNode($event)">
      <svg:rect class="action-bg delete-bg" x="0" y="0" width="18" height="18" rx="4" />
      <svg:text class="action-icon delete-icon" x="9" y="9" dominant-baseline="middle" text-anchor="middle">&#x2715;</svg:text>
    </svg:g>

    <!-- Port handle — right edge center (only for types with output) -->
    @if (hasOutputPort) {
      <svg:circle class="port-handle"
              [attr.cx]="node.width + 8"
              [attr.cy]="node.height / 2"
              r="6"
              (mousedown)="onPortMouseDown($event)" />
    }
  }
</svg:g>
```

- [ ] **Step 3: Update graph-node styles — add color band and icon styles**

Add to `src/app/graph-editor/components/graph-node/graph-node.component.scss`:

```scss
.node-color-band {
  pointer-events: none;
}

.node-type-icon {
  pointer-events: none;
}
```

- [ ] **Step 4: Run all tests to check nothing broke**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/graph-editor/components/graph-node/
git commit -m "feat: node rendering with color band, icon, and conditional output port"
```

---

### Task 5: Update Drop Handler — Type-Aware Node Creation

**Files:**
- Modify: `src/app/graph-editor/graph-editor.component.ts`

- [ ] **Step 1: Update onDrop in graph-editor.component.ts**

Replace the `onDrop` method in `src/app/graph-editor/graph-editor.component.ts`:

Add import at top:

```typescript
import { NODE_TYPE_CONFIGS, NodeType } from './models/node-types';
```

Replace the `onDrop` method:

```typescript
onDrop(event: DragEvent): void {
  event.preventDefault();
  const type = event.dataTransfer?.getData('node-type') as NodeType | undefined;
  if (!type || !NODE_TYPE_CONFIGS[type]) return;

  const canvasEl = (event.currentTarget as HTMLElement).querySelector('.canvas-host');
  if (!canvasEl) return;
  const rect = canvasEl.getBoundingClientRect();
  const raw = this.service.screenToCanvas(
    event.clientX - rect.left,
    event.clientY - rect.top
  );

  let label = NODE_TYPE_CONFIGS[type].label;
  let meta: Record<string, unknown> | undefined;

  if (type === 'extension') {
    const extJson = event.dataTransfer?.getData('extension-data');
    if (extJson) {
      const ext = JSON.parse(extJson);
      label = `${ext.number} - ${ext.firstName} ${ext.lastName}`;
      meta = { extensionNumber: ext.number, firstName: ext.firstName, lastName: ext.lastName };
    }
  }

  const node: NodeModel = {
    id: crypto.randomUUID(),
    type,
    label,
    x: this.service.snapToGrid(raw.x - 80),
    y: this.service.snapToGrid(raw.y - 24),
    width: 160,
    height: 48,
    ...(meta ? { meta } : {}),
  };
  this.service.execute(new AddNodeCommand(node));
}
```

- [ ] **Step 2: Run all tests**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/graph-editor/graph-editor.component.ts
git commit -m "feat: type-aware drop handler with extension data support"
```

---

### Task 6: Visual Polish and Manual Testing

**Files:**
- Modify: `src/app/graph-editor/components/graph-node/graph-node.component.html` (simplify color band if needed)
- No new tests — this is visual verification

- [ ] **Step 1: Start dev server**

Run: `npx ng serve`

- [ ] **Step 2: Verify palette renders two sections**

Open browser. Confirm:
- "COMPONENTS" section shows 5 items with color dots: SIP Trunk (blue), DID (green), IVR (orange), Ring Group (cyan), Call Queue (purple)
- "EXTENSIONS" section shows 12 items with 3-digit numbers and names
- Both sections scrollable if needed

- [ ] **Step 3: Test drag-and-drop for component types**

Drag each component type onto canvas. Verify:
- Node appears with correct label
- Color band on left edge matches type color
- Icon renders next to label
- Output port visible on hover

- [ ] **Step 4: Test drag-and-drop for extensions**

Drag an extension onto canvas. Verify:
- Node label shows "100 - John Smith" format
- Grey color band
- Person icon
- No output port on hover
- Can accept incoming edges from other nodes

- [ ] **Step 5: Test edge drawing**

Draw edge from SIP Trunk to DID. Verify:
- Edge connects normally
- Cannot start edge from Extension node (no port handle)
- Can draw edge TO extension node

- [ ] **Step 6: Test existing features still work**

Verify:
- Node drag/move works
- Inline rename works
- Delete node works (with connected edges)
- Undo/redo works
- Rubber-band selection works
- Pan/zoom works

- [ ] **Step 7: Fix any visual issues found**

Address SVG icon rendering, color band clipping, or layout issues discovered during testing. Simplify the color band implementation if the clipPath approach has rendering artifacts — fall back to a simple rect that overlaps the node body:

```html
<!-- Simpler color band approach if clipPath has issues -->
<svg:rect class="node-color-band"
      x="1" y="1"
      width="4"
      [attr.height]="node.height - 2"
      [attr.fill]="typeConfig.color"
      rx="6" ry="0" />
```

- [ ] **Step 8: Run full test suite one final time**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 9: Commit any visual fixes**

```bash
git add -A
git commit -m "fix: visual polish for node type rendering"
```
