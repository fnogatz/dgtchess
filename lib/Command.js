const SQUARES = [
  'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8',
  'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
  'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
  'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
  'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
  'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
  'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
  'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1'
]
const PIECES = {
  0x0: null,
  0x1: { role: 'pawn', color: 'white' },
  0x2: { role: 'rook', color: 'white' },
  0x3: { role: 'knight', color: 'white' },
  0x4: { role: 'bishop', color: 'white' },
  0x5: { role: 'king', color: 'white' },
  0x6: { role: 'queen', color: 'white' },
  0x7: { role: 'pawn', color: 'black' },
  0x8: { role: 'rook', color: 'black' },
  0x9: { role: 'knight', color: 'black' },
  0xa: { role: 'bishop', color: 'black' },
  0xb: { role: 'king', color: 'black' },
  0xc: { role: 'queen', color: 'black' },
  0xd: null, // PIECE1
  0xe: null, // PIECE2
  0xf: null // PIECE3
}

export default class Command {
  code
  length = 0

  process (msg) {
    return msg
  }
}

class SendReset extends Command {
  code = 0x40
  length = 0
}

class SendUpdateBoard extends Command {
  code = 0x44
  length = 0

  process (msg) {
    // DGT_MSG_FIELD_UPDATE
    const pieces = new Map()
    pieces.set(SQUARES[msg[3]], PIECES[msg[4]])
    return pieces
  }
}

class SendBoard extends Command {
  code = 0x42
  length = 67

  process (msg) {
    // DGT_MSG_BOARD_DUMP
    const fields = msg.slice(3)
    const board = new Map()
    for (let i = 0; i < 64; i++) {
      board.set(SQUARES[i], PIECES[fields[i]])
    }
    return board
  }
}

class ReturnSerialNr extends Command {
  code = 0x45
  length = 8

  process (msg) {
    // DGT_MSG_SERIALNR
    const decoder = new TextDecoder('utf-8')
    return decoder.decode(msg.slice(3))
  }
}

class ReturnVersion extends Command {
  code = 0x4D
  length = 5

  process (msg) {
    // DGT_MSG_VERSION
    return msg[3] + '.' + msg[4]
  }
}

Command.SEND_RESET = new SendReset()
Command.SEND_UPDATE_BRD = new SendUpdateBoard()
Command.SEND_BRD = new SendBoard()
Command.RETURN_SERIALNR = new ReturnSerialNr()
Command.RETURN_VERSION = new ReturnVersion()
