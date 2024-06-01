import { Injected } from 'chrome-exten-communication/Injected'
import { Environment } from './Environment'
import { Rabbitx, State } from './Rabbitx'

export interface AcceptMap {}

export interface ResponseMap {
  init(): DataType

  syncData(p: DataType): void

  setDisplayHistoryIndex(p: { index: number; activeInstanceIndex: number }): DataType

  setActiveInstanceindex(p: { index: number }): DataType

  setActiveHistory(p: { index: number; activeInstanceIndex: number }): DataType

  restore(p: { name: string; index: number }): void

  reset(p: { name: string }): void
}

const injectedMessage = new Injected<AcceptMap, ResponseMap>()

window.injectedMessage = injectedMessage

export interface HistoryType {
  action: string
  oldState: State
  state?: State
  startTime: number
  endTime?: number
  error?: unknown
  stack?: string
}

export interface InstancesState {
  history: HistoryType[]
  activeHistoryIndex: number
  displayHistoryIndex: number
}

export interface DataType {
  instances: string[]
  activeInstanceIndex: number
  instancesState: InstancesState[]
}

const environments = [] as Environment[]

export const devtoolsPlugin = () => {
  return (env: Environment) => {
    environments.push(env)
    const instanceMap = new Map<string, Rabbitx<any, any>>()
    const data: DataType = {
      instances: [],
      activeInstanceIndex: 0,
      instancesState: [],
    }
    env
      .on('instantiation', (ins) => {
        instanceMap.set(ins.name, ins)
        data.instances.push(ins.name)
        data.instancesState.push({
          history: [
            {
              action: '@init',
              oldState: ins.initialState,
              state: ins.initialState,
              startTime: Date.now(),
              endTime: Date.now(),
            },
          ],
          activeHistoryIndex: 0,
          displayHistoryIndex: 0,
        })
        injectedMessage.request('devtools', 'syncData', data)
      })
      .on('dispacth', ({ instance, state, stack, action }) => {
        const history: HistoryType = {
          startTime: Date.now(),
          oldState: state,
          stack,
          action,
        }
        const i = data.instances.indexOf(instance.name)
        const is = data.instancesState[i]
        const index = is.history.length - 1
        if (is.activeHistoryIndex === index) {
          is.activeHistoryIndex++
        }
        if (is.displayHistoryIndex === index) {
          is.displayHistoryIndex++
        }
        is.history.push(history)
        injectedMessage.request('devtools', 'syncData', data)
        return (p2) => {
          const his = data.instancesState[i].history[index + 1]
          his.state = p2.state
          his.endTime = Date.now()
          injectedMessage.request('devtools', 'syncData', data)
        }
      })

    env.instanceSet.forEach((ins) => {
      env.emit('instantiation', ins)
    })
    injectedMessage
      .onResponse('setActiveInstanceindex', ({ index }) => {
        data.activeInstanceIndex = index
        return data
      })
      .onResponse('setActiveHistory', ({ index, activeInstanceIndex }) => {
        data.instancesState[activeInstanceIndex].activeHistoryIndex = index
        return data
      })
      .onResponse('setDisplayHistoryIndex', ({ index, activeInstanceIndex }) => {
        const is = data.instancesState[activeInstanceIndex]
        is.displayHistoryIndex = index
        return data
      })
      .onResponse('restore', (payload) => {
        const ins = instanceMap.get(payload.name)
        if (ins) {
          const i = data.instances.indexOf(ins.name)
          const is = data.instancesState[i]
          ins.setState(is.history[payload.index])
        }
        injectedMessage.request('devtools', 'syncData', data)
      })
      .onResponse('init', () => {
        return data
      })
      .onResponse('reset', (payload) => {
        const ins = instanceMap.get(payload.name)
        if (ins) {
          const i = data.instances.indexOf(ins.name)
          const is = data.instancesState[i]
          is.history = [is.history[0]]
          is.activeHistoryIndex = 0
          is.displayHistoryIndex = 0
          ins.setState(ins.initialState)
        }
        injectedMessage.request('devtools', 'syncData', data)
      })
  }
}
