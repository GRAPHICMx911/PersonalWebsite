/**
 * Hero FX Canvas — Interactive Ambient Constellation & Convergence Particles
 * Inspired by Media Harbour's signature interactive hero background.
 * Ultra-lightweight (pure vanilla JS), responsive, high-performance, and GPU friendly.
 */
(function() {
    'use strict';

    function initHeroFx() {
        const canvas = document.getElementById('heroFxCanvas');
        const heroSection = document.querySelector('.hero-section');
        if (!canvas || !heroSection) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = 0;
        let height = 0;
        let dpr = 1;
        let animationFrameId = null;
        let isVisible = true;

        const mouse = {
            x: -1000,
            y: -1000,
            radius: 170
        };

        const particleCount = window.innerWidth < 768 ? 26 : 48;
        const connectionDistance = window.innerWidth < 768 ? 95 : 135;
        const particles = [];

        function resize() {
            const rect = heroSection.getBoundingClientRect();
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = rect.width;
            height = rect.height;

            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';

            ctx.scale(dpr, dpr);
        }

        class Particle {
            constructor() {
                this.reset(true);
            }

            reset(initial = false) {
                this.x = initial ? Math.random() * width : (Math.random() > 0.5 ? 0 : width);
                this.y = initial ? Math.random() * height : Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.55;
                this.vy = (Math.random() - 0.5) * 0.55;
                this.baseRadius = Math.random() * 1.8 + 1.2;
                this.radius = this.baseRadius;
                this.alpha = Math.random() * 0.45 + 0.35;
                // Brand accent colors: #6FB7E1, #087DD8, #C4E0E1
                const palette = ['111, 183, 225', '8, 125, 216', '196, 224, 225'];
                this.color = palette[Math.floor(Math.random() * palette.length)];
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Bounce at edges
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;

                // Mouse interactivity: gentle attraction / deflection
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.hypot(dx, dy);

                if (dist < mouse.radius) {
                    const force = (mouse.radius - dist) / mouse.radius;
                    const angle = Math.atan2(dy, dx);
                    this.x += Math.cos(angle) * force * 1.2;
                    this.y += Math.sin(angle) * force * 1.2;
                    this.radius = this.baseRadius + force * 1.5;
                } else {
                    if (this.radius > this.baseRadius) {
                        this.radius -= 0.05;
                    }
                }
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
                ctx.fill();

                // Subtle glowing halo around key nodes
                if (this.baseRadius > 2.0) {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius * 2.4, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${this.color}, ${this.alpha * 0.15})`;
                    ctx.fill();
                }
            }
        }

        // Initialize particles
        resize();
        particles.length = 0;
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        function drawConnections() {
            const count = particles.length;
            for (let i = 0; i < count; i++) {
                for (let j = i + 1; j < count; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < connectionDistance) {
                        const alpha = (1 - dist / connectionDistance) * 0.22;
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(111, 183, 225, ${alpha})`;
                        ctx.lineWidth = 0.85;
                        ctx.stroke();
                    }
                }

                // Connect to mouse cursor
                const mdx = mouse.x - particles[i].x;
                const mdy = mouse.y - particles[i].y;
                const mDist = Math.hypot(mdx, mdy);
                if (mDist < mouse.radius) {
                    const mAlpha = (1 - mDist / mouse.radius) * 0.35;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(mouse.x, mouse.y);
                    ctx.strokeStyle = `rgba(8, 125, 216, ${mAlpha})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }

        function animate() {
            if (!isVisible) {
                animationFrameId = null;
                return;
            }

            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
            }

            drawConnections();

            animationFrameId = requestAnimationFrame(animate);
        }

        // Event Listeners
        window.addEventListener('resize', () => {
            resize();
        }, { passive: true });

        heroSection.addEventListener('mousemove', (e) => {
            const rect = heroSection.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        }, { passive: true });

        heroSection.addEventListener('mouseleave', () => {
            mouse.x = -1000;
            mouse.y = -1000;
        }, { passive: true });

        // Pause animation when hero is off-screen to save battery
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    isVisible = entry.isIntersecting;
                    if (isVisible && !animationFrameId) {
                        animate();
                    }
                });
            }, { threshold: 0.05 });
            observer.observe(heroSection);
        } else {
            animate();
        }

        animate();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initHeroFx);
    } else {
        initHeroFx();
    }
})();
