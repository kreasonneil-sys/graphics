import React, { useRef, useEffect } from 'react';

const PARTICLE_COUNT = 1400;
const SPHERE_RADIUS = 180;
const INTRO_DURATION = 10000;
const BASE_ROTATION_SPEED = 0.0012;
const EXPLODE_DURATION = 800;
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

function getParticleColor(normalizedZ, time, index) {
  const shimmer = Math.sin(time * 2.5 + index * 0.4) * 0.5 + 0.5;
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

    const spherePoints = fibonacci(PARTICLE_COUNT);

    const particles = spherePoints.map((target, i) => {
      const side = Math.floor(Math.random() * 4);
      let sx, sy;
      switch (side) {
        case 0: sx = -50; sy = Math.random() * window.innerHeight; break;
        case 1: sx = window.innerWidth + 50; sy = Math.random() * window.innerHeight; break;
        case 2: sx = Math.random() * window.innerWidth; sy = -50; break;
        default: sx = Math.random() * window.innerWidth; sy = window.innerHeight + 50; break;
      }

      const floatOffset = Math.random() * Math.PI * 2;

      return {
        startX: sx,
        startY: sy,
        target,
        index: i,
        floatOffset,
        explodeVx: 0,
        explodeVy: 0,
        explodeX: 0,
        explodeY: 0,
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
        const rotXAngle = Math.sin(time * 0.3) * 0.3;

        for (const p of particles) {
          let rotated = rotateY(p.target, rotYAngle);
          rotated = rotateX(rotated, rotXAngle);

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

    function rotateX(point, angle) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return {
        x: point.x,
        y: point.y * cos - point.z * sin,
        z: point.y * sin + point.z * cos,
      };
    }

    function easeInOutQuart(t) {
      return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    }

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function render(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / INTRO_DURATION, 1);
      const easedProgress = easeInOutQuart(progress);

      const time = timestamp / 1000;
      const rotYAngle = time * BASE_ROTATION_SPEED * 6;
      const rotXAngle = Math.sin(time * 0.3) * 0.3;

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let explodeProgress = 0;
      if (explodeTime) {
        explodeProgress = Math.min((timestamp - explodeTime) / EXPLODE_DURATION, 1);
      }

      const projected = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        let rotated = rotateY(p.target, rotYAngle);
        rotated = rotateX(rotated, rotXAngle);

        const floatY = Math.sin(time * FLOAT_SPEED + p.floatOffset) * FLOAT_AMPLITUDE;
        const floatX = Math.cos(time * FLOAT_SPEED * 0.7 + p.floatOffset + 1.5) * FLOAT_AMPLITUDE * 0.5;

        const worldX = cx + rotated.x * SPHERE_RADIUS + floatX * easedProgress;
        const worldY = cy + rotated.y * SPHERE_RADIUS + floatY * easedProgress;

        let drawX, drawY;

        if (explodeTime) {
          const eased = easeOutCubic(explodeProgress);
          drawX = p.explodeX + p.explodeVx * eased * 120;
          drawY = p.explodeY + p.explodeVy * eased * 120;
        } else {
          drawX = p.startX + (worldX - p.startX) * easedProgress;
          drawY = p.startY + (worldY - p.startY) * easedProgress;
        }

        const depthScale = (rotated.z + 1.5) / 2.5;
        const baseSize = (0.3 + depthScale * 0.9) * (0.3 + easedProgress * 0.7);
        const baseAlpha = (0.3 + depthScale * 0.7) * (0.2 + easedProgress * 0.8);

        const size = explodeTime ? baseSize * (1 - explodeProgress * 0.6) : baseSize;
        const alpha = explodeTime ? baseAlpha * (1 - explodeProgress) : baseAlpha;

        projected.push({
          x: drawX,
          y: drawY,
          z: rotated.z,
          size,
          alpha,
          index: i,
        });
      }

      projected.sort((a, b) => a.z - b.z);

      for (const pt of projected) {
        if (pt.alpha <= 0) continue;
        const color = getParticleColor(pt.z, time, pt.index);
        ctx.globalAlpha = pt.alpha;

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        if (pt.z > 0.2 && !explodeTime) {
          const glint = Math.sin(time * 4 + pt.index * 1.3) * 0.5 + 0.5;
          if (glint > 0.7) {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${(glint - 0.7) * 2})`;
            ctx.fill();
          }
        }
      }

      ctx.globalAlpha = 1;

      if (explodeTime && explodeProgress >= 1) {
        return;
      }

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
