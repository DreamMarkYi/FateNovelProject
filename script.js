// Canvas setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Create falling cherry blossom petals
function createPetals() {
    const numPetals = 15;
    for (let i = 0; i < numPetals; i++) {
        setTimeout(() => {
            const petal = document.createElement('div');
            petal.className = 'petal';
            petal.style.left = Math.random() * 100 + '%';
            petal.style.animationDuration = (Math.random() * 5 + 5) + 's';
            petal.style.animationDelay = Math.random() * 3 + 's';
            petal.style.width = (Math.random() * 5 + 8) + 'px';
            petal.style.height = (Math.random() * 5 + 8) + 'px';
            document.body.appendChild(petal);
        }, i * 800);
    }
}

// Fade effect
function fadeOut() {
    return new Promise((resolve) => {
        document.body.style.opacity = '0';
        document.body.style.transform = 'scale(0.95)';
        setTimeout(resolve, 800);
    });
}

// Preload images
function preloadTargetPageImages() {
    return new Promise((resolve) => {
        const imagesToPreload = [
            './backgroundLeft.jpg',
            './backgroundRight4.png'
        ];

        let loadedCount = 0;
        const totalImages = imagesToPreload.length;

        imagesToPreload.forEach(src => {
            const img = new Image();
            img.onload = () => {
                loadedCount++;
                if (loadedCount === totalImages) {
                    resolve();
                }
            };
            img.onerror = () => {
                loadedCount++;
                if (loadedCount === totalImages) {
                    resolve();
                }
            };
            img.src = src;
        });
    });
}

