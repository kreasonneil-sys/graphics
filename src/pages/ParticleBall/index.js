import React, { useRef, useEffect } from 'react';

const PARTICLE_COUNT = 1400;
const SPHERE_RADIUS = 180;
const INTRO_DURATION = 12000;
const BASE_ROTATION_SPEED = 0.0008;
const AXIAL_TILT = 23.4 * (Math.PI / 180);
const GREY_RATIO = 0.18;
const EXPLODE_DURATION = 800;
const FORM_TEXT_DELAY = 400;
const FORM_TEXT_DURATION = 2000;
const FLOAT_AMPLITUDE = 8;
const FLOAT_SPEED = 0.4;

function fibonacci(count) {
  const points = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    points.push({
      x: Math.cos(theta) * radiusAtY,
      y,
      z: Math.sin(theta) * radiusAtY,
    });
  }
  return points;
}

function sampleTextPoints(text, count, canvasWidth, canvasHeight) {
  const offscreen = document.createElement('canvas');
  const scale = Math.min(canvasWidth / 900, canvasHeight / 300, 1.5);
  offscreen.width = canvasWidth;
  offscreen.height = canvasHeight;
  const octx = offscreen.getContext('2d');
  const fontSize = Math.floor(72 * scale);
  octx.font = `bold ${fontSize}px Arial, sans-serif`;
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';
  octx.fillStyle = '#fff';

  const lines = text.split('\n');
  const lineHeight = fontSize * 1.3;
  const totalHeight = lines.length * lineHeight;
  const startY = canvasHeight / 2 - totalHeight / 2 + lineHeight / 2;

  for (let l = 0; l < lines.length; l++) {
    octx.fillText(lines[l], canvasWidth / 2, startY + l * lineHeight);
  }

  const imageData = octx.getImageData(0, 0, offscreen.width, offscreen.height);
  const pixels = imageData.data;
  const candidates = [];
  const step = Math.max(2, Math.floor(3 / scale));

  for (let y = 0; y < offscreen.height; y += step) {
    for (let x = 0; x < offscreen.width; x += step) {
      const idx = (y * offscreen.width + x) * 4;
      if (pixels[idx + 3] > 128) {
        candidates.push({ x, y });
      }
    }
  }

  const points = [];
  if (candidates.length === 0) return points;
  for (let i = 0; i < count; i++) {
    const c = candidates[Math.floor(Math.random() * candidates.length)];
    points.push({
      x: c.x + (Math.random() - 0.5) * step,
      y: c.y + (Math.random() - 0.5) * step,
    });
  }
  return points;
}

function getParticleColor(normalizedZ, time, index, isGrey) {
  const shimmer = Math.sin(time * 2.5 + index * 0.4) * 0.5 + 0.5;

  if (isGrey) {
    const pulse = Math.sin(time * 3.5 + index * 0.9) * 0.5 + 0.5;
    const base = 140 + Math.floor(pulse * 80 + shimmer * 35);
    return `rgb(${base},${base + Math.floor(shimmer * 8)},${base + Math.floor(shimmer * 15)})`;
  }

  const facet = Math.sin(time * 1.2 + index * 0.7) * 0.5 + 0.5;

  if (facet > 0.5) {
    const r = 180 + Math.floor(shimmer * 75);
    const g = 200 + Math.floor(shimmer * 55);
    const b = 220 + Math.floor(shimmer * 35);
    return `rgb(${r},${g},${b})`;
  }
  const depth = (normalizedZ + 1) / 2;
  const r = 10 + Math.floor(depth * 30);
  const g = 15 + Math.floor(depth * 50 + shimmer * 30);
  const b = 60 + Math.floor(depth * 120 + shimmer * 40);
  return `rgb(${r},${g},${b})`;
}

