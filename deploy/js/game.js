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
    var climbSpeed = gameState.getScaffoldHeight()*1000/climbTime;
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


    this.scaffoldPool = this.game.add.group();

    // start scaffold pool with 100 pieces
    for(var i = 0; i < 100; i++) {
        // addScaffoldToPool.call(this);
        this.addScaffoldToPool();
    }

    this.getScaffoldHeight = function () {return this.scaffoldPool.getAt(0).height;};
    this.getScaffoldWidth = function () {return this.scaffoldPool.getAt(0).width;};

    var Player = require('../entities/player');
    this.player = new Player(this.game, this.game.width/2, this.game.height/2 - 60);
    this.game.add.existing(this.player);


    // invisible helper object to determine if scaffolding exists in the direction pressed
    this.targetPosition = this.game.add.sprite(this.player.x, this.player.y);
    this.game.physics.enable(this.targetPosition, Phaser.Physics.ARCADE);
    this.targetPosition.body.allowGravity = false;
    this.targetPosition.body.setSize(10, this.getScaffoldHeight()/2, this.targetPosition.width/2-5, this.targetPosition.height/2-5);


    // lay some initial scaffolding
    for(var x = 0; x < this.game.width; x += this.getScaffoldWidth()) {
        this.buildScaffold(x, this.game.height/2 - this.getScaffoldHeight()/2);
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
        this.targetPosition.body.reset(this.player.x - this.getScaffoldWidth()*4/5, playersFeet);
        this.buildOrMove('left', this.player.walkLeft);
    }
    if (!this.player.isBusy() && this.rightInputIsActive()) {
        this.targetPosition.body.reset(this.player.x + this.getScaffoldWidth()*4/5, playersFeet);
        this.buildOrMove('right', this.player.walkRight);
    }
    if (!this.player.isBusy() && this.upInputIsActive()) {
        this.player.body.acceleration.x = 0;
        this.targetPosition.body.reset(this.player.x, playersFeet - this.getScaffoldHeight());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvSmVmZi9Eb2N1bWVudHMvYmFiZWwvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9Vc2Vycy9KZWZmL0RvY3VtZW50cy9iYWJlbC9zcmMvZ2FtZS9lbnRpdGllcy9wbGF5ZXIuanMiLCIvVXNlcnMvSmVmZi9Eb2N1bWVudHMvYmFiZWwvc3JjL2dhbWUvbWFpbi5qcyIsIi9Vc2Vycy9KZWZmL0RvY3VtZW50cy9iYWJlbC9zcmMvZ2FtZS9zdGF0ZXMvcGxheS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gUGxheWVyID0gZnVuY3Rpb24oZ2FtZSwgeCwgeSkge1xuICAgIFBoYXNlci5TcHJpdGUuY2FsbCh0aGlzLCBnYW1lLCB4LCB5LCAncGxheWVyJyk7XG5cbiAgICB0aGlzLk1BWF9TUEVFRCA9IDMwMDsgLy8gcGl4ZWxzL3NlY29uZFxuICAgIHRoaXMuQUNDRUxFUkFUSU9OID0gMjAwMDsgLy8gcGl4ZWxzL3NlY29uZC9zZWNvbmRcbiAgICB0aGlzLkRSQUcgPSAyMDAwOyAvLyBwaXhlbHMvc2Vjb25kXG4gICAgdGhpcy5KVU1QX1NQRUVEID0gLTEwMDA7IC8vIHBpeGVscy9zZWNvbmQgKG5lZ2F0aXZlIHkgaXMgdXApXG5cbiAgICBnYW1lLnBoeXNpY3MuZW5hYmxlKHRoaXMsIFBoYXNlci5QaHlzaWNzLkFSQ0FERSk7XG4gICAgdGhpcy5ib2R5LmNvbGxpZGVXb3JsZEJvdW5kcyA9IHRydWU7XG4gICAgdGhpcy5ib2R5LmNoZWNrQ29sbGlzaW9uLnVwID0gZmFsc2U7XG4gICAgdGhpcy5ib2R5Lm1heFZlbG9jaXR5LnNldFRvKHRoaXMuTUFYX1NQRUVELCB0aGlzLk1BWF9TUEVFRCAqIDEwKTsgLy8geCwgeVxuICAgIHRoaXMuYm9keS5kcmFnLnNldFRvKHRoaXMuRFJBRywgMCk7IC8vIHgsIHlcbn07XG5cblBsYXllci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBoYXNlci5TcHJpdGUucHJvdG90eXBlKTtcblBsYXllci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBQbGF5ZXI7XG5cbi8vIHBsYXllciBtb3ZlbWVudHNcblBsYXllci5wcm90b3R5cGUud2Fsa0xlZnQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmJvZHkuYWNjZWxlcmF0aW9uLnggKz0gLXRoaXMuQUNDRUxFUkFUSU9OO1xufTtcblxuUGxheWVyLnByb3RvdHlwZS53YWxrUmlnaHQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmJvZHkuYWNjZWxlcmF0aW9uLnggKz0gdGhpcy5BQ0NFTEVSQVRJT047XG59O1xuXG5QbGF5ZXIucHJvdG90eXBlLmNsaW1iID0gZnVuY3Rpb24oZ2FtZVN0YXRlKSB7XG4gICAgdmFyIGNsaW1iVGltZSA9IDcwMDtcbiAgICB2YXIgY2xpbWJTcGVlZCA9IGdhbWVTdGF0ZS5nZXRTY2FmZm9sZEhlaWdodCgpKjEwMDAvY2xpbWJUaW1lO1xuICAgIHRoaXMuY2xpbWJpbmcgPSB0cnVlO1xuICAgIHRoaXMuYm9keS5hbGxvd0dyYXZpdHkgPSBmYWxzZTtcbiAgICB0aGlzLmJvZHkudmVsb2NpdHkueSAtPSBjbGltYlNwZWVkLzY7XG4gICAgdGhpcy5nYW1lLndvcmxkLnNldEFsbENoaWxkcmVuKCdib2R5LnZlbG9jaXR5LnknLCBjbGltYlNwZWVkLCB0cnVlLCB0cnVlLCAxLCBmYWxzZSk7XG5cbiAgICBzdG9wQ2xpbWJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5jbGltYmluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmJvZHkudmVsb2NpdHkueSA9IDA7XG4gICAgICAgIHRoaXMuYm9keS5hbGxvd0dyYXZpdHkgPSB0cnVlO1xuICAgICAgICB0aGlzLmdhbWUud29ybGQuc2V0QWxsQ2hpbGRyZW4oJ2JvZHkudmVsb2NpdHkueScsIDAsIHRydWUsIHRydWUsIDAsIGZhbHNlKTtcbiAgICB9O1xuXG4gICAgdGhpcy5nYW1lLnRpbWUuZXZlbnRzLmFkZChjbGltYlRpbWUsIHN0b3BDbGltYmluZywgdGhpcyk7XG5cbn07XG5cblBsYXllci5wcm90b3R5cGUuaXNCdXN5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICEhdGhpcy5jbGltYmluZyB8fCAhIXRoaXMuYnVpbGRpbmc7XG59O1xuXG5cblBsYXllci5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XG5cbn07IiwiLy8gVGhpcyBleGFtcGxlIHVzZXMgdGhlIFBoYXNlciAyLjAuNCBmcmFtZXdvcmtcblxuLy8gQ29weXJpZ2h0IMKpIDIwMTQgSm9obiBXYXRzb25cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgTUlUIExpY2Vuc2VcblxuXG52YXIgZ2FtZSA9IG5ldyBQaGFzZXIuR2FtZSg4MDAsIDUwMCwgUGhhc2VyLkFVVE8sICdnYW1lJyk7XG5HYW1lU3RhdGUgPSByZXF1aXJlKCcuL3N0YXRlcy9wbGF5Jyk7XG5nYW1lLnN0YXRlLmFkZCgnZ2FtZScsIEdhbWVTdGF0ZSwgdHJ1ZSk7XG5cbndpbmRvdy5nYW1lID0gZ2FtZTsiLCJtb2R1bGUuZXhwb3J0cyA9IEdhbWVTdGF0ZSA9IGZ1bmN0aW9uKGdhbWUpIHtcbn07XG5cbi8vIExvYWQgaW1hZ2VzIGFuZCBzb3VuZHNcbkdhbWVTdGF0ZS5wcm90b3R5cGUucHJlbG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZ2FtZS5sb2FkLmltYWdlKCdzY2FmZm9sZCcsICcvYXNzZXRzL3NjYWZmb2xkLnBuZycpO1xuICAgIHRoaXMuZ2FtZS5sb2FkLmltYWdlKCdwbGF5ZXInLCAnL2Fzc2V0cy9wbGF5ZXIucG5nJyk7XG59O1xuXG4vLyBTZXR1cCB0aGUgZXhhbXBsZVxuR2FtZVN0YXRlLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBTZXQgc3RhZ2UgYmFja2dyb3VuZCB0byBzb21ldGhpbmcgc2t5IGNvbG9yZWRcbiAgICB0aGlzLmdhbWUuc3RhZ2UuYmFja2dyb3VuZENvbG9yID0gMHg0NDg4Y2M7XG5cbiAgICB0aGlzLmdhbWUuY2FtZXJhLmJvdW5kcyA9IG51bGw7XG5cbiAgICB0aGlzLkdSQVZJVFkgPSAyNjAwOyAvLyBwaXhlbHMvc2Vjb25kL3NlY29uZFxuICAgIHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS5ncmF2aXR5LnkgPSB0aGlzLkdSQVZJVFk7XG5cblxuICAgIHRoaXMuc2NhZmZvbGRQb29sID0gdGhpcy5nYW1lLmFkZC5ncm91cCgpO1xuXG4gICAgLy8gc3RhcnQgc2NhZmZvbGQgcG9vbCB3aXRoIDEwMCBwaWVjZXNcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgMTAwOyBpKyspIHtcbiAgICAgICAgLy8gYWRkU2NhZmZvbGRUb1Bvb2wuY2FsbCh0aGlzKTtcbiAgICAgICAgdGhpcy5hZGRTY2FmZm9sZFRvUG9vbCgpO1xuICAgIH1cblxuICAgIHRoaXMuZ2V0U2NhZmZvbGRIZWlnaHQgPSBmdW5jdGlvbiAoKSB7cmV0dXJuIHRoaXMuc2NhZmZvbGRQb29sLmdldEF0KDApLmhlaWdodDt9O1xuICAgIHRoaXMuZ2V0U2NhZmZvbGRXaWR0aCA9IGZ1bmN0aW9uICgpIHtyZXR1cm4gdGhpcy5zY2FmZm9sZFBvb2wuZ2V0QXQoMCkud2lkdGg7fTtcblxuICAgIHZhciBQbGF5ZXIgPSByZXF1aXJlKCcuLi9lbnRpdGllcy9wbGF5ZXInKTtcbiAgICB0aGlzLnBsYXllciA9IG5ldyBQbGF5ZXIodGhpcy5nYW1lLCB0aGlzLmdhbWUud2lkdGgvMiwgdGhpcy5nYW1lLmhlaWdodC8yIC0gNjApO1xuICAgIHRoaXMuZ2FtZS5hZGQuZXhpc3RpbmcodGhpcy5wbGF5ZXIpO1xuXG5cbiAgICAvLyBpbnZpc2libGUgaGVscGVyIG9iamVjdCB0byBkZXRlcm1pbmUgaWYgc2NhZmZvbGRpbmcgZXhpc3RzIGluIHRoZSBkaXJlY3Rpb24gcHJlc3NlZFxuICAgIHRoaXMudGFyZ2V0UG9zaXRpb24gPSB0aGlzLmdhbWUuYWRkLnNwcml0ZSh0aGlzLnBsYXllci54LCB0aGlzLnBsYXllci55KTtcbiAgICB0aGlzLmdhbWUucGh5c2ljcy5lbmFibGUodGhpcy50YXJnZXRQb3NpdGlvbiwgUGhhc2VyLlBoeXNpY3MuQVJDQURFKTtcbiAgICB0aGlzLnRhcmdldFBvc2l0aW9uLmJvZHkuYWxsb3dHcmF2aXR5ID0gZmFsc2U7XG4gICAgdGhpcy50YXJnZXRQb3NpdGlvbi5ib2R5LnNldFNpemUoMTAsIHRoaXMuZ2V0U2NhZmZvbGRIZWlnaHQoKS8yLCB0aGlzLnRhcmdldFBvc2l0aW9uLndpZHRoLzItNSwgdGhpcy50YXJnZXRQb3NpdGlvbi5oZWlnaHQvMi01KTtcblxuXG4gICAgLy8gbGF5IHNvbWUgaW5pdGlhbCBzY2FmZm9sZGluZ1xuICAgIGZvcih2YXIgeCA9IDA7IHggPCB0aGlzLmdhbWUud2lkdGg7IHggKz0gdGhpcy5nZXRTY2FmZm9sZFdpZHRoKCkpIHtcbiAgICAgICAgdGhpcy5idWlsZFNjYWZmb2xkKHgsIHRoaXMuZ2FtZS5oZWlnaHQvMiAtIHRoaXMuZ2V0U2NhZmZvbGRIZWlnaHQoKS8yKTtcbiAgICB9XG5cblxuICAgIC8vIENhcHR1cmUgY2VydGFpbiBrZXlzIHRvIHByZXZlbnQgdGhlaXIgZGVmYXVsdCBhY3Rpb25zIGluIHRoZSBicm93c2VyLlxuICAgIC8vIFRoaXMgaXMgb25seSBuZWNlc3NhcnkgYmVjYXVzZSB0aGlzIGlzIGFuIEhUTUw1IGdhbWUuIEdhbWVzIG9uIG90aGVyXG4gICAgLy8gcGxhdGZvcm1zIG1heSBub3QgbmVlZCBjb2RlIGxpa2UgdGhpcy5cbiAgICB0aGlzLmdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5Q2FwdHVyZShbXG4gICAgICAgIFBoYXNlci5LZXlib2FyZC5MRUZULFxuICAgICAgICBQaGFzZXIuS2V5Ym9hcmQuUklHSFQsXG4gICAgICAgIFBoYXNlci5LZXlib2FyZC5VUCxcbiAgICAgICAgUGhhc2VyLktleWJvYXJkLkRPV05cbiAgICBdKTtcblxuXG4gICAgLy8gU2hvdyBGUFNcbiAgICB0aGlzLmdhbWUudGltZS5hZHZhbmNlZFRpbWluZyA9IHRydWU7XG4gICAgdGhpcy5mcHNUZXh0ID0gdGhpcy5nYW1lLmFkZC50ZXh0KFxuICAgICAgICAyMCwgMjAsICcnLCB7IGZvbnQ6ICcxNnB4IEFyaWFsJywgZmlsbDogJyNmZmZmZmYnIH1cbiAgICApO1xufTtcblxuR2FtZVN0YXRlLnByb3RvdHlwZS5hZGRTY2FmZm9sZFRvUG9vbCA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIHNjYWZmb2xkID0gdGhpcy5nYW1lLmFkZC5zcHJpdGUoMCwgMCwgJ3NjYWZmb2xkJyk7XG4gICAgc2NhZmZvbGQubmFtZSA9ICdzY2FmZm9sZCcrdGhpcy5zY2FmZm9sZFBvb2wubGVuZ3RoO1xuICAgIHNjYWZmb2xkLnNjYWxlLnggPSAyLjU7XG4gICAgc2NhZmZvbGQuc2NhbGUueSA9IDI7XG4gICAgdGhpcy5zY2FmZm9sZFBvb2wuYWRkKHNjYWZmb2xkKTtcblxuICAgIC8vIEVuYWJsZSBwaHlzaWNzIG9uIHRoZSBzY2FmZm9sZFxuICAgIHRoaXMuZ2FtZS5waHlzaWNzLmVuYWJsZShzY2FmZm9sZCwgUGhhc2VyLlBoeXNpY3MuQVJDQURFKTtcbiAgICBzY2FmZm9sZC5ib2R5LmltbW92YWJsZSA9IHRydWU7XG4gICAgc2NhZmZvbGQuYm9keS5hbGxvd0dyYXZpdHkgPSBmYWxzZTtcbiAgICBzY2FmZm9sZC5ib2R5LnNldFNpemUoMzIsIDUsIDAgLCA2NC0xMCk7XG5cbiAgICAvLyBTZXQgaXRzIGluaXRpYWwgc3RhdGUgdG8gXCJkZWFkXCIuXG4gICAgc2NhZmZvbGQua2lsbCgpO1xuXG4gICAgc2NhZmZvbGQuY2hlY2tXb3JsZEJvdW5kcyA9IHRydWU7XG4gICAgc2NhZmZvbGQub3V0T2ZCb3VuZHNLaWxsID0gdHJ1ZTtcblxuICAgIHJldHVybiBzY2FmZm9sZDtcbn07XG5cbkdhbWVTdGF0ZS5wcm90b3R5cGUuYnVpbGRTY2FmZm9sZCA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgdmFyIGJ1aWxkVGltZSA9IFBoYXNlci5UaW1lci5TRUNPTkQgKiAwLjY7XG4gICAgdGhpcy5wbGF5ZXIuYnVpbGRpbmcgPSB0cnVlO1xuICAgIC8vIEdldCBhIGRlYWQgc2NhZmZvbGQgZnJvbSB0aGUgcG9vbFxuICAgIHZhciBzY2FmZm9sZCA9IHRoaXMuc2NhZmZvbGRQb29sLmdldEZpcnN0RGVhZCgpO1xuICAgIGlmIChzY2FmZm9sZCA9PT0gbnVsbCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcImluY3JlYXNpbmcgc2NhZmZvbGQgcG9vbCB0b1wiLCB0aGlzLnNjYWZmb2xkUG9vbC5sZW5ndGgpO1xuICAgICAgICBzY2FmZm9sZCA9IHRoaXMuYWRkU2NhZmZvbGRUb1Bvb2woKTtcbiAgICB9XG4gICAgc2NhZmZvbGQucmV2aXZlKCk7XG4gICAgc2NhZmZvbGQucmVzZXQoeCwgeSk7XG4gICAgc2NhZmZvbGQuYWxwaGEgPSAwO1xuICAgIC8vIGZhZGUgaW4gKHRlbXAgYW5pbWF0aW9uKVxuICAgIHRoaXMuZ2FtZS5hZGQudHdlZW4oc2NhZmZvbGQpLnRvKCB7IGFscGhhOiAxIH0sIGJ1aWxkVGltZSwgUGhhc2VyLkVhc2luZy5MaW5lYXIuTm9uZSwgdHJ1ZSk7XG5cbiAgICBmdW5jdGlvbiBzdG9wQnVpbGRpbmcoKSB7dGhpcy5wbGF5ZXIuYnVpbGRpbmcgPSBmYWxzZTt9XG4gICAgdGhpcy5nYW1lLnRpbWUuZXZlbnRzLmFkZChidWlsZFRpbWUsIHN0b3BCdWlsZGluZywgdGhpcyk7XG5cbiAgICByZXR1cm4gc2NhZmZvbGQ7XG59O1xuXG5HYW1lU3RhdGUucHJvdG90eXBlLmV4dGVuZFNjYWZmb2xkID0gZnVuY3Rpb24oYW5jaG9yU2NhZmZvbGQsIGRpcmVjdGlvbikge1xuICAgIC8vIFRPRE8gY2hlY2sgZm9yIGFuY2hvclNjYWZmb2xkLCBtYXliZSBoZXJlLCBvciBtYXliZSBpbiBmdW5jdGlvbiB0aGF0IGNhbGxzP1xuICAgIHN3aXRjaCAoZGlyZWN0aW9uKSB7XG4gICAgICAgIGNhc2UgJ3VwJzpcbiAgICAgICAgdGhpcy5idWlsZFNjYWZmb2xkKGFuY2hvclNjYWZmb2xkLngsIGFuY2hvclNjYWZmb2xkLnkgLSBhbmNob3JTY2FmZm9sZC5oZWlnaHQpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmlnaHQnOlxuICAgICAgICB0aGlzLmJ1aWxkU2NhZmZvbGQoYW5jaG9yU2NhZmZvbGQueCArIGFuY2hvclNjYWZmb2xkLndpZHRoLCBhbmNob3JTY2FmZm9sZC55KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2xlZnQnOlxuICAgICAgICB0aGlzLmJ1aWxkU2NhZmZvbGQoYW5jaG9yU2NhZmZvbGQueCAtIGFuY2hvclNjYWZmb2xkLndpZHRoLCBhbmNob3JTY2FmZm9sZC55KTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxufTtcblxuR2FtZVN0YXRlLnByb3RvdHlwZS5nZXRTY2FmZm9sZFVuZGVyZm9vdCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzY2FmZm9sZFVuZGVyRm9vdDtcbiAgICB0aGlzLnRhcmdldFBvc2l0aW9uLmJvZHkucmVzZXQodGhpcy5wbGF5ZXIueCwgdGhpcy5wbGF5ZXIueSArIHRoaXMucGxheWVyLmhlaWdodC8yICsgNSk7XG4gICAgZnVuY3Rpb24gY29sbGlzaW9uSGFuZGxlcihwbGF5ZXIsIHNjYWZmb2xkKSB7XG4gICAgICAgIHNjYWZmb2xkVW5kZXJGb290ID0gc2NhZmZvbGQ7XG4gICAgfVxuICAgIHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS5vdmVybGFwKHRoaXMudGFyZ2V0UG9zaXRpb24sIHRoaXMuc2NhZmZvbGRQb29sLCBjb2xsaXNpb25IYW5kbGVyLCBudWxsLCB0aGlzKTtcbiAgICByZXR1cm4gc2NhZmZvbGRVbmRlckZvb3Q7XG59O1xuXG5cbi8vIFRoaXMgZnVuY3Rpb24gZHJhd3MgaG9yaXpvbnRhbCBsaW5lcyBhY3Jvc3MgdGhlIHN0YWdlXG4vLyBHYW1lU3RhdGUucHJvdG90eXBlLmRyYXdIZWlnaHRNYXJrZXJzID0gZnVuY3Rpb24oKSB7XG4vLyAgICAgLy8gQ3JlYXRlIGEgYml0bWFwIHRoZSBzYW1lIHNpemUgYXMgdGhlIHN0YWdlXG4vLyAgICAgdmFyIGJpdG1hcCA9IHRoaXMuZ2FtZS5hZGQuYml0bWFwRGF0YSh0aGlzLmdhbWUud2lkdGgsIHRoaXMuZ2FtZS5oZWlnaHQpO1xuXG4vLyAgICAgLy8gVGhlc2UgZnVuY3Rpb25zIHVzZSB0aGUgY2FudmFzIGNvbnRleHQgdG8gZHJhdyBsaW5lcyB1c2luZyB0aGUgY2FudmFzIEFQSVxuLy8gICAgIGZvcih5ID0gdGhpcy5nYW1lLmhlaWdodC0zMjsgeSA+PSA2NDsgeSAtPSAzMikge1xuLy8gICAgICAgICBiaXRtYXAuY29udGV4dC5iZWdpblBhdGgoKTtcbi8vICAgICAgICAgYml0bWFwLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSAncmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpJztcbi8vICAgICAgICAgYml0bWFwLmNvbnRleHQubW92ZVRvKDAsIHkpO1xuLy8gICAgICAgICBiaXRtYXAuY29udGV4dC5saW5lVG8odGhpcy5nYW1lLndpZHRoLCB5KTtcbi8vICAgICAgICAgYml0bWFwLmNvbnRleHQuc3Ryb2tlKCk7XG4vLyAgICAgfVxuXG4vLyAgICAgdGhpcy5nYW1lLmFkZC5pbWFnZSgwLCAwLCBiaXRtYXApO1xuLy8gfTtcblxuLy8gVGhlIHVwZGF0ZSgpIG1ldGhvZCBpcyBjYWxsZWQgZXZlcnkgZnJhbWVcbkdhbWVTdGF0ZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuZ2FtZS50aW1lLmZwcyAhPT0gMCkge1xuICAgICAgICB0aGlzLmZwc1RleHQuc2V0VGV4dCh0aGlzLmdhbWUudGltZS5mcHMgKyAnIEZQUycpO1xuICAgIH1cblxuICAgIC8vIENvbGxpZGUgdGhlIHBsYXllciB3aXRoIHRoZSBzY2FmZm9sZFxuICAgIHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHRoaXMucGxheWVyLCB0aGlzLnNjYWZmb2xkUG9vbCk7XG5cbiAgICB2YXIgcGxheWVyc0ZlZXQgPSB0aGlzLnBsYXllci55K3RoaXMucGxheWVyLmhlaWdodC8yICsgNTtcblxuICAgIC8vIHRhcmdldFBvc2l0aW9uIGZvbGxvd3MgcGxheWVyXG4gICAgdGhpcy50YXJnZXRQb3NpdGlvbi5ib2R5LnJlc2V0KHRoaXMucGxheWVyLngsIHBsYXllcnNGZWV0KTtcblxuICAgIHRoaXMucGxheWVyLmJvZHkuYWNjZWxlcmF0aW9uLnggPSAwO1xuXG4gICAgLy8gdXBkYXRlIGlucHV0c1xuXG4gICAgaWYgKCF0aGlzLnBsYXllci5pc0J1c3koKSAmJiB0aGlzLmxlZnRJbnB1dElzQWN0aXZlKCkpIHtcbiAgICAgICAgdGhpcy50YXJnZXRQb3NpdGlvbi5ib2R5LnJlc2V0KHRoaXMucGxheWVyLnggLSB0aGlzLmdldFNjYWZmb2xkV2lkdGgoKSo0LzUsIHBsYXllcnNGZWV0KTtcbiAgICAgICAgdGhpcy5idWlsZE9yTW92ZSgnbGVmdCcsIHRoaXMucGxheWVyLndhbGtMZWZ0KTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLnBsYXllci5pc0J1c3koKSAmJiB0aGlzLnJpZ2h0SW5wdXRJc0FjdGl2ZSgpKSB7XG4gICAgICAgIHRoaXMudGFyZ2V0UG9zaXRpb24uYm9keS5yZXNldCh0aGlzLnBsYXllci54ICsgdGhpcy5nZXRTY2FmZm9sZFdpZHRoKCkqNC81LCBwbGF5ZXJzRmVldCk7XG4gICAgICAgIHRoaXMuYnVpbGRPck1vdmUoJ3JpZ2h0JywgdGhpcy5wbGF5ZXIud2Fsa1JpZ2h0KTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLnBsYXllci5pc0J1c3koKSAmJiB0aGlzLnVwSW5wdXRJc0FjdGl2ZSgpKSB7XG4gICAgICAgIHRoaXMucGxheWVyLmJvZHkuYWNjZWxlcmF0aW9uLnggPSAwO1xuICAgICAgICB0aGlzLnRhcmdldFBvc2l0aW9uLmJvZHkucmVzZXQodGhpcy5wbGF5ZXIueCwgcGxheWVyc0ZlZXQgLSB0aGlzLmdldFNjYWZmb2xkSGVpZ2h0KCkpO1xuICAgICAgICB0aGlzLmJ1aWxkT3JNb3ZlKCd1cCcsIHRoaXMucGxheWVyLmNsaW1iKTtcbiAgICB9XG5cbiAgICAvLyBmb3IgZGVidWdnaW5nIGFjdGlvbnMgLy9cbiAgICBpZih0aGlzLmlucHV0LmtleWJvYXJkLmp1c3RQcmVzc2VkKFBoYXNlci5LZXlib2FyZC5ET1dOLDEpKXtcbiAgICAgICAgdGhpcy5nZXRTY2FmZm9sZFVuZGVyZm9vdCgpO1xuICAgIH1cbn07XG5cbkdhbWVTdGF0ZS5wcm90b3R5cGUuYnVpbGRPck1vdmUgPSBmdW5jdGlvbihkaXJlY3Rpb24sIG1vdmVGbikge1xuICAgIC8vIENvbGxpZGUgdGhlIHRhcmdldFBvc2l0aW9uIHdpdGggdGhlIHNjYWZmb2xkXG4gICAgaWYodGhpcy5nYW1lLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAodGhpcy50YXJnZXRQb3NpdGlvbiwgdGhpcy5zY2FmZm9sZFBvb2wpKSB7XG4gICAgICAgIC8vIHNjYWZmb2xkIGV4aXN0cyB0byBtb3ZlIHRvXG4gICAgICAgIC8vIFRPRE8gLSBvbmx5IGNsaW1iIGlmIHVwIGlzIGhlbGQgZm9yIC41IHNlY1xuICAgICAgICBtb3ZlRm4uY2FsbCh0aGlzLnBsYXllciwgdGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gc3RvcCBhbmQgYnVpbGRcbiAgICAgICAgdGhpcy5wbGF5ZXIuYm9keS5hY2NlbGVyYXRpb24ueCA9IDA7XG5cbiAgICAgICAgLy8gZGlyZWN0aW9uIHBhc3NlZCBpbiBhcyAndXAnLCAnbGVmdCcsICdyaWdodCdcbiAgICAgICAgYW5jaG9yU2NhZmZvbGQgPSB0aGlzLmdldFNjYWZmb2xkVW5kZXJmb290KCk7XG4gICAgICAgIHRoaXMuZXh0ZW5kU2NhZmZvbGQoYW5jaG9yU2NhZmZvbGQsIGRpcmVjdGlvbik7XG5cbiAgICAgICAgLy8gVE9ETyAtIERPTidUIEJVSUxEIElGIElUIFdJTEwgQkUgT0ZGIFNDUkVFTlxuICAgIH1cbn07XG5cbi8vIFRoaXMgZnVuY3Rpb24gc2hvdWxkIHJldHVybiB0cnVlIHdoZW4gdGhlIHBsYXllciBhY3RpdmF0ZXMgdGhlIFwiZ28gbGVmdFwiIGNvbnRyb2xcbi8vIEluIHRoaXMgY2FzZSwgZWl0aGVyIGhvbGRpbmcgdGhlIHJpZ2h0IGFycm93IG9yIHRhcHBpbmcgb3IgY2xpY2tpbmcgb24gdGhlIGxlZnRcbi8vIHNpZGUgb2YgdGhlIHNjcmVlbi5cbkdhbWVTdGF0ZS5wcm90b3R5cGUubGVmdElucHV0SXNBY3RpdmUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXNBY3RpdmUgPSBmYWxzZTtcblxuICAgIGlzQWN0aXZlID0gdGhpcy5pbnB1dC5rZXlib2FyZC5pc0Rvd24oUGhhc2VyLktleWJvYXJkLkxFRlQpO1xuICAgIGlzQWN0aXZlIHw9ICh0aGlzLmdhbWUuaW5wdXQuYWN0aXZlUG9pbnRlci5pc0Rvd24gJiZcbiAgICAgICAgdGhpcy5nYW1lLmlucHV0LmFjdGl2ZVBvaW50ZXIueCA8IHRoaXMuZ2FtZS53aWR0aC80KTtcblxuICAgIHJldHVybiBpc0FjdGl2ZTtcbn07XG5cbi8vIFRoaXMgZnVuY3Rpb24gc2hvdWxkIHJldHVybiB0cnVlIHdoZW4gdGhlIHBsYXllciBhY3RpdmF0ZXMgdGhlIFwiZ28gcmlnaHRcIiBjb250cm9sXG4vLyBJbiB0aGlzIGNhc2UsIGVpdGhlciBob2xkaW5nIHRoZSByaWdodCBhcnJvdyBvciB0YXBwaW5nIG9yIGNsaWNraW5nIG9uIHRoZSByaWdodFxuLy8gc2lkZSBvZiB0aGUgc2NyZWVuLlxuR2FtZVN0YXRlLnByb3RvdHlwZS5yaWdodElucHV0SXNBY3RpdmUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXNBY3RpdmUgPSBmYWxzZTtcblxuICAgIGlzQWN0aXZlID0gdGhpcy5pbnB1dC5rZXlib2FyZC5pc0Rvd24oUGhhc2VyLktleWJvYXJkLlJJR0hUKTtcbiAgICBpc0FjdGl2ZSB8PSAodGhpcy5nYW1lLmlucHV0LmFjdGl2ZVBvaW50ZXIuaXNEb3duICYmXG4gICAgICAgIHRoaXMuZ2FtZS5pbnB1dC5hY3RpdmVQb2ludGVyLnggPiB0aGlzLmdhbWUud2lkdGgvMiArIHRoaXMuZ2FtZS53aWR0aC80KTtcblxuICAgIHJldHVybiBpc0FjdGl2ZTtcbn07XG5cbi8vIFRoaXMgZnVuY3Rpb24gc2hvdWxkIHJldHVybiB0cnVlIHdoZW4gdGhlIHBsYXllciBhY3RpdmF0ZXMgdGhlIFwianVtcFwiIGNvbnRyb2xcbi8vIEluIHRoaXMgY2FzZSwgZWl0aGVyIGhvbGRpbmcgdGhlIHVwIGFycm93IG9yIHRhcHBpbmcgb3IgY2xpY2tpbmcgb24gdGhlIGNlbnRlclxuLy8gcGFydCBvZiB0aGUgc2NyZWVuLlxuR2FtZVN0YXRlLnByb3RvdHlwZS51cElucHV0SXNBY3RpdmUgPSBmdW5jdGlvbihkdXJhdGlvbikge1xuICAgIHZhciBpc0FjdGl2ZSA9IGZhbHNlO1xuXG4gICAgaXNBY3RpdmUgPSB0aGlzLmlucHV0LmtleWJvYXJkLmp1c3RQcmVzc2VkKFBoYXNlci5LZXlib2FyZC5VUCwgZHVyYXRpb24pO1xuICAgIGlzQWN0aXZlIHw9ICh0aGlzLmdhbWUuaW5wdXQuYWN0aXZlUG9pbnRlci5qdXN0UHJlc3NlZChkdXJhdGlvbiArIDEwMDAvNjApICYmXG4gICAgICAgIHRoaXMuZ2FtZS5pbnB1dC5hY3RpdmVQb2ludGVyLnggPiB0aGlzLmdhbWUud2lkdGgvNCAmJlxuICAgICAgICB0aGlzLmdhbWUuaW5wdXQuYWN0aXZlUG9pbnRlci54IDwgdGhpcy5nYW1lLndpZHRoLzIgKyB0aGlzLmdhbWUud2lkdGgvNCk7XG5cbiAgICByZXR1cm4gaXNBY3RpdmU7XG59O1xuXG5HYW1lU3RhdGUucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcblxuICAgIC8vIGdhbWUuZGVidWcuYm9keUluZm8odGhpcy5wbGF5ZXIsIDMyLCAzMik7XG5cbiAgICB0aGlzLmdhbWUuZGVidWcuYm9keSh0aGlzLnRhcmdldFBvc2l0aW9uKTtcbiAgICB0aGlzLmdhbWUuZGVidWcuYm9keSh0aGlzLnBsYXllcik7XG4gICAgLy8gdGhpcy5nYW1lLmRlYnVnLnNwcml0ZUJvdW5kcyh0aGlzLnBsYXllcik7XG4gICAgdGhpcy5zY2FmZm9sZFBvb2wuZm9yRWFjaChmdW5jdGlvbihzY2FmZm9sZCl7dGhpcy5nYW1lLmRlYnVnLmJvZHkoc2NhZmZvbGQpO30sdGhpcyk7XG59OyJdfQ==
