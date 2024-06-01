import { Background } from 'chrome-exten-communication/Background'

const backgroundMessage = new Background()

backgroundMessage.listen()

globalThis.backgroundMessage = backgroundMessage
