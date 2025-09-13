// Simple musical illustration: wave + floating notes, tap to play

const canvas = document.getElementById('music-canvas');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

// Musical notes
const notes = [];
const noteSymbols = ['\u2669','\u266A','\u266B','\u266C','\u266A','\u266B','\u266C','\u2669','\u266A','\u266B','\u266C','\u266A','\u266B','\u266C'];
const noteFreqs = [261.63,293.66,329.63,349.23,392.00,440.00,493.88,523.25,587.33,659.25,698.46,783.99,880.00,987.77];
for (let i = 0; i < noteSymbols.length; i++) {
    let angle = Math.PI * 2 * (i / noteSymbols.length);
    let radius = 60 + 40 * Math.sin(i * 1.2);
    let x = 80 + 220 + Math.cos(angle) * radius + Math.random()*30;
    let y = 90 + Math.sin(angle) * radius + Math.random()*30;
    notes.push({x, y, freq: noteFreqs[i % noteFreqs.length], symbol: noteSymbols[i]});
}

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
