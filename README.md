# dgtchess

An event-driven node.js driver for the electronic [DGT](http://dgtprojects.com) chess board.

Install via npm:

	npm install dgtchess

## Status

This project is still in alpha-status. Unfortunately I don't have access to a DGT chess board, so I can't continue development. Please contact me if you want to continue the development of this module or have a DGT board to lend for some weeks.

The current version of this module uses only the `UPDATE BOARD` modus and instead of moves, only changes are triggered through the 'data' event.

## Usage

	var DGT = require('dgtchess');
	var board = new DGT.Board('/dev/ttyUSB0');

	board.on('ready', function() {
	  console.log('Serial No:', board.serialNo);
	  console.log('Version:', board.versionNo);
	  console.log('-----');
	});

	board.on('data', function(data) {
	  console.log('Field:', data.field);
	  console.log('Piece:', data.piece);
	  console.log('-----');
	});

	board.on('move', function(move) {
	  console.log('Move:', move);
	  console.log('-----');
	});

This might result in the following output:

	Serial No: 12345
	Version: 1.7
	   +------------------------+
	 8 | .  .  .  .  .  .  .  . |
	 7 | .  .  .  .  .  .  .  . |
	 6 | .  .  .  .  .  .  .  . |
	 5 | .  .  .  .  .  k  .  . |
	 4 | .  .  R  .  .  .  .  . |
	 3 | .  .  .  .  .  K  .  . |
	 2 | .  .  .  .  .  .  .  . |
	 1 | .  .  .  .  .  .  .  . |
	   +------------------------+
	     a  b  c  d  e  f  g  h

	-----
	Field: c4
	Piece: EMPTY
	-----
	Field: c5
	Piece: WROOK
	-----
	Move: { color: 'w',
	  from: 'c4',
	  to: 'c5',
	  flags: 'n',
	  piece: 'r',
	  san: 'Rc5+' }
	-----
	Field: f5
	Piece: EMPTY
	-----
	Field: e6
	Piece: BKING
	-----
	Move: { color: 'b',
	  from: 'f5',
	  to: 'e6',
	  flags: 'n',
	  piece: 'k',
	  san: 'Ke6' }
	-----

## Events

### 'ready'

The 'ready' event is fired once the basic data (i.e. version and serial number) are read from
the board.

### 'data'

Once something on the board has been changed, i.e. a move gets (re)moved, this event gets
triggered. The passed object has the properties `field` and `piece`.


## Background

The protocol for communicating with the electronic chess boards is well documented by DGT in
[their developer section](http://www.dgtprojects.com/site/index.php/dgtsupport/developer-info).
There you can find the [DGT Electronic Board Protocol Description (version 20120309)](http://www.dgtprojects.com/site/index.php/dgtsupport/developer-info/downloads/doc_download/85-dgt-electronic-board-protocol-description-version-20120309)
which is the base for this node.js implementation.
