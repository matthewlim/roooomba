var game = new Phaser.Game(1050, 650, Phaser.AUTO, '', { preload: preload, create: create, update: update });

function preload() {

    
    game.load.image('roomba', 'assets/ZeldaRoomba.png');
    game.load.image('roombaShadow', 'assets/ZeldaRoomba_shadow.png');
    game.load.image('roombaShadow2', 'assets/ZeldaRoomba_shadow.png');
    game.load.image('speck', 'assets/speck.png');
    
    game.load.image('floor', 'assets/floor.png');
    game.load.audio('bounce', 'assets/bounce.mp3');
    game.load.audio('vac_on', 'assets/vac_on.mp3');
    game.load.audio('vac_idle', 'assets/vac_idle.mp3');
    game.load.audio('vac_accel', 'assets/vac_accel.mp3');
    game.load.audio('vac_move', 'assets/vac_move.mp3');
    game.load.image('wall_top', 'assets/wall_top.png');
    game.load.image('wall_left', 'assets/wall_left.png');
    game.load.image('wall_right_door', 'assets/wall_right_door.png');
    game.load.image('wall_bottom', 'assets/wall_bottom.png');
    game.load.image('couch', 'assets/couch.png');
    game.load.image('couch_shadow', 'assets/couch_shadow.png');
    game.load.image('dirt_01', 'assets/dirt_01.png');
    game.load.image('potted_plant', 'assets/potted_plant.png');
    game.load.image('potted_plant_shadow', 'assets/potted_plant_shadow.png');
    game.load.image('coffee_table', 'assets/coffee_table.png');
    game.load.image('coffee_table_shadow', 'assets/coffee_table_shadow.png');
    game.load.image('side_table', 'assets/side_table.png');
    game.load.image('side_table_shadow', 'assets/side_table_shadow.png');
    game.load.image('rug', 'assets/rug.png');
    game.load.image('dock', 'assets/dock.png');
    game.load.image('dock_shadow', 'assets/dock_shadow.png');
    game.load.spritesheet('heart', 'assets/heartGreen_sprite.png', 32, 32);
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

var currentBattery = 100.0;

var dirtParticle;

var decodedDict = [];
var hearts = [];
var emitter;
var dockSprite;
var docking = false

var ARRIVING_AT_DOCK = 1;
var LEAVING_DOCK = 2;
var NOT_DOCKING = 0;

var dockingState = NOT_DOCKING;

function create() {
    decodedDict['vac_on'] = false;
    decodedDict['vac_idle'] = false;
    
    game.physics.startSystem(Phaser.Physics.ARCADE);
    
    floor = game.add.sprite(125, 125, 'floor');

    game.add.sprite(600, 200, 'rug');
    
    dirts = game.add.group();
    dirts.enableBody = true;
    for (var i = 0; i < 14; i++)
    {
        var dirt = dirts.create(150 + i * 50, 150 + Math.random()*375, 'dirt_01');
	dirt.anchor.setTo(0.5,0.5);
    }
    // SHADOWS
    /*tvShadow = game.add.sprite(0, 0, 'tv_shadow');
      tvShadow.alpha = 0.15;*/
    
    //sideTableShadow.alpha = 0.15;

    shadows = game.add.group();
    
    plant1Shadow = shadows.create(0, 0, 'potted_plant_shadow');
    plant1Shadow.alpha = 0.15;
    plant2Shadow = shadows.create(0, 0, 'potted_plant_shadow');
    plant2Shadow.alpha = 0.15;
    
    plant3Shadow = shadows.create(0, 0, 'potted_plant_shadow');
    plant3Shadow.alpha = 0.15;

    plant4Shadow = shadows.create(0, 0, 'potted_plant_shadow');
    plant4Shadow.alpha = 0.15;

    couchShadow = shadows.create(0, 0, 'couch_shadow');
    couchShadow.alpha = 0.15;
    
    dockShadow = shadows.create(0, 0, 'dock_shadow');
    dockShadow.anchor.setTo(0.5, 0.5);
    dockShadow.alpha = 0.15;
    

    coffeeTableShadow = shadows.create(0, 0, 'coffee_table_shadow');
    coffeeTableShadow.alpha = 0.15;
    coffeeTableShadow.shadow_delta_y = 8;
    //coffeeTableShadow.name = "coffeetableshadow";

    
    sideTableShadow = shadows.create(0, 0, 'side_table_shadow');
    sideTableShadow.alpha = 0.25;
    sideTableShadow.shadow_delta_y = 20;
    //sideTableShadow.name = "sideetableshadow";
    
    platforms = game.add.group();

    //  We will enable physics for any object that is created in this group
    platforms.enableBody = true;

    emitter = game.add.emitter(0, 0, 50);
    emitter.makeParticles('speck');
    emitter.gravity = 0;
    
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
    
    rightWall = platforms.create(game.world.width - 125, 125, 'wall_right_door');
    rightWall.body.immovable = true;

    bottomWall = platforms.create(0, game.world.height -125, 'wall_bottom');
    bottomWall.body.immovable = true;

    topWall = platforms.create(0, 0, 'wall_top');
    topWall.body.immovable = true;
    
    couch = platforms.create(200, 200, 'couch');
    couch.shadow_layer = couchShadow;
    couch.body.immovable = true;

    plant3 = platforms.create(200, 400, 'potted_plant');
    plant3.shadow_layer = plant3Shadow;

    plant1 = platforms.create(600, 200, 'potted_plant');
    plant1.shadow_layer = plant1Shadow;
    
    plant2 = platforms.create(750, 200, 'potted_plant');
    plant2.shadow_layer = plant2Shadow;

    

    plant4 = platforms.create(800, 200, 'potted_plant');
    plant4.shadow_layer = plant4Shadow;
    
    /*tv = platforms.create(200, 400, 'tv');
      tv.shadow_layer = tvShadow;*/
    coffeeTable = platforms.create(250, 400, 'coffee_table');
    coffeeTable.shadow_layer = coffeeTableShadow;

    sideTable = platforms.create(406, 200, 'side_table');
    sideTable.shadow_layer = sideTableShadow;
    

    dock = game.add.group();
    dock.enableBody = true;

    dockBody = dock.create(game.world.width - 200, game.world.height - 152, 'speck');
    
    
    dockBody.anchor.setTo(0.5, 0.5);
    dockBody.immovable = true;

    
    
    dockSprite = game.add.sprite(game.world.width - 200, game.world.height - 152, 'dock');
    dockSprite.anchor.setTo(0.5, 0.5);
    dockShadow.x = dockSprite.x;
    dockShadow.y = dockSprite.y + 4;
    
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

    //  Player physics properties. Give the little guy a slight bounce.
    player.body.bounce.y = 0.2;
    player.body.gravity.y = 0;

    player.body.collideWorldBounds = true;

    for (var i = 0; i < 8; i++) {

	heartY = i > 5 ? 78 : 50;
	heartStartX = i > 5 ? game.world.width - 9*28 : game.world.width - 7*28;
	//var heart = game.add.sprite(game.world.width - 28*8 -28 +28 *i , heartY, 'heart', 0);
	var heart = game.add.sprite(heartStartX +28 *i , heartY, 'heart', 0);
	
	heart.anchor.setTo(0.5,0.5);
	hearts.push(heart);
    }
    
    //  Our controls.
    cursors = game.input.keyboard.createCursorKeys();
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

function update() {

    roombaSpeed = 200;
    //  Collide the player and the dirts with the platforms
    game.physics.arcade.collide(player, platforms);
    game.physics.arcade.collide(dirts, platforms);
    game.physics.arcade.collide(platforms, platforms);
    //  Checks to see if the player overlaps with any of the dirts, if he does call the collectDirt function
    game.physics.arcade.overlap(player, dirts, collectDirt, null, this);
    game.physics.arcade.overlap(player, dockBody, goToDock, null, this);
    //  Reset the players velocity (movement)
    if (idleRotation && !docking) {
	shadowSpriteLighter.angle = shadowSprite.angle = player.angle = (player.angle + (rotationDirection == CW ? 2 : -2)) % 360;
	
    } else if (!idleRotation && !docking){
	player.body.velocity.y = lerp(player.body.velocity.y, Math.sin(player.rotation)*roombaSpeed, 0.1);
	player.body.velocity.x = lerp(player.body.velocity.x, Math.cos(player.rotation)*roombaSpeed, 0.1);
    }
    
    if (cursors.left.isDown && idleRotation)
    {
	if (rotationDirection != CCW) {
            if (vacIdle.isPlaying){
		vacIdle.stop();
	    }
	    if (vacAccel.isPlaying){
		vacAccel.stop();
	    }
	    if (vacMove.isPlaying){
		vacMove.stop();
	    }
	    vacIdle.play();
	    rotationDirection = CCW;
	}
    }
    else if (cursors.right.isDown && idleRotation)
    {
	if (rotationDirection != CW){
	    if (vacIdle.isPlaying){
		vacIdle.stop();
	    }
	    if (vacAccel.isPlaying){
		vacAccel.stop();
	    }
	    if (vacMove.isPlaying){
		vacMove.stop();
	    }
	    vacIdle.play();
	    rotationDirection = CW;
	}
    }
    
    if (cursors.up.isDown) {
	startMovement();
    }

    spaceBar = game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);
    spaceBar.onDown.add(startMovement, this);

    if (!player.body.touching.none && !didCollectDirt && !docking) {
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
	emitter.x = player.x + Math.cos(player.rotation)*player.width/2;
	emitter.y = player.y + Math.sin(player.rotation)*player.width/2;
	emitter.start(true, 500, null, 15);
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
	if (sprite.shadow_layer != undefined) {
	    sprite.shadow_layer.x = sprite.x;
	    delta = sprite.shadow_layer.shadow_delta_y == undefined ? 4 : sprite.shadow_layer.shadow_delta_y;
	    sprite.shadow_layer.y = sprite.y + delta;
	}
    });

    dockRate = 0.05;
    angleRate = 0.1;
    
    if (docking) {
	if (dockingState == ARRIVING_AT_DOCK) {

	    dockingTargetX = dockSprite.centerX;
	    dockingTargetY = dockSprite.centerY - 10.0;

	    
	    if (vacMove.isPlaying){
		vacMove.stop();
	    }
	    if (vacAccel.isPlaying){
		vacAccel.stop();
	    }
	    player.angle = lerp(player.angle, 90.0, angleRate);
	    player.centerX = lerp(player.centerX, dockingTargetX, dockRate);
	    player.centerY = lerp(player.centerY, dockingTargetY, dockRate);
	    

	    if (Math.abs(player.centerX - dockingTargetX) <= 0.05 &&
		Math.abs(player.centerY - dockingTargetY) <= 0.05 &&
		Math.abs(player.angle - 90.0) < 0.05) {
		rotationDirection = CW;
		dockingState = LEAVING_DOCK;

	    } /*else {
		console.log("playerx diff: "+Math.abs(player.centerX - (dockSprite.centerX - 10)));
		console.log("playery diff: "+Math.abs(player.centerY - (dockSprite.centerY)));
		console.log("player.x:" +player.centerX);
		console.log("player.y:" +player.centerY); 
		console.log("dock.x: "+dockSprite.centerX);
		console.log("dock.y: "+dockSprite.centerY);
		console.log("player.angle:" +player.angle); 
	    }*/
	    currentBattery = 100.0;
	    //break;
	}
	if (dockingState == LEAVING_DOCK) {
	    currentBattery = 100.0;
	    
	    dockingTargetX = dockSprite.centerX;
	    dockingTargetY = dockSprite.centerY - 60.0;
	    
	    player.angle = lerp(player.angle, -90.0, angleRate);
	    //console.log("leaving angle: "+player.angle);
	    if (Math.abs(player.angle + 90.0) < 1.0) {
		player.centerX = lerp(player.centerX, dockingTargetX, dockRate);
		player.centerY = lerp(player.centerY, dockingTargetY, dockRate);
		if (dockSprite.centerY - player.centerY > 59.0) {
		    dockingState = NOT_DOCKING;
		    docking = false;
		    //console.log("not docking");
		    idleRotation = true;
		    player.body.velocity.x = 0;
		    player.body.velocity.y = 0;
		    
		} /*else {
		    
		    console.log("playerx: "+Math.abs(player.x - (dockSprite.x - 60)));
		    console.log("playery: "+Math.abs(player.y - (dockSprite.y)));
		    
		}*/
	    } /*else {
		console.log("leaving angle: "+Math.abs(player.angle + 90.0));
		
	    }*/
	}

	
    }

    
    
    currentBattery -= docking ? 0 : (idleRotation ? 0.025 : 0.075);

    for (var i = 0; i < hearts.length ; i++) {
	if (currentBattery >= (i+1)*12.5) {
	    hearts[i].frame = 0;
	} else {
	    difference = (i+1)*12.5 - currentBattery;
	    frame = Math.max(0, Math.min(Math.floor(difference/3.125), 4));
	    hearts[i].frame = frame;
	}
    }
}

function collectDirt(player, star) {
    
    // Removes the star from the screen
    star.kill();

    //  Add and update the score
    score += 10;
    
    didCollectDirt = true;
}

function goToDock(player, dock){
    
    if (!docking) {
	console.log('gotodock?');
	docking = true;
	player.body.velocity.x = 0;
	player.body.velocity.y = 0;
	//idleRotation = true;
	dockingState = ARRIVING_AT_DOCK;
	if (vacMove.isPlaying){
	    vacMove.stop();
	}
	if (vacAccel.isPlaying){
	    vacAccel.stop();
	}
	if(vacIdle.isPlaying){
	    vacIdle.stop();
	}
	vacIdle.play();
    
    }
    
}

function lerp(a, b, pct) {
    return (a + pct*(b - a));
}

function startMovement() {
    if (idleRotation && !docking) {
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
}