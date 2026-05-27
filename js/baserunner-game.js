// ============================================
// BaseRunner Game - JavaScript Port
// ============================================

class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.dx = 2;
        this.dy = Math.random() * 2 - 1;
        this.radius = 15;
        this.sideRight = true;
        this.hit = false;
        this.color = '#ff6b6b';
    }

    move() {
        if (this.sideRight) {
            this.x += this.dx;
        } else {
            this.x -= this.dx;
        }
        this.y += Math.cos(this.x * 0.05) * 0.5;

        // Bounce off walls
        if (this.x > canvas.width) {
            this.sideRight = false;
            this.x = canvas.width;
        } else if (this.x < 0) {
            this.sideRight = true;
            this.x = 0;
        }

        // Bounce off top/bottom
        if (this.y < 0) this.y = 0;
        if (this.y > canvas.height) this.hit = true;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Add shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - 5, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    collidesWith(x, y, radius) {
        const dx = this.x - x;
        const dy = this.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + radius;
    }
}

class Bomb {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.dy = 3;
        this.radius = 12;
        this.explode = false;
        this.explodeRadius = 0;
        this.maxExplodeRadius = 100;
        this.color = '#000000';
    }

    move() {
        if (!this.explode) {
            this.y += this.dy;

            if (this.y > canvas.height) {
                this.explode = true;
            }
        }
    }

    draw(ctx) {
        if (!this.explode) {
            // Draw bomb
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Draw fuse
            ctx.strokeStyle = '#8b4513';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.radius);
            ctx.lineTo(this.x, this.y - this.radius - 10);
            ctx.stroke();

            // Draw spark
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(this.x, this.y - this.radius - 10, 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Draw explosion
            ctx.fillStyle = `rgba(255, 100, 0, ${1 - (this.explodeRadius / this.maxExplodeRadius)})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.explodeRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = `rgba(255, 200, 0, ${1 - (this.explodeRadius / this.maxExplodeRadius)})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.explodeRadius, 0, Math.PI * 2);
            ctx.stroke();

            this.explodeRadius += 3;
        }
    }

    isExplosionDone() {
        return this.explodeRadius > this.maxExplodeRadius;
    }

    getExplosionBounds() {
        return {
            x: this.x,
            y: this.y,
            radius: this.explodeRadius
        };
    }
}

