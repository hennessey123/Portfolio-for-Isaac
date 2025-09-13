
// chemistry-structure.js (simplified)
// Mini atoms floating, electrons spinning around green nuclei, non-intrusive

const canvas = document.getElementById('floating-shapes');
const ctx = canvas.getContext('2d');
let width = window.innerWidth;
let height = 120; // Small height to avoid interfering with content
canvas.width = width;
canvas.height = height;

const ATOM_COUNT = 6;
const ATOM_RADIUS = 14;
const ELECTRON_RADIUS = 4;
const ELECTRON_ORBIT = 22;
const ELECTRON_COUNT = 4;

// Each atom floats with a random speed and direction
let atoms = Array.from({length: ATOM_COUNT}, (_, i) => {
    let angle = Math.random() * 2 * Math.PI;
    let speed = 0.2 + Math.random() * 0.3;
    let x = 40 + Math.random() * (width - 80);
    let y = 20 + Math.random() * (height - 40);
    let electronsPhase = Math.random() * 2 * Math.PI;
    return {x, y, angle, speed, electronsPhase};
});

function drawAtom(atom, time) {
    // Draw nucleus
    ctx.save();
    ctx.beginPath();
    ctx.arc(atom.x, atom.y, ATOM_RADIUS, 0, 2 * Math.PI);
    ctx.shadowColor = '#39FF14';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#39FF14';
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.restore();
    // Draw electrons
    for (let i = 0; i < ELECTRON_COUNT; i++) {
        let phase = atom.electronsPhase + time * 1.2 + i * (2 * Math.PI / ELECTRON_COUNT);
        let ex = atom.x + ELECTRON_ORBIT * Math.cos(phase);
        let ey = atom.y + ELECTRON_ORBIT * Math.sin(phase);
        ctx.save();
        ctx.beginPath();
        ctx.arc(ex, ey, ELECTRON_RADIUS, 0, 2 * Math.PI);
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#FFD700';
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.restore();
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    let time = Date.now() * 0.002;
    for (let atom of atoms) {
        // Move atom
        atom.x += Math.cos(atom.angle) * atom.speed;
        atom.y += Math.sin(atom.angle) * atom.speed;
        // Bounce off edges
        if (atom.x < ATOM_RADIUS || atom.x > width - ATOM_RADIUS) atom.angle = Math.PI - atom.angle;
        if (atom.y < ATOM_RADIUS || atom.y > height - ATOM_RADIUS) atom.angle = -atom.angle;
        drawAtom(atom, time);
    }
    requestAnimationFrame(animate);
}

window.addEventListener('resize', function() {
    width = window.innerWidth;
    canvas.width = width;
    canvas.height = height;
});

animate();
