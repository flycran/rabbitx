import { Devtools } from 'chrome-exten-communication/Devtools'
import { AcceptMap, ResponseMap } from 'rabbitx'

export const devtoolsMessage = new Devtools<AcceptMap, ResponseMap>()

window.devtoolsMessage = devtoolsMessage
