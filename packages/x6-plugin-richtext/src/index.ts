import { Basecoat, CssLoader, Graph, Node } from '@antv/x6'
import { Dom } from '@antv/x6-common'
import { LexicalEditor } from 'Lexical'
import { NodeEditor } from './NodeEditor'

// import { EventArgs } from '@antv/x6-common/lib/event/types'
import { content } from './style/raw'
import './api'

export class Richtext extends Basecoat implements Graph.Plugin {
  public name = 'richtext'
  private graph: Graph
  private textDiv: HTMLDivElement
  private editors: Map<string, NodeEditor>
  private onTextUpdate?:
    | ((id: string, editor: LexicalEditor) => void)
    | undefined
  private onTextCreated?:
    | ((id: string, editor: LexicalEditor) => void)
    | undefined

  public readonly options: Richtext.Options

  get disabled() {
    return this.options.enabled !== true
  }

  constructor(
    onTextUpdate?: (id: string, editor: LexicalEditor) => void,
    onTextCreated?: (id: string, editor: LexicalEditor) => void,
    options: Richtext.Options = {},
  ) {
    super()
    this.options = options
    this.onTextUpdate = onTextUpdate || undefined
    this.onTextCreated = onTextCreated || undefined
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
      ({ node }) => this.getEditor(node.id)?.updateNodeEditorTransform(),
      this,
    )
    this.graph.on(
      'node:change:size',
      ({ node }) => this.getEditor(node.id)?.updateNodeEditorTransform(),
      this,
    )
    this.graph.on(
      'node:change:angle',
      ({ node }) => this.getEditor(node.id)?.updateNodeEditorTransform(),
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
      ({ node }) => this.getEditor(node.id)?.updateNodeEditorTransform(),
      this,
    )
    this.graph.off(
      'node:change:size',
      ({ node }) => this.getEditor(node.id)?.updateNodeEditorTransform(),
      this,
    )
    this.graph.off(
      'node:change:angle',
      ({ node }) => this.getEditor(node.id)?.updateNodeEditorTransform(),
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
    if (node.view === 'react-shape-view' || node.getChildCount() > 0) return
    const nodeDivExists = this.getNodeTextDiv(node)

    if (nodeDivExists) {
      this.getEditor(node.id)?.updateNodeEditorTransform()
      return
    }

    const nodeText = new NodeEditor(
      node.id,
      this.graph,
      this.onTextUpdate,
      this.onTextCreated,
    )
    this.editors.set(node.id, nodeText)

    const nodeDiv = this.createNodeTextDiv(node)
    nodeText.createEditorJS(nodeDiv)

    this.getEditor(node.id)?.updateNodeEditorTransform()
  }

  updateAllNodesEditorTransform = () => {
    this.graph.getNodes().forEach((node) => {
      this.getEditor(node.id)?.updateNodeEditorTransform()
    })
  }

  onNodeAdded = ({ node }: { node: Node }) => {
    if (node.view === 'react-shape-view') return
    const nodeData = node.getData()
    const nodeText =
      nodeData && 'lexicalText' in nodeData ? nodeData.lexicalText : undefined
    if (nodeText) {
      const nodeDiv = this.createNodeTextDiv(node)
      const nodeTextEditor = new NodeEditor(
        node.id,
        this.graph,
        this.onTextUpdate,
        this.onTextCreated,
      )
      this.editors.set(node.id, nodeTextEditor)
      nodeTextEditor.createEditorJS(nodeDiv, nodeText)

      nodeTextEditor.updateNodeEditorTransform()
    }
  }

  createNodeTextDiv = (node: Node): HTMLElement => {
    const nodeTextDiv = Dom.createElement('div') as HTMLDivElement
    nodeTextDiv.id = `x6-text-${node.id}`
    nodeTextDiv.contentEditable = 'true'
    this.textDiv.appendChild(nodeTextDiv)

    nodeTextDiv.style.pointerEvents = 'auto'
    nodeTextDiv.style.position = 'absolute'
    nodeTextDiv.style.wordBreak = 'normal'
    nodeTextDiv.focus()
    nodeTextDiv.style.cursor = 'text'
    // nodeTextDiv.style.width = 'max-content'

    return nodeTextDiv
  }

  getEditor(nodeId: string): NodeEditor | null {
    if (this.editors && this.editors.size > 0) {
      return this.editors.get(nodeId) || null
    }
    return null
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
