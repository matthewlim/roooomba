var game = new Phaser.Game(1050, 650, Phaser.AUTO, '', { preload: preload, create: create, update: update });

function preload() {

    game.load.image('sky', 'assets/sky.png');
    game.load.image('ground', 'assets/platform.png');
    game.load.image('star', 'assets/star.png');
    
    game.load.image('roomba', 'assets/ZeldaRoomba.png');
    game.load.image('roombaShadow', 'assets/ZeldaRoomba_shadow.png');
    game.load.image('roombaShadow2', 'assets/ZeldaRoomba_shadow.png');
    game.load.image('wall', 'assets/wall.png');

    game.load.image('floor', 'assets/floor.png');
    game.load.audio('bounce', 'assets/bounce.mp3');
    game.load.audio('vac_on', 'assets/vac_on.mp3');
    game.load.audio('vac_idle', 'assets/vac_idle.mp3');
    game.load.audio('vac_accel', 'assets/vac_accel.mp3');
    game.load.audio('vac_move', 'assets/vac_move.mp3');
    game.load.image('wall_top', 'assets/wall_top.png');
    game.load.image('wall_left', 'assets/wall_left.png');
    game.load.image('wall_right', 'assets/wall_right.png');
    game.load.image('wall_bottom', 'assets/wall_bottom.png');
    game.load.image('couch', 'assets/couch.png');
    game.load.image('dirt_01', 'assets/dirt_01.png');
    game.load.image('potted_plant', 'assets/potted_plant.png');
    game.load.image('tv', 'assets/tv.png');
}

var player;
var shadowSprite;
var shadowSpriteLighter;
var platforms;
var cursors;

var dirts;
var score = 0;
var scoreText;
var idleRotation = true;
var didCollectDirt = false;
var didCollide;
var CW = 1;
var CCW = -1;
var rotationDirection = CW;
var recoilTicker = 0.0;
var RECOIL_MAX = 20.0;

// sounds
var bounceSound;
var vacuumSound;
var soundsReady = false;
var startTimer;

var vacOn;
var vacAccel;
var vacMove;
var vacIdle;

var decodedDict = [];

function create() {
    decodedDict['vac_on'] = false;
    decodedDict['vac_idle'] = false;
    //  We're going to be using physics, so enable the Arcade Physics system
    
    game.physics.startSystem(Phaser.Physics.ARCADE);

    //  A simple background for our game
    //game.add.sprite(0, 0, 'sky');

    //  The platforms group contains the ground and the 2 ledges we can jump on
    game.add.sprite(125, 125, 'floor');

    dirts = game.add.group();

    //  We will enable physics for any star that is created in this group
    dirts.enableBody = true;
    //  Here we'll create 12 of them evenly spaced apart
    for (var i = 0; i < 14; i++)
    {
        //  Create a star inside of the 'dirts' group
        var dirt = dirts.create(150 + i * 50, 150 + Math.random()*375, 'dirt_01');
	dirt.anchor.setTo(0.5,0.5);
        //  Let gravity do its thing
        //star.body.gravity.y = 300;

        //  This just gives each star a slightly random bounce value
        dirt.body.bounce.y = 0.7 + Math.random() * 0.2;
    }
    
    platforms = game.add.group();

    //  We will enable physics for any object that is created in this group
    platforms.enableBody = true;

    bounceSound = game.add.audio('bounce');
    bounceSound.onDecoded.add(onSoundDecoded, this);

    
    vacOn = game.add.audio('vac_on');
    vacOn.onDecoded.add(function() {decodedDict['vac_on'] = true; onVacSoundDecoded();}, this);
    vacOn.onStop.add(function() {vacIdle.play();}, this);
    
    
    vacIdle = game.add.audio('vac_idle');
    vacIdle.loop = true;
    vacIdle.allowMultiple = false;
    vacIdle.onDecoded.add(function(){decodedDict['vac_idle'] = true; onVacSoundDecoded();}, this);

    vacAccel = game.add.audio('vac_accel');
    vacAccel.allowMultiple = true;
    vacAccel.onDecoded.add(function(){decodedDict['vac_accel'] = true;}, this);
    vacAccel.onStop.add(function(){
	if (decodedDict['vac_move']) {
	    vacMove.play();
	} else {
	    console.log("vac move not decoded?");
	}
	didCollide = false;
    }, this);
    
    vacMove = game.add.audio('vac_move');
    vacMove.loop = true;
    vacMove.allowMultiple = false;
    vacMove.onDecoded.add(function() {decodedDict['vac_move'] = true;}, this);

    leftWall = platforms.create(0, 125, 'wall_left');
    leftWall.body.immovable = true;
    
    rightWall = platforms.create(game.world.width - 125, 125, 'wall_right');
    rightWall.body.immovable = true;

    bottomWall = platforms.create(0, game.world.height -125, 'wall_bottom');
    bottomWall.body.immovable = true;

    topWall = platforms.create(0, 0, 'wall_top');
    topWall.body.immovable = true;
    
    couch = platforms.create(200, 200, 'couch');
    couch.body.immovable = true;

    plant = platforms.create(408, 200, 'potted_plant');

    plant2 = platforms.create(558, 200, 'potted_plant');

    tv = platforms.create(200, 400, 'tv');
    
    // The player and its settings
    startX = game.world.width/2;
    startY = game.world.height/2;
    shadowSprite = game.add.sprite(startX, startY, 'roombaShadow');
    shadowSprite.anchor.setTo(0.5, 0.5);
    shadowSpriteLighter = game.add.sprite(startX, startY, 'roombaShadow2');
    shadowSpriteLighter.anchor.setTo(0.5, 0.5);
    shadowSpriteLighter.alpha = .15;
    
    player = game.add.sprite(startX, startY, 'roomba');
    player.anchor = new Phaser.Point(0.5, 0.5);
    //  We need to enable physics on the player
    game.physics.arcade.enable(player);
    //game.physics.arcade.enable(shadowSprite

    //  Player physics properties. Give the little guy a slight bounce.
    player.body.bounce.y = 0.2;
    player.body.gravity.y = 0;

    player.body.collideWorldBounds = true;

    
    
    //  Our two animations, walking left and right.
    /*player.animations.add('left', [0, 1, 2, 3], 10, true);
    player.animations.add('right', [5, 6, 7, 8], 10, true);*/

    //  Finally some dirts to collect
    

    //  The score
    //scoreText = game.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

    //  Our controls.
    cursors = game.input.keyboard.createCursorKeys();
    //game.time.events.add(Phaser.Time.SECOND * 8, playShit, this);
}

