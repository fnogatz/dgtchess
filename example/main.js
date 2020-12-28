/* global Chessground */

import Board from '../lib/Board.js'

(function () {
  window.loadBoard = loadBoard

  const serial = navigator.serial
  let board
  let chessground

  async function loadBoard () {
    const port = await getPort()
    if (!port) {
      throw new Error('No port available.')
    }
    await port.open({ baudRate: 9600 })

    board = new Board(port)
    const { serialNr, version, position } = await board.reset()
    document.getElementById('serialnr').innerHTML = serialNr
    document.getElementById('version').innerHTML = version

    chessground = Chessground(document.getElementById('chessground'), {
      viewOnly: true,
      fen: '8/8/8/8/8/8/8/8/8'
    })
    chessground.setPieces(position)

    const reader = board.readable.getReader()
    while (true) {
      const { value } = await reader.read()
      chessground.setPieces(value)
    }
  }

  async function getPort () {
    const ports = await serial.getPorts()
    for (const port of ports) {
      for (const filter of Board.FILTERS) {
        if (port.productId === filter.productId && port.vendorId === filter.vendorId) {
          return port
        }
      }
    }

    // do not use `Board.FILTERS` as of now since we do not
    //   know all valid identifiers, also when using a VM etc.
    const filters = []
    return await serial.requestPort({
      filters: filters
    })
  }
})()
