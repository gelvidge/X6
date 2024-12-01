import { Graph, Node } from '@antv/x6'
import { TransformImpl } from './transform'
import { Transform } from './index'

declare module '@antv/x6/lib/graph/graph' {
  interface Graph {
<<<<<<< HEAD
    createTransformWidget: (node: Node, add: boolean) => Graph
    clearTransformWidgets: () => Graph
    clearTransformWidget: (node: Node) => Graph
=======
    createTransformWidget: (node: Node) => Graph
    clearTransformWidgets: () => Graph
>>>>>>> x6/master
  }
}

declare module '@antv/x6/lib/graph/events' {
<<<<<<< HEAD
  type EventArgs = TransformImpl.EventArgs
}

Graph.prototype.createTransformWidget = function (node, add) {
  const transform = this.getPlugin('transform') as Transform
  if (transform) {
    transform.createWidget(node, add)
=======
  interface EventArgs extends TransformImpl.EventArgs {}
}

Graph.prototype.createTransformWidget = function (node) {
  const transform = this.getPlugin('transform') as Transform
  if (transform) {
    transform.createWidget(node)
>>>>>>> x6/master
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
<<<<<<< HEAD

Graph.prototype.clearTransformWidget = function (node: Node) {
  const transform = this.getPlugin('transform') as Transform
  if (transform) {
    transform.clearWidget(node)
  }
  return this
}
=======
>>>>>>> x6/master
