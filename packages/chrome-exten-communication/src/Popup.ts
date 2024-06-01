import MessageCore, { AcceptMap, ResponseMap } from './MessageCore'
import { Environment, Message, SendOption } from './public'

// import { Message } from './types'

export class Popup<
  P extends Record<string, any> = AcceptMap,
  R extends Record<string, any> = ResponseMap,
> extends MessageCore<'popup', P, R> {
  environment = 'popup' as const

  requestCore(message: Message): Promise<Message> {
    throw new Error('Method not implemented.')
  }

  postCore(message: Message): void {
    throw new Error('Method not implemented.')
  }

  listenCore(): void {
    throw new Error('Method not implemented.')
  }

  needToReady(env: Environment, option?: SendOption | undefined): boolean {
    throw new Error('Method not implemented.')
  }

  addReadyEnv(env: Environment, message: Message): void {
    throw new Error('Method not implemented.')
  }
}
