window.addEventListener('load', () => {
    setTimeout(() => document.getElementById('loader').classList.add('hide'), 800);
});

const pc = document.getElementById('particles');
const pctx = pc.getContext('2d');
let particles = [];

function initParticles() {
    pc.width = innerWidth;
    pc.height = innerHeight;
    particles = [];
    const count = Math.min(Math.floor((innerWidth * innerHeight) / 12000), 120);
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * pc.width,
            y: Math.random() * pc.height,
            r: Math.random() * 1.5 + 0.5,
            dx: (Math.random() - 0.5) * 0.3,
            dy: (Math.random() - 0.5) * 0.3,
            a: Math.random() * 0.4 + 0.1
        });
    }
}
initParticles();

function drawParticles() {
    pctx.clearRect(0, 0, pc.width, pc.height);
    particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = pc.width;
        if (p.x > pc.width) p.x = 0;
        if (p.y < 0) p.y = pc.height;
        if (p.y > pc.height) p.y = 0;

        pctx.beginPath();
        pctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        pctx.fillStyle = `rgba(47,124,255,${p.a})`;
        pctx.fill();
    });

    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
                pctx.beginPath();
                pctx.moveTo(particles[i].x, particles[i].y);
                pctx.lineTo(particles[j].x, particles[j].y);
                pctx.strokeStyle = `rgba(47,124,255,${0.06 * (1 - dist / 120)})`;
                pctx.stroke();
            }
        }
    }
    requestAnimationFrame(drawParticles);
}
drawParticles();


const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
canvas.width = innerWidth;
canvas.height = innerHeight;

let rx = 0.4, ry = 0.6;
let dragging = false;
let lx = 0, ly = 0;
let autoRotate = true;
let zoom = 300;
const MIN_ZOOM = 150, MAX_ZOOM = 600;

const cube = [
    {x:-1,y:-1,z:-1},{x:1,y:-1,z:-1},{x:1,y:1,z:-1},{x:-1,y:1,z:-1},
    {x:-1,y:-1,z:1},{x:1,y:-1,z:1},{x:1,y:1,z:1},{x:-1,y:1,z:1}
];

const edges = [
    [0,1],[1,2],[2,3],[3,0],
    [4,5],[5,6],[6,7],[7,4],
    [0,4],[1,5],[2,6],[3,7]
];

const faces = [
    {verts:[0,1,2,3], color:'rgba(47,124,255,0.06)'},  // back
    {verts:[4,5,6,7], color:'rgba(47,124,255,0.06)'},  // front
    {verts:[0,1,5,4], color:'rgba(47,124,255,0.04)'},  // bottom
    {verts:[2,3,7,6], color:'rgba(47,124,255,0.04)'},  // top
    {verts:[0,3,7,4], color:'rgba(47,124,255,0.05)'},  // left
    {verts:[1,2,6,5], color:'rgba(47,124,255,0.05)'},  // right
];

const axes = [
    {a:{x:0,y:0,z:0}, b:{x:2.2,y:0,z:0}, c:'#ff4455', label:'X'},
    {a:{x:0,y:0,z:0}, b:{x:0,y:2.2,z:0}, c:'#44ff66', label:'Y'},
    {a:{x:0,y:0,z:0}, b:{x:0,y:0,z:2.2}, c:'#4488ff', label:'Z'}
];

function rot(p) {
    let {x, y, z} = p;
    const cy = Math.cos(ry), sy = Math.sin(ry);
    const x1 = x * cy - z * sy;
    const z1 = x * sy + z * cy;
    const cx = Math.cos(rx), sx = Math.sin(rx);
    const y1 = y * cx - z1 * sx;
    const z2 = y * sx + z1 * cx;
    return {x: x1, y: y1, z: z2};
}

function proj(p) {
    const f = zoom / (4 - p.z);
    return {x: p.x * f + canvas.width / 2, y: p.y * f + canvas.height / 2};
}

