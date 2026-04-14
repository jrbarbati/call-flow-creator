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
