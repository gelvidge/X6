import { Graph } from '@antv/x6'
import { Group } from './index'
// import { GroupImpl } from './group'

declare module '@antv/x6/lib/graph/graph' {
  interface Graph {
    isGroupEnabled: () => boolean
  }
}

Graph.prototype.isGroupEnabled = function () {
  const group = this.getPlugin('group') as Group
  if (group) {
    return group.isEnabled()
  }
  return false
}