function drawLine(a, b, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 1.5;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (autoRotate && !dragging) {
        ry += 0.004;
        rx += 0.002;
    }

    const pts3d = cube.map(p => rot(p));
    const pts = pts3d.map(p => proj(p));

    faces.forEach(face => {
        ctx.beginPath();
        const fp = face.verts.map(i => pts[i]);
        ctx.moveTo(fp[0].x, fp[0].y);
        for (let i = 1; i < fp.length; i++) ctx.lineTo(fp[i].x, fp[i].y);
        ctx.closePath();
        ctx.fillStyle = face.color;
        ctx.fill();
    });

    ctx.shadowColor = '#2f7cff';
    ctx.shadowBlur = 8;
    edges.forEach(e => {
        drawLine(pts[e[0]], pts[e[1]], 'rgba(120,180,255,0.7)', 1.5);
    });
    ctx.shadowBlur = 0;

    pts.forEach((p, i) => {
        const depth = (pts3d[i].z + 1) / 2;
        const size = 2.5 + depth * 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(120,180,255,${0.5 + depth * 0.5})`;
        ctx.fill();
    });

    axes.forEach(ax => {
        const a = proj(rot(ax.a));
        const b = proj(rot(ax.b));
        ctx.shadowColor = ax.c;
        ctx.shadowBlur = 6;
        drawLine(a, b, ax.c, 2);
        ctx.shadowBlur = 0;

        ctx.font = '600 11px "JetBrains Mono"';
        ctx.fillStyle = ax.c;
        ctx.fillText(ax.label, b.x + 6, b.y - 6);
    });

    document.getElementById('hud-x').textContent = 'X: ' + ry.toFixed(2);
    document.getElementById('hud-y').textContent = 'Y: ' + rx.toFixed(2);
    document.getElementById('hud-z').textContent = 'Z: 0.00';

    requestAnimationFrame(draw);
}
draw();

canvas.onmousedown = e => {
    dragging = true;
    autoRotate = false;
    lx = e.clientX;
    ly = e.clientY;
};
window.onmouseup = () => { dragging = false; };
window.onmousemove = e => {
    if (!dragging) return;
    ry += (e.clientX - lx) * 0.008;
    rx += (e.clientY - ly) * 0.008;
    lx = e.clientX;
    ly = e.clientY;
};

canvas.ontouchstart = e => {
    dragging = true;
    autoRotate = false;
    lx = e.touches[0].clientX;
    ly = e.touches[0].clientY;
};
window.ontouchend = () => { dragging = false; };
window.ontouchmove = e => {
    if (!dragging) return;
    ry += (e.touches[0].clientX - lx) * 0.008;
    rx += (e.touches[0].clientY - ly) * 0.008;
    lx = e.touches[0].clientX;
    ly = e.touches[0].clientY;
};

window.addEventListener('wheel', e => {
    zoom -= e.deltaY * 0.5;
    zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    document.getElementById('zoomInd').textContent = 'ZOOM: ' + Math.round(zoom / 3) + '%';
}, {passive: true});

window.onresize = () => {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    initParticles();
};

const overlay = document.getElementById('overlay');
const allPanels = ['profilePanel', 'cvPanel', 'contactPanel', 'projectPanel'];
const allIcons = {
    profileBtn: 'profilePanel',
    cvBtn: 'cvPanel',
    contactBtn: 'contactPanel',
    projectBtn: 'projectPanel'
};

function closeAll() {
    overlay.classList.remove('show');
    allPanels.forEach(id => document.getElementById(id).classList.remove('show'));
    document.querySelectorAll('.sidebar .icon').forEach(i => i.classList.remove('active'));
}

function openPanel(panelId, btnId) {
    const panel = document.getElementById(panelId);
    const isOpen = panel.classList.contains('show');
    closeAll();
    if (!isOpen) {
        overlay.classList.add('show');
        panel.classList.add('show');
        if (btnId) document.getElementById(btnId).classList.add('active');
    }
}

Object.entries(allIcons).forEach(([btnId, panelId]) => {
    document.getElementById(btnId).onclick = () => openPanel(panelId, btnId);
});

document.getElementById('homeBtn').onclick = () => {
    closeAll();
    autoRotate = true;
    document.getElementById('homeBtn').classList.add('active');
    setTimeout(() => document.getElementById('homeBtn').classList.remove('active'), 400);
};

document.querySelectorAll('.close-btn').forEach(btn => {
    btn.onclick = () => closeAll();
});

overlay.onclick = () => closeAll();

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAll();
});

document.getElementById('goToContact').onclick = e => {
    e.preventDefault();
    openPanel('contactPanel', 'contactBtn');
};

canvas.ondblclick = () => {
    rx = 0.4;
    ry = 0.6;
    zoom = 300;
    autoRotate = true;
    document.getElementById('zoomInd').textContent = 'ZOOM: 100%';
};

const projectMedia = [
    {
        title: 'Premiere Pro - Edição de Vídeo',
        items: [
            { type: 'video', src: 'videos/9 S.mp4' ,},
            { type: 'video', src: 'videos/Stitch_final.mp4' },
            { type: 'video', src: 'videos/FNAF.mp4' },
            { type: 'video', src: 'videos/Pixels.mp4' },
            { type: 'video', src: 'videos/SPN2027-P4MAV-PPS-BeatrizGomes-GustavoFernandes.mp4' }
        ]
    },
    {
        title: 'Photoshop - Design Gráfico',
        items: [
            { type: 'image', src: 'imgs/eu.JPG' },
            { type: 'image', src: 'imgs/minhalinda.JPG' },
            { type: 'image', src: 'imgs/her.jpg' },
            { type: 'image', src: 'imgs/mdcai.jpg' },
            { type: 'image', src: 'imgs/maca.jpg' },
            { type: 'image', src: 'imgs/rl.jpg' },
            { type: 'image', src: 'imgs/gira.JPG' },
            { type: 'image', src: 'imgs/crr.jpg' },
            { type: 'image', src: 'imgs/crr2.jpg' },
        ]
    },
    {
        title: 'After Effects - Motion Graphics',
        items: [
            { type: 'video', src: 'videos/Motion.mp4' },
            { type: 'video', src: 'videos/anuncio.mp4' },
            { type: 'video', src: 'videos/Baloon.mp4' },
            { type: 'video', src: 'videos/dancers.mp4' },
            { type: 'video', src: 'videos/Espiral.mp4' }
        ]
    },
    {
        title: 'Animate - Animação 2D',
        items: [
            { type: 'video', src: 'videos/00000.mp4' },
            { type: 'video', src: 'videos/avião.mp4' },
            { type: 'video', src: 'videos/peixe.mp4' },
            { type: 'video', src: 'videos/gkvsgj.mp4' },

        ]
    },
    {
        title: 'Illustrator',
        items: [
            { type: 'image', src: 'imgs/ronaldopix.png' },
            { type: 'image', src: 'imgs/ron2.png' },
            { type: 'image', src: 'imgs/ron3.png' },
            { type: 'image', src: 'imgs/ron4.png' },
            { type: 'image', src: 'imgs/wall.jpg' },
        ]
    },
    {
        title: '3ds Max - Modelagem 3D',
        items: [
            { type: 'image', src: 'imgs/chapeu.jpg' },
            { type: 'image', src: 'imgs/fruteira.jpg' },
            { type: 'image', src: 'imgs/Pneu.jpg' },
            { type: 'image', src: 'imgs/lamp.jpg' },
            { type: 'video', src: 'videos/bomba.mp4' },
            { type: 'video', src: 'videos/bas2.mp4' },
            { type: 'video', src: 'videos/faiscamcqueen.mp4' },
            { type: 'video', src: 'videos/ovos.mp4' },
            { type: 'video', src: 'videos/Simp.mp4' },
        ]
    }
];

let currentProject = 0;
let currentSlide = 0;

const carouselOverlay = document.getElementById('carouselOverlay');
const carouselTitle = document.getElementById('carouselTitle');
const carouselViewport = document.getElementById('carouselViewport');
const carouselCounter = document.getElementById('carouselCounter');

function renderSlide() {
    const project = projectMedia[currentProject];
    const item = project.items[currentSlide];
    carouselTitle.textContent = project.title;

    if (item.type === 'image') {
        carouselViewport.innerHTML = '<img src="' + item.src + '" alt="' + (item.alt || 'Projeto') + '">';
    } else if (item.type === 'video') {
        carouselViewport.innerHTML = '<video controls autoplay><source src="' + item.src + '" type="video/mp4">O seu browser não suporta vídeo.</video>';
    } else {
        carouselViewport.innerHTML = '<div class="carousel-placeholder"><span>&#128247;</span>' + item.text + '<br><br><em style="color:#4d8dff;font-size:12px;">Coloque os ficheiros na pasta do projeto e adicione os caminhos no array projectMedia no código.</em></div>';
    }

    if (project.items.length > 1) {
        carouselCounter.textContent = (currentSlide + 1) + ' / ' + project.items.length;
    } else {
        carouselCounter.textContent = '';
    }
}

function openCarousel(projectIndex) {
    currentProject = projectIndex;
    currentSlide = 0;
    renderSlide();
    carouselOverlay.classList.add('show');
}

function closeCarousel() {
    carouselOverlay.classList.remove('show');
}

document.getElementById('carouselClose').onclick = closeCarousel;
carouselOverlay.onclick = e => {
    if (e.target === carouselOverlay) closeCarousel();
};

document.getElementById('carouselPrev').onclick = () => {
    const total = projectMedia[currentProject].items.length;
    currentSlide = (currentSlide - 1 + total) % total;
    renderSlide();
};

document.getElementById('carouselNext').onclick = () => {
    const total = projectMedia[currentProject].items.length;
    currentSlide = (currentSlide + 1) % total;
    renderSlide();
};

document.addEventListener('keydown', e => {
    if (!carouselOverlay.classList.contains('show')) return;
    if (e.key === 'Escape') closeCarousel();
    if (e.key === 'ArrowLeft') document.getElementById('carouselPrev').click();
    if (e.key === 'ArrowRight') document.getElementById('carouselNext').click();
});
