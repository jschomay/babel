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