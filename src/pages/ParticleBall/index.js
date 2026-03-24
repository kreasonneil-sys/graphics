import React, { useRef, useEffect } from 'react';

const PARTICLE_COUNT = 4000;
const SPHERE_RADIUS = 140;
const INTRO_DURATION = 12000;
const BASE_ROTATION_SPEED = 0.0008;
const AXIAL_TILT = 23.4 * (Math.PI / 180);
const GREY_RATIO = 0.18;
const EXPLODE_DURATION = 800;
const FORM_AFRICA_DELAY = 400;
const FORM_AFRICA_DURATION = 3000;
const FLOAT_AMPLITUDE = 8;
const FLOAT_SPEED = 0.4;
const AFRICA_SCALE = 280;
const STAR_DRAW_DURATION = 2500;

// Africa continent outline — normalized coordinates centered at (0,0)
const AFRICA_OUTLINE = [
  [0.05, -0.95], [0.15, -0.92], [0.35, -0.88], [0.45, -0.82],
  [0.50, -0.75], [0.52, -0.65], [0.48, -0.55], [0.55, -0.48],
  [0.60, -0.40], [0.62, -0.30], [0.58, -0.20], [0.55, -0.10],
  [0.58, 0.00], [0.62, 0.05], [0.60, 0.15], [0.55, 0.25],
  [0.50, 0.35], [0.45, 0.42], [0.42, 0.50], [0.38, 0.55],
  [0.35, 0.62], [0.30, 0.70], [0.25, 0.78], [0.18, 0.85],
  [0.10, 0.90], [0.05, 0.92], [-0.02, 0.88], [-0.08, 0.80],
  [-0.12, 0.70], [-0.15, 0.60], [-0.18, 0.50], [-0.22, 0.40],
  [-0.25, 0.30], [-0.28, 0.20], [-0.30, 0.10], [-0.32, 0.00],
  [-0.35, -0.10], [-0.38, -0.18], [-0.42, -0.25], [-0.48, -0.30],
  [-0.50, -0.35], [-0.48, -0.42], [-0.42, -0.48], [-0.38, -0.55],
  [-0.32, -0.60], [-0.25, -0.65], [-0.20, -0.72], [-0.15, -0.78],
  [-0.10, -0.85], [-0.05, -0.90], [0.00, -0.93], [0.05, -0.95],
];

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

