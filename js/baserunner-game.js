// ============================================
// BaseRunner Game
// ============================================

class Ball {
    constructor(x, y, canvasWidth, canvasHeight) {
        this.x = x;
        this.y = y;
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.dx = (1.5 + Math.random() * 1.5) * (Math.random() < 0.5 ? 1 : -1);
        this.dy = 0;
        this.radius = 15;
        this.sideRight = this.dx > 0;
        this.hit = false;
        this.color = '#ff6b6b';
        this.gravity = 0.04 + Math.random() * 0.06; // small random gravity per ball
        this.onGround = false;
        this.floatTimer = Math.random() * 120; // random delay before starting to fall
    }

    move() {
        // Horizontal bird-like movement
        this.x += this.dx;

        // Bounce off walls
        if (this.x > this.canvasWidth - this.radius) {
            this.dx *= -1;
            this.x = this.canvasWidth - this.radius;
        } else if (this.x < this.radius) {
            this.dx *= -1;
            this.x = this.radius;
        }

        // Delay falling randomly, then apply gravity
        if (this.floatTimer > 0) {
            this.floatTimer--;
            // Gentle vertical drift while floating
            this.y += Math.sin(this.x * 0.02) * 0.3;
        } else {
            this.dy += this.gravity;
            this.y += this.dy;
        }

        // Clamp to top
        if (this.y < this.radius) {
            this.y = this.radius;
            this.dy = 0;
        }

        // Hit ground
        if (this.y >= this.canvasHeight - this.radius) {
            this.onGround = true;
            this.y = this.canvasHeight - this.radius;
            this.dy = 0;
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 5, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    collidesWith(x, y, radius) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy) < this.radius + radius;
    }
}

class Bomb {
    constructor(x, y, dirX = 0, dirY = 1) {
        this.x = x;
        this.y = y;
        const speed = 7;
        const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
        this.vx = (dirX / len) * speed;
        this.vy = (dirY / len) * speed;
        this.radius = 12;
        this.explode = false;
        this.explodeRadius = 0;
        this.maxExplodeRadius = 100;
        this.color = '#000000';
    }

    move() {
        if (!this.explode) {
            this.vy += 0.15; // arc gravity
            this.x += this.vx;
            this.y += this.vy;
        }
    }

    triggerExplosion() {
        this.explode = true;
    }

    checkCollisionWithBalls(balls) {
        for (const ball of balls) {
            const dx = this.x - ball.x;
            const dy = this.y - ball.y;
            if (Math.sqrt(dx * dx + dy * dy) < this.radius + ball.radius) {
                this.triggerExplosion();
                return true;
            }
        }
        return false;
    }

    checkCollisionWithRedDots(redDots) {
        for (const dot of redDots) {
            const dx = this.x - dot.x;
            const dy = this.y - dot.y;
            if (Math.sqrt(dx * dx + dy * dy) < this.radius + dot.radius) {
                this.triggerExplosion();
                return true;
            }
        }
        return false;
    }

    checkGroundCollision(canvasHeight) {
        if (this.y + this.radius >= canvasHeight) {
            this.triggerExplosion();
            return true;
        }
        return false;
    }

    isExplosionDone() {
        return this.explodeRadius > this.maxExplodeRadius;
    }

    getExplosionBounds() {
        return { x: this.x, y: this.y, radius: this.explodeRadius };
    }