export default function ParticleBall() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let startTime = null;
    let explodeTime = null;
    let formTextTime = null;
    let textTargets = null;

    const spherePoints = fibonacci(PARTICLE_COUNT);

    const particles = spherePoints.map((target, i) => {
      const side = Math.floor(Math.random() * 4);
      let sx, sy;
      switch (side) {
        case 0: sx = -10; sy = Math.random() * window.innerHeight; break;
        case 1: sx = window.innerWidth + 10; sy = Math.random() * window.innerHeight; break;
        case 2: sx = Math.random() * window.innerWidth; sy = -10; break;
        default: sx = Math.random() * window.innerWidth; sy = window.innerHeight + 10; break;
      }

      const floatOffset = Math.random() * Math.PI * 2;

      return {
        startX: sx,
        startY: sy,
        target,
        index: i,
        floatOffset,
        isGrey: Math.random() < GREY_RATIO,
        explodeVx: 0,
        explodeVy: 0,
        explodeX: 0,
        explodeY: 0,
        textX: 0,
        textY: 0,
        hasTextTarget: false,
        explodedFinalX: 0,
        explodedFinalY: 0,
      };
    });

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function handleClick() {
      if (!explodeTime) {
        explodeTime = performance.now();
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const time = performance.now() / 1000;
        const rotYAngle = time * BASE_ROTATION_SPEED * 6;

        for (const p of particles) {
          let rotated = rotateY(p.target, rotYAngle);
          rotated = rotateZ(rotated, AXIAL_TILT);

          const floatY = Math.sin(time * FLOAT_SPEED + p.floatOffset) * FLOAT_AMPLITUDE;
          const floatX = Math.cos(time * FLOAT_SPEED * 0.7 + p.floatOffset + 1.5) * FLOAT_AMPLITUDE * 0.5;

          p.explodeX = cx + rotated.x * SPHERE_RADIUS + floatX;
          p.explodeY = cy + rotated.y * SPHERE_RADIUS + floatY;

          const dx = rotated.x;
          const dy = rotated.y;
          const dz = rotated.z;
          const mag = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
          const speed = 4 + Math.random() * 6;
          p.explodeVx = (dx / mag) * speed + (Math.random() - 0.5) * 3;
          p.explodeVy = (dy / mag) * speed + (Math.random() - 0.5) * 3;
        }
      }
    }
    canvas.addEventListener('click', handleClick);

    function rotateY(point, angle) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        x: point.x * cos + point.z * sin,
        y: point.y,
        z: -point.x * sin + point.z * cos,
      };
    }

    function rotateZ(point, angle) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        x: point.x * cos - point.y * sin,
        y: point.x * sin + point.y * cos,
        z: point.z,
      };
    }

    function easeOutSine(t) {
      return Math.sin((t * Math.PI) / 2);
    }

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function render(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / INTRO_DURATION, 1);
      const easedProgress = easeOutSine(progress);

      const time = timestamp / 1000;
      const rotYAngle = time * BASE_ROTATION_SPEED * 6;

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let explodeProgress = 0;
      if (explodeTime) {
        explodeProgress = Math.min((timestamp - explodeTime) / EXPLODE_DURATION, 1);
      }

      // Start text formation after explosion + delay
      if (explodeTime && explodeProgress >= 1 && !formTextTime) {
        if (timestamp - (explodeTime + EXPLODE_DURATION) >= FORM_TEXT_DELAY) {
          formTextTime = timestamp;
          textTargets = sampleTextPoints('Virtual\nCanvas', PARTICLE_COUNT, canvas.width, canvas.height);
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const eased = easeOutCubic(1);
            p.explodedFinalX = p.explodeX + p.explodeVx * eased * 120;
            p.explodedFinalY = p.explodeY + p.explodeVy * eased * 120;
            if (i < textTargets.length) {
              p.textX = textTargets[i].x;
              p.textY = textTargets[i].y;
              p.hasTextTarget = true;
            } else {
              p.hasTextTarget = false;
            }
          }
        }
      }

      let formProgress = 0;
      if (formTextTime) {
        formProgress = Math.min((timestamp - formTextTime) / FORM_TEXT_DURATION, 1);
      }

      const projected = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        let rotated = rotateY(p.target, rotYAngle);
        rotated = rotateZ(rotated, AXIAL_TILT);

        const floatY = Math.sin(time * FLOAT_SPEED + p.floatOffset) * FLOAT_AMPLITUDE;
        const floatX = Math.cos(time * FLOAT_SPEED * 0.7 + p.floatOffset + 1.5) * FLOAT_AMPLITUDE * 0.5;

        const worldX = cx + rotated.x * SPHERE_RADIUS + floatX * easedProgress;
        const worldY = cy + rotated.y * SPHERE_RADIUS + floatY * easedProgress;

        let drawX, drawY, drawAlpha, drawSize;

        if (formTextTime) {
          const easedForm = easeOutCubic(formProgress);
          if (p.hasTextTarget) {
            drawX = p.explodedFinalX + (p.textX - p.explodedFinalX) * easedForm;
            drawY = p.explodedFinalY + (p.textY - p.explodedFinalY) * easedForm;
            drawAlpha = 0.15 + easedForm * 0.85;
            drawSize = 0.6 + easedForm * 0.6;
          } else {
            drawX = p.explodedFinalX + (Math.random() - 0.5) * 0.3;
            drawY = p.explodedFinalY + (Math.random() - 0.5) * 0.3;
            drawAlpha = 0.15 * (1 - easedForm);
            drawSize = 0.5 * (1 - easedForm);
          }
        } else if (explodeTime) {
          const eased = easeOutCubic(explodeProgress);
          drawX = p.explodeX + p.explodeVx * eased * 120;
          drawY = p.explodeY + p.explodeVy * eased * 120;
          const depthScale = (rotated.z + 1.5) / 2.5;
          const baseSize = (0.3 + depthScale * 0.9) * (0.3 + easedProgress * 0.7);
          const baseAlpha = (0.3 + depthScale * 0.7) * (0.2 + easedProgress * 0.8);
          drawSize = baseSize * (1 - explodeProgress * 0.6);
          drawAlpha = baseAlpha * Math.max(0.15, 1 - explodeProgress * 0.85);
        } else {
          drawX = p.startX + (worldX - p.startX) * easedProgress;
          drawY = p.startY + (worldY - p.startY) * easedProgress;
          const depthScale = (rotated.z + 1.5) / 2.5;
          drawSize = (0.3 + depthScale * 0.9) * (0.3 + easedProgress * 0.7);
          drawAlpha = (0.3 + depthScale * 0.7) * (0.2 + easedProgress * 0.8);
        }

        projected.push({
          x: drawX,
          y: drawY,
          z: rotated.z,
          size: drawSize,
          alpha: drawAlpha,
          index: i,
          isGrey: p.isGrey,
          hasTextTarget: p.hasTextTarget,
        });
      }

      projected.sort((a, b) => a.z - b.z);

      for (const pt of projected) {
        if (pt.alpha <= 0.01) continue;
        ctx.globalAlpha = pt.alpha;

        if (formTextTime && pt.hasTextTarget && formProgress > 0.3) {
          const shimmer1 = Math.sin(time * 3.5 + pt.index * 0.5) * 0.5 + 0.5;
          const shimmer2 = Math.sin(time * 5.0 + pt.index * 0.3 + 2.0) * 0.5 + 0.5;
          const wave = Math.sin(time * 2.0 + pt.x * 0.01 + pt.y * 0.005) * 0.5 + 0.5;
          const colorType = (pt.index * 7 + Math.floor(shimmer2 * 3)) % 3;
          let r, g, b;
          if (colorType === 0) {
            // Blue
            r = 60 + Math.floor(shimmer1 * 50);
            g = 120 + Math.floor(shimmer1 * 60 + wave * 30);
            b = 220 + Math.floor(shimmer1 * 35);
          } else if (colorType === 1) {
            // White
            const w = 200 + Math.floor(shimmer1 * 55);
            r = w;
            g = w;
            b = w + Math.floor(shimmer2 * 15);
          } else {
            // Silver
            const s = 160 + Math.floor(shimmer1 * 60 + wave * 25);
            r = s - Math.floor(shimmer2 * 10);
            g = s;
            b = s + Math.floor(shimmer2 * 20);
          }
          ctx.fillStyle = `rgb(${r},${g},${b})`;
        } else {
          ctx.fillStyle = getParticleColor(pt.z, time, pt.index, pt.isGrey);
        }

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();

        if (!explodeTime && !formTextTime) {
          if (pt.isGrey) {
            const glint = Math.sin(time * 5 + pt.index * 0.8) * 0.5 + 0.5;
            if (glint > 0.5) {
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, pt.size * 0.7, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(255, 255, 255, ${(glint - 0.5) * 1.2})`;
              ctx.fill();
            }
          } else if (pt.z > 0.2) {
            const glint = Math.sin(time * 4 + pt.index * 1.3) * 0.5 + 0.5;
            if (glint > 0.7) {
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, pt.size * 0.5, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(255, 255, 255, ${(glint - 0.7) * 2})`;
              ctx.fill();
            }
          }
        }

        // Shimmer on formed text — travelling sparkle wave
        if (formTextTime && pt.hasTextTarget && formProgress > 0.4) {
          const wave = Math.sin(time * 2.5 - pt.x * 0.015 + pt.y * 0.008) * 0.5 + 0.5;
          const glint = Math.sin(time * 7 + pt.index * 0.6) * 0.5 + 0.5;
          const sparkle = wave * glint;
          if (sparkle > 0.4) {
            const intensity = (sparkle - 0.4) * 2.5 * pt.alpha;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(220, 235, 255, ${Math.min(intensity, 1)})`;
            ctx.fill();
          }
          if (sparkle > 0.7) {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${(sparkle - 0.7) * 3 * pt.alpha})`;
            ctx.fill();
          }
        }
      }

      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100vw',
        height: '100vh',
        background: '#000',
        cursor: 'default',
      }}
    />
  );
}
