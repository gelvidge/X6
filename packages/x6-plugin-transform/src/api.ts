import { Graph, Node } from '@antv/x6'
import { TransformImpl } from './transform'
import { Transform } from './index'

declare module '@antv/x6/lib/graph/graph' {
  interface Graph {
    createTransformWidget: (node: Node, add: boolean) => Graph
    clearTransformWidgets: () => Graph
    clearTransformWidget: (node: Node) => Graph
  }
}

declare module '@antv/x6/lib/graph/events' {
  type EventArgs = TransformImpl.EventArgs
}

Graph.prototype.createTransformWidget = function (node, add) {
  const transform = this.getPlugin('transform') as Transform
  if (transform) {
    transform.createWidget(node, add)
  }
  return this
}

Graph.prototype.clearTransformWidgets = function () {
  const transform = this.getPlugin('transform') as Transform
  if (transform) {
    transform.clearWidgets()
  }
  return this
}

Graph.prototype.clearTransformWidget = function (node: Node) {
  const transform = this.getPlugin('transform') as Transform
  if (transform) {
    transform.clearWidget(node)
  }
  return this
}
