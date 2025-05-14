import { Basecoat, CssLoader, Graph, View } from '@antv/x6'
import './api'
import Ruler from '@scena/ruler'
import { content } from './style/raw'

export class X6Ruler
  extends Basecoat<RulerImpl.EventArgs>
  implements Graph.Plugin
{
  public name = 'ruler'

  private graph: Graph
  private vRuler: Ruler | undefined
  private hRuler: Ruler | undefined
  private rulerWidth = 20
  private parentElement: HTMLElement | null
  private silent: boolean
  private hMousePosition: HTMLElement
  private vMousePosition: HTMLElement
  private scale: number

  public readonly options: X6Ruler.Options

  get disabled() {
    return this.options.enabled !== true
  }

  private drawRuler() {
    if (!this.parentElement) return
    const parentRect = this.parentElement.getBoundingClientRect()
    const conv = this.graph.localToClient(0, 0)

    this.hRuler?.draw({
      zoom: this.scale,
      scrollPos: -(conv.x - parentRect.left) / this.scale,
      unit: Math.ceil(50 / this.scale / 50) * 50,
      segment: 10,
    })
    this.vRuler?.draw({
      zoom: this.scale,
      scrollPos: -(conv.y - parentRect.top) / this.scale,
      unit: Math.ceil(50 / this.scale / 50) * 50,
      segment: 10,
    })
  }

  // private resizeRuler() {
  //   this.silent = true
  //   this.drawRuler()
  //   this.silent = false
  // }

  private updateWindowScroll = () => {
    if (this.silent) return
    this.drawRuler()
  }

  private updateGraphScroll = () => {
    this.silent = true
    this.drawRuler()
    this.silent = false
  }

  private updateMousePosition = (e: MouseEvent) => {
    if (!this.parentElement) return
    const loc = this.graph.clientToLocal(e.clientX, e.clientY)
    const cli = this.graph.localToClient(0, 0)

    const parentRect = this.parentElement.getBoundingClientRect()
    this.hMousePosition.style.left = `${
      loc.x * this.scale + cli.x - parentRect.left + this.rulerWidth
    }px`
    this.vMousePosition.style.top = `${
      loc.y * this.scale + cli.y - parentRect.top + this.rulerWidth
    }px`
  }

  constructor(options: X6Ruler.Options) {
    super()
    this.options = options
    CssLoader.ensure(this.name, content)
  }

  public init(graph: Graph) {
    const main = document.querySelector('#scrollWindow') as HTMLElement
    const parent = document.querySelector('#x6canvas') as HTMLElement
    this.parentElement = document.querySelector('.x6-graph-scroller')
    const parentContent = document.querySelector('.x6-graph-scroller-content')
    if (!this.parentElement || !parent || !main) return

    main.style.setProperty('grid-column', '2 / span 1')
    main.style.setProperty('grid-row', '2 / span 1')

    parent.style.setProperty('display', 'grid')
    parent.style.setProperty(
      'grid-template-columns',
      `${this.rulerWidth}px auto`,
    )
    parent.style.setProperty('grid-template-rows', `${this.rulerWidth}px auto`)
    parent.style.setProperty('width', '100%')

    this.graph = graph
    this.scale = this.graph.zoom()

    const hRulerDiv = document.createElement('div')
    hRulerDiv.id = 'hRuler'
    const vRulerDiv = document.createElement('div')
    vRulerDiv.id = 'vRuler'
    const cornerElement = document.createElement('div')
    cornerElement.id = 'corner'

    parent.appendChild(hRulerDiv)
    parent.appendChild(vRulerDiv)
    parent.appendChild(cornerElement)

    hRulerDiv.style.setProperty('grid-column', '2 / span 1')
    hRulerDiv.style.setProperty('grid-row', '1 / span 1')
    hRulerDiv.style.setProperty('width', '100%')
    hRulerDiv.style.setProperty('overflow', 'hidden')

    vRulerDiv.style.setProperty('grid-column', '1 / span 1')
    vRulerDiv.style.setProperty('grid-row', '2 / span 1')
    vRulerDiv.style.setProperty('overflow', 'hidden')

    cornerElement.style.setProperty('grid-column', '1 / span 1')
    cornerElement.style.setProperty('grid-row', '1 / span 1')

    if (
      this.options.orientation === 'horizontal' ||
      this.options.orientation === 'both'
    ) {
      this.hRuler = new Ruler(hRulerDiv, {
        type: 'horizontal',
        style: {
          width: `${parentContent?.clientWidth}px`,
        },
        width: parentContent?.clientWidth,
        height: this.rulerWidth,
        textOffset: [0, 7],
        longLineSize: 9,
        shortLineSize: 6,
        range: [0, 1280],
        rangeBackgroundColor: '#FFFFFF',
        font: '8px sans-serif',
        backgroundColor: '#f2f2f2',
        lineColor: '#311B92',
        textColor: '#311B92',
        markColor: '#311B92',
        unit: Math.ceil(50 / this.scale / 50) * 50,
        segment: 10,
        zoom: this.scale,
      })

      this.hMousePosition = document.createElement('div')
      hRulerDiv.appendChild(this.hMousePosition)
      this.hMousePosition.id = 'hMousePosition'
      this.hMousePosition.style.position = 'absolute'
      this.hMousePosition.style.top = '0px'
      this.hMousePosition.style.left = `${this.rulerWidth}px`
      this.hMousePosition.style.height = `${this.rulerWidth}px`
      this.hMousePosition.style.width = '1px'
      this.hMousePosition.style.borderLeft = '1px solid red'
    }
    if (
      this.options.orientation === 'vertical' ||
      this.options.orientation === 'both'
    ) {
      this.vRuler = new Ruler(vRulerDiv, {
        type: 'vertical',
        style: {
          height: `${parentContent?.clientHeight}px`,
        },
        width: this.rulerWidth,
        textOffset: [7, 0],
        longLineSize: 9,
        shortLineSize: 6,
        range: [0, 720],
        rangeBackgroundColor: '#FFFFFF',
        font: '8px sans-serif',
        backgroundColor: '#f2f2f2',
        lineColor: '#311B92',
        textColor: '#311B92',
        markColor: '#311B92',
        unit: Math.ceil(50 / this.scale / 50) * 50,
        segment: 10,
        zoom: this.scale,
      })

      this.vMousePosition = document.createElement('div')
      vRulerDiv.appendChild(this.vMousePosition)
      this.vMousePosition.id = 'vMousePosition'
      this.vMousePosition.style.position = 'absolute'
      this.vMousePosition.style.top = `${this.rulerWidth}px`
      this.vMousePosition.style.left = '0px'
      this.vMousePosition.style.width = `${this.rulerWidth}px`
      this.vMousePosition.style.height = '1px'
      this.vMousePosition.style.borderTop = '1px solid red'
    }

    this.drawRuler()
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
    if (!this.parentElement) return
    this.parentElement?.addEventListener('scroll', () =>
      this.updateWindowScroll(),
    )
    this.parentElement?.addEventListener('mousemove', this.updateMousePosition)

    this.graph.on('scroll', () => this.updateGraphScroll())

    this.graph.on('scale', (e) => {
      this.scale = e.sx
      this.silent = true
      if (!this.parentElement) return
      this.drawRuler()
      this.silent = false
    })
  }

  protected stopListening() {
    if (!this.parentElement) return
    this.parentElement.removeEventListener('scroll', this.updateGraphScroll)
    this.parentElement.removeEventListener(
      'mousemove',
      this.updateMousePosition,
    )
    this.graph.off('scroll')
    this.graph.off('scale')
  }

  @Basecoat.dispose()
  dispose() {
    this.stopListening()
    this.off()
    this.vRuler && this.vRuler.destroy()
    this.hRuler && this.hRuler.destroy()
    const hMousePosition = document.querySelector(
      '#hMousePosition',
    ) as HTMLElement
    hMousePosition.remove()
    const vMousePosition = document.querySelector(
      '#vMousePosition',
    ) as HTMLElement
    vMousePosition.remove()
    const corner = document.querySelector('#corner') as HTMLElement
    corner.remove()

    CssLoader.clean(this.name)
  }
}

namespace X6Ruler {
  export type EventArgs = RulerImpl.EventArgs
  export interface Options extends RulerImpl.Options {
    enabled?: boolean
  }
}

export class RulerImpl extends View<RulerImpl.EventArgs> {
  @View.dispose()
  dispose() {
    // this.clean();
    this.remove()
    this.off()
  }
}

export namespace RulerImpl {
  export interface Options {
    scroll(scrollPos: number): any
    resize(): any
    orientation?: 'horizontal' | 'vertical' | 'both'
    width?: number
    height?: number
    unit?: number
    zoom?: number
    direction?: 'start' | 'end'
    style?: object
    backgroundColor?: string
    lineColor?: string
    textColor?: string
    textFormat?: (scale: number) => string
  }
  export interface RulerEventArgs {}
  export type EventArgs = RulerEventArgs
}
