/* global Event, EventTarget */
/* eslint no-labels: ["error", { "allowLoop": true }] */

import Command from './Command.js'

const serial = navigator.serial

export default class Board extends EventTarget {
  #port = null
  #buffer
  #writer

  #serialNr
  #version
  #position

  #reset = async () => {
    await this.message(Command.SEND_RESET)
    this.#serialNr = await this.message(Command.RETURN_SERIALNR)
    this.#version = await this.message(Command.RETURN_VERSION)
    this.#position = await this.getPosition()
  }

  #write = async (...args) => {
    return await this.#writer.write(...args)
  }

  constructor () {
    super()

    ;(async () => {
      const ports = await serial.getPorts()
      serialDevicesLoop: for (const port of ports) {
        for (const filter of Board.FILTERS) {
          if (port.productId === filter.productId && port.vendorId === filter.vendorId) {
            this.#port = port
            break serialDevicesLoop
          }
        }
      }

      if (this.#port === null) {
        this.#port = await serial.requestPort({
          filters: Board.FILTERS
        })
      }

      if (this.#port === null) {
        throw new Error('No port available.')
      }

      await this.#port.open({ baudRate: 9600 })
      this.#writer = this.#port.writable.getWriter()
      console.log('Successfully opened')

      await this.#reset()
      this.dispatchEvent(new Event('ready'))
    })().catch((err) => {
      console.log('Error during DGT board setup:', err)
    })
  }

  async message (cmd) {
    await this.#write(new Uint8Array([cmd.code]))

    if (cmd.length === 0) {
      return
    }

    const reader = this.#port.readable.getReader()
    const message = new Uint8Array(cmd.length)
    let offset = 0
    while (true) {
      const { value, done } = await reader.read()
      message.set(value, offset)
      offset += value.length

      if (done || offset === cmd.length) {
        reader.releaseLock()
        return cmd.process(message)
      }
    }
  }

  async getPosition () {
    return await this.message(Command.SEND_BRD)
  }

  get serialNr () {
    return this.#serialNr
  }

  get version () {
    return this.#version
  }

  get position () {
    return this.#position
  }

  static FILTERS = [
    { usbVendorId: 0x0403, usbProductId: 0x6001 }
  ]
}
