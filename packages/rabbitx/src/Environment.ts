import { devtoolsPlugin } from './devtools'
import EventEmitter from './EventEmitter'
import { Action, BuildAction, Rabbitx, RabbitxEventMap, RabbitxOptions, State } from './Rabbitx'

export type EnvironmentConfig = {
  devtools?: boolean
}

export interface UseStore<S extends State, A extends Action<S>> {
  actions: BuildAction<S, A>

  instance: Rabbitx<any, any>

  (): S & BuildAction<S, A>

  <T>(ps?: (state: S) => T): T
}

export class Environment extends EventEmitter<RabbitxEventMap> {
  CONSTRUCTOR: typeof Rabbitx

  name: string

  instanceSet: Set<Rabbitx<any, any>> = new Set()

  constructor(name: string, rab: typeof Rabbitx = Rabbitx) {
    super()
    this.name = name
    this.CONSTRUCTOR = rab
  }

  createStore<S extends State, A extends Action<S>>(options: RabbitxOptions<S, A>): UseStore<S, A> {
    const store = this.instantiation(options)

    const useStore = ((ps?: (state: S) => any) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      return store.useStore(ps)
    }) as UseStore<S, A>

    useStore.actions = store.useActions()
    useStore.instance = store

    return useStore
  }

  buildCreateStore() {
    return this.createStore.bind(this)
  }

  instantiation<S extends State, A extends Action<S>>(options: RabbitxOptions<S, A>) {
    const store = new this.CONSTRUCTOR(options)
    this.emit('instantiation', store)
    store.on('emit', (p) => this.emit(p.type, p.payload))
    store.on('emitReceipt', (p) => this.emitReceipt(p.type, p.payload) as any)
    this.instanceSet.add(store)
    return store
  }

  usePlugin(plugin: (env: Environment) => void) {
    plugin(this)
  }

  config(config: EnvironmentConfig) {
    if (config.devtools) {
      this.usePlugin(devtoolsPlugin())
    }
  }
}

export const environment = new Environment('default')
