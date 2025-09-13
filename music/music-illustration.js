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


function drawWave(amplitude, wavelength, color, yOffset=0, xOffset=0) {
    ctx.save();
    ctx.strokeStyle = color || palette[0];
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 2) {
        let y = height/2 + yOffset + amplitude * Math.sin(((x + xOffset) / wavelength) * 2 * Math.PI);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.shadowColor = color || palette[0];
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();
// ...existing code...

function drawCursor() {
    if (!cursorPos) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cursorPos.x, cursorPos.y, 10, 0, 2 * Math.PI);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();
}
// ...existing code...

function yToPianoFreq(y) {
    // Piano key frequencies (C4 to C5, 13 notes including sharps)
    const pianoKeys = [
        {name: 'C4', freq: 261.63},
        {name: 'C#4', freq: 277.18},
        {name: 'D4', freq: 293.66},
        {name: 'D#4', freq: 311.13},
        {name: 'E4', freq: 329.63},
        {name: 'F4', freq: 349.23},
        {name: 'F#4', freq: 369.99},
        {name: 'G4', freq: 392.00},
        {name: 'G#4', freq: 415.30},
        {name: 'A4', freq: 440.00},
        {name: 'A#4', freq: 466.16},
        {name: 'B4', freq: 493.88},
        {name: 'C5', freq: 523.25}
    ];
    const idx = Math.max(0, Math.min(pianoKeys.length-1, Math.floor((height-y)/height * pianoKeys.length)));
    return pianoKeys[idx].freq;
}
// ...existing code...

function animate() {
    ctx.clearRect(0, 0, width, height);
    let stackOffset = -60 * (waves.length-1)/2;
    waves.forEach((wave, i) => {
        // Animate horizontal offset after release
        if (!wave.xOffset) wave.xOffset = 0;
        if (!wave.isDrawing) wave.xOffset += 0.8 * (i%2===0 ? 1 : -1); // move left/right
        // If note is not fixed, update freq based on current vertical position
        if (!wave.fixedNote) {
            let y = height/2 + stackOffset + i*60;
            wave.freq = yToPianoFreq(y);
        }
        drawWave(wave.amplitude, wave.wavelength, wave.color, stackOffset + i*60, wave.xOffset);
    });
    drawCursor();
    requestAnimationFrame(animate);
}

animate();

// Render wave controls below canvas
function renderWaveControls() {
    let controlsDiv = document.getElementById('wave-controls');
    if (!controlsDiv) {
        controlsDiv = document.createElement('div');
        controlsDiv.id = 'wave-controls';
        controlsDiv.style.marginTop = '18px';
        controlsDiv.style.display = 'flex';
        controlsDiv.style.flexDirection = 'column';
        controlsDiv.style.gap = '10px';
        canvas.parentNode.insertBefore(controlsDiv, canvas.nextSibling);
    }
    controlsDiv.innerHTML = '';
    waves.forEach((wave, i) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '10px';
        row.style.marginBottom = '2px';
        // Color indicator
        const colorDot = document.createElement('span');
        colorDot.style.display = 'inline-block';
        colorDot.style.width = '18px';
        colorDot.style.height = '18px';
        colorDot.style.borderRadius = '50%';
        colorDot.style.background = wave.color;
        row.appendChild(colorDot);
        // Label
        const label = document.createElement('span');
        label.textContent = `Wave ${i+1}`;
        label.style.color = wave.color;
        label.style.fontWeight = 'bold';
        row.appendChild(label);
        // Show current note name
        const pianoKeys = [
            {name: 'C4', freq: 261.63},
            {name: 'C#4', freq: 277.18},
            {name: 'D4', freq: 293.66},
            {name: 'D#4', freq: 311.13},
            {name: 'E4', freq: 329.63},
            {name: 'F4', freq: 349.23},
            {name: 'F#4', freq: 369.99},
            {name: 'G4', freq: 392.00},
            {name: 'G#4', freq: 415.30},
            {name: 'A4', freq: 440.00},
            {name: 'A#4', freq: 466.16},
            {name: 'B4', freq: 493.88},
            {name: 'C5', freq: 523.25}
        ];
        let noteName = pianoKeys.reduce((best, key) => Math.abs(key.freq - wave.freq) < Math.abs(best.freq - wave.freq) ? key : best, pianoKeys[0]).name;
        const noteLabel = document.createElement('span');
        noteLabel.textContent = `Note: ${noteName}`;
        noteLabel.style.color = wave.color;
        noteLabel.style.fontWeight = 'bold';
        row.appendChild(noteLabel);
        // Instrument dropdown
        const instrumentSelect = document.createElement('select');
        instrumentSelect.style.background = '#222';
        instrumentSelect.style.color = wave.color;
        instrumentSelect.style.border = '1px solid ' + wave.color;
        instrumentSelect.style.borderRadius = '6px';
        instrumentSelect.style.padding = '2px 10px';
        ['Sine (Piano)', 'Violin'].forEach((name, idx) => {
            const opt = document.createElement('option');
            opt.value = idx === 0 ? 'sine' : 'triangle';
            opt.textContent = name;
            if (!wave.instrument && idx === 0) opt.selected = true;
            if (wave.instrument === opt.value) opt.selected = true;
            instrumentSelect.appendChild(opt);
        });
        instrumentSelect.onchange = () => {
            wave.instrument = instrumentSelect.value;
        };
        row.appendChild(instrumentSelect);
        // Play button
        const playBtn = document.createElement('button');
        playBtn.textContent = 'Play';
        playBtn.style.background = '#222';
        playBtn.style.color = wave.color;
        playBtn.style.border = '1px solid ' + wave.color;
        playBtn.style.borderRadius = '6px';
        playBtn.style.padding = '2px 10px';
        playBtn.onclick = () => playSingleNote(wave);
        row.appendChild(playBtn);
        // Delete button
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.style.background = '#222';
        delBtn.style.color = '#fff';
        delBtn.style.border = '1px solid #888';
        delBtn.style.borderRadius = '6px';
        delBtn.style.padding = '2px 10px';
        delBtn.onclick = () => deleteWave(i);
        row.appendChild(delBtn);
        controlsDiv.appendChild(row);
    });
}

