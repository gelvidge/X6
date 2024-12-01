---
title: Dropdown
order: 4
redirect_from:
  - /en/docs
  - /en/docs/api
  - /en/docs/api/ui
---

<<<<<<< HEAD
下拉菜单。
=======
Dropdown menu
>>>>>>> x6/master

<iframe src="/demos/api/ui/dropdown/basic"></iframe>

```tsx
import { Menu, Dropdown } from '@antv/x6-react-components'
import '@antv/x6-react-components/es/menu/style/index.css'
import '@antv/x6-react-components/es/dropdown/style/index.css'

const menu = (
  <Menu>
    <Menu.Item key="1">1st menu item</Menu.Item>
    <Menu.Item key="2">2nd menu item</Menu.Item>
    <Menu.Item key="3">3rd menu item</Menu.Item>
  </Menu>
)

<Dropdown overlay={menu}>
  <a href="#">Hover me</a>
</Dropdown>

<Dropdown overlay={menu} trigger={['contextMenu']}>
  <span style={{ userSelect: 'none' }}>Right Click on Me</span>
</Dropdown>
```

## Dropdown

<<<<<<< HEAD
| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| className | 自定义的样式名 | string | - |
| overlay | 菜单，通常使用 [Menu](/en/docs/api/ui/menu) 组件 | ReactNode | - |
| overlayClassName | 下拉根元素的类名称 | string | - |
| overlayStyle | 下拉根元素的样式 | CSSProperties | - |
| disabled | 菜单是否禁用 | boolean | `false` |
| visible | 菜单是否显示 | boolean | `false` |
| trigger | 触发行为，可选 `hover` \| `click` \| `contextMenu`，可使用数组设置多个触发行为 | string \| string[] | `'hover'` |
| placement | 下拉菜单的位置，可选 `top` `left` `right` `bottom` `topLeft` `topRight` `bottomLeft` `bottomRight` `leftTop` `leftBottom` `rightTop` `rightBottom` | string | `'bottomLeft'` |
| mouseEnterDelay | 当 `trigger` 为 `'hover'`时，鼠标移入后延时多少才显示下拉菜单，单位：秒 | number | `0.15` |
| mouseLeaveDelay | 当 `trigger` 为 `'hover'`时，鼠标移出后延时多少才隐藏下拉菜单，单位：秒 | number | `0.1` |
| getPopupContainer | 菜单渲染父节点。默认渲染到 body 上，如果你遇到菜单滚动定位问题，试试修改为滚动的区域，并相对其定位。 | (triggerNode: Element) => HTMLElement | - |
| onVisibleChange | 菜单显示状态改变时调用 | (visible?: boolean) => void | - |
=======
| Parameter | Description | Type | Default Value |
| --- | --- | --- | --- |
| className | Custom style name | string | - |
| overlay | Menu, typically using the [Menu](/en/docs/api/ui/menu) component | ReactNode | - |
| overlayClassName | Class name for the dropdown root element | string | - |
| overlayStyle | Style for the dropdown root element | CSSProperties | - |
| disabled | Whether the menu is disabled | boolean | `false` |
| visible | Whether the menu is displayed | boolean | `false` |
| trigger | Trigger behavior, options are `hover` \| `click` \| `contextMenu`, can use an array to set multiple trigger behaviors | string \| string[] | `'hover'` |
| placement | Position of the dropdown menu, options are `top` `left` `right` `bottom` `topLeft` `topRight` `bottomLeft` `bottomRight` `leftTop` `leftBottom` `rightTop` `rightBottom` | string | `'bottomLeft'` |
| mouseEnterDelay | When `trigger` is `'hover'`, the delay in seconds before the dropdown menu is displayed after mouse enters | number | `0.15` |
| mouseLeaveDelay | When `trigger` is `'hover'`, the delay in seconds before the dropdown menu is hidden after mouse leaves | number | `0.1` |
| getPopupContainer | Parent node for rendering the menu. By default, it renders to the body. If you encounter positioning issues with scrolling, try changing it to the scrolling area and positioning it relative to that. | (triggerNode: Element) => HTMLElement | - |
| onVisibleChange | Called when the visibility state of the menu changes | (visible?: boolean) => void | - |
>>>>>>> x6/master
