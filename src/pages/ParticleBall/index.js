import React, { useRef, useEffect } from 'react';

const PARTICLE_COUNT = 4000;
const SPHERE_RADIUS = 140;
const INTRO_DURATION = 12000;
const BASE_ROTATION_SPEED = 0.0008;
const AXIAL_TILT = 23.4 * (Math.PI / 180);
const GREY_RATIO = 0.18;
const EXPLODE_DURATION = 800;
const FORM_AFRICA_DELAY = 400;
const FORM_AFRICA_DURATION = 2500;
const FLOAT_AMPLITUDE = 8;
const FLOAT_SPEED = 0.4;
const AFRICA_SCALE = 200;
const STAR_DRAW_DURATION = 2500;
const WALL_THICKNESS = 0.6; // z-depth spread for the wall (thick from side)
const Z_LAYERS = 50; // number of z-layers for solid side view

// High-detail Africa continent outline — normalized, centered at (0,0)
const AFRICA_OUTLINE = [
  // === Morocco — Strait of Gibraltar ===
  [-0.10, -0.92], [-0.06, -0.93], [-0.02, -0.94], [0.02, -0.94],
  // Mediterranean coast — Algeria
  [0.06, -0.93], [0.10, -0.92], [0.14, -0.91], [0.18, -0.90],
  [0.22, -0.90], [0.26, -0.89], [0.30, -0.88],
  // Tunisia — Cap Bon peninsula
  [0.34, -0.87], [0.37, -0.86], [0.40, -0.84], [0.42, -0.82],
  [0.44, -0.80], [0.43, -0.78], [0.41, -0.76],
  // Gulf of Sidra — Libya
  [0.40, -0.74], [0.42, -0.72], [0.44, -0.70], [0.46, -0.68],
  [0.48, -0.66], [0.50, -0.64], [0.52, -0.62],
  // Libya / Egypt border coast
  [0.53, -0.60], [0.54, -0.58], [0.55, -0.56],
  // Nile Delta — Egypt
  [0.56, -0.54], [0.57, -0.52], [0.56, -0.50], [0.55, -0.48],
  // Sinai Peninsula
  [0.57, -0.46], [0.59, -0.44], [0.58, -0.42], [0.56, -0.41],
  // Suez / Red Sea coast — Egypt
  [0.54, -0.40], [0.53, -0.38], [0.52, -0.36], [0.50, -0.34],
  // Sudan Red Sea coast
  [0.49, -0.32], [0.48, -0.30], [0.49, -0.28], [0.50, -0.26],
  // Eritrea
  [0.52, -0.24], [0.54, -0.22], [0.55, -0.20],
  // Djibouti
  [0.57, -0.18], [0.59, -0.16], [0.60, -0.14],
  // === Horn of Africa — Somalia ===
  [0.62, -0.12], [0.64, -0.10], [0.66, -0.08],
  [0.68, -0.06], [0.70, -0.04], [0.72, -0.02],
  // Tip of the Horn
  [0.74, 0.00], [0.73, 0.02], [0.71, 0.04],
  // Somalia coast curving south
  [0.68, 0.06], [0.65, 0.07], [0.62, 0.08],
  [0.58, 0.10], [0.55, 0.12], [0.52, 0.14],
  // Kenya coast
  [0.50, 0.16], [0.49, 0.18], [0.48, 0.20],
  [0.47, 0.22], [0.46, 0.24],
  // Tanzania coast
  [0.47, 0.26], [0.48, 0.28], [0.47, 0.30],
  [0.46, 0.32], [0.45, 0.34], [0.44, 0.36],
  [0.43, 0.38], [0.44, 0.40],
  // Mozambique coast
  [0.45, 0.42], [0.44, 0.44], [0.43, 0.46],
  [0.42, 0.48], [0.40, 0.50], [0.38, 0.52],
  [0.36, 0.54], [0.38, 0.56], [0.40, 0.58],
  // Southern Mozambique
  [0.38, 0.60], [0.36, 0.62], [0.34, 0.64],
  [0.32, 0.66], [0.30, 0.68],
  // === South Africa east coast ===
  [0.28, 0.70], [0.26, 0.72], [0.24, 0.74],
  [0.22, 0.76], [0.20, 0.78], [0.18, 0.80],
  // KwaZulu-Natal
  [0.16, 0.82], [0.14, 0.83], [0.12, 0.84],
  // Cape Agulhas — southernmost point
  [0.08, 0.86], [0.04, 0.87], [0.00, 0.88],
  [-0.04, 0.87], [-0.08, 0.86],
  // === Cape of Good Hope ===
  [-0.10, 0.84], [-0.12, 0.82], [-0.13, 0.80],
  [-0.14, 0.78],
  // West coast — South Africa
  [-0.15, 0.76], [-0.16, 0.74], [-0.17, 0.72],
  [-0.18, 0.70], [-0.19, 0.68],
  // Namibia — Skeleton Coast
  [-0.20, 0.66], [-0.20, 0.64], [-0.21, 0.62],
  [-0.22, 0.60], [-0.22, 0.58], [-0.23, 0.56],
  [-0.24, 0.54], [-0.24, 0.52], [-0.25, 0.50],
  // Angola coast
  [-0.26, 0.48], [-0.27, 0.46], [-0.28, 0.44],
  [-0.30, 0.42], [-0.32, 0.40],
  // Congo River mouth
  [-0.34, 0.38], [-0.36, 0.36], [-0.37, 0.34],
  // === Gabon / Equatorial Guinea ===
  [-0.38, 0.32], [-0.40, 0.30], [-0.41, 0.28],
  [-0.42, 0.26], [-0.43, 0.24],
  // Cameroon coast
  [-0.44, 0.22], [-0.44, 0.20], [-0.45, 0.18],
  [-0.44, 0.16], [-0.43, 0.14],
  // === Gulf of Guinea — deep indent ===
  [-0.42, 0.12], [-0.40, 0.10], [-0.38, 0.08],
  [-0.36, 0.06], [-0.34, 0.04], [-0.32, 0.02],
  // Nigeria coast — bight of Benin
  [-0.30, 0.00], [-0.32, -0.02], [-0.34, -0.04],
  [-0.36, -0.06], [-0.38, -0.08],
  // Ghana / Ivory Coast
  [-0.40, -0.10], [-0.42, -0.12], [-0.44, -0.14],
  [-0.46, -0.15], [-0.48, -0.16],
  // Liberia / Sierra Leone
  [-0.50, -0.18], [-0.52, -0.20], [-0.54, -0.22],
  [-0.56, -0.24],
  // === West Africa bulge — Guinea / Sierra Leone ===
  [-0.58, -0.26], [-0.60, -0.28], [-0.62, -0.30],
  [-0.63, -0.32], [-0.64, -0.34],
  // Guinea-Bissau
  [-0.65, -0.36], [-0.66, -0.38],
  // === Senegal — westernmost point (Cap-Vert) ===
  [-0.68, -0.40], [-0.69, -0.42], [-0.68, -0.44],
  [-0.66, -0.45], [-0.64, -0.46],
  // The Gambia indent
  [-0.62, -0.44], [-0.64, -0.43], [-0.66, -0.44],
  // Senegal north coast
  [-0.64, -0.46], [-0.62, -0.48], [-0.60, -0.50],
  // Mauritania coast
  [-0.58, -0.52], [-0.56, -0.54], [-0.54, -0.56],
  [-0.52, -0.58], [-0.50, -0.60],
  // Western Sahara
  [-0.48, -0.62], [-0.46, -0.64], [-0.44, -0.66],
  [-0.42, -0.68], [-0.40, -0.70],
  // Southern Morocco
  [-0.38, -0.72], [-0.36, -0.74], [-0.34, -0.76],
  [-0.32, -0.78], [-0.30, -0.80],
  // Morocco — Atlantic coast
  [-0.28, -0.82], [-0.26, -0.84], [-0.24, -0.86],
  [-0.22, -0.88], [-0.20, -0.89],
  // Northern Morocco — back to start
  [-0.18, -0.90], [-0.16, -0.91], [-0.14, -0.92],
  [-0.12, -0.92], [-0.10, -0.92],
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

function rotateYPt(point, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: point.x * cos + point.z * sin,
    y: point.y,
    z: -point.x * sin + point.z * cos,
  };
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
        explodedFinalX: 0,
        explodedFinalY: 0,
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
          let rotated = rotateYPt(p.target, rotYAngle);
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
          p.explodedFinalX = p.explodeX + p.explodeVx * 120;
          p.explodedFinalY = p.explodeY + p.explodeVy * 120;
        }
      }
    }
    canvas.addEventListener('click', handleClick);

    function rotateY(point, angle) {
      return rotateYPt(point, angle);
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

    // Draw a single z-layer of the Africa outline as a solid line
    function drawAfricaLayer(rotAngle, zOffset, alpha, lineWidth, revealFraction, time) {
      const outline = AFRICA_OUTLINE;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // How many points to draw based on reveal
      const pointsToDraw = Math.max(2, Math.floor(outline.length * revealFraction));

      // Transform each outline point through 3D rotation
      const screenPts = [];
      for (let i = 0; i < pointsToDraw; i++) {
        const pt = { x: outline[i][0], y: outline[i][1], z: zOffset };
        const r = rotateYPt(pt, rotAngle);
        screenPts.push({
          sx: cx + r.x * AFRICA_SCALE,
          sy: cy + r.y * AFRICA_SCALE,
          z: r.z,
        });
      }

      if (screenPts.length < 2) return;

      // Bright green with shimmer per layer
      const shimmer = Math.sin(time * 3.0 + zOffset * 20) * 0.15 + 0.85;
      const g = Math.floor(200 * shimmer + 55);
      const r = Math.floor(20 * shimmer + 10);
      const b = Math.floor(30 * shimmer + 15);

      ctx.globalAlpha = alpha * shimmer;
      ctx.strokeStyle = `rgb(${r},${g},${b})`;
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(screenPts[0].sx, screenPts[0].sy);
      for (let i = 1; i < screenPts.length; i++) {
        ctx.lineTo(screenPts[i].sx, screenPts[i].sy);
      }
      // Close the path if fully revealed
      if (revealFraction >= 1) {
        ctx.closePath();
      }
      ctx.stroke();
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
        }
      }

      let formProgress = 0;
      if (formAfricaTime) {
        formProgress = Math.min((timestamp - formAfricaTime) / FORM_AFRICA_DURATION, 1);
      }

      let starProgress = 0;
      if (starDrawStart) {
        starProgress = Math.min((timestamp - starDrawStart) / STAR_DRAW_DURATION, 1);
      }

      // === Draw ball particles (pre-Africa phase) ===
      if (!formAfricaTime || formProgress < 1) {
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

          if (formAfricaTime) {
            // Fade out particles as Africa forms
            const fadeOut = 1 - formProgress;
            drawX = p.explodedFinalX;
            drawY = p.explodedFinalY;
            const depthScale = (rotated.z + 1.5) / 2.5;
            drawSize = (0.15 + depthScale * 0.45) * 0.4;
            drawAlpha = fadeOut * 0.3;
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
            x: drawX, y: drawY, z: rotated.z,
            size: drawSize, alpha: drawAlpha,
            index: i, isGrey: p.isGrey,
          });
        }

        projected.sort((a, b) => a.z - b.z);

        for (const pt of projected) {
          if (pt.alpha <= 0.01) continue;
          ctx.globalAlpha = pt.alpha;
          ctx.fillStyle = getParticleColor(pt.z, time, pt.index, pt.isGrey);
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
        }
      }

      // === Draw 3D Africa as solid lines across many z-layers ===
      if (formAfricaTime && formProgress > 0) {
        const africaRotAngle = time * 0.4;
        const easedForm = easeOutCubic(formProgress);
        const revealFraction = Math.min(starProgress * 1.1, 1);

        // Sort layers back-to-front based on rotation
        const layers = [];
        for (let l = 0; l < Z_LAYERS; l++) {
          const zNorm = (l / (Z_LAYERS - 1)) - 0.5; // -0.5 to 0.5
          const zOffset = zNorm * WALL_THICKNESS;
          // Get the rotated z to determine draw order
          const testPt = rotateYPt({ x: 0, y: 0, z: zOffset }, africaRotAngle);
          layers.push({ zOffset, rotatedZ: testPt.z, layerIdx: l });
        }
        layers.sort((a, b) => a.rotatedZ - b.rotatedZ);

        // Calculate facing angle for alpha
        const cosAngle = Math.abs(Math.cos(africaRotAngle));
        // Front view: cosAngle~1 → transparent. Side view: cosAngle~0 → solid
        const frontFade = 1 - cosAngle * 0.85;

        for (const layer of layers) {
          const layerAlpha = easedForm * frontFade;
          // Thicker line from side, thinner from front
          const lineW = 1.5 + (1 - cosAngle) * 1.5;

          drawAfricaLayer(
            africaRotAngle,
            layer.zOffset,
            layerAlpha,
            lineW,
            revealFraction,
            time
          );
        }

        // Glow layer on top — brighter green outline at z=0
        if (revealFraction > 0.1) {
          const glowPulse = Math.sin(time * 2.5) * 0.15 + 0.85;
          ctx.globalAlpha = easedForm * 0.3 * glowPulse * frontFade;
          ctx.shadowColor = 'rgba(0, 255, 50, 0.8)';
          ctx.shadowBlur = 15;
          drawAfricaLayer(africaRotAngle, 0, easedForm * 0.5 * frontFade, 3, revealFraction, time);
          ctx.shadowBlur = 0;
        }
      }

      // === Glimmering star tracer ===
      if (formAfricaTime && starProgress < 1 && starProgress > 0) {
        const africaRotAngle = time * 0.4;
        const outlineIdx = starProgress * (AFRICA_OUTLINE.length - 1);
        const idx0 = Math.floor(outlineIdx);
        const idx1 = Math.min(idx0 + 1, AFRICA_OUTLINE.length - 1);
        const t = outlineIdx - idx0;
        const sx = AFRICA_OUTLINE[idx0][0] + (AFRICA_OUTLINE[idx1][0] - AFRICA_OUTLINE[idx0][0]) * t;
        const sy = AFRICA_OUTLINE[idx0][1] + (AFRICA_OUTLINE[idx1][1] - AFRICA_OUTLINE[idx0][1]) * t;

        const starPt = rotateYPt({ x: sx, y: sy, z: 0 }, africaRotAngle);
        const starScreenX = canvas.width / 2 + starPt.x * AFRICA_SCALE;
        const starScreenY = canvas.height / 2 + starPt.y * AFRICA_SCALE;

        const pulse = Math.sin(time * 12) * 0.3 + 0.7;

        // Outer glow
        ctx.globalAlpha = 0.2 * pulse;
        ctx.beginPath();
        ctx.arc(starScreenX, starScreenY, 22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(150, 255, 150, 1)';
        ctx.fill();

        ctx.globalAlpha = 0.45 * pulse;
        ctx.beginPath();
        ctx.arc(starScreenX, starScreenY, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100, 255, 100, 1)';
        ctx.fill();

        ctx.globalAlpha = 0.85 * pulse;
        ctx.beginPath();
        ctx.arc(starScreenX, starScreenY, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200, 255, 200, 1)';
        ctx.fill();

        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.arc(starScreenX, starScreenY, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Spinning cross rays
        ctx.globalAlpha = 0.7 * pulse;
        ctx.strokeStyle = 'rgba(180, 255, 180, 0.9)';
        ctx.lineWidth = 1.8;
        const rayLen = 16 + Math.sin(time * 8) * 5;
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

        // Sparkle trail — small dots behind star
        for (let s = 1; s <= 8; s++) {
          const trailProgress = Math.max(0, starProgress - s * 0.008);
          const tIdx = trailProgress * (AFRICA_OUTLINE.length - 1);
          const ti0 = Math.floor(tIdx);
          const ti1 = Math.min(ti0 + 1, AFRICA_OUTLINE.length - 1);
          const tt = tIdx - ti0;
          const tx = AFRICA_OUTLINE[ti0][0] + (AFRICA_OUTLINE[ti1][0] - AFRICA_OUTLINE[ti0][0]) * tt;
          const ty = AFRICA_OUTLINE[ti0][1] + (AFRICA_OUTLINE[ti1][1] - AFRICA_OUTLINE[ti0][1]) * tt;
          const tPt = rotateYPt({ x: tx, y: ty, z: 0 }, africaRotAngle);
          const tSx = canvas.width / 2 + tPt.x * AFRICA_SCALE;
          const tSy = canvas.height / 2 + tPt.y * AFRICA_SCALE;

          ctx.globalAlpha = (1 - s / 9) * 0.6 * pulse;
          ctx.beginPath();
          ctx.arc(tSx, tSy, 2.5 - s * 0.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(150, 255, 150, 1)`;
          ctx.fill();
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
