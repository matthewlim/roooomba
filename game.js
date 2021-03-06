var game = new Phaser.Game(1050, 650, Phaser.AUTO, 'game_content', { preload: preload, create: create, update: update });

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
    game.load.audio('vac_off', 'assets/vac_off.mp3');
    game.load.audio('dockSound', 'assets/switch.mp3');
    game.load.image('wall_top', 'assets/wall_top.png');
    game.load.image('wall_left', 'assets/wall_left.png');
    game.load.image('wall_right_door', 'assets/wall_right_door.png');
    game.load.image('wall_bottom', 'assets/wall_bottom.png');
    game.load.image('couch', 'assets/couch.png');
    game.load.image('couch_shadow', 'assets/couch_shadow.png');
    game.load.image('dirt_01', 'assets/dirts/dirt_01.png');
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
    game.load.spritesheet('dirt_meter', 'assets/dirtmeter_sprite_h.png', 32, 160);
    game.load.image('dirt_meter_glow', 'assets/dirt_meter_glow.png');
    game.load.image('splat_01', 'assets/dirts/spill_red.png');
    game.load.image('splat_02', 'assets/dirts/spill_blue.png');
    game.load.image('splat_03', 'assets/dirts/spill_green.png');
    game.load.image('arrows_01', 'assets/dirts/brokenArrows.png');
    game.load.image('red_triangle', 'assets/triangle_glow_red.png');
    game.load.image('yellow_triangle', 'assets/triangle_glow_yellow.png');
    game.load.image('reddot', 'assets/reddot.png');
    game.load.image('start_bubble', 'assets/start_bubble.png');
    game.load.image('dirt_counter', 'assets/dirt_counter.png');
    game.load.image('dirt_counter_shine', 'assets/dirt_counter_shine.png');
    game.load.image('shade', 'assets/speck_black.png');
}



var player;
var playerBody;
var shadowSprite;
var shadowSpriteLighter;
var platforms;
var redLight;

var yellowLight;
var yellowLightDirection = 1;
var redLightDirection = 0;

var dirtGlowDirection = 0;
var dirtGlow;

var cursors;

var dirts;
var score = 0;
var scoreText;
var idleRotation = false;
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
var vacOff;
var vacAccel;
var vacMove;
var vacIdle;

var dockSound;

var currentBattery = 100.0;

var dirtParticle;

var decodedDict = [];
var hearts = [];
var emitter;
var dockSprite;
var dockBody;
var docking = true;

var ARRIVING_AT_DOCK = 1;
var LEAVING_DOCK = 2;
var NOT_DOCKING = 0;

var dockingState = NOT_DOCKING;

var dirtMeter;
var dirtCounter;
var dirtCounterText;
var dirtCollected = 0.0;
var dirtDict = ['dirt_01', 'splat_01', 'splat_02', 'splat_03', 'arrows_01'];
var dirtTimer;
var didPlayVacOff;
var deathAngle;
var redDot;
var dockTimeout = 0;
var floor;
var rug;
var gameoverTitleText;
var gameoverRestartText;
var gameoverText;

var textStyle;
var totalDirtCleaned = 0;
var startBubble;
var shade;
var gameStarted = false;
var gameOver = false;
var animatingRestart = false;

