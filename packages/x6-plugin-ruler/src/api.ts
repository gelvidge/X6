import { Graph } from '@antv/x6'
import { X6Ruler } from './index'

declare module '@antv/x6/lib/graph/graph' {
  interface Graph {
    isRulerEnabled: () => boolean
  }
}

Graph.prototype.isRulerEnabled = function () {
  const ruler = this.getPlugin('ruler') as X6Ruler
  if (ruler) {
    return ruler.isEnabled()
  }
  return false
}
