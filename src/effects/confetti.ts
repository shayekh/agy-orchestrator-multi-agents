interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRotation: number;
  opacity: number;
  decay: number;
  shape: 'rect' | 'circle' | 'star';
  gravity: number;
  drag: number;
}

const NEON_COLORS = [
  '#00f3ff', // Neon Cyan
  '#ff007f', // Neon Pink
  '#ffd700', // Gold
  '#00ff88', // Cyber Green
  '#9d4edd', // Neon Purple
  '#ffffff', // Pure White
];

export function triggerConfetti(targetCanvas?: HTMLCanvasElement | null): () => void {
  if (typeof window === 'undefined') return () => {};

  let canvas = targetCanvas;
  let isCreatedOverlay = false;

  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas-overlay';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);
    isCreatedOverlay = true;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  // Resize canvas resolution to device pixel ratio
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  const width = canvas.clientWidth || window.innerWidth || 300;
  const height = canvas.clientHeight || window.innerHeight || 150;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const particles: Particle[] = [];
  const particleCount = 140;

  // Create dual burst origins (left & right cannon fireworks)
  const origins = [
    { x: width * 0.2, y: height * 0.7 },
    { x: width * 0.8, y: height * 0.7 },
    { x: width * 0.5, y: height * 0.5 },
  ];

  for (let i = 0; i < particleCount; i++) {
    const origin = origins[i % origins.length];
    const angle = (Math.random() * 80 - 40 - 90) * (Math.PI / 180); // upward arc
    const speed = Math.random() * 18 + 10;

    particles.push({
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angle) * speed + (Math.random() * 6 - 3),
      vy: Math.sin(angle) * speed - Math.random() * 4,
      size: Math.random() * 8 + 6,
      color: NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      vRotation: (Math.random() - 0.5) * 0.2,
      opacity: 1.0,
      decay: Math.random() * 0.02 + 0.02,
      shape: Math.random() > 0.6 ? 'rect' : Math.random() > 0.3 ? 'circle' : 'star',
      gravity: 0.35,
      drag: 0.985,
    });
  }

  let animationFrameId: number;

  const render = () => {
    ctx.clearRect(0, 0, width, height);

    let activeParticles = 0;

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (p.opacity <= 0) continue;

      activeParticles++;

      // Update physics
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vRotation;
      p.opacity -= p.decay;

      // Draw particle
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
      } else if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Draw 5-pointed star particle
        ctx.beginPath();
        for (let j = 0; j < 5; j++) {
          ctx.lineTo(
            Math.cos(((18 + j * 72) * Math.PI) / 180) * (p.size / 2),
            -Math.sin(((18 + j * 72) * Math.PI) / 180) * (p.size / 2)
          );
          ctx.lineTo(
            Math.cos(((54 + j * 72) * Math.PI) / 180) * (p.size / 4),
            -Math.sin(((54 + j * 72) * Math.PI) / 180) * (p.size / 4)
          );
        }
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    if (activeParticles > 0) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, width, height);
      if (isCreatedOverlay && canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  };

  animationFrameId = requestAnimationFrame(render);

  // Return cancel/cleanup callback function
  return () => {
    cancelAnimationFrame(animationFrameId);
    if (ctx) ctx.clearRect(0, 0, width, height);
    if (isCreatedOverlay && canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
  };
}
