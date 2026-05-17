import { Component } from '@angular/core';
import {
  NODE_TYPE_CONFIGS, NODE_TYPES, NodeType, NodeTypeConfig, EXTENSIONS, ExtensionEntry,
} from '../../models/node-types';

@Component({
  selector: 'app-graph-palette',
  standalone: true,
  templateUrl: './graph-palette.component.html',
  styleUrl: './graph-palette.component.scss',
})
export class GraphPaletteComponent {
  readonly callFlowTypes: NodeTypeConfig[] = NODE_TYPES
    .map(t => NODE_TYPE_CONFIGS[t])
    .filter(c => c.paletteSection === 'call-flow' && c.type !== 'extension');

  readonly destinationTypes: NodeTypeConfig[] = NODE_TYPES
    .map(t => NODE_TYPE_CONFIGS[t])
    .filter(c => c.paletteSection === 'destinations');

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
