/* eslint no-labels: ["error", { "allowLoop": true }] */
/* global TransformStream */

import Command from './Command.js'

export default class Board {
  #port
  #buffer
  #writer

  #serialNr
  #version
  #position

  #write = async (...args) => {
    return await this.#writer.write(...args)
  }

  constructor (port) {
    this.#port = port
    this.#writer = this.#port.writable.getWriter()
  }

  async reset () {
    await this.message(Command.SEND_RESET)
    this.#serialNr = await this.message(Command.RETURN_SERIALNR)
    this.#version = await this.message(Command.RETURN_VERSION)
    this.#position = await this.getPosition()

    return {
      serialNr: this.#serialNr,
      version: this.#version,
      position: this.#position
    }
  }

  async message (cmd) {
    await this.#write(new Uint8Array([cmd.code]))

    if (cmd.length === 0) {
      return
    }

    const reader = this.#port.readable.getReader()
    const message = new Uint8Array(cmd.length)
    let pos = 0
    while (true) {
      const { value, done } = await reader.read()
      message.set(value, pos)
      pos += value.length

      if (done || pos === cmd.length) {
        reader.releaseLock()
        return cmd.process(message)
      }
    }
  }

  async getPosition () {
    return await this.message(Command.SEND_BRD)
  }

  get readable () {
    this.message(Command.SEND_UPDATE_BRD)
    return this.#port.readable.pipeThrough(new TransformStream({
      start (controller) {
        controller.buf = new Uint8Array(5)
        controller.pos = 0
      },
      transform (chunk, controller) {
        controller.buf.set(chunk, controller.pos)
        controller.pos += chunk.length
        if (controller.pos === 5) {
          controller.enqueue(Command.SEND_UPDATE_BRD.process(controller.buf))
          controller.pos = 0
          controller.buf = new Uint8Array(5)
        }
      }
    }))
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
