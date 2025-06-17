import { Basecoat, Graph } from '@antv/x6'
import {
  $createParagraphNode,
  $getRoot,
  createEditor,
  CreateEditorArgs,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  LexicalEditor,
} from 'lexical'
import { registerRichText } from '@lexical/rich-text'

export class NodeEditor extends Basecoat {
  private nodeTextDiv: HTMLElement
  private editor: LexicalEditor
  private graph: Graph

  constructor(graph: Graph) {
    super()
    this.graph = graph
  }

  createText(nodeDiv: HTMLElement, nodeText?: string): void {
    this.nodeTextDiv = nodeDiv
    const config: CreateEditorArgs = {
      namespace: 'x6',
      onError: console.error,
    }

    this.editor = createEditor(config)
    this.editor && registerRichText(this.editor)
    this.editor.update(() => {
      const paragraph = $createParagraphNode()
      $getRoot().append(paragraph)
      $getRoot().selectEnd()
    })

    this.editor?.setRootElement(this.nodeTextDiv)
    this.editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')
    this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')

    if (nodeText) {
      this.editor.setEditorState(this.editor.parseEditorState(nodeText))
    }

    this.nodeTextDiv.addEventListener('blur', this.onBlur)
    this.nodeTextDiv.addEventListener('blur', this.onBlur)
  }

  onBlur = (e: FocusEvent): void => {
    const nodeId = (e.target as HTMLElement).id.replace('x6-text-', '')
    const node = this.graph.getCellById(nodeId)
    const lexicalData = {
      lexicalText: JSON.stringify(this.editor.getEditorState().toJSON()),
    }
    node.setData(lexicalData, { overwrite: true, silent: true })
  }

  remove(): this {
    if (this.nodeTextDiv) {
      this.nodeTextDiv.removeEventListener('blur', this.onBlur)
    }
    return this
  }

  @Basecoat.dispose()
  dispose() {
    this.remove()
    this.off()
  }
}
