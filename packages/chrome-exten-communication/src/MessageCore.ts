import { v4 } from 'uuid'
import {
  allEnv,
  BroadcastOption,
  CECS,
  Environment,
  ExtensionMessageError,
  Message,
  MessageOption,
  ResponseError,
  SendOption,
  stringifyError,
} from './public'

export interface AcceptMap {}

export interface ResponseMap {}

export interface Payload {
  type: string
  payload: any
}

export type Listener<P extends Record<string, any> = any, T extends keyof P = any> = (p: P[T], m: Message) => void

export type Response<R extends Record<string, any>, T extends keyof R = any> = (
  p: Parameters<R[T]>[0],
  m: Message,
) => ReturnType<R[T]> | Promise<ReturnType<R[T]>>

export type ResponsePayload<R extends Record<string, (p: any) => any> = any, T extends keyof R = any> = Parameters<
  R[T]
>[0]

export type ResponseReturn<R extends Record<string, (p: any) => any> = any, T extends keyof R = any> = ReturnType<R[T]>

export default abstract class MessageCore<
  E extends Environment,
  P extends Record<string, any> = any,
  R extends Record<string, any> = any,
> {
  abstract environment: E
  readonly name: string
  private listened = false
  private waitingQueue = new Map<Environment, (() => void)[]>()
  private readonly option?: MessageOption
  private acceptListenerMap = new Map<keyof P, Set<Listener<P>>>()
  private responseListenerMap = new Map<keyof R, Response<R>>()

  protected constructor(option?: MessageOption) {
    this.option = option
    this.name = option?.name || 'main'
    if (option?.listen) {
      this.listen()
    } else if (option?.listen === undefined) {
      Promise.resolve().then(() => {
        this.listen()
      })
    }
  }

  abstract requestCore(message: Message): Promise<Message>

  abstract postCore(message: Message): void

  abstract listenCore(): void

  abstract needToReady(env: Environment, option?: SendOption): boolean

  abstract addReadyEnv(env: Environment, message: Message): void

  testRequest(to: Exclude<Environment, E>, payload: any, option?: SendOption): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (to === this.environment)
      throw new ExtensionMessageError(
        `Unable send message to self, please check the environment: ${this.environment}, and name: ${this.name}.`,
      )
    const uuid = v4()
    const message: Message = {
      [CECS]: true,
      from: this.environment,
      fromName: this.name,
      to,
      toName: option?.name ?? 'main',
      eventType: '',
      type: 'request',
      payload,
      test: true,
      uuid,
      option,
    }

    return this.handlingRequestsAndWaitingQueues(message)
  }

  /**
   *
   * @deprecated 此方法只能绑定一个事件，请使用 onResponse
   * @param listener
   */
  testResponse(listener?: (payload: any, message: Message) => any): void {
    this.testResponseListener = listener
  }

  testPost(to: Exclude<Environment, E>, payload: any, option?: SendOption): void {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (to === this.environment)
      throw new ExtensionMessageError(
        `Unable send message to self, please check the environment: ${this.environment}, and name: ${this.name}.`,
      )
    const uuid = v4()
    const message: Message = {
      [CECS]: true,
      from: this.environment,
      fromName: this.name,
      to,
      toName: option?.name ?? 'main',
      eventType: '',
      type: 'post',
      payload,
      test: true,
      uuid,
      option,
    }
    this.postCore(message)
  }

  /**
   *
   * @deprecated 此方法只能绑定一个事件，请使用 onAccept
   * @param listener
   */
  testAccept(listener?: (payload: any, message: Message) => void): void {
    this.testPostListener = listener
  }

  listen() {
    if (this.listened) return
    this.listened = true
    this.listenCore?.()
  }

  emitPost(message: Message): void {
    if (message.test) {
      this.testPostListener?.(message.payload, message)
    } else {
      this.emitPostEvent(message.payload.type, message.payload.payload, message)
    }
  }

  async emitResponse(message: Message): Promise<Message> {
    const ms: Message = {
      [CECS]: true,
      from: this.environment,
      fromName: this.name,
      to: message.from,
      toName: message.fromName,
      eventType: message.eventType,
      type: 'response',
      payload: null,
      uuid: message.uuid,
    }
    if (message.readySignal) {
      this.addReadyEnv(message.from, message)
      return {
        ...ms,
        readySignal: true,
      }
    }
    try {
      if (message.test) {
        const res = await this.testResponseListener?.(message.payload, message)
        return {
          ...ms,
          payload: res,
        }
      } else {
        const res = await this.emitResponseEvent(message.eventType as keyof R, message.payload, message)
        return {
          ...ms,
          payload: res,
        }
      }
    } catch (err) {
      return {
        ...ms,
        errorEnv: this.environment,
        error: stringifyError(err),
      }
    }
  }

  async sendReadySignal(env: Environment) {
    const uuid = v4()
    if (env === this.environment) return
    try {
      const res = await this.requestCore({
        [CECS]: true,
        from: this.environment,
        fromName: this.name,
        to: env,
        toName: 'main',
        eventType: '',
        readySignal: true,
        type: 'request',
        payload: null,
        uuid,
      })
      if (res && !res.error) {
        this.addReadyEnv(res.from, res)
        return res
      }
    } catch (err) {
      console.log('catch', err, env)
    }
  }

  executionWaitQueue(env: Environment) {
    if (this.waitingQueue.has(env)) {
      this.waitingQueue.get(env)!.forEach((fn) => fn())
      this.waitingQueue.delete(env)
    }
  }

  handlingRequestsAndWaitingQueues(message: Message): Promise<any> {
    const executor = async () => {
      const res = await this.requestCore(message)
      if (message.error) {
        if (this.option?.onCatch) {
          return this.option.onCatch(message.error, message)
        } else {
          throw new ResponseError(message.error)
        }
      }
      return res.payload
    }
    if (this.needToReady(message.to, message.option)) {
      return new Promise((resolve, reject) => {
        const waiter = () => {
          executor().then(resolve).catch(reject)
        }
        if (this.waitingQueue.has(message.to)) {
          this.waitingQueue.get(message.to)!.push(waiter)
        } else {
          this.waitingQueue.set(message.to, [waiter])
        }
      })
    } else {
      return executor()
    }
  }

  post<T extends keyof P & (string | number)>(
    to: Exclude<Environment, E>,
    type: T,
    payload: P[T],
    option?: SendOption,
  ) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (to === this.environment)
      throw new ExtensionMessageError(
        `Unable send message to self, please check the environment: ${this.environment}, and name: ${this.name}.`,
      )
    const uuid = v4()
    const message: Message = {
      [CECS]: true,
      from: this.environment,
      fromName: this.name,
      to,
      toName: option?.name ?? 'main',
      eventType: type,
      type: 'post',
      payload,
      uuid,
      option,
    }
    this.postCore(message)
  }

  request<T extends keyof R & (string | number)>(
    to: Exclude<Environment, E>,
    type: T,
    payload: ResponsePayload<R, T>,
    option?: SendOption,
  ): Promise<ResponseReturn<R, T>> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    if (to === this.environment)
      throw new ExtensionMessageError(
        `Unable send message to self, please check the environment: ${this.environment}, and name: ${this.name}.`,
      )
    const uuid = v4()
    const message: Message = {
      [CECS]: true,
      from: this.environment,
      fromName: this.name,
      to,
      toName: option?.name ?? 'main',
      eventType: type,
      type: 'request',
      payload,
      uuid,
      option,
    }

    return this.handlingRequestsAndWaitingQueues(message)
  }

  broadcast<T extends keyof P & (string | number)>(type: T, payload: P[T], option?: BroadcastOption) {
    void (option?.to ?? allEnv).forEach((to) => {
      const uuid = v4()
      const message: Message = {
        [CECS]: true,
        from: this.environment,
        fromName: this.name,
        to,
        toName: option?.name ?? 'main',
        eventType: type,
        type: 'post',
        payload,
        uuid,
        option,
      }
      this.postCore(message)
    })
  }

  async broadcastRequest<T extends keyof R & (string | number)>(
    type: T,
    payload: R[T],
    option?: BroadcastOption,
  ): Promise<Message<ResponseReturn<R, T>>[]> {
    const message: Message = {
      [CECS]: true,
      from: this.environment,
      fromName: this.name,
      to: this.environment,
      toName: option?.name ?? 'main',
      eventType: type,
      type: 'request',
      payload,
      uuid: '',
      option,
    }
    return await Promise.all(
      (option?.to ?? allEnv).map((to) =>
        this.requestCore({
          ...message,
          uuid: v4(),
          to,
        }),
      ),
    )
  }

  onAccept<T extends keyof P>(type: T, listener: Listener<P, T>) {
    if (!this.acceptListenerMap.has(type)) {
      this.acceptListenerMap.set(type, new Set())
    }
    this.acceptListenerMap.get(type)!.add(listener)
    return this
  }

  offAccept<T extends keyof P>(type: T, listener: Listener<P, T>) {
    if (!this.acceptListenerMap.has(type)) {
      return
    }
    this.acceptListenerMap.get(type)!.delete(listener)
    return this
  }

  onResponse<T extends keyof R>(type: T, listener: Response<R, T>) {
    if (this.responseListenerMap.has(type)) {
      throw new Error(`ChromeMessageEventEmitter: duplicate binding ${type as string} response event`)
    } else {
      this.responseListenerMap.set(type, listener)
    }
    return this
  }

  offResponse<T extends keyof R>(type: T) {
    this.responseListenerMap.delete(type)
    return this
  }

  emitPostEvent<T extends keyof P>(type: T, payload: P[T], message: Message) {
    if (this.acceptListenerMap.has(type)) {
      this.acceptListenerMap.get(type)!.forEach((listener) => listener(payload, message))
    }
  }

  emitResponseEvent<E extends keyof R>(type: E, payload: R[E], message: Message) {
    if (this.responseListenerMap.has(type)) {
      return this.responseListenerMap.get(type)!(payload, message)
    }
  }

  private testPostListener?: (payload: any, message: Message) => void = (_, message) => {
    console.log('This is a test Post', message)
  }

  private testResponseListener?: (payload: any, message: Message) => any = (_, message) => {
    console.log('This is a test request', message)
    return 'This is a test response'
  }
}
