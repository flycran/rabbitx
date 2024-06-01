import { v4 } from 'uuid'
import Browser from 'webextension-polyfill'
import { CECS, Environment, Message, stringifyError } from './public'

export default class ExtensionMessage {
  static async requestMessage(message: Message, currentEnv: Environment): Promise<Message> {
    try {
      return await Browser.runtime.sendMessage(message)
    } catch (err) {
      return {
        [CECS]: true,
        from: message.to,
        fromName: message.toName,
        to: message.from,
        toName: message.fromName,
        eventType: message.eventType,
        type: 'response',
        payload: null,
        error: stringifyError(err),
        errorEnv: currentEnv,
        uuid: message.uuid,
      }
    }
  }

  static async queryTab(tab: number | Browser.Tabs.QueryQueryInfoType): Promise<number | void> {
    if (typeof tab === 'number') {
      return tab
    } else {
      const tabs = await Browser.tabs.query(tab)
      return tabs[0].id
    }
  }

  static async requestMessageTab(message: Message, currentEnv: Environment, sendTabId?: number): Promise<Message> {
    try {
      if (message.option?.tab) {
        const tabId = await this.queryTab(message.option?.tab)
        if (tabId) {
          return Browser.tabs.sendMessage(tabId, message)
        }
      } else if (sendTabId) {
        return await Browser.tabs.sendMessage(sendTabId, message)
      }
      return {
        [CECS]: true,
        from: message.to,
        fromName: message.toName,
        to: message.from,
        toName: message.fromName,
        eventType: message.eventType,
        type: 'response',
        payload: null,
        uuid: message.uuid,
        error: 'tabs not found',
        errorEnv: currentEnv,
      }
    } catch (err) {
      return {
        [CECS]: true,
        from: message.to,
        fromName: message.toName,
        to: message.from,
        toName: message.fromName,
        eventType: message.eventType,
        type: 'response',
        payload: null,
        errorEnv: currentEnv,
        error: stringifyError(err),
        uuid: message.uuid,
      }
    }
  }

  static async requestMessagePort(
    message: Message,
    currentEnv: Environment,
    connect: Browser.Runtime.Port,
  ): Promise<void>
  static async requestMessagePort(
    message: Message,
    currentEnv: Environment,
    connect: Browser.Runtime.Port,
    response: true,
  ): Promise<Message>
  static async requestMessagePort(
    message: Message,
    currentEnv: Environment,
    connect: Browser.Runtime.Port,
    response?: boolean,
  ): Promise<Message | void> {
    try {
      connect.postMessage(message)
      if (response) {
        return await new Promise<Message>((resolve) => {
          const lis = (res: Message) => {
            if (res[CECS] && res.type === 'response' && message.uuid === res.uuid) {
              connect.onMessage.removeListener(lis)
              resolve(res)
            }
          }
          connect.onMessage.addListener(lis)
        })
      }
    } catch (err) {
      return {
        [CECS]: true,
        from: message.to,
        fromName: message.toName,
        to: message.from,
        toName: message.fromName,
        eventType: message.eventType,
        type: 'response',
        payload: null,
        errorEnv: currentEnv,
        error: stringifyError(err),
        uuid: message.uuid,
      }
    }
  }

  static async requestMessagePortTab(
    message: Message,
    currentEnv: Environment,
    connectMap: Map<number, Browser.Runtime.Port>,
    sendTabId?: number,
  ): Promise<void>
  static async requestMessagePortTab(
    message: Message,
    currentEnv: Environment,
    connectMap: Map<number, Browser.Runtime.Port>,
    sendTabId: number | undefined,
    response: true,
  ): Promise<Message>
  static async requestMessagePortTab(
    message: Message,
    currentEnv: Environment,
    connectMap: Map<number, Browser.Runtime.Port>,
    sendTabId?: number,
    response?: boolean,
  ): Promise<Message | void> {
    try {
      if (message.option?.tab) {
        const tabId = await this.queryTab(message.option?.tab)
        if (tabId && connectMap.has(tabId)) {
          const connect = connectMap.get(tabId)!
          if (response) {
            return this.requestMessagePort(message, currentEnv, connect, response)
          } else {
            return this.requestMessagePort(message, currentEnv, connect)
          }
        }
        if (tabId) {
          return Browser.tabs.sendMessage(tabId, message)
        } else if (sendTabId) {
          return await Browser.tabs.sendMessage(sendTabId, sendTabId)
        }
      } else {
        if (sendTabId && connectMap.has(sendTabId)) {
          const connect = connectMap.get(sendTabId)!
          if (response) {
            return this.requestMessagePort(message, currentEnv, connect, response)
          } else {
            return this.requestMessagePort(message, currentEnv, connect)
          }
        }
      }
      return {
        [CECS]: true,
        from: message.to,
        fromName: message.toName,
        to: message.from,
        toName: message.fromName,
        eventType: message.eventType,
        type: 'response',
        payload: null,
        uuid: message.uuid,
        error: 'tabs not found',
        errorEnv: currentEnv,
      }
    } catch (err) {
      return {
        [CECS]: true,
        from: message.to,
        fromName: message.toName,
        to: message.from,
        toName: message.fromName,
        eventType: message.eventType,
        type: 'response',
        payload: null,
        errorEnv: currentEnv,
        error: stringifyError(err),
        uuid: message.uuid,
      }
    }
  }

  static addResponsePort(lis: (message: any) => Promise<Message | void> | void, port: Browser.Runtime.Port) {
    port.onMessage.addListener((message: Message) => {
      lis(message)?.then((res) => {
        if (res) {
          port.postMessage(res)
        }
      })
    })
  }

  static sendConnect(
    connect: (port: Browser.Runtime.Port, message: Message) => void,
    disconnect: (port: Browser.Runtime.Port, message: Message) => void,
    env: Environment,
    to: Environment,
  ) {
    const port = Browser.runtime.connect({
      name: v4(),
    })
    const uuid = v4()
    port.postMessage({
      [CECS]: true,
      from: 'devtools',
      to,
      type: 'post',
      shakeHands: true,
      payload: Browser.devtools.inspectedWindow.tabId,
      uuid,
    } as Message)
    const lis = (message: Message) => {
      if (message[CECS] && message.from === to && message.to === env && message.uuid === uuid && message.shakeHands) {
        port.onDisconnect.addListener((port) => {
          disconnect(port, message)
        })
        port.onMessage.removeListener(lis)
        connect(port, message)
      }
    }
    port.onMessage.addListener(lis)
    return port
  }

  static acceptConnect(
    connect: (port: Browser.Runtime.Port, message: Message) => void,
    disconnect: (port: Browser.Runtime.Port, message: Message) => void,
    env: Environment,
    from: Environment,
  ) {
    const clis = (port: Browser.Runtime.Port) => {
      const lis = (message: Message) => {
        if (message[CECS] && message.shakeHands && message.from === from && message.to === env) {
          port.onMessage.removeListener(lis)
          port.onDisconnect.addListener((port) => {
            disconnect(port, message)
          })
          port.postMessage({
            [CECS]: true,
            shakeHands: true,
            from: 'background',
            to: 'devtools',
            payload: 'success',
            uuid: message.uuid,
          } as Message)
          // 连接完成
          connect(port, message)
        }
      }
      port.onMessage.addListener(lis)
    }
    Browser.runtime.onConnect.addListener(clis)
  }
}
