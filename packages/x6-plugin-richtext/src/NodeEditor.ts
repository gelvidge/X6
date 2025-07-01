import { Basecoat, Graph } from '@antv/x6'
import {
  $createParagraphNode,
  $getRoot,
  createEditor,
  CreateEditorArgs,
  FORMAT_ELEMENT_COMMAND,
  LexicalEditor,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  ElementNode,
  RangeSelection,
  TextNode,
} from 'lexical'

import {
  $findMatchingParent,
  $getNearestNodeOfType,
  mergeRegister,
} from '@lexical/utils'
import {
  $getSelectionStyleValueForProperty,
  $isAtNodeEnd,
} from '@lexical/selection'
import { $isHeadingNode, registerRichText } from '@lexical/rich-text'
import { $isLinkNode } from '@lexical/link'

import {
  $isListNode,
  ListNode,
  ListItemNode,
  registerCheckList,
  registerList,
} from '@lexical/list'

import lexicalTheme from './lexicalTheme'

const getSelectedNode = function (
  selection: RangeSelection,
): TextNode | ElementNode {
  const { anchor } = selection
  const { focus } = selection
  const anchorNode = selection.anchor.getNode()
  const focusNode = selection.focus.getNode()
  if (anchorNode === focusNode) {
    return anchorNode
  }
  const isBackward = selection.isBackward()
  if (isBackward) {
    return $isAtNodeEnd(focus) ? anchorNode : focusNode
  }
  return $isAtNodeEnd(anchor) ? anchorNode : focusNode
}

const getDOMRangeRect = function (
  nativeSelection: Selection,
  rootElement: HTMLElement,
): DOMRect {
  const domRange = nativeSelection.getRangeAt(0)

  let rect

  if (nativeSelection.anchorNode === rootElement) {
    let inner = rootElement
    while (inner.firstElementChild != null) {
      inner = inner.firstElementChild as HTMLElement
    }
    rect = inner.getBoundingClientRect()
  } else {
    rect = domRange.getBoundingClientRect()
  }

  return rect
}

export class NodeEditor extends Basecoat {
  private nodeTextDiv: HTMLElement
  private editor: LexicalEditor
  private graph: Graph
  private state: any
  private nodeId: string
  private position: DOMRect | null = null
  private observers: Array<(object: object) => object> = []
  private removeUpdateListener: () => void

  constructor(graph: Graph, nodeId: string) {
    super()
    this.graph = graph
    this.nodeId = nodeId
  }

  subscribe(func: (object: object) => object) {
    this.observers.push(func)
  }

  unsubscribe(func: () => object) {
    this.observers = this.observers.filter((observer) => observer !== func)
  }

  notify(data: object) {
    this.observers.forEach((observer) => observer(data))
  }

  createText(nodeDiv: HTMLElement, nodeText?: string): void {
    this.nodeTextDiv = nodeDiv
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

    this.removeUpdateListener = this.editor.registerUpdateListener(
      ({ editorState }) => {
        editorState.read(() => {
          const selection = $getSelection()

          if ($isRangeSelection(selection)) {
            const rootElement = this.editor.getRootElement()
            const nativeSelection = window.getSelection()
            const anchorNode = selection.anchor.getNode()
            let element =
              anchorNode.getKey() === 'root'
                ? anchorNode
                : $findMatchingParent(anchorNode, (e) => {
                    const parent = e.getParent()
                    return parent !== null && $isRootOrShadowRoot(parent)
                  })

            if (element === null) {
              element = anchorNode.getTopLevelElementOrThrow()
            }

            const node = getSelectedNode(selection)
            const parent = node.getParent()
            let type = null
            if (
              nativeSelection !== null &&
              !nativeSelection.isCollapsed &&
              rootElement !== null &&
              rootElement.contains(nativeSelection.anchorNode)
            ) {
              this.position = getDOMRangeRect(nativeSelection, rootElement)
            } else this.position = null

            if ($isListNode(element)) {
              const parentList = $getNearestNodeOfType<ListNode>(
                anchorNode,
                ListNode,
              )
              type = parentList
                ? parentList.getListType()
                : element.getListType()
            } else {
              type = $isHeadingNode(element)
                ? element.getTag()
                : element.getType()
            }
            this.state = {
              nodeId: this.nodeId,
              position: this.position,
              isBold: selection.hasFormat('bold'),
              isCode: selection.hasFormat('code'),
              isItalic: selection.hasFormat('italic'),
              isStrikethrough: selection.hasFormat('strikethrough'),
              isUnderline: selection.hasFormat('underline'),
              script: selection.hasFormat('superscript')
                ? 'superscript'
                : selection.hasFormat('subscript')
                ? 'subscript'
                : '',

              fontSize: $getSelectionStyleValueForProperty(
                selection,
                'font-size',
                '12px',
              ),
              fontColor: $getSelectionStyleValueForProperty(
                selection,
                'color',
                '#000',
              ),
              bgColor: $getSelectionStyleValueForProperty(
                selection,
                'background-color',
                '#fff',
              ),
              fontFamily: $getSelectionStyleValueForProperty(
                selection,
                'font-family',
                'Arial',
              ),
              isLink: $isLinkNode(parent) || $isLinkNode(node),
              alignment: parent?.getFormatType() || 'left',
              blockType: type,
            }

            this.notify(this.state)

            // Update text format
          }
        })
      },
    )

    this.editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')
    // this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')

    if (nodeText) {
      this.editor.setEditorState(this.editor.parseEditorState(nodeText))
    }

    this.nodeTextDiv.addEventListener('blur', this.onBlur)
  }

  getState = () => {
    return this.state
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
