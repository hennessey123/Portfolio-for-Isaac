// ============================================
// BaseRunner Game - JavaScript Port
// ============================================

class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.dy = 2; // will be updated by level
        this.radius = 15;
        this.hit = false;
        this.color = '#ff6b6b';
    }

    move() {
        this.y += this.dy;
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
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + radius;
    }
}

class Bomb {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.dy = -8; // Move UP!
        this.radius = 12;
        this.explode = false;
        this.explodeRadius = 0;
        this.maxExplodeRadius = 100;
        this.color = '#000000';
        this.targetY = y - 150 - Math.random() * 200; // Explode after travelling up
    }

    move() {
        if (!this.explode) {
            this.y += this.dy;
            if (this.y < this.targetY || this.y < 50) {
                this.explode = true;
            }
        }
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
            ctx.fillStyle = `rgba(255, 100, 0, ${1 - (this.explodeRadius / this.maxExplodeRadius)})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.explodeRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = `rgba(255, 200, 0, ${1 - (this.explodeRadius / this.maxExplodeRadius)})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.explodeRadius, 0, Math.PI * 2);
            ctx.stroke();

            this.explodeRadius += 4;
        }
    }

    isExplosionDone() {
        return this.explodeRadius > this.maxExplodeRadius;
    }

    getExplosionBounds() {
        return { x: this.x, y: this.y, radius: this.explodeRadius };
    }
}

class Croc {
    constructor(canvasWidth) {
        this.width = 80;
        this.height = 80;
        this.x = canvasWidth / 2 - this.width / 2;
        this.y = 20;
        this.dx = 4;
        this.image = new Image();
        this.image.src = 'croc.jpg';
    }

    move(canvasWidth) {
        this.x += this.dx;
        if (this.x <= 0 || this.x + this.width >= canvasWidth) {
            this.dx *= -1;
        }
    }

