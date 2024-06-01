import { CompassOutlined } from '@ant-design/icons'
import { App, Button, ConfigProvider, Empty, Flex, Layout, Result, Tour, TourProps } from 'antd'
import classNames from 'classnames'
import { memo, useState } from 'react'
import History from '../components/History.tsx'
import HistoryList from '../components/HistoryList.tsx'
import InstanceList from '../components/InstanceList.tsx'
import MyFooter from '../components/MyFooter.tsx'
import SlideSidebar from '../components/SlideSidebar.tsx'
import { useIsDark } from '../hooks'
import { usePanelStore } from '../store/panel.ts'
import { darkTheme, theme } from '../utils/theme.ts'

const steps: TourProps['steps'] = [
  {
    title: '欢迎使用Rabbitx Devtools',
    description: '即将开始播放使用指南！',
  },
  {
    title: '实例列表',
    description: '从这里切换不同的实例。',
    placement: 'right',
    target: () => document.querySelector('.instance-list') as HTMLElement,
  },
  {
    title: '历史提交列表',
    description: '从这里查看提交的历史记录。@init表示初始化状态。',
    placement: 'right',
    target: () => document.querySelector('.history-list') as HTMLElement,
  },
  {
    title: '提交显示模式',
    description: '点击切换查看该提交的不同信息。',
    placement: 'leftBottom',
    target: () => document.querySelector('.history-view-mode') as HTMLElement,
  },
  {
    title: '时间旅行器',
    description: '在这里进行时间旅行，可以查看历史提交的状态。',
    target: () => document.querySelector('.my-footer') as HTMLElement,
  },
  {
    title: '指南结束',
    description: '您已经掌握了Rabbitx Devtools的核心功能，点击下方结束指南。',
  },
]

const StartTour = () => {
  const [openTour, setOpenTour] = useState(false)
  return (
    <>
      <Tour open={openTour} onClose={() => setOpenTour(false)} steps={steps} />
      <Button
        onClick={() => {
          setOpenTour(true)
        }}
        type="text"
        icon={<CompassOutlined />}
      />
    </>
  )
}

const Panel = memo(() => {
  const yesInstance = usePanelStore((state) => !!state.instances.length)
  const isDark = useIsDark()
  return (
    <ConfigProvider theme={isDark ? darkTheme : theme}>
      <App style={{ height: '100%' }}>
        <Layout id="panel-root" className={classNames({ dark: isDark })}>
          <Layout.Header
            style={{
              height: 32,
              padding: 0,
            }}
          >
            <Flex style={{ height: '100%' }} align="center" gap={4}>
              <StartTour />
            </Flex>
          </Layout.Header>
          <Layout hasSider>
            <SlideSidebar className="instance-sider" width={120} min={50} max={200} safeDistance={350}>
              {yesInstance ? (
                <InstanceList />
              ) : (
                <Flex style={{ height: '100%' }} justify="center" align="center">
                  <Empty description="暂无实例" />
                </Flex>
              )}
            </SlideSidebar>
            <Layout hasSider className="history-layout">
              {yesInstance ? (
                <>
                  <SlideSidebar className="history-sider" width={200} min={100} max={350} safeDistance={240}>
                    <HistoryList />
                  </SlideSidebar>
                  <Layout.Content style={{ minWidth: 240 }}>
                    <History />
                  </Layout.Content>
                </>
              ) : (
                <Result
                  className="no-instance-result"
                  status="warning"
                  title="请选择一个实例来查看历史提交"
                  extra={<span>如果你的实例不在此页面中，请通过Rabbitx devtools server连接到Devtools。</span>}
                />
              )}
            </Layout>
          </Layout>
          <Layout.Footer
            style={{
              padding: 0,
            }}
          >
            <MyFooter />
          </Layout.Footer>
        </Layout>
      </App>
    </ConfigProvider>
  )
})

export default Panel
