import { Drawer } from 'antd'
import { ForwardedRef, forwardRef, useImperativeHandle, useState } from 'react'
import Panel from './Panel.tsx'

export interface PanelRef {
  open: () => void
}

const PanelDrawer = forwardRef((_: {}, ref: ForwardedRef<PanelRef>) => {
  const [open, setOpen] = useState(false)

  const onClose = () => {
    setOpen(false)
  }
  useImperativeHandle(ref, () => ({
    open() {
      setOpen(true)
    },
  }))
  return (
    <Drawer mask={false} width={800} title="面板" onClose={onClose} open={open}>
      <div className="drawer-box">
        <Panel />
      </div>
    </Drawer>
  )
})

export default PanelDrawer
