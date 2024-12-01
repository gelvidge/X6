---
title: ContextMenu
order: 6
redirect_from:
  - /en/docs
  - /en/docs/api
  - /en/docs/api/ui
---

<<<<<<< HEAD
上下文菜单。
=======
Context Menu.
>>>>>>> x6/master

<iframe src="/demos/api/ui/contextmenu/basic"></iframe>

```tsx
import { Menu, ContextMenu } from '@antv/x6-react-components'
import '@antv/x6-react-components/es/menu/style/index.css'
import '@antv/x6-react-components/es/dropdown/style/index.css'
import '@antv/x6-react-components/es/context-menu/style/index.css'

const menu = (
  <Menu>
    <Menu.Item key="1">1st menu item</Menu.Item>
    <Menu.Item key="2">2nd menu item</Menu.Item>
    <Menu.Item key="3">3rd menu item</Menu.Item>
  </Menu>
)

<ContextMenu menu={menu}>
  <div
    style={{
      width: 560,
      height: 240,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#f5f5f5',
      userSelect: 'none',
    }}
  >
    Right Click On Me
  </div>
</ContextMenu>
```

## ContextMenu

<<<<<<< HEAD
| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| className | 自定义的样式名 | string | - |
| menu | 菜单 [Menu](/en/docs/api/ui/menu) 组件 | Menu | - |
| overlayClassName | 下拉根元素的类名称 | string | - |
| overlayStyle | 下拉根元素的样式 | CSSProperties | - |
| disabled | 菜单是否禁用 | boolean | `false` |
| visible | 菜单是否显示 | boolean | `false` |
| getPopupContainer | 菜单渲染父节点。默认渲染到 body 上，如果你遇到菜单滚动定位问题，试试修改为滚动的区域，并相对其定位。 | (triggerNode: Element) => HTMLElement | - |
| onVisibleChange | 菜单显示状态改变时调用 | (visible?: boolean) => void | - |
=======
| Parameter | Description | Type | Default Value |
| --- | --- | --- | --- |
| className | Custom style name | string | - |
| menu | Menu [Menu](/en/docs/api/ui/menu) component | Menu | - |
| overlayClassName | Class name for the dropdown root element | string | - |
| overlayStyle | Style for the dropdown root element | CSSProperties | - |
| disabled | Whether the menu is disabled | boolean | `false` |
| visible | Whether the menu is displayed | boolean | `false` |
| getPopupContainer | The parent node for rendering the menu. By default, it renders to the body. If you encounter positioning issues with scrolling, try changing it to the scrolling area and positioning it relative to that. | (triggerNode: Element) => HTMLElement | - |
| onVisibleChange | Called when the visibility state of the menu changes | (visible?: boolean) => void | - |
>>>>>>> x6/master
