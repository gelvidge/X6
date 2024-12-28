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
import { SelectionImpl } from './selection'
import { Transform } from '../../x6-plugin-transform/src'
import { content } from './style/raw'
import './api'

export class Selection
  extends Basecoat<SelectionImpl.EventArgs>
  implements Graph.Plugin
{
  public name = 'selection'
  private dcSelected: Cell[]
  // private moveSelected: []
  private graph: Graph
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
    this.graph.getPlugin('transform') as Transform
    CssLoader.ensure(this.name, content)
  }

  public init(graph: Graph) {
    this.graph = graph
    this.dcSelected = []
    // this.moveSelected=[]
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

  getSelectedCells() {
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
    const padding = 0
    const childArray: Cell[] = []
    cells.forEach((cell) => {
      if (!cell.hasParent()) {
        childArray.push(cell)
        cell.prop('groupedNode', true)
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

      parent.prop('parentNode', true)
    }
  }

  unGroupCells(cells: Cell[]) {
    const groupArray: Cell[] = []
    cells.forEach((cell) => {
      if (!cell.hasParent() && cell.prop('parentNode')) {
        groupArray.push(cell)
      }
    })

    if (typeof (this.graph as any).resetSelection === 'function') {
      ;(this.graph as any).resetSelection(groupArray)
    }

    groupArray.forEach((group) => {
      const children = group.getChildren()
      children?.forEach((child) => child.prop('groupedNode', false))
      children && this.graph.select(children)
      group.setChildren(null)
      group.remove()
    })
  }

  getRootNode(cell: Cell): Cell | null {
    let root = null
    if (!cell.hasParent()) return null
    while (cell.hasParent()) {
      root = cell.getParent()
    }
    return root
  }

  getRootsNodes(cells: Cell[]): Cell[] {
    const rootParentNodes: Cell[] = []
    cells.forEach((cell: Cell) => {
      if (!cell.hasParent() && cell.prop('parentNode')) {
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
      if (cell.prop('parentNode')) array.push(cell)
    })
    return array
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

  protected onCellClick({ e, cell }: EventArgs['cell:click']) {
    const parent = this.getRootNode(cell)
    if (!parent) return
    const group = this.getSelectedParentCells()
    if (group.length > 1) {
      group.forEach((cell) => {
        this.graph.unselect(cell.getDescendants({ deep: true }))
      })
      return
    }
    if (this.graph.isSelected(cell)) {
      this.graph.unselect(cell)
    } else if (!this.graph.isSelected(cell) && e.ctrlKey) {
      this.graph.select(cell)
    } else if (!this.graph.isSelected(cell) && this.dcSelected.includes(cell)) {
      this.graph.resetSelection([parent, cell])
      this.dcSelected = []
    } else if (!this.graph.isSelected(cell)) {
      this.dcSelected.push(cell)
    }
  }

  protected onCellUnselected({
    cell,
  }: SelectionImpl.SelectionEventArgs['cell:unselected']) {
    this.dcSelected = []
    if (cell.prop('parentNode')) {
      cell.setAttrs({
        body: { visibility: 'hidden' },
      })
    }
  }

  protected onCellSelected({
    cell,
  }: SelectionImpl.SelectionEventArgs['cell:selected']) {
    if (cell.prop('parentNode')) {
      cell.setAttrs({
        body: { visibility: 'visible' },
      })
      const children = cell.getDescendants({ deep: true })
      this.graph.unselect(children)
    }
  }

  protected onCellMouseDown({ e, cell }: EventArgs['cell:mousedown']) {
    let parent = null
    if (typeof (this.graph as any).getRootNode === 'function') {
      parent = (this.graph as any).getRootNode(cell)
    }

    if (parent) {
      if (!this.graph.isSelected(parent) && e.ctrlKey) {
        this.graph.select(parent)
      } else if (!this.graph.isSelected(parent)) {
        this.graph.resetSelection(parent)
      } else this.dcSelected.push(cell)
    } else {
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

      if (!disabled) {
        if (!e.ctrlKey && !this.isSelected(cell)) {
          this.graph.resetSelection(cell)
        } // ctrl not pressed, no parent and multiple cells not selected
        else if (e.ctrlKey && this.isSelected(cell)) {
          this.unselect(cell)
        } else if (e.ctrlKey && this.allowMultipleSelection(e)) {
          this.select(cell)
        }
      }
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
    const ancestors = cell.getAncestors({ deep: true })
    ancestors.forEach((ancestor: Cell) => {
      const bbox = this.graph.model.getCellsBBox(
        ancestor.getDescendants({ deep: true }),
      )
      this.graph.isNode(ancestor) &&
        bbox &&
        ancestor.size(bbox.width, bbox.height)
      this.graph.isNode(ancestor) && bbox && ancestor.position(bbox.x, bbox.y)
    })
  }

  protected onNodeMove({ node }: EventArgs['node:move']) {
    const parent = this.getRootNode(node)
    if (!parent) return
    const children = parent.getDescendants({ deep: true })
    if (this.graph.isSelected(node)) {
      this.graph.resetSelection(node)
      // this.moveSelected.push(node);
    } else {
      children?.forEach((child) => {
        this.graph.select(child)
        //  this.moveSelected.push(child);

        child.isNode() && this.graph.clearTransformWidget(child)
        this.graph.unselect(parent) // pseudo unselection for children- bit of a hack
      })
    }
  }

  protected onEdgeMove({ edge }: EventArgs['edge:move']) {
    const parent = this.getRootNode(edge)
    if (!parent) return
    const children = parent.getDescendants({ deep: true })
    if (this.graph.isSelected(edge)) {
      this.graph.resetSelection(edge)
      // this.moveSelected.push(node);
    } else {
      children?.forEach((child) => {
        this.graph.select(child)
        //  this.moveSelected.push(child);

        child.isNode() && this.graph.clearTransformWidget(child)
        this.graph.unselect(parent) // pseudo unselection for children- bit of a hack
      })
    }
  }

  protected onNodeMoved({ node }: EventArgs['node:moved']) {
    const parent = this.getRootNode(node)
    // this.graph.clearTransformWidget(node);
    if (!parent) return
    const children = parent.getDescendants({ deep: true })
    children?.forEach((child) => this.graph.unselect(child))
    this.graph.select(parent)
    // if (this.moveSelected.includes(node)) {
    //     this.graph.select(node);
    // }
    // this.moveSelected = [];
    this.updateGroupBounds(node)
  }

  protected onEdgeMoved({ edge }: EventArgs['edge:moved']) {
    const parent = this.getRootNode(edge)
    if (!parent) return
    const children = parent.getDescendants({ deep: true })
    children?.forEach((child) => this.graph.unselect(child))
    this.graph.select(parent)
    // if (this.moveSelected.includes(edge)) {
    //    this.graph.select(edge);
    // }
    // this.moveSelected = [];
    this.updateGroupBounds(edge)
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
