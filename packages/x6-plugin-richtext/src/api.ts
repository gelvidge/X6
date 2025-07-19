import { Graph } from '@antv/x6'
import { Richtext } from './index'
// import { GroupImpl } from './group'

declare module '@antv/x6/lib/graph/graph' {
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