// Create preview background
function createPreviewBackground() {
    const previewBg = document.createElement('div');
    previewBg.id = 'preview-background';
    previewBg.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1000;
            opacity: 0;
            background: linear-gradient(135deg, #fef5f5 0%, #fce8e8 100%);
            transition: opacity 1.5s ease-out;
        `;

    const leftBg = document.createElement('div');
    leftBg.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 50%;
            height: 100%;
            background-image: url('./backgroundLeft.jpg');
            background-size: cover;
            background-position: center;
            filter: blur(30px) brightness(1.1) saturate(0.8);
            transform: scale(1.2);
        `;

    const rightBg = document.createElement('div');
    rightBg.style.cssText = `
            position: absolute;
            top: 0;
            right: 0;
            width: 50%;
            height: 100%;
            background-image: url('./backgroundRight4.png');
            background-size: cover;
            background-position: center;
            filter: blur(30px) brightness(0.6) saturate(0.8);
            transform: scale(1.2);
        `;

    const gradientOverlay = document.createElement('div');
    gradientOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(ellipse 60% 100% at center,
                rgba(254, 245, 245, 0.6) 0%,
                rgba(254, 245, 245, 0.4) 40%,
                rgba(254, 245, 245, 0.2) 70%,
                transparent 100%);
        `;

    //previewBg.appendChild(leftBg);
    //previewBg.appendChild(rightBg);
    //previewBg.appendChild(gradientOverlay);
    //document.body.appendChild(previewBg);

    return previewBg;
}

// Interactive text effects
function initInteractiveEffects() {
    const interactiveTexts = document.querySelectorAll('.interactive-text, .nav-link');
    interactiveTexts.forEach(text => {
        text.addEventListener('click', function(e) {
            // Check if it's the main navigation link
            if (text.getAttribute('href') === 'indexblue3_updated2.html') {
                e.preventDefault();

                const ripple = document.createElement('div');
                ripple.style.position = 'absolute';
                ripple.style.left = e.clientX + 'px';
                ripple.style.top = e.clientY + 'px';
                ripple.style.width = '0';
                ripple.style.height = '0';
                ripple.style.border = '2px solid rgba(230, 165, 165, 0.6)';
                ripple.style.borderRadius = '50%';
                ripple.style.transform = 'translate(-50%, -50%)';
                ripple.style.pointerEvents = 'none';
                ripple.style.zIndex = '1000';
                document.body.appendChild(ripple);

                let size = 0;
                const animate = setInterval(() => {
                    size += 10;
                    ripple.style.width = size + 'px';
                    ripple.style.height = size + 'px';
                    ripple.style.opacity = 1 - (size / 200);

                    if (size >= 200) {
                        clearInterval(animate);
                        document.body.removeChild(ripple);

                        preloadTargetPageImages().then(() => {
                            const previewBg = createPreviewBackground();

                            setTimeout(() => {
                                previewBg.style.opacity = '1';
                            }, 50);

                            setTimeout(() => {
                                window.location.href = 'indexblue3_updated2.html';
                            }, 900);
                        });
                    }
                }, 20);
            } else {
                const ripple = document.createElement('div');
                ripple.style.position = 'absolute';
                ripple.style.left = e.clientX + 'px';
                ripple.style.top = e.clientY + 'px';
                ripple.style.width = '0';
                ripple.style.height = '0';
                ripple.style.border = '2px solid rgba(230, 165, 165, 0.6)';
                ripple.style.borderRadius = '50%';
                ripple.style.transform = 'translate(-50%, -50%)';
                ripple.style.pointerEvents = 'none';
                ripple.style.zIndex = '1000';
                document.body.appendChild(ripple);

                let size = 0;
                const animate = setInterval(() => {
                    size += 10;
                    ripple.style.width = size + 'px';
                    ripple.style.height = size + 'px';
                    ripple.style.opacity = 1 - (size / 200);

                    if (size >= 200) {
                        clearInterval(animate);
                        document.body.removeChild(ripple);
                    }
                }, 20);
            }
        });
    });
}

// Window resize handler
function initWindowResize() {
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// Global click ripple effect
function initGlobalRipple() {
    document.body.addEventListener('click', function(e) {
        // Check if click is on an interactive element to avoid double ripples
        if (e.target.closest('.nav-link, .interactive-text, a')) {
            return;
        }

        const ripple = document.createElement('div');
        ripple.style.position = 'fixed';
        ripple.style.left = e.clientX + 'px';
        ripple.style.top = e.clientY + 'px';
        ripple.style.width = '0';
        ripple.style.height = '0';
        ripple.style.border = '2px solid rgba(230, 165, 165, 0.5)';
        ripple.style.borderRadius = '50%';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.pointerEvents = 'none';
        ripple.style.zIndex = '999';
        document.body.appendChild(ripple);

        let size = 0;
        const animate = setInterval(() => {
            size += 10;
            ripple.style.width = size + 'px';
            ripple.style.height = size + 'px';
            ripple.style.opacity = 1 - (size / 200);

            if (size >= 200) {
                clearInterval(animate);
                document.body.removeChild(ripple);
            }
        }, 20);
    });
}

// Page load animation
function initPageLoad() {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            document.body.classList.add('loaded');
            createPetals();
        }, 50);
    });

    window.addEventListener('load', () => {
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 100);
    });
}

// Soft ribbon animation with pink tones
class Ribbon {
    constructor() {
        this.points = [];
        this.numPoints = 20;
        this.init();
    }

    init() {
        for (let i = 0; i < this.numPoints; i++) {
            this.points.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: Math.random() * 1.5 - 0.75,
                vy: Math.random() * 1.5 - 0.75
            });
        }
    }

    update() {
        this.points.forEach(point => {
            point.x += point.vx;
            point.y += point.vy;

            if (point.x < 0 || point.x > canvas.width) point.vx *= -1;
            if (point.y < 0 || point.y > canvas.height) point.vy *= -1;
        });
    }

    draw() {
        ctx.strokeStyle = 'rgba(230, 165, 165, 0.08)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);

        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }

        ctx.stroke();
    }
}

// Initialize ribbon animation
function initRibbonAnimation() {
    const ribbon = new Ribbon();

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ribbon.update();
        ribbon.draw();
        requestAnimationFrame(animate);
    }

    animate();
}

// Initialize all functionality
function init() {
    initInteractiveEffects();
    initWindowResize();
    initGlobalRipple();
    initPageLoad();
    initRibbonAnimation();
}

// Start the application
init();

