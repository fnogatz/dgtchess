module.exports = Board;

var util = require('util');
var EventEmitter = require('events').EventEmitter;
var serialport = require('serialport');
var protocol = require('./protocol.json');
var parser = require('./parser');

var SerialPort = serialport.SerialPort;

function Board(path, options) {
  this.options = options || {};  
  var _self = this;

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

      // fire 'ready' event
      _self.emit('ready');

      // set mode
      _self._setMode();
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
    _self.emit('data', {
      field: msg.field,
      piece: msg.piece
    });
  });
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