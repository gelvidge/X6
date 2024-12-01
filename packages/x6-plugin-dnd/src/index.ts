import {
  GeometryUtil,
  Rectangle,
  Point,
  FunctionExt,
  Dom,
  CssLoader,
  Cell,
  Node,
<<<<<<< HEAD
  Edge,
  View,
  CellView,
  Graph,
  EventArgs,
} from '@antv/x6'
=======
  View,
  NodeView,
  Graph,
  EventArgs,
} from '@antv/x6'
import { alignPoint } from 'dom-align'
>>>>>>> x6/master
import { content } from './style/raw'

export class Dnd extends View implements Graph.Plugin {
  public name = 'dnd'

<<<<<<< HEAD
  protected sourceCell: Cell | null

  protected draggingCell: Cell | null

  protected draggingView: CellView | null

  protected draggingBBox: Rectangle

  protected geometryBBox: Rectangle

  protected candidateEmbedView: CellView | null

  protected delta: Point | null

  protected padding: number | null

  protected snapOffset: Point.PointLike | null

  protected originOffset: null | { left: number; top: number }

  public options: Dnd.Options

  public draggingGraph: Graph

  protected get targetScroller() {
    const { target } = this.options
=======
  protected sourceNode: Node | null
  protected draggingNode: Node | null
  protected draggingView: NodeView | null
  protected draggingBBox: Rectangle
  protected geometryBBox: Rectangle
  protected candidateEmbedView: NodeView | null
  protected delta: Point | null
  protected padding: number | null
  protected snapOffset: Point.PointLike | null

  public options: Dnd.Options
  public draggingGraph: Graph

  protected get targetScroller() {
    const target = this.options.target
>>>>>>> x6/master
    const scroller = target.getPlugin<any>('scroller')
    return scroller
  }

  protected get targetGraph() {
    return this.options.target
  }

  protected get targetModel() {
    return this.targetGraph.model
  }

  protected get snapline() {
<<<<<<< HEAD
    const { target } = this.options
=======
    const target = this.options.target
>>>>>>> x6/master
    const snapline = target.getPlugin<any>('snapline')
    return snapline
  }

  constructor(options: Partial<Dnd.Options> & { target: Graph }) {
    super()
    this.options = {
      ...Dnd.defaults,
      ...options,
    } as Dnd.Options
    this.init()
  }

  init() {
    CssLoader.ensure(this.name, content)

    this.container = document.createElement('div')
    Dom.addClass(this.container, this.prefixClassName('widget-dnd'))

    this.draggingGraph = new Graph({
      ...this.options.delegateGraphOptions,
      container: document.createElement('div'),
      width: 1,
      height: 1,
      async: false,
    })

    Dom.append(this.container, this.draggingGraph.container)
  }

<<<<<<< HEAD
  start(cell: Cell, evt: Dom.MouseDownEvent | MouseEvent) {
=======
  start(node: Node, evt: Dom.MouseDownEvent | MouseEvent) {
>>>>>>> x6/master
    const e = evt as Dom.MouseDownEvent

    e.preventDefault()

    this.targetModel.startBatch('dnd')
    Dom.addClass(this.container, 'dragging')
    Dom.appendTo(
      this.container,
      this.options.draggingContainer || document.body,
    )

<<<<<<< HEAD
    this.sourceCell = cell
    this.prepareDragging(cell, e.clientX, e.clientY)

    const local = this.updateCellPosition(e.clientX, e.clientY)

    if (false) {
      // this.isSnaplineEnabled()) {
      this.snapline.captureCursorOffset({
        e,
        cell,
        cell,
=======
    this.sourceNode = node
    this.prepareDragging(node, e.clientX, e.clientY)

    const local = this.updateNodePosition(e.clientX, e.clientY)

    if (this.isSnaplineEnabled()) {
      this.snapline.captureCursorOffset({
        e,
        node,
        cell: node,
>>>>>>> x6/master
        view: this.draggingView!,
        x: local.x,
        y: local.y,
      })
<<<<<<< HEAD
      this.draggingCell!.on('change:position', this.snap, this)
=======
      this.draggingNode!.on('change:position', this.snap, this)
>>>>>>> x6/master
    }

    this.delegateDocumentEvents(Dnd.documentEvents, e.data)
  }

  protected isSnaplineEnabled() {
    return this.snapline && this.snapline.isEnabled()
  }

  protected prepareDragging(
<<<<<<< HEAD
    sourceCell: Cell,
    clientX: number,
    clientY: number,
  ) {
    const { draggingGraph } = this
    const draggingModel = draggingGraph.model
    const draggingCell = this.options.getDragCell(sourceCell, {
      sourceCell,
=======
    sourceNode: Node,
    clientX: number,
    clientY: number,
  ) {
    const draggingGraph = this.draggingGraph
    const draggingModel = draggingGraph.model
    const draggingNode = this.options.getDragNode(sourceNode, {
      sourceNode,
>>>>>>> x6/master
      draggingGraph,
      targetGraph: this.targetGraph,
    })

<<<<<<< HEAD
    draggingCell.isNode() && draggingCell.position(0, 0)

    draggingCell.isEdge() && draggingCell.setSource(sourceCell.getSource())
    draggingCell.isEdge() && draggingCell.setTarget(sourceCell.getTarget())
    draggingCell.isEdge() && draggingCell.setAttrs(sourceCell.attrs)
=======
    draggingNode.position(0, 0)
>>>>>>> x6/master

    let padding = 5
    if (this.isSnaplineEnabled()) {
      padding += this.snapline.options.tolerance || 0
    }

    if (this.isSnaplineEnabled() || this.options.scaled) {
      const scale = this.targetGraph.transform.getScale()
      draggingGraph.scale(scale.sx, scale.sy)
      padding *= Math.max(scale.sx, scale.sy)
    } else {
      draggingGraph.scale(1, 1)
    }

    this.clearDragging()

    // if (this.options.animation) {
    //   this.$container.stop(true, true)
    // }

<<<<<<< HEAD
    draggingModel.resetCells([draggingCell])

    const delegateView = draggingGraph.findViewByCell(draggingCell) as CellView
=======
    draggingModel.resetCells([draggingNode])

    const delegateView = draggingGraph.findViewByCell(draggingNode) as NodeView
>>>>>>> x6/master
    delegateView.undelegateEvents()
    delegateView.cell.off('changed')
    draggingGraph.fitToContent({
      padding,
      allowNewOrigin: 'any',
      useCellGeometry: false,
    })

    const bbox = delegateView.getBBox()
    this.geometryBBox = delegateView.getBBox({ useCellGeometry: true })
    this.delta = this.geometryBBox.getTopLeft().diff(bbox.getTopLeft())
<<<<<<< HEAD
    this.draggingCell = draggingCell
    this.draggingView = delegateView
    this.draggingBBox = draggingCell.getBBox()
    this.padding = padding
    this.originOffset = this.updateGraphPosition(clientX, clientY)
  }

  protected updateGraphPosition(clientX: number, clientY: number) {
    const scrollTop =
      document.body.scrollTop || document.documentElement.scrollTop
    const scrollLeft =
      document.body.scrollLeft || document.documentElement.scrollLeft
    const delta = this.delta!
    const cellBBox = this.geometryBBox
    const padding = this.padding || 5
    const offset = {
      left: clientX - delta.x - cellBBox.width / 2 - padding + scrollLeft,
      top: clientY - delta.y - cellBBox.height / 2 - padding + scrollTop,
    }

    if (this.draggingGraph) {
      Dom.css(this.container, {
        left: `${offset.left}px`,
        top: `${offset.top}px`,
      })
    }

    return offset
  }

  protected updateCellPosition(x: number, y: number) {
=======
    this.draggingNode = draggingNode
    this.draggingView = delegateView
    this.draggingBBox = draggingNode.getBBox()
    this.padding = padding
    this.updateGraphPosition(clientX, clientY)
  }

  protected updateGraphPosition(clientX: number, clientY: number) {
    const delta = this.delta!
    const nodeBBox = this.geometryBBox
    const padding = this.padding || 5
    const offset = {
      left: clientX - delta.x - nodeBBox.width / 2 - padding,
      top: clientY - delta.y - nodeBBox.height / 2 - padding,
    }

    if (this.draggingGraph) {
      alignPoint(
        this.container,
        {
          clientX: offset.left,
          clientY: offset.top,
        },
        {
          points: ['tl'],
        },
      )
    }
  }

  protected updateNodePosition(x: number, y: number) {
>>>>>>> x6/master
    const local = this.targetGraph.clientToLocal(x, y)
    const bbox = this.draggingBBox!
    local.x -= bbox.width / 2
    local.y -= bbox.height / 2
<<<<<<< HEAD
    this.draggingCell?.isNode() && this.draggingCell!.position(local.x, local.y)
    this.draggingCell?.isEdge() &&
      this.draggingCell!.setSource({ x: local.x, y: local.y })
    this.draggingCell?.isEdge() &&
      this.draggingCell!.setTarget({ x: local.x, y: local.y })
=======
    this.draggingNode!.position(local.x, local.y)
>>>>>>> x6/master
    return local
  }

  protected snap({
    cell,
    current,
    options,
  }: Cell.EventArgs['change:position']) {
<<<<<<< HEAD
    if (options.snapped) {
      const bbox = this.draggingBBox
      cell.isNode() &&
        cell.position(bbox.x + options.tx, bbox.y + options.ty, {
          silent: true,
        })
      this.draggingView!.isNodeView() && this.draggingView!.translate()
      cell.isNode() && cell.position(current!.x, current!.y, { silent: true })
=======
    const node = cell as Node
    if (options.snapped) {
      const bbox = this.draggingBBox
      node.position(bbox.x + options.tx, bbox.y + options.ty, { silent: true })
      this.draggingView!.translate()
      node.position(current!.x, current!.y, { silent: true })
>>>>>>> x6/master

      this.snapOffset = {
        x: options.tx,
        y: options.ty,
      }
    } else {
      this.snapOffset = null
    }
  }

  protected onDragging(evt: Dom.MouseMoveEvent) {
<<<<<<< HEAD
    const { draggingView } = this
    if (draggingView) {
      evt.preventDefault()
      const e = this.normalizeEvent(evt)
      const { clientX } = e
      const { clientY } = e

      this.updateGraphPosition(clientX, clientY)
      const local = this.updateCellPosition(clientX, clientY)
=======
    const draggingView = this.draggingView
    if (draggingView) {
      evt.preventDefault()
      const e = this.normalizeEvent(evt)
      const clientX = e.clientX
      const clientY = e.clientY

      this.updateGraphPosition(clientX, clientY)
      const local = this.updateNodePosition(clientX, clientY)
>>>>>>> x6/master
      const embeddingMode = this.targetGraph.options.embedding.enabled
      const isValidArea =
        (embeddingMode || this.isSnaplineEnabled()) &&
        this.isInsideValidArea({
          x: clientX,
          y: clientY,
        })

      if (embeddingMode) {
        draggingView.setEventData(e, {
          graph: this.targetGraph,
          candidateEmbedView: this.candidateEmbedView,
        })
        const data = draggingView.getEventData<any>(e)
        if (isValidArea) {
<<<<<<< HEAD
          draggingView.isNodeView() && draggingView.processEmbedding(e, data)
        } else {
          draggingView.isNodeView() && draggingView.clearEmbedding(data)
=======
          draggingView.processEmbedding(e, data)
        } else {
          draggingView.clearEmbedding(data)
>>>>>>> x6/master
        }
        this.candidateEmbedView = data.candidateEmbedView
      }

      // update snapline
      if (this.isSnaplineEnabled()) {
        if (isValidArea) {
          this.snapline.snapOnMoving({
            e,
            view: draggingView!,
            x: local.x,
            y: local.y,
<<<<<<< HEAD
          } as EventArgs['cell:mousemove'])
=======
          } as EventArgs['node:mousemove'])
>>>>>>> x6/master
        } else {
          this.snapline.hide()
        }
      }
    }
  }

  protected onDragEnd(evt: Dom.MouseUpEvent) {
<<<<<<< HEAD
    const { draggingCell } = this
    if (draggingCell) {
      const e = this.normalizeEvent(evt)
      const { draggingView } = this
      const { draggingBBox } = this
      const { snapOffset } = this
      let { x } = draggingBBox
      let { y } = draggingBBox
=======
    const draggingNode = this.draggingNode
    if (draggingNode) {
      const e = this.normalizeEvent(evt)
      const draggingView = this.draggingView
      const draggingBBox = this.draggingBBox
      const snapOffset = this.snapOffset
      let x = draggingBBox.x
      let y = draggingBBox.y
>>>>>>> x6/master

      if (snapOffset) {
        x += snapOffset.x
        y += snapOffset.y
      }

<<<<<<< HEAD
      draggingCell.isNode() && draggingCell.position(x, y, { silent: true })
      draggingCell.isEdge() && draggingCell.setSource({ x, y })
      draggingCell.isEdge() && draggingCell.setTarget({ x, y }) // what does this do?

      const ret = this.drop(draggingCell, { x: e.clientX, y: e.clientY })
      const callback = (cell: null | Cell) => {
        if (cell) {
          this.onDropped(draggingCell)
          if (this.targetGraph.options.embedding.enabled && draggingView) {
            draggingView.setEventData(e, {
              cell,
              graph: this.targetGraph,
              candidateEmbedView: this.candidateEmbedView,
            })
            draggingView.isNodeView() &&
              draggingView.finalizeEmbedding(
                e,
                draggingView.getEventData<any>(e),
              )
=======
      draggingNode.position(x, y, { silent: true })

      const ret = this.drop(draggingNode, { x: e.clientX, y: e.clientY })
      const callback = (node: null | Node) => {
        if (node) {
          this.onDropped(draggingNode)
          if (this.targetGraph.options.embedding.enabled && draggingView) {
            draggingView.setEventData(e, {
              cell: node,
              graph: this.targetGraph,
              candidateEmbedView: this.candidateEmbedView,
            })
            draggingView.finalizeEmbedding(e, draggingView.getEventData<any>(e))
>>>>>>> x6/master
          }
        } else {
          this.onDropInvalid()
        }

        this.candidateEmbedView = null
        this.targetModel.stopBatch('dnd')
      }

      if (FunctionExt.isAsync(ret)) {
        // stop dragging
        this.undelegateDocumentEvents()
        ret.then(callback) // eslint-disable-line
      } else {
        callback(ret)
      }
    }
  }

  protected clearDragging() {
<<<<<<< HEAD
    if (this.draggingCell) {
      this.sourceCell = null
      this.draggingCell.remove()
      this.draggingCell = null
=======
    if (this.draggingNode) {
      this.sourceNode = null
      this.draggingNode.remove()
      this.draggingNode = null
>>>>>>> x6/master
      this.draggingView = null
      this.delta = null
      this.padding = null
      this.snapOffset = null
<<<<<<< HEAD
      this.originOffset = null
=======
>>>>>>> x6/master
      this.undelegateDocumentEvents()
    }
  }

<<<<<<< HEAD
  protected onDropped(draggingCell: Cell) {
    if (this.draggingCell === draggingCell) {
=======
  protected onDropped(draggingNode: Node) {
    if (this.draggingNode === draggingNode) {
>>>>>>> x6/master
      this.clearDragging()
      Dom.removeClass(this.container, 'dragging')
      Dom.remove(this.container)
    }
  }

  protected onDropInvalid() {
<<<<<<< HEAD
    const { draggingCell } = this
    if (draggingCell) {
      this.onDropped(draggingCell)
=======
    const draggingNode = this.draggingNode
    if (draggingNode) {
      this.onDropped(draggingNode)
>>>>>>> x6/master
      // todo
      // const anim = this.options.animation
      // if (anim) {
      //   const duration = (typeof anim === 'object' && anim.duration) || 150
      //   const easing = (typeof anim === 'object' && anim.easing) || 'swing'

      //   this.draggingView = null

      //   this.$container.animate(this.originOffset!, duration, easing, () =>
<<<<<<< HEAD
      //     this.onDropped(draggingCell),
      //   )
      // } else {
      //   this.onDropped(draggingCell)
=======
      //     this.onDropped(draggingNode),
      //   )
      // } else {
      //   this.onDropped(draggingNode)
>>>>>>> x6/master
      // }
    }
  }

  protected isInsideValidArea(p: Point.PointLike) {
    let targetRect: Rectangle
    let dndRect: Rectangle | null = null
<<<<<<< HEAD
    const { targetGraph } = this
    const { targetScroller } = this
=======
    const targetGraph = this.targetGraph
    const targetScroller = this.targetScroller
>>>>>>> x6/master

    if (this.options.dndContainer) {
      dndRect = this.getDropArea(this.options.dndContainer)
    }
    const isInsideDndRect = dndRect && dndRect.containsPoint(p)

    if (targetScroller) {
      if (targetScroller.options.autoResize) {
        targetRect = this.getDropArea(targetScroller.container)
      } else {
        const outter = this.getDropArea(targetScroller.container)
        targetRect = this.getDropArea(targetGraph.container).intersectsWithRect(
          outter,
        )!
      }
    } else {
      targetRect = this.getDropArea(targetGraph.container)
    }

    return !isInsideDndRect && targetRect && targetRect.containsPoint(p)
  }

  protected getDropArea(elem: Element) {
    const offset = Dom.offset(elem)!
    const scrollTop =
      document.body.scrollTop || document.documentElement.scrollTop
    const scrollLeft =
      document.body.scrollLeft || document.documentElement.scrollLeft

    return Rectangle.create({
      x:
        offset.left +
        parseInt(Dom.css(elem, 'border-left-width')!, 10) -
        scrollLeft,
      y:
        offset.top +
        parseInt(Dom.css(elem, 'border-top-width')!, 10) -
        scrollTop,
      width: elem.clientWidth,
      height: elem.clientHeight,
    })
  }

<<<<<<< HEAD
  protected drop(draggingCell: Cell, pos: Point.PointLike) {
    if (this.isInsideValidArea(pos)) {
      const { targetGraph } = this
      const targetModel = targetGraph.model
      const local = targetGraph.clientToLocal(pos)
      const sourceCell = this.sourceCell!
      const droppingCell = this.options.getDropCell(draggingCell, {
        sourceCell,
        draggingCell,
        targetGraph: this.targetGraph,
        draggingGraph: this.draggingGraph,
      })
      const bbox = droppingCell.getBBox()
=======
  protected drop(draggingNode: Node, pos: Point.PointLike) {
    if (this.isInsideValidArea(pos)) {
      const targetGraph = this.targetGraph
      const targetModel = targetGraph.model
      const local = targetGraph.clientToLocal(pos)
      const sourceNode = this.sourceNode!
      const droppingNode = this.options.getDropNode(draggingNode, {
        sourceNode,
        draggingNode,
        targetGraph: this.targetGraph,
        draggingGraph: this.draggingGraph,
      })
      const bbox = droppingNode.getBBox()
>>>>>>> x6/master
      local.x += bbox.x - bbox.width / 2
      local.y += bbox.y - bbox.height / 2
      const gridSize = this.snapOffset ? 1 : targetGraph.getGridSize()

<<<<<<< HEAD
      droppingCell.isNode() &&
        droppingCell.position(
          GeometryUtil.snapToGrid(local.x, gridSize),
          GeometryUtil.snapToGrid(local.y, gridSize),
        )
      droppingCell.isEdge() &&
        droppingCell.setSource({
          x: GeometryUtil.snapToGrid(
            local.x + droppingCell.getSource().x,
            gridSize,
          ),
          y: GeometryUtil.snapToGrid(
            local.y + droppingCell.getSource().y,
            gridSize,
          ),
        })
      droppingCell.isEdge() &&
        droppingCell.setTarget({
          x: GeometryUtil.snapToGrid(
            local.x + droppingCell.getTarget().x,
            gridSize,
          ),
          y: GeometryUtil.snapToGrid(
            local.y + droppingCell.getTarget().y,
            gridSize,
          ),
        })

      droppingCell.removeZIndex()

      const { validateCell } = this.options
      const ret = validateCell
        ? validateCell(droppingCell, {
            sourceCell,
            draggingCell,
            droppingCell,
=======
      droppingNode.position(
        GeometryUtil.snapToGrid(local.x, gridSize),
        GeometryUtil.snapToGrid(local.y, gridSize),
      )

      droppingNode.removeZIndex()

      const validateNode = this.options.validateNode
      const ret = validateNode
        ? validateNode(droppingNode, {
            sourceNode,
            draggingNode,
            droppingNode,
>>>>>>> x6/master
            targetGraph,
            draggingGraph: this.draggingGraph,
          })
        : true

      if (typeof ret === 'boolean') {
        if (ret) {
<<<<<<< HEAD
          targetModel.addCell(droppingCell, { stencil: this.cid })
          return droppingCell
=======
          targetModel.addCell(droppingNode, { stencil: this.cid })
          return droppingNode
>>>>>>> x6/master
        }
        return null
      }

      return FunctionExt.toDeferredBoolean(ret).then((valid) => {
        if (valid) {
<<<<<<< HEAD
          targetModel.addCell(droppingCell, { stencil: this.cid })
          return droppingCell
=======
          targetModel.addCell(droppingNode, { stencil: this.cid })
          return droppingNode
>>>>>>> x6/master
        }
        return null
      })
    }

    return null
  }

  protected onRemove() {
    if (this.draggingGraph) {
      this.draggingGraph.view.remove()
      this.draggingGraph.dispose()
    }
  }

  @View.dispose()
  dispose() {
    this.remove()
    CssLoader.clean(this.name)
  }
}

export namespace Dnd {
  export interface Options {
    target: Graph
    /**
<<<<<<< HEAD
     * Should scale the dragging cell or not.
=======
     * Should scale the dragging node or not.
>>>>>>> x6/master
     */
    scaled?: boolean
    delegateGraphOptions?: Graph.Options
    // animation?:
    //   | boolean
    //   | {
    //       duration?: number
    //       easing?: string
    //     }
    draggingContainer?: HTMLElement
    /**
     * dnd tool box container.
     */
    dndContainer?: HTMLElement
<<<<<<< HEAD
    getDragCell: (sourceCell: Cell, options: GetDragCellOptions) => Cell
    getDropCell: (draggingCell: Cell, options: GetDropCellOptions) => Cell
    validateCell?: (
      droppingCell: Cell,
      options: ValidateCellOptions,
    ) => boolean | Promise<boolean>
  }

  export interface GetDragCellOptions {
    sourceCell: Cell
=======
    getDragNode: (sourceNode: Node, options: GetDragNodeOptions) => Node
    getDropNode: (draggingNode: Node, options: GetDropNodeOptions) => Node
    validateNode?: (
      droppingNode: Node,
      options: ValidateNodeOptions,
    ) => boolean | Promise<boolean>
  }

  export interface GetDragNodeOptions {
    sourceNode: Node
>>>>>>> x6/master
    targetGraph: Graph
    draggingGraph: Graph
  }

<<<<<<< HEAD
  export interface GetDropCellOptions extends GetDragCellOptions {
    draggingCell: Cell
  }

  export interface ValidateCellOptions extends GetDropCellOptions {
    droppingCell: Cell
=======
  export interface GetDropNodeOptions extends GetDragNodeOptions {
    draggingNode: Node
  }

  export interface ValidateNodeOptions extends GetDropNodeOptions {
    droppingNode: Node
>>>>>>> x6/master
  }

  export const defaults: Partial<Options> = {
    // animation: false,
<<<<<<< HEAD
    getDragCell: (sourceCell) => sourceCell.clone(),
    getDropCell: (draggingCell) => draggingCell.clone(),
=======
    getDragNode: (sourceNode) => sourceNode.clone(),
    getDropNode: (draggingNode) => draggingNode.clone(),
>>>>>>> x6/master
  }

  export const documentEvents = {
    mousemove: 'onDragging',
    touchmove: 'onDragging',
    mouseup: 'onDragEnd',
    touchend: 'onDragEnd',
    touchcancel: 'onDragEnd',
  }
}