function onSoundDecoded() {
    soundsReady = true;
    console.log("Sounds ready?");
}

function onVacSoundDecoded() {
    if (decodedDict['vac_on'] && decodedDict['vac_idle']){
	vacOn.play();
    }
}

function onVacuumMoveStartComplete() {

}

function update() {

    speed = 200;
    //  Collide the player and the dirts with the platforms
    game.physics.arcade.collide(player, platforms);
    game.physics.arcade.collide(dirts, platforms);
    game.physics.arcade.collide(platforms, platforms);
    //  Checks to see if the player overlaps with any of the dirts, if he does call the collectStar function
    game.physics.arcade.overlap(player, dirts, collectStar, null, this);

    //  Reset the players velocity (movement)
    //player.body.velocity.x = 0;
    if (idleRotation) {
	shadowSpriteLighter.angle = shadowSprite.angle = player.angle = (player.angle + (rotationDirection == CW ? 2 : -2)) % 360;
	
    } else {

	player.body.velocity.y = lerp(player.body.velocity.y, Math.sin(player.rotation)*speed, 0.1);
	player.body.velocity.x = lerp(player.body.velocity.x, Math.cos(player.rotation)*speed, 0.1);
    }
    
    if (cursors.left.isDown)
    {
        if (vacIdle.isPlaying){
	    vacIdle.stop();
	}
	vacIdle.play();
	rotationDirection = CCW;
    }
    else if (cursors.right.isDown/* && !idleRotation*/)
    {
	if (vacIdle.isPlaying){
	    vacIdle.stop();
	}
	vacIdle.play();
	rotationDirection = CW;
    }
    
    if (cursors.up.isDown) {
	idleRotation = false;
	if (vacOn.isPlaying) {
	    vacOn.stop();
	}
	if (vacIdle.isPlaying){
	    vacIdle.stop();
	}
	if (!vacAccel.isPlaying && !vacMove.isPlaying) {
	    vacAccel.play();
	}
    }

    //if (!player.body.touching.none) {
    if (!player.body.touching.none && !didCollectDirt) {
	player.body.velocity.x = 0;
	player.body.velocity.y = 0;
	recoilTicker = RECOIL_MAX;
	if (soundsReady) {
	    bounceSound.play();
	}
	didCollide = true;
	if (vacAccel.isPlaying) {
	    vacAccel.stop();
	}
	if (vacMove.isPlaying) {
	    vacMove.stop();
	}
	
	if (!vacIdle.isPlaying) {
	    vacIdle.play();
	}
	//idleRotation = true;
    }
    if (didCollectDirt) {
	didCollectDirt = false;
    }
    var recoilSpeed = 20.0;
    if (recoilTicker > 0) {
	player.scale.setTo(1.0 - (recoilTicker/RECOIL_MAX)*0.1, 1.0);
	shadowSprite.scale.setTo(1.0 - (recoilTicker/RECOIL_MAX)*0.1, 1.0);
	shadowSpriteLighter.scale.setTo(1.0 - (recoilTicker/RECOIL_MAX)*0.1, 1.0);
	recoilTicker -= 1.0;
	player.body.velocity.y = lerp(-Math.sin(player.rotation)*recoilSpeed, 0.0, 0.2);
	player.body.velocity.x = lerp(-Math.cos(player.rotation)*recoilSpeed, 0.0, 0.2);
	if (recoilTicker <= 0.0) {
	    idleRotation = true;
	    player.body.velocity.setTo(0,0);
	}
    }
    
    shadowSpriteLighter.x = shadowSprite.x = player.body.x + player.offsetX;
    shadowSprite.y = player.body.y + player.offsetY + 2;
    shadowSpriteLighter.y = player.body.y + player.offsetY + 6;

    platforms.forEach(function(sprite) {
	sprite.body.velocity.x = lerp(sprite.body.velocity.x, 0, 0.1);
	sprite.body.velocity.y = lerp(sprite.body.velocity.y, 0, 0.1);
    });
}

function markerComplete(key) {
    
    console.log(key+ " complete");
    
    switch(key) {
    case 'vac_on':
	console.log('complete: '+key);
	vacIdle.play();
	break;
    }
    
}

function collectStar (player, star) {
    
    // Removes the star from the screen
    star.kill();

    //  Add and update the score
    score += 10;
    
    didCollectDirt = true;
}

function lerp(a, b, pct) {
    return (a + pct*(b - a));
}
