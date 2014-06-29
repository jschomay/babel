(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = Player = function(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'player');

    this.MAX_SPEED = 300; // pixels/second
    this.ACCELERATION = 2000; // pixels/second/second
    this.DRAG = 2000; // pixels/second
    this.JUMP_SPEED = -1000; // pixels/second (negative y is up)

    game.physics.enable(this, Phaser.Physics.ARCADE);
    this.body.collideWorldBounds = true;
    this.body.checkCollision.up = false;
    this.body.maxVelocity.setTo(this.MAX_SPEED, this.MAX_SPEED * 10); // x, y
    this.body.drag.setTo(this.DRAG, 0); // x, y
};

Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player;

// player movements
Player.prototype.walkLeft = function() {
    this.body.acceleration.x += -this.ACCELERATION;
};

Player.prototype.walkRight = function() {
    this.body.acceleration.x += this.ACCELERATION;
};

Player.prototype.climb = function(gameState) {
    this.climbing = true;
    var climbTween = this.game.add.tween(this.body);
    climbTween.to({y: (this.body.y - gameState.scaffoldPool.getAt(0).height)}, 500, Phaser.Easing.Linear.None, true);
    climbTween.onComplete.add(function() {
        this.climbing = false;
    }, this);
};

Player.prototype.isBusy = function() {
    return !!this.climbing || !!this.building;
};


