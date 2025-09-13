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

// Interactive musical wave
const canvas = document.getElementById('music-canvas');
const ctx = canvas.getContext('2d');
const width = canvas.width;
const height = canvas.height;

let isDrawing = false;
let waveParams = null; // { amplitude, wavelength, color }
let osc = null;
let rhythmTimer = null;
const baseColor = '#6fc2ff';

function drawWave(amplitude, wavelength, color) {
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = color || baseColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 2) {
        let y = height/2 + amplitude * Math.sin((x / wavelength) * 2 * Math.PI);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.shadowColor = color || baseColor;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();
}

function animate() {
    if (waveParams) {
        drawWave(waveParams.amplitude, waveParams.wavelength, waveParams.color);
    } else {
        ctx.clearRect(0, 0, width, height);
    }
    requestAnimationFrame(animate);
}

animate();
animate();


canvas.addEventListener('mousedown', function(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    // Start with default amplitude and wavelength
    waveParams = {
        amplitude: 40,
        wavelength: 80,
        color: baseColor
    };
    startRhythm();
});

canvas.addEventListener('mousemove', function(e) {
    if (!isDrawing || !waveParams) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    // Wavelength based on horizontal drag distance, amplitude on vertical
    let dragX = Math.max(20, Math.abs(mx - width/2));
    let dragY = Math.max(20, Math.abs(my - height/2));
    waveParams.wavelength = Math.max(20, Math.min(300, dragX));
    waveParams.amplitude = Math.max(10, Math.min(80, dragY));
    updateRhythm();
});

canvas.addEventListener('mouseup', function(e) {
    isDrawing = false;
    stopRhythm();
    waveParams = null;
});

function startRhythm() {
    stopRhythm();
    if (!waveParams) return;
    // Map wavelength to rhythm interval (shorter = faster)
    let interval = Math.max(60, Math.min(400, waveParams.wavelength * 1.5));
    osc = new (window.AudioContext || window.webkitAudioContext)();
    let playTick = () => {
        let o = osc.createOscillator();
        o.type = 'sine';
        o.frequency.value = 392; // G4
        let g = osc.createGain();
        g.gain.value = 0.25;
        o.connect(g).connect(osc.destination);
        o.start();
        o.stop(osc.currentTime + 0.18);
        rhythmTimer = setTimeout(playTick, interval);
    };
    playTick();
}

function updateRhythm() {
    if (!isDrawing || !waveParams) return;
    stopRhythm();
    startRhythm();
}

function stopRhythm() {
    if (rhythmTimer) clearTimeout(rhythmTimer);
    rhythmTimer = null;
    if (osc) {
        osc.close();
        osc = null;
    }
}


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
