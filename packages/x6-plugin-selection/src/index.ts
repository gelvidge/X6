import {
  Basecoat,
  ModifierKey,
  CssLoader,
  Dom,
  // ObjectExt,
  Cell,
  EventArgs,
  Graph,
} from '@antv/x6'
import { Transform } from '@antv/x6-plugin-transform'
import { SelectionImpl } from './selection'
import { content } from './style/raw'
import './api'

export class Selection
  extends Basecoat<SelectionImpl.EventArgs>
  implements Graph.Plugin
{
  public name = 'selection'
  // private dcSelected: Cell[]

  private graph: Graph
  private blockClick: Cell[]
  private movingSelectedCells: Cell[]
  private selectionImpl: SelectionImpl
  private readonly options: Selection.Options
  private movedMap = new WeakMap<Cell, boolean>()
  private unselectMap = new WeakMap<Cell, boolean>()

  get rubberbandDisabled() {
    return this.options.enabled !== true || this.options.rubberband !== true
  }

  get disabled() {
    return this.options.enabled !== true
  }

  get length() {
    return this.selectionImpl.length
  }

  get cells() {
    return this.selectionImpl.cells
  }

  constructor(options: Selection.Options = {}) {
    super()
    this.options = {
      enabled: true,
      ...Selection.defaultOptions,
      ...options,
    }

    CssLoader.ensure(this.name, content)
  }

  public init(graph: Graph) {
    this.graph = graph
    this.graph.getPlugin('transform') as Transform
    this.blockClick = []
    this.movingSelectedCells = []
    this.selectionImpl = new SelectionImpl({
      ...this.options,
      graph,
    })
    this.setup()
    this.startListening()
  }

  // #region api

  isEnabled() {
    return !this.disabled
  }

  enable() {
    if (this.disabled) {
      this.options.enabled = true
    }
  }

  disable() {
    if (!this.disabled) {
      this.options.enabled = false
    }
  }

  toggleEnabled(enabled?: boolean) {
    if (enabled != null) {
      if (enabled !== this.isEnabled()) {
        if (enabled) {
          this.enable()
        } else {
          this.disable()
        }
      }
    } else if (this.isEnabled()) {
      this.disable()
    } else {
      this.enable()
    }

    return this
  }

  isMultipleSelection() {
    return this.isMultiple()
  }

  enableMultipleSelection() {
    this.enableMultiple()
    return this
  }

  disableMultipleSelection() {
    this.disableMultiple()
    return this
  }

  toggleMultipleSelection(multiple?: boolean) {
    if (multiple != null) {
      if (multiple !== this.isMultipleSelection()) {
        if (multiple) {
          this.enableMultipleSelection()
        } else {
          this.disableMultipleSelection()
        }
      }
    } else if (this.isMultipleSelection()) {
      this.disableMultipleSelection()
    } else {
      this.enableMultipleSelection()
    }

    return this
  }

  isSelectionMovable() {
    return this.options.movable !== false
  }

  enableSelectionMovable() {
    this.selectionImpl.options.movable = true
    return this
  }

  disableSelectionMovable() {
    this.selectionImpl.options.movable = false
    return this
  }

  toggleSelectionMovable(movable?: boolean) {
    if (movable != null) {
      if (movable !== this.isSelectionMovable()) {
        if (movable) {
          this.enableSelectionMovable()
        } else {
          this.disableSelectionMovable()
        }
      }
    } else if (this.isSelectionMovable()) {
      this.disableSelectionMovable()
    } else {
      this.enableSelectionMovable()
    }

    return this
  }

  isRubberbandEnabled() {
    return !this.rubberbandDisabled
  }

  enableRubberband() {
    if (this.rubberbandDisabled) {
      this.options.rubberband = true
    }
    return this
  }

  disableRubberband() {
    if (!this.rubberbandDisabled) {
      this.options.rubberband = false
    }
    return this
  }

  toggleRubberband(enabled?: boolean) {
    if (enabled != null) {
      if (enabled !== this.isRubberbandEnabled()) {
        if (enabled) {
          this.enableRubberband()
        } else {
          this.disableRubberband()
        }
      }
    } else if (this.isRubberbandEnabled()) {
      this.disableRubberband()
    } else {
      this.enableRubberband()
    }

    return this
  }

  isStrictRubberband() {
    return this.selectionImpl.options.strict === true
  }

  enableStrictRubberband() {
    this.selectionImpl.options.strict = true
    return this
  }

  disableStrictRubberband() {
    this.selectionImpl.options.strict = false
    return this
  }

  toggleStrictRubberband(strict?: boolean) {
    if (strict != null) {
      if (strict !== this.isStrictRubberband()) {
        if (strict) {
          this.enableStrictRubberband()
        } else {
          this.disableStrictRubberband()
        }
      }
    } else if (this.isStrictRubberband()) {
      this.disableStrictRubberband()
    } else {
      this.enableStrictRubberband()
    }

    return this
  }

  setRubberbandModifiers(modifiers?: string | ModifierKey[] | null) {
    this.setModifiers(modifiers)
  }

  setSelectionFilter(filter?: Selection.Filter) {
    this.setFilter(filter)
    return this
  }

  setSelectionDisplayContent(content?: Selection.Content) {
    this.setContent(content)
    return this
  }

  isEmpty() {
    return this.length <= 0
  }

  clean(options: Selection.SetOptions = {}) {
    this.selectionImpl.clean(options)
    return this
  }

  reset(
    cells?: Cell | string | (Cell | string)[],
    options: Selection.SetOptions = {},
  ) {
    this.selectionImpl.reset(cells ? this.getCells(cells) : [], options)
    return this
  }

  getSelectedCells(includeChildren = false) {
    if (includeChildren) {
      const cellsWithChildren: Cell<Cell.Properties>[] = []
      this.cells.forEach((cell) => {
        const children = cell.getDescendants()
        cellsWithChildren.push(cell, ...children)
      })
      return cellsWithChildren
    }
    return this.cells
  }

  getSelectedCellCount() {
    return this.length
  }

  isSelected(cell: Cell | string) {
    return this.selectionImpl.isSelected(cell)
  }

  select(
    cells: Cell | string | (Cell | string)[],
    options: Selection.AddOptions = {},
  ) {
    const selected = this.getCells(cells)
    if (selected.length) {
      if (this.isMultiple()) {
        this.selectionImpl.select(selected, options)
      } else {
        this.reset(selected.slice(0, 1), options)
      }
    }
    return this
  }

  unselect(
    cells: Cell | string | (Cell | string)[],
    options: Selection.RemoveOptions = {},
  ) {
    this.selectionImpl.unselect(this.getCells(cells), options)
    return this
  }

  // #endregion

  protected setup() {
    this.selectionImpl.on('*', (name, args) => {
      this.trigger(name, args)
      this.graph.trigger(name, args)
    })
  }

  groupCells(cells: Cell[]) {
    this.graph.startBatch('grouping')
    const padding = 0
    const childArray: Cell[] = []
    cells.forEach((cell) => {
      if (!cell.hasParent()) {
        childArray.push(cell)
      }
    })

    const bbox = this.graph.model.getCellsBBox(cells)
    if (childArray.length > 1 && bbox) {
      const parent = this.graph.createNode({
        size: {
          width: bbox.width + padding * 2,
          height: bbox.height + padding * 2,
        },
        position: { x: bbox.x - padding, y: bbox.y - padding },
        attrs: {
          body: {
            visibility: 'visible',
            pointerEvents: 'visibleStroke',
            fillOpacity: 0,
            strokeWidth: 12,
            strokeOpacity: 0,
          },
        },
      })

      childArray.forEach((cell) => {
        cell.setParent(parent)
      })

      parent.setChildren(childArray)
      this.graph.addNode(parent)
      if (typeof (this.graph as any).resetSelection === 'function') {
        ;(this.graph as any).resetSelection(parent)
      }
    }
    this.graph.stopBatch('grouping')
  }
  // ***1 things to crorrect:
  // -when grouping a rotated group with added in cell, problems with parent afterwards
  unGroupCells(cells: Cell[]) {
    this.graph.startBatch('ungrouping')
    const groupArray: Cell[] = []
    cells.forEach((cell) => {
      if (!cell.hasParent() && cell.getChildren()) {
        groupArray.push(cell)
      }
    })

    if (typeof (this.graph as any).resetSelection === 'function') {
      ;(this.graph as any).resetSelection(groupArray)
    }

    groupArray.forEach((group) => {
      const children = group.getChildren()
      children && this.graph.select(children)

      children?.forEach((child) => {
        child.setParent(null)
      })
      group.setChildren(null)
      group.remove()
    })
    this.graph.stopBatch('ungrouping')
  }

  getRootNode(cell: Cell): Cell | null {
    let root: Cell | null = cell
    if (!root.hasParent()) return null
    while (root?.hasParent()) {
      root = root.getParent()
    }
    return root
  }

  getRootsNodes(cells: Cell[]): Cell[] {
    const rootParentNodes: Cell[] = []
    cells.forEach((cell: Cell) => {
      if (!cell.hasParent() && cell.getChildren()) {
        rootParentNodes.push(cell)
      }
    })
    return rootParentNodes
  }

  protected getCells(cells: Cell | string | (Cell | string)[]) {
    return (Array.isArray(cells) ? cells : [cells])
      .map((cell) =>
        typeof cell === 'string' ? this.graph.getCellById(cell) : cell,
      )
      .filter((cell) => cell != null)
  }

  protected getSelectedParentCells() {
    const cells = this.graph.getSelectedCells()
    const array = [] as Cell[]
    cells.forEach((cell) => {
      if (cell.getChildren()) array.push(cell)
    })
    return array
  }

  protected cellsSelectedOutsideGroup(cell: Cell): number {
    const cells = this.graph.getSelectedCells()
    const root = this.graph.getRootNode(cell) || cell
    const children = root.getDescendants() || []
    let count = 0
    children.forEach((child) => {
      if (this.isSelected(child) && child.getDescendants().length === 0)
        count += 1
    })

    return cells.length - count
  }

  protected startListening() {
    this.graph.on('blank:mousedown', this.onBlankMouseDown, this)
    this.graph.on('blank:click', this.onBlankClick, this)
    this.graph.on('cell:mousedown', this.onCellMouseDown, this)
    this.selectionImpl.on('box:mousedown', this.onBoxMouseDown, this)
    this.graph.on('node:move', this.onNodeMove, this)
    this.graph.on('node:moved', this.onNodeMoved, this)
    this.graph.on('edge:move', this.onEdgeMove, this)
    this.graph.on('edge:moved', this.onEdgeMoved, this)
    this.graph.on('cell:click', this.onCellClick, this)
    this.graph.on('cell:selected', this.onCellSelected, this)
    this.graph.on('cell:unselected', this.onCellUnselected, this)
  }

  protected stopListening() {
    this.graph.off('blank:mousedown', this.onBlankMouseDown, this)
    this.graph.off('blank:click', this.onBlankClick, this)
    this.graph.off('cell:mousedown', this.onCellMouseDown, this)
    this.selectionImpl.off('box:mousedown', this.onBoxMouseDown, this)
    this.graph.off('node:move', this.onNodeMove, this)
    this.graph.off('node:moved', this.onNodeMoved, this)
    this.graph.off('edge:move', this.onEdgeMove, this)
    this.graph.off('edge:moved', this.onEdgeMoved, this)
    this.graph.off('cell:click', this.onCellClick, this)
    this.graph.off('cell:selected', this.onCellSelected, this)
    this.graph.off('cell:unselected', this.onCellUnselected, this)
  }

  protected onCellMouseDown({ e, cell }: EventArgs['cell:mousedown']) {
    let parent: Cell | null = null
    if (typeof (this.graph as any).getRootNode === 'function') {
      parent = (this.graph as any).getRootNode(cell)
    }

    const { options } = this
    let { disabled } = this
    if (!disabled && this.movedMap.has(cell)) {
      disabled = options.selectCellOnMoved === false

      if (!disabled) {
        disabled = options.selectNodeOnMoved === false && cell.isNode()
      }

      if (!disabled) {
        disabled = options.selectEdgeOnMoved === false && cell.isEdge()
      }
    }
    const selectedCells = this.graph.getSelectedCells()
    if (!disabled) {
      if (parent) {
        let selectedChildCount = 0
        const children = parent?.getDescendants()
        children &&
          children.forEach((child: Cell) => {
            if (this.isSelected(child)) selectedChildCount += 1
          })
        if (!this.isSelected(cell) && !this.isSelected(parent) && e.ctrlKey) {
          this.select(parent)
          selectedCells.forEach((lcell) => {
            lcell.hasParent() && this.unselect(lcell)
          })
          this.blockClick.push(cell)
        } else if (
          !this.isSelected(cell) &&
          !this.isSelected(parent) &&
          !e.ctrlKey
        ) {
          this.reset(parent)
          this.blockClick.push(cell)
        } else if (
          this.isSelected(cell) &&
          this.isSelected(parent) &&
          e.ctrlKey
        ) {
          this.unselect(cell)
          this.blockClick.push(cell)
        } else if (
          !this.isSelected(cell) &&
          this.isSelected(parent) &&
          e.ctrlKey
        ) {
          let isolatedCellCount = 0
          selectedCells.forEach((lcell) => {
            if (!lcell.hasParent()) {
              // a single isolated, selected cell
              parent && this.unselect(parent)
              isolatedCellCount += 1
            }
            if (lcell.hasParent() && !lcell.isDescendantOf(parent)) {
              this.unselect(lcell)
            }

            // if (lcell.hasParent()) {
            //   parent && this.unselect(parent)
            //   cellCount++
            // }
          })

          if (isolatedCellCount <= 1) {
            this.select(cell)
            parent && this.select(parent)
          }
          this.blockClick.push(cell)
        } else if (
          this.isSelected(parent) && /// **only when a child is selected */
          !this.isSelected(cell) &&
          !e.ctrlKey &&
          selectedChildCount > 0
        ) {
          this.reset(cell)
          this.select(parent)
          this.blockClick.push(cell)
        }
      } else {
        if (!this.isSelected(cell) && !e.ctrlKey) {
          this.reset(cell)
          this.blockClick.push(cell)
        } else if (!this.isSelected(cell) && e.ctrlKey) {
          selectedCells.forEach((lcell) => {
            lcell.hasParent() && this.unselect(lcell)
          })
          this.select(cell)
          this.blockClick.push(cell)
        } else if (this.isSelected(cell) && e.ctrlKey) {
          this.unselect(cell)
          this.blockClick.push(cell)
        } else if (this.isSelected(cell) && !e.ctrlKey) {
          this.blockClick.push(cell)
        }
      }
    }
  }

  protected onCellClick({ e, cell }: EventArgs['cell:click']) {
    if (this.blockClick.includes(cell)) {
      this.blockClick = []
      return
    }
    let parent = null
    if (typeof (this.graph as any).getRootNode === 'function') {
      parent = (this.graph as any).getRootNode(cell)
    }
    if (this.isSelected(parent) && !this.isSelected(cell) && !e.ctrlKey) {
      // only when a child is not selected
      this.reset(cell)
      this.select(parent)
    } else if (this.cellsSelectedOutsideGroup(cell) === 0) {
      if (this.isSelected(parent) && !this.isSelected(cell) && e.ctrlKey) {
        this.select(cell)
      } else if (
        this.isSelected(parent) &&
        this.isSelected(cell) &&
        e.ctrlKey
      ) {
        this.unselect(cell)
      }
    } else if (
      this.cellsSelectedOutsideGroup(cell) > 0 &&
      this.isSelected(parent) &&
      !this.isSelected(cell) &&
      e.ctrlKey
    ) {
      this.unselect(parent)
    }
  }

  protected onCellUnselected({
    cell,
  }: SelectionImpl.SelectionEventArgs['cell:unselected']) {
    // this.dcSelected = []
    if (cell.getChildren()) {
      cell.setAttrs({
        body: { visibility: 'hidden' },
      })
    }
    cell.isNode() && this.graph.clearTransformWidget(cell)
  }

  protected onCellSelected({
    cell,
  }: SelectionImpl.SelectionEventArgs['cell:selected']) {
    cell.isNode() && this.graph.createTransformWidget(cell, true)
    if (cell.getChildren()) {
      cell.setAttrs({
        body: { visibility: 'visible' },
      })

      // const children = cell.getDescendants()
      // children.forEach((child) => {
      //   child.isNode() && this.graph.clearTransformWidget(child)
      // })
      // this.graph.unselect(children)
    }
  }

  protected onBoxMouseDown({
    e,
    cell,
  }: SelectionImpl.EventArgs['box:mousedown']) {
    if (!this.disabled) {
      if (this.allowMultipleSelection(e)) {
        this.unselect(cell)
        this.unselectMap.set(cell, true)
      }
    }
  }

  protected onBlankMouseDown({ e }: EventArgs['blank:mousedown']) {
    const allowGraphPanning = this.graph.panning.allowPanning(e, true)
    const scroller = this.graph.getPlugin<any>('scroller')
    const allowScrollerPanning = scroller && scroller.allowPanning(e, true)
    if (
      this.allowRubberband(e, true) ||
      (this.allowRubberband(e) && !allowScrollerPanning && !allowGraphPanning)
    ) {
      this.startRubberband(e)
    }
  }

  protected onBlankClick() {
    this.clean()
  }

  protected allowRubberband(e: Dom.MouseDownEvent, strict?: boolean) {
    return (
      !this.rubberbandDisabled &&
      ModifierKey.isMatch(e, this.options.modifiers, strict)
    )
  }

  protected allowMultipleSelection(e: Dom.MouseDownEvent | Dom.MouseUpEvent) {
    return (
      this.isMultiple() &&
      ModifierKey.isMatch(e, this.options.multipleSelectionModifiers)
    )
  }

  updateGroupBounds(cell: Cell) {
    let parent = cell.getParent()

    while (parent) {
      const children = parent.getDescendants()
      const bbox = this.graph.model.getCellsBBox(children)
      this.graph.isNode(parent) && bbox && parent.size(bbox.width, bbox.height)
      this.graph.isNode(parent) && bbox && parent.position(bbox.x, bbox.y)
      parent.isNode() && parent.rotate(-parent.getAngle())
      parent = parent.getParent()
    }
  }

  protected firstCell = true

  protected onNodeMove({ node }: EventArgs['node:move']) {
    if (!this.firstCell) return
    this.movingSelectedCells = []
    const cells = this.getSelectedCells()

    cells.forEach((cell) => {
      !this.movingSelectedCells.includes(cell) &&
        this.movingSelectedCells.push(cell)
      cell.isNode() && this.graph.clearTransformWidget(cell)
      const children = cell.getDescendants()

      if (children) {
        let selectedChildren = 0
        children.forEach((child) => {
          if (this.isSelected(child)) selectedChildren += 1
        })
        if (selectedChildren === 0) {
          children.forEach((child) => {
            !this.isSelected(child) && this.select(child)
            child.isNode() && this.graph.clearTransformWidget(child)
          })
        } else {
          this.unselect(cell)
        }
      }
    })

    if (!this.isSelected(node)) {
      const parentNode = this.getRootNode(node)
      if (parentNode) {
        const children = parentNode.getDescendants()
        children.forEach((child) => {
          this.select(child)
          child.isNode() && this.graph.clearTransformWidget(child)
        })
      }
    }
    this.firstCell = false
  }

  protected onEdgeMove({ edge }: EventArgs['edge:move']) {
    if (!this.firstCell) return
    this.movingSelectedCells = []
    const cells = this.getSelectedCells()

    cells.forEach((cell) => {
      !this.movingSelectedCells.includes(cell) &&
        this.movingSelectedCells.push(cell)
      cell.isNode() && this.graph.clearTransformWidget(cell)
      const children = cell.getDescendants()

      if (children) {
        let selectedChildren = 0
        children.forEach((child) => {
          if (this.isSelected(child)) selectedChildren += 1
        })
        if (selectedChildren === 0) {
          children.forEach((child) => {
            !this.isSelected(child) && this.select(child)
            child.isNode() && this.graph.clearTransformWidget(child)
          })
        } else {
          this.unselect(cell)
        }
      }
    })

    if (!this.isSelected(edge)) {
      const parentNode = this.getRootNode(edge)
      if (parentNode) {
        const children = parentNode.getDescendants()
        children.forEach((child) => {
          this.select(child)
          child.isNode() && this.graph.clearTransformWidget(child)
        })
      }
    }
    this.firstCell = false
  }

  protected onNodeMoved({ node }: EventArgs['node:moved']) {
    this.movingSelectedCells.length && this.graph.cleanSelection()
    this.movingSelectedCells.forEach((cell) => {
      this.select(cell)
    })
    this.updateGroupBounds(node)
    this.movingSelectedCells = []
    this.firstCell = true
  }

  protected onEdgeMoved({ edge }: EventArgs['edge:moved']) {
    this.movingSelectedCells.length && this.graph.cleanSelection()
    this.movingSelectedCells.forEach((cell) => {
      this.select(cell)
    })
    this.updateGroupBounds(edge)
    this.movingSelectedCells = []
    this.firstCell = true
  }

  protected startRubberband(e: Dom.MouseDownEvent) {
    if (!this.rubberbandDisabled) {
      this.selectionImpl.startSelecting(e)
    }
    return this
  }

  protected isMultiple() {
    return this.options.multiple !== false
  }

  protected enableMultiple() {
    this.options.multiple = true
    return this
  }

  protected disableMultiple() {
    this.options.multiple = false
    return this
  }

  protected setModifiers(modifiers?: string | ModifierKey[] | null) {
    this.options.modifiers = modifiers
    return this
  }

  protected setContent(content?: Selection.Content) {
    this.selectionImpl.setContent(content)
    return this
  }

  protected setFilter(filter?: Selection.Filter) {
    this.selectionImpl.setFilter(filter)
    return this
  }

  @Basecoat.dispose()
  dispose() {
    this.stopListening()
    this.off()
    this.selectionImpl.dispose()
    CssLoader.clean(this.name)
  }
}

export namespace Selection {
  export type EventArgs = SelectionImpl.EventArgs
  export interface Options extends SelectionImpl.CommonOptions {
    enabled?: boolean
  }

  export type Filter = SelectionImpl.Filter
  export type Content = SelectionImpl.Content

  export type SetOptions = SelectionImpl.SetOptions
  export type AddOptions = SelectionImpl.AddOptions
  export type RemoveOptions = SelectionImpl.RemoveOptions

  export const defaultOptions: Partial<SelectionImpl.Options> = {
    rubberband: false,
    rubberNode: true,
    rubberEdge: false, // next version will set to true
    pointerEvents: 'auto',
    multiple: true,
    multipleSelectionModifiers: ['ctrl', 'meta'],
    movable: true,
    strict: false,
    selectCellOnMoved: false,
    selectNodeOnMoved: false,
    selectEdgeOnMoved: false,
    following: true,
    content: null,
  }
}
