import MessageCore, { AcceptMap, ResponseMap } from './MessageCore'
import { CECS, Environment, Message, MessageOption, SendOption } from './public'
import WindowMessage from './WindowMessage'

export class Injected<
  P extends Record<string, any> = AcceptMap,
  R extends Record<string, any> = ResponseMap,
> extends MessageCore<'injected', P, R> {
  environment = 'injected' as const

  contentReady = false
  popupReady = false
  optionsReady = false
  devtoolsReady = false

  constructor(option?: MessageOption) {
    super(option)
  }

  needToReady(env: Environment, option?: SendOption): boolean {
    if (!this.contentReady) return true
    if (env === 'content') return false
    if (env === 'popup') return !this.popupReady
    if (env === 'options') return !this.optionsReady
    if (option?.tab) return false
    if (env === 'devtools') return !this.devtoolsReady
    return false
  }

  addReadyEnv(env: Environment): void {
    switch (env) {
      case 'content':
        this.contentReady = true
        this.executionWaitQueue('content')
        this.sendReadySignal('injected')
        this.sendReadySignal('devtools')
        break
      case 'popup':
        this.popupReady = true
        this.executionWaitQueue('popup')
        break
      case 'options':
        this.executionWaitQueue('options')
        this.optionsReady = true
        break
      case 'devtools':
        console.log('addReadyEnv', new Date().toLocaleTimeString())
        this.executionWaitQueue('devtools')
        this.devtoolsReady = true
        break
    }
  }

  requestCore(message: Message): Promise<Message> {
    return WindowMessage.requestMessage(message, this.environment, true)
  }

  postCore(message: Message): void {
    WindowMessage.requestMessage(message, this.environment)
  }

  listenCore(): void {
    WindowMessage.addResponse(async (message) => {
      if (message[CECS] && message.to === this.environment) {
        if (message.type === 'request') {
          return this.emitResponse(message)
        } else if (message.type === 'post') {
          this.emitPost(message)
        }
      }
    })
    this.sendReadySignal('content')
  }
}
