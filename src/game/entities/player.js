module.exports = Player = function(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'player');

    this.revive();

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
    if (!this.alive) return;
    this.body.acceleration.x += -this.ACCELERATION;
};

Player.prototype.walkRight = function() {
    if (!this.alive) return;
    this.body.acceleration.x += this.ACCELERATION;
};

Player.prototype.climb = function(gameState) {
    if (!this.alive) return;
    var climbTime = 1000;
    var climbSpeed = gameState.getScaffoldHeight()*1000/climbTime;
    this.climbing = true;
    this.body.allowGravity = false;
    this.body.velocity.y -= climbSpeed*1.1;
    this.game.world.setAllChildren('body.velocity.y', climbSpeed, true, true, 1, false);

    stopClimbing = function() {
        this.climbing = false;
        this.body.velocity.y = 0;
        this.body.allowGravity = true;
        this.game.world.setAllChildren('body.velocity.y', climbSpeed, true, true, 2, false);
    };

    this.game.time.events.add(climbTime, stopClimbing, this);
};

Player.prototype.drown = function() {
    this.alive = false;
    // todo - this probably isn't quite right to disable collisions, but enable=false isn't working?
    this.body.immovable = true;
    this.body.allowGravity = false;
    this.body.collideWorldBounds = false;
    this.body.outOfBoundsKill = true;
    this.body.acceleration.y = 11;
    this.body.acceleration.x = 8;
    this.body.maxVelocity.setTo(20,30);
    // this.game.add.tween(this).to( { y: this.game.height, x: this.body.x+20 }, 2000, Phaser.Easing.Linear.None, true);
};

Player.prototype.isBusy = function() {
    return !!this.climbing || !!this.building;
};


Player.prototype.update = function() {

};