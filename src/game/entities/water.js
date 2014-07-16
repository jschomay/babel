module.exports = Water = function(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'water');

    this.revive();

    this.RISE_SPEED = 15; // pixels/second

    game.physics.enable(this, Phaser.Physics.ARCADE);
    this.body.velocity.y = -this.RISE_SPEED;
    this.body.allowGravity = false;
    this.scale.x = 30;
    this.scale.y = 20;
    this.alpha = 0.7;
};

Water.prototype = Object.create(Phaser.Sprite.prototype);
Water.prototype.constructor = Water;


Water.prototype.update = function() {
};