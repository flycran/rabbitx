import { ClockCircleOutlined } from '@ant-design/icons'
import { Flex, Layout, Radio, Space, Tag } from 'antd'
import dayjs from 'dayjs'
import React, { useState } from 'react'
import { JSONTree } from 'react-json-tree'
import { usePanelStore } from '../store/panel.ts'
import { Stack, StackItem } from '@/utils'

const theme = {
  scheme: 'monokai',
  author: 'wimer hazenberg (http://www.monokai.nl)',
  base00: 'transparent',
  base01: '#383830',
  base02: '#49483e',
  base03: '#75715e',
  base04: '#a59f85',
  base05: '#f8f8f2',
  base06: '#f5f4f1',
  base07: '#f9f8f5',
  base08: '#f92672',
  base09: '#fd971f',
  base0A: '#f4bf75',
  base0B: '#a6e22e',
  base0C: '#a1efe4',
  base0D: '#66d9ef',
  base0E: '#ae81ff',
  base0F: '#cc6633',
}

type View = 'state' | 'stack'

const StackLine = ({ item, index }: { item: StackItem | StackItem[]; index: number }) => {
  const [collapsed, setCollapsed] = useState(true)
  if (Array.isArray(item)) {
    return (
      <>
        {collapsed ? (
          <tr className="collapsed-control-tr">
            <td colSpan={2}>
              <span className="collapsed-control" onClick={() => setCollapsed(false)}>
                <div>折叠了{item.length}条您可能不需要的内容</div>
                <span>展开</span>
              </span>
            </td>
          </tr>
        ) : (
          <>
            {item.map((item, index) => (
              <StackLine key={index} item={item} index={index} />
            ))}
            <tr className="collapsed-control-tr">
              <td colSpan={2}>
                <span className="collapsed-control" onClick={() => setCollapsed(true)}>
                  <div>您可能不需要这些内容</div>
                  <span>折叠</span>
                </span>
              </td>
            </tr>
          </>
        )}
      </>
    )
  }
  const flc = item.fileName + ':' + item.lineNumber + ':' + item.columnNumber

  const toResource = (url: string, lineNumber: number) => {
    chrome.devtools.panels.openResource(url.replace(/:\d*:\d*$/g, ''), lineNumber)
    return false
  }
  return (
    <tr key={index}>
      <td>{item.methodName ?? ''}</td>
      <td>
        <a href="javascript:" onClick={() => toResource(item.url, item.lineNumber)} title={item.url}>
          {flc}
        </a>
      </td>
    </tr>
  )
}

function StackView({ stack: sk0 }: { stack?: string }) {
  if (!sk0) return null

  const stack = new Stack(sk0)

  const lines: (StackItem | StackItem[])[] = []

  for (
    let i = stack.stackList[0]?.methodName?.endsWith('.rabbitctActionSubmitEnvironment') ? 1 : 0;
    i < stack.stackList.length;
    i++
  ) {
    const item = stack.stackList[i]
    if (item.path.startsWith('/node_modules')) {
      const last = lines[lines.length - 1]
      if (Array.isArray(last)) {
        last.push(item)
      } else {
        lines.push([item])
      }
    } else {
      lines.push(item)
    }
  }

  return (
    <table cellSpacing={0} className="stack-table">
      <colgroup>
        <col width="50%" />
        <col width="50%" />
      </colgroup>
      <thead>
        <tr>
          <th>方法名</th>
          <th>调用位置</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((item, index) => (
          <StackLine
            key={index}
            {...{
              item,
              index,
            }}
          />
        ))}
      </tbody>
    </table>
  )
}

const viewModes = ['state', 'stack']

const History = () => {
  const { activeHistory } = usePanelStore()

  const [view, setView] = useState<View>('state')

  const contentMap: Record<View, React.ReactNode> = {
    state: (
      <div>
        <div style={{ padding: '0 10px' }}>
          <JSONTree theme={theme} data={activeHistory.state} />
        </div>
      </div>
    ),
    stack: (
      <div>
        <StackView stack={activeHistory.stack} />
      </div>
    ),
  }

  const formatTime = (date: number) => {
    return dayjs(date).format('HH:mm:ss:SSS')
  }

  return (
    <Layout className="history">
      <Layout.Header>
        <Flex justify="space-between">
          <Space>
            {activeHistory.endTime && (
              <Flex gap={6}>
                <ClockCircleOutlined style={{ fontSize: 20 }} />
                <Flex vertical gap={2}>
                  <Tag color="cyan">{formatTime(activeHistory.startTime)}</Tag>
                  <Tag color="orange">{formatTime(activeHistory.endTime)}</Tag>
                </Flex>
              </Flex>
            )}
          </Space>
          <Space>
            <Radio.Group
              className="history-view-mode"
              options={viewModes}
              onChange={(e) => setView(e.target.value)}
              value={view}
              optionType="button"
              buttonStyle="solid"
              size="small"
            />
          </Space>
        </Flex>
      </Layout.Header>
      <Layout.Content style={{ overflow: 'auto' }}>{contentMap[view]}</Layout.Content>
    </Layout>
  )
}

export default History
