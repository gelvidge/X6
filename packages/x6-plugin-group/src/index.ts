import {
  Basecoat,
  ModifierKey,
  CssLoader,
  Dom,
  ObjectExt,
  Cell,
  EventArgs,
  Graph,
  Node,
} from '@antv/x6'
import { content } from './style/raw'
import './api'
import { GroupImpl } from './group'
import { Point, Angle } from '@antv/x6-geometry'
import SVGPathCommander from 'svg-path-commander'

export class Group
  extends Basecoat<GroupImpl.EventArgs>
  implements Graph.Plugin
{
  public name = 'group'

  private graph: Graph

  private groupImpl: GroupImpl

  private dcSelected: []

  private moveSelected: []

  public readonly options: Group.Options

  get disabled() {
    return this.options.enabled !== true
  }

  constructor(options: Group.Options = {}) {
    super()
    this.options = options
    CssLoader.ensure(this.name, content)
  }

  public init(graph: Graph) {
    this.graph = graph
    this.dcSelected = []
    this.moveSelected = []
    this.groupImpl = new GroupImpl({
      ...this.options,
      graph,
    })
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

  groupCells(cells: Cell[]): GroupImpl.ParentNode | null {
    const padding = 0
    const childArray: Cell[] = []
    cells.forEach((cell) => {
      if (!cell.hasParent()) {
        childArray.push(cell)
        cell.prop('groupedNode', true)
      }
    })

    if (childArray.length > 1) {
      const bbox = this.graph.model.getCellsBBox(cells)
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
      this.graph.resetSelection(parent)

      parent.prop('parentNode', true)
      return parent
    }
    return null
  }

  unGroupCells(cells: Cell[]): GroupImpl.ParentNode | null {
    const groupArray: Cell[] = []
    cells.forEach((cell) => {
      if (!cell.hasParent() && cell.prop('parentNode')) {
        groupArray.push(cell)
      }
    })

    this.graph.resetSelection(groupArray)

    groupArray.forEach((group) => {
      const children = group.getChildren()
      children?.forEach((child) => child.prop('groupedNode', false))
      this.graph.select(children)
      group.setChildren(null)
      group.remove()
    })
  }

  getRootNode(cell: Cell): GroupImpl.ParentNode | null {
    if (!cell.hasParent()) return null
    while (cell.hasParent()) {
      cell = cell.getParent()
    }
    return cell
  }

  getRootsNodes(cells: Cell[]): GroupImpl.ParentNode[] {
    const rootParentNodes: Cell[] = []
    cells.forEach((cell) => {
      if (!cell.hasParent() && cell.prop('parentNode')) {
        rootParentNodes.push(cell)
      }
    })
    return rootParentNodes
  }

  updateGroupBounds(cell: Cell) {
    const ancestors = cell.getAncestors({ deep: true })
    ancestors.forEach((ancestor) => {
      const bbox = this.graph.model.getCellsBBox(
        ancestor.getDescendants({ deep: true }),
      )
      ancestor.size(bbox.width, bbox.height)
      ancestor.position(bbox.x, bbox.y)
    })
  }

  protected startListening() {
    this.graph.on('cell:mousedown', this.onCellMouseDown, this)

    this.graph.on('node:move', this.onNodeMove, this)
    this.graph.on('node:moved', this.onNodeMoved, this)
    this.graph.on('edge:move', this.onEdgeMove, this)
    this.graph.on('edge:moved', this.onEdgeMoved, this)
    this.graph.on('cell:click', this.onCellClick, this)
    this.graph.on('cell:selected', this.onCellSelected, this)
    this.graph.on('cell:unselected', this.onCellUnselected, this)
    this.graph.on('node:rotate', this.onNodeRotate, this)
    this.graph.on('node:rotating', this.onNodeRotating, this)
    this.graph.on('node:rotated', this.onNodeRotated, this)
    this.graph.on('node:resize', this.onNodeResize, this)
    this.graph.on('node:resizing', this.onNodeResizing, this)
    this.graph.on('node:resized', this.onNodeResized, this)
  }

  protected stopListening() {
    this.graph.off('cell:mousedown', this.onCellMouseDown, this)
    this.graph.off('node:move', this.onNodeMove, this)
    this.graph.off('node:moved', this.onNodeMoved, this)
    this.graph.on('edge:move', this.onEdgeMove, this)
    this.graph.off('edge:moved', this.onEdgeMoved, this)
    this.graph.off('cell:click', this.onCellClick, this)
    this.graph.off('cell:selected', this.onCellSelected, this)
    this.graph.off('cell:unselected', this.onCellUnselected, this)
    this.graph.off('node:rotate', this.onNodeRotate, this)
    this.graph.off('node:rotating', this.onNodeRotating, this)
    this.graph.off('node:rotated', this.onNodeRotated, this)
    this.graph.off('node:resize', this.onNodeResize, this)
    this.graph.off('node:resizing', this.onNodeResizing, this)
    this.graph.off('node:resized', this.onNodeResized, this)
  }

  protected onCellMouseDown({ e, cell }: EventArgs['cell:mousedown']) {
    const parent = this.graph.getRootNode(cell)
    if (!parent) return // cells without parent managed by selection plugin (index.js)
    if (!this.graph.isSelected(parent) && e.ctrlKey) {
      this.graph.select(parent)
    } else if (!this.graph.isSelected(parent)) {
      this.graph.resetSelection(parent)
    } else this.dcSelected.push(cell)
  }

  protected onNodeMove({ node }: EventArgs['node:move']) {
    const parent = this.graph.getRootNode(node)
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
    const parent = this.graph.getRootNode(edge)
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
      console.log(children)
    }
  }

  protected onNodeMoved({ node }: EventArgs['node:moved']) {
    const parent = this.graph.getRootNode(node)
    // this.graph.clearTransformWidget(node);
    if (!parent) return
    const children = parent.getDescendants({ deep: true })
    children?.forEach((child) => this.graph.unselect(child))
    this.graph.select(parent)
    // if (this.moveSelected.includes(node)) {
    //     this.graph.select(node);
    // }
    // this.moveSelected = [];
    this.graph.updateGroupBounds(node)
  }

  protected onEdgeMoved({ edge }: EventArgs['edge:moved']) {
    const parent = this.graph.getRootNode(edge)
    if (!parent) return
    const children = parent.getDescendants({ deep: true })
    children?.forEach((child) => this.graph.unselect(child))
    this.graph.select(parent)
    // if (this.moveSelected.includes(edge)) {
    //    this.graph.select(edge);
    // }
    // this.moveSelected = [];
    this.graph.updateGroupBounds(edge)
  }

  protected onCellClick({ e, cell }: EventArgs['cell:click']) {
    const parent = this.graph.getRootNode(cell)
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

  protected onCellUnselected({ cell }: EventArgs['cell:unselected']) {
    this.dcSelected = []
    if (cell.prop('parentNode')) {
      cell.setAttrs({
        body: { visibility: 'hidden' },
      })
    }
  }

  protected onCellSelected({ cell }: EventArgs['cell:selected']) {
    if (cell.prop('parentNode')) {
      cell.setAttrs({
        body: { visibility: 'visible' },
      })
      const children = cell.getDescendants({ deep: true })
      this.graph.unselect(children)
    }
  }

  protected onNodeRotate({ node }) {
    node.prop('isRotating', true)
    const children = node.getDescendants()
    if (children?.length > 0) {
      children.forEach((child) => {
        if (child.isEdge()) {
          const source = child.getSourcePoint()
          if (source) {
            const sourcePoint = new Point(source.x, source.y)
            child.prop('edgeSourceStart', sourcePoint)
          }

          const target = child.getTargetPoint()
          if (target) {
            const targetPoint = new Point(target.x, target.y)
            child.prop('edgeTargetStart', targetPoint)
          }
        } else {
          child.prop('isRotating', true)
        }
      })
    }
  }

  protected onNodeRotating({ node }) {
    // setSelectedNodes((s) => s.map((el, index) => el)); // very slowed cause jumpy ui but required (need momosing) not needed when using Signia
    const pangle = node.getAngle()
    // state.setR(pangle);
    const pcenter = node.getBBox().getCenter()
    const children = node.getDescendants()
    if (children?.length > 0) {
      children.forEach((child) => {
        if (child.getChildren()) return
        if (child.isEdge()) {
          // console.log(child.prop('edgeSourceStart'));
          const source = child.prop('edgeSourceStart').clone()
          const target = child.prop('edgeTargetStart').clone()
          source && child.setSource(source.rotate(-pangle, pcenter))
          target && child.setTarget(target.rotate(-pangle, pcenter))
        } else if (child.isNode()) {
          const csize = child.getSize()
          const cposition = child.getPosition()
          const cangle = child.getAngle()
          const cStartAngle = child.prop('startAngle') || 0
          const ccenter = child.getBBox().getCenter()

          ccenter.rotate(cangle - pangle - cStartAngle, pcenter)
          const dx = ccenter.x - csize.width / 2 - cposition.x
          const dy = ccenter.y - csize.height / 2 - cposition.y

          child.rotate(pangle - cangle + cStartAngle, {
            center: null,
          })
          child.setPosition(cposition.x + dx, cposition.y + dy)
        }
      })
    }
  }

  protected onNodeRotated({ node }) {
    const pangle = node.getAngle()
    node.prop('startAngle', pangle, { silent: true })
    node.prop('isRotating', false)
    const children = node.getDescendants()
    if (children?.length > 0) {
      children.forEach((child) => {
        if (child.isEdge()) {
          child.prop('edgeSourceStart', null)
          child.prop('edgeTargetStart', null)
        } else {
          child.prop('isRotating', false)
          const cangle = child.getAngle()
          child.prop('startAngle', cangle - pangle, { silent: true })
        }
      })
    }
  }

  protected onNodeResize({ e, x, y, node, view }) {
    const dragPort = e.data[Object.keys(e.data)[0]].relativeDirection
    const bbox = node.getBBox()

    node.prop('startBBox', bbox)
    node.prop('isResizing', true)
    node.prop('dragPort', dragPort)
    if (node.prop('xFlipped') === undefined) {
      node.prop('xFlipped', false)
    }
    if (node.prop('yFlipped') === undefined) {
      node.prop('yFlipped', false)
    }

    const children = node.getDescendants()
    if (children?.length > 0) {
      children.forEach((child) => {
        if (child.isEdge()) {
          const source = child.getSourcePoint()
          const target = child.getTargetPoint()
          if (source) {
            const sourcePoint = new Point(source.x, source.y)
            child.prop('edgeSourceStart', sourcePoint)
          }
          if (target) {
            const targetPoint = new Point(target.x, target.y)
            child.prop('edgeTargetStart', targetPoint)
          }
        }

        child.prop('isResizing', true)
        const cbbox = child.getBBox()
        child.prop('startBBox', cbbox)
        if (child.prop('xFlipped') === undefined) {
          child.prop('xFlipped', false)
        }
        if (child.prop('yFlipped') === undefined) {
          child.prop('yFlipped', false)
        }
      })
    }
  }

  protected onNodeResizing({ e, x, y, node, view }) {
    if (node.hasParent()) {
      const parent = node.getParent()
      const bbox = graph.model.getCellsBBox(parent.getChildren())
      parent.size(bbox.width, bbox.height)
      parent.position(bbox.x, bbox.y)
    }
    const pStartBBox = node.prop('startBBox')
    // note x and y cursor positions round to grid intervals
    // setSelectedNodes((s) => s.map((el, index) => el)); // very slowed cause jumpy ui but required (need momosing) not needed when using Signia
    const pAngle = node.angle()
    const pOrigDragPort = node.prop('dragPort') // this is the original port that is being dragged
    let pCurrDragPort = pOrigDragPort

    const pBBox = node.getBBox()

    // state.setW(pBBox.width);
    // state.setH(pBBox.height);

    let cursor = new Point(x, y)
    cursor = cursor.rotate(pAngle, pStartBBox.getCenter())

    let xFlipped = node.prop('xFlipped') || false
    let yFlipped = node.prop('yFlipped') || false

    // create fixed point at top left of starting bounding box of paren
    const pFixedPoint = pStartBBox.getCenter()

    switch (pOrigDragPort) {
      case 'bottom-right':
        pFixedPoint.add(-pStartBBox.width / 2, -pStartBBox.height / 2)
        xFlipped = cursor.x < pFixedPoint.x
        yFlipped = cursor.y < pFixedPoint.y
        if (xFlipped && yFlipped) pCurrDragPort = 'top-left' // 1
        if (xFlipped && !yFlipped) pCurrDragPort = 'bottom-left' // 2
        if (!xFlipped && yFlipped) pCurrDragPort = 'top-right' // 0
        if (!xFlipped && !yFlipped) pCurrDragPort = 'bottom-right' // 3
        break
      case 'bottom':
        pFixedPoint.add(-pStartBBox.width / 2, -pStartBBox.height / 2) // top left q-3
        yFlipped = cursor.y < pFixedPoint.y
        if (yFlipped) {
          pCurrDragPort = 'top'
        }
        break
      case 'bottom-left':
        pFixedPoint.add(pStartBBox.width / 2, -pStartBBox.height / 2)
        xFlipped = cursor.x > pFixedPoint.x
        yFlipped = cursor.y < pFixedPoint.y
        if (xFlipped && yFlipped) pCurrDragPort = 'top-right' // 1
        if (xFlipped && !yFlipped) pCurrDragPort = 'bottom-right' // 2
        if (!xFlipped && yFlipped) pCurrDragPort = 'top-left' // 0
        if (!xFlipped && !yFlipped) pCurrDragPort = 'bottom-left' // 3
        break
      case 'left':
        pFixedPoint.add(pStartBBox.width / 2, pStartBBox.height / 2) // bottom-right Q-1
        xFlipped = cursor.x > pFixedPoint.x
        if (xFlipped) {
          pCurrDragPort = 'right'
        }
        break
      case 'right':
        pFixedPoint.add(-pStartBBox.width / 2, pStartBBox.height / 2) // bottom-left Q-0
        xFlipped = cursor.x < pFixedPoint.x
        if (xFlipped) {
          pCurrDragPort = 'left'
        }
        break
      case 'top-right':
        pFixedPoint.add(-pStartBBox.width / 2, pStartBBox.height / 2)
        xFlipped = cursor.x < pFixedPoint.x
        yFlipped = cursor.y > pFixedPoint.y
        if (xFlipped && yFlipped) pCurrDragPort = 'bottom-left' // 1
        if (xFlipped && !yFlipped) pCurrDragPort = 'top-left' // 2
        if (!xFlipped && yFlipped) pCurrDragPort = 'bottom-right' // 0
        if (!xFlipped && !yFlipped) pCurrDragPort = 'top-right' // 3
        break
      case 'top':
        pFixedPoint.add(-pStartBBox.width / 2, pStartBBox.height / 2) // bottom left Q-0
        yFlipped = cursor.y > pFixedPoint.y
        if (yFlipped) {
          pCurrDragPort = 'bottom'
        }
        break
      case 'top-left':
        pFixedPoint.add(pStartBBox.width / 2, pStartBBox.height / 2)
        xFlipped = cursor.x > pFixedPoint.x
        yFlipped = cursor.y > pFixedPoint.y
        if (xFlipped && yFlipped) pCurrDragPort = 'bottom-right' // 1
        if (xFlipped && !yFlipped) pCurrDragPort = 'top-right' // 2
        if (!xFlipped && yFlipped) pCurrDragPort = 'bottom-left' // 0
        if (!xFlipped && !yFlipped) pCurrDragPort = 'top-left' // 3
        break

      default:
        console.log('parent-switch - this should not be reached')
    }

    const map = {
      right: 0,
      'top-right': 0,
      top: 0,
      'top-left': 1,
      left: 1,
      'bottom-left': 2,
      bottom: 3,
      'bottom-right': 3,
    }

    const xFactor = pBBox.width / pStartBBox.width || 1
    const yFactor = pBBox.height / pStartBBox.height || 1
    const pWidth = pBBox.width
    const pHeight = pBBox.height

    // following code include to ensure that parent fixed point remains fixed when flipping shape (replicate core resizing code with grid snapping removed)
    const pFixedQuadrant = map[pCurrDragPort]
    const pImageFixedPoint = pFixedPoint
      .clone()
      .rotate(-pAngle, pStartBBox.getCenter())
    const radius = Math.sqrt(pWidth * pWidth + pHeight * pHeight) / 2
    let alpha = (pFixedQuadrant * Math.PI) / 2 // moving anticlockwise to start of quadrant;  pi radians =180 degrees
    alpha += Math.atan(
      pFixedQuadrant % 2 === 0 ? pHeight / pWidth : pWidth / pHeight,
    ) // add on angle in radians
    alpha -= Angle.toRad(pAngle)
    const center = Point.fromPolar(radius, alpha, pImageFixedPoint)

    const origin = center.clone().translate(pWidth / -2, pHeight / -2)
    node.setPosition(origin.x, origin.y)

    if (xFlipped && node.prop('xFlipped') !== true) {
      const path = node.getAttrByPath('body/refD')
      if (path) {
        // only works for path elements - need to look at converting svg shapes into paths potentially????***
        const flippedPathStringX = new SVGPathCommander(path).flipX().toString()
        node.setAttrByPath('body/refD', flippedPathStringX)
      }
    } else if (!xFlipped && node.prop('xFlipped') !== false) {
      const path = node.getAttrByPath('body/refD')
      if (path) {
        const flippedPathStringX = new SVGPathCommander(path).flipX().toString()
        node.setAttrByPath('body/refD', flippedPathStringX)
      }
    }

    if (yFlipped && node.prop('yFlipped') !== true) {
      const path = node.getAttrByPath('body/refD')
      if (path) {
        const flippedPathStringY = new SVGPathCommander(path).flipY().toString()
        node.setAttrByPath('body/refD', flippedPathStringY)
      }
    } else if (!yFlipped && node.prop('yFlipped') !== false) {
      const path = node.getAttrByPath('body/refD')
      if (path) {
        const flippedPathStringY = new SVGPathCommander(path).flipY().toString()
        node.setAttrByPath('body/refD', flippedPathStringY)
      }
    }

    node.prop('xFlipped', xFlipped)
    node.prop('yFlipped', yFlipped)

    const children = node.getDescendants()

    if (children?.length > 0) {
      children.forEach((child) => {
        if (child.isEdge()) {
          const sSourcenode = child.prop('edgeSourceStart')
          const sTargetnode = child.prop('edgeTargetStart')

          const xSourceDistance =
            (pStartBBox.x + pStartBBox.width - sSourcenode.x) * xFactor
          const ySourceDistance =
            (pStartBBox.y + pStartBBox.height - sSourcenode.y) * yFactor

          const xTargetDistance =
            (pStartBBox.x + pStartBBox.width - sTargetnode.x) * xFactor
          const yTargetDistance =
            (pStartBBox.y + pStartBBox.height - sTargetnode.y) * yFactor

          let xRef = xFlipped ? pBBox.x : pBBox.x + pBBox.width
          let yRef = yFlipped ? pBBox.y : pBBox.y + pBBox.height

          let xSource = xFlipped
            ? xRef + xSourceDistance
            : xRef - xSourceDistance
          let ySource = yFlipped
            ? yRef + ySourceDistance
            : yRef - ySourceDistance

          let xTarget = xFlipped
            ? xRef + xTargetDistance
            : xRef - xTargetDistance
          let yTarget = yFlipped
            ? yRef + yTargetDistance
            : yRef - yTargetDistance

          child.setSource({
            x: xSource,
            y: ySource,
          })

          child.setTarget({
            x: xTarget,
            y: yTarget,
          })

          child.prop('xFlipped', xFlipped)
          child.prop('yFlipped', yFlipped)
        } else {
          const cAngle = Angle.normalize(child.angle() || 0)

          const cStartBBox = child.prop('startBBox')
          const { x: cx, y: cy, width, height } = cStartBBox

          const fixedQuadrantOffset = Math.floor((cAngle - pAngle + 45) / 90) // new

          let newWidth
          let newHeight

          let newKeyIndex =
            Object.keys(map).indexOf(pCurrDragPort) + fixedQuadrantOffset * 2

          if (newKeyIndex > 7) newKeyIndex -= 8

          let cFixedQuadrant = Object.values(map)[newKeyIndex]
          const cCurrDragPort = Object.keys(map)[newKeyIndex] // new

          const cFixedPoint = cStartBBox.getCenter()

          let origKeyIndex =
            Object.keys(map).indexOf(pOrigDragPort) + fixedQuadrantOffset * 2

          if (origKeyIndex > 7) origKeyIndex -= 8

          const cOrigDragPort = Object.keys(map)[origKeyIndex] // new

          if (fixedQuadrantOffset % 2 === 0) {
            newWidth = width * xFactor
            newHeight = height * yFactor
          } else {
            newWidth = width * yFactor
            newHeight = height * xFactor
          }

          switch (cOrigDragPort) {
            case 'bottom-right':
              cFixedPoint.add(-cStartBBox.width / 2, -cStartBBox.height / 2)
              break
            case 'bottom':
              cFixedPoint.add(-cStartBBox.width / 2, -cStartBBox.height / 2)
              break
            case 'bottom-left':
              cFixedPoint.add(cStartBBox.width / 2, -cStartBBox.height / 2)
              break
            case 'left':
              cFixedPoint.add(cStartBBox.width / 2, cStartBBox.height / 2) // bottom-right Q-1
              break
            case 'right':
              // bottom-left Q-0
              cFixedPoint.add(-cStartBBox.width / 2, cStartBBox.height / 2)
              break
            case 'top-right':
              cFixedPoint.add(-cStartBBox.width / 2, cStartBBox.height / 2)
              break
            case 'top':
              cFixedPoint.add(-cStartBBox.width / 2, cStartBBox.height / 2) // bottom left Q-0
              break
            case 'top-left':
              cFixedPoint.add(cStartBBox.width / 2, cStartBBox.height / 2)
              break
            default:
              console.log(
                `child port:${cOrigDragPort} -this should not be reached`,
              )
          }

          cFixedQuadrant = map[cCurrDragPort]
          const cImageFixedPoint = cFixedPoint
            .clone()
            .rotate(-cAngle, cStartBBox.getCenter())

          const radius =
            Math.sqrt(newWidth * newWidth + newHeight * newHeight) / 2
          let alpha = (cFixedQuadrant * Math.PI) / 2
          alpha += Math.atan(
            cFixedQuadrant % 2 === 0
              ? newHeight / newWidth
              : newWidth / newHeight,
          )
          alpha -= Angle.toRad(cAngle)

          const cFixedPointParent = cImageFixedPoint
            .clone()
            .rotate(pAngle, pStartBBox.getCenter())

          let xOffset =
            (cFixedPointParent.x - pFixedPoint.x) * xFactor -
            (cFixedPointParent.x - pFixedPoint.x)

          if (xFlipped) {
            xOffset =
              pFixedPoint.x -
              cFixedPointParent.x +
              (pFixedPoint.x - cFixedPointParent.x) * xFactor
          }

          let yOffset =
            (cFixedPointParent.y - pFixedPoint.y) * yFactor -
            (cFixedPointParent.y - pFixedPoint.y)

          if (yFlipped) {
            yOffset =
              pFixedPoint.y -
              cFixedPointParent.y +
              (pFixedPoint.y - cFixedPointParent.y) * yFactor
          }

          // convert individual X Y offsets in a total offset (hypot) and determine angle
          let offsetAngle = Math.atan(yOffset / xOffset) || 0
          xOffset < 0 && (offsetAngle += Math.PI)

          offsetAngle += Angle.toRad(pAngle)

          const tOffset = Math.sqrt(xOffset * xOffset + yOffset * yOffset)
          const xOffsetTrans = Math.cos(offsetAngle) * tOffset
          const yOffsetTrans = Math.sin(offsetAngle) * tOffset

          // translate shape from cImageFixedPoint
          const translatedcFixedPoint = cImageFixedPoint
            .clone()
            .add(xOffsetTrans, yOffsetTrans)

          child.size(newWidth, newHeight)
          const cCenter = Point.fromPolar(radius, alpha, translatedcFixedPoint)
          const cOrigin = cCenter
            .clone()
            .translate(newWidth / -2, newHeight / -2)
          child.position(cOrigin.x, cOrigin.y)

          if (xFlipped && child.prop('xFlipped') !== true) {
            const path = child.getAttrByPath('body/refD')

            if (path) {
              const flippedPathStringX = new SVGPathCommander(path)
                .flipX()
                .toString()
              child.setAttrByPath('body/refD', flippedPathStringX)
            }
          } else if (!xFlipped && child.prop('xFlipped') !== false) {
            const path = child.getAttrByPath('body/refD')
            if (path) {
              const flippedPathStringX = new SVGPathCommander(path)
                .flipX()
                .toString()
              child.setAttrByPath('body/refD', flippedPathStringX)
            }
          }

          if (yFlipped && child.prop('yFlipped') !== true) {
            const path = child.getAttrByPath('body/refD')
            if (path) {
              const flippedPathStringY = new SVGPathCommander(path)
                .flipY()
                .toString()
              child.setAttrByPath('body/refD', flippedPathStringY)
            }
          } else if (!yFlipped && child.prop('yFlipped') !== false) {
            const path = child.getAttrByPath('body/refD')
            if (path) {
              const flippedPathStringY = new SVGPathCommander(path)
                .flipY()
                .toString()
              child.setAttrByPath('body/refD', flippedPathStringY)
            }
          }

          child.prop('xFlipped', xFlipped)
          child.prop('yFlipped', yFlipped)
        }
      })
    }
  }

  protected onNodeResized({ e, x, y, node, view }) {
    node.prop('isResizing', false)
    node.removeProp(['startBBox'])
    node.removeProp(['dragPort'])

    const children = node.getDescendants()
    if (children?.length > 0) {
      children.forEach((child) => {
        child.prop('isResizing', false)
        child.removeProp('startBBox')
        child.removeProp('dragPort')
      })
    }
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
    const array = []
    cells.forEach((cell) => {
      if (cell.prop('parentNode')) array.push(cell)
    })
    return array
  }

  @Basecoat.dispose()
  dispose() {
    this.stopListening()
    this.off()
    CssLoader.clean(this.name)
  }
}

export namespace Group {
  export type EventArgs = GroupImpl.EventArgs
  export interface Options extends GroupImpl.CommonOptions {
    enabled?: boolean
  }
}
