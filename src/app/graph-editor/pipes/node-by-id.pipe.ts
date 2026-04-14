import { Pipe, PipeTransform } from '@angular/core';
import { NodeModel } from '../models/graph.models';

@Pipe({ name: 'nodeById', standalone: true, pure: true })
export class NodeByIdPipe implements PipeTransform {
  transform(nodes: NodeModel[], id: string): NodeModel | undefined {
    return nodes.find(n => n.id === id);
  }
}
