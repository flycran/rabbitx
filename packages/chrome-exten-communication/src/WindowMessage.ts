import { CECS, Environment, Message, stringifyError } from './public'

export default class WindowMessage {
  static async requestMessage(message: Message, currentEnv: Environment): Promise<void>
  static async requestMessage(message: Message, currentEnv: Environment, response: true): Promise<Message>
  static async requestMessage(message: Message, currentEnv: Environment, response?: boolean): Promise<Message | void> {
    try {
      console.log(currentEnv, message)
      window.postMessage(message)
      if (response) {
        return await new Promise<Message>((resolve) => {
          if (response) {
            const receiptEvent = (event: MessageEvent<Message>) => {
              const res = event.data
              if (res.uuid === message.uuid && res.type === 'response' && res.to === message.from) {
                window.removeEventListener('message', receiptEvent)
                resolve(res)
              }
            }
            window.addEventListener('message', receiptEvent)
          }
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

  static addResponse(lis: (message: Message) => Promise<Message | void> | void) {
    window.addEventListener('message', async (event) => {
      const message: Message = event.data
      const res = await lis(message)
      if (res) {
        window.postMessage(res)
      }
    })
  }
}
