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
        this.buildOrMove(this.player.walkLeft);
    }
    if (!this.player.isBusy() && this.rightInputIsActive()) {
        this.targetPosition.body.reset(this.player.x + this.player.width, this.player.y + this.player.height);
        this.buildOrMove(this.player.walkRight);
    }

    if (!this.player.isBusy() && this.upInputIsActive()) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvamVmZi9Eb2N1bWVudHMvUHJvamVjdHMvQWN0aXZlX1Byb2plY3RzL2JhYmVsL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvamVmZi9Eb2N1bWVudHMvUHJvamVjdHMvQWN0aXZlX1Byb2plY3RzL2JhYmVsL3NyYy9nYW1lL2VudGl0aWVzL3BsYXllci5qcyIsIi9Vc2Vycy9qZWZmL0RvY3VtZW50cy9Qcm9qZWN0cy9BY3RpdmVfUHJvamVjdHMvYmFiZWwvc3JjL2dhbWUvbWFpbi5qcyIsIi9Vc2Vycy9qZWZmL0RvY3VtZW50cy9Qcm9qZWN0cy9BY3RpdmVfUHJvamVjdHMvYmFiZWwvc3JjL2dhbWUvc3RhdGVzL3BsYXkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3Rocm93IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIil9dmFyIGY9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGYuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sZixmLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0gUGxheWVyID0gZnVuY3Rpb24oZ2FtZSwgeCwgeSkge1xuICAgIFBoYXNlci5TcHJpdGUuY2FsbCh0aGlzLCBnYW1lLCB4LCB5LCAncGxheWVyJyk7XG5cbiAgICB0aGlzLk1BWF9TUEVFRCA9IDMwMDsgLy8gcGl4ZWxzL3NlY29uZFxuICAgIHRoaXMuQUNDRUxFUkFUSU9OID0gMTUwMDsgLy8gcGl4ZWxzL3NlY29uZC9zZWNvbmRcbiAgICB0aGlzLkRSQUcgPSAxMDAwOyAvLyBwaXhlbHMvc2Vjb25kXG4gICAgdGhpcy5KVU1QX1NQRUVEID0gLTEwMDA7IC8vIHBpeGVscy9zZWNvbmQgKG5lZ2F0aXZlIHkgaXMgdXApXG5cbiAgICBnYW1lLnBoeXNpY3MuZW5hYmxlKHRoaXMsIFBoYXNlci5QaHlzaWNzLkFSQ0FERSk7XG4gICAgdGhpcy5ib2R5LmNvbGxpZGVXb3JsZEJvdW5kcyA9IHRydWU7XG4gICAgdGhpcy5ib2R5LmNoZWNrQ29sbGlzaW9uLnVwID0gZmFsc2U7XG4gICAgdGhpcy5ib2R5Lm1heFZlbG9jaXR5LnNldFRvKHRoaXMuTUFYX1NQRUVELCB0aGlzLk1BWF9TUEVFRCAqIDEwKTsgLy8geCwgeVxuICAgIHRoaXMuYm9keS5kcmFnLnNldFRvKHRoaXMuRFJBRywgMCk7IC8vIHgsIHlcbn07XG5cblBsYXllci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBoYXNlci5TcHJpdGUucHJvdG90eXBlKTtcblBsYXllci5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBQbGF5ZXI7XG5cbi8vIHBsYXllciBtb3ZlbWVudHNcblBsYXllci5wcm90b3R5cGUud2Fsa0xlZnQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmJvZHkuYWNjZWxlcmF0aW9uLnggKz0gLXRoaXMuQUNDRUxFUkFUSU9OO1xufTtcblxuUGxheWVyLnByb3RvdHlwZS53YWxrUmlnaHQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmJvZHkuYWNjZWxlcmF0aW9uLnggKz0gdGhpcy5BQ0NFTEVSQVRJT047XG59O1xuXG5QbGF5ZXIucHJvdG90eXBlLmNsaW1iID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5jbGltYmluZyA9IHRydWU7XG4gICAgdmFyIGNsaW1iVHdlZW4gPSB0aGlzLmdhbWUuYWRkLnR3ZWVuKHRoaXMuYm9keSk7XG4gICAgY2xpbWJUd2Vlbi50byh7eTogKHRoaXMuYm9keS55IC0gdGhpcy5oZWlnaHQgKiAzKX0sIDEwMDAsIFBoYXNlci5FYXNpbmcuTGluZWFyLk5vbmUsIHRydWUpO1xuICAgIGNsaW1iVHdlZW4ub25Db21wbGV0ZS5hZGQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuY2xpbWJpbmcgPSBmYWxzZTtcbiAgICB9LCB0aGlzKTtcbn07XG5cblBsYXllci5wcm90b3R5cGUuaXNCdXN5ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICEhdGhpcy5jbGltYmluZyB8fCAhIXRoaXMuYnVpbGRpbmc7XG59O1xuXG5cblBsYXllci5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XG5cbn07IiwiLy8gVGhpcyBleGFtcGxlIHVzZXMgdGhlIFBoYXNlciAyLjAuNCBmcmFtZXdvcmtcblxuLy8gQ29weXJpZ2h0IMKpIDIwMTQgSm9obiBXYXRzb25cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgTUlUIExpY2Vuc2VcblxuXG52YXIgZ2FtZSA9IG5ldyBQaGFzZXIuR2FtZSg4MDAsIDUwMCwgUGhhc2VyLkFVVE8sICdnYW1lJyk7XG5HYW1lU3RhdGUgPSByZXF1aXJlKCcuL3N0YXRlcy9wbGF5Jyk7XG5nYW1lLnN0YXRlLmFkZCgnZ2FtZScsIEdhbWVTdGF0ZSwgdHJ1ZSk7XG5cbndpbmRvdy5nYW1lID0gZ2FtZTsiLCJtb2R1bGUuZXhwb3J0cyA9IEdhbWVTdGF0ZSA9IGZ1bmN0aW9uKGdhbWUpIHtcbn07XG5cbi8vIExvYWQgaW1hZ2VzIGFuZCBzb3VuZHNcbkdhbWVTdGF0ZS5wcm90b3R5cGUucHJlbG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuZ2FtZS5sb2FkLmltYWdlKCdzY2FmZm9sZCcsICcvYXNzZXRzL3NjYWZmb2xkLnBuZycpO1xuICAgIHRoaXMuZ2FtZS5sb2FkLmltYWdlKCdwbGF5ZXInLCAnL2Fzc2V0cy9wbGF5ZXIucG5nJyk7XG59O1xuXG4vLyBTZXR1cCB0aGUgZXhhbXBsZVxuR2FtZVN0YXRlLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBTZXQgc3RhZ2UgYmFja2dyb3VuZCB0byBzb21ldGhpbmcgc2t5IGNvbG9yZWRcbiAgICB0aGlzLmdhbWUuc3RhZ2UuYmFja2dyb3VuZENvbG9yID0gMHg0NDg4Y2M7XG5cbiAgICB0aGlzLkdSQVZJVFkgPSAyNjAwOyAvLyBwaXhlbHMvc2Vjb25kL3NlY29uZFxuICAgIHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS5ncmF2aXR5LnkgPSB0aGlzLkdSQVZJVFk7XG5cbiAgICB2YXIgUGxheWVyID0gcmVxdWlyZSgnLi4vZW50aXRpZXMvcGxheWVyJyk7XG4gICAgdGhpcy5wbGF5ZXIgPSBuZXcgUGxheWVyKHRoaXMuZ2FtZSwgdGhpcy5nYW1lLndpZHRoLzIsIHRoaXMuZ2FtZS5oZWlnaHQgLSA2NCk7XG4gICAgdGhpcy5nYW1lLmFkZC5leGlzdGluZyh0aGlzLnBsYXllcik7XG5cblxuICAgIC8vIGludmlzaWJsZSBoZWxwZXIgb2JqZWN0IHRvIGRldGVybWluZSBpZiBzY2FmZm9sZGluZyBleGlzdHMgaW4gdGhlIGRpcmVjdGlvbiBwcmVzc2VkXG4gICAgdGhpcy50YXJnZXRQb3NpdGlvbiA9IHRoaXMuZ2FtZS5hZGQuc3ByaXRlKHRoaXMucGxheWVyLngsIHRoaXMucGxheWVyLnkpO1xuICAgIHRoaXMuZ2FtZS5waHlzaWNzLmVuYWJsZSh0aGlzLnRhcmdldFBvc2l0aW9uLCBQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xuICAgIHRoaXMudGFyZ2V0UG9zaXRpb24uYm9keS5hbGxvd0dyYXZpdHkgPSBmYWxzZTtcbiAgICB0aGlzLnRhcmdldFBvc2l0aW9uLmJvZHkuc2V0U2l6ZSgxMCwgMTAsIHRoaXMudGFyZ2V0UG9zaXRpb24ud2lkdGgvMi01LCB0aGlzLnRhcmdldFBvc2l0aW9uLmhlaWdodC8yLTUpO1xuXG5cblxuICAgIHRoaXMuc2NhZmZvbGRQb29sID0gdGhpcy5nYW1lLmFkZC5ncm91cCgpO1xuXG4gICAgLy8gc3RhcnQgc2NhZmZvbGQgcG9vbCB3aXRoIDEwMCBwaWVjZXNcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgMTAwOyBpKyspIHtcbiAgICAgICAgLy8gYWRkU2NhZmZvbGRUb1Bvb2wuY2FsbCh0aGlzKTtcbiAgICAgICAgdGhpcy5hZGRTY2FmZm9sZFRvUG9vbCgpO1xuICAgIH1cblxuICAgIC8vIGxheSBzb21lIGluaXRpYWwgc2NhZmZvbGRpbmdcbiAgICBmb3IodmFyIHggPSAwOyB4IDwgdGhpcy5nYW1lLndpZHRoOyB4ICs9IDMyKSB7XG4gICAgICAgIHRoaXMuYnVpbGRTY2FmZm9sZCh4LCB0aGlzLmdhbWUuaGVpZ2h0IC0gMzIpO1xuICAgIH1cblxuXG4gICAgLy8gQ2FwdHVyZSBjZXJ0YWluIGtleXMgdG8gcHJldmVudCB0aGVpciBkZWZhdWx0IGFjdGlvbnMgaW4gdGhlIGJyb3dzZXIuXG4gICAgLy8gVGhpcyBpcyBvbmx5IG5lY2Vzc2FyeSBiZWNhdXNlIHRoaXMgaXMgYW4gSFRNTDUgZ2FtZS4gR2FtZXMgb24gb3RoZXJcbiAgICAvLyBwbGF0Zm9ybXMgbWF5IG5vdCBuZWVkIGNvZGUgbGlrZSB0aGlzLlxuICAgIHRoaXMuZ2FtZS5pbnB1dC5rZXlib2FyZC5hZGRLZXlDYXB0dXJlKFtcbiAgICAgICAgUGhhc2VyLktleWJvYXJkLkxFRlQsXG4gICAgICAgIFBoYXNlci5LZXlib2FyZC5SSUdIVCxcbiAgICAgICAgUGhhc2VyLktleWJvYXJkLlVQLFxuICAgICAgICBQaGFzZXIuS2V5Ym9hcmQuRE9XTlxuICAgIF0pO1xuXG4gICAgLy8gSnVzdCBmb3IgZnVuLCBkcmF3IHNvbWUgaGVpZ2h0IG1hcmtlcnMgc28gd2UgY2FuIHNlZSBob3cgaGlnaCB3ZSdyZSBqdW1waW5nXG4gICAgdGhpcy5kcmF3SGVpZ2h0TWFya2VycygpO1xuXG4gICAgLy8gU2hvdyBGUFNcbiAgICB0aGlzLmdhbWUudGltZS5hZHZhbmNlZFRpbWluZyA9IHRydWU7XG4gICAgdGhpcy5mcHNUZXh0ID0gdGhpcy5nYW1lLmFkZC50ZXh0KFxuICAgICAgICAyMCwgMjAsICcnLCB7IGZvbnQ6ICcxNnB4IEFyaWFsJywgZmlsbDogJyNmZmZmZmYnIH1cbiAgICApO1xufTtcblxuR2FtZVN0YXRlLnByb3RvdHlwZS5hZGRTY2FmZm9sZFRvUG9vbCA9IGZ1bmN0aW9uKCl7XG4gICAgdmFyIHNjYWZmb2xkID0gdGhpcy5nYW1lLmFkZC5zcHJpdGUoMCwgMCwgJ3NjYWZmb2xkJyk7XG4gICAgdGhpcy5zY2FmZm9sZFBvb2wuYWRkKHNjYWZmb2xkKTtcblxuICAgIC8vIEVuYWJsZSBwaHlzaWNzIG9uIHRoZSBzY2FmZm9sZFxuICAgIHRoaXMuZ2FtZS5waHlzaWNzLmVuYWJsZShzY2FmZm9sZCwgUGhhc2VyLlBoeXNpY3MuQVJDQURFKTtcbiAgICBzY2FmZm9sZC5ib2R5LmltbW92YWJsZSA9IHRydWU7XG4gICAgc2NhZmZvbGQuYm9keS5hbGxvd0dyYXZpdHkgPSBmYWxzZTtcblxuICAgIC8vIFNldCBpdHMgaW5pdGlhbCBzdGF0ZSB0byBcImRlYWRcIi5cbiAgICBzY2FmZm9sZC5raWxsKCk7XG5cbiAgICBzY2FmZm9sZC5jaGVja1dvcmxkQm91bmRzID0gdHJ1ZTtcbiAgICBzY2FmZm9sZC5vdXRPZkJvdW5kc0tpbGwgPSB0cnVlO1xuXG4gICAgcmV0dXJuIHNjYWZmb2xkO1xufTtcblxuR2FtZVN0YXRlLnByb3RvdHlwZS5idWlsZFNjYWZmb2xkID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICB2YXIgYnVpbGRUaW1lID0gUGhhc2VyLlRpbWVyLlNFQ09ORCAqIDAuNTtcbiAgICB0aGlzLnBsYXllci5idWlsZGluZyA9IHRydWU7XG4gICAgLy8gR2V0IGEgZGVhZCBzY2FmZm9sZCBmcm9tIHRoZSBwb29sXG4gICAgdmFyIHNjYWZmb2xkID0gdGhpcy5zY2FmZm9sZFBvb2wuZ2V0Rmlyc3REZWFkKCk7XG4gICAgaWYgKHNjYWZmb2xkID09PSBudWxsKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiaW5jcmVhc2luZyBzY2FmZm9sZCBwb29sIHRvXCIsIHRoaXMuc2NhZmZvbGRQb29sLmxlbmd0aCk7XG4gICAgICAgIHNjYWZmb2xkID0gdGhpcy5hZGRTY2FmZm9sZFRvUG9vbCgpO1xuICAgIH1cbiAgICBzY2FmZm9sZC5yZXZpdmUoKTtcbiAgICBzY2FmZm9sZC5yZXNldCh4LCB5KTtcbiAgICBzY2FmZm9sZC5hbHBoYSA9IDA7XG4gICAgLy8gZmFkZSBpbiAodGVtcCBhbmltYXRpb24pXG4gICAgdGhpcy5nYW1lLmFkZC50d2VlbihzY2FmZm9sZCkudG8oIHsgYWxwaGE6IDEgfSwgYnVpbGRUaW1lLCBQaGFzZXIuRWFzaW5nLkxpbmVhci5Ob25lLCB0cnVlKTtcblxuICAgIGZ1bmN0aW9uIHN0b3BCdWlsZGluZygpIHt0aGlzLnBsYXllci5idWlsZGluZyA9IGZhbHNlO31cbiAgICB0aGlzLmdhbWUudGltZS5ldmVudHMuYWRkKGJ1aWxkVGltZSwgc3RvcEJ1aWxkaW5nLCB0aGlzKTtcblxuICAgIHJldHVybiBzY2FmZm9sZDtcbn07XG5cblxuLy8gVGhpcyBmdW5jdGlvbiBkcmF3cyBob3Jpem9udGFsIGxpbmVzIGFjcm9zcyB0aGUgc3RhZ2VcbkdhbWVTdGF0ZS5wcm90b3R5cGUuZHJhd0hlaWdodE1hcmtlcnMgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBDcmVhdGUgYSBiaXRtYXAgdGhlIHNhbWUgc2l6ZSBhcyB0aGUgc3RhZ2VcbiAgICB2YXIgYml0bWFwID0gdGhpcy5nYW1lLmFkZC5iaXRtYXBEYXRhKHRoaXMuZ2FtZS53aWR0aCwgdGhpcy5nYW1lLmhlaWdodCk7XG5cbiAgICAvLyBUaGVzZSBmdW5jdGlvbnMgdXNlIHRoZSBjYW52YXMgY29udGV4dCB0byBkcmF3IGxpbmVzIHVzaW5nIHRoZSBjYW52YXMgQVBJXG4gICAgZm9yKHkgPSB0aGlzLmdhbWUuaGVpZ2h0LTMyOyB5ID49IDY0OyB5IC09IDMyKSB7XG4gICAgICAgIGJpdG1hcC5jb250ZXh0LmJlZ2luUGF0aCgpO1xuICAgICAgICBiaXRtYXAuY29udGV4dC5zdHJva2VTdHlsZSA9ICdyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMiknO1xuICAgICAgICBiaXRtYXAuY29udGV4dC5tb3ZlVG8oMCwgeSk7XG4gICAgICAgIGJpdG1hcC5jb250ZXh0LmxpbmVUbyh0aGlzLmdhbWUud2lkdGgsIHkpO1xuICAgICAgICBiaXRtYXAuY29udGV4dC5zdHJva2UoKTtcbiAgICB9XG5cbiAgICB0aGlzLmdhbWUuYWRkLmltYWdlKDAsIDAsIGJpdG1hcCk7XG59O1xuXG5cbi8vIFRoZSB1cGRhdGUoKSBtZXRob2QgaXMgY2FsbGVkIGV2ZXJ5IGZyYW1lXG5HYW1lU3RhdGUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmdhbWUudGltZS5mcHMgIT09IDApIHtcbiAgICAgICAgdGhpcy5mcHNUZXh0LnNldFRleHQodGhpcy5nYW1lLnRpbWUuZnBzICsgJyBGUFMnKTtcbiAgICB9XG5cbiAgICAvLyBDb2xsaWRlIHRoZSBwbGF5ZXIgd2l0aCB0aGUgc2NhZmZvbGRcbiAgICB0aGlzLmdhbWUucGh5c2ljcy5hcmNhZGUuY29sbGlkZSh0aGlzLnBsYXllciwgdGhpcy5zY2FmZm9sZFBvb2wpO1xuXG4gICAgLy8gdGFyZ2V0UG9zaXRpb24gZm9sbG93cyBwbGF5ZXJcbiAgICB0aGlzLnRhcmdldFBvc2l0aW9uLmJvZHkucmVzZXQodGhpcy5wbGF5ZXIueCwgdGhpcy5wbGF5ZXIueSk7XG5cbiAgICB0aGlzLnBsYXllci5ib2R5LmFjY2VsZXJhdGlvbi54ID0gMDtcblxuICAgIC8vIHVwZGF0ZSBpbnB1dHNcblxuICAgIGlmICghdGhpcy5wbGF5ZXIuaXNCdXN5KCkgJiYgdGhpcy5sZWZ0SW5wdXRJc0FjdGl2ZSgpKSB7XG4gICAgICAgIHRoaXMudGFyZ2V0UG9zaXRpb24uYm9keS5yZXNldCh0aGlzLnBsYXllci54IC0gdGhpcy5wbGF5ZXIud2lkdGgsIHRoaXMucGxheWVyLnkgKyB0aGlzLnBsYXllci5oZWlnaHQpO1xuICAgICAgICB0aGlzLmJ1aWxkT3JNb3ZlKHRoaXMucGxheWVyLndhbGtMZWZ0KTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLnBsYXllci5pc0J1c3koKSAmJiB0aGlzLnJpZ2h0SW5wdXRJc0FjdGl2ZSgpKSB7XG4gICAgICAgIHRoaXMudGFyZ2V0UG9zaXRpb24uYm9keS5yZXNldCh0aGlzLnBsYXllci54ICsgdGhpcy5wbGF5ZXIud2lkdGgsIHRoaXMucGxheWVyLnkgKyB0aGlzLnBsYXllci5oZWlnaHQpO1xuICAgICAgICB0aGlzLmJ1aWxkT3JNb3ZlKHRoaXMucGxheWVyLndhbGtSaWdodCk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLnBsYXllci5pc0J1c3koKSAmJiB0aGlzLnVwSW5wdXRJc0FjdGl2ZSgpKSB7XG4gICAgICAgIHRoaXMucGxheWVyLmJvZHkuYWNjZWxlcmF0aW9uLnggPSAwO1xuICAgICAgICB0aGlzLnRhcmdldFBvc2l0aW9uLmJvZHkucmVzZXQodGhpcy5wbGF5ZXIueCwgdGhpcy5wbGF5ZXIueSAtIHRoaXMucGxheWVyLmhlaWdodCoyKTtcbiAgICAgICAgdGhpcy5idWlsZE9yTW92ZSh0aGlzLnBsYXllci5jbGltYik7XG4gICAgfVxufTtcblxuR2FtZVN0YXRlLnByb3RvdHlwZS5idWlsZE9yTW92ZSA9IGZ1bmN0aW9uKG1vdmVGbikge1xuICAgIC8vIENvbGxpZGUgdGhlIHRhcmdldFBvc2l0aW9uIHdpdGggdGhlIHNjYWZmb2xkXG4gICAgaWYodGhpcy5nYW1lLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAodGhpcy50YXJnZXRQb3NpdGlvbiwgdGhpcy5zY2FmZm9sZFBvb2wpKSB7XG4gICAgICAgIC8vIHNjYWZmb2xkIGV4aXN0cyB0byBtb3ZlIHRvXG4gICAgICAgIG1vdmVGbi5jYWxsKHRoaXMucGxheWVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBzdG9wIGFuZCBidWlsZFxuICAgICAgICB0aGlzLnBsYXllci5ib2R5LmFjY2VsZXJhdGlvbi54ID0gMDtcbiAgICAgICAgXG4gICAgICAgIC8vIFRPRE8gLSBVU0UgVEFSR0VUIFBPUyBNQVRIIFRPIEJVSUxEIFNDQUZGT0xEIElOIFJJR0hUIFBMQUNFXG4gICAgICAgIHRoaXMuYnVpbGRTY2FmZm9sZCh0aGlzLnRhcmdldFBvc2l0aW9uLmJvZHkueCwgdGhpcy50YXJnZXRQb3NpdGlvbi5ib2R5LnkpO1xuXG4gICAgICAgIC8vIFRPRE8gLSBET04nVCBCVUlMRCBJRiBJVCBXSUxMIEJFIE9GRiBTQ1JFRU5cbiAgICB9XG59O1xuXG4vLyBUaGlzIGZ1bmN0aW9uIHNob3VsZCByZXR1cm4gdHJ1ZSB3aGVuIHRoZSBwbGF5ZXIgYWN0aXZhdGVzIHRoZSBcImdvIGxlZnRcIiBjb250cm9sXG4vLyBJbiB0aGlzIGNhc2UsIGVpdGhlciBob2xkaW5nIHRoZSByaWdodCBhcnJvdyBvciB0YXBwaW5nIG9yIGNsaWNraW5nIG9uIHRoZSBsZWZ0XG4vLyBzaWRlIG9mIHRoZSBzY3JlZW4uXG5HYW1lU3RhdGUucHJvdG90eXBlLmxlZnRJbnB1dElzQWN0aXZlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGlzQWN0aXZlID0gZmFsc2U7XG5cbiAgICBpc0FjdGl2ZSA9IHRoaXMuaW5wdXQua2V5Ym9hcmQuaXNEb3duKFBoYXNlci5LZXlib2FyZC5MRUZUKTtcbiAgICBpc0FjdGl2ZSB8PSAodGhpcy5nYW1lLmlucHV0LmFjdGl2ZVBvaW50ZXIuaXNEb3duICYmXG4gICAgICAgIHRoaXMuZ2FtZS5pbnB1dC5hY3RpdmVQb2ludGVyLnggPCB0aGlzLmdhbWUud2lkdGgvNCk7XG5cbiAgICByZXR1cm4gaXNBY3RpdmU7XG59O1xuXG4vLyBUaGlzIGZ1bmN0aW9uIHNob3VsZCByZXR1cm4gdHJ1ZSB3aGVuIHRoZSBwbGF5ZXIgYWN0aXZhdGVzIHRoZSBcImdvIHJpZ2h0XCIgY29udHJvbFxuLy8gSW4gdGhpcyBjYXNlLCBlaXRoZXIgaG9sZGluZyB0aGUgcmlnaHQgYXJyb3cgb3IgdGFwcGluZyBvciBjbGlja2luZyBvbiB0aGUgcmlnaHRcbi8vIHNpZGUgb2YgdGhlIHNjcmVlbi5cbkdhbWVTdGF0ZS5wcm90b3R5cGUucmlnaHRJbnB1dElzQWN0aXZlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGlzQWN0aXZlID0gZmFsc2U7XG5cbiAgICBpc0FjdGl2ZSA9IHRoaXMuaW5wdXQua2V5Ym9hcmQuaXNEb3duKFBoYXNlci5LZXlib2FyZC5SSUdIVCk7XG4gICAgaXNBY3RpdmUgfD0gKHRoaXMuZ2FtZS5pbnB1dC5hY3RpdmVQb2ludGVyLmlzRG93biAmJlxuICAgICAgICB0aGlzLmdhbWUuaW5wdXQuYWN0aXZlUG9pbnRlci54ID4gdGhpcy5nYW1lLndpZHRoLzIgKyB0aGlzLmdhbWUud2lkdGgvNCk7XG5cbiAgICByZXR1cm4gaXNBY3RpdmU7XG59O1xuXG4vLyBUaGlzIGZ1bmN0aW9uIHNob3VsZCByZXR1cm4gdHJ1ZSB3aGVuIHRoZSBwbGF5ZXIgYWN0aXZhdGVzIHRoZSBcImp1bXBcIiBjb250cm9sXG4vLyBJbiB0aGlzIGNhc2UsIGVpdGhlciBob2xkaW5nIHRoZSB1cCBhcnJvdyBvciB0YXBwaW5nIG9yIGNsaWNraW5nIG9uIHRoZSBjZW50ZXJcbi8vIHBhcnQgb2YgdGhlIHNjcmVlbi5cbkdhbWVTdGF0ZS5wcm90b3R5cGUudXBJbnB1dElzQWN0aXZlID0gZnVuY3Rpb24oZHVyYXRpb24pIHtcbiAgICB2YXIgaXNBY3RpdmUgPSBmYWxzZTtcblxuICAgIGlzQWN0aXZlID0gdGhpcy5pbnB1dC5rZXlib2FyZC5qdXN0UHJlc3NlZChQaGFzZXIuS2V5Ym9hcmQuVVAsIGR1cmF0aW9uKTtcbiAgICBpc0FjdGl2ZSB8PSAodGhpcy5nYW1lLmlucHV0LmFjdGl2ZVBvaW50ZXIuanVzdFByZXNzZWQoZHVyYXRpb24gKyAxMDAwLzYwKSAmJlxuICAgICAgICB0aGlzLmdhbWUuaW5wdXQuYWN0aXZlUG9pbnRlci54ID4gdGhpcy5nYW1lLndpZHRoLzQgJiZcbiAgICAgICAgdGhpcy5nYW1lLmlucHV0LmFjdGl2ZVBvaW50ZXIueCA8IHRoaXMuZ2FtZS53aWR0aC8yICsgdGhpcy5nYW1lLndpZHRoLzQpO1xuXG4gICAgcmV0dXJuIGlzQWN0aXZlO1xufTtcblxuR2FtZVN0YXRlLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG5cbiAgICAvLyBnYW1lLmRlYnVnLmJvZHlJbmZvKHNwcml0ZTEsIDMyLCAzMik7XG5cbiAgICB0aGlzLmdhbWUuZGVidWcuYm9keSh0aGlzLnRhcmdldFBvc2l0aW9uKTtcbiAgICB0aGlzLmdhbWUuZGVidWcuYm9keSh0aGlzLnBsYXllcik7XG4gICAgLy8gdGhpcy5zY2FmZm9sZFBvb2wuZm9yRWFjaChmdW5jdGlvbihzY2FmZm9sZCl7dGhpcy5nYW1lLmRlYnVnLmJvZHkoc2NhZmZvbGQpO30sdGhpcyk7XG59OyJdfQ==
