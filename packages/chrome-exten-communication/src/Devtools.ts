import Browser from 'webextension-polyfill'
import ExtensionMessage from './ExtensionMessage'
import MessageCore, { AcceptMap, ResponseMap } from './MessageCore'
import { CECS, Environment, Message, MessageOption, SendOption } from './public'

export class Devtools<
  P extends Record<string, any> = AcceptMap,
  R extends Record<string, any> = ResponseMap,
> extends MessageCore<'devtools', P, R> {
  environment = 'devtools' as const

  backgroundConnect?: Browser.Runtime.Port

  injectedReady = false
  popupReady = false
  optionsReady = false
  contentReady = false

  constructor(option?: MessageOption) {
    super(option)
  }

  needToReady(env: Environment, option?: SendOption | undefined): boolean {
    if (!this.backgroundConnect) return true
    if (env === 'popup') return !this.popupReady
    if (env === 'options') return !this.optionsReady
    if (option?.tab) return false
    if (env === 'injected') return !this.injectedReady
    if (env === 'content') return !this.contentReady
    return false
  }

  addReadyEnv(env: Environment): void {
    switch (env) {
      case 'content':
        this.contentReady = true
        this.executionWaitQueue('content')
        this.sendReadySignal('injected')
        break
      case 'popup':
        this.popupReady = true
        this.executionWaitQueue('popup')
        break
      case 'options':
        this.optionsReady = true
        this.executionWaitQueue('options')
        break
      case 'injected':
        this.injectedReady = true
        this.executionWaitQueue('injected')
        break
    }
  }

  requestCore(message: Message): Promise<Message> {
    return ExtensionMessage.requestMessagePort(message, this.environment, this.backgroundConnect!, true)
  }

  postCore(message: Message): void {
    ExtensionMessage.requestMessagePort(message, this.environment, this.backgroundConnect!)
  }

  listenCore(): void {
    console.log('listenCore')
    ExtensionMessage.sendConnect(
      (port) => {
        this.backgroundConnect = port
        ExtensionMessage.addResponsePort(async (message: Message) => {
          if (message[CECS] && message.to === this.environment) {
            if (message.type === 'request') {
              return await this.emitResponse(message)
            } else if (message.type === 'post') {
              this.emitPost(message)
            }
          }
        }, port)
        const envs: Environment[] = ['content', 'background', 'popup', 'popup', 'options']
        envs.forEach((env) => {
          this.sendReadySignal(env)
        })
      },
      () => {
        this.backgroundConnect = undefined
      },
      this.environment,
      'background',
    )
  }
}
