module.exports = Water = function(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'water');

    this.revive();

    this.RISE_SPEED = 15; // pixels/second
    this.SLOSH = 3;
    this.TURBULENCE = 3;

    game.physics.enable(this, Phaser.Physics.ARCADE);
    this.body.velocity.y = -this.RISE_SPEED;
    this.body.allowGravity = false;
    this.scale.x = 40;
    this.scale.y = 20;
    this.alpha = 0.7;
    this.anchor.setTo(0.5, 0);
};

Water.prototype = Object.create(Phaser.Sprite.prototype);
Water.prototype.constructor = Water;


Water.prototype.update = function() {
    this.body.y += this.TURBULENCE / 10 * Math.sin(this.game.time.now/120);
    this.body.x += this.SLOSH / 2 * Math.cos(this.SLOSH * this.game.time.now/1000);
    this.angle += this.SLOSH / 60 * Math.sin(this.SLOSH * this.game.time.now / 1200);
};