import { Basecoat, Graph, Cell, Node } from '@antv/x6'
import {
  $createParagraphNode,
  $getRoot,
  createEditor,
  CreateEditorArgs,
  FORMAT_ELEMENT_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_EDITOR,
  KEY_DOWN_COMMAND,
  LexicalEditor,
  createCommand,
  LexicalCommand,
  $getSelection,
  $isRangeSelection,
} from 'lexical'
import { Point } from '@antv/x6-geometry'
import { mergeRegister } from '@lexical/utils'
import { registerRichText } from '@lexical/rich-text'
import { registerHistory, createEmptyHistoryState } from '@lexical/history'
import {
  ListNode,
  ListItemNode,
  registerCheckList,
  registerList,
} from '@lexical/list'
import lexicalTheme from './lexicalTheme'

export const FORMAT_ON_COMMAND: LexicalCommand<number> = createCommand()

export class NodeEditor extends Basecoat {
  private nodeTextDiv: HTMLElement
  private textContainer: HTMLElement
  private editor: LexicalEditor
  private graph: Graph
  private state: any
  private onUpdate: ((id: string, editor: LexicalEditor) => void) | undefined
  private onCreate: ((id: string, editor: LexicalEditor) => void) | undefined
  private onHistoryChange: ((editor: LexicalEditor) => void) | undefined
  private node: Node
  private removeUpdateListener: () => void
  private cleanHistory: () => void

  constructor(
    nodeId: string,
    graph: Graph,
    onUpdate?: (id: string, editor: LexicalEditor) => void,
    onCreate?: (id: string, editor: LexicalEditor) => void,
    onHistoryChange?: (editor: LexicalEditor) => void,
  ) {
    super()
    this.graph = graph
    this.node = graph.getCellById(nodeId) as Node
    this.onUpdate = onUpdate || undefined
    this.onCreate = onCreate || undefined
    this.onHistoryChange = onHistoryChange || undefined
  }

  createEditorJS(nodeDiv: HTMLElement, nodeText?: string): void {
    this.nodeTextDiv = nodeDiv
    this.textContainer = nodeDiv.parentNode as HTMLElement

    const config: CreateEditorArgs = {
      namespace: 'x6',
      onError: console.error,
      theme: lexicalTheme,
      nodes: [ListNode, ListItemNode],
    }

    this.editor = createEditor(config)

    if (this.editor) {
      mergeRegister(
        this.editor.registerCommand(
          CAN_UNDO_COMMAND,
          (payload) => {
            this.onHistoryChange && payload && this.onHistoryChange(this.editor)
            return false
          },
          COMMAND_PRIORITY_EDITOR,
        ),
        this.editor.registerCommand(
          FORMAT_ON_COMMAND,
          (format: number) => {
            const selection = $getSelection()
            if (!$isRangeSelection(selection)) {
              return false
            }
            selection.setFormat(format)
            return true
          },
          COMMAND_PRIORITY_EDITOR,
        ),
        // this is included to stop native undo/redo of lexical - may need to update if implementing  mouse clicks to undo/redo
        this.editor.registerCommand(
          KEY_DOWN_COMMAND,
          (event: KeyboardEvent) => {
            if (
              (event.ctrlKey && event.key === 'z') ||
              (event.ctrlKey && event.key === 'y')
            )
              return true
            return false
          },
          COMMAND_PRIORITY_EDITOR,
        ),
        registerRichText(this.editor),
        registerCheckList(this.editor),
        registerList(this.editor),
      )

      this.editor.setRootElement(this.nodeTextDiv)
      this.editor.update(
        () => {
          const paragraph = $createParagraphNode()
          $getRoot().append(paragraph)
          paragraph.select()
        },
        { tag: 'history-merge' },
      )

      this.removeUpdateListener = this.editor.registerUpdateListener(() => {
        this.onUpdate && this.onUpdate(this.node.id, this.editor)
        this.updateNodeEditorTransform()
      })

      this.editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')

      if (nodeText) {
        this.editor.setEditorState(this.editor.parseEditorState(nodeText))
      }

      this.nodeTextDiv.addEventListener('blur', this.onBlur)
      this.nodeTextDiv.addEventListener('focus', this.onFocus)
      this.onCreate && this.onCreate(this.node.id, this.editor)

      this.cleanHistory = registerHistory(
        this.editor,
        createEmptyHistoryState(),
        300,
      )
    }
  }

  getState = () => {
    return this.state
  }

  updateNodeEditorTransform = () => {
    const { graph } = this

    if (!this.textContainer || !this.nodeTextDiv) {
      return
    }

    let pos = Point.create()

    const minWidth = 10

    const bbox = (this.node as unknown as Cell).getBBox()
    pos = bbox.topLeft

    const angle = (this.node as Node).getAngle()
    const maxWidth = bbox.width - 10

    const { style } = this.nodeTextDiv
    style.minWidth = `${minWidth}px`
    style.maxWidth = `${maxWidth}px`
    style.width = `${maxWidth}px`
    style.rotate = `${angle || 0}deg`

    const scale = graph.scale()

    pos = graph.localToGraph(pos)
    style.left = `${
      pos.x + ((bbox.width * scale.sx) / 2 - this.nodeTextDiv.offsetWidth / 2)
    }px`
    style.top = `${
      pos.y + (bbox.height * scale.sy) / 2 - this.nodeTextDiv.offsetHeight / 2
    }px`
    style.transform = `scale(${scale.sx}, ${scale.sy}) `
  }

  onBlur = (e: FocusEvent): void => {
    const nodeId = (e.target as HTMLElement).id.replace('x6-text-', '')
    const node = this.graph.getCellById(nodeId)
    const lexicalData = {
      lexicalText: JSON.stringify(this.editor.getEditorState().toJSON()),
    }
    node.setData(lexicalData, { overwrite: true, silent: true })
  }

  onFocus = (e: FocusEvent): void => {
    const nodeId = (e.target as HTMLElement).id.replace('x6-text-', '')
    const node = this.graph.getCellById(nodeId)
    ;(this.graph as any).resetSelection(node)
  }

  remove(): this {
    if (this.nodeTextDiv) {
      this.nodeTextDiv.removeEventListener('blur', this.onBlur)
      this.nodeTextDiv.removeEventListener('focus', this.onFocus)
      this.removeUpdateListener()
      this.cleanHistory()
    }
    return this
  }

  @Basecoat.dispose()
  dispose() {
    this.remove()
    this.off()
  }
}
