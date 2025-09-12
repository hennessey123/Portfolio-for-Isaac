// chemistry-structure.js
// Simple chemistry-inspired structure animation for index.html

const canvas = document.getElementById('floating-shapes');
const ctx = canvas.getContext('2d');
let width = window.innerWidth;
let height = 400;
canvas.width = width;
canvas.height = height;

// Structure state
let points = [];
let lines = [];
let startTime = Date.now();
let rotation = 0;
let dragging = false;
let lastX = 0;

function drawPoint(x, y, color, radius = 10) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}

function drawLine(x1, y1, x2, y2, color) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();
}

function rotatePoint(px, py, angle, cx, cy) {
    // Rotate (px, py) around (cx, cy) by angle (radians)
    let s = Math.sin(angle);
    let c = Math.cos(angle);
    px -= cx;
    py -= cy;
    let xnew = px * c - py * s;
    let ynew = px * s + py * c;
    return [xnew + cx, ynew + cy];
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    let now = Date.now();
    let elapsed = (now - startTime) / 1000;
    let centerX = width / 2;
    let centerY = height / 2;

    // Step 1: Show single nucleus point for 5 seconds
    if (elapsed < 5) {
        let [x, y] = rotatePoint(centerX, centerY, rotation, centerX, centerY);
        drawPoint(x, y, '#FFD700', 16); // yellow nucleus
        requestAnimationFrame(animate);
        return;
    }

    // Step 2: Add first electron and line
    if (points.length === 0) {
        points.push({x: centerX, y: centerY, color: '#FFD700', radius: 16});
        let angle = Math.PI / 3;
        let ex = centerX + 80 * Math.cos(angle);
        let ey = centerY + 80 * Math.sin(angle);
        points.push({x: ex, y: ey, color: '#39FF14', radius: 10}); // green electron
        lines.push({from: 0, to: 1, color: '#39FF14'});
    }

    // Step 3: Add more electrons and lines over time
    let maxElectrons = Math.min(6, Math.floor((elapsed - 5) / 2) + 1);
    while (points.length < maxElectrons + 1) {
        let angle = Math.PI / 3 + (points.length - 1) * (2 * Math.PI / maxElectrons);
        let ex = centerX + 80 * Math.cos(angle);
        let ey = centerY + 80 * Math.sin(angle);
        points.push({x: ex, y: ey, color: '#39FF14', radius: 10});
        lines.push({from: 0, to: points.length - 1, color: '#39FF14'});
    }

    // Step 4: Draw all points and lines, with rotation
    for (let line of lines) {
        let p1 = points[line.from];
        let p2 = points[line.to];
        let [x1, y1] = rotatePoint(p1.x, p1.y, rotation, centerX, centerY);
        let [x2, y2] = rotatePoint(p2.x, p2.y, rotation, centerX, centerY);
        drawLine(x1, y1, x2, y2, line.color);
    }
    for (let i = 0; i < points.length; i++) {
        let p = points[i];
        let [x, y] = rotatePoint(p.x, p.y, rotation, centerX, centerY);
        drawPoint(x, y, p.color, p.radius);
    }

    // Step 5: Add neighboring atoms (simple)
    if (elapsed > 12) {
        let angle = Math.PI / 2;
        let ax = centerX + 160 * Math.cos(angle);
        let ay = centerY + 160 * Math.sin(angle);
        let [x, y] = rotatePoint(ax, ay, rotation, centerX, centerY);
        drawPoint(x, y, '#FFD700', 12); // neighboring nucleus
        drawLine(centerX, centerY, x, y, '#FFD700');
    }

    requestAnimationFrame(animate);
}

// Mouse/touch rotation
canvas.addEventListener('mousedown', function(e) {
    dragging = true;
    lastX = e.clientX;
});
canvas.addEventListener('mousemove', function(e) {
    if (dragging) {
        let dx = e.clientX - lastX;
        rotation += dx * 0.01;
        lastX = e.clientX;
    }
});
canvas.addEventListener('mouseup', function() {
    dragging = false;
});
canvas.addEventListener('mouseleave', function() {
    dragging = false;
});
canvas.addEventListener('touchstart', function(e) {
    dragging = true;
    lastX = e.touches[0].clientX;
});
canvas.addEventListener('touchmove', function(e) {
    if (dragging) {
        let dx = e.touches[0].clientX - lastX;
        rotation += dx * 0.01;
        lastX = e.touches[0].clientX;
    }
});
canvas.addEventListener('touchend', function() {
    dragging = false;
});

window.addEventListener('resize', function() {
    width = window.innerWidth;
    canvas.width = width;
    canvas.height = height;
});

animate();
