/* global Chessground */

import Board from '../lib/Board.js'

(function () {
  window.loadBoard = loadBoard

  let board
  let chessground

  function loadBoard () {
    chessground = Chessground(document.getElementById('chessground'), {
      viewOnly: true,
      fen: '8/8/8/8/8/8/8/8/8'
    })

    board = new Board()
    board.addEventListener('ready', async function () {
      document.getElementById('serialnr').innerHTML = board.serialNr
      document.getElementById('version').innerHTML = board.version
      chessground.setPieces(board.position)
    })
  }
})()
