document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('floating-shapes');
    if (!canvas) {
        console.error("Canvas with ID 'floating-shapes' not found.");
        return;
    }
    const ctx = canvas.getContext('2d');
    let shapes = [];
    let mouse = { x: 0, y: 0, dx: 0, dy: 0, lastX: 0, lastY: 0 };
    let cursor = { x: 0, y: 0, size: 14, angle: 0 };

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    document.addEventListener('mousemove', (e) => {
        mouse.lastX = mouse.x;
        mouse.lastY = mouse.y;
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        mouse.dx = mouse.x - mouse.lastX;
        mouse.dy = mouse.y - mouse.lastY;
    });

    function randomShapeType() {
        const types = ['circle', 'square', 'triangle'];
        return types[Math.floor(Math.random() * types.length)];
    }

    function addShape(x, y, dx, dy) {
        const type = randomShapeType();
        const radius = 10 + Math.random() * 15;
        shapes.push({
            type, x, y, radius,
            dx: dx * 0.5 + (Math.random() - 0.5) * 2,
            dy: dy * 0.5 + (Math.random() - 0.5) * 2,
            rot: Math.random() * Math.PI * 2,
            dr: (Math.random() - 0.5) * 0.03,
            alpha: 1,
            life: 0
        });
    }

    function drawShape(shape) {
        ctx.save();
        ctx.globalAlpha = shape.alpha;
        ctx.translate(shape.x, shape.y);
        ctx.rotate(shape.rot);
        ctx.strokeStyle = `hsla(210, 100%, 70%, ${shape.alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (shape.type === 'circle') {
            ctx.arc(0, 0, shape.radius, 0, Math.PI * 2);
        } else if (shape.type === 'square') {
            ctx.rect(-shape.radius * 0.7, -shape.radius * 0.7, shape.radius * 1.4, shape.radius * 1.4);
        } else if (shape.type === 'triangle') {
            ctx.moveTo(0, -shape.radius);
            ctx.lineTo(shape.radius, shape.radius * 0.7);
            ctx.lineTo(-shape.radius, shape.radius * 0.7);
            ctx.closePath();
        }
        ctx.stroke();
        ctx.restore();
    }

    function drawCursor() {
        cursor.x += (mouse.x - cursor.x) * 0.2;
        cursor.y += (mouse.y - cursor.y) * 0.2;
        
        const speed = Math.sqrt(mouse.dx * mouse.dx + mouse.dy * mouse.dy);
        const targetSize = 14 + speed * 0.5;
        cursor.size += (targetSize - cursor.size) * 0.2;
        
        cursor.angle += speed * 0.01;

        ctx.save();
        ctx.translate(cursor.x, cursor.y);
        ctx.rotate(cursor.angle);
        
        ctx.beginPath();
        ctx.arc(0, 0, cursor.size, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(0, 123, 255, 0.8)";
        ctx.lineWidth = 2;
        ctx.shadowColor = "rgba(0, 123, 255, 1)";
        ctx.shadowBlur = 20;
        ctx.stroke();
        
        ctx.restore();
    }

    let lastShapeTime = 0;
    const shapeInterval = 50; // ms

    function animate(currentTime) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const speed = Math.sqrt(mouse.dx*mouse.dx + mouse.dy*mouse.dy);
        if (speed > 5 && currentTime - lastShapeTime > shapeInterval) {
            addShape(mouse.x, mouse.y, mouse.dx, mouse.dy);
            lastShapeTime = currentTime;
        }

        for (let i = shapes.length - 1; i >= 0; i--) {
            const shape = shapes[i];
            drawShape(shape);
            shape.x += shape.dx;
            shape.y += shape.dy;
            shape.rot += shape.dr;
            shape.life++;
            shape.alpha = Math.max(0, 1 - shape.life / 200);
            
            shape.dx *= 0.99;
            shape.dy *= 0.99;

            if (shape.alpha <= 0) {
                shapes.splice(i, 1);
            }
        }
        
        drawCursor();
        
        mouse.dx *= 0.9;
        mouse.dy *= 0.9;

        requestAnimationFrame(animate);
    }
    
    animate(0);

    // Navbar hide/show on scroll
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > lastScrollTop && scrollTop > 80) {
            // Downscroll
            navbar.style.top = '-80px';
        } else {
            // Upscroll
            navbar.style.top = '0';
        }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });

    // Scroll-triggered animations for sections
    const sections = document.querySelectorAll('.content-section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    sections.forEach(section => {
        observer.observe(section);
    });
});
