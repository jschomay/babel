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
    var buildTime = Phaser.Timer.SECOND * 0.7;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvamVmZi9Eb2N1bWVudHMvUHJvamVjdHMvQWN0aXZlX1Byb2plY3RzL2JhYmVsL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvamVmZi9Eb2N1bWVudHMvUHJvamVjdHMvQWN0aXZlX1Byb2plY3RzL2JhYmVsL3NyYy9nYW1lL2VudGl0aWVzL3BsYXllci5qcyIsIi9Vc2Vycy9qZWZmL0RvY3VtZW50cy9Qcm9qZWN0cy9BY3RpdmVfUHJvamVjdHMvYmFiZWwvc3JjL2dhbWUvbWFpbi5qcyIsIi9Vc2Vycy9qZWZmL0RvY3VtZW50cy9Qcm9qZWN0cy9BY3RpdmVfUHJvamVjdHMvYmFiZWwvc3JjL2dhbWUvc3RhdGVzL3BsYXkuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwibW9kdWxlLmV4cG9ydHMgPSBQbGF5ZXIgPSBmdW5jdGlvbihnYW1lLCB4LCB5KSB7XG4gICAgUGhhc2VyLlNwcml0ZS5jYWxsKHRoaXMsIGdhbWUsIHgsIHksICdwbGF5ZXInKTtcblxuICAgIHRoaXMuTUFYX1NQRUVEID0gMzAwOyAvLyBwaXhlbHMvc2Vjb25kXG4gICAgdGhpcy5BQ0NFTEVSQVRJT04gPSAxNTAwOyAvLyBwaXhlbHMvc2Vjb25kL3NlY29uZFxuICAgIHRoaXMuRFJBRyA9IDE1MDA7IC8vIHBpeGVscy9zZWNvbmRcbiAgICB0aGlzLkpVTVBfU1BFRUQgPSAtMTAwMDsgLy8gcGl4ZWxzL3NlY29uZCAobmVnYXRpdmUgeSBpcyB1cClcblxuICAgIGdhbWUucGh5c2ljcy5lbmFibGUodGhpcywgUGhhc2VyLlBoeXNpY3MuQVJDQURFKTtcbiAgICB0aGlzLmJvZHkuY29sbGlkZVdvcmxkQm91bmRzID0gdHJ1ZTtcbiAgICB0aGlzLmJvZHkuY2hlY2tDb2xsaXNpb24udXAgPSBmYWxzZTtcbiAgICB0aGlzLmJvZHkubWF4VmVsb2NpdHkuc2V0VG8odGhpcy5NQVhfU1BFRUQsIHRoaXMuTUFYX1NQRUVEICogMTApOyAvLyB4LCB5XG4gICAgdGhpcy5ib2R5LmRyYWcuc2V0VG8odGhpcy5EUkFHLCAwKTsgLy8geCwgeVxufTtcblxuUGxheWVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGhhc2VyLlNwcml0ZS5wcm90b3R5cGUpO1xuUGxheWVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBsYXllcjtcblxuLy8gcGxheWVyIG1vdmVtZW50c1xuUGxheWVyLnByb3RvdHlwZS53YWxrTGVmdCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYm9keS5hY2NlbGVyYXRpb24ueCArPSAtdGhpcy5BQ0NFTEVSQVRJT047XG59O1xuXG5QbGF5ZXIucHJvdG90eXBlLndhbGtSaWdodCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuYm9keS5hY2NlbGVyYXRpb24ueCArPSB0aGlzLkFDQ0VMRVJBVElPTjtcbn07XG5cblBsYXllci5wcm90b3R5cGUuY2xpbWIgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmNsaW1iaW5nID0gdHJ1ZTtcbiAgICB2YXIgY2xpbWJUd2VlbiA9IHRoaXMuZ2FtZS5hZGQudHdlZW4odGhpcy5ib2R5KTtcbiAgICBjbGltYlR3ZWVuLnRvKHt5OiAodGhpcy5ib2R5LnkgLSB0aGlzLmhlaWdodCAqIDMpfSwgMTAwMCwgUGhhc2VyLkVhc2luZy5MaW5lYXIuTm9uZSwgdHJ1ZSk7XG4gICAgY2xpbWJUd2Vlbi5vbkNvbXBsZXRlLmFkZChmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5jbGltYmluZyA9IGZhbHNlO1xuICAgIH0sIHRoaXMpO1xufTtcblxuUGxheWVyLnByb3RvdHlwZS5pc0J1c3kgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gISF0aGlzLmNsaW1iaW5nIHx8ICEhdGhpcy5idWlsZGluZztcbn07XG5cblxuUGxheWVyLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpIHtcblxufTsiLCIvLyBUaGlzIGV4YW1wbGUgdXNlcyB0aGUgUGhhc2VyIDIuMC40IGZyYW1ld29ya1xuXG4vLyBDb3B5cmlnaHQgwqkgMjAxNCBKb2huIFdhdHNvblxuLy8gTGljZW5zZWQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBNSVQgTGljZW5zZVxuXG5cbnZhciBnYW1lID0gbmV3IFBoYXNlci5HYW1lKDgwMCwgNTAwLCBQaGFzZXIuQVVUTywgJ2dhbWUnKTtcbkdhbWVTdGF0ZSA9IHJlcXVpcmUoJy4vc3RhdGVzL3BsYXknKTtcbmdhbWUuc3RhdGUuYWRkKCdnYW1lJywgR2FtZVN0YXRlLCB0cnVlKTtcblxud2luZG93LmdhbWUgPSBnYW1lOyIsIm1vZHVsZS5leHBvcnRzID0gR2FtZVN0YXRlID0gZnVuY3Rpb24oZ2FtZSkge1xufTtcblxuLy8gTG9hZCBpbWFnZXMgYW5kIHNvdW5kc1xuR2FtZVN0YXRlLnByb3RvdHlwZS5wcmVsb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5nYW1lLmxvYWQuaW1hZ2UoJ3NjYWZmb2xkJywgJy9hc3NldHMvc2NhZmZvbGQucG5nJyk7XG4gICAgdGhpcy5nYW1lLmxvYWQuaW1hZ2UoJ3BsYXllcicsICcvYXNzZXRzL3BsYXllci5wbmcnKTtcbn07XG5cbi8vIFNldHVwIHRoZSBleGFtcGxlXG5HYW1lU3RhdGUucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIFNldCBzdGFnZSBiYWNrZ3JvdW5kIHRvIHNvbWV0aGluZyBza3kgY29sb3JlZFxuICAgIHRoaXMuZ2FtZS5zdGFnZS5iYWNrZ3JvdW5kQ29sb3IgPSAweDQ0ODhjYztcblxuICAgIHRoaXMuR1JBVklUWSA9IDI2MDA7IC8vIHBpeGVscy9zZWNvbmQvc2Vjb25kXG4gICAgdGhpcy5nYW1lLnBoeXNpY3MuYXJjYWRlLmdyYXZpdHkueSA9IHRoaXMuR1JBVklUWTtcblxuICAgIHZhciBQbGF5ZXIgPSByZXF1aXJlKCcuLi9lbnRpdGllcy9wbGF5ZXInKTtcbiAgICB0aGlzLnBsYXllciA9IG5ldyBQbGF5ZXIodGhpcy5nYW1lLCB0aGlzLmdhbWUud2lkdGgvMiwgdGhpcy5nYW1lLmhlaWdodCAtIDY0KTtcbiAgICB0aGlzLmdhbWUuYWRkLmV4aXN0aW5nKHRoaXMucGxheWVyKTtcblxuXG4gICAgLy8gaW52aXNpYmxlIGhlbHBlciBvYmplY3QgdG8gZGV0ZXJtaW5lIGlmIHNjYWZmb2xkaW5nIGV4aXN0cyBpbiB0aGUgZGlyZWN0aW9uIHByZXNzZWRcbiAgICB0aGlzLnRhcmdldFBvc2l0aW9uID0gdGhpcy5nYW1lLmFkZC5zcHJpdGUodGhpcy5wbGF5ZXIueCwgdGhpcy5wbGF5ZXIueSk7XG4gICAgdGhpcy5nYW1lLnBoeXNpY3MuZW5hYmxlKHRoaXMudGFyZ2V0UG9zaXRpb24sIFBoYXNlci5QaHlzaWNzLkFSQ0FERSk7XG4gICAgdGhpcy50YXJnZXRQb3NpdGlvbi5ib2R5LmFsbG93R3Jhdml0eSA9IGZhbHNlO1xuICAgIHRoaXMudGFyZ2V0UG9zaXRpb24uYm9keS5zZXRTaXplKDEwLCAxMCwgdGhpcy50YXJnZXRQb3NpdGlvbi53aWR0aC8yLTUsIHRoaXMudGFyZ2V0UG9zaXRpb24uaGVpZ2h0LzItNSk7XG5cblxuXG4gICAgdGhpcy5zY2FmZm9sZFBvb2wgPSB0aGlzLmdhbWUuYWRkLmdyb3VwKCk7XG5cbiAgICAvLyBzdGFydCBzY2FmZm9sZCBwb29sIHdpdGggMTAwIHBpZWNlc1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCAxMDA7IGkrKykge1xuICAgICAgICAvLyBhZGRTY2FmZm9sZFRvUG9vbC5jYWxsKHRoaXMpO1xuICAgICAgICB0aGlzLmFkZFNjYWZmb2xkVG9Qb29sKCk7XG4gICAgfVxuXG4gICAgLy8gbGF5IHNvbWUgaW5pdGlhbCBzY2FmZm9sZGluZ1xuICAgIGZvcih2YXIgeCA9IDA7IHggPCB0aGlzLmdhbWUud2lkdGg7IHggKz0gNjQpIHtcbiAgICAgICAgdGhpcy5idWlsZFNjYWZmb2xkKHgsIHRoaXMuZ2FtZS5oZWlnaHQgLSAzMik7XG4gICAgfVxuXG5cbiAgICAvLyBDYXB0dXJlIGNlcnRhaW4ga2V5cyB0byBwcmV2ZW50IHRoZWlyIGRlZmF1bHQgYWN0aW9ucyBpbiB0aGUgYnJvd3Nlci5cbiAgICAvLyBUaGlzIGlzIG9ubHkgbmVjZXNzYXJ5IGJlY2F1c2UgdGhpcyBpcyBhbiBIVE1MNSBnYW1lLiBHYW1lcyBvbiBvdGhlclxuICAgIC8vIHBsYXRmb3JtcyBtYXkgbm90IG5lZWQgY29kZSBsaWtlIHRoaXMuXG4gICAgdGhpcy5nYW1lLmlucHV0LmtleWJvYXJkLmFkZEtleUNhcHR1cmUoW1xuICAgICAgICBQaGFzZXIuS2V5Ym9hcmQuTEVGVCxcbiAgICAgICAgUGhhc2VyLktleWJvYXJkLlJJR0hULFxuICAgICAgICBQaGFzZXIuS2V5Ym9hcmQuVVAsXG4gICAgICAgIFBoYXNlci5LZXlib2FyZC5ET1dOXG4gICAgXSk7XG5cbiAgICAvLyBKdXN0IGZvciBmdW4sIGRyYXcgc29tZSBoZWlnaHQgbWFya2VycyBzbyB3ZSBjYW4gc2VlIGhvdyBoaWdoIHdlJ3JlIGp1bXBpbmdcbiAgICB0aGlzLmRyYXdIZWlnaHRNYXJrZXJzKCk7XG5cbiAgICAvLyBTaG93IEZQU1xuICAgIHRoaXMuZ2FtZS50aW1lLmFkdmFuY2VkVGltaW5nID0gdHJ1ZTtcbiAgICB0aGlzLmZwc1RleHQgPSB0aGlzLmdhbWUuYWRkLnRleHQoXG4gICAgICAgIDIwLCAyMCwgJycsIHsgZm9udDogJzE2cHggQXJpYWwnLCBmaWxsOiAnI2ZmZmZmZicgfVxuICAgICk7XG59O1xuXG5HYW1lU3RhdGUucHJvdG90eXBlLmFkZFNjYWZmb2xkVG9Qb29sID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgc2NhZmZvbGQgPSB0aGlzLmdhbWUuYWRkLnNwcml0ZSgwLCAwLCAnc2NhZmZvbGQnKTtcbiAgICBzY2FmZm9sZC5uYW1lID0gJ3NjYWZmb2xkJyt0aGlzLnNjYWZmb2xkUG9vbC5sZW5ndGg7XG4gICAgc2NhZmZvbGQuc2NhbGUueCA9IDI7XG4gICAgdGhpcy5zY2FmZm9sZFBvb2wuYWRkKHNjYWZmb2xkKTtcblxuICAgIC8vIEVuYWJsZSBwaHlzaWNzIG9uIHRoZSBzY2FmZm9sZFxuICAgIHRoaXMuZ2FtZS5waHlzaWNzLmVuYWJsZShzY2FmZm9sZCwgUGhhc2VyLlBoeXNpY3MuQVJDQURFKTtcbiAgICBzY2FmZm9sZC5ib2R5LmltbW92YWJsZSA9IHRydWU7XG4gICAgc2NhZmZvbGQuYm9keS5hbGxvd0dyYXZpdHkgPSBmYWxzZTtcblxuICAgIC8vIFNldCBpdHMgaW5pdGlhbCBzdGF0ZSB0byBcImRlYWRcIi5cbiAgICBzY2FmZm9sZC5raWxsKCk7XG5cbiAgICBzY2FmZm9sZC5jaGVja1dvcmxkQm91bmRzID0gdHJ1ZTtcbiAgICBzY2FmZm9sZC5vdXRPZkJvdW5kc0tpbGwgPSB0cnVlO1xuXG4gICAgcmV0dXJuIHNjYWZmb2xkO1xufTtcblxuR2FtZVN0YXRlLnByb3RvdHlwZS5idWlsZFNjYWZmb2xkID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICB2YXIgYnVpbGRUaW1lID0gUGhhc2VyLlRpbWVyLlNFQ09ORCAqIDAuNztcbiAgICB0aGlzLnBsYXllci5idWlsZGluZyA9IHRydWU7XG4gICAgLy8gR2V0IGEgZGVhZCBzY2FmZm9sZCBmcm9tIHRoZSBwb29sXG4gICAgdmFyIHNjYWZmb2xkID0gdGhpcy5zY2FmZm9sZFBvb2wuZ2V0Rmlyc3REZWFkKCk7XG4gICAgaWYgKHNjYWZmb2xkID09PSBudWxsKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiaW5jcmVhc2luZyBzY2FmZm9sZCBwb29sIHRvXCIsIHRoaXMuc2NhZmZvbGRQb29sLmxlbmd0aCk7XG4gICAgICAgIHNjYWZmb2xkID0gdGhpcy5hZGRTY2FmZm9sZFRvUG9vbCgpO1xuICAgIH1cbiAgICBzY2FmZm9sZC5yZXZpdmUoKTtcbiAgICBzY2FmZm9sZC5yZXNldCh4LCB5KTtcbiAgICBzY2FmZm9sZC5hbHBoYSA9IDA7XG4gICAgLy8gZmFkZSBpbiAodGVtcCBhbmltYXRpb24pXG4gICAgdGhpcy5nYW1lLmFkZC50d2VlbihzY2FmZm9sZCkudG8oIHsgYWxwaGE6IDEgfSwgYnVpbGRUaW1lLCBQaGFzZXIuRWFzaW5nLkxpbmVhci5Ob25lLCB0cnVlKTtcblxuICAgIGZ1bmN0aW9uIHN0b3BCdWlsZGluZygpIHt0aGlzLnBsYXllci5idWlsZGluZyA9IGZhbHNlO31cbiAgICB0aGlzLmdhbWUudGltZS5ldmVudHMuYWRkKGJ1aWxkVGltZSwgc3RvcEJ1aWxkaW5nLCB0aGlzKTtcblxuICAgIHJldHVybiBzY2FmZm9sZDtcbn07XG5cbkdhbWVTdGF0ZS5wcm90b3R5cGUuZXh0ZW5kU2NhZmZvbGQgPSBmdW5jdGlvbihhbmNob3JTY2FmZm9sZCwgZGlyZWN0aW9uKSB7XG4gICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcbiAgICAgICAgY2FzZSAndXAnOlxuICAgICAgICB0aGlzLmJ1aWxkU2NhZmZvbGQoYW5jaG9yU2NhZmZvbGQueCwgYW5jaG9yU2NhZmZvbGQueSAtIGFuY2hvclNjYWZmb2xkLmhlaWdodCozKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3JpZ2h0JzpcbiAgICAgICAgdGhpcy5idWlsZFNjYWZmb2xkKGFuY2hvclNjYWZmb2xkLnggKyBhbmNob3JTY2FmZm9sZC53aWR0aCwgYW5jaG9yU2NhZmZvbGQueSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdsZWZ0JzpcbiAgICAgICAgdGhpcy5idWlsZFNjYWZmb2xkKGFuY2hvclNjYWZmb2xkLnggLSBhbmNob3JTY2FmZm9sZC53aWR0aCwgYW5jaG9yU2NhZmZvbGQueSk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbn07XG5cbkdhbWVTdGF0ZS5wcm90b3R5cGUuZ2V0U2NhZmZvbGRVbmRlcmZvb3QgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2NhZmZvbGRVbmRlckZvb3Q7XG4gICAgdGhpcy50YXJnZXRQb3NpdGlvbi5ib2R5LnJlc2V0KHRoaXMucGxheWVyLngsIHRoaXMucGxheWVyLnkgKyB0aGlzLnBsYXllci5oZWlnaHQpO1xuICAgIGZ1bmN0aW9uIGNvbGxpc2lvbkhhbmRsZXIocGxheWVyLCBzY2FmZm9sZCkge1xuICAgICAgICBzY2FmZm9sZFVuZGVyRm9vdCA9IHNjYWZmb2xkO1xuICAgIH1cbiAgICB0aGlzLmdhbWUucGh5c2ljcy5hcmNhZGUub3ZlcmxhcCh0aGlzLnRhcmdldFBvc2l0aW9uLCB0aGlzLnNjYWZmb2xkUG9vbCwgY29sbGlzaW9uSGFuZGxlciwgbnVsbCwgdGhpcyk7XG4gICAgcmV0dXJuIHNjYWZmb2xkVW5kZXJGb290O1xufTtcblxuXG4vLyBUaGlzIGZ1bmN0aW9uIGRyYXdzIGhvcml6b250YWwgbGluZXMgYWNyb3NzIHRoZSBzdGFnZVxuR2FtZVN0YXRlLnByb3RvdHlwZS5kcmF3SGVpZ2h0TWFya2VycyA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIENyZWF0ZSBhIGJpdG1hcCB0aGUgc2FtZSBzaXplIGFzIHRoZSBzdGFnZVxuICAgIHZhciBiaXRtYXAgPSB0aGlzLmdhbWUuYWRkLmJpdG1hcERhdGEodGhpcy5nYW1lLndpZHRoLCB0aGlzLmdhbWUuaGVpZ2h0KTtcblxuICAgIC8vIFRoZXNlIGZ1bmN0aW9ucyB1c2UgdGhlIGNhbnZhcyBjb250ZXh0IHRvIGRyYXcgbGluZXMgdXNpbmcgdGhlIGNhbnZhcyBBUElcbiAgICBmb3IoeSA9IHRoaXMuZ2FtZS5oZWlnaHQtMzI7IHkgPj0gNjQ7IHkgLT0gMzIpIHtcbiAgICAgICAgYml0bWFwLmNvbnRleHQuYmVnaW5QYXRoKCk7XG4gICAgICAgIGJpdG1hcC5jb250ZXh0LnN0cm9rZVN0eWxlID0gJ3JnYmEoMjU1LCAyNTUsIDI1NSwgMC4yKSc7XG4gICAgICAgIGJpdG1hcC5jb250ZXh0Lm1vdmVUbygwLCB5KTtcbiAgICAgICAgYml0bWFwLmNvbnRleHQubGluZVRvKHRoaXMuZ2FtZS53aWR0aCwgeSk7XG4gICAgICAgIGJpdG1hcC5jb250ZXh0LnN0cm9rZSgpO1xuICAgIH1cblxuICAgIHRoaXMuZ2FtZS5hZGQuaW1hZ2UoMCwgMCwgYml0bWFwKTtcbn07XG5cblxuLy8gVGhlIHVwZGF0ZSgpIG1ldGhvZCBpcyBjYWxsZWQgZXZlcnkgZnJhbWVcbkdhbWVTdGF0ZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuZ2FtZS50aW1lLmZwcyAhPT0gMCkge1xuICAgICAgICB0aGlzLmZwc1RleHQuc2V0VGV4dCh0aGlzLmdhbWUudGltZS5mcHMgKyAnIEZQUycpO1xuICAgIH1cblxuICAgIC8vIENvbGxpZGUgdGhlIHBsYXllciB3aXRoIHRoZSBzY2FmZm9sZFxuICAgIHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS5jb2xsaWRlKHRoaXMucGxheWVyLCB0aGlzLnNjYWZmb2xkUG9vbCk7XG5cbiAgICAvLyB0YXJnZXRQb3NpdGlvbiBmb2xsb3dzIHBsYXllclxuICAgIHRoaXMudGFyZ2V0UG9zaXRpb24uYm9keS5yZXNldCh0aGlzLnBsYXllci54LCB0aGlzLnBsYXllci55KTtcblxuICAgIHRoaXMucGxheWVyLmJvZHkuYWNjZWxlcmF0aW9uLnggPSAwO1xuXG4gICAgLy8gdXBkYXRlIGlucHV0c1xuXG4gICAgaWYgKCF0aGlzLnBsYXllci5pc0J1c3koKSAmJiB0aGlzLmxlZnRJbnB1dElzQWN0aXZlKCkpIHtcbiAgICAgICAgdGhpcy50YXJnZXRQb3NpdGlvbi5ib2R5LnJlc2V0KHRoaXMucGxheWVyLnggLSB0aGlzLnNjYWZmb2xkUG9vbC5nZXRBdCgwKS53aWR0aCwgdGhpcy5wbGF5ZXIueSArIHRoaXMucGxheWVyLmhlaWdodCk7XG4gICAgICAgIHRoaXMuYnVpbGRPck1vdmUoJ2xlZnQnLCB0aGlzLnBsYXllci53YWxrTGVmdCk7XG4gICAgfVxuICAgIGlmICghdGhpcy5wbGF5ZXIuaXNCdXN5KCkgJiYgdGhpcy5yaWdodElucHV0SXNBY3RpdmUoKSkge1xuICAgICAgICB0aGlzLnRhcmdldFBvc2l0aW9uLmJvZHkucmVzZXQodGhpcy5wbGF5ZXIueCArIHRoaXMuc2NhZmZvbGRQb29sLmdldEF0KDApLndpZHRoLCB0aGlzLnBsYXllci55ICsgdGhpcy5wbGF5ZXIuaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5idWlsZE9yTW92ZSgncmlnaHQnLCB0aGlzLnBsYXllci53YWxrUmlnaHQpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5wbGF5ZXIuaXNCdXN5KCkgJiYgdGhpcy51cElucHV0SXNBY3RpdmUoKSkge1xuICAgICAgICB0aGlzLnBsYXllci5ib2R5LmFjY2VsZXJhdGlvbi54ID0gMDtcbiAgICAgICAgdGhpcy50YXJnZXRQb3NpdGlvbi5ib2R5LnJlc2V0KHRoaXMucGxheWVyLngsIHRoaXMucGxheWVyLnkgLSB0aGlzLnBsYXllci5oZWlnaHQqMik7XG4gICAgICAgIHRoaXMuYnVpbGRPck1vdmUoJ3VwJywgdGhpcy5wbGF5ZXIuY2xpbWIpO1xuICAgIH1cblxuICAgIC8vIGZvciBkZWJ1Z2dpbmcgYWN0aW9ucyAvL1xuICAgIGlmKHRoaXMuaW5wdXQua2V5Ym9hcmQuanVzdFByZXNzZWQoUGhhc2VyLktleWJvYXJkLkRPV04sMSkpe1xuICAgICAgICB0aGlzLmdldFNjYWZmb2xkVW5kZXJmb290KCk7XG4gICAgfVxuXG59O1xuXG5HYW1lU3RhdGUucHJvdG90eXBlLmJ1aWxkT3JNb3ZlID0gZnVuY3Rpb24oZGlyZWN0aW9uLCBtb3ZlRm4pIHtcbiAgICAvLyBDb2xsaWRlIHRoZSB0YXJnZXRQb3NpdGlvbiB3aXRoIHRoZSBzY2FmZm9sZFxuICAgIGlmKHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS5vdmVybGFwKHRoaXMudGFyZ2V0UG9zaXRpb24sIHRoaXMuc2NhZmZvbGRQb29sKSkge1xuICAgICAgICAvLyBzY2FmZm9sZCBleGlzdHMgdG8gbW92ZSB0b1xuICAgICAgICAvLyBUT0RPIC0gb25seSBjbGltYiBpZiB1cCBpcyBoZWxkIGZvciAuNSBzZWNcbiAgICAgICAgbW92ZUZuLmNhbGwodGhpcy5wbGF5ZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHN0b3AgYW5kIGJ1aWxkXG4gICAgICAgIHRoaXMucGxheWVyLmJvZHkuYWNjZWxlcmF0aW9uLnggPSAwO1xuXG4gICAgICAgIC8vIGRpcmVjdGlvbiBwYXNzZWQgaW4gYXMgJ3VwJywgJ2xlZnQnLCAncmlnaHQnXG4gICAgICAgIGFuY2hvclNjYWZmb2xkID0gdGhpcy5nZXRTY2FmZm9sZFVuZGVyZm9vdCgpO1xuICAgICAgICB0aGlzLmV4dGVuZFNjYWZmb2xkKGFuY2hvclNjYWZmb2xkLCBkaXJlY3Rpb24pO1xuXG4gICAgICAgIC8vIFRPRE8gLSBET04nVCBCVUlMRCBJRiBJVCBXSUxMIEJFIE9GRiBTQ1JFRU5cbiAgICB9XG59O1xuXG4vLyBUaGlzIGZ1bmN0aW9uIHNob3VsZCByZXR1cm4gdHJ1ZSB3aGVuIHRoZSBwbGF5ZXIgYWN0aXZhdGVzIHRoZSBcImdvIGxlZnRcIiBjb250cm9sXG4vLyBJbiB0aGlzIGNhc2UsIGVpdGhlciBob2xkaW5nIHRoZSByaWdodCBhcnJvdyBvciB0YXBwaW5nIG9yIGNsaWNraW5nIG9uIHRoZSBsZWZ0XG4vLyBzaWRlIG9mIHRoZSBzY3JlZW4uXG5HYW1lU3RhdGUucHJvdG90eXBlLmxlZnRJbnB1dElzQWN0aXZlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGlzQWN0aXZlID0gZmFsc2U7XG5cbiAgICBpc0FjdGl2ZSA9IHRoaXMuaW5wdXQua2V5Ym9hcmQuaXNEb3duKFBoYXNlci5LZXlib2FyZC5MRUZUKTtcbiAgICBpc0FjdGl2ZSB8PSAodGhpcy5nYW1lLmlucHV0LmFjdGl2ZVBvaW50ZXIuaXNEb3duICYmXG4gICAgICAgIHRoaXMuZ2FtZS5pbnB1dC5hY3RpdmVQb2ludGVyLnggPCB0aGlzLmdhbWUud2lkdGgvNCk7XG5cbiAgICByZXR1cm4gaXNBY3RpdmU7XG59O1xuXG4vLyBUaGlzIGZ1bmN0aW9uIHNob3VsZCByZXR1cm4gdHJ1ZSB3aGVuIHRoZSBwbGF5ZXIgYWN0aXZhdGVzIHRoZSBcImdvIHJpZ2h0XCIgY29udHJvbFxuLy8gSW4gdGhpcyBjYXNlLCBlaXRoZXIgaG9sZGluZyB0aGUgcmlnaHQgYXJyb3cgb3IgdGFwcGluZyBvciBjbGlja2luZyBvbiB0aGUgcmlnaHRcbi8vIHNpZGUgb2YgdGhlIHNjcmVlbi5cbkdhbWVTdGF0ZS5wcm90b3R5cGUucmlnaHRJbnB1dElzQWN0aXZlID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGlzQWN0aXZlID0gZmFsc2U7XG5cbiAgICBpc0FjdGl2ZSA9IHRoaXMuaW5wdXQua2V5Ym9hcmQuaXNEb3duKFBoYXNlci5LZXlib2FyZC5SSUdIVCk7XG4gICAgaXNBY3RpdmUgfD0gKHRoaXMuZ2FtZS5pbnB1dC5hY3RpdmVQb2ludGVyLmlzRG93biAmJlxuICAgICAgICB0aGlzLmdhbWUuaW5wdXQuYWN0aXZlUG9pbnRlci54ID4gdGhpcy5nYW1lLndpZHRoLzIgKyB0aGlzLmdhbWUud2lkdGgvNCk7XG5cbiAgICByZXR1cm4gaXNBY3RpdmU7XG59O1xuXG4vLyBUaGlzIGZ1bmN0aW9uIHNob3VsZCByZXR1cm4gdHJ1ZSB3aGVuIHRoZSBwbGF5ZXIgYWN0aXZhdGVzIHRoZSBcImp1bXBcIiBjb250cm9sXG4vLyBJbiB0aGlzIGNhc2UsIGVpdGhlciBob2xkaW5nIHRoZSB1cCBhcnJvdyBvciB0YXBwaW5nIG9yIGNsaWNraW5nIG9uIHRoZSBjZW50ZXJcbi8vIHBhcnQgb2YgdGhlIHNjcmVlbi5cbkdhbWVTdGF0ZS5wcm90b3R5cGUudXBJbnB1dElzQWN0aXZlID0gZnVuY3Rpb24oZHVyYXRpb24pIHtcbiAgICB2YXIgaXNBY3RpdmUgPSBmYWxzZTtcblxuICAgIGlzQWN0aXZlID0gdGhpcy5pbnB1dC5rZXlib2FyZC5qdXN0UHJlc3NlZChQaGFzZXIuS2V5Ym9hcmQuVVAsIGR1cmF0aW9uKTtcbiAgICBpc0FjdGl2ZSB8PSAodGhpcy5nYW1lLmlucHV0LmFjdGl2ZVBvaW50ZXIuanVzdFByZXNzZWQoZHVyYXRpb24gKyAxMDAwLzYwKSAmJlxuICAgICAgICB0aGlzLmdhbWUuaW5wdXQuYWN0aXZlUG9pbnRlci54ID4gdGhpcy5nYW1lLndpZHRoLzQgJiZcbiAgICAgICAgdGhpcy5nYW1lLmlucHV0LmFjdGl2ZVBvaW50ZXIueCA8IHRoaXMuZ2FtZS53aWR0aC8yICsgdGhpcy5nYW1lLndpZHRoLzQpO1xuXG4gICAgcmV0dXJuIGlzQWN0aXZlO1xufTtcblxuR2FtZVN0YXRlLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiByZW5kZXIoKSB7XG5cbiAgICAvLyBnYW1lLmRlYnVnLmJvZHlJbmZvKHRoaXMucGxheWVyLCAzMiwgMzIpO1xuXG4gICAgdGhpcy5nYW1lLmRlYnVnLmJvZHkodGhpcy50YXJnZXRQb3NpdGlvbik7XG4gICAgdGhpcy5nYW1lLmRlYnVnLmJvZHkodGhpcy5wbGF5ZXIpO1xuICAgIC8vIHRoaXMuc2NhZmZvbGRQb29sLmZvckVhY2goZnVuY3Rpb24oc2NhZmZvbGQpe3RoaXMuZ2FtZS5kZWJ1Zy5ib2R5KHNjYWZmb2xkKTt9LHRoaXMpO1xufTsiXX0=
