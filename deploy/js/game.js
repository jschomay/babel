(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = Player = function(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'player');

    this.MAX_SPEED = 300; // pixels/second
    this.ACCELERATION = 1500; // pixels/second/second
    this.DRAG = 1000; // pixels/second
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
    for(var x = 0; x < this.game.width; x += 32) {
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
    // Get a dead scaffold from the pool
    var scaffold = this.scaffoldPool.getFirstDead();
    if (scaffold === null) {
        console.log("increasing scaffold pool to", this.scaffoldPool.length);
        scaffold = this.addScaffoldToPool();
    }
    scaffold.revive();
    scaffold.reset(x, y);

    return scaffold;
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

    // TODO - DON'T MOVE IF BUILDING
    if (!this.player.climbing && this.leftInputIsActive()) {
        this.targetPosition.body.reset(this.player.x - this.player.width, this.player.y + this.player.height);
        this.buildOrMove(this.player.walkLeft);
    }
    if (!this.player.climbing && this.rightInputIsActive()) {
        this.targetPosition.body.reset(this.player.x + this.player.width, this.player.y + this.player.height);
        this.buildOrMove(this.player.walkRight);
    }

    if (!this.player.climbing && this.upInputIsActive()) {
        this.player.body.acceleration.x = 0;
        this.targetPosition.body.reset(this.player.x, this.player.y - this.player.height*2);
        this.buildOrMove(this.player.climb);
    }
};

GameState.prototype.buildOrMove = function(moveFn) {
    // Collide the targetPosition with the scaffold
    if(this.game.physics.arcade.overlap(this.targetPosition, this.scaffoldPool)) {
        // scaffold exists to move to
        moveFn.call(this.player);
    } else {
        // stop and build
        this.player.body.acceleration.x = 0;
        
        // TODO - USE TARGET POS MATH TO BUILD SCAFFOLD IN RIGHT PLACE
        this.buildScaffold(this.targetPosition.body.x, this.targetPosition.body.y);

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

    // game.debug.bodyInfo(sprite1, 32, 32);

    this.game.debug.body(this.targetPosition);
    this.game.debug.body(this.player);
    // this.scaffoldPool.forEach(function(scaffold){this.game.debug.body(scaffold);},this);
};
},{"../entities/player":1}]},{},[1,2,3])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvamVmZi9Eb2N1bWVudHMvUHJvamVjdHMvQWN0aXZlX1Byb2plY3RzL2JhYmVsL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvamVmZi9Eb2N1bWVudHMvUHJvamVjdHMvQWN0aXZlX1Byb2plY3RzL2JhYmVsL3NyYy9nYW1lL2VudGl0aWVzL3BsYXllci5qcyIsIi9Vc2Vycy9qZWZmL0RvY3VtZW50cy9Qcm9qZWN0cy9BY3RpdmVfUHJvamVjdHMvYmFiZWwvc3JjL2dhbWUvbWFpbi5qcyIsIi9Vc2Vycy9qZWZmL0RvY3VtZW50cy9Qcm9qZWN0cy9BY3RpdmVfUHJvamVjdHMvYmFiZWwvc3JjL2dhbWUvc3RhdGVzL3BsYXkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBQbGF5ZXIgPSBmdW5jdGlvbihnYW1lLCB4LCB5KSB7XG4gICAgUGhhc2VyLlNwcml0ZS5jYWxsKHRoaXMsIGdhbWUsIHgsIHksICdwbGF5ZXInKTtcblxuICAgIHRoaXMuTUFYX1NQRUVEID0gMzAwOyAvLyBwaXhlbHMvc2Vjb25kXG4gICAgdGhpcy5BQ0NFTEVSQVRJT04gPSAxNTAwOyAvLyBwaXhlbHMvc2Vjb25kL3NlY29uZFxuICAgIHRoaXMuRFJBRyA9IDEwMDA7IC8vIHBpeGVscy9zZWNvbmRcbiAgICB0aGlzLkpVTVBfU1BFRUQgPSAtMTAwMDsgLy8gcGl4ZWxzL3NlY29uZCAobmVnYXRpdmUgeSBpcyB1cClcblxuICAgIGdhbWUucGh5c2ljcy5lbmFibGUodGhpcywgUGhhc2VyLlBoeXNpY3MuQVJDQURFKTtcbiAgICB0aGlzLmJvZHkuY29sbGlkZVdvcmxkQm91bmRzID0gdHJ1ZTtcbiAgICB0aGlzLmJvZHkuY2hlY2tDb2xsaXNpb24udXAgPSBmYWxzZTtcbiAgICB0aGlzLmJvZHkubWF4VmVsb2NpdHkuc2V0VG8odGhpcy5NQVhfU1BFRUQsIHRoaXMuTUFYX1NQRUVEICogMTApOyAvLyB4LCB5XG4gICAgdGhpcy5ib2R5LmRyYWcuc2V0VG8odGhpcy5EUkFHLCAwKTsgLy8geCwgeVxufTtcblxuUGxheWVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGhhc2VyLlNwcml0ZS5wcm90b3R5cGUpO1xuUGxheWVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBsYXllcjtcblxuLy8gcGxheWVyIG1vdmVtZW50c1xuUGxheWVyLnByb3RvdHlwZS53YWxrTGVmdCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYm9keS5hY2NlbGVyYXRpb24ueCArPSAtdGhpcy5BQ0NFTEVSQVRJT047XG59O1xuXG5QbGF5ZXIucHJvdG90eXBlLndhbGtSaWdodCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYm9keS5hY2NlbGVyYXRpb24ueCArPSB0aGlzLkFDQ0VMRVJBVElPTjtcbn07XG5cblBsYXllci5wcm90b3R5cGUuY2xpbWIgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmNsaW1iaW5nID0gdHJ1ZTtcbiAgICB2YXIgY2xpbWJUd2VlbiA9IHRoaXMuZ2FtZS5hZGQudHdlZW4odGhpcy5ib2R5KTtcbiAgICBjbGltYlR3ZWVuLnRvKHt5OiAodGhpcy5ib2R5LnkgLSB0aGlzLmhlaWdodCAqIDMpfSwgMTAwMCwgUGhhc2VyLkVhc2luZy5MaW5lYXIuTm9uZSwgdHJ1ZSk7XG4gICAgY2xpbWJUd2Vlbi5vbkNvbXBsZXRlLmFkZChmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5jbGltYmluZyA9IGZhbHNlO1xuICAgIH0sIHRoaXMpO1xufTtcblxuXG5QbGF5ZXIucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuXG59OyIsIi8vIFRoaXMgZXhhbXBsZSB1c2VzIHRoZSBQaGFzZXIgMi4wLjQgZnJhbWV3b3JrXG5cbi8vIENvcHlyaWdodCDCqSAyMDE0IEpvaG4gV2F0c29uXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIE1JVCBMaWNlbnNlXG5cblxudmFyIGdhbWUgPSBuZXcgUGhhc2VyLkdhbWUoODAwLCA1MDAsIFBoYXNlci5BVVRPLCAnZ2FtZScpO1xuR2FtZVN0YXRlID0gcmVxdWlyZSgnLi9zdGF0ZXMvcGxheScpO1xuZ2FtZS5zdGF0ZS5hZGQoJ2dhbWUnLCBHYW1lU3RhdGUsIHRydWUpO1xuXG53aW5kb3cuZ2FtZSA9IGdhbWU7IiwibW9kdWxlLmV4cG9ydHMgPSBHYW1lU3RhdGUgPSBmdW5jdGlvbihnYW1lKSB7XG59O1xuXG4vLyBMb2FkIGltYWdlcyBhbmQgc291bmRzXG5HYW1lU3RhdGUucHJvdG90eXBlLnByZWxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmdhbWUubG9hZC5pbWFnZSgnc2NhZmZvbGQnLCAnL2Fzc2V0cy9zY2FmZm9sZC5wbmcnKTtcbiAgICB0aGlzLmdhbWUubG9hZC5pbWFnZSgncGxheWVyJywgJy9hc3NldHMvcGxheWVyLnBuZycpO1xufTtcblxuLy8gU2V0dXAgdGhlIGV4YW1wbGVcbkdhbWVTdGF0ZS5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gU2V0IHN0YWdlIGJhY2tncm91bmQgdG8gc29tZXRoaW5nIHNreSBjb2xvcmVkXG4gICAgdGhpcy5nYW1lLnN0YWdlLmJhY2tncm91bmRDb2xvciA9IDB4NDQ4OGNjO1xuXG4gICAgdGhpcy5HUkFWSVRZID0gMjYwMDsgLy8gcGl4ZWxzL3NlY29uZC9zZWNvbmRcbiAgICB0aGlzLmdhbWUucGh5c2ljcy5hcmNhZGUuZ3Jhdml0eS55ID0gdGhpcy5HUkFWSVRZO1xuXG4gICAgdmFyIFBsYXllciA9IHJlcXVpcmUoJy4uL2VudGl0aWVzL3BsYXllcicpO1xuICAgIHRoaXMucGxheWVyID0gbmV3IFBsYXllcih0aGlzLmdhbWUsIHRoaXMuZ2FtZS53aWR0aC8yLCB0aGlzLmdhbWUuaGVpZ2h0IC0gNjQpO1xuICAgIHRoaXMuZ2FtZS5hZGQuZXhpc3RpbmcodGhpcy5wbGF5ZXIpO1xuXG5cbiAgICAvLyBpbnZpc2libGUgaGVscGVyIG9iamVjdCB0byBkZXRlcm1pbmUgaWYgc2NhZmZvbGRpbmcgZXhpc3RzIGluIHRoZSBkaXJlY3Rpb24gcHJlc3NlZFxuICAgIHRoaXMudGFyZ2V0UG9zaXRpb24gPSB0aGlzLmdhbWUuYWRkLnNwcml0ZSh0aGlzLnBsYXllci54LCB0aGlzLnBsYXllci55KTtcbiAgICB0aGlzLmdhbWUucGh5c2ljcy5lbmFibGUodGhpcy50YXJnZXRQb3NpdGlvbiwgUGhhc2VyLlBoeXNpY3MuQVJDQURFKTtcbiAgICB0aGlzLnRhcmdldFBvc2l0aW9uLmJvZHkuYWxsb3dHcmF2aXR5ID0gZmFsc2U7XG4gICAgdGhpcy50YXJnZXRQb3NpdGlvbi5ib2R5LnNldFNpemUoMTAsIDEwLCB0aGlzLnRhcmdldFBvc2l0aW9uLndpZHRoLzItNSwgdGhpcy50YXJnZXRQb3NpdGlvbi5oZWlnaHQvMi01KTtcblxuXG5cbiAgICB0aGlzLnNjYWZmb2xkUG9vbCA9IHRoaXMuZ2FtZS5hZGQuZ3JvdXAoKTtcblxuICAgIC8vIHN0YXJ0IHNjYWZmb2xkIHBvb2wgd2l0aCAxMDAgcGllY2VzXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IDEwMDsgaSsrKSB7XG4gICAgICAgIC8vIGFkZFNjYWZmb2xkVG9Qb29sLmNhbGwodGhpcyk7XG4gICAgICAgIHRoaXMuYWRkU2NhZmZvbGRUb1Bvb2woKTtcbiAgICB9XG5cbiAgICAvLyBsYXkgc29tZSBpbml0aWFsIHNjYWZmb2xkaW5nXG4gICAgZm9yKHZhciB4ID0gMDsgeCA8IHRoaXMuZ2FtZS53aWR0aDsgeCArPSAzMikge1xuICAgICAgICB0aGlzLmJ1aWxkU2NhZmZvbGQoeCwgdGhpcy5nYW1lLmhlaWdodCAtIDMyKTtcbiAgICB9XG5cblxuICAgIC8vIENhcHR1cmUgY2VydGFpbiBrZXlzIHRvIHByZXZlbnQgdGhlaXIgZGVmYXVsdCBhY3Rpb25zIGluIHRoZSBicm93c2VyLlxuICAgIC8vIFRoaXMgaXMgb25seSBuZWNlc3NhcnkgYmVjYXVzZSB0aGlzIGlzIGFuIEhUTUw1IGdhbWUuIEdhbWVzIG9uIG90aGVyXG4gICAgLy8gcGxhdGZvcm1zIG1heSBub3QgbmVlZCBjb2RlIGxpa2UgdGhpcy5cbiAgICB0aGlzLmdhbWUuaW5wdXQua2V5Ym9hcmQuYWRkS2V5Q2FwdHVyZShbXG4gICAgICAgIFBoYXNlci5LZXlib2FyZC5MRUZULFxuICAgICAgICBQaGFzZXIuS2V5Ym9hcmQuUklHSFQsXG4gICAgICAgIFBoYXNlci5LZXlib2FyZC5VUCxcbiAgICAgICAgUGhhc2VyLktleWJvYXJkLkRPV05cbiAgICBdKTtcblxuICAgIC8vIEp1c3QgZm9yIGZ1biwgZHJhdyBzb21lIGhlaWdodCBtYXJrZXJzIHNvIHdlIGNhbiBzZWUgaG93IGhpZ2ggd2UncmUganVtcGluZ1xuICAgIHRoaXMuZHJhd0hlaWdodE1hcmtlcnMoKTtcblxuICAgIC8vIFNob3cgRlBTXG4gICAgdGhpcy5nYW1lLnRpbWUuYWR2YW5jZWRUaW1pbmcgPSB0cnVlO1xuICAgIHRoaXMuZnBzVGV4dCA9IHRoaXMuZ2FtZS5hZGQudGV4dChcbiAgICAgICAgMjAsIDIwLCAnJywgeyBmb250OiAnMTZweCBBcmlhbCcsIGZpbGw6ICcjZmZmZmZmJyB9XG4gICAgKTtcbn07XG5cbkdhbWVTdGF0ZS5wcm90b3R5cGUuYWRkU2NhZmZvbGRUb1Bvb2wgPSBmdW5jdGlvbigpe1xuICAgIHZhciBzY2FmZm9sZCA9IHRoaXMuZ2FtZS5hZGQuc3ByaXRlKDAsIDAsICdzY2FmZm9sZCcpO1xuICAgIHRoaXMuc2NhZmZvbGRQb29sLmFkZChzY2FmZm9sZCk7XG5cbiAgICAvLyBFbmFibGUgcGh5c2ljcyBvbiB0aGUgc2NhZmZvbGRcbiAgICB0aGlzLmdhbWUucGh5c2ljcy5lbmFibGUoc2NhZmZvbGQsIFBoYXNlci5QaHlzaWNzLkFSQ0FERSk7XG4gICAgc2NhZmZvbGQuYm9keS5pbW1vdmFibGUgPSB0cnVlO1xuICAgIHNjYWZmb2xkLmJvZHkuYWxsb3dHcmF2aXR5ID0gZmFsc2U7XG5cbiAgICAvLyBTZXQgaXRzIGluaXRpYWwgc3RhdGUgdG8gXCJkZWFkXCIuXG4gICAgc2NhZmZvbGQua2lsbCgpO1xuXG4gICAgc2NhZmZvbGQuY2hlY2tXb3JsZEJvdW5kcyA9IHRydWU7XG4gICAgc2NhZmZvbGQub3V0T2ZCb3VuZHNLaWxsID0gdHJ1ZTtcblxuICAgIHJldHVybiBzY2FmZm9sZDtcbn07XG5cbkdhbWVTdGF0ZS5wcm90b3R5cGUuYnVpbGRTY2FmZm9sZCA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgLy8gR2V0IGEgZGVhZCBzY2FmZm9sZCBmcm9tIHRoZSBwb29sXG4gICAgdmFyIHNjYWZmb2xkID0gdGhpcy5zY2FmZm9sZFBvb2wuZ2V0Rmlyc3REZWFkKCk7XG4gICAgaWYgKHNjYWZmb2xkID09PSBudWxsKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiaW5jcmVhc2luZyBzY2FmZm9sZCBwb29sIHRvXCIsIHRoaXMuc2NhZmZvbGRQb29sLmxlbmd0aCk7XG4gICAgICAgIHNjYWZmb2xkID0gdGhpcy5hZGRTY2FmZm9sZFRvUG9vbCgpO1xuICAgIH1cbiAgICBzY2FmZm9sZC5yZXZpdmUoKTtcbiAgICBzY2FmZm9sZC5yZXNldCh4LCB5KTtcblxuICAgIHJldHVybiBzY2FmZm9sZDtcbn07XG5cblxuLy8gVGhpcyBmdW5jdGlvbiBkcmF3cyBob3Jpem9udGFsIGxpbmVzIGFjcm9zcyB0aGUgc3RhZ2VcbkdhbWVTdGF0ZS5wcm90b3R5cGUuZHJhd0hlaWdodE1hcmtlcnMgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBDcmVhdGUgYSBiaXRtYXAgdGhlIHNhbWUgc2l6ZSBhcyB0aGUgc3RhZ2VcbiAgICB2YXIgYml0bWFwID0gdGhpcy5nYW1lLmFkZC5iaXRtYXBEYXRhKHRoaXMuZ2FtZS53aWR0aCwgdGhpcy5nYW1lLmhlaWdodCk7XG5cbiAgICAvLyBUaGVzZSBmdW5jdGlvbnMgdXNlIHRoZSBjYW52YXMgY29udGV4dCB0byBkcmF3IGxpbmVzIHVzaW5nIHRoZSBjYW52YXMgQVBJXG4gICAgZm9yKHkgPSB0aGlzLmdhbWUuaGVpZ2h0LTMyOyB5ID49IDY0OyB5IC09IDMyKSB7XG4gICAgICAgIGJpdG1hcC5jb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICBiaXRtYXAuY29udGV4dC5zdHJva2VTdHlsZSA9ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiknO1xuICAgICAgICBiaXRtYXAuY29udGV4dC5tb3ZlVG8oMCwgeSk7XG4gICAgICAgIGJpdG1hcC5jb250ZXh0LmxpbmVUbyh0aGlzLmdhbWUud2lkdGgsIHkpO1xuICAgICAgICBiaXRtYXAuY29udGV4dC5zdHJva2UoKTtcbiAgICB9XG5cbiAgICB0aGlzLmdhbWUuYWRkLmltYWdlKDAsIDAsIGJpdG1hcCk7XG59O1xuXG5cbi8vIFRoZSB1cGRhdGUoKSBtZXRob2QgaXMgY2FsbGVkIGV2ZXJ5IGZyYW1lXG5HYW1lU3RhdGUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmdhbWUudGltZS5mcHMgIT09IDApIHtcbiAgICAgICAgdGhpcy5mcHNUZXh0LnNldFRleHQodGhpcy5nYW1lLnRpbWUuZnBzICsgJyBGUFMnKTtcbiAgICB9XG5cbiAgICAvLyBDb2xsaWRlIHRoZSBwbGF5ZXIgd2l0aCB0aGUgc2NhZmZvbGRcbiAgICB0aGlzLmdhbWUucGh5c2ljcy5hcmNhZGUuY29sbGlkZSh0aGlzLnBsYXllciwgdGhpcy5zY2FmZm9sZFBvb2wpO1xuXG4gICAgLy8gdGFyZ2V0UG9zaXRpb24gZm9sbG93cyBwbGF5ZXJcbiAgICB0aGlzLnRhcmdldFBvc2l0aW9uLmJvZHkucmVzZXQodGhpcy5wbGF5ZXIueCwgdGhpcy5wbGF5ZXIueSk7XG5cbiAgICB0aGlzLnBsYXllci5ib2R5LmFjY2VsZXJhdGlvbi54ID0gMDtcblxuICAgIC8vIHVwZGF0ZSBpbnB1dHNcblxuICAgIC8vIFRPRE8gLSBET04nVCBNT1ZFIElGIEJVSUxESU5HXG4gICAgaWYgKCF0aGlzLnBsYXllci5jbGltYmluZyAmJiB0aGlzLmxlZnRJbnB1dElzQWN0aXZlKCkpIHtcbiAgICAgICAgdGhpcy50YXJnZXRQb3NpdGlvbi5ib2R5LnJlc2V0KHRoaXMucGxheWVyLnggLSB0aGlzLnBsYXllci53aWR0aCwgdGhpcy5wbGF5ZXIueSArIHRoaXMucGxheWVyLmhlaWdodCk7XG4gICAgICAgIHRoaXMuYnVpbGRPck1vdmUodGhpcy5wbGF5ZXIud2Fsa0xlZnQpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMucGxheWVyLmNsaW1iaW5nICYmIHRoaXMucmlnaHRJbnB1dElzQWN0aXZlKCkpIHtcbiAgICAgICAgdGhpcy50YXJnZXRQb3NpdGlvbi5ib2R5LnJlc2V0KHRoaXMucGxheWVyLnggKyB0aGlzLnBsYXllci53aWR0aCwgdGhpcy5wbGF5ZXIueSArIHRoaXMucGxheWVyLmhlaWdodCk7XG4gICAgICAgIHRoaXMuYnVpbGRPck1vdmUodGhpcy5wbGF5ZXIud2Fsa1JpZ2h0KTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMucGxheWVyLmNsaW1iaW5nICYmIHRoaXMudXBJbnB1dElzQWN0aXZlKCkpIHtcbiAgICAgICAgdGhpcy5wbGF5ZXIuYm9keS5hY2NlbGVyYXRpb24ueCA9IDA7XG4gICAgICAgIHRoaXMudGFyZ2V0UG9zaXRpb24uYm9keS5yZXNldCh0aGlzLnBsYXllci54LCB0aGlzLnBsYXllci55IC0gdGhpcy5wbGF5ZXIuaGVpZ2h0KjIpO1xuICAgICAgICB0aGlzLmJ1aWxkT3JNb3ZlKHRoaXMucGxheWVyLmNsaW1iKTtcbiAgICB9XG59O1xuXG5HYW1lU3RhdGUucHJvdG90eXBlLmJ1aWxkT3JNb3ZlID0gZnVuY3Rpb24obW92ZUZuKSB7XG4gICAgLy8gQ29sbGlkZSB0aGUgdGFyZ2V0UG9zaXRpb24gd2l0aCB0aGUgc2NhZmZvbGRcbiAgICBpZih0aGlzLmdhbWUucGh5c2ljcy5hcmNhZGUub3ZlcmxhcCh0aGlzLnRhcmdldFBvc2l0aW9uLCB0aGlzLnNjYWZmb2xkUG9vbCkpIHtcbiAgICAgICAgLy8gc2NhZmZvbGQgZXhpc3RzIHRvIG1vdmUgdG9cbiAgICAgICAgbW92ZUZuLmNhbGwodGhpcy5wbGF5ZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHN0b3AgYW5kIGJ1aWxkXG4gICAgICAgIHRoaXMucGxheWVyLmJvZHkuYWNjZWxlcmF0aW9uLnggPSAwO1xuICAgICAgICBcbiAgICAgICAgLy8gVE9ETyAtIFVTRSBUQVJHRVQgUE9TIE1BVEggVE8gQlVJTEQgU0NBRkZPTEQgSU4gUklHSFQgUExBQ0VcbiAgICAgICAgdGhpcy5idWlsZFNjYWZmb2xkKHRoaXMudGFyZ2V0UG9zaXRpb24uYm9keS54LCB0aGlzLnRhcmdldFBvc2l0aW9uLmJvZHkueSk7XG5cbiAgICAgICAgLy8gVE9ETyAtIERPTidUIEJVSUxEIElGIElUIFdJTEwgQkUgT0ZGIFNDUkVFTlxuICAgIH1cbn07XG5cbi8vIFRoaXMgZnVuY3Rpb24gc2hvdWxkIHJldHVybiB0cnVlIHdoZW4gdGhlIHBsYXllciBhY3RpdmF0ZXMgdGhlIFwiZ28gbGVmdFwiIGNvbnRyb2xcbi8vIEluIHRoaXMgY2FzZSwgZWl0aGVyIGhvbGRpbmcgdGhlIHJpZ2h0IGFycm93IG9yIHRhcHBpbmcgb3IgY2xpY2tpbmcgb24gdGhlIGxlZnRcbi8vIHNpZGUgb2YgdGhlIHNjcmVlbi5cbkdhbWVTdGF0ZS5wcm90b3R5cGUubGVmdElucHV0SXNBY3RpdmUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXNBY3RpdmUgPSBmYWxzZTtcblxuICAgIGlzQWN0aXZlID0gdGhpcy5pbnB1dC5rZXlib2FyZC5pc0Rvd24oUGhhc2VyLktleWJvYXJkLkxFRlQpO1xuICAgIGlzQWN0aXZlIHw9ICh0aGlzLmdhbWUuaW5wdXQuYWN0aXZlUG9pbnRlci5pc0Rvd24gJiZcbiAgICAgICAgdGhpcy5nYW1lLmlucHV0LmFjdGl2ZVBvaW50ZXIueCA8IHRoaXMuZ2FtZS53aWR0aC80KTtcblxuICAgIHJldHVybiBpc0FjdGl2ZTtcbn07XG5cbi8vIFRoaXMgZnVuY3Rpb24gc2hvdWxkIHJldHVybiB0cnVlIHdoZW4gdGhlIHBsYXllciBhY3RpdmF0ZXMgdGhlIFwiZ28gcmlnaHRcIiBjb250cm9sXG4vLyBJbiB0aGlzIGNhc2UsIGVpdGhlciBob2xkaW5nIHRoZSByaWdodCBhcnJvdyBvciB0YXBwaW5nIG9yIGNsaWNraW5nIG9uIHRoZSByaWdodFxuLy8gc2lkZSBvZiB0aGUgc2NyZWVuLlxuR2FtZVN0YXRlLnByb3RvdHlwZS5yaWdodElucHV0SXNBY3RpdmUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaXNBY3RpdmUgPSBmYWxzZTtcblxuICAgIGlzQWN0aXZlID0gdGhpcy5pbnB1dC5rZXlib2FyZC5pc0Rvd24oUGhhc2VyLktleWJvYXJkLlJJR0hUKTtcbiAgICBpc0FjdGl2ZSB8PSAodGhpcy5nYW1lLmlucHV0LmFjdGl2ZVBvaW50ZXIuaXNEb3duICYmXG4gICAgICAgIHRoaXMuZ2FtZS5pbnB1dC5hY3RpdmVQb2ludGVyLnggPiB0aGlzLmdhbWUud2lkdGgvMiArIHRoaXMuZ2FtZS53aWR0aC80KTtcblxuICAgIHJldHVybiBpc0FjdGl2ZTtcbn07XG5cbi8vIFRoaXMgZnVuY3Rpb24gc2hvdWxkIHJldHVybiB0cnVlIHdoZW4gdGhlIHBsYXllciBhY3RpdmF0ZXMgdGhlIFwianVtcFwiIGNvbnRyb2xcbi8vIEluIHRoaXMgY2FzZSwgZWl0aGVyIGhvbGRpbmcgdGhlIHVwIGFycm93IG9yIHRhcHBpbmcgb3IgY2xpY2tpbmcgb24gdGhlIGNlbnRlclxuLy8gcGFydCBvZiB0aGUgc2NyZWVuLlxuR2FtZVN0YXRlLnByb3RvdHlwZS51cElucHV0SXNBY3RpdmUgPSBmdW5jdGlvbihkdXJhdGlvbikge1xuICAgIHZhciBpc0FjdGl2ZSA9IGZhbHNlO1xuXG4gICAgaXNBY3RpdmUgPSB0aGlzLmlucHV0LmtleWJvYXJkLmp1c3RQcmVzc2VkKFBoYXNlci5LZXlib2FyZC5VUCwgZHVyYXRpb24pO1xuICAgIGlzQWN0aXZlIHw9ICh0aGlzLmdhbWUuaW5wdXQuYWN0aXZlUG9pbnRlci5qdXN0UHJlc3NlZChkdXJhdGlvbiArIDEwMDAvNjApICYmXG4gICAgICAgIHRoaXMuZ2FtZS5pbnB1dC5hY3RpdmVQb2ludGVyLnggPiB0aGlzLmdhbWUud2lkdGgvNCAmJlxuICAgICAgICB0aGlzLmdhbWUuaW5wdXQuYWN0aXZlUG9pbnRlci54IDwgdGhpcy5nYW1lLndpZHRoLzIgKyB0aGlzLmdhbWUud2lkdGgvNCk7XG5cbiAgICByZXR1cm4gaXNBY3RpdmU7XG59O1xuXG5HYW1lU3RhdGUucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uIHJlbmRlcigpIHtcblxuICAgIC8vIGdhbWUuZGVidWcuYm9keUluZm8oc3ByaXRlMSwgMzIsIDMyKTtcblxuICAgIHRoaXMuZ2FtZS5kZWJ1Zy5ib2R5KHRoaXMudGFyZ2V0UG9zaXRpb24pO1xuICAgIHRoaXMuZ2FtZS5kZWJ1Zy5ib2R5KHRoaXMucGxheWVyKTtcbiAgICAvLyB0aGlzLnNjYWZmb2xkUG9vbC5mb3JFYWNoKGZ1bmN0aW9uKHNjYWZmb2xkKXt0aGlzLmdhbWUuZGVidWcuYm9keShzY2FmZm9sZCk7fSx0aGlzKTtcbn07Il19