    draw(ctx) {
        if (this.image.complete && this.image.naturalWidth !== 0) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#006400';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

class Pitcher {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 80;
        this.dy = 0;
        this.jumpPower = -15;
        this.gravity = 0.5;
        this.groundY = y;
        this.jumping = false;
        this.image = new Image();
        this.image.src = 'trala.jpg';
    }

    moveLeft() {
        this.x = Math.max(0, this.x - 10);
    }

    moveRight(canvasWidth) {
        this.x = Math.min(canvasWidth - this.width, this.x + 10);
    }

    jump() {
        if (!this.jumping) {
            this.dy = this.jumpPower;
            this.jumping = true;
        }
    }

    update() {
        this.dy += this.gravity;
        this.y += this.dy;
        if (this.y >= this.groundY) {
            this.y = this.groundY;
            this.dy = 0;
            this.jumping = false;
        }
    }

    draw(ctx) {
        if (this.image.complete && this.image.naturalWidth !== 0) {
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }

    collidesWith(x, y, radius) {
        return (
            x + radius > this.x &&
            x - radius < this.x + this.width &&
            y + radius > this.y &&
            y - radius < this.y + this.height
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
            this.canvas.width / 2 - 30,
            this.canvas.height - 100
        );
        this.croc = new Croc(this.canvas.width);

        this.balls = [];
        this.bombs = [];
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.gameRunning = false;
        this.ballsDestroyed = 0;
        this.ballsPerLevel = 10;

        this.keys = {};
        this.setupEventListeners();

        this.gameLoop();
    }

    setupEventListeners() {
        this.canvas.tabIndex = 1000;
        this.canvas.focus();

        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;

            if (e.key === 'b' || e.key === 'B') {
                if (this.gameRunning) {
                    this.spawnSingleBall();
                }
            }

            if (e.key === 'n' || e.key === 'N') {
                if (this.gameRunning) {
                    this.bombs.push(new Bomb(this.pitcher.x + this.pitcher.width / 2, this.pitcher.y));
                }
            }

            if (e.key === ' ') {
                e.preventDefault();
                if (this.gameRunning) {
                    this.pitcher.jump();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        document.getElementById('startBtn').addEventListener('click', (e) => {
            this.start();
            e.target.blur(); 
            window.focus();
        });

        document.getElementById('musicBtn').addEventListener('click', (e) => {
            this.toggleMusic();
            e.target.blur();
            window.focus();
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
        this.ballsDestroyed = 0;
        this.balls = [];
        this.bombs = [];
        this.pitcher = new Pitcher(
            this.canvas.width / 2 - 30,
            this.canvas.height - 100
        );
        this.croc = new Croc(this.canvas.width);

        document.getElementById('startBtn').textContent = 'Game Running...';
        document.getElementById('startBtn').disabled = true;

        this.spawnBall();
    }

    spawnSingleBall() {
        let ball = new Ball(this.croc.x + this.croc.width / 2, this.croc.y + this.croc.height);
        ball.dy = 2 + (this.level * 0.5);
        this.balls.push(ball);
    }

    spawnBall() {
        if (this.gameRunning) {
            setTimeout(() => {
                if (this.gameRunning && this.balls.length < 3 + this.level) {
                    this.spawnSingleBall();
                }
                this.spawnBall();
            }, Math.max(800, 2000 - (this.level * 200)));
        }
    }

    update() {
        if (!this.gameRunning) return;

        if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
            this.pitcher.moveLeft();
        }
        if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
            this.pitcher.moveRight(this.canvas.width);
        }

        this.pitcher.update();
        this.croc.move(this.canvas.width);

        // Update balls
        this.balls = this.balls.filter((ball) => {
            ball.move();

            // Pitcher gets hit by ball -> lose life
            if (this.pitcher.collidesWith(ball.x, ball.y, ball.radius)) {
                this.lives--;
                ball.hit = true;
            }

            // Ball hits ground -> lose life
            if (ball.y > this.canvas.height - 10 && !ball.hit) {
                this.lives--;
                ball.hit = true;
            }

            return !ball.hit && ball.y < this.canvas.height + 50;
        });

        // Update bombs
        this.bombs = this.bombs.filter((bomb) => {
            bomb.move();

            if (bomb.explode) {
                const explosion = bomb.getExplosionBounds();
                this.balls = this.balls.filter((ball) => {
                    const dx = ball.x - explosion.x;
                    const dy = ball.y - explosion.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < explosion.radius) {
                        this.score += 25;
                        this.ballsDestroyed++;
                        this.checkLevelUp();
                        return false;
                    }
                    return true;
                });

                return !bomb.isExplosionDone();
            }

            return bomb.y > -50 && bomb.y < this.canvas.height + 50;
        });

        if (this.lives <= 0) {
            this.gameOver();
        }

        this.updateUI();
    }

    checkLevelUp() {
        if (this.ballsDestroyed % this.ballsPerLevel === 0 && this.ballsDestroyed > 0) {
            this.level++;
            this.ballsPerLevel = 10 + this.level * 2;
        }
    }

    draw() {
        this.ctx.fillStyle = '#87ceeb';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

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

        this.croc.draw(this.ctx);
        this.pitcher.draw(this.ctx);

        this.balls.forEach((ball) => {
            ball.draw(this.ctx);
        });

        this.bombs.forEach((bomb) => {
            bomb.draw(this.ctx);
        });

        if (!this.gameRunning && this.lives <= 0) {
            this.drawGameOverScreen();
        }
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

        const progress = this.ballsDestroyed % this.ballsPerLevel;
        const percentage = (progress / this.ballsPerLevel) * 100;
        document.getElementById('progress-fill').style.width = `${percentage}%`;
        document.getElementById('progress-text').textContent = `${progress}/${this.ballsPerLevel}`;

        if (this.gameRunning) {
            document.getElementById('gameStatus').textContent = `Level ${this.level} • Destroy ${this.ballsPerLevel - progress} more balls to level up!`;
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

window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new BaseRunnerGame('gameCanvas');
});
