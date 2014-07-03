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
    var climbTime = 700;
    var climbSpeed = gameState.scaffoldPool.getAt(0).height*1000/climbTime;
    this.climbing = true;
    this.body.allowGravity = false;
    this.body.velocity.y -= climbSpeed/6;
    this.game.world.setAllChildren('body.velocity.y', climbSpeed, true, true, 1, false);

    stopClimbing = function() {
        this.climbing = false;
        this.body.velocity.y = 0;
        this.body.allowGravity = true;
        this.game.world.setAllChildren('body.velocity.y', 0, true, true, 0, false);
    };

    this.game.time.events.add(climbTime, stopClimbing, this);

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

    this.game.camera.bounds = null;

    this.GRAVITY = 2600; // pixels/second/second
    this.game.physics.arcade.gravity.y = this.GRAVITY;

    var Player = require('../entities/player');
    this.player = new Player(this.game, this.game.width/2, this.game.height/2 - 60);
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
        this.buildScaffold(x, this.game.height/2 - this.scaffoldPool.getAt(0).height/2);
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
    // TODO check for anchorScaffold, maybe here, or maybe in function that calls?
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
    this.targetPosition.body.reset(this.player.x, this.player.y + this.player.height/2 + 5);
    function collisionHandler(player, scaffold) {
        scaffoldUnderFoot = scaffold;
    }
    this.game.physics.arcade.overlap(this.targetPosition, this.scaffoldPool, collisionHandler, null, this);
    return scaffoldUnderFoot;
};


// This function draws horizontal lines across the stage
// GameState.prototype.drawHeightMarkers = function() {
//     // Create a bitmap the same size as the stage
//     var bitmap = this.game.add.bitmapData(this.game.width, this.game.height);

//     // These functions use the canvas context to draw lines using the canvas API
//     for(y = this.game.height-32; y >= 64; y -= 32) {
//         bitmap.context.beginPath();
//         bitmap.context.strokeStyle = 'rgba(255, 255, 255, 0.2)';
//         bitmap.context.moveTo(0, y);
//         bitmap.context.lineTo(this.game.width, y);
//         bitmap.context.stroke();
//     }

//     this.game.add.image(0, 0, bitmap);
// };

