module.exports = Board;

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var serialport = require('serialport');
var chess = require('chess.js');
var protocol = require('./protocol.json');
var parser = require('./parser');

var SerialPort = serialport.SerialPort;

function Board(path, options) {
  this.options = options || {};  
  var _self = this;
  this.changes = [];

  // create new chess logic instance and clear its board
  this.chess = new chess.Chess();
  this.chess.clear();

  // connect to the serialport
  var dgt = this._serialport = new SerialPort(path, {
    baudrate: 9600,
    stopbits: 1,
    parity: 'none',
    parser: parser()
  });

  // wait for serialport being ready
  dgt.on('open', function() {
    // send reset
    dgt.write(new Buffer(protocol.commands.DGT_SEND_RESET, 'hex'));

    // read in static information and send 'ready' event
    _self._prepareReadyEvent();
  });
}

/**
 * Make Board an EventEmitter instance.
 */
util.inherits(Board, EventEmitter);


/**
 * Read in serial number and version and fire the 'ready' event once finished.
 * Additionally initiates the other events by calling the _setMode() method.
 */
Board.prototype._prepareReadyEvent = function() {
  var dgt = this._serialport;
  var _self = this;

  // get serial number
  dgt.once('data', function(msg) {
    _self.serialNo = msg.serialNo;

    // get version
    dgt.once('data', function(msg) {
      _self.versionNo = msg.versionNo;

      // get current pieces and their positions
      dgt.once('data', function(msg) {
        _self.setBoard(msg);

        // fire 'ready' event
        _self.emit('ready');

        // set mode
        _self._setMode();
      });
      dgt.write(new Buffer(protocol.commands.DGT_SEND_BRD, 'hex'));
    });
    dgt.write(new Buffer(protocol.commands.DGT_SEND_VERSION, 'hex'));
  });
  dgt.write(new Buffer(protocol.commands.DGT_RETURN_SERIALNR, 'hex'));
}


/**
 * Sets the Update Mode and creates the 'data' events.
 */
Board.prototype._setMode = function() {
  var dgt = this._serialport;
  var _self = this;

  // set mode
  this.options.mode = this.options.mode || Board.defaults.mode;
  if (!protocol.commands.hasOwnProperty(this.options.mode)) { this.options.mode = Board.defaults.mode; };
  dgt.write(new Buffer(protocol.commands[this.options.mode], 'hex'));

  dgt.on('data', function(msg) {
    var obj = {
      field: msg.field,
      piece: msg.piece
    };

    _self.emit('data', obj);
    _self._changed(obj);
  });
}


Board.prototype.setBoard = function(msg) {
  if (msg.id != 'DGT_BOARD_DUMP' || !msg.fields)
    return false;

  // clear board
  this.chess.clear();

  for (var field in msg.fields) {
    this.chess.put(getObjectFromPiece(this.chess, msg.fields[field]), field);
  }
}


Board.prototype._changed = function(curr) {
  if (this.changes.length === 0) {
    this.changes.push(curr);
    return;
  }

  var prev = this.changes.slice(-1)[0];
  if (prev.piece === 'EMPTY' && curr.piece !== 'EMPTY') {
    // this might be a move
    // check if possible
    var move = this.chess.move({ from: prev.field, to: curr.field });
    if (move === null) {
      // not possible -- add to queue
      this.changes.push(curr);
    }
    else {
      this.emit('move', move);
      this.changes = [];
    }
  }
}


/**
 * Some defaults.
 * @type {Object}
 */
Board.defaults = {
  mode: 'DGT_SEND_UPDATE_BRD'
};


/*
Board.prototype.createRepl = function() {
  function runCommand(cmd) {
    if (Object.hasKey(protocol.commands, cmd)) {
      // TODO
    } else return false;
  }

  var r = repl.start("board > ");
  r.context.run = runCommand;
}*/


/**
 * Return a chess.js compatible object representing this piece.
 * @param  {String} piece DGT named piece
 * @return {Object}       chess.js compatible representation
 */
function getObjectFromPiece(chess, piece) {
  if (piece === 'EMPTY')
    return null;

  var color = (piece[0] === 'W' ? chess.WHITE : chess.BLACK);
  var piece = chess[piece.slice(1)];
  return { type: piece, color: color }; 
}