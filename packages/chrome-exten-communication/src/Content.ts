import Browser from 'webextension-polyfill'
import ExtensionMessage from './ExtensionMessage'
import MessageCore, { AcceptMap, ResponseMap } from './MessageCore'
import { CECS, Environment, Message, MessageOption, SendOption } from './public'
import WindowMessage from './WindowMessage'

export class Content<
  P extends Record<string, any> = AcceptMap,
  R extends Record<string, any> = ResponseMap,
> extends MessageCore<'content', P, R> {
  environment = 'content' as const
  needToReadyEnvs: Environment[] = ['injected', 'devtools']
  needFromReadyEnvs: Environment[] = ['injected', 'devtools']
  private _backgroundListener?: (message: Message) => any

  constructor(option?: MessageOption) {
    super(option)
  }

  private _injectedReady = false

  get injectedReady() {
    return this._injectedReady
  }

  private _popupReady = false

  get popupReady() {
    return this._popupReady
  }

  private _optionsReady = false

  get optionsReady() {
    return this._optionsReady
  }

  private _devtoolsReady = false

  get devtoolsReady() {
    return this._devtoolsReady
  }

  private _backgroundConnect?: Browser.Runtime.Port

  get backgroundConnect() {
    return this._backgroundConnect
  }

  // 使用长连接
  useConnect() {
    ExtensionMessage.sendConnect(
      (port) => {
        ExtensionMessage.addResponsePort((message: Message) => {
          if (message[CECS] && message.from !== this.environment) {
            // from not injected
            return this.fromBackground(message)
          }
        }, port)
        this._backgroundConnect = port
        this.deprecatedListener()
      },
      () => {
        this._backgroundConnect = undefined
        this.useListener()
        this.addReadyEnv('background')
      },
      this.environment,
      'background',
    )
  }

  // 关闭连接
  disconnect() {
    this._backgroundConnect?.disconnect()
  }

  needToReady(env: Environment, option?: SendOption | undefined): boolean {
    if (env === 'injected') return !this._injectedReady
    if (env === 'popup') return !this._popupReady
    if (env === 'options') return !this._optionsReady
    if (option?.tab) return false
    if (env === 'devtools') return !this._devtoolsReady
    return false
  }

  addReadyEnv(env: Environment): void {
    switch (env) {
      case 'injected':
        this._injectedReady = true
        this.executionWaitQueue('injected')
        break
      case 'popup':
        this._popupReady = true
        this.executionWaitQueue('popup')
        break
      case 'options':
        this._optionsReady = true
        this.executionWaitQueue('options')
        break
      case 'devtools':
        this._devtoolsReady = true
        this.executionWaitQueue('devtools')
        break
    }
  }

  requestCore(message: Message): Promise<Message> {
    if (message.to === 'injected') {
      return WindowMessage.requestMessage(message, this.environment, true)
    } else {
      if (this.backgroundConnect) {
        return ExtensionMessage.requestMessagePort(message, this.environment, this.backgroundConnect, true)
      } else {
        return ExtensionMessage.requestMessage(message, this.environment)
      }
    }
  }

  postCore(message: Message): void {
    if (message.to === 'injected') {
      WindowMessage.requestMessage(message, this.environment)
    } else {
      if (this.backgroundConnect) {
        ExtensionMessage.requestMessagePort(message, this.environment, this.backgroundConnect)
      } else {
        ExtensionMessage.requestMessage(message, this.environment)
      }
    }
  }

  listenCore(): void {
    // from injected
    WindowMessage.addResponse(async (message) => {
      if (message[CECS] && message.from !== 'content') {
        // from injected
        if (message.to === this.environment) {
          // from injected to content
          if (message.type === 'request') {
            // to not content type request
            return this.emitResponse(message)
          } else if (message.type === 'post') {
            // to not content type send
            this.emitPost(message)
          }
        } else if (message.to !== 'injected') {
          if (message.type === 'request') {
            return ExtensionMessage.requestMessage(message, this.environment)
          } else {
            ExtensionMessage.requestMessage(message, this.environment)
          }
        }
      }
    })

    if (!this.backgroundConnect) this.useListener()

    const envs: Environment[] = ['injected', 'background', 'devtools', 'popup', 'options']
    envs.forEach((env) => {
      this.sendReadySignal(env)
    })
  }

  // 使用监听器
  private useListener() {
    const listener = async (message: Message) => {
      if (message[CECS] && message.from !== this.environment) {
        // from not injected
        return this.fromBackground(message)
      }
    }
    this._backgroundListener = listener
    Browser.runtime.onMessage.addListener(listener)
  }

  // 弃用监听器
  private deprecatedListener() {
    if (this._backgroundListener) {
      Browser.runtime.onMessage.removeListener(this._backgroundListener)
      this._backgroundListener = undefined
    }
  }

  // 处理来自 background 的消息
  private fromBackground(message: Message) {
    if (message.to === this.environment) {
      if (message.type === 'request') {
        // to not content type request
        return this.emitResponse(message)
      } else if (message.type === 'post') {
        this.emitPost(message)
      }
    } else if (message.to === 'injected') {
      if (message.type === 'request') {
        return WindowMessage.requestMessage(message, this.environment, true)
      } else {
        WindowMessage.requestMessage(message, this.environment)
      }
    }
  }
}
