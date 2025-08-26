import { Basecoat, Graph, Cell, Node } from '@antv/x6'
import {
  $createParagraphNode,
  $getRoot,
  createEditor,
  CreateEditorArgs,
  FORMAT_ELEMENT_COMMAND,
  LexicalEditor,
} from 'lexical' // import { Point } from '@antv/x6-geometry'

import { mergeRegister } from '@lexical/utils'

import { registerRichText } from '@lexical/rich-text'

import {
  // $isListNode,
  ListNode,
  ListItemNode,
  registerCheckList,
  registerList,
} from '@lexical/list'

import lexicalTheme from './lexicalTheme'

export class NodeEditor extends Basecoat {
  private nodeTextDiv: HTMLElement
  private textContainer: HTMLElement
  private editor: LexicalEditor
  private graph: Graph
  private state: any
  private onUpdate: ((id: string, editor: LexicalEditor) => void) | undefined
  private onCreate: ((id: string, editor: LexicalEditor) => void) | undefined
  private node: Node
  private removeUpdateListener: () => void
  // private scrollElement: HTMLElement | null = null
  // private scrollTop: number | undefined
  // private scrollLeft: number | undefined

  constructor(
    nodeId: string,
    graph: Graph,
    onUpdate?: (id: string, editor: LexicalEditor) => void,
    onCreate?: (id: string, editor: LexicalEditor) => void,
  ) {
    super()
    this.graph = graph
    this.node = graph.getCellById(nodeId) as Node
    this.onUpdate = onUpdate || undefined
    this.onCreate = onCreate || undefined
    // this.scrollTop = undefined
    // this.scrollLeft = undefined
  }

  createEditorJS(nodeDiv: HTMLElement, nodeText?: string): void {
    this.nodeTextDiv = nodeDiv
    this.textContainer = nodeDiv.parentNode as HTMLElement

    // this.scrollElement = document.getElementsByClassName(
    //   'x6-graph-scroller',
    // )[0] as HTMLElement
    const config: CreateEditorArgs = {
      namespace: 'x6',
      onError: console.error,
      theme: lexicalTheme,
      nodes: [ListNode, ListItemNode],
    }

    this.editor = createEditor(config)
    if (this.editor) {
      mergeRegister(
        registerRichText(this.editor),
        registerCheckList(this.editor),
        registerList(this.editor),
      )
    }
    this.editor?.setRootElement(this.nodeTextDiv)
    this.editor.update(() => {
      const paragraph = $createParagraphNode()
      $getRoot().append(paragraph)
      $getRoot().selectEnd()
    })

    this.removeUpdateListener = this.editor.registerUpdateListener(() => {
      this.onUpdate && this.onUpdate(this.node.id, this.editor)
      this.updateNodeEditorTransform()
      // if (this.scrollElement?.onscroll === null) {
      //   this.scrollElement.onscroll = () => {
      //     if (this.scrollLeft && this.scrollTop)
      //       this.scrollElement?.scrollTo(this.scrollLeft, this.scrollTop)
      //   }
      // }
    })

    this.editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')

    if (nodeText) {
      this.editor.setEditorState(this.editor.parseEditorState(nodeText))
    }

    this.nodeTextDiv.addEventListener('blur', this.onBlur)
    // this.nodeTextDiv.addEventListener('focus', this.onFocus)
    this.onCreate && this.onCreate(this.node.id, this.editor)
  }

  getState = () => {
    return this.state
  }

  updateNodeEditorTransform = () => {
    // const { graph } = this

    if (!this.textContainer || !this.nodeTextDiv) {
      return
    }

    // let pos = Point.create()

    const minWidth = 10

    const bbox = (this.node as unknown as Cell).getBBox()
    // const textBBox = this.nodeTextDiv.getBoundingClientRect()
    // pos = bbox.topLeft
    const maxWidth = bbox.width - 10

    // const angle = (this.node as Node).getAngle()
    // const scale = graph.scale()

    const { style } = this.nodeTextDiv
    // pos = graph.localToGraph(pos)
    // style.left = `${
    //   pos.x + ((bbox.width * scale.sx) / 2 - textBBox.width / 2)
    // }px`
    // style.top = `${
    //   pos.y + (bbox.height * scale.sy) / 2 - textBBox.height / 2
    // }px`
    // style.transform = `scale(${scale.sx}, ${scale.sy}) `
    style.minWidth = `${minWidth}px`
    style.maxWidth = `${maxWidth}px`
    style.width = `${maxWidth}px`
    // style.rotate = `${angle || 0}deg`
  }

  onBlur = (e: FocusEvent): void => {
    const nodeId = (e.target as HTMLElement).id.replace('x6-text-', '')
    const node = this.graph.getCellById(nodeId)
    const lexicalData = {
      lexicalText: JSON.stringify(this.editor.getEditorState().toJSON()),
    }
    node.setData(lexicalData, { overwrite: true, silent: true })

    // if ((e.target as HTMLElement).id.startsWith('x6-text-container')) return
    // if (this.scrollElement) {
    //   this.scrollElement.onscroll = null
    //   this.scrollElement.removeEventListener('wheel', this.removeScrollBlock)
    // }
  }

  // onFocus = (e: FocusEvent): void => {
  //   if ((e.target as HTMLElement).id.startsWith('x6-text-container')) return
  //   this.scrollTop = this.scrollElement?.scrollTop
  //   this.scrollLeft = this.scrollElement?.scrollLeft
  //   this.scrollElement?.addEventListener('wheel', this.removeScrollBlock)
  // }

  // removeScrollBlock = () => {
  //   if (this.scrollElement) {
  //     this.scrollElement.onscroll = null
  //   }
  // }

  remove(): this {
    if (this.nodeTextDiv) {
      this.nodeTextDiv.removeEventListener('blur', this.onBlur)
      // this.nodeTextDiv.removeEventListener('focus', this.onFocus)
      this.removeUpdateListener()
    }
    return this
  }

  @Basecoat.dispose()
  dispose() {
    this.remove()
    this.off()
  }
}