function playSingleNote(wave) {
    const ctxAudio = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctxAudio.createOscillator();
    osc.type = wave.instrument || 'sine';
    osc.frequency.value = 392;
    const gain = ctxAudio.createGain();
    gain.gain.value = 0.35;
    osc.connect(gain).connect(ctxAudio.destination);
    osc.start();
    osc.stop(ctxAudio.currentTime + 0.35);
    osc.onended = () => ctxAudio.close();
}

function deleteWave(idx) {
    if (waves[idx]) {
        stopRhythm(waves[idx]);
        waves.splice(idx, 1);
        renderWaveControls();
    }

setInterval(renderWaveControls, 300);
animate();
}




canvas.addEventListener('mousedown', function(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    cursorPos = {x: mx, y: my};
    // Start with default amplitude and wavelength
    const color = palette[colorIdx % palette.length];
    colorIdx++;
    currentWave = {
        amplitude: 40,
        wavelength: 80,
        color,
        isPlaying: true,
        osc: null,
        rhythmTimer: null
    };
    waves.push(currentWave);
    startRhythm(currentWave);
});


canvas.addEventListener('mousemove', function(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    cursorPos = {x: mx, y: my};
    if (!currentWave || !currentWave.isPlaying) return;
    let dragX = Math.max(20, Math.abs(mx - width/2));
    let dragY = Math.max(20, Math.abs(my - height/2));
    currentWave.wavelength = Math.max(20, Math.min(300, dragX));
    currentWave.amplitude = Math.max(10, Math.min(80, dragY));
    updateRhythm(currentWave);
});



canvas.addEventListener('mouseup', function(e) {
    cursorPos = null;
    if (!currentWave) return;
    // Do not stop rhythm; let it continue playing
    currentWave.isPlaying = true;
    currentWave = null;
    renderWaveControls();
});

function startRhythm(wave) {
    stopRhythm(wave);
    if (!wave) return;
    let interval = Math.max(60, Math.min(400, wave.wavelength * 1.5));
    wave.osc = new (window.AudioContext || window.webkitAudioContext)();
    let playTick = () => {
        if (!wave.isPlaying) return;
        let o = wave.osc.createOscillator();
    o.type = wave.instrument || 'sine';
        o.frequency.value = 392;
        let g = wave.osc.createGain();
        g.gain.value = 0.25;
        o.connect(g).connect(wave.osc.destination);
        o.start();
        o.stop(wave.osc.currentTime + 0.18);
        wave.rhythmTimer = setTimeout(playTick, interval);
    };
    playTick();
}

function updateRhythm(wave) {
    if (!wave || !wave.isPlaying) return;
    stopRhythm(wave);
    startRhythm(wave);
}

function stopRhythm(wave) {
    if (wave.rhythmTimer) clearTimeout(wave.rhythmTimer);
    wave.rhythmTimer = null;
    if (wave.osc) {
        wave.osc.close();
        wave.osc = null;
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
}
