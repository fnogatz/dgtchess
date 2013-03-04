dgtchess
========

An event-driven node.js driver for the electronic [DGT](http://dgtprojects.com) chess board.

Install via npm:

	npm install dgtchess

## Status

This project is still under heavy development. Currently only the boards connected via USB are
supported and no clock commands are implemented yet. The module uses only the `UPDATE BOARD`
modus and instead of moves only changes are triggered through the 'data' event.

## Usage

	var DGT = require('..');
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

## Licence

This project stands under the MIT Licence, see LICENCE.md for details.