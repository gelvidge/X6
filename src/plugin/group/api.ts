import { Graph } from '../../graph'
import type { Group } from './index'

declare module '../../graph/graph' {
  interface Graph {
    isGroupEnabled: () => boolean
    enableGroup: () => Graph
    disableGroup: () => Graph
    toggleGroup: (enabled?: boolean) => Graph
  }
}

Graph.prototype.isGroupEnabled = function () {
  const group = this.getPlugin('group') as Group
  if (group) {
    return group.isEnabled()
  }
  return false
}

Graph.prototype.enableGroup = function () {
  const group = this.getPlugin('group') as Group
  if (group) {
    group.enable()
  }
  return this
}

Graph.prototype.disableGroup = function () {
  const group = this.getPlugin('group') as Group
  if (group) {
    group.disable()
  }
  return this
}

Graph.prototype.toggleGroup = function (enabled?: boolean) {
  const group = this.getPlugin('group') as Group
  if (group) {
    group.toggleEnabled(enabled)
  }
  return this
}
