const canvas = document.getElementById('floating-shapes');
const ctx = canvas.getContext('2d');
let circles = [];
let particles = [];
let stars = [];
let drawing = false;
let startX = 0, startY = 0;
let mouseX = 0, mouseY = 0;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    generateStars();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Generate stars
function generateStars() {
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 1,
            brightness: Math.random(),
            twinkleSpeed: Math.random() * 0.02 + 0.01
        });
    }
}

// Gradient background
function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(0.5, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stars
    stars.forEach(star => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
        ctx.fill();
        ctx.restore();
        star.brightness += star.twinkleSpeed;
        if (star.brightness > 1 || star.brightness < 0) star.twinkleSpeed *= -1;
    });
}

// Draw floating circles and particles
function drawCircles() {
    drawBackground();
    // Draw particles
    particles.forEach(p => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.restore();

        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.005;
        if (p.alpha <= 0) particles.splice(particles.indexOf(p), 1);
    });

    circles.forEach(c => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, 2 * Math.PI);
        ctx.fillStyle = c.color;
        ctx.globalAlpha = 0.7;
        ctx.shadowColor = c.color;
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.restore();

        // Animate
        c.x += c.vx;
        c.y += c.vy;
        if(c.x < c.radius || c.x > canvas.width-c.radius) c.vx *= -1;
        if(c.y < c.radius || c.y > canvas.height-c.radius) c.vy *= -1;
    });
    requestAnimationFrame(drawCircles);
}
drawCircles();

// Mouse events
canvas.addEventListener('mousedown', e => {
    drawing = true;
    startX = e.offsetX;
    startY = e.offsetY;

    // Check if clicked on a circle (iterate backwards to safely remove)
    for (let i = circles.length - 1; i >= 0; i--) {
        const c = circles[i];
        if (Math.hypot(e.offsetX - c.x, e.offsetY - c.y) < c.radius) {
            explodeCircle(c);
            circles.splice(i, 1);
        }
    }
});
canvas.addEventListener('mouseup', e => {
    if(drawing) {
        let endX = e.offsetX, endY = e.offsetY;
        let radius = Math.max(10, Math.hypot(endX-startX, endY-startY)/2);
        let centerX = (startX + endX)/2;
        let centerY = (startY + endY)/2;
        let angle = Math.random() * 2 * Math.PI;
        let speed = 1 + Math.random()*2;
        let color = `hsl(${Math.floor(Math.random()*360)},80%,60%)`;
        circles.push({
            x: centerX,
            y: centerY,
            radius,
            color,
            vx: Math.cos(angle)*speed,
            vy: Math.sin(angle)*speed
        });
    }
    drawing = false;
});

// Explode circle into particles
function explodeCircle(circle) {
    for (let i = 0; i < 40; i++) {
        let angle = (Math.PI * 2 * i) / 40;
        let speed = Math.random() * 8 + 3;
        particles.push({
            x: circle.x,
            y: circle.y,
            size: Math.random() * 6 + 3,
            color: circle.color,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1
        });
    }
}

// Keyboard interactions
document.addEventListener('keydown', e => {
    if (e.key === ' ') {
        // Space: clear all circles
        circles = [];
    } else if (e.key === 'b') {
        // B: burst of particles
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 5 + 1,
                color: `hsl(${Math.floor(Math.random()*360)},100%,70%)`,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                alpha: 1
            });
        }
    }
});