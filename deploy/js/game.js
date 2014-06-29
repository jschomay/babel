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

Player.prototype.climb = function() {
    this.climbing = true;
    var climbTween = this.game.add.tween(this.body);
    climbTween.to({y: (this.body.y - this.height * 3)}, 1000, Phaser.Easing.Linear.None, true);
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
    this.player = new Player(this.game, this.game.width/2, this.game.height - 64);
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
    for(var x = 0; x < this.game.width; x += 64) {
        this.buildScaffold(x, this.game.height - 32);
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
    scaffold.scale.x = 2;
    this.scaffoldPool.add(scaffold);

    // Enable physics on the scaffold
    this.game.physics.enable(scaffold, Phaser.Physics.ARCADE);
    scaffold.body.immovable = true;
    scaffold.body.allowGravity = false;

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
        this.buildScaffold(anchorScaffold.x, anchorScaffold.y - anchorScaffold.height*3);
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
    this.targetPosition.body.reset(this.player.x, this.player.y + this.player.height);
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

    // targetPosition follows player
    this.targetPosition.body.reset(this.player.x, this.player.y);

    this.player.body.acceleration.x = 0;

    // update inputs

    if (!this.player.isBusy() && this.leftInputIsActive()) {
        this.targetPosition.body.reset(this.player.x - this.scaffoldPool.getAt(0).width, this.player.y + this.player.height);
        this.buildOrMove('left', this.player.walkLeft);
    }
    if (!this.player.isBusy() && this.rightInputIsActive()) {
        this.targetPosition.body.reset(this.player.x + this.scaffoldPool.getAt(0).width, this.player.y + this.player.height);
        this.buildOrMove('right', this.player.walkRight);
    }

    if (!this.player.isBusy() && this.upInputIsActive()) {
        this.player.body.acceleration.x = 0;
        this.targetPosition.body.reset(this.player.x, this.player.y - this.player.height*2);
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
        moveFn.call(this.player);
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
    // this.scaffoldPool.forEach(function(scaffold){this.game.debug.body(scaffold);},this);
};
},{"../entities/player":1}]},{},[1,2,3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvSmVmZi9Eb2N1bWVudHMvYmFiZWwvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9KZWZmL0RvY3VtZW50cy9iYWJlbC9zcmMvZ2FtZS9lbnRpdGllcy9wbGF5ZXIuanMiLCIvVXNlcnMvSmVmZi9Eb2N1bWVudHMvYmFiZWwvc3JjL2dhbWUvbWFpbi5qcyIsIi9Vc2Vycy9KZWZmL0RvY3VtZW50cy9iYWJlbC9zcmMvZ2FtZS9zdGF0ZXMvcGxheS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IFBsYXllciA9IGZ1bmN0aW9uKGdhbWUsIHgsIHkpIHtcbiAgICBQaGFzZXIuU3ByaXRlLmNhbGwodGhpcywgZ2FtZSwgeCwgeSwgJ3BsYXllcicpO1xuXG4gICAgdGhpcy5NQVhfU1BFRUQgPSAzMDA7IC8vIHBpeGVscy9zZWNvbmRcbiAgICB0aGlzLkFDQ0VMRVJBVElPTiA9IDIwMDA7IC8vIHBpeGVscy9zZWNvbmQvc2Vjb25kXG4gICAgdGhpcy5EUkFHID0gMjAwMDsgLy8gcGl4ZWxzL3NlY29uZFxuICAgIHRoaXMuSlVNUF9TUEVFRCA9IC0xMDAwOyAvLyBwaXhlbHMvc2Vjb25kIChuZWdhdGl2ZSB5IGlzIHVwKVxuXG4gICAgZ2FtZS5waHlzaWNzLmVuYWJsZSh0aGlzLCBQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICAgIHRoaXMuYm9keS5jb2xsaWRlV29ybGRCb3VuZHMgPSB0cnVlO1xuICAgIHRoaXMuYm9keS5jaGVja0NvbGxpc2lvbi51cCA9IGZhbHNlO1xuICAgIHRoaXMuYm9keS5tYXhWZWxvY2l0eS5zZXRUbyh0aGlzLk1BWF9TUEVFRCwgdGhpcy5NQVhfU1BFRUQgKiAxMCk7IC8vIHgsIHlcbiAgICB0aGlzLmJvZHkuZHJhZy5zZXRUbyh0aGlzLkRSQUcsIDApOyAvLyB4LCB5XG59O1xuXG5QbGF5ZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQaGFzZXIuU3ByaXRlLnByb3RvdHlwZSk7XG5QbGF5ZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUGxheWVyO1xuXG4vLyBwbGF5ZXIgbW92ZW1lbnRzXG5QbGF5ZXIucHJvdG90eXBlLndhbGtMZWZ0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5ib2R5LmFjY2VsZXJhdGlvbi54ICs9IC10aGlzLkFDQ0VMRVJBVElPTjtcbn07XG5cblBsYXllci5wcm90b3R5cGUud2Fsa1JpZ2h0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5ib2R5LmFjY2VsZXJhdGlvbi54ICs9IHRoaXMuQUNDRUxFUkFUSU9OO1xufTtcblxuUGxheWVyLnByb3RvdHlwZS5jbGltYiA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuY2xpbWJpbmcgPSB0cnVlO1xuICAgIHZhciBjbGltYlR3ZWVuID0gdGhpcy5nYW1lLmFkZC50d2Vlbih0aGlzLmJvZHkpO1xuICAgIGNsaW1iVHdlZW4udG8oe3k6ICh0aGlzLmJvZHkueSAtIHRoaXMuaGVpZ2h0ICogMyl9LCAxMDAwLCBQaGFzZXIuRWFzaW5nLkxpbmVhci5Ob25lLCB0cnVlKTtcbiAgICBjbGltYlR3ZWVuLm9uQ29tcGxldGUuYWRkKGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmNsaW1iaW5nID0gZmFsc2U7XG4gICAgfSwgdGhpcyk7XG59O1xuXG5QbGF5ZXIucHJvdG90eXBlLmlzQnVzeSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAhIXRoaXMuY2xpbWJpbmcgfHwgISF0aGlzLmJ1aWxkaW5nO1xufTtcblxuXG5QbGF5ZXIucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuXG59OyIsIi8vIFRoaXMgZXhhbXBsZSB1c2VzIHRoZSBQaGFzZXIgMi4wLjQgZnJhbWV3b3JrXG5cbi8vIENvcHlyaWdodCDCqSAyMDE0IEpvaG4gV2F0c29uXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIE1JVCBMaWNlbnNlXG5cblxudmFyIGdhbWUgPSBuZXcgUGhhc2VyLkdhbWUoODAwLCA1MDAsIFBoYXNlci5BVVRPLCAnZ2FtZScpO1xuR2FtZVN0YXRlID0gcmVxdWlyZSgnLi9zdGF0ZXMvcGxheScpO1xuZ2FtZS5zdGF0ZS5hZGQoJ2dhbWUnLCBHYW1lU3RhdGUsIHRydWUpO1xuXG53aW5kb3cuZ2FtZSA9IGdhbWU7IiwibW9kdWxlLmV4cG9ydHMgPSBHYW1lU3RhdGUgPSBmdW5jdGlvbihnYW1lKSB7XG59O1xuXG4vLyBMb2FkIGltYWdlcyBhbmQgc291bmRzXG5HYW1lU3RhdGUucHJvdG90eXBlLnByZWxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmdhbWUubG9hZC5pbWFnZSgnc2NhZmZvbGQnLCAnL2Fzc2V0cy9zY2FmZm9sZC5wbmcnKTtcbiAgICB0aGlzLmdhbWUubG9hZC5pbWFnZSgncGxheWVyJywgJy9hc3NldHMvcGxheWVyLnBuZycpO1xufTtcblxuLy8gU2V0dXAgdGhlIGV4YW1wbGVcbkdhbWVTdGF0ZS5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gU2V0IHN0YWdlIGJhY2tncm91bmQgdG8gc29tZXRoaW5nIHNreSBjb2xvcmVkXG4gICAgdGhpcy5nYW1lLnN0YWdlLmJhY2tncm91bmRDb2xvciA9IDB4NDQ4OGNjO1xuXG4gICAgdGhpcy5HUkFWSVRZID0gMjYwMDsgLy8gcGl4ZWxzL3NlY29uZC9zZWNvbmRcbiAgICB0aGlzLmdhbWUucGh5c2ljcy5hcmNhZGUuZ3Jhdml0eS55ID0gdGhpcy5HUkFWSVRZO1xuXG4gICAgdmFyIFBsYXllciA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL3BsYXllcicpO1xuICAgIHRoaXMucGxheWVyID0gbmV3IFBsYXllcih0aGlzLmdhbWUsIHRoaXMuZ2FtZS53aWR0aC8yLCB0aGlzLmdhbWUuaGVpZ2h0IC0gNjQpO1xuICAgIHRoaXMuZ2FtZS5hZGQuZXhpc3RpbmcodGhpcy5wbGF5ZXIpO1xuXG5cbiAgICAvLyBpbnZpc2libGUgaGVscGVyIG9iamVjdCB0byBkZXRlcm1pbmUgaWYgc2NhZmZvbGRpbmcgZXhpc3RzIGluIHRoZSBkaXJlY3Rpb24gcHJlc3NlZFxuICAgIHRoaXMudGFyZ2V0UG9zaXRpb24gPSB0aGlzLmdhbWUuYWRkLnNwcml0ZSh0aGlzLnBsYXllci54LCB0aGlzLnBsYXllci55KTtcbiAgICB0aGlzLmdhbWUucGh5c2ljcy5lbmFibGUodGhpcy50YXJnZXRQb3NpdGlvbiwgUGhhc2VyLlBoeXNpY3MuQVJDQURFKTtcbiAgICB0aGlzLnRhcmdldFBvc2l0aW9uLmJvZHkuYWxsb3dHcmF2aXR5ID0gZmFsc2U7XG4gICAgdGhpcy50YXJnZXRQb3NpdGlvbi5ib2R5LnNldFNpemUoMTAsIDEwLCB0aGlzLnRhcmdldFBvc2l0aW9uLndpZHRoLzItNSwgdGhpcy50YXJnZXRQb3NpdGlvbi5oZWlnaHQvMi01KTtcblxuXG5cbiAgICB0aGlzLnNjYWZmb2xkUG9vbCA9IHRoaXMuZ2FtZS5hZGQuZ3JvdXAoKTtcblxuICAgIC8vIHN0YXJ0IHNjYWZmb2xkIHBvb2wgd2l0aCAxMDAgcGllY2VzXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IDEwMDsgaSsrKSB7XG4gICAgICAgIC8vIGFkZFNjYWZmb2xkVG9Qb29sLmNhbGwodGhpcyk7XG4gICAgICAgIHRoaXMuYWRkU2NhZmZvbGRUb1Bvb2woKTtcbiAgICB9XG5cbiAgICAvLyBsYXkgc29tZSBpbml0aWFsIHNjYWZmb2xkaW5nXG4gICAgZm9yKHZhciB4ID0gMDsgeCA8IHRoaXMuZ2FtZS53aWR0aDsgeCArPSA2NCkge1xuICAgICAgICB0aGlzLmJ1aWxkU2NhZmZvbGQoeCwgdGhpcy5nYW1lLmhlaWdodCAtIDMyKTtcbiAgICB9XG5cblxuICAgIC8vIENhcHR1cmUgY2VydGFpbiBrZXlzIHRvIHByZXZlbnQgdGhlaXIgZGVmYXVsdCBhY3Rpb25zIGluIHRoZSBicm93c2VyLlxuICAgIC8vIFRoaXMgaXMgb25seSBuZWNlc3NhcnkgYmVjYXVzZSB0aGlzIGlzIGFuIEhUTUw1IGdhbWUuIEdhbWVzIG9uIG90aGVyXG4gICAgLy8gcGxhdGZvcm1zIG1heSBub3QgbmVlZCBjb2RlIGxpa2UgdGhpcy5cbiAgICB0aGlzLmdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5Q2FwdHVyZShbXG4gICAgICAgIFBoYXNlci5LZXlib2FyZC5MRUZULFxuICAgICAgICBQaGFzZXIuS2V5Ym9hcmQuUklHSFQsXG4gICAgICAgIFBoYXNlci5LZXlib2FyZC5VUCxcbiAgICAgICAgUGhhc2VyLktleWJvYXJkLkRPV05cbiAgICBdKTtcblxuICAgIC8vIEp1c3QgZm9yIGZ1biwgZHJhdyBzb21lIGhlaWdodCBtYXJrZXJzIHNvIHdlIGNhbiBzZWUgaG93IGhpZ2ggd2UncmUganVtcGluZ1xuICAgIHRoaXMuZHJhd0hlaWdodE1hcmtlcnMoKTtcblxuICAgIC8vIFNob3cgRlBTXG4gICAgdGhpcy5nYW1lLnRpbWUuYWR2YW5jZWRUaW1pbmcgPSB0cnVlO1xuICAgIHRoaXMuZnBzVGV4dCA9IHRoaXMuZ2FtZS5hZGQudGV4dChcbiAgICAgICAgMjAsIDIwLCAnJywgeyBmb250OiAnMTZweCBBcmlhbCcsIGZpbGw6ICcjZmZmZmZmJyB9XG4gICAgKTtcbn07XG5cbkdhbWVTdGF0ZS5wcm90b3R5cGUuYWRkU2NhZmZvbGRUb1Bvb2wgPSBmdW5jdGlvbigpe1xuICAgIHZhciBzY2FmZm9sZCA9IHRoaXMuZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdzY2FmZm9sZCcpO1xuICAgIHNjYWZmb2xkLm5hbWUgPSAnc2NhZmZvbGQnK3RoaXMuc2NhZmZvbGRQb29sLmxlbmd0aDtcbiAgICBzY2FmZm9sZC5zY2FsZS54ID0gMjtcbiAgICB0aGlzLnNjYWZmb2xkUG9vbC5hZGQoc2NhZmZvbGQpO1xuXG4gICAgLy8gRW5hYmxlIHBoeXNpY3Mgb24gdGhlIHNjYWZmb2xkXG4gICAgdGhpcy5nYW1lLnBoeXNpY3MuZW5hYmxlKHNjYWZmb2xkLCBQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICAgIHNjYWZmb2xkLmJvZHkuaW1tb3ZhYmxlID0gdHJ1ZTtcbiAgICBzY2FmZm9sZC5ib2R5LmFsbG93R3Jhdml0eSA9IGZhbHNlO1xuXG4gICAgLy8gU2V0IGl0cyBpbml0aWFsIHN0YXRlIHRvIFwiZGVhZFwiLlxuICAgIHNjYWZmb2xkLmtpbGwoKTtcblxuICAgIHNjYWZmb2xkLmNoZWNrV29ybGRCb3VuZHMgPSB0cnVlO1xuICAgIHNjYWZmb2xkLm91dE9mQm91bmRzS2lsbCA9IHRydWU7XG5cbiAgICByZXR1cm4gc2NhZmZvbGQ7XG59O1xuXG5HYW1lU3RhdGUucHJvdG90eXBlLmJ1aWxkU2NhZmZvbGQgPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgIHZhciBidWlsZFRpbWUgPSBQaGFzZXIuVGltZXIuU0VDT05EICogMC42O1xuICAgIHRoaXMucGxheWVyLmJ1aWxkaW5nID0gdHJ1ZTtcbiAgICAvLyBHZXQgYSBkZWFkIHNjYWZmb2xkIGZyb20gdGhlIHBvb2xcbiAgICB2YXIgc2NhZmZvbGQgPSB0aGlzLnNjYWZmb2xkUG9vbC5nZXRGaXJzdERlYWQoKTtcbiAgICBpZiAoc2NhZmZvbGQgPT09IG51bGwpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJpbmNyZWFzaW5nIHNjYWZmb2xkIHBvb2wgdG9cIiwgdGhpcy5zY2FmZm9sZFBvb2wubGVuZ3RoKTtcbiAgICAgICAgc2NhZmZvbGQgPSB0aGlzLmFkZFNjYWZmb2xkVG9Qb29sKCk7XG4gICAgfVxuICAgIHNjYWZmb2xkLnJldml2ZSgpO1xuICAgIHNjYWZmb2xkLnJlc2V0KHgsIHkpO1xuICAgIHNjYWZmb2xkLmFscGhhID0gMDtcbiAgICAvLyBmYWRlIGluICh0ZW1wIGFuaW1hdGlvbilcbiAgICB0aGlzLmdhbWUuYWRkLnR3ZWVuKHNjYWZmb2xkKS50byggeyBhbHBoYTogMSB9LCBidWlsZFRpbWUsIFBoYXNlci5FYXNpbmcuTGluZWFyLk5vbmUsIHRydWUpO1xuXG4gICAgZnVuY3Rpb24gc3RvcEJ1aWxkaW5nKCkge3RoaXMucGxheWVyLmJ1aWxkaW5nID0gZmFsc2U7fVxuICAgIHRoaXMuZ2FtZS50aW1lLmV2ZW50cy5hZGQoYnVpbGRUaW1lLCBzdG9wQnVpbGRpbmcsIHRoaXMpO1xuXG4gICAgcmV0dXJuIHNjYWZmb2xkO1xufTtcblxuR2FtZVN0YXRlLnByb3RvdHlwZS5leHRlbmRTY2FmZm9sZCA9IGZ1bmN0aW9uKGFuY2hvclNjYWZmb2xkLCBkaXJlY3Rpb24pIHtcbiAgICBzd2l0Y2ggKGRpcmVjdGlvbikge1xuICAgICAgICBjYXNlICd1cCc6XG4gICAgICAgIHRoaXMuYnVpbGRTY2FmZm9sZChhbmNob3JTY2FmZm9sZC54LCBhbmNob3JTY2FmZm9sZC55IC0gYW5jaG9yU2NhZmZvbGQuaGVpZ2h0KjMpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICB0aGlzLmJ1aWxkU2NhZmZvbGQoYW5jaG9yU2NhZmZvbGQueCArIGFuY2hvclNjYWZmb2xkLndpZHRoLCBhbmNob3JTY2FmZm9sZC55KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICB0aGlzLmJ1aWxkU2NhZmZvbGQoYW5jaG9yU2NhZmZvbGQueCAtIGFuY2hvclNjYWZmb2xkLndpZHRoLCBhbmNob3JTY2FmZm9sZC55KTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxufTtcblxuR2FtZVN0YXRlLnByb3RvdHlwZS5nZXRTY2FmZm9sZFVuZGVyZm9vdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzY2FmZm9sZFVuZGVyRm9vdDtcbiAgICB0aGlzLnRhcmdldFBvc2l0aW9uLmJvZHkucmVzZXQodGhpcy5wbGF5ZXIueCwgdGhpcy5wbGF5ZXIueSArIHRoaXMucGxheWVyLmhlaWdodCk7XG4gICAgZnVuY3Rpb24gY29sbGlzaW9uSGFuZGxlcihwbGF5ZXIsIHNjYWZmb2xkKSB7XG4gICAgICAgIHNjYWZmb2xkVW5kZXJGb290ID0gc2NhZmZvbGQ7XG4gICAgfVxuICAgIHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS5vdmVybGFwKHRoaXMudGFyZ2V0UG9zaXRpb24sIHRoaXMuc2NhZmZvbGRQb29sLCBjb2xsaXNpb25IYW5kbGVyLCBudWxsLCB0aGlzKTtcbiAgICByZXR1cm4gc2NhZmZvbGRVbmRlckZvb3Q7XG59O1xuXG5cbi8vIFRoaXMgZnVuY3Rpb24gZHJhd3MgaG9yaXpvbnRhbCBsaW5lcyBhY3Jvc3MgdGhlIHN0YWdlXG5HYW1lU3RhdGUucHJvdG90eXBlLmRyYXdIZWlnaHRNYXJrZXJzID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gQ3JlYXRlIGEgYml0bWFwIHRoZSBzYW1lIHNpemUgYXMgdGhlIHN0YWdlXG4gICAgdmFyIGJpdG1hcCA9IHRoaXMuZ2FtZS5hZGQuYml0bWFwRGF0YSh0aGlzLmdhbWUud2lkdGgsIHRoaXMuZ2FtZS5oZWlnaHQpO1xuXG4gICAgLy8gVGhlc2UgZnVuY3Rpb25zIHVzZSB0aGUgY2FudmFzIGNvbnRleHQgdG8gZHJhdyBsaW5lcyB1c2luZyB0aGUgY2FudmFzIEFQSVxuICAgIGZvcih5ID0gdGhpcy5nYW1lLmhlaWdodC0zMjsgeSA+PSA2NDsgeSAtPSAzMikge1xuICAgICAgICBiaXRtYXAuY29udGV4dC5iZWdpblBhdGgoKTtcbiAgICAgICAgYml0bWFwLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSAncmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpJztcbiAgICAgICAgYml0bWFwLmNvbnRleHQubW92ZVRvKDAsIHkpO1xuICAgICAgICBiaXRtYXAuY29udGV4dC5saW5lVG8odGhpcy5nYW1lLndpZHRoLCB5KTtcbiAgICAgICAgYml0bWFwLmNvbnRleHQuc3Ryb2tlKCk7XG4gICAgfVxuXG4gICAgdGhpcy5nYW1lLmFkZC5pbWFnZSgwLCAwLCBiaXRtYXApO1xufTtcblxuXG4vLyBUaGUgdXBkYXRlKCkgbWV0aG9kIGlzIGNhbGxlZCBldmVyeSBmcmFtZVxuR2FtZVN0YXRlLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5nYW1lLnRpbWUuZnBzICE9PSAwKSB7XG4gICAgICAgIHRoaXMuZnBzVGV4dC5zZXRUZXh0KHRoaXMuZ2FtZS50aW1lLmZwcyArICcgRlBTJyk7XG4gICAgfVxuXG4gICAgLy8gQ29sbGlkZSB0aGUgcGxheWVyIHdpdGggdGhlIHNjYWZmb2xkXG4gICAgdGhpcy5nYW1lLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUodGhpcy5wbGF5ZXIsIHRoaXMuc2NhZmZvbGRQb29sKTtcblxuICAgIC8vIHRhcmdldFBvc2l0aW9uIGZvbGxvd3MgcGxheWVyXG4gICAgdGhpcy50YXJnZXRQb3NpdGlvbi5ib2R5LnJlc2V0KHRoaXMucGxheWVyLngsIHRoaXMucGxheWVyLnkpO1xuXG4gICAgdGhpcy5wbGF5ZXIuYm9keS5hY2NlbGVyYXRpb24ueCA9IDA7XG5cbiAgICAvLyB1cGRhdGUgaW5wdXRzXG5cbiAgICBpZiAoIXRoaXMucGxheWVyLmlzQnVzeSgpICYmIHRoaXMubGVmdElucHV0SXNBY3RpdmUoKSkge1xuICAgICAgICB0aGlzLnRhcmdldFBvc2l0aW9uLmJvZHkucmVzZXQodGhpcy5wbGF5ZXIueCAtIHRoaXMuc2NhZmZvbGRQb29sLmdldEF0KDApLndpZHRoLCB0aGlzLnBsYXllci55ICsgdGhpcy5wbGF5ZXIuaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5idWlsZE9yTW92ZSgnbGVmdCcsIHRoaXMucGxheWVyLndhbGtMZWZ0KTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLnBsYXllci5pc0J1c3koKSAmJiB0aGlzLnJpZ2h0SW5wdXRJc0FjdGl2ZSgpKSB7XG4gICAgICAgIHRoaXMudGFyZ2V0UG9zaXRpb24uYm9keS5yZXNldCh0aGlzLnBsYXllci54ICsgdGhpcy5zY2FmZm9sZFBvb2wuZ2V0QXQoMCkud2lkdGgsIHRoaXMucGxheWVyLnkgKyB0aGlzLnBsYXllci5oZWlnaHQpO1xuICAgICAgICB0aGlzLmJ1aWxkT3JNb3ZlKCdyaWdodCcsIHRoaXMucGxheWVyLndhbGtSaWdodCk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLnBsYXllci5pc0J1c3koKSAmJiB0aGlzLnVwSW5wdXRJc0FjdGl2ZSgpKSB7XG4gICAgICAgIHRoaXMucGxheWVyLmJvZHkuYWNjZWxlcmF0aW9uLnggPSAwO1xuICAgICAgICB0aGlzLnRhcmdldFBvc2l0aW9uLmJvZHkucmVzZXQodGhpcy5wbGF5ZXIueCwgdGhpcy5wbGF5ZXIueSAtIHRoaXMucGxheWVyLmhlaWdodCoyKTtcbiAgICAgICAgdGhpcy5idWlsZE9yTW92ZSgndXAnLCB0aGlzLnBsYXllci5jbGltYik7XG4gICAgfVxuXG4gICAgLy8gZm9yIGRlYnVnZ2luZyBhY3Rpb25zIC8vXG4gICAgaWYodGhpcy5pbnB1dC5rZXlib2FyZC5qdXN0UHJlc3NlZChQaGFzZXIuS2V5Ym9hcmQuRE9XTiwxKSl7XG4gICAgICAgIHRoaXMuZ2V0U2NhZmZvbGRVbmRlcmZvb3QoKTtcbiAgICB9XG5cbn07XG5cbkdhbWVTdGF0ZS5wcm90b3R5cGUuYnVpbGRPck1vdmUgPSBmdW5jdGlvbihkaXJlY3Rpb24sIG1vdmVGbikge1xuICAgIC8vIENvbGxpZGUgdGhlIHRhcmdldFBvc2l0aW9uIHdpdGggdGhlIHNjYWZmb2xkXG4gICAgaWYodGhpcy5nYW1lLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAodGhpcy50YXJnZXRQb3NpdGlvbiwgdGhpcy5zY2FmZm9sZFBvb2wpKSB7XG4gICAgICAgIC8vIHNjYWZmb2xkIGV4aXN0cyB0byBtb3ZlIHRvXG4gICAgICAgIC8vIFRPRE8gLSBvbmx5IGNsaW1iIGlmIHVwIGlzIGhlbGQgZm9yIC41IHNlY1xuICAgICAgICBtb3ZlRm4uY2FsbCh0aGlzLnBsYXllcik7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gc3RvcCBhbmQgYnVpbGRcbiAgICAgICAgdGhpcy5wbGF5ZXIuYm9keS5hY2NlbGVyYXRpb24ueCA9IDA7XG5cbiAgICAgICAgLy8gZGlyZWN0aW9uIHBhc3NlZCBpbiBhcyAndXAnLCAnbGVmdCcsICdyaWdodCdcbiAgICAgICAgYW5jaG9yU2NhZmZvbGQgPSB0aGlzLmdldFNjYWZmb2xkVW5kZXJmb290KCk7XG4gICAgICAgIHRoaXMuZXh0ZW5kU2NhZmZvbGQoYW5jaG9yU2NhZmZvbGQsIGRpcmVjdGlvbik7XG5cbiAgICAgICAgLy8gVE9ETyAtIERPTidUIEJVSUxEIElGIElUIFdJTEwgQkUgT0ZGIFNDUkVFTlxuICAgIH1cbn07XG5cbi8vIFRoaXMgZnVuY3Rpb24gc2hvdWxkIHJldHVybiB0cnVlIHdoZW4gdGhlIHBsYXllciBhY3RpdmF0ZXMgdGhlIFwiZ28gbGVmdFwiIGNvbnRyb2xcbi8vIEluIHRoaXMgY2FzZSwgZWl0aGVyIGhvbGRpbmcgdGhlIHJpZ2h0IGFycm93IG9yIHRhcHBpbmcgb3IgY2xpY2tpbmcgb24gdGhlIGxlZnRcbi8vIHNpZGUgb2YgdGhlIHNjcmVlbi5cbkdhbWVTdGF0ZS5wcm90b3R5cGUubGVmdElucHV0SXNBY3RpdmUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXNBY3RpdmUgPSBmYWxzZTtcblxuICAgIGlzQWN0aXZlID0gdGhpcy5pbnB1dC5rZXlib2FyZC5pc0Rvd24oUGhhc2VyLktleWJvYXJkLkxFRlQpO1xuICAgIGlzQWN0aXZlIHw9ICh0aGlzLmdhbWUuaW5wdXQuYWN0aXZlUG9pbnRlci5pc0Rvd24gJiZcbiAgICAgICAgdGhpcy5nYW1lLmlucHV0LmFjdGl2ZVBvaW50ZXIueCA8IHRoaXMuZ2FtZS53aWR0aC80KTtcblxuICAgIHJldHVybiBpc0FjdGl2ZTtcbn07XG5cbi8vIFRoaXMgZnVuY3Rpb24gc2hvdWxkIHJldHVybiB0cnVlIHdoZW4gdGhlIHBsYXllciBhY3RpdmF0ZXMgdGhlIFwiZ28gcmlnaHRcIiBjb250cm9sXG4vLyBJbiB0aGlzIGNhc2UsIGVpdGhlciBob2xkaW5nIHRoZSByaWdodCBhcnJvdyBvciB0YXBwaW5nIG9yIGNsaWNraW5nIG9uIHRoZSByaWdodFxuLy8gc2lkZSBvZiB0aGUgc2NyZWVuLlxuR2FtZVN0YXRlLnByb3RvdHlwZS5yaWdodElucHV0SXNBY3RpdmUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXNBY3RpdmUgPSBmYWxzZTtcblxuICAgIGlzQWN0aXZlID0gdGhpcy5pbnB1dC5rZXlib2FyZC5pc0Rvd24oUGhhc2VyLktleWJvYXJkLlJJR0hUKTtcbiAgICBpc0FjdGl2ZSB8PSAodGhpcy5nYW1lLmlucHV0LmFjdGl2ZVBvaW50ZXIuaXNEb3duICYmXG4gICAgICAgIHRoaXMuZ2FtZS5pbnB1dC5hY3RpdmVQb2ludGVyLnggPiB0aGlzLmdhbWUud2lkdGgvMiArIHRoaXMuZ2FtZS53aWR0aC80KTtcblxuICAgIHJldHVybiBpc0FjdGl2ZTtcbn07XG5cbi8vIFRoaXMgZnVuY3Rpb24gc2hvdWxkIHJldHVybiB0cnVlIHdoZW4gdGhlIHBsYXllciBhY3RpdmF0ZXMgdGhlIFwianVtcFwiIGNvbnRyb2xcbi8vIEluIHRoaXMgY2FzZSwgZWl0aGVyIGhvbGRpbmcgdGhlIHVwIGFycm93IG9yIHRhcHBpbmcgb3IgY2xpY2tpbmcgb24gdGhlIGNlbnRlclxuLy8gcGFydCBvZiB0aGUgc2NyZWVuLlxuR2FtZVN0YXRlLnByb3RvdHlwZS51cElucHV0SXNBY3RpdmUgPSBmdW5jdGlvbihkdXJhdGlvbikge1xuICAgIHZhciBpc0FjdGl2ZSA9IGZhbHNlO1xuXG4gICAgaXNBY3RpdmUgPSB0aGlzLmlucHV0LmtleWJvYXJkLmp1c3RQcmVzc2VkKFBoYXNlci5LZXlib2FyZC5VUCwgZHVyYXRpb24pO1xuICAgIGlzQWN0aXZlIHw9ICh0aGlzLmdhbWUuaW5wdXQuYWN0aXZlUG9pbnRlci5qdXN0UHJlc3NlZChkdXJhdGlvbiArIDEwMDAvNjApICYmXG4gICAgICAgIHRoaXMuZ2FtZS5pbnB1dC5hY3RpdmVQb2ludGVyLnggPiB0aGlzLmdhbWUud2lkdGgvNCAmJlxuICAgICAgICB0aGlzLmdhbWUuaW5wdXQuYWN0aXZlUG9pbnRlci54IDwgdGhpcy5nYW1lLndpZHRoLzIgKyB0aGlzLmdhbWUud2lkdGgvNCk7XG5cbiAgICByZXR1cm4gaXNBY3RpdmU7XG59O1xuXG5HYW1lU3RhdGUucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcblxuICAgIC8vIGdhbWUuZGVidWcuYm9keUluZm8odGhpcy5wbGF5ZXIsIDMyLCAzMik7XG5cbiAgICB0aGlzLmdhbWUuZGVidWcuYm9keSh0aGlzLnRhcmdldFBvc2l0aW9uKTtcbiAgICB0aGlzLmdhbWUuZGVidWcuYm9keSh0aGlzLnBsYXllcik7XG4gICAgLy8gdGhpcy5zY2FmZm9sZFBvb2wuZm9yRWFjaChmdW5jdGlvbihzY2FmZm9sZCl7dGhpcy5nYW1lLmRlYnVnLmJvZHkoc2NhZmZvbGQpO30sdGhpcyk7XG59OyJdfQ==
