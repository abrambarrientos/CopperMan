class Boss extends Phaser.Scene {
    constructor() {
        super("scene-boss");
        this.bossVul=true;
        this.player = null;
        this.stars = null;
        this.bombs = null;
        this.platforms = null;
        this.cursors = null;
        this.score = 0;
        this.gameOver = false;
        this.scoreText = null;
        this.spaceBar = null;
        this.bullets = null;
        this.bossSpeed = 100; // Velocidad del jefe
        this.bossDirection = -1; 
        this.bossFase=1;
        this.etapa2finalizada = false;
        this.lastArrowPressed=null;
        this.delay = 2000;
        this.lives=3;
        this.isInvulnerable = false;
    }

    preload() {
        this.load.image('gameOver', 'img/MenuUI/gameOver.png');
        this.load.image('bomb1', 'assets/Personajes/Enemigo.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('electricidad', 'assets/Personajes/Eletric A-Sheet.png', {frameWidth: 64,   frameHeight: 64});
        this.load.image('sky', 'img/Nivel1/Fondo.jpg');
        this.load.image('ground', 'assets/ElementosNivel/platform.png');
        this.load.image('star', 'assets/Consumibles/star.png');
        this.load.image('specialItem', 'assets/Consumibles/starPlus.png');
        this.load.image('bomb', 'assets/Personajes/bomb.png');
        this.load.image('Sangre', 'img/GameOver/sangre.png');

        this.load.spritesheet('dude', 'assets/Personajes/German_Soldier1.png', { frameWidth: 32, frameHeight: 30 });
        this.load.spritesheet('dude1', 'assets/Personajes/dude.png', { frameWidth: 32, frameHeight: 30 });

        this.load.image('Home', 'assets/Botones/HomeBtn.png');
        this.load.image('Reiniciar', 'assets/Botones/ReturnBtn.png');

        this.load.audio('deathSound', 'Sounds/Damage.mp3');
        this.load.image("boss", 'assets/Personajes/German_Soldier1.png', { frameWidth: 32, frameHeight: 30 });
        
    }

    create() {
        //cambiar entre escenas provicional
        this.input.keyboard.on("keydown", (event) => {
            if (event.key >= "0" && event.key <= "9") {
                console.log("Presionaste el número: " + event.key);
                this.handleNumberPress(event.key);
            }
        });
        // Fondo
        this.add.image(400, 300, 'sky');

        // Plataformas
        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();

        // Jugador
        let selectedCharacter = localStorage.getItem("selectedCharacter") || 'player1';
        let characterMap = {
            player1: 'dude',
            player2: 'dude1'
        };
        let characterKey = characterMap[selectedCharacter] || 'dude';

        // Jugador
        this.player = this.physics.add.sprite(100, 450, characterKey);
        this.player.setBounce(0.01);
        this.player.setCollideWorldBounds(true);

        // Animaciones del jugador
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 6, end: 11 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: [{ key: 'dude', frame: 0 }],
            frameRate: 20
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 6, end: 11 }),
            frameRate: 10,
            repeat: -1
        });

        // Controles
        this.cursors = this.input.keyboard.createCursorKeys();
        //barra espaciadora
        this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        // electrividad
        this.electricidad = this.physics.add.group();

        this.anims.create({
            key: 'electric',
            frames: this.anims.generateFrameNumbers('electricEffect', { start: 0, end: 5 }), // Ajusta el rango según el número de frames
            frameRate: 10, // Velocidad de la animación
            repeat: -1 // -1 hace que la animación se repita infinitamente
        });
        
        // Bombas
        this.bombs = this.physics.add.group();

        //balas
        this.bullets = this.physics.add.group();
        this.canShoot = true;
        this.shootTimer = this.time.addEvent({
            delay: 300, // Tiempo entre disparos (en milisegundos)
            callback: () => { this.canShoot = true; },
            callbackScope: this,
            loop: true
        });

        // Puntuación
        
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });

        this.gameOver = false;
        this.lives = 3;
        this.deathSoundPlayed = false;
        this.livesContainer = document.getElementById("lives-container");
        this.updateLivesUI();
        // Colisiones
        this.physics.add.collider(this.player, this.platforms);
        
        this.physics.add.collider(this.bombs, this.platforms);

        // Verificar si el jugador recoge una estrella
        
        this.physics.add.collider(this.player, this.bombs, this.hitBomb, null, this);
        
        // Agregar el jefe en la pantalla
        this.boss = this.physics.add.sprite(700, 500, "dude").setScale(4);
        this.boss.setImmovable(true); // Evita que el jefe sea empujado
        this.boss.setCollideWorldBounds(true);
        this.bossHealth = 100; // Vida máxima del jefe
        this.bossMaxHealth = 100;
    
        this.healthBar = this.add.graphics();
        this.updateHealthBar();    
    
        this.boss.body.allowGravity = false;
        this.physics.add.overlap(this.bullets, this.boss, this.takeDamage, null, this);
        this.physics.add.overlap(this.bombs, this.player, this.hitBomb, null, this);
        this.physics.add.overlap(this.boss, this.player, this.hitBoss, null, this);
        this.physics.add.overlap(this.electricidad, this.player, this.hitBoss, null, this);
        this.physics.add.collider(this.player, this.boss);
        this.bossShootTimer = this.time.addEvent({
            delay: this.delay,
            callback: () => {
                if (this.bossFase === 1) {
                    this.BossShoot();
                }
            },
            callbackScope: this,
            loop: true
        });
    }
    update() {
        if (this.gameOver) return;
        if (this.boss && this.boss.body) {
            this.boss.setVelocityX(this.bossSpeed * this.bossDirection);
    
            // Cambiar dirección si toca los bordes del mundo
            if (this.boss.body.blocked.left) {
                this.bossDirection = 1; // Moverse a la derecha
            } else if (this.boss.body.blocked.right) {
                this.bossDirection = -1; // Moverse a la izquierda
            }
        }

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            // Usamos la animación 'right' pero volteamos el sprite
            this.player.anims.play('right', true);
            this.player.setFlipX(true);
            this.lastArrowPressed='left';
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
            // Reproducimos la animación normal sin volteo
            this.player.anims.play('right', true);
            this.player.setFlipX(false);
            this.lastArrowPressed='right';
        } else {
            this.player.setVelocityX(0);
            this.player.anims.play('turn');
        }

        if (this.bossDirection == -1) {
            
            this.boss.anims.play('right', true);
            this.boss.setFlipX(true);
            
        } else if (this.bossDirection == 1) {

            this.boss.anims.play('right', true);
            this.boss.setFlipX(false);
            
        } 
        if(this.bossSpeed==0) {
            this.boss.anims.play('turn');
            this.zonasDeDaño();
        }

        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
        }
        if (this.spaceBar.isDown && this.canShoot == true) {
            this.Shoot();
            this.canShoot = false;
        }
        this.bullets.children.iterate((bullet) => {
            if (bullet && bullet.x !== undefined) {
                if (bullet.x < 0 || bullet.x > this.sys.game.config.width) {
                    bullet.destroy();
                }
            }
        });
        this.electricidad.anims.play('electric', true);
    }
    Shoot() {
        let bullet = this.bullets.create(this.player.x, this.player.y, 'bomb');
        bullet.setScale(0.5);
        bullet.body.allowGravity = false;

        // Determinar la dirección del disparo
        let direction = this.lastArrowPressed === 'left' ? -1 : 1;
        bullet.setVelocityX(400 * direction);
    }
    handleNumberPress(number) {
        switch (number) {
            case "1":
                this.scene.start("scene-game")
                break;
            case "2":
                this.scene.start("scene-game2")
                break;
            default:
                console.log("Número sin acción asignada.");
                break;
        }
    }
    updateHealthBar() {
        this.healthBar.clear(); // Limpiar la barra anterior

        // Dibujar el fondo de la barra de vida (gris)
        this.healthBar.fillStyle(0x555555);
        this.healthBar.fillRect(150, 50, 500, 20);

        // Dibujar la barra de vida en verde (según la vida actual)
        let healthPercentage = this.bossHealth / this.bossMaxHealth;
        this.healthBar.fillStyle(0x770000);
        this.healthBar.fillRect(150, 50, 500 * healthPercentage, 20);
    }
    takeDamage(jefe, bala) {
        bala.destroy(); // Eliminar la bala
    
        // Si el jefe es invulnerable, no recibe daño
        if (this.bossInvulnerable) {
            console.log("¡El jefe es invulnerable y no recibe daño!");
            return;
        }
    
        // Restar vida al jefe
        let damage = 2; // Ajusta el daño según sea necesario
        this.bossHealth = Math.max(0, this.bossHealth - damage);
    
        // Actualizar la barra de vida
        this.updateHealthBar();
    
        this.boss.setTint(0xff0000); // Cambia el color a rojo
        this.time.delayedCall(200, () => {
            this.boss.clearTint(); // Regresa a su color original después de 200ms
        });
    
        // Fase de furia si la vida baja al 50%
        if (this.bossHealth <= this.bossMaxHealth * 0.5 && !this.etapa2finalizada) {
            this.etapa2finalizada = true; // Evitar múltiples activaciones
            this.bossFase = 2;
            this.bossInvulnerable = true; // Hacer invulnerable al jefe
            console.log("¡El jefe está furioso! Se vuelve invulnerable y deja de disparar.");
    
            // Cambiar comportamiento
            this.bossSpeed = 0;
            this.bossShootTimer.paused = true; // Detener disparos
    
            // Después de 10 segundos, vuelve a la normalidad y puede recibir daño nuevamente
            this.time.delayedCall(10000, () => {
                this.bossFase = 1;
                this.bossInvulnerable = false; // Volver a ser vulnerable
                this.bossSpeed = 100;
                this.delay = 1000;
                this.bossShootTimer.paused = false; // Reanudar disparos
            }, [], this);
        }
    
        // Destruir al jefe si su vida llega a 0
        if (this.bossHealth <= 0) {
            this.boss.destroy(); // Destruye completamente al jefe
            this.healthBar.clear();
        }
    }
    
    hitBomb(player, bomb) {
        if (this.isInvulnerable) return; // No recibe daño si es invulnerable
    
        this.lives -= 1;
        bomb.destroy();
        this.updateLivesUI();
    
        if (this.lives <= 0 && !this.GameOver) {
            this.GameOver = true;
            this.isGameOver();
        } else {
            this.activateInvulnerability(); // Activar invulnerabilidad después de recibir daño
        }
    }
    hitBoss(player, boss) {
        if (this.isInvulnerable) return;
    
        this.lives -= 1;
        this.updateLivesUI();
    
        if (this.lives <= 0 && !this.GameOver) {
            this.GameOver = true;
            this.isGameOver();
        } else {
            this.activateInvulnerability(); // Activar invulnerabilidad después de recibir daño
        }
    }
    updateLivesUI () {
        // Limpiar el contenedor antes de volver a renderizar las vidas
        this.livesContainer.innerHTML = "";

        // Agregar una imagen por cada vida restante
        for (let i = 0; i < this.lives; i++) {
            let img = document.createElement("img");
            img.src = "assets/SpritesUI/Vidas.png"; // Ruta correcta de la imagen de vida
            img.classList.add("life-icon"); // Clase CSS para darle estilo
            this.livesContainer.appendChild(img);
        }
    };
    BossShoot() {
        if (!this.boss || !this.boss.body) return;
    
        if (this.etapa2finalizada) {
            // En la fase 2, el jefe dispara ráfagas rápidas durante 5 segundos
            console.log("Fase 2: Ataque rápido");
    
            this.time.delayedCall(5000, () => {
                this.bossSpeed = 100;
                this.delay =1000; // Restaurar velocidad normal de disparo
            }, [], this);
    
            for (let i = 0; i < 3; i++) { // Disparar 3 balas en ráfaga
                this.time.delayedCall(i * 300, () => {
                    this.spawnBossProjectile();
                }, [], this);
            }
    
        } else {
            // En la fase 1, el jefe dispara una sola bala dirigida al jugador
            this.spawnBossProjectile();
        }
    }
    spawnBossProjectile() {
        let bomb = this.bombs.create(this.boss.x, this.boss.y, 'bomb');
        bomb.setScale(2);
        bomb.body.allowGravity = false;
    
        // Calcular dirección hacia el jugador
        let angle = Phaser.Math.Angle.Between(this.boss.x, this.boss.y, this.player.x, this.player.y);
        let speed = 200;
    
        // Aplicar velocidad en función del ángulo
        bomb.setVelocityX(Math.cos(angle) * speed);
        bomb.setVelocityY(Math.sin(angle) * speed);
    }
    isGameOver() {
        this.physics.pause();
        this.player.setTint(0xff0000);

        if (!this.deathSoundPlayed) {
            this.sound.play('deathSound');
            this.deathSoundPlayed = true;
        }

        const cam = this.cameras.main;
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        let bloodBackground = this.add.image(centerX, centerY, 'Sangre')
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(9);
        bloodBackground.setDisplaySize(cam.width, cam.height);

        let gameOverImage = this.add.image(centerX, centerY, 'gameOver')
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(10);

        // Definir escala para los botones (por ejemplo, 0.5 para hacerlos más pequeños)
        const buttonScale = 0.5;
        // Offset vertical para situarlos debajo de la imagen Game Over
        const offsetY = 150;
        // Offset horizontal para colocarlos uno a cada lado
        const offsetX = 80;

        // Botón para reiniciar el nivel
        let restartButton = this.add.image(centerX - offsetX, centerY + offsetY, 'Reiniciar')
            .setInteractive()
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(10)
            .setScale(buttonScale);

        restartButton.on('pointerdown', () => {
            this.etapa2finalizada=false;
            this.GameOver=false;
            this.delay=2000;
            this.bossFase=1;
            this.isInvulnerable = false;
            this.scene.restart();
            this.scene.start('scene-boss');
            
        });

        let menuButton = this.add.image(centerX + offsetX, centerY + offsetY, 'Home')
            .setInteractive()
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(10)
            .setScale(buttonScale);
        menuButton.on('pointerdown', () => {
            this.etapa2finalizada=false;
            this.GameOver=false;
            this.delay=2000;
            this.bossFase=1;
            this.isInvulnerable = false;
            this.scene.start('menu-scene');
        });
    }
    activateInvulnerability() {
        if (this.isInvulnerable) return; // Evita activar varias veces seguidas
        
        this.isInvulnerable = true;
        this.player.setTint(0x888888); // Color visual para indicar invulnerabilidad
    
        this.time.delayedCall(2000, () => { // 2 segundos de invulnerabilidad
            this.isInvulnerable = false;
            this.player.clearTint();
        }, [], this);
    }
    zonasDeDaño(){
        let x = 100; // Posición inicial en X
        let y = 200; // Posición fija en Y

        for (let i = 0; i < 5; i++) { // Crear 5 bombas
        this.electricidad.create(x, y, 'bomb');
        x += 70; // Aumenta X en 70 para la siguiente bomba
        }
    }
}