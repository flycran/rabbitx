import TestCount from '@/views/TestCount.tsx'
import { App as AntdApp, ConfigProvider, FloatButton } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import './App.css'
import 'dayjs/locale/zh-cn'
import { PanelRef } from 'devtools-app'
import { useRef } from 'react'

function App() {
  const ref = useRef<PanelRef | null>(null)

  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <FloatButton onClick={() => ref.current?.open()} />
        <TestCount />
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
