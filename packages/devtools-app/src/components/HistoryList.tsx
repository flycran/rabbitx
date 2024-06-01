import { LoadingOutlined } from '@ant-design/icons'
import { Flex, Space } from 'antd'
import classNames from 'classnames'
import dayjs from 'dayjs'
import { usePanelStore } from '../store/panel.ts'

const HistoryList = () => {
  const { setActiveHistory } = usePanelStore()
  const history = usePanelStore((state) => state.instancesState[state.activeInstanceIndex].history)
  const activeHistory = usePanelStore((state) => state.instancesState[state.activeInstanceIndex].activeHistoryIndex)

  return (
    <div className="history-list">
      {history.map((item, index) => (
        <Flex
          key={index}
          justify="space-between"
          className={classNames(['list-item', { active: index === activeHistory }])}
          onClick={() => setActiveHistory(index)}
        >
          <span className="name">{item.action}</span>
          <Flex className="right">
            <Space size="small">
              {!item.endTime && <LoadingOutlined />}
              <div className="start-time">{dayjs(item.startTime).format('HH:mm:ss')}</div>
            </Space>
          </Flex>
        </Flex>
      ))}
    </div>
  )
}

export default HistoryList
