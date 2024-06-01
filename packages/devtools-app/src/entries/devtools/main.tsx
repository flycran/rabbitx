import '../enableDevHmr'
import { devtoolsMessage } from '@/entries/devtools/message.ts'
import { events, usePanelStore } from '@/store/panel.ts'
import React from 'react'
import ReactDOM from 'react-dom/client'
import Panel from '../../views/Panel.tsx'
import './index.scss'

const panel = usePanelStore.actions

events.on('setActiveHistory', async (p) => {
  const res = await devtoolsMessage.request('injected', 'setActiveHistory', p)
  panel.syncData(res)
})

events.on('setDisplayHistoryIndex', async (p) => {
  const res = await devtoolsMessage.request('injected', 'setDisplayHistoryIndex', p)
  panel.syncData(res)
})

events.on('setActiveInstanceindex', async (p) => {
  const res = await devtoolsMessage.request('injected', 'setActiveInstanceindex', p)
  panel.syncData(res)
})

devtoolsMessage.onResponse('syncData', (p) => {
  panel.syncData(p)
})

devtoolsMessage.request('injected', 'init', undefined).then((res) => {
  panel.syncData(res)
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Panel />
  </React.StrictMode>,
)
