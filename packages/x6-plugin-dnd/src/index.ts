import {
  GeometryUtil,
  Rectangle,
  Point,
  FunctionExt,
  Dom,
  CssLoader,
  Cell,
  Node,
  Edge,
  View,
  CellView,
  Graph,
  EventArgs,
} from '@antv/x6'
import { content } from './style/raw'

export class Dnd extends View implements Graph.Plugin {
  public name = 'dnd'

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
    const { target } = this.options
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

  start(cell: Cell, evt: Dom.MouseDownEvent | MouseEvent) {
    const e = evt as Dom.MouseDownEvent

    e.preventDefault()

    this.targetModel.startBatch('dnd')
    Dom.addClass(this.container, 'dragging')
    Dom.appendTo(
      this.container,
      this.options.draggingContainer || document.body,
    )

    this.sourceCell = cell
    this.prepareDragging(cell, e.clientX, e.clientY)

    const local = this.updateCellPosition(e.clientX, e.clientY)

    if (false) {
      // this.isSnaplineEnabled()) {
      this.snapline.captureCursorOffset({
        e,
        cell,
        cell,
        view: this.draggingView!,
        x: local.x,
        y: local.y,
      })
      this.draggingCell!.on('change:position', this.snap, this)
    }

    this.delegateDocumentEvents(Dnd.documentEvents, e.data)
  }

  protected isSnaplineEnabled() {
    return this.snapline && this.snapline.isEnabled()
  }

  protected prepareDragging(
    sourceCell: Cell,
    clientX: number,
    clientY: number,
  ) {
    const { draggingGraph } = this
    const draggingModel = draggingGraph.model
    const draggingCell = this.options.getDragCell(sourceCell, {
      sourceCell,
      draggingGraph,
      targetGraph: this.targetGraph,
    })

    draggingCell.isNode() && draggingCell.position(0, 0)

    draggingCell.isEdge() && draggingCell.setSource(sourceCell.getSource())
    draggingCell.isEdge() && draggingCell.setTarget(sourceCell.getTarget())
    draggingCell.isEdge() && draggingCell.setAttrs(sourceCell.attrs)

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

    draggingModel.resetCells([draggingCell])

    const delegateView = draggingGraph.findViewByCell(draggingCell) as CellView
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
    const local = this.targetGraph.clientToLocal(x, y)
    const bbox = this.draggingBBox!
    local.x -= bbox.width / 2
    local.y -= bbox.height / 2
    this.draggingCell?.isNode() && this.draggingCell!.position(local.x, local.y)
    this.draggingCell?.isEdge() &&
      this.draggingCell!.setSource({ x: local.x, y: local.y })
    this.draggingCell?.isEdge() &&
      this.draggingCell!.setTarget({ x: local.x, y: local.y })
    return local
  }

  protected snap({
    cell,
    current,
    options,
  }: Cell.EventArgs['change:position']) {
    if (options.snapped) {
      const bbox = this.draggingBBox
      cell.isNode() &&
        cell.position(bbox.x + options.tx, bbox.y + options.ty, {
          silent: true,
        })
      this.draggingView!.isNodeView() && this.draggingView!.translate()
      cell.isNode() && cell.position(current!.x, current!.y, { silent: true })

      this.snapOffset = {
        x: options.tx,
        y: options.ty,
      }
    } else {
      this.snapOffset = null
    }
  }

  protected onDragging(evt: Dom.MouseMoveEvent) {
    const { draggingView } = this
    if (draggingView) {
      evt.preventDefault()
      const e = this.normalizeEvent(evt)
      const { clientX } = e
      const { clientY } = e

      this.updateGraphPosition(clientX, clientY)
      const local = this.updateCellPosition(clientX, clientY)
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
          draggingView.isNodeView() && draggingView.processEmbedding(e, data)
        } else {
          draggingView.isNodeView() && draggingView.clearEmbedding(data)
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
          } as EventArgs['cell:mousemove'])
        } else {
          this.snapline.hide()
        }
      }
    }
  }

  protected onDragEnd(evt: Dom.MouseUpEvent) {
    const { draggingCell } = this
    if (draggingCell) {
      const e = this.normalizeEvent(evt)
      const { draggingView } = this
      const { draggingBBox } = this
      const { snapOffset } = this
      let { x } = draggingBBox
      let { y } = draggingBBox

      if (snapOffset) {
        x += snapOffset.x
        y += snapOffset.y
      }

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
    if (this.draggingCell) {
      this.sourceCell = null
      this.draggingCell.remove()
      this.draggingCell = null
      this.draggingView = null
      this.delta = null
      this.padding = null
      this.snapOffset = null
      this.originOffset = null
      this.undelegateDocumentEvents()
    }
  }

  protected onDropped(draggingCell: Cell) {
    if (this.draggingCell === draggingCell) {
      this.clearDragging()
      Dom.removeClass(this.container, 'dragging')
      Dom.remove(this.container)
    }
  }

  protected onDropInvalid() {
    const { draggingCell } = this
    if (draggingCell) {
      this.onDropped(draggingCell)
      // todo
      // const anim = this.options.animation
      // if (anim) {
      //   const duration = (typeof anim === 'object' && anim.duration) || 150
      //   const easing = (typeof anim === 'object' && anim.easing) || 'swing'

      //   this.draggingView = null

      //   this.$container.animate(this.originOffset!, duration, easing, () =>
      //     this.onDropped(draggingCell),
      //   )
      // } else {
      //   this.onDropped(draggingCell)
      // }
    }
  }

  protected isInsideValidArea(p: Point.PointLike) {
    let targetRect: Rectangle
    let dndRect: Rectangle | null = null
    const { targetGraph } = this
    const { targetScroller } = this

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
      local.x += bbox.x - bbox.width / 2
      local.y += bbox.y - bbox.height / 2
      const gridSize = this.snapOffset ? 1 : targetGraph.getGridSize()

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
            targetGraph,
            draggingGraph: this.draggingGraph,
          })
        : true

      if (typeof ret === 'boolean') {
        if (ret) {
          targetModel.addCell(droppingCell, { stencil: this.cid })
          return droppingCell
        }
        return null
      }

      return FunctionExt.toDeferredBoolean(ret).then((valid) => {
        if (valid) {
          targetModel.addCell(droppingCell, { stencil: this.cid })
          return droppingCell
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
     * Should scale the dragging cell or not.
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
    getDragCell: (sourceCell: Cell, options: GetDragCellOptions) => Cell
    getDropCell: (draggingCell: Cell, options: GetDropCellOptions) => Cell
    validateCell?: (
      droppingCell: Cell,
      options: ValidateCellOptions,
    ) => boolean | Promise<boolean>
  }

  export interface GetDragCellOptions {
    sourceCell: Cell
    targetGraph: Graph
    draggingGraph: Graph
  }

  export interface GetDropCellOptions extends GetDragCellOptions {
    draggingCell: Cell
  }

  export interface ValidateCellOptions extends GetDropCellOptions {
    droppingCell: Cell
  }

  export const defaults: Partial<Options> = {
    // animation: false,
    getDragCell: (sourceCell) => sourceCell.clone(),
    getDropCell: (draggingCell) => draggingCell.clone(),
  }

  export const documentEvents = {
    mousemove: 'onDragging',
    touchmove: 'onDragging',
    mouseup: 'onDragEnd',
    touchend: 'onDragEnd',
    touchcancel: 'onDragEnd',
  }
}
