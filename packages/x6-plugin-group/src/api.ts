import { Graph, Cell } from '@antv/x6'
import { Group } from '../index'
import { GroupImpl } from '../group'

declare module '@antv/x6/lib/graph/graph' {
  interface Graph {
    isGroupEnabled: () => boolean
    getRootNode: (cell: Cell) => Cell
    getRootsNodes: (cells: Cell[]) => Cell[]
    getRootGroupNodes: (cells: Cell[]) => Cell[]
    groupCells: (cells: Cell[]) => Cell | null
    unGroupCells: (cells: Cell[]) => null
    updateGroupBounds: (cell: Cell) => Node
  }
}

Graph.prototype.isGroupEnabled = function () {
  const group = this.getPlugin('group') as Group
  if (group) {
    return group.isEnabled()
  }
  return false
}

Graph.prototype.getRootNode = function (cell: Cell) {
  const group = this.getPlugin('group') as Group
  if (group) {
    return group.getRootNode(cell)
  }
  return cell
}

Graph.prototype.getRootsNodes = function (cells: Cell[]) {
  const group = this.getPlugin('group') as Group
  if (group) {
    return group.getRootsNodes(cells)
  }
  return []
}

Graph.prototype.groupCells = function (cells: Cell[]) {
  const group = this.getPlugin('group') as Group
  if (group) {
    return group.groupCells(cells)
  }
  return null
}

Graph.prototype.unGroupCells = function (cells: Cell[]) {
  const group = this.getPlugin('group') as Group
  if (group) {
    return group.unGroupCells(cells)
  }
  return null
}

Graph.prototype.updateGroupBounds = function (cells: Cell) {
  const group = this.getPlugin('group') as Group
  if (group) {
    return group.updateGroupBounds(cells)
  }
  return null
}
