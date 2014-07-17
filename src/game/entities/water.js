Water = function(game, x, y, riseSpeed, slosh, turbulence) {
    Phaser.Sprite.call(this, game, x, y, 'water');

    this.revive();

    this.RISE_SPEED = riseSpeed || 15; // pixels/second
    this.SLOSH = slosh || 3;
    this.TURBULENCE = turbulence || 3;

    game.physics.enable(this, Phaser.Physics.ARCADE);
    this.body.velocity.y = -this.RISE_SPEED;
    this.body.allowGravity = false;
    this.scale.x = 40;
    this.scale.y = 20;
    this.alpha = 0.5;
    this.anchor.setTo(0.5, 0);
};

Water.prototype = Object.create(Phaser.Sprite.prototype);
Water.prototype.constructor = Water;


Water.prototype.update = function() {
    this.body.y += this.TURBULENCE / 10 * Math.sin(this.game.time.now/120);
    this.body.x += this.SLOSH / 2 * Math.sin(this.SLOSH * this.game.time.now/1700);
    this.angle += this.SLOSH / 60 * Math.sin(this.SLOSH * this.game.time.now / 1200);
};

module.exports = function(game, riseSpeed) {
    if (!riseSpeed)
        riseSpeed = 15;
    water = game.add.group();
    waterLayer1 = new Water(game, game.width/2, game.height, riseSpeed);
    waterLayer2 = new Water(game, game.width/2, game.height + 10, riseSpeed, 4, 5);
    waterLayer3 = new Water(game, game.width/2, game.height + 20, riseSpeed, 5, 6);
    water.add(waterLayer1);
    water.add(waterLayer2);
    water.add(waterLayer3);
    return water;
};

// TODO - add bubbles/surf/debris? on the surface of the save
// sort of like http://hakim.se/experiments/html5/wave/03/