function create() {
    decodedDict['vac_on'] = false;
    decodedDict['vac_idle'] = false;
    
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.time.events.loop(Phaser.Timer.SECOND * 2, dropDirtTimer, this);
    floor = game.add.sprite(125, 125, 'floor');

    rug = game.add.sprite(600, 200, 'rug');
    
    dirts = game.add.group();
    dirts.enableBody = true;
    for (var i = 0; i < 20; i++)
    {
        dropDirt();
    }
    // SHADOWS

    
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
    vacOn.onDecoded.add(function() {decodedDict['vac_on'] = true;}, this);
    vacOn.onStop.add(function() {vacIdle.play();}, this);

    dockSound = game.add.audio('dockSound');
    

    vacIdle = game.add.audio('vac_idle');
    vacIdle.loop = true;
    vacIdle.allowMultiple = false;
    vacIdle.onDecoded.add(function(){decodedDict['vac_idle'] = true;}, this);

    vacAccel = game.add.audio('vac_accel');
    vacAccel.allowMultiple = true;
    vacAccel.onDecoded.add(function(){decodedDict['vac_accel'] = true;}, this);
    vacAccel.onStop.add(function(){
	if (decodedDict['vac_move']) {
	    vacMove.play();
	}
	didCollide = false;
    }, this);
    
    vacMove = game.add.audio('vac_move');
    vacMove.loop = true;
    vacMove.allowMultiple = false;
    vacMove.onDecoded.add(function() {decodedDict['vac_move'] = true;}, this);

    vacOff = game.add.audio('vac_off');
    vacOff.onDecoded.add(function() {decodedDict['vac_off'] = true;}, this);
    

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

    // PLANTS
    plant3Body = makePlant(200, 400, plant3Shadow);

    plant1Body = makePlant(600, 200, plant1Shadow);

    plant2Body = makePlant(750, 200, plant2Shadow);

    plant4Body = makePlant(800, 200, plant4Shadow);
    
    coffeeTable = platforms.create(250, 400, 'coffee_table');
    coffeeTable.shadow_layer = coffeeTableShadow;
    coffeeTable.originalPosition = {x: 250, y:400};
    
    sideTable = platforms.create(406, 200, 'side_table');
    sideTable.originalPosition = {x: 406, y:200};
    sideTable.shadow_layer = sideTableShadow;

    // create screen shade thing here

    shade = game.add.sprite(25, 25, 'shade');

    shade.scale.setTo(1000, 600);
    shade.alpha = 0.5;
    
    dock = game.add.group();
    dock.enableBody = true;

    dockBody = dock.create(game.world.width - 200, game.world.height - 152, 'speck');
    dockBody.anchor.setTo(0.5, 0.5);
    dockBody.immovable = true;
    
    dockSprite = game.add.sprite(game.world.width - 200, game.world.height - 152, 'dock');
    dockSprite.anchor.setTo(0.5, 0.5);
    dockShadow.x = dockSprite.x;
    dockShadow.y = dockSprite.y + 4;

    redDot = game.add.sprite(game.world.width - 200, game.world.height - 134, 'reddot');
    redDot.anchor.setTo(0.5, 0.5);
    redDot.alpha = 0.0;
    
    // The player and its settings
    startX = dockSprite.centerX;
    startY = dockSprite.centerY - 10;
    shadowSprite = game.add.sprite(startX, startY, 'roombaShadow');
    shadowSprite.anchor.setTo(0.5, 0.5);
    shadowSpriteLighter = game.add.sprite(startX, startY, 'roombaShadow2');
    shadowSpriteLighter.anchor.setTo(0.5, 0.5);
    shadowSpriteLighter.alpha = .15;

    playerBody = game.add.sprite(startX, startY, 'shade')
    playerBody.scale.setTo(40, 40);
    playerBody.angle = -90;
    playerBody.alpha = 0;
    playerBody.anchor = new Phaser.Point(0.5, 0.5);
    
    player = game.add.sprite(startX, startY, 'roomba');
    player.angle = -90;
    player.anchor = new Phaser.Point(0.5, 0.5);

    redLight = game.add.sprite(startX, startY, 'red_triangle');
    redLight.anchor.setTo(0.5,0.5);
    redLight.alpha = 0.0;

    yellowLight = game.add.sprite(startX, startY, 'yellow_triangle');
    yellowLight.anchor.setTo(0.5, 0.5);
    yellowLight.alpha = 0.0;
    
    
    //  We need to enable physics on the player
    game.physics.arcade.enable(playerBody);

    playerBody.body.bounce.y = 0.2;
    playerBody.body.gravity.y = 0;

    playerBody.body.collideWorldBounds = true;

    for (var i = 0; i < 8; i++) {

	heartY = i > 5 ? 78 : 50;
	heartStartX = i > 5 ? game.world.width - 9*28 : game.world.width - 7*28;
	var heart = game.add.sprite(heartStartX +28 *i , heartY, 'heart', 0);
	
	heart.anchor.setTo(0.5,0.5);
	hearts.push(heart);
    }
    
    //  Our controls.
    cursors = game.input.keyboard.createCursorKeys();
    
    dirtMeter = game.add.sprite(190, 36, 'dirt_meter', 0);
    dirtMeter.angle = 90;

    dirtGlow = game.add.sprite(190, 36, 'dirt_meter_glow');
    dirtGlow.angle = 90;
    dirtGlow.alpha = 0;
    
    dirtCounter = game.add.sprite(190, 41, 'dirt_counter');
    dirtCounterText = game.add.text(dirtCounter.centerX, dirtCounter.centerY, '0',
				    {font: "bold 12px Helvetica Neue", fill: "#422a0f", align:"center"});
    dirtCounterText.anchor.setTo(0.5, 0.5);

    dirtCounterShine = game.add.sprite(196, 46, 'dirt_counter_shine');
    
    textStyle = {font: "18px Helvetica Neue", fill: "#fff", align: "center"};
    gameoverTitleText = game.add.text(game.world.centerX, game.world.centerY - 28, "Game Over", textStyle);
    gameoverTitleText.anchor.setTo(0.5, 0.5);
    gameoverTitleText.alpha = 0.0;

    textStyle = {font: "16px Helvetica Neue", fill: "#fff", align: "center"};
    gameoverText = game.add.text(game.world.centerX, game.world.centerY, "", textStyle);
    gameoverText.anchor.setTo(0.5, 0.5);
    gameoverText.alpha = 0.0;

    textStyle = {font: "14px Helvetica Neue", fill: "#fff", align: "center"};
    gameoverRestartText = game.add.text(game.world.centerX, game.world.centerY + 28, "Hit SPACE to restart.", textStyle);
    gameoverRestartText.anchor.setTo(0.5, 0.5);
    gameoverRestartText.alpha = 0.0;

    startBubble = game.add.sprite(startX - 240, startY- 180, 'start_bubble');
}

