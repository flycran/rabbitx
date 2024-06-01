import { Flex, Slider } from 'antd'
import { usePanelStore } from '../store/panel.ts'

const MyFooter = () => {
  const { setDisplayHistoryIndex } = usePanelStore()
  const history = usePanelStore((state) => {
    if (!state.instances.length) return
    return state.instancesState[state.activeInstanceIndex].history
  })

  const displayHistoryIndex = usePanelStore((state) => {
    if (!state.instances.length) return 0
    return state.instancesState[state.activeInstanceIndex].displayHistoryIndex
  })

  return (
    <Flex className="my-footer" gap={8} align="center">
      <div>
        {displayHistoryIndex}/{history ? history.length - 1 : 0}
      </div>
      <Slider
        disabled={!history}
        className="time-travel"
        value={displayHistoryIndex}
        max={history ? history.length - 1 : 0}
        onChange={setDisplayHistoryIndex}
      />
      <div>111111</div>
    </Flex>
  )
}

export default MyFooter
