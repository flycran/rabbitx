import { DataType, InstancesState } from 'rabbitx'
import EventEmitter from 'rabbitx/src/EventEmitter.ts'
import { myEnvironment } from './index.ts'

export interface Map {
  setDisplayHistoryIndex: { index: number; activeInstanceIndex: number }
  setActiveInstanceindex: { index: number }
  setActiveHistory: { index: number; activeInstanceIndex: number }
}

export const events = new EventEmitter<Map>()

export const usePanelStore = myEnvironment.createStore({
  name: 'panel',
  state: () => {
    return {
      instances: [] as string[],
      activeInstanceIndex: 0,
      instancesState: [] as InstancesState[],
      get history() {
        return this.instancesState[this.activeInstanceIndex].history
      },
      get activeHistory() {
        const is = this.instancesState[this.activeInstanceIndex]
        return is.history[is.activeHistoryIndex]
      },
    }
  },
  actions: () => {
    return {
      syncData({ state }, data: DataType) {
        Object.assign(state, data)
      },
      setActiveInstanceindex({ state }, index: number) {
        state.activeInstanceIndex = index
        events.emit('setActiveInstanceindex', {
          index,
        })
      },
      setActiveHistory({ state }, index: number) {
        state.instancesState[state.activeInstanceIndex].activeHistoryIndex = index
        events.emit('setActiveHistory', {
          index,
          activeInstanceIndex: state.activeInstanceIndex,
        })
      },
      setDisplayHistoryIndex({ state }, index: number) {
        const is = state.instancesState[state.activeInstanceIndex]
        is.displayHistoryIndex = index
        events.emit('setDisplayHistoryIndex', {
          index,
          activeInstanceIndex: state.activeInstanceIndex,
        })
      },
    }
  },
})