function sampleAfricaShape(count) {
  const points = [];
  const outline = AFRICA_OUTLINE;
  const totalLen = outline.length;

  // Calculate total perimeter length for even distribution
  const segLengths = [];
  let totalPerimeter = 0;
  for (let i = 0; i < totalLen; i++) {
    const next = (i + 1) % totalLen;
    const dx = outline[next][0] - outline[i][0];
    const dy = outline[next][1] - outline[i][1];
    const len = Math.sqrt(dx * dx + dy * dy);
    segLengths.push(len);
    totalPerimeter += len;
  }

  // 70% on edges (shell wall), 30% slightly inside edges for density
  const edgeCount = Math.floor(count * 0.7);
  const nearEdgeCount = count - edgeCount;

  // Sample edge points evenly along perimeter
  for (let i = 0; i < edgeCount; i++) {
    const targetDist = (i / edgeCount) * totalPerimeter + Math.random() * (totalPerimeter / edgeCount) * 0.8;
    let accum = 0;
    let segIdx = 0;
    let dist = targetDist % totalPerimeter;
    for (let s = 0; s < totalLen; s++) {
      if (accum + segLengths[s] >= dist) {
        segIdx = s;
        break;
      }
      accum += segLengths[s];
    }
    const t = (dist - accum) / segLengths[segIdx];
    const next = (segIdx + 1) % totalLen;
    const px = outline[segIdx][0] + (outline[next][0] - outline[segIdx][0]) * t;
    const py = outline[segIdx][1] + (outline[next][1] - outline[segIdx][1]) * t;

    // Compute normal for slight thickness
    const nx = outline[next][1] - outline[segIdx][1];
    const ny = -(outline[next][0] - outline[segIdx][0]);
    const nMag = Math.sqrt(nx * nx + ny * ny) || 1;
    const thickness = (Math.random() - 0.5) * 0.03;

    points.push({
      x: px + (nx / nMag) * thickness,
      y: py + (ny / nMag) * thickness,
      z: 0,
      edgeDist: i / edgeCount, // 0-1 along the perimeter for star drawing
    });
  }

  // Near-edge points — slightly offset inward for wall density
  for (let i = 0; i < nearEdgeCount; i++) {
    const segIdx = Math.floor(Math.random() * totalLen);
    const next = (segIdx + 1) % totalLen;
    const t = Math.random();
    const px = outline[segIdx][0] + (outline[next][0] - outline[segIdx][0]) * t;
    const py = outline[segIdx][1] + (outline[next][1] - outline[segIdx][1]) * t;

    const nx = outline[next][1] - outline[segIdx][1];
    const ny = -(outline[next][0] - outline[segIdx][0]);
    const nMag = Math.sqrt(nx * nx + ny * ny) || 1;
    const offset = (Math.random() * 0.06 + 0.01) * (Math.random() < 0.5 ? 1 : -1);

    points.push({
      x: px + (nx / nMag) * offset,
      y: py + (ny / nMag) * offset,
      z: 0,
      edgeDist: (segIdx + t) / totalLen,
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
    const r = 120 + Math.floor(shimmer * 60);
    const g = 180 + Math.floor(shimmer * 55);
    const b = 240 + Math.floor(shimmer * 15);
    return `rgb(${r},${g},${b})`;
  }
  const depth = (normalizedZ + 1) / 2;
  const r = 10 + Math.floor(depth * 20);
  const g = 30 + Math.floor(depth * 60 + shimmer * 30);
  const b = 120 + Math.floor(depth * 135);
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
    let formAfricaTime = null;
    let africaPoints = null;
    let starDrawStart = null;

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
        africaTarget: null,
        explodedFinalX: 0,
        explodedFinalY: 0,
        edgeDist: 0,
      };
    });

    const center = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function handleClick() {
      if (!explodeTime) {
        explodeTime = performance.now();
        const time = performance.now() / 1000;
        const rotYAngle = time * BASE_ROTATION_SPEED * 40;

        for (const p of particles) {
          let rotated = rotateY(p.target, rotYAngle);
          rotated = rotateZ(rotated, AXIAL_TILT);

          const floatY = Math.sin(time * FLOAT_SPEED + p.floatOffset) * FLOAT_AMPLITUDE;
          const floatX = Math.cos(time * FLOAT_SPEED * 0.7 + p.floatOffset + 1.5) * FLOAT_AMPLITUDE * 0.5;

          p.explodeX = center.x + rotated.x * SPHERE_RADIUS + floatX;
          p.explodeY = center.y + rotated.y * SPHERE_RADIUS + floatY;

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
      const rotSpeed = progress >= 1 && !explodeTime ? BASE_ROTATION_SPEED * 40 : BASE_ROTATION_SPEED * 6;
      const rotYAngle = time * rotSpeed;

      center.x = canvas.width / 2;
      center.y = canvas.height / 2;

      const cx = center.x;
      const cy = center.y;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let explodeProgress = 0;
      if (explodeTime) {
        explodeProgress = Math.min((timestamp - explodeTime) / EXPLODE_DURATION, 1);
      }

      // Start Africa formation after explosion + delay
      if (explodeTime && explodeProgress >= 1 && !formAfricaTime) {
        if (timestamp - (explodeTime + EXPLODE_DURATION) >= FORM_AFRICA_DELAY) {
          formAfricaTime = timestamp;
          starDrawStart = timestamp;
          africaPoints = sampleAfricaShape(PARTICLE_COUNT);
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.explodedFinalX = p.explodeX + p.explodeVx * 120;
            p.explodedFinalY = p.explodeY + p.explodeVy * 120;
            if (i < africaPoints.length) {
              p.africaTarget = africaPoints[i];
              p.edgeDist = africaPoints[i].edgeDist;
            }
          }
        }
      }

      let formProgress = 0;
      if (formAfricaTime) {
        formProgress = Math.min((timestamp - formAfricaTime) / FORM_AFRICA_DURATION, 1);
      }

      // Star drawing progress (star traces the outline)
      let starProgress = 0;
      if (starDrawStart) {
        starProgress = Math.min((timestamp - starDrawStart) / STAR_DRAW_DURATION, 1);
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

        if (formAfricaTime && p.africaTarget) {
          const easedForm = easeOutCubic(formProgress);
          // Rotate Africa continuously
          const africaRotAngle = time * 0.4;
          const ar = rotateY(p.africaTarget, africaRotAngle);
          const ax = canvas.width / 2 + ar.x * AFRICA_SCALE;
          const ay = canvas.height / 2 + ar.y * AFRICA_SCALE;
          drawX = p.explodedFinalX + (ax - p.explodedFinalX) * easedForm;
          drawY = p.explodedFinalY + (ay - p.explodedFinalY) * easedForm;

          // Transparent from front (z near 0), solid from side (z spread)
          // Use absolute z for alpha — front-facing particles are faint, side ones are solid
          const absZ = Math.abs(ar.z);
          const frontAlpha = 0.08 + absZ * 0.92; // near 0 at front, ~1 at sides
          drawAlpha = (0.1 + easedForm * 0.9) * frontAlpha;

          // Star drawing reveal — particles appear as star passes
          const particleEdge = p.edgeDist;
          if (starProgress < 1) {
            const revealWindow = 0.15;
            const dist = particleEdge - starProgress;
            const wrapped = dist < -0.5 ? dist + 1 : dist > 0.5 ? dist - 1 : dist;
            if (wrapped > revealWindow) {
              drawAlpha = 0;
            } else if (wrapped > 0) {
              drawAlpha *= (1 - wrapped / revealWindow) * 0.5;
            }
          }

          drawSize = (0.6 + easedForm * 0.5) * (0.4 + absZ * 0.6);
        } else if (explodeTime) {
          const eased = easeOutCubic(explodeProgress);
          drawX = p.explodeX + p.explodeVx * eased * 120;
          drawY = p.explodeY + p.explodeVy * eased * 120;
          const depthScale = (rotated.z + 1.5) / 2.5;
          const baseSize = (0.15 + depthScale * 0.45) * (0.3 + easedProgress * 0.7);
          const baseAlpha = (0.3 + depthScale * 0.7) * (0.2 + easedProgress * 0.8);
          drawSize = baseSize * (1 - explodeProgress * 0.6);
          drawAlpha = baseAlpha * Math.max(0.15, 1 - explodeProgress * 0.85);
        } else {
          drawX = p.startX + (worldX - p.startX) * easedProgress;
          drawY = p.startY + (worldY - p.startY) * easedProgress;
          const depthScale = (rotated.z + 1.5) / 2.5;
          drawSize = (0.15 + depthScale * 0.45) * (0.3 + easedProgress * 0.7);
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
          hasAfrica: !!p.africaTarget,
          edgeDist: p.edgeDist,
        });
      }

      projected.sort((a, b) => a.z - b.z);

      for (const pt of projected) {
        if (pt.alpha <= 0.01) continue;
        ctx.globalAlpha = pt.alpha;

        if (formAfricaTime && pt.hasAfrica && formProgress > 0.05) {
          // Bright green with shimmer
          const shimmer = Math.sin(time * 4.0 + pt.index * 0.3) * 0.5 + 0.5;
          const wave = Math.sin(time * 2.5 + pt.x * 0.008 + pt.y * 0.005) * 0.5 + 0.5;
          const r = 10 + Math.floor(shimmer * 30 + wave * 15);
          const g = 180 + Math.floor(shimmer * 75);
          const b = 20 + Math.floor(shimmer * 25 + wave * 10);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
        } else {
          ctx.fillStyle = getParticleColor(pt.z, time, pt.index, pt.isGrey);
        }

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();

        if (!explodeTime && !formAfricaTime) {
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

        // Green glow shimmer on Africa particles
        if (formAfricaTime && pt.hasAfrica && formProgress > 0.3) {
          const wave = Math.sin(time * 3.0 - pt.x * 0.012 + pt.y * 0.006) * 0.5 + 0.5;
          const glint = Math.sin(time * 6 + pt.index * 0.5) * 0.5 + 0.5;
          const sparkle = wave * glint;
          if (sparkle > 0.4) {
            const intensity = (sparkle - 0.4) * 2.5 * pt.alpha;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size * 0.7, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(100, 255, 120, ${Math.min(intensity, 1)})`;
            ctx.fill();
          }
          if (sparkle > 0.7) {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size * 0.35, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(220, 255, 220, ${(sparkle - 0.7) * 3 * pt.alpha})`;
            ctx.fill();
          }
        }
      }

      // Draw the glimmering star tracer
      if (formAfricaTime && starProgress < 1 && starProgress > 0) {
        const africaRotAngle = time * 0.4;
        // Find star position along outline
        const outlineIdx = starProgress * (AFRICA_OUTLINE.length - 1);
        const idx0 = Math.floor(outlineIdx);
        const idx1 = Math.min(idx0 + 1, AFRICA_OUTLINE.length - 1);
        const t = outlineIdx - idx0;
        const sx = AFRICA_OUTLINE[idx0][0] + (AFRICA_OUTLINE[idx1][0] - AFRICA_OUTLINE[idx0][0]) * t;
        const sy = AFRICA_OUTLINE[idx0][1] + (AFRICA_OUTLINE[idx1][1] - AFRICA_OUTLINE[idx0][1]) * t;

        const starPt = rotateY({ x: sx, y: sy, z: 0 }, africaRotAngle);
        const starScreenX = canvas.width / 2 + starPt.x * AFRICA_SCALE;
        const starScreenY = canvas.height / 2 + starPt.y * AFRICA_SCALE;

        // Star glow layers
        const pulse = Math.sin(time * 12) * 0.3 + 0.7;
        ctx.globalAlpha = 0.15 * pulse;
        ctx.beginPath();
        ctx.arc(starScreenX, starScreenY, 18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180, 255, 180, 1)';
        ctx.fill();

        ctx.globalAlpha = 0.4 * pulse;
        ctx.beginPath();
        ctx.arc(starScreenX, starScreenY, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(150, 255, 150, 1)';
        ctx.fill();

        ctx.globalAlpha = 0.8 * pulse;
        ctx.beginPath();
        ctx.arc(starScreenX, starScreenY, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(220, 255, 220, 1)';
        ctx.fill();

        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.arc(starScreenX, starScreenY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Star cross rays
        ctx.globalAlpha = 0.6 * pulse;
        ctx.strokeStyle = 'rgba(200, 255, 200, 0.8)';
        ctx.lineWidth = 1.5;
        const rayLen = 12 + Math.sin(time * 8) * 4;
        for (let a = 0; a < 4; a++) {
          const angle = (a * Math.PI) / 4 + time * 3;
          ctx.beginPath();
          ctx.moveTo(starScreenX, starScreenY);
          ctx.lineTo(
            starScreenX + Math.cos(angle) * rayLen,
            starScreenY + Math.sin(angle) * rayLen
          );
          ctx.stroke();
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
