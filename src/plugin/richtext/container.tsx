import React from 'react'
import { createRoot } from 'react-dom/client'

const container = (div: HTMLElement, ele: React.ReactNode) => {
  const root = createRoot(div)
  root.render(ele)
  div.focus()
  return () => root.unmount()
}
export default container