function pad(num, size) {
    var s = "0000000" + num;
    return s.substr(s.length-size);
}

function onSoundDecoded() {
    soundsReady = true;
    console.log("Sounds ready?");
}

function update() {
    
    if (animatingRestart) {
	fadeRate = 0.2;
	shade.alpha = lerp(shade.alpha, 0.5, fadeRate);
	startBubble.alpha = lerp(startBubble.alpha, 1.0, fadeRate);
	gameoverTitleText.alpha = 0.0;
	gameoverText.alpha = 0.0;
	gameoverRestartText.alpha = 0.0;
	handleDocking();
        updatePlayerLayerCoordinates();
        updatePlayerLayerAngles();
        
	if (dockingState == LEAVING_DOCK && startBubble.alpha > 0.9) {
	    animatingRestart = false;
	    gameOver = false;
	}
	return;

    }

    roombaSpeed = dirtCollected < 100.0 ? (dirtCollected < 75.0 ? 200 : 150) : 100;
    //  Collide the player and the dirts with the platforms
    game.physics.arcade.collide(playerBody, platforms);
    game.physics.arcade.collide(dirts, platforms);
    game.physics.arcade.collide(platforms, platforms);
    //  Checks to see if the player overlaps with any of the dirts, if he does call the collectDirt function
    game.physics.arcade.overlap(playerBody, dirts, collectDirt, null, this);
    game.physics.arcade.overlap(playerBody, dockBody, goToDock, null, this);
    //  Reset the players velocity (movement)

    if (currentBattery > 0.0) {
	if (currentBattery < 33.0) {
	    yellowLight.alpha = 0;
	    if (redLightDirection == 0) {
		redLightDirection = 1;
	    }
	    else if (redLightDirection == 1){
		redLight.alpha = lerp(redLight.alpha, 1.0, 0.15);
		if (redLight.alpha > 0.9) {
		    redLightDirection = -1;
		}
	    } else if (redLightDirection == -1) {
		redLight.alpha = lerp(redLight.alpha, 0.0, 0.15);
		if (redLight.alpha < 0.1) {
		    redLightDirection = 1;
		}
	    }
	} else {
	    redLight.alpha = 0.0;
	    if (yellowLightDirection == 1) {
		yellowLight.alpha = lerp(yellowLight.alpha, 1.0, 0.1);
		if (Math.abs(yellowLight.alpha) > 0.99) {
		    yellowLightDirection = -1;
		}
	    } else if (yellowLightDirection == -1) {
		yellowLight.alpha = lerp(yellowLight.alpha, 0.0, 0.1);
		if (Math.abs(yellowLight.alpha) < 0.01) {
		    yellowLightDirection = 1;
		}
	    }
	}
	
	
	if (idleRotation && !docking) {
	    playerBody.angle = (playerBody.angle + (rotationDirection == CW ? 2 : -2)) % 360;
	    deathAngle = rotationDirection == CW ? (playerBody.angle + 30) % 360 : (playerBody.angle - 30) % 360;
	    
	} else if (!idleRotation && !docking){
	    
	    playerBody.body.velocity.y = lerp(playerBody.body.velocity.y, Math.sin(playerBody.rotation)*roombaSpeed, 0.1);
	    playerBody.body.velocity.x = lerp(playerBody.body.velocity.x, Math.cos(playerBody.rotation)*roombaSpeed, 0.1);
	}

	if (cursors.left.isDown && idleRotation) {
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
		if (vacOn.isPlaying){
		    vacOn.stop();
		}
		
		vacIdle.play();
		rotationDirection = CCW;
	    }
	}
	else if (cursors.right.isDown && idleRotation) {
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
		if (vacOn.isPlaying){
		    vacOn.stop();
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
    } else {
	// CURRENT BATTERY IS ZERO!
	fadeRate = 0.05;

	shade.alpha = lerp(shade.alpha, 1.0, fadeRate);
	if (shade.alpha > 0.7) {
	    gameoverText.setText("Your battery has died. You cleaned up " + (totalDirtCleaned + dirtCollected/5) + " messes.");
	    gameoverText.alpha = lerp(gameoverText.alpha, 1.0, fadeRate);
	    gameoverTitleText.alpha = lerp(gameoverText.alpha, 1.0, fadeRate);
	    gameoverRestartText.alpha = lerp(gameoverRestartText.alpha, 0.4, fadeRate);
	}

	if (Math.abs(gameoverText.alpha - 1.0) < 0.05) {
	    gameStarted = false;
	    gameOver = true;
	}
	
	yellowLight.alpha = 0.0;
	playerBody.body.velocity.x = lerp(playerBody.body.velocity.x, 0, 0.1);
	playerBody.body.velocity.y = lerp(playerBody.body.velocity.y, 0, 0.1);
	redLight.alpha = lerp(redLight.alpha, 0.8, 0.1);
	if (vacOn.isPlaying) {
	    vacOn.stop();
	}
	if (vacMove.isPlaying) {
	    vacMove.stop();
	}
	if (vacAccel.isPlaying) {
	    vacAccel.stop();
	}
	if (vacIdle.isPlaying) {
	    vacIdle.stop();
	}
	if (!vacOff.isPlaying && !didPlayVacOff) {
	    didPlayVacOff = true;
	    vacOff.play();
	}
	if (idleRotation) {
	    playerBody.angle = lerp(playerBody.angle, deathAngle, 0.025);
	}
	
    }
    

    if (!playerBody.body.touching.none && !didCollectDirt && !docking) {
	playerBody.body.velocity.x = 0;
	playerBody.body.velocity.y = 0;
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
	emitter.x = playerBody.x + Math.cos(playerBody.rotation)*playerBody.width/2;
	emitter.y = playerBody.y + Math.sin(playerBody.rotation)*playerBody.width/2;
	emitter.start(true, 500, null, 15);
    }
    
    if (didCollectDirt) {
	didCollectDirt = false;
    }
    var recoilSpeed = 20.0;
    if (recoilTicker > 0) {
	playerBody.scale.setTo((1.0 - (recoilTicker/RECOIL_MAX)*0.1)*40, 40);
	player.scale.setTo(1.0 - (recoilTicker/RECOIL_MAX)*0.1, 1.0);
	shadowSprite.scale.setTo(1.0 - (recoilTicker/RECOIL_MAX)*0.1, 1.0);
	shadowSpriteLighter.scale.setTo(1.0 - (recoilTicker/RECOIL_MAX)*0.1, 1.0);
	recoilTicker -= 1.0;
	playerBody.body.velocity.y = lerp(-Math.sin(playerBody.rotation)*recoilSpeed, 0.0, 0.2);
	playerBody.body.velocity.x = lerp(-Math.cos(playerBody.rotation)*recoilSpeed, 0.0, 0.2);
	if (recoilTicker <= 0.0) {
	    idleRotation = true;
	    playerBody.body.velocity.setTo(0,0);
	}
    }
    
    
    platforms.forEach(function(sprite) {
	
	sprite.body.velocity.x = lerp(sprite.body.velocity.x, 0, 0.1);
	sprite.body.velocity.y = lerp(sprite.body.velocity.y, 0, 0.1);
	if (sprite.shadow_layer != undefined) {
	    sprite.shadow_layer.x = sprite.x;
	    delta = sprite.shadow_layer.shadow_delta_y == undefined ? 4 : sprite.shadow_layer.shadow_delta_y;
	    sprite.shadow_layer.y = sprite.y + delta;
	}
	if (sprite.decoration_layer != undefined){
	    sprite.decoration_layer.x = sprite.centerX - sprite.decoration_layer.width/2;
	    sprite.decoration_layer.y = sprite.centerY - sprite.decoration_layer.height/2;
	}
	    
    });

    dockRate = 0.04;
    angleRate = 0.1;
    
    if (docking) {
	
	handleDocking();
    }

    if (dockTimeout > 0.0) {
	redDot.alpha = lerp(redDot.alpha, 1.0, 0.2);
	dockTimeout = Math.max(0.0, dockTimeout - 0.1);
    } else {
	redDot.alpha = lerp(redDot.alpha, 0.0, 0.3);
    }
    updatePlayerLayerCoordinates();
    updatePlayerLayerAngles();
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
    if (dirtCollected == 100.0) {
	if (dirtGlowDirection == 0) {
	    dirtGlowDirection = 1;

	}
	if (dirtGlowDirection == 1) {
	    
	    dirtGlow.alpha = lerp(dirtGlow.alpha, 1.0, 0.15);
	    if (dirtGlow.alpha > 0.9) {
		dirtGlowDirection = -1;
	    }
	} else if (dirtGlowDirection == -1) {

	    dirtGlow.alpha = lerp(dirtGlow.alpha, 0.0, 0.15);
	    if (dirtGlow.alpha < 0.1) {
		dirtGlowDirection = 1;
	    }
	}
    } else {
	dirtGlowDirection = 0;
	dirtGlow.alpha = 0.0;
    }
    dirtMeter.frame = Math.min(Math.max(0, Math.floor(dirtCollected/5.0) -1), 19);
    dirtCounterText.setText(pad(totalDirtCleaned + dirtCollected/5, 4));
}

function makePlant(xPos, yPos, shadowLayer) {
    plantBody = platforms.create(xPos, yPos, 'shade');
    plantBody.scale.setTo(40, 40);
    plantBody.alpha = 0;
    plant = game.add.sprite(xPos, yPos, 'potted_plant');
    plantBody.originalPosition = {x: xPos, y: yPos};
    plantBody.shadow_layer = shadowLayer;
    plantBody.decoration_layer = plant;

    return plantBody;

}

function collectDirt(player, dirt) {
    
    // Removes the star from the screen
    dirt.kill();
    
    //  Add and update the score
    dirtCollected = Math.min(100.0, dirtCollected + 5.0);
    didCollectDirt = true;
    dirts.remove(dirt);
}

function goToDock(player, dock){
    
    if (!docking && dockTimeout == 0.0) {

	totalDirtCleaned += Math.floor(dirtCollected/5.0);
	
	dockSound.play();
	docking = true;
	player.body.velocity.x = 0;
	player.body.velocity.y = 0;
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

function dropDirtTimer() {
    if (gameStarted) {
	dropDirt();
    }

}

function dropDirt() {
    if (currentBattery > 0.0 && dirts.length < 50) {
	index = Math.floor(dirtDict.length*Math.random());

	columnIndex = Math.floor(Math.random()*16);
	rowIndex = Math.floor(Math.random()*8);
	dirt = dirts.create(150 + columnIndex*50, 150 + rowIndex*50, dirtDict[index]);
	dirt.anchor.setTo(0.5, 0.5);
    }
}

function lerp(a, b, pct) {
    return (a + pct * (b - a));
}

function startMovement() {

    if (animatingRestart) {
	return;
    }
    
    if (gameStarted) {
    
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
    } else if (!gameOver){
	totalDirtCleaned = 0;
	dirtCollected = 0;
	console.log("starting game...");
	gameStarted = true;
	idleRotation = false;
	dockingState = LEAVING_DOCK;
	startBubble.alpha = 0;
	shade.alpha = 0;
	vacOn.play();
	redLightDirection = 0;
	didPlayVacOff = false;
    } else {
	dockSound.play();
	platforms.forEach(function(sprite) {
	    sprite.body.velocity.x = 0;
	    sprite.body.velocity.y = 0;
	    if (sprite.originalPosition != undefined) {
		sprite.x = sprite.originalPosition.x;
		sprite.y = sprite.originalPosition.y;
	    }

	    if (sprite.shadow_layer != undefined) {
		sprite.shadow_layer.x = sprite.x;
		delta = sprite.shadow_layer.shadow_delta_y == undefined ? 4 : sprite.shadow_layer.shadow_delta_y;
		sprite.shadow_layer.y = sprite.y + delta;
	    }
	    
	});
	
	docking = true;
	gameOver = false;
	animatingRestart = true;
	dockingState = ARRIVING_AT_DOCK;
	
    }
}

function updatePlayerLayerCoordinates() {
    player.x = yellowLight.x = redLight.x = shadowSpriteLighter.x = shadowSprite.x = playerBody.body.x + playerBody.offsetX;
    player.y = yellowLight.y = redLight.y = playerBody.body.y + playerBody.offsetY;
    shadowSprite.y = playerBody.body.y + playerBody.offsetY + 2;
    shadowSpriteLighter.y = playerBody.body.y + playerBody.offsetY + 6;
}

function updatePlayerLayerAngles() {
    yellowLight.angle = redLight.angle = shadowSpriteLighter.angle = shadowSprite.angle = player.angle = playerBody.angle;
}

function handleDocking() {
    if (dockingState == ARRIVING_AT_DOCK) {

	dockingTargetX = dockSprite.centerX;
	dockingTargetY = dockSprite.centerY - 10.0;
	
	if (vacMove.isPlaying){
	    vacMove.stop();
	}
	if (vacAccel.isPlaying){
	    vacAccel.stop();
	}
	playerBody.angle = lerp(playerBody.angle, 90.0, angleRate);
	playerBody.centerX = lerp(playerBody.centerX, dockingTargetX, dockRate);
	playerBody.centerY = lerp(playerBody.centerY, dockingTargetY, dockRate);
	

	if (Math.abs(playerBody.centerX - dockingTargetX) <= 0.05 &&
	    Math.abs(playerBody.centerY - dockingTargetY) <= 0.05 &&
	    Math.abs(playerBody.angle - 90.0) < 0.05) {
	    rotationDirection = CW;
	    dockingState = LEAVING_DOCK;

	} 
	currentBattery = 100.0;
	dirtCollected = 0.0;
    }
    if (dockingState == LEAVING_DOCK) {
	currentBattery = 100.0;
	
	dockingTargetX = dockSprite.centerX;
	dockingTargetY = dockSprite.centerY - 60.0;
	
	playerBody.angle = lerp(playerBody.angle, -90.0, angleRate);
	if (Math.abs(playerBody.angle + 90.0) < 1.0) {
	    if (!animatingRestart && gameStarted) {
		playerBody.centerX = lerp(playerBody.centerX, dockingTargetX, dockRate);
		playerBody.centerY = lerp(playerBody.centerY, dockingTargetY, dockRate);
		if (dockSprite.centerY - playerBody.centerY > 59.0) {
		    dockingState = NOT_DOCKING;
		    docking = false;
		    idleRotation = true;
		    playerBody.body.velocity.x = 0;
		    playerBody.body.velocity.y = 0;
		    dockTimeout = 100.0;
		}
	    }
	} 
    }
}