    draw(ctx) {
        if (!this.explode) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#8b4513';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.radius);
            ctx.lineTo(this.x, this.y - this.radius - 10);
            ctx.stroke();

            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(this.x, this.y - this.radius - 10, 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const alpha = 1 - this.explodeRadius / this.maxExplodeRadius;
            ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.explodeRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = `rgba(255, 200, 0, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.explodeRadius, 0, Math.PI * 2);
            ctx.stroke();

            this.explodeRadius += 3;
        }
    }
}

class RedDot {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 8;
        this.color = '#ff2200';
        this.speed = 1.8;
    }

    moveTowardPlayer(playerX, playerY) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'rgba(255, 34, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    collidesWith(x, y, radius) {
        const dx = this.x - x;
        const dy = this.y - y;
        return Math.sqrt(dx * dx + dy * dy) < this.radius + radius;
    }
}

class Pitcher {
    constructor(x, y, canvasWidth, canvasHeight) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 60;
        this.color = '#2ecc71';
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.ammunition = 10;
        this.maxAmmunition = 10;
        this.reloadTimer = 0;
        this.reloadDelay = 2000;
        this.bombDirX = 0;
        this.bombDirY = 1;
        this.speed = 4;
        this.img = new Image();
        this.img.src = 'trala.jpg';
    }

    moveLeft()  { this.x = Math.max(0, this.x - this.speed); }
    moveRight() { this.x = Math.min(this.canvasWidth - this.width, this.x + this.speed); }
    moveUp()    { this.y = Math.max(0, this.y - this.speed); }
    moveDown()  { this.y = Math.min(this.canvasHeight - this.height, this.y + this.speed); }

    setBombDirection(dirX, dirY) {
        const len = Math.sqrt(dirX * dirX + dirY * dirY);
        if (len > 0) {
            this.bombDirX = dirX / len;
            this.bombDirY = dirY / len;
        }
    }

    update() {
        if (this.ammunition === 0 && this.reloadTimer < this.reloadDelay) {
            this.reloadTimer += 16;
            if (this.reloadTimer >= this.reloadDelay) {
                this.ammunition = this.maxAmmunition;
                this.reloadTimer = 0;
            }
        }
    }

    draw(ctx) {
        if (this.img.complete) {
            ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }

        // Draw aim direction arrow
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + this.bombDirX * 25, cy + this.bombDirY * 25);
        ctx.stroke();
    }

    collidesWith(x, y, radius) {
        return (
            x < this.x + this.width &&
            x + radius > this.x &&
            y < this.y + this.height &&
            y + radius > this.y
        );
    }
}

// ============================================
// Game Class
// ============================================

class BaseRunnerGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.pitcher = new Pitcher(
            this.canvas.width / 2 - 20,
            this.canvas.height - 80,
            this.canvas.width,
            this.canvas.height
        );

        this.balls = [];
        this.redDots = [];
        this.bombs = [];
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.gameRunning = false;
        this.ballsCaught = 0;
        this.ballsPerLevel = 10;
        this.spawnTimer = 0;
        this.spawnInterval = 180;
        this.levelUpTimer = 0; // frames between ball spawns

        this.keys = {};
        this.tiltActive = false;
        this.setupEventListeners();
        this.setupFullscreen();
        this.setupMobileControls();
        this.gameLoop();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;

            if (e.key === 'b' || e.key === 'B') {
                if (this.gameRunning) {
                    this.spawnBall();
                }
            }

            if (e.key === ' ') {
                e.preventDefault();
                if (this.gameRunning && this.pitcher.ammunition > 0) {
                    this.bombs.push(new Bomb(
                        this.pitcher.x + this.pitcher.width / 2,
                        this.pitcher.y + this.pitcher.height / 2,
                        this.pitcher.bombDirX,
                        this.pitcher.bombDirY
                    ));
                    this.pitcher.ammunition--;
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('musicBtn').addEventListener('click', () => this.toggleMusic());
    }

    setupMobileControls() {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            document.getElementById('mobile-hint').style.display = 'block';
        }

        // iOS 13+ requires a user gesture to access DeviceOrientation
        const tiltBtn = document.getElementById('tiltBtn');
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13+
            tiltBtn.style.display = 'inline-block';
            tiltBtn.addEventListener('click', () => {
                DeviceOrientationEvent.requestPermission().then((response) => {
                    if (response === 'granted') {
                        this.startTiltControls();
                        tiltBtn.textContent = '✓ Tilt On';
                        tiltBtn.disabled = true;
                    }
                }).catch(() => {
                    tiltBtn.textContent = '✗ Denied';
                });
            });
        } else if (isMobile) {
            // Android / older iOS — no permission needed
            this.startTiltControls();
            tiltBtn.style.display = 'none';
        }

        // Tap canvas to shoot in direction of tap relative to player
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.gameRunning) return;

            // Multi-touch: each touch fires a shot
            for (const touch of e.changedTouches) {
                if (this.pitcher.ammunition <= 0) break;
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.canvas.width / rect.width;
                const scaleY = this.canvas.height / rect.height;
                const tx = (touch.clientX - rect.left) * scaleX;
                const ty = (touch.clientY - rect.top) * scaleY;
                const px = this.pitcher.x + this.pitcher.width / 2;
                const py = this.pitcher.y + this.pitcher.height / 2;
                const dirX = tx - px;
                const dirY = ty - py;
                this.pitcher.setBombDirection(dirX, dirY);
                this.bombs.push(new Bomb(px, py, dirX, dirY));
                this.pitcher.ammunition--;
            }
        }, { passive: false });

        // Prevent page scroll while playing
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }

    startTiltControls() {
        this.tiltActive = true;
        const DEAD_ZONE = 4;
        const SENSITIVITY = 0.5;

        window.addEventListener('deviceorientation', (e) => {
            if (!this.gameRunning || !this.tiltActive) return;

            const gamma = e.gamma ?? 0; // left-right: negative = left
            const beta  = e.beta  ?? 0; // front-back: ~45-90° typical hold

            if (Math.abs(gamma) > DEAD_ZONE) {
                this.pitcher.x += gamma * SENSITIVITY;
                this.pitcher.x = Math.max(0, Math.min(
                    this.canvas.width - this.pitcher.width, this.pitcher.x
                ));
            }

            // Normalize beta around 60° (natural phone hold angle)
            const adjustedBeta = beta - 60;
            if (Math.abs(adjustedBeta) > DEAD_ZONE) {
                this.pitcher.y += adjustedBeta * SENSITIVITY;
                this.pitcher.y = Math.max(0, Math.min(
                    this.canvas.height - this.pitcher.height, this.pitcher.y
                ));
            }
        });
    }

    setupFullscreen() {
        const btn = document.getElementById('fullscreenBtn');
        const container = document.getElementById('game-container');

        btn.addEventListener('click', () => {
            container.classList.toggle('fullscreen-mode');
            const isFullscreen = container.classList.contains('fullscreen-mode');
            btn.textContent = isFullscreen ? '✕ Exit Fullscreen' : '⛶ Fullscreen';
            this.resizeCanvas();
        });

        window.addEventListener('resize', () => {
            if (document.getElementById('game-container').classList.contains('fullscreen-mode')) {
                this.resizeCanvas();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                container.classList.remove('fullscreen-mode');
                btn.textContent = '⛶ Fullscreen';
                this.resizeCanvas();
            }
        });
    }

    resizeCanvas() {
        const container = document.getElementById('game-container');
        const isFullscreen = container.classList.contains('fullscreen-mode');

        if (isFullscreen) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight - 50;
        } else {
            this.canvas.width = 800;
            this.canvas.height = 600;
        }

        // Update pitcher bounds
        this.pitcher.canvasWidth = this.canvas.width;
        this.pitcher.canvasHeight = this.canvas.height;
        // Clamp pitcher position inside new bounds
        this.pitcher.x = Math.min(this.pitcher.x, this.canvas.width - this.pitcher.width);
        this.pitcher.y = Math.min(this.pitcher.y, this.canvas.height - this.pitcher.height);
    }

    toggleMusic() {
        const audio = document.getElementById('bgMusic');
        const btn = document.getElementById('musicBtn');
        if (audio.paused) {
            audio.play().catch(() => {});
            btn.classList.add('playing');
        } else {
            audio.pause();
            btn.classList.remove('playing');
        }
    }

    start() {
        this.gameRunning = true;
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.ballsCaught = 0;
        this.balls = [];
        this.redDots = [];
        this.bombs = [];
        this.spawnTimer = 0;
        this.levelUpTimer = 0;
        this.pitcher = new Pitcher(
            this.canvas.width / 2 - 20,
            this.canvas.height - 80,
            this.canvas.width,
            this.canvas.height
        );

        document.getElementById('startBtn').textContent = 'Game Running...';
        document.getElementById('startBtn').disabled = true;

        // Spawn a couple balls immediately
        this.spawnBall();
        this.spawnBall();
    }

    spawnBall() {
        const x = Math.random() * (this.canvas.width - 60) + 30;
        const ball = new Ball(x, 30, this.canvas.width, this.canvas.height);
        // Scale ball speed with level
        ball.dx *= 1 + (this.level - 1) * 0.15;
        ball.gravity *= 1 + (this.level - 1) * 0.1;
        this.balls.push(ball);
    }

    update() {
        if (!this.gameRunning) return;

        // Movement
        if (this.keys['ArrowLeft']  || this.keys['a'] || this.keys['A']) this.pitcher.moveLeft();
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) this.pitcher.moveRight();
        if (this.keys['ArrowUp']    || this.keys['w'] || this.keys['W']) this.pitcher.moveUp();
        if (this.keys['ArrowDown']  || this.keys['s'] || this.keys['S']) this.pitcher.moveDown();

        // Aim direction from arrow keys
        let dirX = 0, dirY = 0;
        if (this.keys['ArrowLeft'])  dirX = -1;
        if (this.keys['ArrowRight']) dirX =  1;
        if (this.keys['ArrowUp'])    dirY = -1;
        if (this.keys['ArrowDown'])  dirY =  1;
        if (dirX !== 0 || dirY !== 0) this.pitcher.setBombDirection(dirX, dirY);

        this.pitcher.update();

        // Random ball spawning over time
        this.spawnTimer++;
        const interval = Math.max(60, this.spawnInterval - this.level * 10);
        if (this.spawnTimer >= interval && this.balls.length < 3 + this.level) {
            this.spawnTimer = 0;
            // Spawn 1-3 balls at once randomly
            const count = 1 + Math.floor(Math.random() * Math.min(3, this.level));
            for (let i = 0; i < count; i++) this.spawnBall();
        }

        // Update balls
        this.balls = this.balls.filter((ball) => {
            ball.move();

            if (ball.collidesWith(
                this.pitcher.x + this.pitcher.width / 2,
                this.pitcher.y + this.pitcher.height / 2,
                28
            )) {
                this.score += 10;
                this.ballsCaught++;
                ball.hit = true;
                this.checkLevelUp();
            }

            if (ball.onGround && !ball.hit) {
                const dot = new RedDot(ball.x, ball.y);
                dot.speed = 1.8 + (this.level - 1) * 0.3; // faster each level
                this.redDots.push(dot);
                ball.hit = true;
            }

            return !ball.hit;
        });

        // Update red dots
        this.redDots = this.redDots.filter((dot) => {
            dot.moveTowardPlayer(
                this.pitcher.x + this.pitcher.width / 2,
                this.pitcher.y + this.pitcher.height / 2
            );

            if (dot.collidesWith(
                this.pitcher.x + this.pitcher.width / 2,
                this.pitcher.y + this.pitcher.height / 2,
                22
            )) {
                this.lives--;
                return false;
            }

            return true;
        });

        // Update bombs
        this.bombs = this.bombs.filter((bomb) => {
            bomb.move();

            if (!bomb.explode) {
                bomb.checkCollisionWithBalls(this.balls);
                bomb.checkCollisionWithRedDots(this.redDots);
                bomb.checkGroundCollision(this.canvas.height);
            }

            if (bomb.explode) {
                const exp = bomb.getExplosionBounds();
                this.balls = this.balls.filter((ball) => {
                    const dx = ball.x - exp.x, dy = ball.y - exp.y;
                    if (Math.sqrt(dx * dx + dy * dy) < exp.radius) {
                        this.score += 25;
                        return false;
                    }
                    return true;
                });
                this.redDots = this.redDots.filter((dot) => {
                    const dx = dot.x - exp.x, dy = dot.y - exp.y;
                    if (Math.sqrt(dx * dx + dy * dy) < exp.radius) {
                        this.score += 15;
                        return false;
                    }
                    return true;
                });
                return !bomb.isExplosionDone();
            }

            return (
                bomb.x > -50 && bomb.x < this.canvas.width + 50 &&
                bomb.y < this.canvas.height + 50
            );
        });

        if (this.lives <= 0) this.gameOver();

        if (this.levelUpTimer > 0) this.levelUpTimer--;

        this.updateUI();
    }

    checkLevelUp() {
        if (this.ballsCaught % this.ballsPerLevel === 0 && this.ballsCaught > 0) {
            this.level++;
            this.ballsPerLevel = 10 + this.level * 2;
            this.levelUpTimer = 180; // show banner for 3 seconds
        }
    }

    draw() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87ceeb');
        gradient.addColorStop(0.5, '#e0f6ff');
        gradient.addColorStop(1, '#ffeb99');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#ffeb99';
        this.ctx.beginPath();
        this.ctx.arc(750, 50, 40, 0, Math.PI * 2);
        this.ctx.fill();

        this.pitcher.draw(this.ctx);
        this.balls.forEach((b) => b.draw(this.ctx));
        this.redDots.forEach((d) => d.draw(this.ctx));
        this.bombs.forEach((b) => b.draw(this.ctx));

        if (this.levelUpTimer > 0) this.drawLevelUpBanner();
        if (this.tiltActive && this.gameRunning) this.drawMobileHUD();
        if (!this.gameRunning && this.lives <= 0) this.drawGameOverScreen();
    }

    drawMobileHUD() {
        const pad = 14;
        const fSize = Math.max(16, Math.min(22, this.canvas.width / 36));
        this.ctx.save();
        this.ctx.font = `bold ${fSize}px Arial`;
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = 'rgba(0,0,0,0.45)';
        this.ctx.fillRect(0, 0, this.canvas.width, fSize + pad * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(
            `❤️ ${Math.max(0, this.lives)}   💣 ${this.pitcher.ammunition}/${this.pitcher.maxAmmunition}   ⭐ ${this.score}   Lv ${this.level}`,
            pad, fSize + pad
        );
        this.ctx.restore();
    }

    drawLevelUpBanner() {
        const alpha = Math.min(1, this.levelUpTimer / 30);
        const cy = this.canvas.height / 3;
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle = 'rgba(0,0,0,0.55)';
        this.ctx.fillRect(0, cy - 50, this.canvas.width, 90);
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = `bold ${Math.min(56, this.canvas.width / 14)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`LEVEL ${this.level}!`, this.canvas.width / 2, cy + 10);
        this.ctx.font = `${Math.min(22, this.canvas.width / 38)}px Arial`;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(
            `Balls faster • Dots faster • More spawns`,
            this.canvas.width / 2, cy + 38
        );
        this.ctx.restore();
    }

    drawGameOverScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 40);
        this.ctx.font = '24px Arial';
        this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
        this.ctx.fillText(`Level: ${this.level}`, this.canvas.width / 2, this.canvas.height / 2 + 60);
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lives').textContent = Math.max(0, this.lives);

        const progress = this.ballsCaught % this.ballsPerLevel;
        const percentage = (progress / this.ballsPerLevel) * 100;
        document.getElementById('progress-fill').style.width = `${percentage}%`;
        document.getElementById('progress-text').textContent = `${progress}/${this.ballsPerLevel}`;

        if (this.gameRunning) {
            let statusText = `Catch ${this.ballsPerLevel - progress} more to level up!`;
            if (this.pitcher.ammunition === 0) {
                const t = ((this.pitcher.reloadDelay - this.pitcher.reloadTimer) / 1000).toFixed(1);
                statusText = `RELOADING ${t}s... • ${statusText}`;
            } else {
                statusText = `Ammo: ${this.pitcher.ammunition} • ${statusText}`;
            }
            document.getElementById('gameStatus').textContent = statusText;
        }
    }

    gameOver() {
        this.gameRunning = false;
        document.getElementById('startBtn').textContent = 'Game Over - Start Again';
        document.getElementById('startBtn').disabled = false;
        document.getElementById('gameStatus').textContent = `Game Over! Score: ${this.score} | Level: ${this.level}`;
        document.getElementById('gameStatus').classList.add('status-warning');
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.addEventListener('load', () => {
    new BaseRunnerGame('gameCanvas');
});
