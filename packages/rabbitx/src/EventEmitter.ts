import { EventEmitter as EET } from 'events'

export interface Receipt<P = any, R = any> {
  LP: P
  RP: R
}

export interface Map {
  [key: string]: Receipt | any
}

export type Listener<M extends Map = any, E extends keyof M = any> = (
  p: M[E] extends Receipt<infer P, any> ? P : M[E],
) => M[E] extends Receipt<any, infer R> ? ((p: R) => void) | void : void

export type GetPayload<M extends Map = any, E extends keyof M = any> = M[E] extends Receipt<infer P, any> ? P : M[E]

export type GetReceiptPayload<M extends Map = any, E extends keyof M = any> =
  M[E] extends Receipt<any, infer R> ? R : never

export type GetReceipt<M extends Map = any, E extends keyof M = any> =
  M[E] extends Receipt<any, infer R> ? (p: R) => void : never

export default class EventEmitter<M extends Map> {
  private eventEmitter = new EET()

  emit<E extends keyof M>(type: E, payload: M[E]) {
    return this.eventEmitter.emit(type as string, payload)
  }

  emitReceipt<E extends keyof M>(type: E, payload: GetPayload<M, E>) {
    const listeners = this.listeners(type)
    const receipts = listeners.map((listener) => listener.call(this, payload))

    return (p: GetReceiptPayload<M, E>) => {
      receipts.forEach((receipt) => {
        if (typeof receipt === 'function') {
          receipt(p)
        }
      })
    }
  }

  on<E extends keyof M>(type: E, listener: Listener<M, E>) {
    this.eventEmitter.on(type as string, listener)
    return this
  }

  onList<E extends keyof M>(type: E, listeners: Listener<M, E>[]) {
    listeners.forEach((listener) => {
      this.eventEmitter.on(type as string, listener)
    })
  }

  onWaitOff<E extends keyof M>(type: E, listener: Listener<M, E>) {
    this.eventEmitter.on(type as string, listener)
    /** unmount event */
    return () => {
      this.eventEmitter.off(type as string, listener)
    }
  }

  onWaitOffList<E extends keyof M>(type: E, listeners: Listener<M, E>[]) {
    listeners.forEach((listener) => {
      this.eventEmitter.on(type as string, listener)
    })
    /** unmount event */
    return () => {
      listeners.forEach((listener) => {
        this.eventEmitter.off(type as string, listener)
      })
    }
  }

  once<E extends keyof M>(type: E, listener: Listener<M, E>) {
    return this.eventEmitter.once(type as string, listener)
  }

  onceList<E extends keyof M>(type: E, listeners: Listener<M, E>[]) {
    listeners.forEach((listener) => {
      this.eventEmitter.once(type as string, listener)
    })
  }

  off<E extends keyof M>(type: E, listener: Listener<M, E>) {
    return this.eventEmitter.off(type as string, listener)
  }

  offList<E extends keyof M>(type: E, listeners: Listener<M, E>[]) {
    listeners.forEach((listener) => {
      this.eventEmitter.off(type as string, listener)
    })
  }

  listeners<E extends keyof M>(type: E) {
    return this.eventEmitter.listeners(type as string) as Listener<M, E>[]
  }

  rawListeners<E extends keyof M>(type: E) {
    return this.eventEmitter.rawListeners(type as string) as Listener<M, E>[]
  }

  eventNames() {
    return this.eventEmitter.eventNames() as (keyof M)[]
  }
}
