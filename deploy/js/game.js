(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = Player = function(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'player');

    this.MAX_SPEED = 300; // pixels/second
    this.ACCELERATION = 1500; // pixels/second/second
    this.DRAG = 1500; // pixels/second
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
    var buildTime = Phaser.Timer.SECOND * 0.5;
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
        this.targetPosition.body.reset(this.player.x - this.player.width, this.player.y + this.player.height);
        this.buildOrMove('left', this.player.walkLeft);
    }
    if (!this.player.isBusy() && this.rightInputIsActive()) {
        this.targetPosition.body.reset(this.player.x + this.player.width, this.player.y + this.player.height);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvamVmZi9Eb2N1bWVudHMvUHJvamVjdHMvQWN0aXZlX1Byb2plY3RzL2JhYmVsL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvamVmZi9Eb2N1bWVudHMvUHJvamVjdHMvQWN0aXZlX1Byb2plY3RzL2JhYmVsL3NyYy9nYW1lL2VudGl0aWVzL3BsYXllci5qcyIsIi9Vc2Vycy9qZWZmL0RvY3VtZW50cy9Qcm9qZWN0cy9BY3RpdmVfUHJvamVjdHMvYmFiZWwvc3JjL2dhbWUvbWFpbi5qcyIsIi9Vc2Vycy9qZWZmL0RvY3VtZW50cy9Qcm9qZWN0cy9BY3RpdmVfUHJvamVjdHMvYmFiZWwvc3JjL2dhbWUvc3RhdGVzL3BsYXkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gUGxheWVyID0gZnVuY3Rpb24oZ2FtZSwgeCwgeSkge1xuICAgIFBoYXNlci5TcHJpdGUuY2FsbCh0aGlzLCBnYW1lLCB4LCB5LCAncGxheWVyJyk7XG5cbiAgICB0aGlzLk1BWF9TUEVFRCA9IDMwMDsgLy8gcGl4ZWxzL3NlY29uZFxuICAgIHRoaXMuQUNDRUxFUkFUSU9OID0gMTUwMDsgLy8gcGl4ZWxzL3NlY29uZC9zZWNvbmRcbiAgICB0aGlzLkRSQUcgPSAxNTAwOyAvLyBwaXhlbHMvc2Vjb25kXG4gICAgdGhpcy5KVU1QX1NQRUVEID0gLTEwMDA7IC8vIHBpeGVscy9zZWNvbmQgKG5lZ2F0aXZlIHkgaXMgdXApXG5cbiAgICBnYW1lLnBoeXNpY3MuZW5hYmxlKHRoaXMsIFBoYXNlci5QaHlzaWNzLkFSQ0FERSk7XG4gICAgdGhpcy5ib2R5LmNvbGxpZGVXb3JsZEJvdW5kcyA9IHRydWU7XG4gICAgdGhpcy5ib2R5LmNoZWNrQ29sbGlzaW9uLnVwID0gZmFsc2U7XG4gICAgdGhpcy5ib2R5Lm1heFZlbG9jaXR5LnNldFRvKHRoaXMuTUFYX1NQRUVELCB0aGlzLk1BWF9TUEVFRCAqIDEwKTsgLy8geCwgeVxuICAgIHRoaXMuYm9keS5kcmFnLnNldFRvKHRoaXMuRFJBRywgMCk7IC8vIHgsIHlcbn07XG5cblBsYXllci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBoYXNlci5TcHJpdGUucHJvdG90eXBlKTtcblBsYXllci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBQbGF5ZXI7XG5cbi8vIHBsYXllciBtb3ZlbWVudHNcblBsYXllci5wcm90b3R5cGUud2Fsa0xlZnQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmJvZHkuYWNjZWxlcmF0aW9uLnggKz0gLXRoaXMuQUNDRUxFUkFUSU9OO1xufTtcblxuUGxheWVyLnByb3RvdHlwZS53YWxrUmlnaHQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmJvZHkuYWNjZWxlcmF0aW9uLnggKz0gdGhpcy5BQ0NFTEVSQVRJT047XG59O1xuXG5QbGF5ZXIucHJvdG90eXBlLmNsaW1iID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jbGltYmluZyA9IHRydWU7XG4gICAgdmFyIGNsaW1iVHdlZW4gPSB0aGlzLmdhbWUuYWRkLnR3ZWVuKHRoaXMuYm9keSk7XG4gICAgY2xpbWJUd2Vlbi50byh7eTogKHRoaXMuYm9keS55IC0gdGhpcy5oZWlnaHQgKiAzKX0sIDEwMDAsIFBoYXNlci5FYXNpbmcuTGluZWFyLk5vbmUsIHRydWUpO1xuICAgIGNsaW1iVHdlZW4ub25Db21wbGV0ZS5hZGQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuY2xpbWJpbmcgPSBmYWxzZTtcbiAgICB9LCB0aGlzKTtcbn07XG5cblBsYXllci5wcm90b3R5cGUuaXNCdXN5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICEhdGhpcy5jbGltYmluZyB8fCAhIXRoaXMuYnVpbGRpbmc7XG59O1xuXG5cblBsYXllci5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XG5cbn07IiwiLy8gVGhpcyBleGFtcGxlIHVzZXMgdGhlIFBoYXNlciAyLjAuNCBmcmFtZXdvcmtcblxuLy8gQ29weXJpZ2h0IMKpIDIwMTQgSm9obiBXYXRzb25cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgTUlUIExpY2Vuc2VcblxuXG52YXIgZ2FtZSA9IG5ldyBQaGFzZXIuR2FtZSg4MDAsIDUwMCwgUGhhc2VyLkFVVE8sICdnYW1lJyk7XG5HYW1lU3RhdGUgPSByZXF1aXJlKCcuL3N0YXRlcy9wbGF5Jyk7XG5nYW1lLnN0YXRlLmFkZCgnZ2FtZScsIEdhbWVTdGF0ZSwgdHJ1ZSk7XG5cbndpbmRvdy5nYW1lID0gZ2FtZTsiLCJtb2R1bGUuZXhwb3J0cyA9IEdhbWVTdGF0ZSA9IGZ1bmN0aW9uKGdhbWUpIHtcbn07XG5cbi8vIExvYWQgaW1hZ2VzIGFuZCBzb3VuZHNcbkdhbWVTdGF0ZS5wcm90b3R5cGUucHJlbG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZ2FtZS5sb2FkLmltYWdlKCdzY2FmZm9sZCcsICcvYXNzZXRzL3NjYWZmb2xkLnBuZycpO1xuICAgIHRoaXMuZ2FtZS5sb2FkLmltYWdlKCdwbGF5ZXInLCAnL2Fzc2V0cy9wbGF5ZXIucG5nJyk7XG59O1xuXG4vLyBTZXR1cCB0aGUgZXhhbXBsZVxuR2FtZVN0YXRlLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBTZXQgc3RhZ2UgYmFja2dyb3VuZCB0byBzb21ldGhpbmcgc2t5IGNvbG9yZWRcbiAgICB0aGlzLmdhbWUuc3RhZ2UuYmFja2dyb3VuZENvbG9yID0gMHg0NDg4Y2M7XG5cbiAgICB0aGlzLkdSQVZJVFkgPSAyNjAwOyAvLyBwaXhlbHMvc2Vjb25kL3NlY29uZFxuICAgIHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS5ncmF2aXR5LnkgPSB0aGlzLkdSQVZJVFk7XG5cbiAgICB2YXIgUGxheWVyID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvcGxheWVyJyk7XG4gICAgdGhpcy5wbGF5ZXIgPSBuZXcgUGxheWVyKHRoaXMuZ2FtZSwgdGhpcy5nYW1lLndpZHRoLzIsIHRoaXMuZ2FtZS5oZWlnaHQgLSA2NCk7XG4gICAgdGhpcy5nYW1lLmFkZC5leGlzdGluZyh0aGlzLnBsYXllcik7XG5cblxuICAgIC8vIGludmlzaWJsZSBoZWxwZXIgb2JqZWN0IHRvIGRldGVybWluZSBpZiBzY2FmZm9sZGluZyBleGlzdHMgaW4gdGhlIGRpcmVjdGlvbiBwcmVzc2VkXG4gICAgdGhpcy50YXJnZXRQb3NpdGlvbiA9IHRoaXMuZ2FtZS5hZGQuc3ByaXRlKHRoaXMucGxheWVyLngsIHRoaXMucGxheWVyLnkpO1xuICAgIHRoaXMuZ2FtZS5waHlzaWNzLmVuYWJsZSh0aGlzLnRhcmdldFBvc2l0aW9uLCBQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICAgIHRoaXMudGFyZ2V0UG9zaXRpb24uYm9keS5hbGxvd0dyYXZpdHkgPSBmYWxzZTtcbiAgICB0aGlzLnRhcmdldFBvc2l0aW9uLmJvZHkuc2V0U2l6ZSgxMCwgMTAsIHRoaXMudGFyZ2V0UG9zaXRpb24ud2lkdGgvMi01LCB0aGlzLnRhcmdldFBvc2l0aW9uLmhlaWdodC8yLTUpO1xuXG5cblxuICAgIHRoaXMuc2NhZmZvbGRQb29sID0gdGhpcy5nYW1lLmFkZC5ncm91cCgpO1xuXG4gICAgLy8gc3RhcnQgc2NhZmZvbGQgcG9vbCB3aXRoIDEwMCBwaWVjZXNcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgMTAwOyBpKyspIHtcbiAgICAgICAgLy8gYWRkU2NhZmZvbGRUb1Bvb2wuY2FsbCh0aGlzKTtcbiAgICAgICAgdGhpcy5hZGRTY2FmZm9sZFRvUG9vbCgpO1xuICAgIH1cblxuICAgIC8vIGxheSBzb21lIGluaXRpYWwgc2NhZmZvbGRpbmdcbiAgICBmb3IodmFyIHggPSAwOyB4IDwgdGhpcy5nYW1lLndpZHRoOyB4ICs9IDY0KSB7XG4gICAgICAgIHRoaXMuYnVpbGRTY2FmZm9sZCh4LCB0aGlzLmdhbWUuaGVpZ2h0IC0gMzIpO1xuICAgIH1cblxuXG4gICAgLy8gQ2FwdHVyZSBjZXJ0YWluIGtleXMgdG8gcHJldmVudCB0aGVpciBkZWZhdWx0IGFjdGlvbnMgaW4gdGhlIGJyb3dzZXIuXG4gICAgLy8gVGhpcyBpcyBvbmx5IG5lY2Vzc2FyeSBiZWNhdXNlIHRoaXMgaXMgYW4gSFRNTDUgZ2FtZS4gR2FtZXMgb24gb3RoZXJcbiAgICAvLyBwbGF0Zm9ybXMgbWF5IG5vdCBuZWVkIGNvZGUgbGlrZSB0aGlzLlxuICAgIHRoaXMuZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXlDYXB0dXJlKFtcbiAgICAgICAgUGhhc2VyLktleWJvYXJkLkxFRlQsXG4gICAgICAgIFBoYXNlci5LZXlib2FyZC5SSUdIVCxcbiAgICAgICAgUGhhc2VyLktleWJvYXJkLlVQLFxuICAgICAgICBQaGFzZXIuS2V5Ym9hcmQuRE9XTlxuICAgIF0pO1xuXG4gICAgLy8gSnVzdCBmb3IgZnVuLCBkcmF3IHNvbWUgaGVpZ2h0IG1hcmtlcnMgc28gd2UgY2FuIHNlZSBob3cgaGlnaCB3ZSdyZSBqdW1waW5nXG4gICAgdGhpcy5kcmF3SGVpZ2h0TWFya2VycygpO1xuXG4gICAgLy8gU2hvdyBGUFNcbiAgICB0aGlzLmdhbWUudGltZS5hZHZhbmNlZFRpbWluZyA9IHRydWU7XG4gICAgdGhpcy5mcHNUZXh0ID0gdGhpcy5nYW1lLmFkZC50ZXh0KFxuICAgICAgICAyMCwgMjAsICcnLCB7IGZvbnQ6ICcxNnB4IEFyaWFsJywgZmlsbDogJyNmZmZmZmYnIH1cbiAgICApO1xufTtcblxuR2FtZVN0YXRlLnByb3RvdHlwZS5hZGRTY2FmZm9sZFRvUG9vbCA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIHNjYWZmb2xkID0gdGhpcy5nYW1lLmFkZC5zcHJpdGUoMCwgMCwgJ3NjYWZmb2xkJyk7XG4gICAgc2NhZmZvbGQubmFtZSA9ICdzY2FmZm9sZCcrdGhpcy5zY2FmZm9sZFBvb2wubGVuZ3RoO1xuICAgIHNjYWZmb2xkLnNjYWxlLnggPSAyO1xuICAgIHRoaXMuc2NhZmZvbGRQb29sLmFkZChzY2FmZm9sZCk7XG5cbiAgICAvLyBFbmFibGUgcGh5c2ljcyBvbiB0aGUgc2NhZmZvbGRcbiAgICB0aGlzLmdhbWUucGh5c2ljcy5lbmFibGUoc2NhZmZvbGQsIFBoYXNlci5QaHlzaWNzLkFSQ0FERSk7XG4gICAgc2NhZmZvbGQuYm9keS5pbW1vdmFibGUgPSB0cnVlO1xuICAgIHNjYWZmb2xkLmJvZHkuYWxsb3dHcmF2aXR5ID0gZmFsc2U7XG5cbiAgICAvLyBTZXQgaXRzIGluaXRpYWwgc3RhdGUgdG8gXCJkZWFkXCIuXG4gICAgc2NhZmZvbGQua2lsbCgpO1xuXG4gICAgc2NhZmZvbGQuY2hlY2tXb3JsZEJvdW5kcyA9IHRydWU7XG4gICAgc2NhZmZvbGQub3V0T2ZCb3VuZHNLaWxsID0gdHJ1ZTtcblxuICAgIHJldHVybiBzY2FmZm9sZDtcbn07XG5cbkdhbWVTdGF0ZS5wcm90b3R5cGUuYnVpbGRTY2FmZm9sZCA9IGZ1bmN0aW9uICh4LCB5KSB7XG4gICAgdmFyIGJ1aWxkVGltZSA9IFBoYXNlci5UaW1lci5TRUNPTkQgKiAwLjU7XG4gICAgdGhpcy5wbGF5ZXIuYnVpbGRpbmcgPSB0cnVlO1xuICAgIC8vIEdldCBhIGRlYWQgc2NhZmZvbGQgZnJvbSB0aGUgcG9vbFxuICAgIHZhciBzY2FmZm9sZCA9IHRoaXMuc2NhZmZvbGRQb29sLmdldEZpcnN0RGVhZCgpO1xuICAgIGlmIChzY2FmZm9sZCA9PT0gbnVsbCkge1xuICAgICAgICBjb25zb2xlLmxvZyhcImluY3JlYXNpbmcgc2NhZmZvbGQgcG9vbCB0b1wiLCB0aGlzLnNjYWZmb2xkUG9vbC5sZW5ndGgpO1xuICAgICAgICBzY2FmZm9sZCA9IHRoaXMuYWRkU2NhZmZvbGRUb1Bvb2woKTtcbiAgICB9XG4gICAgc2NhZmZvbGQucmV2aXZlKCk7XG4gICAgc2NhZmZvbGQucmVzZXQoeCwgeSk7XG4gICAgc2NhZmZvbGQuYWxwaGEgPSAwO1xuICAgIC8vIGZhZGUgaW4gKHRlbXAgYW5pbWF0aW9uKVxuICAgIHRoaXMuZ2FtZS5hZGQudHdlZW4oc2NhZmZvbGQpLnRvKCB7IGFscGhhOiAxIH0sIGJ1aWxkVGltZSwgUGhhc2VyLkVhc2luZy5MaW5lYXIuTm9uZSwgdHJ1ZSk7XG5cbiAgICBmdW5jdGlvbiBzdG9wQnVpbGRpbmcoKSB7dGhpcy5wbGF5ZXIuYnVpbGRpbmcgPSBmYWxzZTt9XG4gICAgdGhpcy5nYW1lLnRpbWUuZXZlbnRzLmFkZChidWlsZFRpbWUsIHN0b3BCdWlsZGluZywgdGhpcyk7XG5cbiAgICByZXR1cm4gc2NhZmZvbGQ7XG59O1xuXG5HYW1lU3RhdGUucHJvdG90eXBlLmV4dGVuZFNjYWZmb2xkID0gZnVuY3Rpb24oYW5jaG9yU2NhZmZvbGQsIGRpcmVjdGlvbikge1xuICAgIHN3aXRjaCAoZGlyZWN0aW9uKSB7XG4gICAgICAgIGNhc2UgJ3VwJzpcbiAgICAgICAgdGhpcy5idWlsZFNjYWZmb2xkKGFuY2hvclNjYWZmb2xkLngsIGFuY2hvclNjYWZmb2xkLnkgLSBhbmNob3JTY2FmZm9sZC5oZWlnaHQqMyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdyaWdodCc6XG4gICAgICAgIHRoaXMuYnVpbGRTY2FmZm9sZChhbmNob3JTY2FmZm9sZC54ICsgYW5jaG9yU2NhZmZvbGQud2lkdGgsIGFuY2hvclNjYWZmb2xkLnkpO1xuICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbGVmdCc6XG4gICAgICAgIHRoaXMuYnVpbGRTY2FmZm9sZChhbmNob3JTY2FmZm9sZC54IC0gYW5jaG9yU2NhZmZvbGQud2lkdGgsIGFuY2hvclNjYWZmb2xkLnkpO1xuICAgICAgICBicmVhaztcbiAgICB9XG59O1xuXG5HYW1lU3RhdGUucHJvdG90eXBlLmdldFNjYWZmb2xkVW5kZXJmb290ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNjYWZmb2xkVW5kZXJGb290O1xuICAgIHRoaXMudGFyZ2V0UG9zaXRpb24uYm9keS5yZXNldCh0aGlzLnBsYXllci54LCB0aGlzLnBsYXllci55ICsgdGhpcy5wbGF5ZXIuaGVpZ2h0KTtcbiAgICBmdW5jdGlvbiBjb2xsaXNpb25IYW5kbGVyKHBsYXllciwgc2NhZmZvbGQpIHtcbiAgICAgICAgc2NhZmZvbGRVbmRlckZvb3QgPSBzY2FmZm9sZDtcbiAgICB9XG4gICAgdGhpcy5nYW1lLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAodGhpcy50YXJnZXRQb3NpdGlvbiwgdGhpcy5zY2FmZm9sZFBvb2wsIGNvbGxpc2lvbkhhbmRsZXIsIG51bGwsIHRoaXMpO1xuICAgIHJldHVybiBzY2FmZm9sZFVuZGVyRm9vdDtcbn07XG5cblxuLy8gVGhpcyBmdW5jdGlvbiBkcmF3cyBob3Jpem9udGFsIGxpbmVzIGFjcm9zcyB0aGUgc3RhZ2VcbkdhbWVTdGF0ZS5wcm90b3R5cGUuZHJhd0hlaWdodE1hcmtlcnMgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBDcmVhdGUgYSBiaXRtYXAgdGhlIHNhbWUgc2l6ZSBhcyB0aGUgc3RhZ2VcbiAgICB2YXIgYml0bWFwID0gdGhpcy5nYW1lLmFkZC5iaXRtYXBEYXRhKHRoaXMuZ2FtZS53aWR0aCwgdGhpcy5nYW1lLmhlaWdodCk7XG5cbiAgICAvLyBUaGVzZSBmdW5jdGlvbnMgdXNlIHRoZSBjYW52YXMgY29udGV4dCB0byBkcmF3IGxpbmVzIHVzaW5nIHRoZSBjYW52YXMgQVBJXG4gICAgZm9yKHkgPSB0aGlzLmdhbWUuaGVpZ2h0LTMyOyB5ID49IDY0OyB5IC09IDMyKSB7XG4gICAgICAgIGJpdG1hcC5jb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICBiaXRtYXAuY29udGV4dC5zdHJva2VTdHlsZSA9ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiknO1xuICAgICAgICBiaXRtYXAuY29udGV4dC5tb3ZlVG8oMCwgeSk7XG4gICAgICAgIGJpdG1hcC5jb250ZXh0LmxpbmVUbyh0aGlzLmdhbWUud2lkdGgsIHkpO1xuICAgICAgICBiaXRtYXAuY29udGV4dC5zdHJva2UoKTtcbiAgICB9XG5cbiAgICB0aGlzLmdhbWUuYWRkLmltYWdlKDAsIDAsIGJpdG1hcCk7XG59O1xuXG5cbi8vIFRoZSB1cGRhdGUoKSBtZXRob2QgaXMgY2FsbGVkIGV2ZXJ5IGZyYW1lXG5HYW1lU3RhdGUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmdhbWUudGltZS5mcHMgIT09IDApIHtcbiAgICAgICAgdGhpcy5mcHNUZXh0LnNldFRleHQodGhpcy5nYW1lLnRpbWUuZnBzICsgJyBGUFMnKTtcbiAgICB9XG5cbiAgICAvLyBDb2xsaWRlIHRoZSBwbGF5ZXIgd2l0aCB0aGUgc2NhZmZvbGRcbiAgICB0aGlzLmdhbWUucGh5c2ljcy5hcmNhZGUuY29sbGlkZSh0aGlzLnBsYXllciwgdGhpcy5zY2FmZm9sZFBvb2wpO1xuXG4gICAgLy8gdGFyZ2V0UG9zaXRpb24gZm9sbG93cyBwbGF5ZXJcbiAgICB0aGlzLnRhcmdldFBvc2l0aW9uLmJvZHkucmVzZXQodGhpcy5wbGF5ZXIueCwgdGhpcy5wbGF5ZXIueSk7XG5cbiAgICB0aGlzLnBsYXllci5ib2R5LmFjY2VsZXJhdGlvbi54ID0gMDtcblxuICAgIC8vIHVwZGF0ZSBpbnB1dHNcblxuICAgIGlmICghdGhpcy5wbGF5ZXIuaXNCdXN5KCkgJiYgdGhpcy5sZWZ0SW5wdXRJc0FjdGl2ZSgpKSB7XG4gICAgICAgIHRoaXMudGFyZ2V0UG9zaXRpb24uYm9keS5yZXNldCh0aGlzLnBsYXllci54IC0gdGhpcy5wbGF5ZXIud2lkdGgsIHRoaXMucGxheWVyLnkgKyB0aGlzLnBsYXllci5oZWlnaHQpO1xuICAgICAgICB0aGlzLmJ1aWxkT3JNb3ZlKCdsZWZ0JywgdGhpcy5wbGF5ZXIud2Fsa0xlZnQpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMucGxheWVyLmlzQnVzeSgpICYmIHRoaXMucmlnaHRJbnB1dElzQWN0aXZlKCkpIHtcbiAgICAgICAgdGhpcy50YXJnZXRQb3NpdGlvbi5ib2R5LnJlc2V0KHRoaXMucGxheWVyLnggKyB0aGlzLnBsYXllci53aWR0aCwgdGhpcy5wbGF5ZXIueSArIHRoaXMucGxheWVyLmhlaWdodCk7XG4gICAgICAgIHRoaXMuYnVpbGRPck1vdmUoJ3JpZ2h0JywgdGhpcy5wbGF5ZXIud2Fsa1JpZ2h0KTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMucGxheWVyLmlzQnVzeSgpICYmIHRoaXMudXBJbnB1dElzQWN0aXZlKCkpIHtcbiAgICAgICAgdGhpcy5wbGF5ZXIuYm9keS5hY2NlbGVyYXRpb24ueCA9IDA7XG4gICAgICAgIHRoaXMudGFyZ2V0UG9zaXRpb24uYm9keS5yZXNldCh0aGlzLnBsYXllci54LCB0aGlzLnBsYXllci55IC0gdGhpcy5wbGF5ZXIuaGVpZ2h0KjIpO1xuICAgICAgICB0aGlzLmJ1aWxkT3JNb3ZlKCd1cCcsIHRoaXMucGxheWVyLmNsaW1iKTtcbiAgICB9XG5cbiAgICAvLyBmb3IgZGVidWdnaW5nIGFjdGlvbnMgLy9cbiAgICBpZih0aGlzLmlucHV0LmtleWJvYXJkLmp1c3RQcmVzc2VkKFBoYXNlci5LZXlib2FyZC5ET1dOLDEpKXtcbiAgICAgICAgdGhpcy5nZXRTY2FmZm9sZFVuZGVyZm9vdCgpO1xuICAgIH1cblxufTtcblxuR2FtZVN0YXRlLnByb3RvdHlwZS5idWlsZE9yTW92ZSA9IGZ1bmN0aW9uKGRpcmVjdGlvbiwgbW92ZUZuKSB7XG4gICAgLy8gQ29sbGlkZSB0aGUgdGFyZ2V0UG9zaXRpb24gd2l0aCB0aGUgc2NhZmZvbGRcbiAgICBpZih0aGlzLmdhbWUucGh5c2ljcy5hcmNhZGUub3ZlcmxhcCh0aGlzLnRhcmdldFBvc2l0aW9uLCB0aGlzLnNjYWZmb2xkUG9vbCkpIHtcbiAgICAgICAgLy8gc2NhZmZvbGQgZXhpc3RzIHRvIG1vdmUgdG9cbiAgICAgICAgbW92ZUZuLmNhbGwodGhpcy5wbGF5ZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHN0b3AgYW5kIGJ1aWxkXG4gICAgICAgIHRoaXMucGxheWVyLmJvZHkuYWNjZWxlcmF0aW9uLnggPSAwO1xuXG4gICAgICAgIC8vIGRpcmVjdGlvbiBwYXNzZWQgaW4gYXMgJ3VwJywgJ2xlZnQnLCAncmlnaHQnXG4gICAgICAgIGFuY2hvclNjYWZmb2xkID0gdGhpcy5nZXRTY2FmZm9sZFVuZGVyZm9vdCgpO1xuICAgICAgICB0aGlzLmV4dGVuZFNjYWZmb2xkKGFuY2hvclNjYWZmb2xkLCBkaXJlY3Rpb24pO1xuXG4gICAgICAgIC8vIFRPRE8gLSBET04nVCBCVUlMRCBJRiBJVCBXSUxMIEJFIE9GRiBTQ1JFRU5cbiAgICB9XG59O1xuXG4vLyBUaGlzIGZ1bmN0aW9uIHNob3VsZCByZXR1cm4gdHJ1ZSB3aGVuIHRoZSBwbGF5ZXIgYWN0aXZhdGVzIHRoZSBcImdvIGxlZnRcIiBjb250cm9sXG4vLyBJbiB0aGlzIGNhc2UsIGVpdGhlciBob2xkaW5nIHRoZSByaWdodCBhcnJvdyBvciB0YXBwaW5nIG9yIGNsaWNraW5nIG9uIHRoZSBsZWZ0XG4vLyBzaWRlIG9mIHRoZSBzY3JlZW4uXG5HYW1lU3RhdGUucHJvdG90eXBlLmxlZnRJbnB1dElzQWN0aXZlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGlzQWN0aXZlID0gZmFsc2U7XG5cbiAgICBpc0FjdGl2ZSA9IHRoaXMuaW5wdXQua2V5Ym9hcmQuaXNEb3duKFBoYXNlci5LZXlib2FyZC5MRUZUKTtcbiAgICBpc0FjdGl2ZSB8PSAodGhpcy5nYW1lLmlucHV0LmFjdGl2ZVBvaW50ZXIuaXNEb3duICYmXG4gICAgICAgIHRoaXMuZ2FtZS5pbnB1dC5hY3RpdmVQb2ludGVyLnggPCB0aGlzLmdhbWUud2lkdGgvNCk7XG5cbiAgICByZXR1cm4gaXNBY3RpdmU7XG59O1xuXG4vLyBUaGlzIGZ1bmN0aW9uIHNob3VsZCByZXR1cm4gdHJ1ZSB3aGVuIHRoZSBwbGF5ZXIgYWN0aXZhdGVzIHRoZSBcImdvIHJpZ2h0XCIgY29udHJvbFxuLy8gSW4gdGhpcyBjYXNlLCBlaXRoZXIgaG9sZGluZyB0aGUgcmlnaHQgYXJyb3cgb3IgdGFwcGluZyBvciBjbGlja2luZyBvbiB0aGUgcmlnaHRcbi8vIHNpZGUgb2YgdGhlIHNjcmVlbi5cbkdhbWVTdGF0ZS5wcm90b3R5cGUucmlnaHRJbnB1dElzQWN0aXZlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGlzQWN0aXZlID0gZmFsc2U7XG5cbiAgICBpc0FjdGl2ZSA9IHRoaXMuaW5wdXQua2V5Ym9hcmQuaXNEb3duKFBoYXNlci5LZXlib2FyZC5SSUdIVCk7XG4gICAgaXNBY3RpdmUgfD0gKHRoaXMuZ2FtZS5pbnB1dC5hY3RpdmVQb2ludGVyLmlzRG93biAmJlxuICAgICAgICB0aGlzLmdhbWUuaW5wdXQuYWN0aXZlUG9pbnRlci54ID4gdGhpcy5nYW1lLndpZHRoLzIgKyB0aGlzLmdhbWUud2lkdGgvNCk7XG5cbiAgICByZXR1cm4gaXNBY3RpdmU7XG59O1xuXG4vLyBUaGlzIGZ1bmN0aW9uIHNob3VsZCByZXR1cm4gdHJ1ZSB3aGVuIHRoZSBwbGF5ZXIgYWN0aXZhdGVzIHRoZSBcImp1bXBcIiBjb250cm9sXG4vLyBJbiB0aGlzIGNhc2UsIGVpdGhlciBob2xkaW5nIHRoZSB1cCBhcnJvdyBvciB0YXBwaW5nIG9yIGNsaWNraW5nIG9uIHRoZSBjZW50ZXJcbi8vIHBhcnQgb2YgdGhlIHNjcmVlbi5cbkdhbWVTdGF0ZS5wcm90b3R5cGUudXBJbnB1dElzQWN0aXZlID0gZnVuY3Rpb24oZHVyYXRpb24pIHtcbiAgICB2YXIgaXNBY3RpdmUgPSBmYWxzZTtcblxuICAgIGlzQWN0aXZlID0gdGhpcy5pbnB1dC5rZXlib2FyZC5qdXN0UHJlc3NlZChQaGFzZXIuS2V5Ym9hcmQuVVAsIGR1cmF0aW9uKTtcbiAgICBpc0FjdGl2ZSB8PSAodGhpcy5nYW1lLmlucHV0LmFjdGl2ZVBvaW50ZXIuanVzdFByZXNzZWQoZHVyYXRpb24gKyAxMDAwLzYwKSAmJlxuICAgICAgICB0aGlzLmdhbWUuaW5wdXQuYWN0aXZlUG9pbnRlci54ID4gdGhpcy5nYW1lLndpZHRoLzQgJiZcbiAgICAgICAgdGhpcy5nYW1lLmlucHV0LmFjdGl2ZVBvaW50ZXIueCA8IHRoaXMuZ2FtZS53aWR0aC8yICsgdGhpcy5nYW1lLndpZHRoLzQpO1xuXG4gICAgcmV0dXJuIGlzQWN0aXZlO1xufTtcblxuR2FtZVN0YXRlLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG5cbiAgICAvLyBnYW1lLmRlYnVnLmJvZHlJbmZvKHRoaXMucGxheWVyLCAzMiwgMzIpO1xuXG4gICAgdGhpcy5nYW1lLmRlYnVnLmJvZHkodGhpcy50YXJnZXRQb3NpdGlvbik7XG4gICAgdGhpcy5nYW1lLmRlYnVnLmJvZHkodGhpcy5wbGF5ZXIpO1xuICAgIC8vIHRoaXMuc2NhZmZvbGRQb29sLmZvckVhY2goZnVuY3Rpb24oc2NhZmZvbGQpe3RoaXMuZ2FtZS5kZWJ1Zy5ib2R5KHNjYWZmb2xkKTt9LHRoaXMpO1xufTsiXX0=
