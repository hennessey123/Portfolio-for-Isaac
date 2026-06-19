document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('floating-shapes');
    if (!canvas) {
        console.error("Canvas with ID 'floating-shapes' not found.");
        return;
    }
    const ctx = canvas.getContext('2d');
    let shapes = [];
    let drawing = false;
    let mouse = { x: 0, y: 0 };

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    document.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    function randomShapeType() {
        const types = ['0', '1', '1', '0']; // Matrix terminal feel
        return types[Math.floor(Math.random() * types.length)];
    }

    function drawCursor() {
        ctx.save();
        ctx.shadowColor = "#00ff41";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = "#00ff41";
        ctx.fill();
        ctx.restore();
    }

    function addShape(x, y) {
        const type = randomShapeType();
        const radius = 22 + Math.random() * 14;
        const dx = (Math.random() - 0.5) * 1.2;
        const dy = (Math.random() - 0.5) * 1.2;
        const rot = Math.random() * Math.PI * 2;
        shapes.push({
            type, x, y, radius,
            dx, dy, rot, dr: (Math.random() - 0.5) * 0.02,
            alpha: 1
        });
    }

    function drawShape(shape) {
        ctx.save();
        ctx.globalAlpha = shape.alpha;
        ctx.translate(shape.x, shape.y);
        ctx.rotate(shape.rot);
        
        ctx.font = `${shape.radius * 2}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (shape.type === '0') {
            ctx.fillStyle = "#00ff41";
            ctx.fillText("0", 0, 0);
        } else if (shape.type === '1') {
            ctx.fillStyle = "#008f11";
            ctx.fillText("1", 0, 0);
        }
        
        ctx.restore();
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw floating shapes
        for (let shape of shapes) {
            drawShape(shape);
            shape.x += shape.dx;
            shape.y += shape.dy;
            shape.rot += shape.dr;
            shape.alpha -= 0.002;
        }
        
        // Remove faded shapes
        shapes = shapes.filter(s => s.alpha > 0.06);

        // Draw interactive cursor
        drawCursor();

        requestAnimationFrame(animate);
    }
    
    animate();

    // Matrix Rain Effect for the Book Folder
    const matrixCanvas = document.getElementById('matrix-canvas');
    if (matrixCanvas) {
        const mctx = matrixCanvas.getContext('2d');
        let mWidth, mHeight;
        let columns = [];
        let fontSize = 16;
        let p = 0;

        function initMatrix() {
            mWidth = matrixCanvas.width = window.innerWidth;
            mHeight = matrixCanvas.height = window.innerHeight;
            const cols = Math.floor(mWidth / fontSize);
            columns = [];
            for (let x = 0; x < cols; x++) {
                columns[x] = 1;
            }
        }
        initMatrix();
        window.addEventListener('resize', initMatrix);

        function drawMatrix() {
            mctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            mctx.fillRect(0, 0, mWidth, mHeight);

            mctx.fillStyle = '#0F0';
            mctx.font = fontSize + 'px monospace';

            for (let i = 0; i < columns.length; i++) {
                const text = String.fromCharCode(0x30A0 + Math.random() * 96);
                mctx.fillText(text, i * fontSize, columns[i] * fontSize);

                if (columns[i] * fontSize > mHeight && Math.random() > 0.975) {
                    columns[i] = 0;
                }
                columns[i]++;
            }
        }

        const matrixInterval = setInterval(drawMatrix, 33);

        // Open the folder after 2.5 seconds
        setTimeout(() => {
            const folderCover = document.querySelector('.folder-cover');
            if (folderCover) {
                folderCover.classList.add('open');
            }
        }, 2500);

        // Stop rendering matrix after it's hidden to save CPU
        setTimeout(() => {
            clearInterval(matrixInterval);
            const overlay = document.getElementById('matrix-folder-overlay');
            if(overlay) overlay.style.display = 'none';
        }, 5000);
    }
});
