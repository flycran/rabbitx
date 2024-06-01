import { Draft, Immer } from 'immer'
import React from 'react'
import EventEmitter, { GetPayload, GetReceiptPayload, Receipt } from './EventEmitter'

const immer = new Immer()

// 剔除第一个元素
type OmitFirst<T extends any[]> = T extends [any, ...infer U] ? U : never
// 剔除第一个参数
type OmitFirstParameters<T extends (...args: any[]) => any> = OmitFirst<Parameters<T>>

// 定义action
export type Action<S> = {
  [k: string]: (context: { state: Draft<PickWritable<S>> }, ...args: any[]) => any
}

// 包装action
export type BuildAction<S, A extends Action<S>> = {
  [key in keyof A]: (...args: OmitFirstParameters<A[key]>) => ReturnType<A[key]>
}

type PromiseReturnType<T> = T extends Promise<infer U> ? U : never

export type getStateType<R extends Rabbitx<any, any>> = R extends Rabbitx<infer S, any> ? S : never

export type GetContextType<R extends Rabbitx<any, any>> = { state: getStateType<R> }

export interface RabbitxOptions<S extends object, A extends Action<S>> {
  name: string
  state: S | (() => S)
  actions?: A | (() => A)
}

export type State = Record<string, any>

export interface RabbitxEventMap {
  instantiation: Rabbitx<any, any>
  useStore: {
    instance: Rabbitx<any, any>
  }
  getStore: {
    instance: Rabbitx<any, any>
    prop: string
  }
  emit: {
    instance: Rabbitx<any, any>
    type: keyof RabbitxEventMap
    payload: any
  }
  emitReceipt: Receipt<{
    instance: Rabbitx<any, any>
    type: keyof RabbitxEventMap
    payload: any
  }>
  dispacth: Receipt<
    {
      instance: Rabbitx<any, any>
      state: State
      action: string
      stack: string
      args: any[]
    },
    {
      state: State
    }
  >
}

export type IfEquals<X, Y, A = X, B = never> =
  (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? A : B

export type WritableKeys<T> = {
  [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P>
}[keyof T]

export type PickWritable<T> = Pick<T, WritableKeys<T>>

type ReadonlyKeys<T> = {
  [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, never, P>
}[keyof T]

export type PickReadonly<T> = Pick<T, ReadonlyKeys<T>>

export class Rabbitx<S extends State, A extends Action<S>> extends EventEmitter<RabbitxEventMap> {
  name: string
  historyDisplayIndex: number = -1
  readonly initialState: Readonly<PickWritable<S>>
  private state: Readonly<PickWritable<S>>
  private getterState: PickReadonly<S>
  private readonly actions: A
  private _listeners: Set<() => void> = new Set()

  constructor({ state, actions, name }: RabbitxOptions<S, A>) {
    super()
    this.name = name
    const state0 = typeof state === 'function' ? state() : state
    const [state1, getter] = this.separateGetterState(state0)
    this.state = state1
    this.initialState = state1
    this.getterState = getter
    if (typeof actions === 'function') actions = actions()
    this.actions = actions ?? ({} as A)
    this.emit('instantiation', this)
  }

  getState(): Readonly<PickWritable<S>> {
    return this.state
  }

  getAllState(): Readonly<S> {
    const o: any = { ...this.state }
    const ods = Object.getOwnPropertyDescriptors(this.getterState)
    Object.defineProperties(o, ods)
    return o
  }

  separateGetterState(state: S) {
    const state1: any = {}
    const getterState: any = {}
    const ods = Object.getOwnPropertyDescriptors(state)
    for (const key in ods) {
      if (ods[key].get) {
        Object.defineProperty(getterState, key, ods[key])
      } else {
        state1[key] = state[key]
      }
    }
    return [state1, getterState]
  }

  useStore(): Readonly<S> & BuildAction<S, A>

  useStore<T>(ps?: (state: Readonly<PickWritable<S>>) => T): T

  useStore(ps?: (state: Readonly<PickWritable<S>>) => any) {
    this.emit('useStore', {
      instance: this,
    })
    if (ps) {
      return React.useSyncExternalStore(
        this.subscribe.bind(this),
        () => ps(this.state),
        () => ps(this.initialState),
      )
    }
    return new Proxy<S & BuildAction<S, A>>(Object.create(null), {
      get: (_, key: string) => {
        if (key in this.state) {
          return React.useSyncExternalStore(
            this.subscribe.bind(this),
            () => this.state[key as keyof PickWritable<S>],
            () => this.initialState[key as keyof PickWritable<S>],
          )
        } else if (key in this.getterState) {
          return React.useSyncExternalStore(
            this.subscribe.bind(this),
            () => Object.getOwnPropertyDescriptor(this.getterState, key as ReadonlyKeys<S>)!.get!.call(this.state),
            () =>
              Object.getOwnPropertyDescriptor(this.getterState, key as ReadonlyKeys<S>)!.get!.call(this.initialState),
          )
        } else if (key in this.actions) {
          return this.rabbitctActionSubmitEnvironment.bind(this, key)
        }
      },
    })
  }

  emit<E extends keyof RabbitxEventMap>(type: E, payload: RabbitxEventMap[E]) {
    const res = super.emit('emit', {
      instance: this,
      type,
      payload,
    })
    const res1 = super.emit(type, payload)
    return res || res1
  }

  emitReceipt<E extends keyof RabbitxEventMap>(
    type: E,
    payload: GetPayload<RabbitxEventMap, E>,
  ): (...args: any[]) => void {
    const res = super.emitReceipt('emitReceipt', {
      instance: this,
      type,
      payload,
    })
    const res1 = super.emitReceipt(type, payload)
    return (p: GetReceiptPayload<RabbitxEventMap, E>) => {
      res(p)
      res1(p)
    }
  }

  useActions() {
    return new Proxy<BuildAction<S, A>>(Object.create(null), {
      get: (_, key: string) => {
        if (key in this.actions) {
          return this.rabbitctActionSubmitEnvironment.bind(this, key)
        }
      },
    })
  }

  setState(state: S) {
    this.state = { ...state }
    this._listeners.forEach((listener) => listener())
  }

  private subscribe(listener: () => void) {
    this._listeners.add(listener)
    return () => {
      this._listeners.delete(listener)
    }
  }

  private rabbitctActionSubmitEnvironment(key: string, ...args: any[]) {
    const action = this.actions[key]
    const receip = this.emitReceipt('dispacth', {
      instance: this,
      state: this.state,
      action: key,
      args: args,
      stack: new Error().stack || '',
    })
    const draft = immer.createDraft(this.state)
    const context = { state: draft }
    const result = action.call(this.actions, context, ...args)
    const finish = () => {
      const newState = immer.finishDraft(draft) as S
      this.setState(newState)
      this._listeners.forEach((listener) => listener())
      receip({
        state: newState,
      })
      return newState
    }
    if (result instanceof Promise) {
      return new Promise<PromiseReturnType<A[keyof A]>>((resolve, reject) => {
        result
          .then((res) => {
            finish()
            resolve(res)
          })
          .catch((err) => {
            reject(err)
          })
      }) as ReturnType<A[keyof A]>
    }
    finish()
    return result as ReturnType<A[keyof A]>
  }
}
