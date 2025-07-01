import { Basecoat, CssLoader, Graph, Node } from '@antv/x6'
import { Point } from '@antv/x6-geometry'
import { Dom } from '@antv/x6-common'
import { NodeEditor } from './NodeEditor'

// import { EventArgs } from '@antv/x6-common/lib/event/types'
import { content } from './style/raw'
import './api'

export class Richtext extends Basecoat implements Graph.Plugin {
  public name = 'richtext'
  private graph: Graph
  private textDiv: HTMLDivElement
  private editors: Map<string, NodeEditor>

  public readonly options: Richtext.Options

  get disabled() {
    return this.options.enabled !== true
  }

  constructor(options: Richtext.Options = {}) {
    super()
    this.options = options
    CssLoader.ensure(this.name, content)
  }

  public init(graph: Graph) {
    this.graph = graph
    this.startListening()
    this.editors = new Map()

    this.textDiv = Dom.createElement('div') as HTMLDivElement
    this.textDiv.id = 'x6-text-container'
    Dom.addClass(this.textDiv, 'x6-html-text')

    this.textDiv.style.position = 'relative'

    this.graph.container.appendChild(this.textDiv)
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
    this.graph.on('node:added', this.onNodeAdded, this)
    this.graph.on('node:removed', this.onNodeRemoved, this)
    this.graph.on('node:dblclick', this.createText, this)

    this.graph.on(
      'node:change:position',
      ({ node }) => this.updateNodeEditorTransform(node),
      this,
    )
    this.graph.on(
      'node:change:size',
      ({ node }) => this.updateNodeEditorTransform(node),
      this,
    )
    this.graph.on(
      'node:change:angle',
      ({ node }) => this.updateNodeEditorTransform(node),
      this,
    )
    this.graph.on('scale', this.updateAllNodesEditorTransform, this)
  }

  protected stopListening() {
    this.graph.off('node:dblclick', this.createText, this)
    this.graph.off('node:added', this.onNodeAdded, this)
    this.graph.off('node:removed', this.onNodeRemoved, this)
    this.graph.off(
      'node:change:position',
      ({ node }) => this.updateNodeEditorTransform(node),
      this,
    )
    this.graph.off(
      'node:change:size',
      ({ node }) => this.updateNodeEditorTransform(node),
      this,
    )
    this.graph.off(
      'node:change:angle',
      ({ node }) => this.updateNodeEditorTransform(node),
      this,
    )
    this.graph.off('scale', this.updateAllNodesEditorTransform, this)
  }

  protected getNodeTextDiv(node: Node): HTMLDivElement | null {
    return (
      (this.textDiv?.querySelector(`#x6-text-${node.id}`) as HTMLDivElement) ||
      null
    )
  }

  createText({ node }: { node: Node }) {
    if (node.view === 'react-shape-view') return
    const nodeDivExists = this.getNodeTextDiv(node)
    if (node.getChildCount() > 0) {
      return
    }
    if (nodeDivExists) {
      this.updateNodeEditorTransform(node)
      return
    }

    const nodeText = new NodeEditor(this.graph, node.id)
    this.editors.set(node.id, nodeText)

    const nodeDiv = this.createNodeTextDiv(node)
    nodeText.createText(nodeDiv)

    this.updateNodeEditorTransform(node)
  }

  updateNodeEditorTransform = (node: Node) => {
    const { graph, textDiv } = this

    if (!textDiv) {
      return
    }

    let pos = Point.create()
    const minWidth = 20

    const bbox = node.getBBox()
    pos = bbox.center
    const maxWidth = bbox.width - 8
    const translate = 'translate(-50%, -50%)'

    const angle = node.getAngle()
    const scale = graph.scale()
    const nodeDiv = this.getNodeTextDiv(node)
    if (!nodeDiv) return
    const { style } = nodeDiv
    pos = graph.localToGraph(pos)
    style.left = `${pos.x}px`
    style.top = `${pos.y}px`
    style.transform = `scale(${scale.sx}, ${scale.sy}) ${translate}`
    style.minWidth = `${minWidth}px`
    style.maxWidth = `${maxWidth}px`
    style.width = `${maxWidth}px`
    style.rotate = `${angle || 0}deg`
  }

  createNodeTextDiv = (node: Node): HTMLElement => {
    const nodeTextDiv = Dom.createElement('div') as HTMLDivElement
    nodeTextDiv.id = `x6-text-${node.id}`
    nodeTextDiv.contentEditable = 'true'
    this.textDiv.appendChild(nodeTextDiv)

    nodeTextDiv.style.pointerEvents = 'none'
    nodeTextDiv.style.position = 'absolute'
    nodeTextDiv.style.wordBreak = 'normal'
    nodeTextDiv.focus()
    nodeTextDiv.style.cursor = 'text'
    nodeTextDiv.style.width = 'max-content'
    nodeTextDiv.style.transformOrigin = 'left top'

    return nodeTextDiv
  }

  updateAllNodesEditorTransform = () => {
    this.graph.getNodes().forEach((node) => {
      this.updateNodeEditorTransform(node)
    })
  }
  onNodeAdded = ({ node }: { node: Node }) => {
    if (node.view === 'react-shape-view') return
    const nodeData = node.getData()
    const nodeText =
      nodeData && 'lexicalText' in nodeData ? nodeData.lexicalText : undefined
    if (nodeText) {
      const nodeDiv = this.createNodeTextDiv(node)
      const nodeTextEditor = new NodeEditor(this.graph, node.id)
      this.editors.set(node.id, nodeTextEditor)
      nodeTextEditor.createText(nodeDiv, nodeText)

      this.updateNodeEditorTransform(node)
    }
  }

  getEditor(nodeId: string): NodeEditor | null {
    if (this.editors && this.editors.size > 0) {
      return this.editors.get(nodeId) || null
    }
    return null
  }

  getLexicalTextDiv(): HTMLElement {
    return this.textDiv
  }

  onNodeRemoved({ node }: { node: Node }): this {
    if (node.view === 'react-shape-view') return this
    const nodeText = this.getNodeTextDiv(node)
    const nodeEditor = this.getEditor(node.id)
    nodeEditor && nodeEditor.remove()
    nodeText && nodeText.remove()

    return this
  }

  @Basecoat.dispose()
  dispose() {
    this.stopListening()
    this.off()
    CssLoader.clean(this.name)
  }
}

namespace Richtext {
  export type EventArgs = RichtextImpl.EventArgs
  export interface Options {
    enabled?: boolean
  }

  namespace RichtextImpl {
    export interface Options {
      graph: Graph
    }
  }

  namespace RichtextImpl {
    export interface RichtextEventArgs {}

    export type EventArgs = RichtextEventArgs
  }
}