Player.prototype.update = function() {

};
},{}],2:[function(require,module,exports){
// This example uses the Phaser 2.0.4 framework

// Copyright © 2014 John Watson
// Licensed under the terms of the MIT License


var game = new Phaser.Game(800, 500, Phaser.AUTO, 'game');
GameState = require('./states/play');
game.state.add('game', GameState, true);

window.game = game;
},{"./states/play":3}],3:[function(require,module,exports){
module.exports = GameState = function(game) {
};

// Load images and sounds
GameState.prototype.preload = function() {
    this.game.load.image('scaffold', '/assets/scaffold.png');
    this.game.load.image('player', '/assets/player.png');
};

// Setup the example
GameState.prototype.create = function() {
    // Set stage background to something sky colored
    this.game.stage.backgroundColor = 0x4488cc;

    this.GRAVITY = 2600; // pixels/second/second
    this.game.physics.arcade.gravity.y = this.GRAVITY;

    var Player = require('../entities/player');
    this.player = new Player(this.game, this.game.width/2, this.game.height - 200);
    this.game.add.existing(this.player);


    // invisible helper object to determine if scaffolding exists in the direction pressed
    this.targetPosition = this.game.add.sprite(this.player.x, this.player.y);
    this.game.physics.enable(this.targetPosition, Phaser.Physics.ARCADE);
    this.targetPosition.body.allowGravity = false;
    this.targetPosition.body.setSize(10, 10, this.targetPosition.width/2-5, this.targetPosition.height/2-5);



    this.scaffoldPool = this.game.add.group();

    // start scaffold pool with 100 pieces
    for(var i = 0; i < 100; i++) {
        // addScaffoldToPool.call(this);
        this.addScaffoldToPool();
    }

    // lay some initial scaffolding
    for(var x = 0; x < this.game.width; x += this.scaffoldPool.getAt(0).width) {
        this.buildScaffold(x, this.game.height - this.scaffoldPool.getAt(0).height-30);
    }


    // Capture certain keys to prevent their default actions in the browser.
    // This is only necessary because this is an HTML5 game. Games on other
    // platforms may not need code like this.
    this.game.input.keyboard.addKeyCapture([
        Phaser.Keyboard.LEFT,
        Phaser.Keyboard.RIGHT,
        Phaser.Keyboard.UP,
        Phaser.Keyboard.DOWN
    ]);

    // Just for fun, draw some height markers so we can see how high we're jumping
    this.drawHeightMarkers();

    // Show FPS
    this.game.time.advancedTiming = true;
    this.fpsText = this.game.add.text(
        20, 20, '', { font: '16px Arial', fill: '#ffffff' }
    );
};

GameState.prototype.addScaffoldToPool = function(){
    var scaffold = this.game.add.sprite(0, 0, 'scaffold');
    scaffold.name = 'scaffold'+this.scaffoldPool.length;
    scaffold.scale.x = 2.5;
    scaffold.scale.y = 2;
    this.scaffoldPool.add(scaffold);

    // Enable physics on the scaffold
    this.game.physics.enable(scaffold, Phaser.Physics.ARCADE);
    scaffold.body.immovable = true;
    scaffold.body.allowGravity = false;
    scaffold.body.setSize(32, 5, 0 , 64-10);

    // Set its initial state to "dead".
    scaffold.kill();

    scaffold.checkWorldBounds = true;
    scaffold.outOfBoundsKill = true;

    return scaffold;
};

GameState.prototype.buildScaffold = function (x, y) {
    var buildTime = Phaser.Timer.SECOND * 0.6;
    this.player.building = true;
    // Get a dead scaffold from the pool
    var scaffold = this.scaffoldPool.getFirstDead();
    if (scaffold === null) {
        console.log("increasing scaffold pool to", this.scaffoldPool.length);
        scaffold = this.addScaffoldToPool();
    }
    scaffold.revive();
    scaffold.reset(x, y);
    scaffold.alpha = 0;
    // fade in (temp animation)
    this.game.add.tween(scaffold).to( { alpha: 1 }, buildTime, Phaser.Easing.Linear.None, true);

    function stopBuilding() {this.player.building = false;}
    this.game.time.events.add(buildTime, stopBuilding, this);

    return scaffold;
};

GameState.prototype.extendScaffold = function(anchorScaffold, direction) {
    switch (direction) {
        case 'up':
        this.buildScaffold(anchorScaffold.x, anchorScaffold.y - anchorScaffold.height);
        break;
        case 'right':
        this.buildScaffold(anchorScaffold.x + anchorScaffold.width, anchorScaffold.y);
        break;
        case 'left':
        this.buildScaffold(anchorScaffold.x - anchorScaffold.width, anchorScaffold.y);
        break;
    }
};

GameState.prototype.getScaffoldUnderfoot = function() {
    var scaffoldUnderFoot;
    this.targetPosition.body.reset(this.player.x, this.player.y + this.player.height/2);
    function collisionHandler(player, scaffold) {
        scaffoldUnderFoot = scaffold;
    }
    this.game.physics.arcade.overlap(this.targetPosition, this.scaffoldPool, collisionHandler, null, this);
    return scaffoldUnderFoot;
};


// This function draws horizontal lines across the stage
GameState.prototype.drawHeightMarkers = function() {
    // Create a bitmap the same size as the stage
    var bitmap = this.game.add.bitmapData(this.game.width, this.game.height);

    // These functions use the canvas context to draw lines using the canvas API
    for(y = this.game.height-32; y >= 64; y -= 32) {
        bitmap.context.beginPath();
        bitmap.context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        bitmap.context.moveTo(0, y);
        bitmap.context.lineTo(this.game.width, y);
        bitmap.context.stroke();
    }

    this.game.add.image(0, 0, bitmap);
};

// The update() method is called every frame
GameState.prototype.update = function() {
    if (this.game.time.fps !== 0) {
        this.fpsText.setText(this.game.time.fps + ' FPS');
    }

    // Collide the player with the scaffold
    this.game.physics.arcade.collide(this.player, this.scaffoldPool);

    playersFeet = this.player.y+this.player.height/2;

    // targetPosition follows player
    this.targetPosition.body.reset(this.player.x, playersFeet);

    this.player.body.acceleration.x = 0;

    // update inputs

    if (!this.player.isBusy() && this.leftInputIsActive()) {
        this.targetPosition.body.reset(this.player.x - this.scaffoldPool.getAt(0).width*4/5, playersFeet);
        this.buildOrMove('left', this.player.walkLeft);
    }
    if (!this.player.isBusy() && this.rightInputIsActive()) {
        this.targetPosition.body.reset(this.player.x + this.scaffoldPool.getAt(0).width*4/5, playersFeet);
        this.buildOrMove('right', this.player.walkRight);
    }

    if (!this.player.isBusy() && this.upInputIsActive()) {
        this.player.body.acceleration.x = 0;
        this.targetPosition.body.reset(this.player.x, playersFeet - this.scaffoldPool.getAt(0).height);
        this.buildOrMove('up', this.player.climb);
    }

    // for debugging actions //
    if(this.input.keyboard.justPressed(Phaser.Keyboard.DOWN,1)){
        this.getScaffoldUnderfoot();
    }

};

GameState.prototype.buildOrMove = function(direction, moveFn) {
    // Collide the targetPosition with the scaffold
    if(this.game.physics.arcade.overlap(this.targetPosition, this.scaffoldPool)) {
        // scaffold exists to move to
        // TODO - only climb if up is held for .5 sec
        moveFn.call(this.player, this);
    } else {
        // stop and build
        this.player.body.acceleration.x = 0;

        // direction passed in as 'up', 'left', 'right'
        anchorScaffold = this.getScaffoldUnderfoot();
        this.extendScaffold(anchorScaffold, direction);

        // TODO - DON'T BUILD IF IT WILL BE OFF SCREEN
    }
};

// This function should return true when the player activates the "go left" control
// In this case, either holding the right arrow or tapping or clicking on the left
// side of the screen.
GameState.prototype.leftInputIsActive = function() {
    var isActive = false;

    isActive = this.input.keyboard.isDown(Phaser.Keyboard.LEFT);
    isActive |= (this.game.input.activePointer.isDown &&
        this.game.input.activePointer.x < this.game.width/4);

    return isActive;
};

// This function should return true when the player activates the "go right" control
// In this case, either holding the right arrow or tapping or clicking on the right
// side of the screen.
GameState.prototype.rightInputIsActive = function() {
    var isActive = false;

    isActive = this.input.keyboard.isDown(Phaser.Keyboard.RIGHT);
    isActive |= (this.game.input.activePointer.isDown &&
        this.game.input.activePointer.x > this.game.width/2 + this.game.width/4);

    return isActive;
};

// This function should return true when the player activates the "jump" control
// In this case, either holding the up arrow or tapping or clicking on the center
// part of the screen.
GameState.prototype.upInputIsActive = function(duration) {
    var isActive = false;

    isActive = this.input.keyboard.justPressed(Phaser.Keyboard.UP, duration);
    isActive |= (this.game.input.activePointer.justPressed(duration + 1000/60) &&
        this.game.input.activePointer.x > this.game.width/4 &&
        this.game.input.activePointer.x < this.game.width/2 + this.game.width/4);

    return isActive;
};

GameState.prototype.render = function render() {

    // game.debug.bodyInfo(this.player, 32, 32);

    this.game.debug.body(this.targetPosition);
    this.game.debug.body(this.player);
    this.scaffoldPool.forEach(function(scaffold){this.game.debug.body(scaffold);},this);
};
},{"../entities/player":1}]},{},[1,2,3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvSmVmZi9Eb2N1bWVudHMvYmFiZWwvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9KZWZmL0RvY3VtZW50cy9iYWJlbC9zcmMvZ2FtZS9lbnRpdGllcy9wbGF5ZXIuanMiLCIvVXNlcnMvSmVmZi9Eb2N1bWVudHMvYmFiZWwvc3JjL2dhbWUvbWFpbi5qcyIsIi9Vc2Vycy9KZWZmL0RvY3VtZW50cy9iYWJlbC9zcmMvZ2FtZS9zdGF0ZXMvcGxheS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IFBsYXllciA9IGZ1bmN0aW9uKGdhbWUsIHgsIHkpIHtcbiAgICBQaGFzZXIuU3ByaXRlLmNhbGwodGhpcywgZ2FtZSwgeCwgeSwgJ3BsYXllcicpO1xuXG4gICAgdGhpcy5NQVhfU1BFRUQgPSAzMDA7IC8vIHBpeGVscy9zZWNvbmRcbiAgICB0aGlzLkFDQ0VMRVJBVElPTiA9IDIwMDA7IC8vIHBpeGVscy9zZWNvbmQvc2Vjb25kXG4gICAgdGhpcy5EUkFHID0gMjAwMDsgLy8gcGl4ZWxzL3NlY29uZFxuICAgIHRoaXMuSlVNUF9TUEVFRCA9IC0xMDAwOyAvLyBwaXhlbHMvc2Vjb25kIChuZWdhdGl2ZSB5IGlzIHVwKVxuXG4gICAgZ2FtZS5waHlzaWNzLmVuYWJsZSh0aGlzLCBQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICAgIHRoaXMuYm9keS5jb2xsaWRlV29ybGRCb3VuZHMgPSB0cnVlO1xuICAgIHRoaXMuYm9keS5jaGVja0NvbGxpc2lvbi51cCA9IGZhbHNlO1xuICAgIHRoaXMuYm9keS5tYXhWZWxvY2l0eS5zZXRUbyh0aGlzLk1BWF9TUEVFRCwgdGhpcy5NQVhfU1BFRUQgKiAxMCk7IC8vIHgsIHlcbiAgICB0aGlzLmJvZHkuZHJhZy5zZXRUbyh0aGlzLkRSQUcsIDApOyAvLyB4LCB5XG59O1xuXG5QbGF5ZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQaGFzZXIuU3ByaXRlLnByb3RvdHlwZSk7XG5QbGF5ZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUGxheWVyO1xuXG4vLyBwbGF5ZXIgbW92ZW1lbnRzXG5QbGF5ZXIucHJvdG90eXBlLndhbGtMZWZ0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5ib2R5LmFjY2VsZXJhdGlvbi54ICs9IC10aGlzLkFDQ0VMRVJBVElPTjtcbn07XG5cblBsYXllci5wcm90b3R5cGUud2Fsa1JpZ2h0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5ib2R5LmFjY2VsZXJhdGlvbi54ICs9IHRoaXMuQUNDRUxFUkFUSU9OO1xufTtcblxuUGxheWVyLnByb3RvdHlwZS5jbGltYiA9IGZ1bmN0aW9uKGdhbWVTdGF0ZSkge1xuICAgIHRoaXMuY2xpbWJpbmcgPSB0cnVlO1xuICAgIHZhciBjbGltYlR3ZWVuID0gdGhpcy5nYW1lLmFkZC50d2Vlbih0aGlzLmJvZHkpO1xuICAgIGNsaW1iVHdlZW4udG8oe3k6ICh0aGlzLmJvZHkueSAtIGdhbWVTdGF0ZS5zY2FmZm9sZFBvb2wuZ2V0QXQoMCkuaGVpZ2h0KX0sIDUwMCwgUGhhc2VyLkVhc2luZy5MaW5lYXIuTm9uZSwgdHJ1ZSk7XG4gICAgY2xpbWJUd2Vlbi5vbkNvbXBsZXRlLmFkZChmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5jbGltYmluZyA9IGZhbHNlO1xuICAgIH0sIHRoaXMpO1xufTtcblxuUGxheWVyLnByb3RvdHlwZS5pc0J1c3kgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gISF0aGlzLmNsaW1iaW5nIHx8ICEhdGhpcy5idWlsZGluZztcbn07XG5cblxuUGxheWVyLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpIHtcblxufTsiLCIvLyBUaGlzIGV4YW1wbGUgdXNlcyB0aGUgUGhhc2VyIDIuMC40IGZyYW1ld29ya1xuXG4vLyBDb3B5cmlnaHQgwqkgMjAxNCBKb2huIFdhdHNvblxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBNSVQgTGljZW5zZVxuXG5cbnZhciBnYW1lID0gbmV3IFBoYXNlci5HYW1lKDgwMCwgNTAwLCBQaGFzZXIuQVVUTywgJ2dhbWUnKTtcbkdhbWVTdGF0ZSA9IHJlcXVpcmUoJy4vc3RhdGVzL3BsYXknKTtcbmdhbWUuc3RhdGUuYWRkKCdnYW1lJywgR2FtZVN0YXRlLCB0cnVlKTtcblxud2luZG93LmdhbWUgPSBnYW1lOyIsIm1vZHVsZS5leHBvcnRzID0gR2FtZVN0YXRlID0gZnVuY3Rpb24oZ2FtZSkge1xufTtcblxuLy8gTG9hZCBpbWFnZXMgYW5kIHNvdW5kc1xuR2FtZVN0YXRlLnByb3RvdHlwZS5wcmVsb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5nYW1lLmxvYWQuaW1hZ2UoJ3NjYWZmb2xkJywgJy9hc3NldHMvc2NhZmZvbGQucG5nJyk7XG4gICAgdGhpcy5nYW1lLmxvYWQuaW1hZ2UoJ3BsYXllcicsICcvYXNzZXRzL3BsYXllci5wbmcnKTtcbn07XG5cbi8vIFNldHVwIHRoZSBleGFtcGxlXG5HYW1lU3RhdGUucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIFNldCBzdGFnZSBiYWNrZ3JvdW5kIHRvIHNvbWV0aGluZyBza3kgY29sb3JlZFxuICAgIHRoaXMuZ2FtZS5zdGFnZS5iYWNrZ3JvdW5kQ29sb3IgPSAweDQ0ODhjYztcblxuICAgIHRoaXMuR1JBVklUWSA9IDI2MDA7IC8vIHBpeGVscy9zZWNvbmQvc2Vjb25kXG4gICAgdGhpcy5nYW1lLnBoeXNpY3MuYXJjYWRlLmdyYXZpdHkueSA9IHRoaXMuR1JBVklUWTtcblxuICAgIHZhciBQbGF5ZXIgPSByZXF1aXJlKCcuLi9lbnRpdGllcy9wbGF5ZXInKTtcbiAgICB0aGlzLnBsYXllciA9IG5ldyBQbGF5ZXIodGhpcy5nYW1lLCB0aGlzLmdhbWUud2lkdGgvMiwgdGhpcy5nYW1lLmhlaWdodCAtIDIwMCk7XG4gICAgdGhpcy5nYW1lLmFkZC5leGlzdGluZyh0aGlzLnBsYXllcik7XG5cblxuICAgIC8vIGludmlzaWJsZSBoZWxwZXIgb2JqZWN0IHRvIGRldGVybWluZSBpZiBzY2FmZm9sZGluZyBleGlzdHMgaW4gdGhlIGRpcmVjdGlvbiBwcmVzc2VkXG4gICAgdGhpcy50YXJnZXRQb3NpdGlvbiA9IHRoaXMuZ2FtZS5hZGQuc3ByaXRlKHRoaXMucGxheWVyLngsIHRoaXMucGxheWVyLnkpO1xuICAgIHRoaXMuZ2FtZS5waHlzaWNzLmVuYWJsZSh0aGlzLnRhcmdldFBvc2l0aW9uLCBQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICAgIHRoaXMudGFyZ2V0UG9zaXRpb24uYm9keS5hbGxvd0dyYXZpdHkgPSBmYWxzZTtcbiAgICB0aGlzLnRhcmdldFBvc2l0aW9uLmJvZHkuc2V0U2l6ZSgxMCwgMTAsIHRoaXMudGFyZ2V0UG9zaXRpb24ud2lkdGgvMi01LCB0aGlzLnRhcmdldFBvc2l0aW9uLmhlaWdodC8yLTUpO1xuXG5cblxuICAgIHRoaXMuc2NhZmZvbGRQb29sID0gdGhpcy5nYW1lLmFkZC5ncm91cCgpO1xuXG4gICAgLy8gc3RhcnQgc2NhZmZvbGQgcG9vbCB3aXRoIDEwMCBwaWVjZXNcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgMTAwOyBpKyspIHtcbiAgICAgICAgLy8gYWRkU2NhZmZvbGRUb1Bvb2wuY2FsbCh0aGlzKTtcbiAgICAgICAgdGhpcy5hZGRTY2FmZm9sZFRvUG9vbCgpO1xuICAgIH1cblxuICAgIC8vIGxheSBzb21lIGluaXRpYWwgc2NhZmZvbGRpbmdcbiAgICBmb3IodmFyIHggPSAwOyB4IDwgdGhpcy5nYW1lLndpZHRoOyB4ICs9IHRoaXMuc2NhZmZvbGRQb29sLmdldEF0KDApLndpZHRoKSB7XG4gICAgICAgIHRoaXMuYnVpbGRTY2FmZm9sZCh4LCB0aGlzLmdhbWUuaGVpZ2h0IC0gdGhpcy5zY2FmZm9sZFBvb2wuZ2V0QXQoMCkuaGVpZ2h0LTMwKTtcbiAgICB9XG5cblxuICAgIC8vIENhcHR1cmUgY2VydGFpbiBrZXlzIHRvIHByZXZlbnQgdGhlaXIgZGVmYXVsdCBhY3Rpb25zIGluIHRoZSBicm93c2VyLlxuICAgIC8vIFRoaXMgaXMgb25seSBuZWNlc3NhcnkgYmVjYXVzZSB0aGlzIGlzIGFuIEhUTUw1IGdhbWUuIEdhbWVzIG9uIG90aGVyXG4gICAgLy8gcGxhdGZvcm1zIG1heSBub3QgbmVlZCBjb2RlIGxpa2UgdGhpcy5cbiAgICB0aGlzLmdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5Q2FwdHVyZShbXG4gICAgICAgIFBoYXNlci5LZXlib2FyZC5MRUZULFxuICAgICAgICBQaGFzZXIuS2V5Ym9hcmQuUklHSFQsXG4gICAgICAgIFBoYXNlci5LZXlib2FyZC5VUCxcbiAgICAgICAgUGhhc2VyLktleWJvYXJkLkRPV05cbiAgICBdKTtcblxuICAgIC8vIEp1c3QgZm9yIGZ1biwgZHJhdyBzb21lIGhlaWdodCBtYXJrZXJzIHNvIHdlIGNhbiBzZWUgaG93IGhpZ2ggd2UncmUganVtcGluZ1xuICAgIHRoaXMuZHJhd0hlaWdodE1hcmtlcnMoKTtcblxuICAgIC8vIFNob3cgRlBTXG4gICAgdGhpcy5nYW1lLnRpbWUuYWR2YW5jZWRUaW1pbmcgPSB0cnVlO1xuICAgIHRoaXMuZnBzVGV4dCA9IHRoaXMuZ2FtZS5hZGQudGV4dChcbiAgICAgICAgMjAsIDIwLCAnJywgeyBmb250OiAnMTZweCBBcmlhbCcsIGZpbGw6ICcjZmZmZmZmJyB9XG4gICAgKTtcbn07XG5cbkdhbWVTdGF0ZS5wcm90b3R5cGUuYWRkU2NhZmZvbGRUb1Bvb2wgPSBmdW5jdGlvbigpe1xuICAgIHZhciBzY2FmZm9sZCA9IHRoaXMuZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdzY2FmZm9sZCcpO1xuICAgIHNjYWZmb2xkLm5hbWUgPSAnc2NhZmZvbGQnK3RoaXMuc2NhZmZvbGRQb29sLmxlbmd0aDtcbiAgICBzY2FmZm9sZC5zY2FsZS54ID0gMi41O1xuICAgIHNjYWZmb2xkLnNjYWxlLnkgPSAyO1xuICAgIHRoaXMuc2NhZmZvbGRQb29sLmFkZChzY2FmZm9sZCk7XG5cbiAgICAvLyBFbmFibGUgcGh5c2ljcyBvbiB0aGUgc2NhZmZvbGRcbiAgICB0aGlzLmdhbWUucGh5c2ljcy5lbmFibGUoc2NhZmZvbGQsIFBoYXNlci5QaHlzaWNzLkFSQ0FERSk7XG4gICAgc2NhZmZvbGQuYm9keS5pbW1vdmFibGUgPSB0cnVlO1xuICAgIHNjYWZmb2xkLmJvZHkuYWxsb3dHcmF2aXR5ID0gZmFsc2U7XG4gICAgc2NhZmZvbGQuYm9keS5zZXRTaXplKDMyLCA1LCAwICwgNjQtMTApO1xuXG4gICAgLy8gU2V0IGl0cyBpbml0aWFsIHN0YXRlIHRvIFwiZGVhZFwiLlxuICAgIHNjYWZmb2xkLmtpbGwoKTtcblxuICAgIHNjYWZmb2xkLmNoZWNrV29ybGRCb3VuZHMgPSB0cnVlO1xuICAgIHNjYWZmb2xkLm91dE9mQm91bmRzS2lsbCA9IHRydWU7XG5cbiAgICByZXR1cm4gc2NhZmZvbGQ7XG59O1xuXG5HYW1lU3RhdGUucHJvdG90eXBlLmJ1aWxkU2NhZmZvbGQgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgIHZhciBidWlsZFRpbWUgPSBQaGFzZXIuVGltZXIuU0VDT05EICogMC42O1xuICAgIHRoaXMucGxheWVyLmJ1aWxkaW5nID0gdHJ1ZTtcbiAgICAvLyBHZXQgYSBkZWFkIHNjYWZmb2xkIGZyb20gdGhlIHBvb2xcbiAgICB2YXIgc2NhZmZvbGQgPSB0aGlzLnNjYWZmb2xkUG9vbC5nZXRGaXJzdERlYWQoKTtcbiAgICBpZiAoc2NhZmZvbGQgPT09IG51bGwpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJpbmNyZWFzaW5nIHNjYWZmb2xkIHBvb2wgdG9cIiwgdGhpcy5zY2FmZm9sZFBvb2wubGVuZ3RoKTtcbiAgICAgICAgc2NhZmZvbGQgPSB0aGlzLmFkZFNjYWZmb2xkVG9Qb29sKCk7XG4gICAgfVxuICAgIHNjYWZmb2xkLnJldml2ZSgpO1xuICAgIHNjYWZmb2xkLnJlc2V0KHgsIHkpO1xuICAgIHNjYWZmb2xkLmFscGhhID0gMDtcbiAgICAvLyBmYWRlIGluICh0ZW1wIGFuaW1hdGlvbilcbiAgICB0aGlzLmdhbWUuYWRkLnR3ZWVuKHNjYWZmb2xkKS50byggeyBhbHBoYTogMSB9LCBidWlsZFRpbWUsIFBoYXNlci5FYXNpbmcuTGluZWFyLk5vbmUsIHRydWUpO1xuXG4gICAgZnVuY3Rpb24gc3RvcEJ1aWxkaW5nKCkge3RoaXMucGxheWVyLmJ1aWxkaW5nID0gZmFsc2U7fVxuICAgIHRoaXMuZ2FtZS50aW1lLmV2ZW50cy5hZGQoYnVpbGRUaW1lLCBzdG9wQnVpbGRpbmcsIHRoaXMpO1xuXG4gICAgcmV0dXJuIHNjYWZmb2xkO1xufTtcblxuR2FtZVN0YXRlLnByb3RvdHlwZS5leHRlbmRTY2FmZm9sZCA9IGZ1bmN0aW9uKGFuY2hvclNjYWZmb2xkLCBkaXJlY3Rpb24pIHtcbiAgICBzd2l0Y2ggKGRpcmVjdGlvbikge1xuICAgICAgICBjYXNlICd1cCc6XG4gICAgICAgIHRoaXMuYnVpbGRTY2FmZm9sZChhbmNob3JTY2FmZm9sZC54LCBhbmNob3JTY2FmZm9sZC55IC0gYW5jaG9yU2NhZmZvbGQuaGVpZ2h0KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgdGhpcy5idWlsZFNjYWZmb2xkKGFuY2hvclNjYWZmb2xkLnggKyBhbmNob3JTY2FmZm9sZC53aWR0aCwgYW5jaG9yU2NhZmZvbGQueSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgdGhpcy5idWlsZFNjYWZmb2xkKGFuY2hvclNjYWZmb2xkLnggLSBhbmNob3JTY2FmZm9sZC53aWR0aCwgYW5jaG9yU2NhZmZvbGQueSk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbn07XG5cbkdhbWVTdGF0ZS5wcm90b3R5cGUuZ2V0U2NhZmZvbGRVbmRlcmZvb3QgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2NhZmZvbGRVbmRlckZvb3Q7XG4gICAgdGhpcy50YXJnZXRQb3NpdGlvbi5ib2R5LnJlc2V0KHRoaXMucGxheWVyLngsIHRoaXMucGxheWVyLnkgKyB0aGlzLnBsYXllci5oZWlnaHQvMik7XG4gICAgZnVuY3Rpb24gY29sbGlzaW9uSGFuZGxlcihwbGF5ZXIsIHNjYWZmb2xkKSB7XG4gICAgICAgIHNjYWZmb2xkVW5kZXJGb290ID0gc2NhZmZvbGQ7XG4gICAgfVxuICAgIHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS5vdmVybGFwKHRoaXMudGFyZ2V0UG9zaXRpb24sIHRoaXMuc2NhZmZvbGRQb29sLCBjb2xsaXNpb25IYW5kbGVyLCBudWxsLCB0aGlzKTtcbiAgICByZXR1cm4gc2NhZmZvbGRVbmRlckZvb3Q7XG59O1xuXG5cbi8vIFRoaXMgZnVuY3Rpb24gZHJhd3MgaG9yaXpvbnRhbCBsaW5lcyBhY3Jvc3MgdGhlIHN0YWdlXG5HYW1lU3RhdGUucHJvdG90eXBlLmRyYXdIZWlnaHRNYXJrZXJzID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gQ3JlYXRlIGEgYml0bWFwIHRoZSBzYW1lIHNpemUgYXMgdGhlIHN0YWdlXG4gICAgdmFyIGJpdG1hcCA9IHRoaXMuZ2FtZS5hZGQuYml0bWFwRGF0YSh0aGlzLmdhbWUud2lkdGgsIHRoaXMuZ2FtZS5oZWlnaHQpO1xuXG4gICAgLy8gVGhlc2UgZnVuY3Rpb25zIHVzZSB0aGUgY2FudmFzIGNvbnRleHQgdG8gZHJhdyBsaW5lcyB1c2luZyB0aGUgY2FudmFzIEFQSVxuICAgIGZvcih5ID0gdGhpcy5nYW1lLmhlaWdodC0zMjsgeSA+PSA2NDsgeSAtPSAzMikge1xuICAgICAgICBiaXRtYXAuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgYml0bWFwLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSAncmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpJztcbiAgICAgICAgYml0bWFwLmNvbnRleHQubW92ZVRvKDAsIHkpO1xuICAgICAgICBiaXRtYXAuY29udGV4dC5saW5lVG8odGhpcy5nYW1lLndpZHRoLCB5KTtcbiAgICAgICAgYml0bWFwLmNvbnRleHQuc3Ryb2tlKCk7XG4gICAgfVxuXG4gICAgdGhpcy5nYW1lLmFkZC5pbWFnZSgwLCAwLCBiaXRtYXApO1xufTtcblxuLy8gVGhlIHVwZGF0ZSgpIG1ldGhvZCBpcyBjYWxsZWQgZXZlcnkgZnJhbWVcbkdhbWVTdGF0ZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuZ2FtZS50aW1lLmZwcyAhPT0gMCkge1xuICAgICAgICB0aGlzLmZwc1RleHQuc2V0VGV4dCh0aGlzLmdhbWUudGltZS5mcHMgKyAnIEZQUycpO1xuICAgIH1cblxuICAgIC8vIENvbGxpZGUgdGhlIHBsYXllciB3aXRoIHRoZSBzY2FmZm9sZFxuICAgIHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHRoaXMucGxheWVyLCB0aGlzLnNjYWZmb2xkUG9vbCk7XG5cbiAgICBwbGF5ZXJzRmVldCA9IHRoaXMucGxheWVyLnkrdGhpcy5wbGF5ZXIuaGVpZ2h0LzI7XG5cbiAgICAvLyB0YXJnZXRQb3NpdGlvbiBmb2xsb3dzIHBsYXllclxuICAgIHRoaXMudGFyZ2V0UG9zaXRpb24uYm9keS5yZXNldCh0aGlzLnBsYXllci54LCBwbGF5ZXJzRmVldCk7XG5cbiAgICB0aGlzLnBsYXllci5ib2R5LmFjY2VsZXJhdGlvbi54ID0gMDtcblxuICAgIC8vIHVwZGF0ZSBpbnB1dHNcblxuICAgIGlmICghdGhpcy5wbGF5ZXIuaXNCdXN5KCkgJiYgdGhpcy5sZWZ0SW5wdXRJc0FjdGl2ZSgpKSB7XG4gICAgICAgIHRoaXMudGFyZ2V0UG9zaXRpb24uYm9keS5yZXNldCh0aGlzLnBsYXllci54IC0gdGhpcy5zY2FmZm9sZFBvb2wuZ2V0QXQoMCkud2lkdGgqNC81LCBwbGF5ZXJzRmVldCk7XG4gICAgICAgIHRoaXMuYnVpbGRPck1vdmUoJ2xlZnQnLCB0aGlzLnBsYXllci53YWxrTGVmdCk7XG4gICAgfVxuICAgIGlmICghdGhpcy5wbGF5ZXIuaXNCdXN5KCkgJiYgdGhpcy5yaWdodElucHV0SXNBY3RpdmUoKSkge1xuICAgICAgICB0aGlzLnRhcmdldFBvc2l0aW9uLmJvZHkucmVzZXQodGhpcy5wbGF5ZXIueCArIHRoaXMuc2NhZmZvbGRQb29sLmdldEF0KDApLndpZHRoKjQvNSwgcGxheWVyc0ZlZXQpO1xuICAgICAgICB0aGlzLmJ1aWxkT3JNb3ZlKCdyaWdodCcsIHRoaXMucGxheWVyLndhbGtSaWdodCk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLnBsYXllci5pc0J1c3koKSAmJiB0aGlzLnVwSW5wdXRJc0FjdGl2ZSgpKSB7XG4gICAgICAgIHRoaXMucGxheWVyLmJvZHkuYWNjZWxlcmF0aW9uLnggPSAwO1xuICAgICAgICB0aGlzLnRhcmdldFBvc2l0aW9uLmJvZHkucmVzZXQodGhpcy5wbGF5ZXIueCwgcGxheWVyc0ZlZXQgLSB0aGlzLnNjYWZmb2xkUG9vbC5nZXRBdCgwKS5oZWlnaHQpO1xuICAgICAgICB0aGlzLmJ1aWxkT3JNb3ZlKCd1cCcsIHRoaXMucGxheWVyLmNsaW1iKTtcbiAgICB9XG5cbiAgICAvLyBmb3IgZGVidWdnaW5nIGFjdGlvbnMgLy9cbiAgICBpZih0aGlzLmlucHV0LmtleWJvYXJkLmp1c3RQcmVzc2VkKFBoYXNlci5LZXlib2FyZC5ET1dOLDEpKXtcbiAgICAgICAgdGhpcy5nZXRTY2FmZm9sZFVuZGVyZm9vdCgpO1xuICAgIH1cblxufTtcblxuR2FtZVN0YXRlLnByb3RvdHlwZS5idWlsZE9yTW92ZSA9IGZ1bmN0aW9uKGRpcmVjdGlvbiwgbW92ZUZuKSB7XG4gICAgLy8gQ29sbGlkZSB0aGUgdGFyZ2V0UG9zaXRpb24gd2l0aCB0aGUgc2NhZmZvbGRcbiAgICBpZih0aGlzLmdhbWUucGh5c2ljcy5hcmNhZGUub3ZlcmxhcCh0aGlzLnRhcmdldFBvc2l0aW9uLCB0aGlzLnNjYWZmb2xkUG9vbCkpIHtcbiAgICAgICAgLy8gc2NhZmZvbGQgZXhpc3RzIHRvIG1vdmUgdG9cbiAgICAgICAgLy8gVE9ETyAtIG9ubHkgY2xpbWIgaWYgdXAgaXMgaGVsZCBmb3IgLjUgc2VjXG4gICAgICAgIG1vdmVGbi5jYWxsKHRoaXMucGxheWVyLCB0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBzdG9wIGFuZCBidWlsZFxuICAgICAgICB0aGlzLnBsYXllci5ib2R5LmFjY2VsZXJhdGlvbi54ID0gMDtcblxuICAgICAgICAvLyBkaXJlY3Rpb24gcGFzc2VkIGluIGFzICd1cCcsICdsZWZ0JywgJ3JpZ2h0J1xuICAgICAgICBhbmNob3JTY2FmZm9sZCA9IHRoaXMuZ2V0U2NhZmZvbGRVbmRlcmZvb3QoKTtcbiAgICAgICAgdGhpcy5leHRlbmRTY2FmZm9sZChhbmNob3JTY2FmZm9sZCwgZGlyZWN0aW9uKTtcblxuICAgICAgICAvLyBUT0RPIC0gRE9OJ1QgQlVJTEQgSUYgSVQgV0lMTCBCRSBPRkYgU0NSRUVOXG4gICAgfVxufTtcblxuLy8gVGhpcyBmdW5jdGlvbiBzaG91bGQgcmV0dXJuIHRydWUgd2hlbiB0aGUgcGxheWVyIGFjdGl2YXRlcyB0aGUgXCJnbyBsZWZ0XCIgY29udHJvbFxuLy8gSW4gdGhpcyBjYXNlLCBlaXRoZXIgaG9sZGluZyB0aGUgcmlnaHQgYXJyb3cgb3IgdGFwcGluZyBvciBjbGlja2luZyBvbiB0aGUgbGVmdFxuLy8gc2lkZSBvZiB0aGUgc2NyZWVuLlxuR2FtZVN0YXRlLnByb3RvdHlwZS5sZWZ0SW5wdXRJc0FjdGl2ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpc0FjdGl2ZSA9IGZhbHNlO1xuXG4gICAgaXNBY3RpdmUgPSB0aGlzLmlucHV0LmtleWJvYXJkLmlzRG93bihQaGFzZXIuS2V5Ym9hcmQuTEVGVCk7XG4gICAgaXNBY3RpdmUgfD0gKHRoaXMuZ2FtZS5pbnB1dC5hY3RpdmVQb2ludGVyLmlzRG93biAmJlxuICAgICAgICB0aGlzLmdhbWUuaW5wdXQuYWN0aXZlUG9pbnRlci54IDwgdGhpcy5nYW1lLndpZHRoLzQpO1xuXG4gICAgcmV0dXJuIGlzQWN0aXZlO1xufTtcblxuLy8gVGhpcyBmdW5jdGlvbiBzaG91bGQgcmV0dXJuIHRydWUgd2hlbiB0aGUgcGxheWVyIGFjdGl2YXRlcyB0aGUgXCJnbyByaWdodFwiIGNvbnRyb2xcbi8vIEluIHRoaXMgY2FzZSwgZWl0aGVyIGhvbGRpbmcgdGhlIHJpZ2h0IGFycm93IG9yIHRhcHBpbmcgb3IgY2xpY2tpbmcgb24gdGhlIHJpZ2h0XG4vLyBzaWRlIG9mIHRoZSBzY3JlZW4uXG5HYW1lU3RhdGUucHJvdG90eXBlLnJpZ2h0SW5wdXRJc0FjdGl2ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpc0FjdGl2ZSA9IGZhbHNlO1xuXG4gICAgaXNBY3RpdmUgPSB0aGlzLmlucHV0LmtleWJvYXJkLmlzRG93bihQaGFzZXIuS2V5Ym9hcmQuUklHSFQpO1xuICAgIGlzQWN0aXZlIHw9ICh0aGlzLmdhbWUuaW5wdXQuYWN0aXZlUG9pbnRlci5pc0Rvd24gJiZcbiAgICAgICAgdGhpcy5nYW1lLmlucHV0LmFjdGl2ZVBvaW50ZXIueCA+IHRoaXMuZ2FtZS53aWR0aC8yICsgdGhpcy5nYW1lLndpZHRoLzQpO1xuXG4gICAgcmV0dXJuIGlzQWN0aXZlO1xufTtcblxuLy8gVGhpcyBmdW5jdGlvbiBzaG91bGQgcmV0dXJuIHRydWUgd2hlbiB0aGUgcGxheWVyIGFjdGl2YXRlcyB0aGUgXCJqdW1wXCIgY29udHJvbFxuLy8gSW4gdGhpcyBjYXNlLCBlaXRoZXIgaG9sZGluZyB0aGUgdXAgYXJyb3cgb3IgdGFwcGluZyBvciBjbGlja2luZyBvbiB0aGUgY2VudGVyXG4vLyBwYXJ0IG9mIHRoZSBzY3JlZW4uXG5HYW1lU3RhdGUucHJvdG90eXBlLnVwSW5wdXRJc0FjdGl2ZSA9IGZ1bmN0aW9uKGR1cmF0aW9uKSB7XG4gICAgdmFyIGlzQWN0aXZlID0gZmFsc2U7XG5cbiAgICBpc0FjdGl2ZSA9IHRoaXMuaW5wdXQua2V5Ym9hcmQuanVzdFByZXNzZWQoUGhhc2VyLktleWJvYXJkLlVQLCBkdXJhdGlvbik7XG4gICAgaXNBY3RpdmUgfD0gKHRoaXMuZ2FtZS5pbnB1dC5hY3RpdmVQb2ludGVyLmp1c3RQcmVzc2VkKGR1cmF0aW9uICsgMTAwMC82MCkgJiZcbiAgICAgICAgdGhpcy5nYW1lLmlucHV0LmFjdGl2ZVBvaW50ZXIueCA+IHRoaXMuZ2FtZS53aWR0aC80ICYmXG4gICAgICAgIHRoaXMuZ2FtZS5pbnB1dC5hY3RpdmVQb2ludGVyLnggPCB0aGlzLmdhbWUud2lkdGgvMiArIHRoaXMuZ2FtZS53aWR0aC80KTtcblxuICAgIHJldHVybiBpc0FjdGl2ZTtcbn07XG5cbkdhbWVTdGF0ZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuXG4gICAgLy8gZ2FtZS5kZWJ1Zy5ib2R5SW5mbyh0aGlzLnBsYXllciwgMzIsIDMyKTtcblxuICAgIHRoaXMuZ2FtZS5kZWJ1Zy5ib2R5KHRoaXMudGFyZ2V0UG9zaXRpb24pO1xuICAgIHRoaXMuZ2FtZS5kZWJ1Zy5ib2R5KHRoaXMucGxheWVyKTtcbiAgICB0aGlzLnNjYWZmb2xkUG9vbC5mb3JFYWNoKGZ1bmN0aW9uKHNjYWZmb2xkKXt0aGlzLmdhbWUuZGVidWcuYm9keShzY2FmZm9sZCk7fSx0aGlzKTtcbn07Il19
