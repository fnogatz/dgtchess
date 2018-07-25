var DGT = require('..')
var board = new DGT.Board('/dev/ttyUSB0')

board.on('ready', function () {
  console.log('Serial No:', board.serialNo)
  console.log('Version:', board.versionNo)
  console.log(board.chess.ascii())
  console.log('-----')
})

board.on('data', function (data) {
  console.log('Field:', data.field)
  console.log('Piece:', data.piece)
  console.log('-----')
})

/**
 * TODO:
 */

/*
board.on('move', function(move) {

});

board.on('end', function(result) {

});
 */