class Pitcher {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.dy = 0;
        this.jumpPower = -15;
        this.gravity = 0.5;
        this.groundY = y;
        this.jumping = false;
        this.color = '#2ecc71';
    }

    moveLeft() {
        this.x = Math.max(0, this.x - 20);
    }

    moveRight() {
        this.x = Math.min(canvas.width - this.width, this.x + 20);
    }

    jump() {
        if (!this.jumping) {
            this.dy = this.jumpPower;
            this.jumping = true;
        }
    }

    update() {
        // Apply gravity
        this.dy += this.gravity;
        this.y += this.dy;

        // Ground collision
        if (this.y >= this.groundY) {
            this.y = this.groundY;
            this.dy = 0;
            this.jumping = false;
        }
    }

    draw(ctx) {
        // Body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Head
        ctx.fillStyle = '#ffdbac';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y - 10, 12, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2 - 5, this.y - 12, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2 + 5, this.y - 12, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    collidesWith(x, y, radius) {
        return (
            x < this.x + this.width &&
            x + radius > this.x &&
            y < this.y + this.height &&
            y + radius > this.y
        );
    }

    getBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
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
            this.canvas.height - 80
        );

        this.balls = [];
        this.bombs = [];
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.gameRunning = false;
        this.ballsCaught = 0;
        this.ballsPerLevel = 10;

        this.keys = {};
        this.setupEventListeners();

        this.gameLoop();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;

            if (e.key === 'b' || e.key === 'B') {
                if (this.gameRunning) {
                    this.balls.push(
                        new Ball(Math.random() * this.canvas.width, 50)
                    );
                }
            }

            if (e.key === 'n' || e.key === 'N') {
                if (this.gameRunning) {
                    this.bombs.push(new Bomb(this.pitcher.x + 20, this.pitcher.y));
                }
            }

            if (e.key === ' ') {
                e.preventDefault();
                if (this.gameRunning) {
                    this.pitcher.jump();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        document.getElementById('startBtn').addEventListener('click', () => {
            this.start();
        });

        document.getElementById('musicBtn').addEventListener('click', () => {
            this.toggleMusic();
        });
    }

    toggleMusic() {
        const audio = document.getElementById('bgMusic');
        const btn = document.getElementById('musicBtn');

        if (audio.paused) {
            audio.play().catch(() => {
                console.log('Music play failed - no audio source provided');
            });
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
        this.bombs = [];
        this.pitcher = new Pitcher(
            this.canvas.width / 2 - 20,
            this.canvas.height - 80
        );

        document.getElementById('startBtn').textContent = 'Game Running...';
        document.getElementById('startBtn').disabled = true;

        // Spawn initial balls
        this.spawnBall();
    }

    spawnBall() {
        if (this.gameRunning && this.balls.length < 3 + this.level) {
            setTimeout(() => {
                this.balls.push(
                    new Ball(
                        Math.random() > 0.5 ? 0 : this.canvas.width,
                        Math.random() * (this.canvas.height - 150) + 50
                    )
                );
                this.spawnBall();
            }, 2000 / this.level);
        }
    }

    update() {
        if (!this.gameRunning) return;

        // Handle pitcher input
        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            this.pitcher.moveLeft();
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            this.pitcher.moveRight();
        }

        // Update pitcher
        this.pitcher.update();

        // Update balls
        this.balls = this.balls.filter((ball) => {
            ball.move();

            // Pitcher catches ball
            if (ball.collidesWith(
                this.pitcher.x + 20,
                this.pitcher.y,
                30
            )) {
                this.score += 10;
                this.ballsCaught++;
                ball.hit = true;
                this.checkLevelUp();
            }

            // Ball goes off screen
            if (ball.hit || ball.y > this.canvas.height + 50) {
                if (!ball.hit) this.lives--;
            }

            return !ball.hit && ball.y < this.canvas.height + 50;
        });

        // Update bombs
        this.bombs = this.bombs.filter((bomb) => {
            bomb.move();

            // Explode collision with balls
            if (bomb.explode) {
                const explosion = bomb.getExplosionBounds();
                this.balls = this.balls.filter((ball) => {
                    const dx = ball.x - explosion.x;
                    const dy = ball.y - explosion.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < explosion.radius) {
                        this.score += 25; // Bonus for destroying with bomb
                        return false;
                    }
                    return true;
                });

                return !bomb.isExplosionDone();
            }

            return bomb.y < this.canvas.height + 50;
        });

        // Check game over
        if (this.lives <= 0) {
            this.gameOver();
        }

        // Spawn balls based on level
        if (this.balls.length < 2 + Math.floor(this.level / 2)) {
            this.spawnBall();
        }

        this.updateUI();
    }

    checkLevelUp() {
        if (this.ballsCaught % this.ballsPerLevel === 0 && this.ballsCaught > 0) {
            this.level++;
            this.ballsPerLevel = 10 + this.level * 2;
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#87ceeb';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87ceeb');
        gradient.addColorStop(0.5, '#e0f6ff');
        gradient.addColorStop(1, '#ffeb99');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw sun
        this.ctx.fillStyle = '#ffeb99';
        this.ctx.beginPath();
        this.ctx.arc(750, 50, 40, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw game objects
        this.pitcher.draw(this.ctx);

        this.balls.forEach((ball) => {
            ball.draw(this.ctx);
        });

        this.bombs.forEach((bomb) => {
            bomb.draw(this.ctx);
        });

        // Draw UI overlays
        if (!this.gameRunning && this.lives <= 0) {
            this.drawGameOverScreen();
        }
    }

    drawGameOverScreen() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Game Over text
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
            document.getElementById('gameStatus').textContent = `Level ${this.level} • Catch ${this.ballsPerLevel - progress} more balls to level up!`;
        }
    }

    gameOver() {
        this.gameRunning = false;
        document.getElementById('startBtn').textContent = 'Game Over - Start Again';
        document.getElementById('startBtn').disabled = false;
        document.getElementById('gameStatus').textContent = `Game Over! Final Score: ${this.score} | Level: ${this.level}`;
        document.getElementById('gameStatus').classList.add('status-warning');
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// ============================================
// Initialize Game
// ============================================

window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new BaseRunnerGame('gameCanvas');
});
