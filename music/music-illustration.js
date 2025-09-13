// Download last arpeggiation as WAV on Return key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && lines.length > 0) {
        const lastLine = lines[lines.length-1];
        downloadArpeggiation(lastLine);
    }
});

function downloadArpeggiation(line) {
    if (!line || line.length === 0) return;
    // Calculate average x-distance for rhythm
    let totalDist = 0;
    for (let i = 1; i < line.length; i++) {
        totalDist += Math.abs(line[i].x - line[i-1].x);
    }
    let avgDist = line.length > 1 ? totalDist / (line.length-1) : 40;
    let interval = Math.max(60, Math.min(400, 800 - avgDist*2));
    // Render notes into audio buffer
    const sampleRate = 44100;
    const noteDuration = interval/1000; // seconds
    const totalDuration = noteDuration * line.length;
    const offlineCtx = new OfflineAudioContext(1, sampleRate * totalDuration, sampleRate);
    let time = 0;
    for (let i = 0; i < line.length; i++) {
        const osc = offlineCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = line[i].freq;
        const gain = offlineCtx.createGain();
        gain.gain.value = 0.3;
        osc.connect(gain).connect(offlineCtx.destination);
        osc.start(time);
        osc.stop(time + noteDuration);
        time += noteDuration;
    }
    offlineCtx.startRendering().then(function(renderedBuffer) {
        const wavData = audioBufferToWav(renderedBuffer);
        const blob = new Blob([wavData], {type: 'audio/wav'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'arpeggiation.wav';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    });
}

// Minimal WAV encoding for AudioBuffer
function audioBufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels,
        length = buffer.length * numOfChan * 2 + 44,
        bufferArray = new ArrayBuffer(length),
        view = new DataView(bufferArray),
        channels = [],
        sampleRate = buffer.sampleRate;
    let offset = 0;
    function writeString(str) {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
        offset += str.length;
    }
    writeString('RIFF'); offset += 4;
    view.setUint32(4, length - 8, true);
    writeString('WAVE'); offset += 4;
    writeString('fmt '); offset += 4;
    view.setUint32(16, 16, true); // PCM chunk size
    view.setUint16(20, 1, true); // format = PCM
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numOfChan * 2, true);
    view.setUint16(32, numOfChan * 2, true);
    view.setUint16(34, 16, true); // bits per sample
    writeString('data'); offset += 4;
    view.setUint32(40, length - 44, true);
    offset = 44;
    for (let i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }
    for (let i = 0; i < buffer.length; i++) {
        for (let c = 0; c < numOfChan; c++) {
            let sample = Math.max(-1, Math.min(1, channels[c][i]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }
    }
    return bufferArray;
}

// Interactive musical lines/arpeggiations
const canvas = document.getElementById('music-canvas');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

const noteSymbols = ['\u2669','\u266A','\u266B','\u266C','\u266A','\u266B','\u266C','\u2669','\u266A','\u266B','\u266C','\u266A','\u266B','\u266C'];
const noteFreqs = [261.63,293.66,329.63,349.23,392.00,440.00,493.88,523.25,587.33,659.25,698.46,783.99,880.00,987.77];


let lines = [];
let currentLine = null;
const palette = [
    '#6fc2ff', '#ff6f91', '#ffd700', '#7cffb2', '#ffb36f', '#b36fff', '#ff6fdc', '#6fffdc', '#ff7c6f', '#6fff7c', '#6f7cff', '#ff6f7c'
];
let colorIdx = 0;

function yToNote(y) {
    // Map y to note index (top = high, bottom = low)
    const idx = Math.max(0, Math.min(noteFreqs.length-1, Math.floor((height-y)/height * noteFreqs.length)));
    return {freq: noteFreqs[idx], symbol: noteSymbols[idx]};
}

// Optionally, snap to nearest note for clarity
function snapToNote(y) {
    const step = height / noteFreqs.length;
    const idx = Math.max(0, Math.min(noteFreqs.length-1, Math.floor((height-y)/step)));
    const snappedY = height - idx * step - step/2;
    return {freq: noteFreqs[idx], symbol: noteSymbols[idx], y: snappedY};
}


function drawLines() {
    for (let line of lines) {
        if (line.length < 2) continue;
        const color = line.color || '#6fc2ff';
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(line[0].x, line[0].y);
        for (let i = 1; i < line.length; i++) {
            ctx.lineTo(line[i].x, line[i].y);
        }
        ctx.stroke();
        ctx.restore();
        // Draw notes
        for (let pt of line) {
            ctx.save();
            ctx.font = '28px serif';
            ctx.globalAlpha = 0.95;
            ctx.fillStyle = color;
            ctx.shadowColor = color;
            ctx.shadowBlur = 10;
            ctx.fillText(pt.symbol, pt.x-12, pt.y+10);
            ctx.restore();
        }
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    drawLines();
    requestAnimationFrame(animate);
}

animate();

// Mouse interaction for drawing note lines


canvas.addEventListener('mousedown', function(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const note = snapToNote(my);
    const color = palette[colorIdx % palette.length];
    colorIdx++;
    currentLine = [{x: mx, y: note.y, freq: note.freq, symbol: note.symbol}];
    currentLine.color = color;
    lines.push(currentLine);
    canvas.isDrawing = true;
});

canvas.addEventListener('mousemove', function(e) {
    if (!canvas.isDrawing || !currentLine) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const note = snapToNote(my);
    const last = currentLine[currentLine.length-1];
    if (Math.abs(mx-last.x) > 8 || Math.abs(note.y-last.y) > 8) {
        currentLine.push({x: mx, y: note.y, freq: note.freq, symbol: note.symbol});
    }
});


canvas.addEventListener('mouseup', function(e) {
    canvas.isDrawing = false;
    if (currentLine && currentLine.length > 0) {
        playArpeggiation(currentLine);
    }
    currentLine = null;
});


function playArpeggiation(line) {
    if (!line || line.length === 0) return;
    // Calculate average x-distance between points
    let totalDist = 0;
    for (let i = 1; i < line.length; i++) {
        totalDist += Math.abs(line[i].x - line[i-1].x);
    }
    let avgDist = line.length > 1 ? totalDist / (line.length-1) : 40;
    // Map avgDist to interval: smaller = faster, larger = slower
    // Clamp interval between 60ms (fast) and 400ms (slow)
    let interval = Math.max(60, Math.min(400, 800 - avgDist*2));
    let idx = 0;
    function playNext() {
        if (idx >= line.length) return;
        playNote(line[idx].freq);
        idx++;
        setTimeout(playNext, interval);
    }
    playNext();
}
