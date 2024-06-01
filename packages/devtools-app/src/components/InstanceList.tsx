import { Flex } from 'antd'
import classNames from 'classnames'
import { usePanelStore } from '../store/panel.ts'
import '../style/panel.scss'

const InstanceList = () => {
  const { instances, activeInstanceIndex, setActiveInstanceindex } = usePanelStore()

  return (
    <div className="instance-list">
      {instances.map((item, index) => (
        <Flex
          key={index}
          className={classNames(['list-item', { active: index === activeInstanceIndex }])}
          onClick={() => setActiveInstanceindex(index)}
        >
          <span className="name">{item}</span>
        </Flex>
      ))}
    </div>
  )
}

export default InstanceList