// The update() method is called every frame
GameState.prototype.update = function() {
    if (this.game.time.fps !== 0) {
        this.fpsText.setText(this.game.time.fps + ' FPS');
    }

    // Collide the player with the scaffold
    this.game.physics.arcade.collide(this.player, this.scaffoldPool);

    var playersFeet = this.player.y+this.player.height/2 + 5;

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
    // this.game.debug.spriteBounds(this.player);
    this.scaffoldPool.forEach(function(scaffold){this.game.debug.body(scaffold);},this);
};
},{"../entities/player":1}]},{},[1,2,3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvSmVmZi9Eb2N1bWVudHMvYmFiZWwvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9KZWZmL0RvY3VtZW50cy9iYWJlbC9zcmMvZ2FtZS9lbnRpdGllcy9wbGF5ZXIuanMiLCIvVXNlcnMvSmVmZi9Eb2N1bWVudHMvYmFiZWwvc3JjL2dhbWUvbWFpbi5qcyIsIi9Vc2Vycy9KZWZmL0RvY3VtZW50cy9iYWJlbC9zcmMvZ2FtZS9zdGF0ZXMvcGxheS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IFBsYXllciA9IGZ1bmN0aW9uKGdhbWUsIHgsIHkpIHtcbiAgICBQaGFzZXIuU3ByaXRlLmNhbGwodGhpcywgZ2FtZSwgeCwgeSwgJ3BsYXllcicpO1xuXG4gICAgdGhpcy5NQVhfU1BFRUQgPSAzMDA7IC8vIHBpeGVscy9zZWNvbmRcbiAgICB0aGlzLkFDQ0VMRVJBVElPTiA9IDIwMDA7IC8vIHBpeGVscy9zZWNvbmQvc2Vjb25kXG4gICAgdGhpcy5EUkFHID0gMjAwMDsgLy8gcGl4ZWxzL3NlY29uZFxuICAgIHRoaXMuSlVNUF9TUEVFRCA9IC0xMDAwOyAvLyBwaXhlbHMvc2Vjb25kIChuZWdhdGl2ZSB5IGlzIHVwKVxuXG4gICAgZ2FtZS5waHlzaWNzLmVuYWJsZSh0aGlzLCBQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICAgIHRoaXMuYm9keS5jb2xsaWRlV29ybGRCb3VuZHMgPSB0cnVlO1xuICAgIHRoaXMuYm9keS5jaGVja0NvbGxpc2lvbi51cCA9IGZhbHNlO1xuICAgIHRoaXMuYm9keS5tYXhWZWxvY2l0eS5zZXRUbyh0aGlzLk1BWF9TUEVFRCwgdGhpcy5NQVhfU1BFRUQgKiAxMCk7IC8vIHgsIHlcbiAgICB0aGlzLmJvZHkuZHJhZy5zZXRUbyh0aGlzLkRSQUcsIDApOyAvLyB4LCB5XG59O1xuXG5QbGF5ZXIucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShQaGFzZXIuU3ByaXRlLnByb3RvdHlwZSk7XG5QbGF5ZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUGxheWVyO1xuXG4vLyBwbGF5ZXIgbW92ZW1lbnRzXG5QbGF5ZXIucHJvdG90eXBlLndhbGtMZWZ0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5ib2R5LmFjY2VsZXJhdGlvbi54ICs9IC10aGlzLkFDQ0VMRVJBVElPTjtcbn07XG5cblBsYXllci5wcm90b3R5cGUud2Fsa1JpZ2h0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5ib2R5LmFjY2VsZXJhdGlvbi54ICs9IHRoaXMuQUNDRUxFUkFUSU9OO1xufTtcblxuUGxheWVyLnByb3RvdHlwZS5jbGltYiA9IGZ1bmN0aW9uKGdhbWVTdGF0ZSkge1xuICAgIHZhciBjbGltYlRpbWUgPSA3MDA7XG4gICAgdmFyIGNsaW1iU3BlZWQgPSBnYW1lU3RhdGUuc2NhZmZvbGRQb29sLmdldEF0KDApLmhlaWdodCoxMDAwL2NsaW1iVGltZTtcbiAgICB0aGlzLmNsaW1iaW5nID0gdHJ1ZTtcbiAgICB0aGlzLmJvZHkuYWxsb3dHcmF2aXR5ID0gZmFsc2U7XG4gICAgdGhpcy5ib2R5LnZlbG9jaXR5LnkgLT0gY2xpbWJTcGVlZC82O1xuICAgIHRoaXMuZ2FtZS53b3JsZC5zZXRBbGxDaGlsZHJlbignYm9keS52ZWxvY2l0eS55JywgY2xpbWJTcGVlZCwgdHJ1ZSwgdHJ1ZSwgMSwgZmFsc2UpO1xuXG4gICAgc3RvcENsaW1iaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuY2xpbWJpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5ib2R5LnZlbG9jaXR5LnkgPSAwO1xuICAgICAgICB0aGlzLmJvZHkuYWxsb3dHcmF2aXR5ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5nYW1lLndvcmxkLnNldEFsbENoaWxkcmVuKCdib2R5LnZlbG9jaXR5LnknLCAwLCB0cnVlLCB0cnVlLCAwLCBmYWxzZSk7XG4gICAgfTtcblxuICAgIHRoaXMuZ2FtZS50aW1lLmV2ZW50cy5hZGQoY2xpbWJUaW1lLCBzdG9wQ2xpbWJpbmcsIHRoaXMpO1xuXG59O1xuXG5QbGF5ZXIucHJvdG90eXBlLmlzQnVzeSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAhIXRoaXMuY2xpbWJpbmcgfHwgISF0aGlzLmJ1aWxkaW5nO1xufTtcblxuXG5QbGF5ZXIucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuXG59OyIsIi8vIFRoaXMgZXhhbXBsZSB1c2VzIHRoZSBQaGFzZXIgMi4wLjQgZnJhbWV3b3JrXG5cbi8vIENvcHlyaWdodCDCqSAyMDE0IEpvaG4gV2F0c29uXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIE1JVCBMaWNlbnNlXG5cblxudmFyIGdhbWUgPSBuZXcgUGhhc2VyLkdhbWUoODAwLCA1MDAsIFBoYXNlci5BVVRPLCAnZ2FtZScpO1xuR2FtZVN0YXRlID0gcmVxdWlyZSgnLi9zdGF0ZXMvcGxheScpO1xuZ2FtZS5zdGF0ZS5hZGQoJ2dhbWUnLCBHYW1lU3RhdGUsIHRydWUpO1xuXG53aW5kb3cuZ2FtZSA9IGdhbWU7IiwibW9kdWxlLmV4cG9ydHMgPSBHYW1lU3RhdGUgPSBmdW5jdGlvbihnYW1lKSB7XG59O1xuXG4vLyBMb2FkIGltYWdlcyBhbmQgc291bmRzXG5HYW1lU3RhdGUucHJvdG90eXBlLnByZWxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmdhbWUubG9hZC5pbWFnZSgnc2NhZmZvbGQnLCAnL2Fzc2V0cy9zY2FmZm9sZC5wbmcnKTtcbiAgICB0aGlzLmdhbWUubG9hZC5pbWFnZSgncGxheWVyJywgJy9hc3NldHMvcGxheWVyLnBuZycpO1xufTtcblxuLy8gU2V0dXAgdGhlIGV4YW1wbGVcbkdhbWVTdGF0ZS5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gU2V0IHN0YWdlIGJhY2tncm91bmQgdG8gc29tZXRoaW5nIHNreSBjb2xvcmVkXG4gICAgdGhpcy5nYW1lLnN0YWdlLmJhY2tncm91bmRDb2xvciA9IDB4NDQ4OGNjO1xuXG4gICAgdGhpcy5nYW1lLmNhbWVyYS5ib3VuZHMgPSBudWxsO1xuXG4gICAgdGhpcy5HUkFWSVRZID0gMjYwMDsgLy8gcGl4ZWxzL3NlY29uZC9zZWNvbmRcbiAgICB0aGlzLmdhbWUucGh5c2ljcy5hcmNhZGUuZ3Jhdml0eS55ID0gdGhpcy5HUkFWSVRZO1xuXG4gICAgdmFyIFBsYXllciA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL3BsYXllcicpO1xuICAgIHRoaXMucGxheWVyID0gbmV3IFBsYXllcih0aGlzLmdhbWUsIHRoaXMuZ2FtZS53aWR0aC8yLCB0aGlzLmdhbWUuaGVpZ2h0LzIgLSA2MCk7XG4gICAgdGhpcy5nYW1lLmFkZC5leGlzdGluZyh0aGlzLnBsYXllcik7XG5cblxuICAgIC8vIGludmlzaWJsZSBoZWxwZXIgb2JqZWN0IHRvIGRldGVybWluZSBpZiBzY2FmZm9sZGluZyBleGlzdHMgaW4gdGhlIGRpcmVjdGlvbiBwcmVzc2VkXG4gICAgdGhpcy50YXJnZXRQb3NpdGlvbiA9IHRoaXMuZ2FtZS5hZGQuc3ByaXRlKHRoaXMucGxheWVyLngsIHRoaXMucGxheWVyLnkpO1xuICAgIHRoaXMuZ2FtZS5waHlzaWNzLmVuYWJsZSh0aGlzLnRhcmdldFBvc2l0aW9uLCBQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICAgIHRoaXMudGFyZ2V0UG9zaXRpb24uYm9keS5hbGxvd0dyYXZpdHkgPSBmYWxzZTtcbiAgICB0aGlzLnRhcmdldFBvc2l0aW9uLmJvZHkuc2V0U2l6ZSgxMCwgMTAsIHRoaXMudGFyZ2V0UG9zaXRpb24ud2lkdGgvMi01LCB0aGlzLnRhcmdldFBvc2l0aW9uLmhlaWdodC8yLTUpO1xuXG5cblxuICAgIHRoaXMuc2NhZmZvbGRQb29sID0gdGhpcy5nYW1lLmFkZC5ncm91cCgpO1xuXG4gICAgLy8gc3RhcnQgc2NhZmZvbGQgcG9vbCB3aXRoIDEwMCBwaWVjZXNcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgMTAwOyBpKyspIHtcbiAgICAgICAgLy8gYWRkU2NhZmZvbGRUb1Bvb2wuY2FsbCh0aGlzKTtcbiAgICAgICAgdGhpcy5hZGRTY2FmZm9sZFRvUG9vbCgpO1xuICAgIH1cblxuICAgIC8vIGxheSBzb21lIGluaXRpYWwgc2NhZmZvbGRpbmdcbiAgICBmb3IodmFyIHggPSAwOyB4IDwgdGhpcy5nYW1lLndpZHRoOyB4ICs9IHRoaXMuc2NhZmZvbGRQb29sLmdldEF0KDApLndpZHRoKSB7XG4gICAgICAgIHRoaXMuYnVpbGRTY2FmZm9sZCh4LCB0aGlzLmdhbWUuaGVpZ2h0LzIgLSB0aGlzLnNjYWZmb2xkUG9vbC5nZXRBdCgwKS5oZWlnaHQvMik7XG4gICAgfVxuXG5cbiAgICAvLyBDYXB0dXJlIGNlcnRhaW4ga2V5cyB0byBwcmV2ZW50IHRoZWlyIGRlZmF1bHQgYWN0aW9ucyBpbiB0aGUgYnJvd3Nlci5cbiAgICAvLyBUaGlzIGlzIG9ubHkgbmVjZXNzYXJ5IGJlY2F1c2UgdGhpcyBpcyBhbiBIVE1MNSBnYW1lLiBHYW1lcyBvbiBvdGhlclxuICAgIC8vIHBsYXRmb3JtcyBtYXkgbm90IG5lZWQgY29kZSBsaWtlIHRoaXMuXG4gICAgdGhpcy5nYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleUNhcHR1cmUoW1xuICAgICAgICBQaGFzZXIuS2V5Ym9hcmQuTEVGVCxcbiAgICAgICAgUGhhc2VyLktleWJvYXJkLlJJR0hULFxuICAgICAgICBQaGFzZXIuS2V5Ym9hcmQuVVAsXG4gICAgICAgIFBoYXNlci5LZXlib2FyZC5ET1dOXG4gICAgXSk7XG5cbiAgICAvLyBKdXN0IGZvciBmdW4sIGRyYXcgc29tZSBoZWlnaHQgbWFya2VycyBzbyB3ZSBjYW4gc2VlIGhvdyBoaWdoIHdlJ3JlIGp1bXBpbmdcbiAgICB0aGlzLmRyYXdIZWlnaHRNYXJrZXJzKCk7XG5cbiAgICAvLyBTaG93IEZQU1xuICAgIHRoaXMuZ2FtZS50aW1lLmFkdmFuY2VkVGltaW5nID0gdHJ1ZTtcbiAgICB0aGlzLmZwc1RleHQgPSB0aGlzLmdhbWUuYWRkLnRleHQoXG4gICAgICAgIDIwLCAyMCwgJycsIHsgZm9udDogJzE2cHggQXJpYWwnLCBmaWxsOiAnI2ZmZmZmZicgfVxuICAgICk7XG59O1xuXG5HYW1lU3RhdGUucHJvdG90eXBlLmFkZFNjYWZmb2xkVG9Qb29sID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgc2NhZmZvbGQgPSB0aGlzLmdhbWUuYWRkLnNwcml0ZSgwLCAwLCAnc2NhZmZvbGQnKTtcbiAgICBzY2FmZm9sZC5uYW1lID0gJ3NjYWZmb2xkJyt0aGlzLnNjYWZmb2xkUG9vbC5sZW5ndGg7XG4gICAgc2NhZmZvbGQuc2NhbGUueCA9IDIuNTtcbiAgICBzY2FmZm9sZC5zY2FsZS55ID0gMjtcbiAgICB0aGlzLnNjYWZmb2xkUG9vbC5hZGQoc2NhZmZvbGQpO1xuXG4gICAgLy8gRW5hYmxlIHBoeXNpY3Mgb24gdGhlIHNjYWZmb2xkXG4gICAgdGhpcy5nYW1lLnBoeXNpY3MuZW5hYmxlKHNjYWZmb2xkLCBQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICAgIHNjYWZmb2xkLmJvZHkuaW1tb3ZhYmxlID0gdHJ1ZTtcbiAgICBzY2FmZm9sZC5ib2R5LmFsbG93R3Jhdml0eSA9IGZhbHNlO1xuICAgIHNjYWZmb2xkLmJvZHkuc2V0U2l6ZSgzMiwgNSwgMCAsIDY0LTEwKTtcblxuICAgIC8vIFNldCBpdHMgaW5pdGlhbCBzdGF0ZSB0byBcImRlYWRcIi5cbiAgICBzY2FmZm9sZC5raWxsKCk7XG5cbiAgICBzY2FmZm9sZC5jaGVja1dvcmxkQm91bmRzID0gdHJ1ZTtcbiAgICBzY2FmZm9sZC5vdXRPZkJvdW5kc0tpbGwgPSB0cnVlO1xuXG4gICAgcmV0dXJuIHNjYWZmb2xkO1xufTtcblxuR2FtZVN0YXRlLnByb3RvdHlwZS5idWlsZFNjYWZmb2xkID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICB2YXIgYnVpbGRUaW1lID0gUGhhc2VyLlRpbWVyLlNFQ09ORCAqIDAuNjtcbiAgICB0aGlzLnBsYXllci5idWlsZGluZyA9IHRydWU7XG4gICAgLy8gR2V0IGEgZGVhZCBzY2FmZm9sZCBmcm9tIHRoZSBwb29sXG4gICAgdmFyIHNjYWZmb2xkID0gdGhpcy5zY2FmZm9sZFBvb2wuZ2V0Rmlyc3REZWFkKCk7XG4gICAgaWYgKHNjYWZmb2xkID09PSBudWxsKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiaW5jcmVhc2luZyBzY2FmZm9sZCBwb29sIHRvXCIsIHRoaXMuc2NhZmZvbGRQb29sLmxlbmd0aCk7XG4gICAgICAgIHNjYWZmb2xkID0gdGhpcy5hZGRTY2FmZm9sZFRvUG9vbCgpO1xuICAgIH1cbiAgICBzY2FmZm9sZC5yZXZpdmUoKTtcbiAgICBzY2FmZm9sZC5yZXNldCh4LCB5KTtcbiAgICBzY2FmZm9sZC5hbHBoYSA9IDA7XG4gICAgLy8gZmFkZSBpbiAodGVtcCBhbmltYXRpb24pXG4gICAgdGhpcy5nYW1lLmFkZC50d2VlbihzY2FmZm9sZCkudG8oIHsgYWxwaGE6IDEgfSwgYnVpbGRUaW1lLCBQaGFzZXIuRWFzaW5nLkxpbmVhci5Ob25lLCB0cnVlKTtcblxuICAgIGZ1bmN0aW9uIHN0b3BCdWlsZGluZygpIHt0aGlzLnBsYXllci5idWlsZGluZyA9IGZhbHNlO31cbiAgICB0aGlzLmdhbWUudGltZS5ldmVudHMuYWRkKGJ1aWxkVGltZSwgc3RvcEJ1aWxkaW5nLCB0aGlzKTtcblxuICAgIHJldHVybiBzY2FmZm9sZDtcbn07XG5cbkdhbWVTdGF0ZS5wcm90b3R5cGUuZXh0ZW5kU2NhZmZvbGQgPSBmdW5jdGlvbihhbmNob3JTY2FmZm9sZCwgZGlyZWN0aW9uKSB7XG4gICAgLy8gVE9ETyBjaGVjayBmb3IgYW5jaG9yU2NhZmZvbGQsIG1heWJlIGhlcmUsIG9yIG1heWJlIGluIGZ1bmN0aW9uIHRoYXQgY2FsbHM/XG4gICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcbiAgICAgICAgY2FzZSAndXAnOlxuICAgICAgICB0aGlzLmJ1aWxkU2NhZmZvbGQoYW5jaG9yU2NhZmZvbGQueCwgYW5jaG9yU2NhZmZvbGQueSAtIGFuY2hvclNjYWZmb2xkLmhlaWdodCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgIHRoaXMuYnVpbGRTY2FmZm9sZChhbmNob3JTY2FmZm9sZC54ICsgYW5jaG9yU2NhZmZvbGQud2lkdGgsIGFuY2hvclNjYWZmb2xkLnkpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgIHRoaXMuYnVpbGRTY2FmZm9sZChhbmNob3JTY2FmZm9sZC54IC0gYW5jaG9yU2NhZmZvbGQud2lkdGgsIGFuY2hvclNjYWZmb2xkLnkpO1xuICAgICAgICBicmVhaztcbiAgICB9XG59O1xuXG5HYW1lU3RhdGUucHJvdG90eXBlLmdldFNjYWZmb2xkVW5kZXJmb290ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNjYWZmb2xkVW5kZXJGb290O1xuICAgIHRoaXMudGFyZ2V0UG9zaXRpb24uYm9keS5yZXNldCh0aGlzLnBsYXllci54LCB0aGlzLnBsYXllci55ICsgdGhpcy5wbGF5ZXIuaGVpZ2h0LzIgKyA1KTtcbiAgICBmdW5jdGlvbiBjb2xsaXNpb25IYW5kbGVyKHBsYXllciwgc2NhZmZvbGQpIHtcbiAgICAgICAgc2NhZmZvbGRVbmRlckZvb3QgPSBzY2FmZm9sZDtcbiAgICB9XG4gICAgdGhpcy5nYW1lLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAodGhpcy50YXJnZXRQb3NpdGlvbiwgdGhpcy5zY2FmZm9sZFBvb2wsIGNvbGxpc2lvbkhhbmRsZXIsIG51bGwsIHRoaXMpO1xuICAgIHJldHVybiBzY2FmZm9sZFVuZGVyRm9vdDtcbn07XG5cblxuLy8gVGhpcyBmdW5jdGlvbiBkcmF3cyBob3Jpem9udGFsIGxpbmVzIGFjcm9zcyB0aGUgc3RhZ2Vcbi8vIEdhbWVTdGF0ZS5wcm90b3R5cGUuZHJhd0hlaWdodE1hcmtlcnMgPSBmdW5jdGlvbigpIHtcbi8vICAgICAvLyBDcmVhdGUgYSBiaXRtYXAgdGhlIHNhbWUgc2l6ZSBhcyB0aGUgc3RhZ2Vcbi8vICAgICB2YXIgYml0bWFwID0gdGhpcy5nYW1lLmFkZC5iaXRtYXBEYXRhKHRoaXMuZ2FtZS53aWR0aCwgdGhpcy5nYW1lLmhlaWdodCk7XG5cbi8vICAgICAvLyBUaGVzZSBmdW5jdGlvbnMgdXNlIHRoZSBjYW52YXMgY29udGV4dCB0byBkcmF3IGxpbmVzIHVzaW5nIHRoZSBjYW52YXMgQVBJXG4vLyAgICAgZm9yKHkgPSB0aGlzLmdhbWUuaGVpZ2h0LTMyOyB5ID49IDY0OyB5IC09IDMyKSB7XG4vLyAgICAgICAgIGJpdG1hcC5jb250ZXh0LmJlZ2luUGF0aCgpO1xuLy8gICAgICAgICBiaXRtYXAuY29udGV4dC5zdHJva2VTdHlsZSA9ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiknO1xuLy8gICAgICAgICBiaXRtYXAuY29udGV4dC5tb3ZlVG8oMCwgeSk7XG4vLyAgICAgICAgIGJpdG1hcC5jb250ZXh0LmxpbmVUbyh0aGlzLmdhbWUud2lkdGgsIHkpO1xuLy8gICAgICAgICBiaXRtYXAuY29udGV4dC5zdHJva2UoKTtcbi8vICAgICB9XG5cbi8vICAgICB0aGlzLmdhbWUuYWRkLmltYWdlKDAsIDAsIGJpdG1hcCk7XG4vLyB9O1xuXG4vLyBUaGUgdXBkYXRlKCkgbWV0aG9kIGlzIGNhbGxlZCBldmVyeSBmcmFtZVxuR2FtZVN0YXRlLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5nYW1lLnRpbWUuZnBzICE9PSAwKSB7XG4gICAgICAgIHRoaXMuZnBzVGV4dC5zZXRUZXh0KHRoaXMuZ2FtZS50aW1lLmZwcyArICcgRlBTJyk7XG4gICAgfVxuXG4gICAgLy8gQ29sbGlkZSB0aGUgcGxheWVyIHdpdGggdGhlIHNjYWZmb2xkXG4gICAgdGhpcy5nYW1lLnBoeXNpY3MuYXJjYWRlLmNvbGxpZGUodGhpcy5wbGF5ZXIsIHRoaXMuc2NhZmZvbGRQb29sKTtcblxuICAgIHZhciBwbGF5ZXJzRmVldCA9IHRoaXMucGxheWVyLnkrdGhpcy5wbGF5ZXIuaGVpZ2h0LzIgKyA1O1xuXG4gICAgLy8gdGFyZ2V0UG9zaXRpb24gZm9sbG93cyBwbGF5ZXJcbiAgICB0aGlzLnRhcmdldFBvc2l0aW9uLmJvZHkucmVzZXQodGhpcy5wbGF5ZXIueCwgcGxheWVyc0ZlZXQpO1xuXG4gICAgdGhpcy5wbGF5ZXIuYm9keS5hY2NlbGVyYXRpb24ueCA9IDA7XG5cbiAgICAvLyB1cGRhdGUgaW5wdXRzXG5cbiAgICBpZiAoIXRoaXMucGxheWVyLmlzQnVzeSgpICYmIHRoaXMubGVmdElucHV0SXNBY3RpdmUoKSkge1xuICAgICAgICB0aGlzLnRhcmdldFBvc2l0aW9uLmJvZHkucmVzZXQodGhpcy5wbGF5ZXIueCAtIHRoaXMuc2NhZmZvbGRQb29sLmdldEF0KDApLndpZHRoKjQvNSwgcGxheWVyc0ZlZXQpO1xuICAgICAgICB0aGlzLmJ1aWxkT3JNb3ZlKCdsZWZ0JywgdGhpcy5wbGF5ZXIud2Fsa0xlZnQpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMucGxheWVyLmlzQnVzeSgpICYmIHRoaXMucmlnaHRJbnB1dElzQWN0aXZlKCkpIHtcbiAgICAgICAgdGhpcy50YXJnZXRQb3NpdGlvbi5ib2R5LnJlc2V0KHRoaXMucGxheWVyLnggKyB0aGlzLnNjYWZmb2xkUG9vbC5nZXRBdCgwKS53aWR0aCo0LzUsIHBsYXllcnNGZWV0KTtcbiAgICAgICAgdGhpcy5idWlsZE9yTW92ZSgncmlnaHQnLCB0aGlzLnBsYXllci53YWxrUmlnaHQpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMucGxheWVyLmlzQnVzeSgpICYmIHRoaXMudXBJbnB1dElzQWN0aXZlKCkpIHtcbiAgICAgICAgdGhpcy5wbGF5ZXIuYm9keS5hY2NlbGVyYXRpb24ueCA9IDA7XG4gICAgICAgIHRoaXMudGFyZ2V0UG9zaXRpb24uYm9keS5yZXNldCh0aGlzLnBsYXllci54LCBwbGF5ZXJzRmVldCAtIHRoaXMuc2NhZmZvbGRQb29sLmdldEF0KDApLmhlaWdodCk7XG4gICAgICAgIHRoaXMuYnVpbGRPck1vdmUoJ3VwJywgdGhpcy5wbGF5ZXIuY2xpbWIpO1xuICAgIH1cblxuICAgIC8vIGZvciBkZWJ1Z2dpbmcgYWN0aW9ucyAvL1xuICAgIGlmKHRoaXMuaW5wdXQua2V5Ym9hcmQuanVzdFByZXNzZWQoUGhhc2VyLktleWJvYXJkLkRPV04sMSkpe1xuICAgICAgICB0aGlzLmdldFNjYWZmb2xkVW5kZXJmb290KCk7XG4gICAgfVxufTtcblxuR2FtZVN0YXRlLnByb3RvdHlwZS5idWlsZE9yTW92ZSA9IGZ1bmN0aW9uKGRpcmVjdGlvbiwgbW92ZUZuKSB7XG4gICAgLy8gQ29sbGlkZSB0aGUgdGFyZ2V0UG9zaXRpb24gd2l0aCB0aGUgc2NhZmZvbGRcbiAgICBpZih0aGlzLmdhbWUucGh5c2ljcy5hcmNhZGUub3ZlcmxhcCh0aGlzLnRhcmdldFBvc2l0aW9uLCB0aGlzLnNjYWZmb2xkUG9vbCkpIHtcbiAgICAgICAgLy8gc2NhZmZvbGQgZXhpc3RzIHRvIG1vdmUgdG9cbiAgICAgICAgLy8gVE9ETyAtIG9ubHkgY2xpbWIgaWYgdXAgaXMgaGVsZCBmb3IgLjUgc2VjXG4gICAgICAgIG1vdmVGbi5jYWxsKHRoaXMucGxheWVyLCB0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBzdG9wIGFuZCBidWlsZFxuICAgICAgICB0aGlzLnBsYXllci5ib2R5LmFjY2VsZXJhdGlvbi54ID0gMDtcblxuICAgICAgICAvLyBkaXJlY3Rpb24gcGFzc2VkIGluIGFzICd1cCcsICdsZWZ0JywgJ3JpZ2h0J1xuICAgICAgICBhbmNob3JTY2FmZm9sZCA9IHRoaXMuZ2V0U2NhZmZvbGRVbmRlcmZvb3QoKTtcbiAgICAgICAgdGhpcy5leHRlbmRTY2FmZm9sZChhbmNob3JTY2FmZm9sZCwgZGlyZWN0aW9uKTtcblxuICAgICAgICAvLyBUT0RPIC0gRE9OJ1QgQlVJTEQgSUYgSVQgV0lMTCBCRSBPRkYgU0NSRUVOXG4gICAgfVxufTtcblxuLy8gVGhpcyBmdW5jdGlvbiBzaG91bGQgcmV0dXJuIHRydWUgd2hlbiB0aGUgcGxheWVyIGFjdGl2YXRlcyB0aGUgXCJnbyBsZWZ0XCIgY29udHJvbFxuLy8gSW4gdGhpcyBjYXNlLCBlaXRoZXIgaG9sZGluZyB0aGUgcmlnaHQgYXJyb3cgb3IgdGFwcGluZyBvciBjbGlja2luZyBvbiB0aGUgbGVmdFxuLy8gc2lkZSBvZiB0aGUgc2NyZWVuLlxuR2FtZVN0YXRlLnByb3RvdHlwZS5sZWZ0SW5wdXRJc0FjdGl2ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpc0FjdGl2ZSA9IGZhbHNlO1xuXG4gICAgaXNBY3RpdmUgPSB0aGlzLmlucHV0LmtleWJvYXJkLmlzRG93bihQaGFzZXIuS2V5Ym9hcmQuTEVGVCk7XG4gICAgaXNBY3RpdmUgfD0gKHRoaXMuZ2FtZS5pbnB1dC5hY3RpdmVQb2ludGVyLmlzRG93biAmJlxuICAgICAgICB0aGlzLmdhbWUuaW5wdXQuYWN0aXZlUG9pbnRlci54IDwgdGhpcy5nYW1lLndpZHRoLzQpO1xuXG4gICAgcmV0dXJuIGlzQWN0aXZlO1xufTtcblxuLy8gVGhpcyBmdW5jdGlvbiBzaG91bGQgcmV0dXJuIHRydWUgd2hlbiB0aGUgcGxheWVyIGFjdGl2YXRlcyB0aGUgXCJnbyByaWdodFwiIGNvbnRyb2xcbi8vIEluIHRoaXMgY2FzZSwgZWl0aGVyIGhvbGRpbmcgdGhlIHJpZ2h0IGFycm93IG9yIHRhcHBpbmcgb3IgY2xpY2tpbmcgb24gdGhlIHJpZ2h0XG4vLyBzaWRlIG9mIHRoZSBzY3JlZW4uXG5HYW1lU3RhdGUucHJvdG90eXBlLnJpZ2h0SW5wdXRJc0FjdGl2ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpc0FjdGl2ZSA9IGZhbHNlO1xuXG4gICAgaXNBY3RpdmUgPSB0aGlzLmlucHV0LmtleWJvYXJkLmlzRG93bihQaGFzZXIuS2V5Ym9hcmQuUklHSFQpO1xuICAgIGlzQWN0aXZlIHw9ICh0aGlzLmdhbWUuaW5wdXQuYWN0aXZlUG9pbnRlci5pc0Rvd24gJiZcbiAgICAgICAgdGhpcy5nYW1lLmlucHV0LmFjdGl2ZVBvaW50ZXIueCA+IHRoaXMuZ2FtZS53aWR0aC8yICsgdGhpcy5nYW1lLndpZHRoLzQpO1xuXG4gICAgcmV0dXJuIGlzQWN0aXZlO1xufTtcblxuLy8gVGhpcyBmdW5jdGlvbiBzaG91bGQgcmV0dXJuIHRydWUgd2hlbiB0aGUgcGxheWVyIGFjdGl2YXRlcyB0aGUgXCJqdW1wXCIgY29udHJvbFxuLy8gSW4gdGhpcyBjYXNlLCBlaXRoZXIgaG9sZGluZyB0aGUgdXAgYXJyb3cgb3IgdGFwcGluZyBvciBjbGlja2luZyBvbiB0aGUgY2VudGVyXG4vLyBwYXJ0IG9mIHRoZSBzY3JlZW4uXG5HYW1lU3RhdGUucHJvdG90eXBlLnVwSW5wdXRJc0FjdGl2ZSA9IGZ1bmN0aW9uKGR1cmF0aW9uKSB7XG4gICAgdmFyIGlzQWN0aXZlID0gZmFsc2U7XG5cbiAgICBpc0FjdGl2ZSA9IHRoaXMuaW5wdXQua2V5Ym9hcmQuanVzdFByZXNzZWQoUGhhc2VyLktleWJvYXJkLlVQLCBkdXJhdGlvbik7XG4gICAgaXNBY3RpdmUgfD0gKHRoaXMuZ2FtZS5pbnB1dC5hY3RpdmVQb2ludGVyLmp1c3RQcmVzc2VkKGR1cmF0aW9uICsgMTAwMC82MCkgJiZcbiAgICAgICAgdGhpcy5nYW1lLmlucHV0LmFjdGl2ZVBvaW50ZXIueCA+IHRoaXMuZ2FtZS53aWR0aC80ICYmXG4gICAgICAgIHRoaXMuZ2FtZS5pbnB1dC5hY3RpdmVQb2ludGVyLnggPCB0aGlzLmdhbWUud2lkdGgvMiArIHRoaXMuZ2FtZS53aWR0aC80KTtcblxuICAgIHJldHVybiBpc0FjdGl2ZTtcbn07XG5cbkdhbWVTdGF0ZS5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gcmVuZGVyKCkge1xuXG4gICAgLy8gZ2FtZS5kZWJ1Zy5ib2R5SW5mbyh0aGlzLnBsYXllciwgMzIsIDMyKTtcblxuICAgIHRoaXMuZ2FtZS5kZWJ1Zy5ib2R5KHRoaXMudGFyZ2V0UG9zaXRpb24pO1xuICAgIHRoaXMuZ2FtZS5kZWJ1Zy5ib2R5KHRoaXMucGxheWVyKTtcbiAgICAvLyB0aGlzLmdhbWUuZGVidWcuc3ByaXRlQm91bmRzKHRoaXMucGxheWVyKTtcbiAgICB0aGlzLnNjYWZmb2xkUG9vbC5mb3JFYWNoKGZ1bmN0aW9uKHNjYWZmb2xkKXt0aGlzLmdhbWUuZGVidWcuYm9keShzY2FmZm9sZCk7fSx0aGlzKTtcbn07Il19
