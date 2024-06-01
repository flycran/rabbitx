import Browser from 'webextension-polyfill'
import ExtensionMessage from './ExtensionMessage'
import MessageCore, { AcceptMap, ResponseMap } from './MessageCore'
import { CECS, Environment, Message, MessageOption } from './public'

type ToEnvironment = Exclude<Environment, 'background'>

export class Background<
  P extends Record<string, any> = AcceptMap,
  R extends Record<string, any> = ResponseMap,
> extends MessageCore<'background', P, R> {
  environment = 'background' as const

  popupReady = false
  optionsReady = false

  devtoolsConnectMap = new Map<number, Browser.Runtime.Port>()
  contentConnectMap = new Map<number, Browser.Runtime.Port>()
  popupConnect?: Browser.Runtime.Port
  optionsConnect?: Browser.Runtime.Port

  constructor(option?: MessageOption) {
    super(option)
  }

  needToReady(env: ToEnvironment): boolean {
    if (env === 'popup') return !this.popupReady
    if (env === 'options') return !this.optionsReady
    return false
  }

  addReadyEnv(env: ToEnvironment): void {
    switch (env) {
      case 'popup':
        this.popupReady = true
        this.executionWaitQueue('popup')
        break
      case 'options':
        this.optionsReady = true
        this.executionWaitQueue('options')
        break
    }
  }

  async requestCore(message: Message): Promise<Message> {
    if (message.to === 'devtools') {
      return ExtensionMessage.requestMessagePortTab(message, this.environment, this.devtoolsConnectMap, undefined, true)
    } else if (message.to === 'content' || message.to === 'injected') {
      return ExtensionMessage.requestMessageTab(message, this.environment)
    } else {
      return ExtensionMessage.requestMessage(message, this.environment)
    }
  }

  postCore(message: Message): void {
    if (message.to === 'devtools') {
      ExtensionMessage.requestMessagePortTab(message, this.environment, this.devtoolsConnectMap, undefined)
    } else if (message.to === 'content' || message.to === 'injected') {
      ExtensionMessage.requestMessageTab(message, this.environment)
    } else {
      ExtensionMessage.requestMessage(message, this.environment)
    }
  }

  listenCore(): void {
    Browser.runtime.onMessage.addListener(async (message: Message, sender) => {
      if (message[CECS]) {
        if (message.to === this.environment) {
          if (message.type === 'request') {
            return this.emitResponse(message)
          } else if (message.type === 'post') {
            this.emitPost(message)
          }
        } else if (message.to === 'content' || message.to === 'injected') {
          return await ExtensionMessage.requestMessageTab(message, this.environment, sender.tab?.id)
        } else if (message.to === 'devtools') {
          if (message.type === 'request') {
            return await ExtensionMessage.requestMessagePortTab(
              message,
              this.environment,
              this.devtoolsConnectMap,
              sender.tab?.id,
              true,
            )
          } else {
            return await ExtensionMessage.requestMessagePortTab(
              message,
              this.environment,
              this.devtoolsConnectMap,
              sender.tab?.id,
            )
          }
        }
      }
    })

    // 与devtoolos建立连接
    ExtensionMessage.acceptConnect(
      (port, message) => {
        const tabId = message.payload
        this.devtoolsConnectMap.set(tabId, port)
        ExtensionMessage.addResponsePort(async (message: Message) => {
          if (message[CECS] && message.from !== this.environment) {
            if (message.to === this.environment) {
              if (message.type === 'response') {
                return await this.emitResponse(message)
              } else if (message.type === 'post') {
                this.emitPost(message)
              }
            } else if (message.to === 'injected' || message.to === 'content') {
              if (message.type === 'request') {
                return ExtensionMessage.requestMessageTab(message, this.environment, tabId)
              } else {
                ExtensionMessage.requestMessageTab(message, this.environment, tabId)
              }
            } else {
              if (message.type === 'request') {
                return ExtensionMessage.requestMessage(message, this.environment)
              } else {
                ExtensionMessage.requestMessage(message, this.environment)
              }
            }
          }
        }, port)
      },
      (_, message) => {
        const tabId = message.payload
        this.devtoolsConnectMap.delete(tabId)
      },
      this.environment,
      'devtools',
    )
  }
}
