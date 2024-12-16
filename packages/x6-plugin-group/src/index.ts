import { Basecoat, CssLoader, Graph, Cell, Node } from '@antv/x6'
import { Point, Angle } from '@antv/x6-geometry'
import SVGPathCommander from 'svg-path-commander'
import { EventArgs } from '@antv/x6-common/lib/event/types'
import { content } from './style/raw'
import './api'
import { GroupImpl } from './group'

export class Group
  extends Basecoat<GroupImpl.EventArgs>
  implements Graph.Plugin
{
  public name = 'group'

  private graph: Graph

  // private groupImpl: GroupImpl

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
    // this.groupImpl = new GroupImpl({
    //    ...this.options,
    //    graph,
    //  })
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

  protected startListening() {
    this.graph.on('node:rotate', this.onNodeRotate, this)
    this.graph.on('node:rotating', this.onNodeRotating, this)
    this.graph.on('node:rotated', this.onNodeRotated, this)
    this.graph.on('node:resize', this.onNodeResize, this)
    this.graph.on('node:resizing', this.onNodeResizing, this)
    this.graph.on('node:resized', this.onNodeResized, this)
  }

  protected stopListening() {
    this.graph.off('node:rotate', this.onNodeRotate, this)
    this.graph.off('node:rotating', this.onNodeRotating, this)
    this.graph.off('node:rotated', this.onNodeRotated, this)
    this.graph.off('node:resize', this.onNodeResize, this)
    this.graph.off('node:resizing', this.onNodeResizing, this)
    this.graph.off('node:resized', this.onNodeResized, this)
  }

  protected onNodeRotate({ node }: { node: Node }) {
    node.prop('isRotating', true)
    const children = node.getDescendants()
    if (children?.length > 0) {
      children.forEach((child: Cell) => {
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

  protected onNodeRotating({ node }: { node: Node }) {
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

  protected onNodeRotated({ node }: { node: Node }) {
    const pangle = node.getAngle()
    node.prop('startAngle', pangle, { silent: true })
    node.prop('isRotating', false)
    const children = node.getDescendants()
    if (children?.length > 0) {
      children.forEach((child) => {
        if (child.isEdge()) {
          child.prop('edgeSourceStart', null)
          child.prop('edgeTargetStart', null)
        } else if (child.isNode()) {
          child.prop('isRotating', false)
          const cangle = (child as Node).getAngle()
          child.prop('startAngle', cangle - pangle, { silent: true })
        }
      })
    }
  }

  protected onNodeResize({ e, node }: { e: EventArgs; node: Node }) {
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

  protected onNodeResizing({
    x,
    y,
    node,
  }: {
    x: number
    y: number
    node: Node
  }) {
    if (node.hasParent()) {
      const parent = node.getParent()
      const children = parent?.getChildren()
      const bbox = parent && children && this.graph.model.getCellsBBox(children)
      parent &&
        this.graph.isNode(parent) &&
        bbox &&
        parent.size(bbox.width, bbox.height)
      parent &&
        this.graph.isNode(parent) &&
        bbox &&
        parent.position(bbox.x, bbox.y)
    }
    const pStartBBox = node.prop('startBBox')
    // note x and y cursor positions round to grid intervals
    // setSelectedNodes((s) => s.map((el, index) => el)); // very slowed cause jumpy ui but required (need momosing) not needed when using Signia
    const pAngle = node.angle()
    const pOrigDragPort = node.prop('dragPort') // this is the original port that is being dragged
    let pCurrDragPort:
      | 'right'
      | 'left'
      | 'bottom'
      | 'top'
      | 'bottom-left'
      | 'bottom-right'
      | 'top-left'
      | 'top-right' = pOrigDragPort

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
        const flippedPathStringX = new SVGPathCommander(path as string)
          .flipX()
          .toString()
        node.setAttrByPath('body/refD', flippedPathStringX)
      }
    } else if (!xFlipped && node.prop('xFlipped') !== false) {
      const path = node.getAttrByPath('body/refD')
      if (path) {
        const flippedPathStringX = new SVGPathCommander(path as string)
          .flipX()
          .toString()
        node.setAttrByPath('body/refD', flippedPathStringX)
      }
    }

    if (yFlipped && node.prop('yFlipped') !== true) {
      const path = node.getAttrByPath('body/refD')
      if (path) {
        const flippedPathStringY = new SVGPathCommander(path as string)
          .flipY()
          .toString()
        node.setAttrByPath('body/refD', flippedPathStringY)
      }
    } else if (!yFlipped && node.prop('yFlipped') !== false) {
      const path = node.getAttrByPath('body/refD')
      if (path) {
        const flippedPathStringY = new SVGPathCommander(path as string)
          .flipY()
          .toString()
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

          const xRef = xFlipped ? pBBox.x : pBBox.x + pBBox.width
          const yRef = yFlipped ? pBBox.y : pBBox.y + pBBox.height

          const xSource = xFlipped
            ? xRef + xSourceDistance
            : xRef - xSourceDistance
          const ySource = yFlipped
            ? yRef + ySourceDistance
            : yRef - ySourceDistance

          const xTarget = xFlipped
            ? xRef + xTargetDistance
            : xRef - xTargetDistance
          const yTarget = yFlipped
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
        } else if (child.isNode()) {
          const cAngle = Angle.normalize(child.angle() || 0)

          const cStartBBox = child.prop('startBBox')
          const { width, height } = cStartBBox

          const fixedQuadrantOffset = Math.floor((cAngle - pAngle + 45) / 90) // new

          let newWidth
          let newHeight

          let newKeyIndex =
            Object.keys(map).indexOf(pCurrDragPort) + fixedQuadrantOffset * 2

          if (newKeyIndex > 7) newKeyIndex -= 8

          let cFixedQuadrant = Object.values(map)[newKeyIndex]
          const cCurrDragPort = (Object.keys(map) as Array<keyof typeof map>)[
            newKeyIndex
          ] // new
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

          this.graph.isNode(child) && child.size(newWidth, newHeight)
          const cCenter = Point.fromPolar(radius, alpha, translatedcFixedPoint)
          const cOrigin = cCenter
            .clone()
            .translate(newWidth / -2, newHeight / -2)
          this.graph.isNode(child) && child.position(cOrigin.x, cOrigin.y)

          if (xFlipped && child.prop('xFlipped') !== true) {
            const path = child.getAttrByPath('body/refD')

            if (path) {
              const flippedPathStringX = new SVGPathCommander(path as string)
                .flipX()
                .toString()
              child.setAttrByPath('body/refD', flippedPathStringX)
            }
          } else if (!xFlipped && child.prop('xFlipped') !== false) {
            const path = child.getAttrByPath('body/refD')
            if (path) {
              const flippedPathStringX = new SVGPathCommander(path as string)
                .flipX()
                .toString()
              child.setAttrByPath('body/refD', flippedPathStringX)
            }
          }

          if (yFlipped && child.prop('yFlipped') !== true) {
            const path = child.getAttrByPath('body/refD')
            if (path) {
              const flippedPathStringY = new SVGPathCommander(path as string)
                .flipY()
                .toString()
              child.setAttrByPath('body/refD', flippedPathStringY)
            }
          } else if (!yFlipped && child.prop('yFlipped') !== false) {
            const path = child.getAttrByPath('body/refD')
            if (path) {
              const flippedPathStringY = new SVGPathCommander(path as string)
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

  protected onNodeResized({ node }: { node: Node }) {
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
