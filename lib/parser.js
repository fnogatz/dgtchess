module.exports = parser;

var protocol = require('./protocol.json');
var msgIndex = createMsgIndex();
var piecesIndex = createPiecesIndex();


/**
 * Create a parser for the SerialPort module.
 */
function parser() {
  var msg = new Message();

  return function(emitter, buffer) {
    Array.prototype.forEach.call(buffer, function(byte) {
      if (msg.bytes.length === 0) {
        // first byte -- Message ID
        if (msgIndex.hasOwnProperty(byte)) {
          msg.id = msgIndex[byte];
        } else {
          throw "unknown message ID: "+byte;
        }        
      }
      else if (msg.bytes.length === 1) {
        // second byte -- do nothing, wait for third header byte
      }
      else if (msg.bytes.length === 2) {
        // third byte -- get msg size together with second byte
        msg.size = msg.bytes[1] << 8 | byte;
      }

      msg.bytes.push(byte);

      if (msg.size && msg.bytes.length === msg.size) {
        // complete message received
        msg.commit();
        emitter.emit('data', msg);
        msg = new Message();
      }
    });
  };
};


/**
 * Create an index of the Message IDs.
 * @return {Object} Index of the form { Num1: MessageId1, Num2: MessageId2, ... }
 */
function createMsgIndex() {
  var messages = {};
  var messageBit = parseInt(protocol.MESSAGE_BIT,16);
  for (var messageId in protocol.messageIds) {
    var messageIdCode = messageBit | parseInt(protocol.messageIds[messageId],16);
    messages[messageIdCode] = messageId;
  }
  return messages;
}


/**
 * Create an Index over the pieces.
 * @return {Object} Index of the form { Num1: Piece1, Num2: Piece2, ... }
 */
function createPiecesIndex() {
  var pieces = {};
  for (var piece in protocol.pieces) {
    pieces[parseInt(protocol.pieces[piece],16)] = piece;
  }
  return pieces;
}


function Message() {
  this.id = null;
  this.bytes = [];
  this.size = null;
}


/**
 * Add fields specific to the type when the message bytes are all ready
 */
Message.prototype.commit = function() {
  if (this.id === 'DGT_SERIALNR') {
    this.serialNo = this.bytes.slice(3).reduce(function(prev,curr) { return prev+String.fromCharCode(curr); }, '');
  }
  else if (this.id === 'DGT_VERSION') {
    this.versionNo = ''+this.bytes.slice(3)[0]+'.'+this.bytes.slice(3)[1];
  }
  else if (this.id === 'DGT_FIELD_UPDATE') {
    this.field = protocol.fields[this.bytes[3]];
    this.piece = piecesIndex[this.bytes[4]];
  }
  else if (this.id === 'DGT_BOARD_DUMP') {
    this.fields = {};
    var fields = this.bytes.slice(3);
    for (var i = 0; i < fields.length; i++) {
      if (fields[i] > 0 && piecesIndex.hasOwnProperty(fields[i])) {
        this.fields[protocol.fields[i]] = piecesIndex[fields[i]];
      }
    }
  }
}