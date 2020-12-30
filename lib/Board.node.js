import { Transform } from 'stream'
import SerialPort from 'serialport'
import BrowserBoard from './Board.js'
import Command from './Command.js'

export default class Board extends BrowserBoard {
  #readable

  constructor (path) {
    const port = new SerialPort(path)
    const writer = port
    const readable = new SerialPortReadable(port)
    const msgFieldUpdateTransformer = new MsgFieldUpdateTransformer()
    super(port, { writer, readable, msgFieldUpdateTransformer })
    this.#readable = readable
  }

  getReader () {
    this.message(Command.SEND_UPDATE_BRD)
    return this.#readable.getReader()
  }
}

class SerialPortReadable {
  #port
  #lock = null

  constructor (port) {
    this.#port = port
    this.#port.pause()
    this.#port.on('data', (data) => {
      this.#lock.resolve({
        value: data,
        done: false
      })
    })
  }

  getReader () {
    if (this.#lock) {
      throw new Error('Port already in use')
    }
    const reader = new SerialPortReader(this)
    this.#lock = reader
    return reader
  }

  get port () {
    return this.#port
  }

  releaseLock () {
    this.#lock = null
  }
}

class SerialPortReader {
  #readable
  #port
  #resolvers = []

  constructor (readable) {
    this.#readable = readable
    this.#port = readable.port
  }

  async read () {
    const self = this
    return new Promise(resolve => {
      self.#resolvers.push(resolve)
      self.#readable.port.resume()
    })
  }

  resolve (data) {
    const resolver = this.#resolvers.shift()
    resolver(data)
  }

  releaseLock () {
    this.#readable.releaseLock()
    this.#port.pause()
  }
}

class MsgFieldUpdateTransformer extends Transform {
  #buf = new Uint8Array(5)
  #pos = 0

  _transform (chunk, encoding, cb) {
    this.#buf.set(chunk, this.#pos)
    this.#pos += chunk.length

    if (this.#pos === 5) {
      this.#pos = 0
      const buf = this.#buf
      this.#buf = new Uint8Array(5)
      return cb(null, buf)
    }
    return cb()
  }
}
