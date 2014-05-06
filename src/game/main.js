// This example uses the Phaser 2.0.4 framework

// Copyright © 2014 John Watson
// Licensed under the terms of the MIT License


var game = new Phaser.Game(848, 450, Phaser.AUTO, 'game');
GameState = require('./states/play')
game.state.add('game', GameState, true);