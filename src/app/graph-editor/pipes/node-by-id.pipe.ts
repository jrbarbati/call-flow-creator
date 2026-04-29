import { Pipe, PipeTransform } from '@angular/core';
import { Vertex } from '../models/graph.models';

@Pipe({ name: 'nodeById', standalone: true, pure: true })
export class NodeByIdPipe implements PipeTransform {
  transform(nodes: Vertex[], id: string): Vertex | undefined {
    return nodes.find(n => n.id === id);
  }
}
