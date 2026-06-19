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

    document.addEventListener('mousedown', () => { drawing = true; });
    document.addEventListener('mouseup', () => { drawing = false; });

    function randomShapeType() {
        const types = ['coin', 'star', 'mushroom'];
        return types[Math.floor(Math.random() * types.length)];
    }

    function drawCursor() {
        ctx.save();
        ctx.shadowColor = "#fbd000";
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 14, 0, Math.PI * 2);
        ctx.strokeStyle = "#e52521";
        ctx.lineWidth = 3;
        ctx.stroke();
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

        if (shape.type === 'coin') {
            ctx.fillText("🪙", 0, 0);
        } else if (shape.type === 'star') {
            ctx.fillText("⭐", 0, 0);
        } else if (shape.type === 'mushroom') {
            ctx.fillText("🍄", 0, 0);
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

        // If holding mouse down, add shapes at cursor position
        if (drawing) {
            addShape(mouse.x, mouse.y);
        }

        requestAnimationFrame(animate);
    }
    
    animate();
});
