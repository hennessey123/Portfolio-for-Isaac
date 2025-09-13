// Simple musical illustration: wave + floating notes, tap to play

const canvas = document.getElementById('music-canvas');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

// Musical notes
const notes = [
    {x: 80, y: 60, freq: 261.63, symbol: '\u2669'}, // C
    {x: 180, y: 120, freq: 293.66, symbol: '\u266A'}, // D
    {x: 300, y: 80, freq: 329.63, symbol: '\u266B'}, // E
    {x: 420, y: 140, freq: 349.23, symbol: '\u266C'}, // F
    {x: 520, y: 60, freq: 392.00, symbol: '\u266A'}  // G
];

// Animate wave
let t = 0;
function drawWave() {
    ctx.save();
    ctx.strokeStyle = '#6fc2ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 4) {
        let y = height/2 + 24 * Math.sin((x/60) + t);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.shadowColor = '#6fc2ff';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();
}

function drawNotes() {
    for (let note of notes) {
        ctx.save();
        ctx.font = '32px serif';
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 12;
        ctx.fillText(note.symbol, note.x, note.y);
        ctx.restore();
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    drawWave();
    drawNotes();
    t += 0.03;
    requestAnimationFrame(animate);
}

animate();

// Play note on tap/click
canvas.addEventListener('click', function(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    for (let note of notes) {
        let dx = mx - note.x;
        let dy = my - note.y + 24; // adjust for font baseline
        if (Math.sqrt(dx*dx + dy*dy) < 28) {
            playNote(note.freq);
            break;
        }
    }
});

function playNote(freq) {
    const ctxAudio = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctxAudio.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(ctxAudio.destination);
    osc.start();
    osc.stop(ctxAudio.currentTime + 0.35);
    osc.onended = () => ctxAudio.close();
}
