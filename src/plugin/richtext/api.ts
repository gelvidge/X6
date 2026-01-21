import { Graph } from '../../graph'
import type { Richtext } from './index'

declare module '../../graph/graph' {
  interface Graph {
    isRichtextEnabled: () => boolean
    onTextChange: (callback: () => void) => void
  }
}

Graph.prototype.isRichtextEnabled = function () {
  const richtext = this.getPlugin('richtext') as Richtext
  if (richtext) {
    return richtext.isEnabled()
  }
  return false
}
