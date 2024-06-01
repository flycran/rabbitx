import type { Tabs } from 'webextension-polyfill'

export type Environment = 'injected' | 'content' | 'background' | 'popup' | 'devtools' | 'options'
// export const allEnv: Environment[] = ['injected', 'background', 'content', 'popup', 'devtools', 'options']
export const allEnv: Environment[] = ['injected', 'background', 'content']

export const tabsEnv: Set<Environment> = new Set(['injected', 'content'])

export class ExtensionMessageError extends Error {}

export class ResponseError extends ExtensionMessageError {}

export const stringifyError = (err: unknown): string => {
  if (err instanceof Error) {
    return err.message
  } else if (typeof err === 'string') {
    return err
  } else if (err === null || err === undefined) {
    return String(err)
  } else {
    try {
      return JSON.stringify(err)
    } catch (_) {
      return Object.prototype.toString.call(err)
    }
  }
}

// * 表示消息应该被处理，避免和其他通信产生冲突
export const CECS = '#__CHROME_EXTEN_COMMUNICATION_MESSAGE__'

export type MessageType = 'post' | 'request' | 'response'

export interface Message<P = any> {
  [CECS]: true
  from: Environment
  fromName: string
  to: Environment
  toName: string
  eventType: string | number
  type: MessageType
  payload: P
  uuid: string
  option?: SendOption
  test?: boolean
  readySignal?: boolean
  shakeHands?: boolean
  error?: string
  errorEnv?: Environment
}

export interface MessageOption {
  name?: string

  listen?: boolean

  onCatch?(err: string, message: Message): any
}

export interface SendOption {
  tab?: Tabs.QueryQueryInfoType | number
  name?: string
}

export interface BroadcastOption<E extends Environment = Environment> extends SendOption {
  to?: E[]
}
