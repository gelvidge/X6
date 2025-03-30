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
    // node.prop('isRotating', true)
    const pangle = node.getAngle()

    node.prop('startAngle', pangle, { silent: true })
    //! node.prop('startAngle') && node.prop('startAngle', 0)
    const children = node.getDescendants()
    if (children?.length > 0) {
      children.forEach((child: Cell) => {
        if (child.isEdge()) {
          const source = child.getSourceCell() ? null : child.getSourcePoint()
          if (source) {
            const sourcePoint = new Point(source.x, source.y)
            child.prop('edgeSourceStart', sourcePoint)
          }

          const target = child.getTargetCell() ? null : child.getTargetPoint()
          if (target) {
            const targetPoint = new Point(target.x, target.y)
            child.prop('edgeTargetStart', targetPoint)
          }
        } else if (child.isNode()) {
          const cangle = (child as Node).getAngle()
          child.prop('startAngle', cangle - pangle, { silent: true })
          //    child.prop('isRotating', true)
          const cbbox = child.getBBox()
          child.prop('startBBox', cbbox)
        }
      })
    }
  }

  protected onNodeRotating(params: any) {
    const pangle = params.node.getAngle()
    const startAngle = params.node.prop('startAngle')
    const pcenter = params.node.getBBox().getCenter()
    const children = params.node.getDescendants()
    if (children?.length > 0) {
      children.forEach((child: Cell) => {
        // if (child.getChildren()) return
        // const childView = this.graph.findViewByCell(child.id)
        if (child.isEdge()) {
          const source = child.prop('edgeSourceStart')?.clone() || null
          const target = child.prop('edgeTargetStart')?.clone() || null
          source &&
            child.setSource(
              source.rotate(-(pangle - startAngle), pcenter),
              undefined,
              {
                async: false,
              },
            )
          target &&
            child.setTarget(
              target.rotate(-(pangle - startAngle), pcenter),
              undefined,
              {
                async: false,
              },
            )
        } else if (child.isNode()) {
          const csize = child.getSize()
          const cposition = child.getPosition()
          const cangle = child.getAngle()
          const cStartAngle = child.prop('startAngle') || 0
          const ccenter = child.prop('startBBox').getCenter()

          ccenter.rotate(-(pangle - startAngle), pcenter)
          const dx = ccenter.x - csize.width / 2 - cposition.x
          const dy = ccenter.y - csize.height / 2 - cposition.y
          child.setPosition(cposition.x + dx, cposition.y + dy, {
            silent: true,
          })
          child.rotate(pangle - cangle + cStartAngle, {
            center: null,
          })
        }
      })
    }
  }

  protected onNodeRotated({ node }: { node: Node }) {
    // const pangle = node.getAngle()
    // node.prop('startAngle', pangle, { silent: true })
    // node.prop('isRotating', false)

    const children = node.getDescendants()

    if (children?.length > 0) {
      children.forEach((child) => {
        //   if (child.getChildren()) return
        if (child.isEdge()) {
          child.removeProp('edgeSourceStart')
          child.removeProp('edgeTargetStart')
        } else if (child.isNode()) {
          // child.prop('isRotating', false)
          // const cangle = (child as Node).getAngle()
          // child.prop('startAngle', cangle - pangle, { silent: true })
          child.removeProp('startAngle')
          child.removeProp('startBBox')
        }
      })
    }
    // node.prop('startAngle', pangle, { silent: true })
    // node.prop('isRotating', false)
    node.removeProp('startBBox')
  }

  protected onNodeResize({ e, node }: { e: EventArgs; node: Node }) {
    const dragPort = e.data[Object.keys(e.data)[0]].relativeDirection
    const bbox = node.getBBox()

    node.prop('startBBox', bbox)
    //  node.prop('isResizing', true)
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
          const source = child.getSourceCell() ? null : child.getSourcePoint()
          if (source) {
            const sourcePoint = new Point(source.x, source.y)
            child.prop('edgeSourceStart', sourcePoint)
          }

          const target = child.getTargetCell() ? null : child.getTargetPoint()
          if (target) {
            const targetPoint = new Point(target.x, target.y)
            child.prop('edgeTargetStart', targetPoint)
          }
        }

        //  child.prop('isResizing', true)
        const cbbox = child.getBBox()
        child.prop('startBBox', cbbox)
        if (child.prop('xFlipped') === undefined) {
          child.prop('xFlipped', false)
        }
        if (child.prop('yFlipped') === undefined) {
          child.prop('yFlipped', false)
        }
        // const mat = Dom.createSVGMatrix({
        //   a: 2,
        //   b: 0,
        //   c: 0,
        //   d: 2,
        //   e: 10,
        //   f: 10,
        // })

        // node.setMatrix(mat)
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
    // This is a rectangle in size of the un-rotated node.
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
    let cursor = new Point(x, y)
    cursor = cursor.rotate(pAngle, pStartBBox.getCenter())

    let xFlipped = node.prop('xFlipped') || false
    let yFlipped = node.prop('yFlipped') || false

    // Create fixed point at top left of starting bounding box of parent. Pick the corner point on the node, which meant to stay on its
    // place before and after the resize.
    // following code include to ensure that parent fixed point remains fixed when flipping shape (replicate core resizing code with grid snapping removed)

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
        if (xFlipped && yFlipped) pCurrDragPort = 'bottom-right' // 3
        if (xFlipped && !yFlipped) pCurrDragPort = 'top-right' // 3
        if (!xFlipped && yFlipped) pCurrDragPort = 'bottom-left' // 2
        if (!xFlipped && !yFlipped) pCurrDragPort = 'top-left' // 1
        break

      default:
    }

    const xFactor = pBBox.width / pStartBBox.width || 1
    const yFactor = pBBox.height / pStartBBox.height || 1
    const pWidth = pBBox.width
    const pHeight = pBBox.height

    // Find an image of the previous indent point. This is the position,
    // where is the point actually located on the screen.

    const pImageFixedPoint = pFixedPoint
      .clone()
      .rotate(-pAngle, pStartBBox.getCenter())

    // Every point on the element rotates around a circle with the centre of
    // rotation in the middle of the element while the whole element is being
    // rotated. That means that the distance from a point in the corner of
    // the element (supposed its always rect) to the center of the element
    // doesn't change during the rotation and therefore it equals to a
    // distance on un-rotated element.
    // We can find the distance as DISTANCE = (ELEMENTWIDTH/2)^2 + (ELEMENTHEIGHT/2)^2)^0.5.
    const radius = Math.sqrt(pWidth * pWidth + pHeight * pHeight) / 2

    // Now we are looking for an angle between x-axis and the line starting
    // at image of fixed point and ending at the center of the element.
    // We call this angle `alpha`.

    // The image of a fixed point is located in n-th quadrant. For each
    // quadrant passed going anti-clockwise we have to add 90 degrees.
    // Note that the first quadrant has index 0.
    //
    // 3 | 2
    // --c-- Quadrant positions around the element's center `c`
    // 0 | 1
    //
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
    const pFixedQuadrant = map[pCurrDragPort]
    let alpha = (pFixedQuadrant * Math.PI) / 2 // moving anticlockwise to start of quadrant;  pi radians =180 degrees

    // Add an angle between the beginning of the current quadrant (line
    // parallel with x-axis or y-axis going through the center of the
    // element) and line crossing the indent of the fixed point and the
    // center of the element. This is the angle we need but on the
    // un-rotated element.
    alpha += Math.atan(
      pFixedQuadrant % 2 === 0 ? pHeight / pWidth : pWidth / pHeight,
    ) // add on angle in radians
    // Lastly we have to deduct the original angle the element was rotated
    // by and that's it.
    alpha -= Angle.toRad(pAngle)
    // With this angle and distance we can easily calculate the centre of
    // the un-rotated element.
    // Note that fromPolar constructor accepts an angle in radians.
    const center = Point.fromPolar(radius, alpha, pImageFixedPoint)
    // The top left corner on the un-rotated element has to be half a width
    // on the left and half a height to the top from the center. This will
    // be the origin of rectangle we were looking for.
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
        const cAngle = child.isNode() ? Angle.normalize(child.angle()) : 0
        const cStartBBox = child.prop('startBBox')
        const cFixedPoint = cStartBBox.getCenter()
        const { width, height } = cStartBBox

        const fixedQuadrantOffset = Math.floor((cAngle - pAngle + 45) / 90) // new

        let newKeyIndex =
          Object.keys(map).indexOf(pCurrDragPort) + fixedQuadrantOffset

        if (newKeyIndex > 3) newKeyIndex -= 4
        else if (newKeyIndex < 0) newKeyIndex += 4

        let cFixedQuadrant = Object.values(map)[newKeyIndex]
        const cCurrDragPort = (Object.keys(map) as Array<keyof typeof map>)[
          newKeyIndex
        ]

        let origKeyIndex =
          Object.keys(map).indexOf(pOrigDragPort) + fixedQuadrantOffset

        if (origKeyIndex > 3) origKeyIndex -= 4
        else if (origKeyIndex < 0) origKeyIndex += 4

        const cOrigDragPort = Object.keys(map)[origKeyIndex]

        //* ************************************ */
        let newWidth = 0
        let newHeight = 0

        if (child.isNode()) {
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
              cFixedPoint.add(cStartBBox.width / 2, cStartBBox.height / 2)
              break
            case 'right':
              cFixedPoint.add(-cStartBBox.width / 2, cStartBBox.height / 2)
              break
            case 'top-right':
              cFixedPoint.add(-cStartBBox.width / 2, cStartBBox.height / 2)
              break
            case 'top':
              cFixedPoint.add(-cStartBBox.width / 2, cStartBBox.height / 2)
              break
            case 'top-left':
              cFixedPoint.add(cStartBBox.width / 2, cStartBBox.height / 2)
              break
            default:
          }
        }
        //* ************************** */

        const getTranslatedPoint = function (cFPoint: Point) {
          let cImageFixedPoint
          if (child.isNode()) {
            cImageFixedPoint = cFPoint
              .clone()
              .rotate(-cAngle, cStartBBox.getCenter())
          } else {
            cImageFixedPoint = cFPoint
          }

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

          cFixedQuadrant = map[cCurrDragPort]

          // convert individual X Y offsets in a total offset (hypot) and determine angle
          let offsetAngle = Math.atan(yOffset / xOffset) || 0
          xOffset < 0 && (offsetAngle += Math.PI)

          offsetAngle += Angle.toRad(pAngle)

          const tOffset = Math.sqrt(xOffset * xOffset + yOffset * yOffset)
          const xOffsetTrans = Math.cos(offsetAngle) * tOffset
          const yOffsetTrans = Math.sin(offsetAngle) * tOffset

          // translate shape from cImageFixedPoint
          return cImageFixedPoint.clone().add(xOffsetTrans, yOffsetTrans)
        }

        const sSourcenode = child.prop('edgeSourceStart') || null
        const sTargetnode = child.prop('edgeTargetStart') || null

        const cFixedSourcePoint =
          new Point(sSourcenode?.x, sSourcenode?.y) || null
        const cFixedTargetPoint =
          new Point(sTargetnode?.x, sTargetnode?.y) || null

        sSourcenode &&
          child.isEdge() &&
          child.setSource(getTranslatedPoint(cFixedSourcePoint), undefined, {
            async: false,
          })
        sTargetnode &&
          child.isEdge() &&
          child.setTarget(getTranslatedPoint(cFixedTargetPoint), undefined, {
            async: false,
          })

        let cCenter = new Point(0, 0)
        let cOrigin = new Point(0, 0)

        //* ***************************************************************** */
        if (child.isNode()) {
          const radius =
            Math.sqrt(newWidth * newWidth + newHeight * newHeight) / 2
          let alpha = (cFixedQuadrant * Math.PI) / 2
          alpha += Math.atan(
            cFixedQuadrant % 2 === 0
              ? newHeight / newWidth
              : newWidth / newHeight,
          )
          alpha -= Angle.toRad(cAngle)

          const translatedcFixedPoint = getTranslatedPoint(cFixedPoint)
          child.size(newWidth, newHeight)
          cCenter = Point.fromPolar(radius, alpha, translatedcFixedPoint)
          cOrigin = cCenter.clone().translate(newWidth / -2, newHeight / -2)
          child.position(cOrigin.x, cOrigin.y)

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
        //* ***************************************************************** */
      })
    }
  }

  protected onNodeResized({ node }: { node: Node }) {
    // node.prop('isResizing', false)
    node.removeProp(['startBBox'])
    node.removeProp(['dragPort'])
    node.removeProp('xFlipped')
    node.removeProp('yFlipped')

    const children = node.getDescendants()
    if (children?.length > 0) {
      children.forEach((child) => {
        // child.prop('isResizing', false)
        child.removeProp('startBBox')
        child.removeProp('dragPort')
        child.removeProp('xFlipped')
        child.removeProp('yFlipped')
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
