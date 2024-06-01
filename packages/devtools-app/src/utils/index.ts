export interface StackItem {
  url: string
  methodName?: string
  fileName: string
  lineNumber: number
  columnNumber: number
  path: string
}

export class Stack {
  stackList = [] as StackItem[]

  errorName: string

  constructor(stack: string) {
    const lines = stack.split('\n')
    const regex = /\s*at (((?<mn>\S*) \((?<url>.*)\))|(?<url1>.*))/i
    this.errorName = lines.shift()!.trim()
    lines.forEach((line) => {
      try {
        const m = line.match(regex)
        const methodName = m!.groups!.mn as string | undefined
        const url = m!.groups!.url ?? m!.groups!.url1
        const us = new URL(url)
        const p = us.pathname.lastIndexOf('/')
        const fileName = us.pathname.slice(p + 1)
        const s1 = url.match(/:(?<ln>\d*):(?<cn>\d*)$/)
        this.stackList.push({
          url,
          methodName,
          fileName,
          lineNumber: +s1!.groups!.ln,
          columnNumber: +s1!.groups!.cn,
          path: us.pathname,
        })
      } catch (e) {
        console.log(line)
        console.error(e)
      }
    })
  }
}
