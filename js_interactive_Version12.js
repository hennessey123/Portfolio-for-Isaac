const canvas = document.getElementById('floating-shapes');
const ctx = canvas.getContext('2d');
let circles = [];
let drawing = false;
let startX = 0, startY = 0;

// Blue cursor ball state
let cursorX = null, cursorY = null;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Draw floating circles
function drawCircles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    // Draw blue cursor ball if mouse is on page
    if (cursorX !== null && cursorY !== null) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cursorX, cursorY, 11, 0, 2 * Math.PI);
        ctx.strokeStyle = '#44baff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#44baff';
        ctx.shadowBlur = 16;
        ctx.globalAlpha = 0.95;
        ctx.stroke();
        ctx.restore();
    }
    requestAnimationFrame(drawCircles);
}
drawCircles();

// Mouse events
canvas.addEventListener('mousedown', e => {
    drawing = true;
    startX = e.offsetX;
    startY = e.offsetY;
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

// Track mouse for blue cursor ball
document.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    // Use clientX/clientY relative to viewport, minus rect.left/top
    // Also account for page scroll
    cursorX = e.clientX - rect.left;
    cursorY = e.clientY - rect.top;
});
document.addEventListener('mouseleave', e => {
    cursorX = null;
    cursorY = null;
});