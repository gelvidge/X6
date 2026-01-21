import { Graph } from '../../graph'
import type { X6Ruler } from './index'

declare module '../../graph/graph' {
  interface Graph {
    isRulerEnabled: () => boolean
    enableRuler: () => Graph
    disableRuler: () => Graph
    toggleRuler: (enabled?: boolean) => Graph
  }
}

Graph.prototype.isRulerEnabled = function () {
  const ruler = this.getPlugin('ruler') as X6Ruler
  if (ruler) {
    return ruler.isEnabled()
  }
  return false
}

Graph.prototype.enableRuler = function () {
  const ruler = this.getPlugin('ruler') as X6Ruler
  if (ruler) {
    ruler.enable()
  }
  return this
}

Graph.prototype.disableRuler = function () {
  const ruler = this.getPlugin('ruler') as X6Ruler
  if (ruler) {
    ruler.disable()
  }
  return this
}

Graph.prototype.toggleRuler = function (enabled?: boolean) {
  const ruler = this.getPlugin('ruler') as X6Ruler
  if (ruler) {
    ruler.toggleEnabled(enabled)
  }
  return this
}
