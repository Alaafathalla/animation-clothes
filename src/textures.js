import * as THREE from 'three';

/* ==========================================================================
   createGarmentSprite
   ──────────────────────────────────────────────────────────────────────────
   Draws a full, richly-shaded garment illustration onto a 2048×2048 canvas.
   The canvas uses transparency (alpha) for the background, so only the
   clothing silhouette is visible on the PlaneGeometry in Three.js.

   Drawing convention  (canvas pixels → world mapping done by caller):
     canvas (0,0) = top-left of the bounding box
     canvas width  = cfg.w (world units) * PX_PER_UNIT
     canvas height = cfg.h (world units) * PX_PER_UNIT

   All garment drawing uses:
     • Correct silhouette path (clipped with ctx.clip())
     • Multi-stop gradient shading (left-shadow, highlight, right-shadow)
     • Micro-fibre texture overlay
     • Garment-specific details (collar, placket, print, buttons, creases…)
   ========================================================================== */

const spriteCache = new Map();

/** pixels per world-unit — drives overall resolution */
const PPU = 1160;

// ── helper: parse hex colour → [r,g,b] ─────────────────────────────────────
function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// ── helper: lighten / darken a hex colour ──────────────────────────────────
function shiftColor(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  const clamp = (v) => Math.min(255, Math.max(0, Math.round(v)));
  return `rgb(${clamp(r + amount)},${clamp(g + amount)},${clamp(b + amount)})`;
}

// ── helper: rgba string from hex + alpha ───────────────────────────────────
function hexAlpha(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

/* ── micro-fibre texture overlay ─────────────────────────────────────────── */
function drawFabricTexture(ctx, W, H, hex, type = 'knit') {
  ctx.save();
  ctx.globalAlpha = 0.055;
  ctx.globalCompositeOperation = 'overlay';

  const offCtx = document.createElement('canvas');
  offCtx.width  = 64;
  offCtx.height = 64;
  const oc = offCtx.getContext('2d');
  const id = oc.createImageData(64, 64);
  const d  = id.data;
  const [r, g, b] = hexToRgb(hex);

  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const i = (y * 64 + x) * 4;
      let val;
      if (type === 'twill')  val = Math.sin((x + y) * 0.55) * 60 + Math.sin((x - y) * 0.28) * 25;
      else if (type === 'waffle') val = Math.sin(x * 0.7) * Math.cos(y * 0.7) * 75;
      else                   val = Math.sin(y * 0.9) * 40 + Math.sin(x * 1.1) * 25;
      val += (Math.random() - 0.5) * 18;
      const bright = Math.round(128 + val);
      d[i]   = Math.min(255, Math.max(0, r + bright - 128));
      d[i+1] = Math.min(255, Math.max(0, g + bright - 128));
      d[i+2] = Math.min(255, Math.max(0, b + bright - 128));
      d[i+3] = 255;
    }
  }
  oc.putImageData(id, 0, 0);

  const pat = ctx.createPattern(offCtx, 'repeat');
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

/* ── ambient-occlusion-style fold shading ────────────────────────────────── */
function drawFoldShading(ctx, W, H, hex, foldCount = 5, intensity = 0.18) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  for (let i = 0; i < foldCount; i++) {
    const cx = W * (0.15 + (i / foldCount) * 0.75);
    const grad = ctx.createLinearGradient(cx - W * 0.07, 0, cx + W * 0.07, 0);
    grad.addColorStop(0,   'rgba(255,255,255,0)');
    grad.addColorStop(0.35, `rgba(0,0,0,${intensity * 0.4})`);
    grad.addColorStop(0.5,  `rgba(255,255,255,${intensity * 0.2})`);
    grad.addColorStop(0.65, `rgba(0,0,0,${intensity * 0.3})`);
    grad.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - W * 0.09, H * 0.1, W * 0.18, H * 0.85);
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

/* ── main side / edge shading (left-dark, centre-bright, right-dark) ─────── */
function drawSideShading(ctx, W, H, hex) {
  ctx.save();
  const dark  = hexAlpha(hex, 0);
  const hi    = 'rgba(255,255,255,0.09)';
  const shade = 'rgba(0,0,0,0.22)';

  const grad = ctx.createLinearGradient(0, 0, W, 0);
  grad.addColorStop(0,    shade);
  grad.addColorStop(0.12, dark);
  grad.addColorStop(0.30, hi);
  grad.addColorStop(0.50, 'rgba(255,255,255,0.04)');
  grad.addColorStop(0.70, hi);
  grad.addColorStop(0.88, dark);
  grad.addColorStop(1,    shade);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // vertical gradient: slightly darker at top shoulders, lighter mid, darkish hem
  const vgrad = ctx.createLinearGradient(0, 0, 0, H);
  vgrad.addColorStop(0,    'rgba(0,0,0,0.12)');
  vgrad.addColorStop(0.15, 'rgba(0,0,0,0)');
  vgrad.addColorStop(0.75, 'rgba(0,0,0,0)');
  vgrad.addColorStop(1,    'rgba(0,0,0,0.10)');
  ctx.fillStyle = vgrad;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/* ── small circular button ───────────────────────────────────────────────── */
function drawButton(ctx, x, y, r, fillHex, rimAlpha = 0.3) {
  ctx.save();
  const bg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  bg.addColorStop(0,   shiftColor(fillHex, 30));
  bg.addColorStop(0.6, fillHex);
  bg.addColorStop(1,   shiftColor(fillHex, -25));
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.strokeStyle = `rgba(0,0,0,${rimAlpha})`;
  ctx.lineWidth = r * 0.22;
  ctx.stroke();
  // thread holes
  ctx.fillStyle = `rgba(0,0,0,${rimAlpha * 0.8})`;
  [[-0.28,-0.28],[0.28,0.28],[-0.28,0.28],[0.28,-0.28]].forEach(([ox,oy]) => {
    ctx.beginPath();
    ctx.arc(x + ox*r, y + oy*r, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

/* ── stitching dashes ─────────────────────────────────────────────────────── */
function drawStitch(ctx, x1, y1, x2, y2, color = 'rgba(255,255,255,0.22)', w = 1.8) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth   = w;
  ctx.setLineDash([6, 5]);
  ctx.lineDashOffset = 3;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════════════════════
   PER-GARMENT SILHOUETTE + DETAIL DRAWERS
   ═══════════════════════════════════════════════════════════════════════════ */

function drawShirt(ctx, W, H, item, cw, isLong = false, isCamp = true) {
  const hex = cw.hex;
  const acc = cw.accent;
  const isFaces    = item.id === 'faces-shirt-01';
  const isArtisan  = item.id === 'artisan-shirt-01';
  const isPolo     = item.type === 'polo';

  // ── sleeve endpoints (short vs long) ─────────────────────────────────
  const SL = isLong ? H * 0.58 : H * 0.36;   // sleeve length down from shoulder
  const lCuffX = W * 0.04,   lCuffY = H * 0.12 + SL;
  const rCuffX = W * 0.96,   rCuffY = H * 0.12 + SL;
  const lPitX  = W * 0.20,   lPitY  = H * 0.33;   // armpit
  const rPitX  = W * 0.80,   rPitY  = H * 0.33;

  // ── LEFT SLEEVE ───────────────────────────────────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W * 0.02,  H * 0.10);           // outer shoulder
  ctx.quadraticCurveTo(lCuffX - W*0.03, lCuffY - H*0.06, lCuffX, lCuffY);
  ctx.lineTo(lCuffX + W*0.13, lCuffY + H*0.01);
  ctx.quadraticCurveTo(lPitX, lPitY - H*0.04, lPitX, lPitY);
  ctx.closePath();
  ctx.fillStyle = hex;
  ctx.fill();

  // sleeve side shading
  const lsGrad = ctx.createLinearGradient(W*0.02, 0, lPitX, 0);
  lsGrad.addColorStop(0,   'rgba(0,0,0,0.25)');
  lsGrad.addColorStop(0.4, 'rgba(0,0,0,0.06)');
  lsGrad.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = lsGrad; ctx.fill();

  if (isLong) {
    // cuff band
    ctx.fillStyle = shiftColor(hex, -12);
    ctx.fillRect(lCuffX - W*0.01, lCuffY - H*0.03, W*0.14, H*0.04);
    drawStitch(ctx, lCuffX - W*0.01, lCuffY - H*0.025, lCuffX + W*0.13, lCuffY - H*0.025,
               hexAlpha(acc, 0.35), 1.4);
    // cuff buttons
    drawButton(ctx, lCuffX + W*0.04, lCuffY - H*0.015, W*0.016,
               shiftColor(hex, 15), 0.25);
    drawButton(ctx, lCuffX + W*0.09, lCuffY - H*0.015, W*0.016,
               shiftColor(hex, 15), 0.25);
  } else {
    // short sleeve hem
    drawStitch(ctx, lCuffX, lCuffY, lCuffX + W*0.13, lCuffY + H*0.01,
               hexAlpha(acc, 0.28), 1.2);
  }
  ctx.restore();

  // ── RIGHT SLEEVE ──────────────────────────────────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W * 0.98,  H * 0.10);
  ctx.quadraticCurveTo(rCuffX + W*0.03, rCuffY - H*0.06, rCuffX, rCuffY);
  ctx.lineTo(rCuffX - W*0.13, rCuffY + H*0.01);
  ctx.quadraticCurveTo(rPitX, rPitY - H*0.04, rPitX, rPitY);
  ctx.closePath();
  ctx.fillStyle = hex;
  ctx.fill();

  const rsGrad = ctx.createLinearGradient(W*0.98, 0, rPitX, 0);
  rsGrad.addColorStop(0,   'rgba(0,0,0,0.25)');
  rsGrad.addColorStop(0.4, 'rgba(0,0,0,0.06)');
  rsGrad.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = rsGrad; ctx.fill();

  if (isLong) {
    ctx.fillStyle = shiftColor(hex, -12);
    ctx.fillRect(rCuffX - W*0.13, rCuffY - H*0.03, W*0.14, H*0.04);
    drawStitch(ctx, rCuffX - W*0.13, rCuffY - H*0.025, rCuffX + W*0.01, rCuffY - H*0.025,
               hexAlpha(acc, 0.35), 1.4);
    drawButton(ctx, rCuffX - W*0.09, rCuffY - H*0.015, W*0.016, shiftColor(hex, 15), 0.25);
    drawButton(ctx, rCuffX - W*0.04, rCuffY - H*0.015, W*0.016, shiftColor(hex, 15), 0.25);
  } else {
    drawStitch(ctx, rCuffX - W*0.13, rCuffY + H*0.01, rCuffX, rCuffY,
               hexAlpha(acc, 0.28), 1.2);
  }
  ctx.restore();

  // ── TORSO BODY ────────────────────────────────────────────────────────
  const neckDip   = isCamp ? H * 0.12 : H * 0.06;  // how far the neckline dips
  const lNeckX    = W * 0.34,  lNeckY = H * 0.02;
  const rNeckX    = W * 0.66,  rNeckY = H * 0.02;
  const hemY      = H * 0.98;
  const lHemX     = W * 0.06,  rHemX = W * 0.94;

  ctx.save();
  ctx.beginPath();
  // neckline
  ctx.moveTo(lNeckX, lNeckY);
  if (isCamp) {
    // V-notch camp collar
    ctx.lineTo(W*0.46, H*0.01);
    ctx.quadraticCurveTo(W*0.50, neckDip, W*0.50, neckDip);  // deep V
    ctx.quadraticCurveTo(W*0.50, neckDip, W*0.54, H*0.01);
  } else if (isPolo) {
    ctx.quadraticCurveTo(W*0.50, H*0.055, rNeckX, rNeckY);
  } else {
    // crew neck arc
    ctx.quadraticCurveTo(W*0.50, H*0.07, rNeckX, rNeckY);
  }
  // shoulder to armhole
  ctx.lineTo(W * 0.82, H * 0.08);
  ctx.quadraticCurveTo(rPitX + W*0.04, rPitY - H*0.01, rPitX, rPitY);
  // side seam down
  ctx.quadraticCurveTo(rHemX + W*0.01, H*0.70, rHemX, hemY);
  // hem across
  ctx.quadraticCurveTo(W*0.50, hemY + H*0.015, lHemX, hemY);
  // left side seam up
  ctx.quadraticCurveTo(lHemX - W*0.01, H*0.70, lPitX, lPitY);
  ctx.lineTo(W * 0.18, H * 0.08);
  ctx.closePath();

  ctx.fillStyle = hex;
  ctx.fill();
  ctx.save();
  ctx.clip();

  // -- fabric texture inside silhouette --
  const ftType = item.type === 'polo' ? 'waffle' : (item.type === 'jacket' ? 'twill' : 'knit');
  drawFabricTexture(ctx, W, H, hex, ftType);
  drawSideShading(ctx, W, H, hex);
  drawFoldShading(ctx, W, H, hex, isPolo ? 4 : 5, 0.14);

  // -- hem stitch --
  drawStitch(ctx, lHemX, hemY - H*0.008, rHemX, hemY - H*0.008,
             hexAlpha(acc, 0.30), 1.6);
  drawStitch(ctx, lHemX, hemY - H*0.020, rHemX, hemY - H*0.020,
             hexAlpha(acc, 0.18), 1.2);

  // -- side seam stitch --
  drawStitch(ctx, lPitX, lPitY, lHemX, hemY, hexAlpha(acc, 0.18), 1.2);
  drawStitch(ctx, rPitX, rPitY, rHemX, hemY, hexAlpha(acc, 0.18), 1.2);

  ctx.restore(); // end clip
  ctx.restore();

  // ── COLLAR ────────────────────────────────────────────────────────────
  const cx = W * 0.50;

  if (isCamp) {
    // Open camp collar lapels
    ctx.save();
    ctx.strokeStyle = `rgba(0,0,0,0.18)`;
    ctx.lineWidth = W * 0.004;

    // Left lapel
    ctx.beginPath();
    ctx.moveTo(lNeckX, lNeckY);
    ctx.lineTo(W * 0.46, H * 0.01);
    ctx.quadraticCurveTo(W*0.42, H*0.09, cx - W*0.07, H*0.15);
    ctx.quadraticCurveTo(cx - W*0.18, H*0.14, cx - W*0.22, H*0.10);
    ctx.closePath();
    ctx.fillStyle = shiftColor(hex, -5);
    ctx.fill();
    ctx.stroke();

    // Right lapel
    ctx.beginPath();
    ctx.moveTo(rNeckX, rNeckY);
    ctx.lineTo(W * 0.54, H * 0.01);
    ctx.quadraticCurveTo(W*0.58, H*0.09, cx + W*0.07, H*0.15);
    ctx.quadraticCurveTo(cx + W*0.18, H*0.14, cx + W*0.22, H*0.10);
    ctx.closePath();
    ctx.fillStyle = shiftColor(hex, -5);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Placket line + buttons
    ctx.strokeStyle = hexAlpha(acc, 0.28);
    ctx.lineWidth   = W * 0.004;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(cx, H * 0.14);
    ctx.lineTo(cx, hemY);
    ctx.stroke();

    const btnFill = hexAlpha(acc, 1);
    const bStops  = isPolo
      ? [H*0.18, H*0.25]
      : [H*0.20, H*0.33, H*0.46, H*0.59, H*0.72];
    bStops.forEach(by => drawButton(ctx, cx, by, W*0.018, btnFill, 0.28));

  } else if (isPolo) {
    // Polo collar band + placket
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(lNeckX, lNeckY);
    ctx.quadraticCurveTo(W*0.50, H*0.055, rNeckX, rNeckY);
    ctx.lineTo(W*0.70, H * -0.01);
    ctx.quadraticCurveTo(W*0.50, H*0.085, W*0.30, H * -0.01);
    ctx.closePath();
    ctx.fillStyle = shiftColor(hex, -8);
    ctx.fill();
    ctx.strokeStyle = hexAlpha(acc, 0.20);
    ctx.lineWidth = W * 0.003;
    ctx.stroke();
    ctx.restore();

    // Placket
    ctx.fillStyle = shiftColor(hex, -6);
    ctx.fillRect(cx - W*0.040, H*0.055, W*0.080, H*0.14);
    ctx.strokeStyle = hexAlpha(acc, 0.22);
    ctx.lineWidth   = W * 0.003;
    ctx.strokeRect(cx - W*0.040, H*0.055, W*0.080, H*0.14);
    drawButton(ctx, cx, H*0.11, W*0.018, shiftColor(acc, 0), 0.30);
    drawButton(ctx, cx, H*0.15, W*0.018, shiftColor(acc, 0), 0.30);

  } else {
    // Crewneck rib band
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(lNeckX - W*0.02, lNeckY);
    ctx.quadraticCurveTo(W*0.50, H*0.085, rNeckX + W*0.02, rNeckY);
    ctx.lineTo(rNeckX, rNeckY - H*0.01);
    ctx.quadraticCurveTo(W*0.50, H*0.060, lNeckX, lNeckY - H*0.01);
    ctx.closePath();
    ctx.fillStyle = shiftColor(hex, -10);
    ctx.fill();
    // rib lines
    for (let k = 0; k < 7; k++) {
      const rx = lNeckX + (rNeckX - lNeckX) * (k / 6);
      ctx.strokeStyle = hexAlpha(acc, 0.12);
      ctx.lineWidth   = W * 0.002;
      ctx.beginPath();
      ctx.moveTo(rx, lNeckY - H*0.01);
      ctx.lineTo(rx + (W*0.50 - rx) * 0.1, H * 0.07);
      ctx.stroke();
    }
    ctx.restore();
  }

  // ── GARMENT-SPECIFIC ARTWORK ──────────────────────────────────────────
  const areaX = W * 0.26, areaY = H * 0.28, areaW = W * 0.26, areaH = H * 0.30;

  if (isFaces) {
    // Faces shirt: continuous line art face illustration
    ctx.save();
    // Dark moon backdrop
    ctx.beginPath();
    ctx.arc(areaX + areaW*0.5, areaY + areaH*0.45, areaH*0.48, 0, Math.PI*2);
    ctx.fillStyle = cw.name.includes('Black')
      ? 'rgba(22,22,26,0.90)' : 'rgba(0,0,0,0.10)';
    ctx.fill();

    ctx.strokeStyle = acc;
    ctx.lineWidth   = W * 0.009;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';

    const fx = areaX + areaW*0.5, fy = areaY + areaH*0.2;
    ctx.beginPath();
    ctx.moveTo(fx - areaW*0.22, fy);
    ctx.bezierCurveTo(fx + areaW*0.18, fy - areaH*0.08,
                      fx + areaW*0.30, fy + areaH*0.16, fx + areaW*0.28, fy + areaH*0.30);
    ctx.bezierCurveTo(fx + areaW*0.26, fy + areaH*0.44, fx + areaW*0.08, fy + areaH*0.46,
                      fx + areaW*0.14, fy + areaH*0.56);
    ctx.bezierCurveTo(fx + areaW*0.22, fy + areaH*0.58, fx + areaW*0.30, fy + areaH*0.60,
                      fx + areaW*0.30, fy + areaH*0.68);
    ctx.bezierCurveTo(fx + areaW*0.15, fy + areaH*0.80, fx - areaW*0.05, fy + areaH*0.84,
                      fx - areaW*0.20, fy + areaH*0.76);
    ctx.stroke();
    // eye
    ctx.beginPath();
    ctx.arc(fx + areaW*0.10, fy + areaH*0.24, areaW*0.06, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();

  } else if (isArtisan) {
    // Artisan shirt: woodcut circle motifs
    ctx.save();
    ctx.strokeStyle = acc;
    ctx.lineWidth   = W * 0.006;
    for (let k = 0; k < 4; k++) {
      const my = areaY + k * areaH * 0.28;
      ctx.beginPath();
      ctx.arc(areaX + areaW*0.70, my, areaW*0.22, 0, Math.PI*2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(areaX + areaW*0.25, my + areaH*0.12, areaW*0.16, 0, Math.PI*2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(areaX + areaW*0.70, my - areaW*0.22);
      ctx.lineTo(areaX + areaW*0.70, my + areaW*0.22);
      ctx.stroke();
    }
    ctx.restore();

  } else if (item.id === 'white-shirt-01') {
    // Milan Studio emblem
    ctx.save();
    ctx.strokeStyle = acc;
    ctx.lineWidth   = W * 0.005;
    ctx.beginPath();
    ctx.arc(areaX + areaW*0.50, areaY + areaH*0.30, areaW*0.30, 0, Math.PI*2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(areaX + areaW*0.20, areaY + areaH*0.30);
    ctx.lineTo(areaX + areaW*0.80, areaY + areaH*0.30);
    ctx.moveTo(areaX + areaW*0.50, areaY + areaH*0.00);
    ctx.lineTo(areaX + areaW*0.50, areaY + areaH*0.60);
    ctx.stroke();
    ctx.font = `600 ${W*0.022}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = acc;
    ctx.textAlign = 'center';
    ctx.fillText('MILAN · STUDIO', areaX + areaW*0.50, areaY + areaH*0.78);
    ctx.restore();
  }
}

function drawTeeBody(ctx, W, H, item, cw) {
  const hex = cw.hex;
  const acc = cw.accent;
  const isPolo = item.type === 'polo';

  const sleeveLen  = H * 0.24;
  const lCuffX = W*0.04, lCuffY = H*0.14 + sleeveLen;
  const rCuffX = W*0.96, rCuffY = H*0.14 + sleeveLen;
  const lPitX  = W*0.20, lPitY  = H*0.36;
  const rPitX  = W*0.80, rPitY  = H*0.36;
  const hemY   = H*0.97;

  // Left sleeve
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W*0.03,  H*0.10);
  ctx.quadraticCurveTo(lCuffX - W*0.02, lCuffY - H*0.04, lCuffX, lCuffY);
  ctx.lineTo(lCuffX + W*0.14, lCuffY + H*0.005);
  ctx.quadraticCurveTo(lPitX, lPitY - H*0.03, lPitX, lPitY);
  ctx.closePath();
  ctx.fillStyle = hex;
  ctx.fill();
  const lGrad = ctx.createLinearGradient(W*0.03, 0, lPitX, 0);
  lGrad.addColorStop(0, 'rgba(0,0,0,0.22)');
  lGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = lGrad; ctx.fill();
  drawStitch(ctx, lCuffX, lCuffY+H*0.002, lCuffX+W*0.14, lCuffY+H*0.007,
             hexAlpha(acc, 0.28), 1.2);
  ctx.restore();

  // Right sleeve
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W*0.97,  H*0.10);
  ctx.quadraticCurveTo(rCuffX+W*0.02, rCuffY-H*0.04, rCuffX, rCuffY);
  ctx.lineTo(rCuffX-W*0.14, rCuffY+H*0.005);
  ctx.quadraticCurveTo(rPitX, rPitY-H*0.03, rPitX, rPitY);
  ctx.closePath();
  ctx.fillStyle = hex;
  ctx.fill();
  const rGrad = ctx.createLinearGradient(W*0.97, 0, rPitX, 0);
  rGrad.addColorStop(0, 'rgba(0,0,0,0.22)');
  rGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rGrad; ctx.fill();
  drawStitch(ctx, rCuffX-W*0.14, rCuffY+H*0.007, rCuffX, rCuffY+H*0.002,
             hexAlpha(acc, 0.28), 1.2);
  ctx.restore();

  // Torso
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W*0.34, H*0.02);
  if (isPolo) ctx.quadraticCurveTo(W*0.50, H*0.055, W*0.66, H*0.02);
  else        ctx.quadraticCurveTo(W*0.50, H*0.075, W*0.66, H*0.02);
  ctx.lineTo(W*0.82, H*0.09);
  ctx.quadraticCurveTo(rPitX+W*0.03, rPitY, rPitX, rPitY);
  ctx.quadraticCurveTo(W*0.95, H*0.72, W*0.93, hemY);
  ctx.quadraticCurveTo(W*0.50, hemY+H*0.015, W*0.07, hemY);
  ctx.quadraticCurveTo(W*0.05, H*0.72, lPitX, lPitY);
  ctx.lineTo(W*0.18, H*0.09);
  ctx.closePath();
  ctx.fillStyle = hex;
  ctx.fill();
  ctx.save();
  ctx.clip();
  drawFabricTexture(ctx, W, H, hex, isPolo ? 'waffle' : 'knit');
  drawSideShading(ctx, W, H, hex);
  drawFoldShading(ctx, W, H, hex, 5, 0.15);
  drawStitch(ctx, W*0.07, hemY-H*0.008, W*0.93, hemY-H*0.008, hexAlpha(acc,0.28), 1.5);
  drawStitch(ctx, W*0.07, hemY-H*0.018, W*0.93, hemY-H*0.018, hexAlpha(acc,0.16), 1.1);
  ctx.restore();
  ctx.restore();

  // Collar
  if (isPolo) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(W*0.34, H*0.02);
    ctx.quadraticCurveTo(W*0.50, H*0.065, W*0.66, H*0.02);
    ctx.lineTo(W*0.68, H*-0.005);
    ctx.quadraticCurveTo(W*0.50, H*0.09, W*0.32, H*-0.005);
    ctx.closePath();
    ctx.fillStyle = shiftColor(hex, -8);
    ctx.fill();
    ctx.restore();

    // Polo placket
    ctx.fillStyle = shiftColor(hex, -6);
    ctx.fillRect(W*0.46, H*0.055, W*0.08, H*0.14);
    ctx.strokeStyle = hexAlpha(acc, 0.20);
    ctx.lineWidth = W*0.003;
    ctx.strokeRect(W*0.46, H*0.055, W*0.08, H*0.14);
    drawButton(ctx, W*0.50, H*0.11,  W*0.018, shiftColor(acc,0), 0.30);
    drawButton(ctx, W*0.50, H*0.155, W*0.018, shiftColor(acc,0), 0.30);

  } else {
    // Crewneck rib
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(W*0.32, H*0.02);
    ctx.quadraticCurveTo(W*0.50, H*0.085, W*0.68, H*0.02);
    ctx.lineTo(W*0.66, H*0.02);
    ctx.quadraticCurveTo(W*0.50, H*0.065, W*0.34, H*0.02);
    ctx.closePath();
    ctx.fillStyle = shiftColor(hex, -10);
    ctx.fill();
    ctx.restore();
  }

  // Print / branding
  if (item.type === 'tee') {
    ctx.save();
    ctx.font      = `700 ${W*0.038}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = hexAlpha(acc, 0.22);
    ctx.textAlign = 'center';
    ctx.letterSpacing = `${W*0.006}px`;
    ctx.fillText("ORIGINAL", W*0.50, H*0.55);
    ctx.restore();
  }
}

function drawJersey(ctx, W, H, item, cw) {
  const hex = cw.hex;
  const acc = cw.accent;

  const sleeveLen = H * 0.25;
  const lPitX = W*0.20, lPitY = H*0.35;
  const rPitX = W*0.80, rPitY = H*0.35;
  const hemY  = H*0.97;

  // Left sleeve
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W*0.02, H*0.10);
  ctx.lineTo(W*0.04, H*0.10 + sleeveLen);
  ctx.lineTo(W*0.19, H*0.10 + sleeveLen + H*0.005);
  ctx.quadraticCurveTo(lPitX, lPitY - H*0.03, lPitX, lPitY);
  ctx.closePath();
  ctx.fillStyle = hex; ctx.fill();
  // Accent side stripe
  ctx.fillStyle = acc;
  ctx.fillRect(W*0.05, H*0.10, W*0.04, sleeveLen);
  const lsG = ctx.createLinearGradient(W*0.02, 0, lPitX, 0);
  lsG.addColorStop(0, 'rgba(0,0,0,0.22)'); lsG.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = lsG; ctx.fill();
  ctx.restore();

  // Right sleeve
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W*0.98, H*0.10);
  ctx.lineTo(W*0.96, H*0.10 + sleeveLen);
  ctx.lineTo(W*0.81, H*0.10 + sleeveLen + H*0.005);
  ctx.quadraticCurveTo(rPitX, rPitY - H*0.03, rPitX, rPitY);
  ctx.closePath();
  ctx.fillStyle = hex; ctx.fill();
  ctx.fillStyle = acc;
  ctx.fillRect(W*0.91, H*0.10, W*0.04, sleeveLen);
  const rsG = ctx.createLinearGradient(W*0.98, 0, rPitX, 0);
  rsG.addColorStop(0, 'rgba(0,0,0,0.22)'); rsG.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rsG; ctx.fill();
  ctx.restore();

  // Torso
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W*0.32, H*0.02);
  ctx.lineTo(W*0.50, H*0.11);
  ctx.lineTo(W*0.68, H*0.02);
  ctx.lineTo(W*0.82, H*0.09);
  ctx.quadraticCurveTo(rPitX+W*0.03, rPitY, rPitX, rPitY);
  ctx.quadraticCurveTo(W*0.94, H*0.72, W*0.92, hemY);
  ctx.quadraticCurveTo(W*0.50, hemY+H*0.012, W*0.08, hemY);
  ctx.quadraticCurveTo(W*0.06, H*0.72, lPitX, lPitY);
  ctx.lineTo(W*0.18, H*0.09);
  ctx.closePath();
  ctx.fillStyle = hex; ctx.fill();
  ctx.save();
  ctx.clip();
  drawFabricTexture(ctx, W, H, hex, 'knit');
  drawSideShading(ctx, W, H, hex);
  drawFoldShading(ctx, W, H, hex, 4, 0.13);
  // side accent stripes
  ctx.fillStyle = acc;
  ctx.fillRect(W*0.05, H*0.12, W*0.05, hemY - H*0.12);
  ctx.fillRect(W*0.90, H*0.12, W*0.05, hemY - H*0.12);
  // hem rib band
  ctx.fillStyle = shiftColor(hex, -12);
  ctx.fillRect(W*0.08, hemY - H*0.04, W*0.84, H*0.05);
  drawStitch(ctx, W*0.08, hemY-H*0.04, W*0.92, hemY-H*0.04, hexAlpha(acc,0.35), 1.5);
  ctx.restore();
  ctx.restore();

  // V-notch collar with stripe band
  ctx.save();
  ctx.strokeStyle = acc;
  ctx.lineWidth   = W * 0.030;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo(W*0.32, H*0.02);
  ctx.lineTo(W*0.50, H*0.11);
  ctx.lineTo(W*0.68, H*0.02);
  ctx.stroke();
  ctx.restore();

  // Typography
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = `800 ${W*0.026}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = hexAlpha(acc, 0.50);
  ctx.fillText('LIMITED EDITION', W*0.50, H*0.42);
  ctx.font = `900 ${W*0.065}px "Playfair Display", Georgia, serif`;
  ctx.fillStyle = hexAlpha(acc, 0.70);
  ctx.fillText(cw.print || 'SPORTS CLUB', W*0.50, H*0.54);
  ctx.font = `900 ${W*0.12}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillStyle = hexAlpha(acc, 0.65);
  ctx.fillText('94', W*0.50, H*0.72);
  ctx.restore();
}

function drawJacket(ctx, W, H, item, cw) {
  const hex = cw.hex;
  const acc = cw.accent;

  const sleeveLen  = H * 0.40;
  const lPitX = W*0.19, lPitY = H*0.32;
  const rPitX = W*0.81, rPitY = H*0.32;
  const hemY  = H*0.97;

  // Left sleeve (longer, straight)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W*0.03, H*0.10);
  ctx.lineTo(W*0.05, H*0.10 + sleeveLen);
  ctx.lineTo(W*0.20, H*0.10 + sleeveLen + H*0.01);
  ctx.quadraticCurveTo(lPitX, lPitY, lPitX, lPitY);
  ctx.closePath();
  ctx.fillStyle = hex; ctx.fill();
  const lG = ctx.createLinearGradient(W*0.03, 0, lPitX, 0);
  lG.addColorStop(0, 'rgba(0,0,0,0.28)'); lG.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = lG; ctx.fill();
  // Cuff band
  ctx.fillStyle = shiftColor(hex, -14);
  ctx.fillRect(W*0.05, H*0.10+sleeveLen, W*0.15, H*0.03);
  drawStitch(ctx, W*0.05, H*0.10+sleeveLen+H*0.001, W*0.20, H*0.10+sleeveLen+H*0.012,
             hexAlpha(acc, 0.35), 1.4);
  ctx.restore();

  // Right sleeve
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W*0.97, H*0.10);
  ctx.lineTo(W*0.95, H*0.10 + sleeveLen);
  ctx.lineTo(W*0.80, H*0.10 + sleeveLen + H*0.01);
  ctx.quadraticCurveTo(rPitX, rPitY, rPitX, rPitY);
  ctx.closePath();
  ctx.fillStyle = hex; ctx.fill();
  const rG = ctx.createLinearGradient(W*0.97, 0, rPitX, 0);
  rG.addColorStop(0, 'rgba(0,0,0,0.28)'); rG.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rG; ctx.fill();
  ctx.fillStyle = shiftColor(hex, -14);
  ctx.fillRect(W*0.80, H*0.10+sleeveLen, W*0.15, H*0.03);
  drawStitch(ctx, W*0.80, H*0.10+sleeveLen+H*0.001, W*0.95, H*0.10+sleeveLen+H*0.012,
             hexAlpha(acc, 0.35), 1.4);
  ctx.restore();

  // Torso body
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W*0.36, H*0.02);
  ctx.lineTo(W*0.43, H*0.02);    // left side of collar opening
  ctx.lineTo(W*0.50, H*0.08);    // lapel V
  ctx.lineTo(W*0.57, H*0.02);
  ctx.lineTo(W*0.64, H*0.02);
  ctx.lineTo(W*0.82, H*0.09);
  ctx.quadraticCurveTo(rPitX+W*0.03, rPitY-H*0.01, rPitX, rPitY);
  ctx.quadraticCurveTo(W*0.94, H*0.70, W*0.93, hemY);
  ctx.quadraticCurveTo(W*0.50, hemY+H*0.012, W*0.07, hemY);
  ctx.quadraticCurveTo(W*0.06, H*0.70, lPitX, lPitY);
  ctx.lineTo(W*0.18, H*0.09);
  ctx.closePath();
  ctx.fillStyle = hex; ctx.fill();
  ctx.save(); ctx.clip();
  drawFabricTexture(ctx, W, H, hex, 'twill');
  drawSideShading(ctx, W, H, hex);
  drawFoldShading(ctx, W, H, hex, 4, 0.13);
  drawStitch(ctx, W*0.07, hemY-H*0.008, W*0.93, hemY-H*0.008, hexAlpha(acc,0.30), 1.5);
  // Horn buttons down centre
  const btnFill = '#2d241d';
  [H*0.22, H*0.32, H*0.42, H*0.52, H*0.62, H*0.72].forEach(by => {
    drawButton(ctx, W*0.50, by, W*0.022, btnFill, 0.18);
  });
  ctx.restore(); ctx.restore();

  // Lapels (two triangular flaps)
  ctx.save();
  [[W*0.36, H*0.02, W*0.43, H*0.02, W*0.50, H*0.08, W*0.35, H*0.18, W*0.26, H*0.14],
   [W*0.64, H*0.02, W*0.57, H*0.02, W*0.50, H*0.08, W*0.65, H*0.18, W*0.74, H*0.14]
  ].forEach(([x1,y1,x2,y2,x3,y3,x4,y4,x5,y5]) => {
    ctx.beginPath();
    ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3);
    ctx.lineTo(x4,y4); ctx.lineTo(x5,y5);
    ctx.closePath();
    ctx.fillStyle = shiftColor(hex, -10); ctx.fill();
    ctx.strokeStyle = hexAlpha(acc, 0.18);
    ctx.lineWidth = W*0.003; ctx.stroke();
  });
  // Welt pocket slits
  ctx.strokeStyle = hexAlpha(acc, 0.30);
  ctx.lineWidth = W*0.005;
  ctx.beginPath();
  ctx.moveTo(W*0.22, H*0.55); ctx.lineTo(W*0.38, H*0.55);
  ctx.moveTo(W*0.62, H*0.55); ctx.lineTo(W*0.78, H*0.55);
  ctx.stroke();
  drawStitch(ctx, W*0.22, H*0.548, W*0.38, H*0.548, hexAlpha(acc,0.28), 1.2);
  drawStitch(ctx, W*0.62, H*0.548, W*0.78, H*0.548, hexAlpha(acc,0.28), 1.2);
  ctx.restore();
}

function drawTrousers(ctx, W, H, item, cw) {
  const hex = cw.hex;
  const acc = cw.accent;
  const isBlack = item.id === 'black-trousers-01';

  // Waistband
  ctx.fillStyle = shiftColor(hex, -8);
  ctx.fillRect(W*0.08, H*0.01, W*0.84, H*0.072);
  drawStitch(ctx, W*0.08, H*0.078, W*0.92, H*0.078, hexAlpha(acc,0.30), 1.5);
  // Belt loops
  [0.22, 0.38, 0.50, 0.62, 0.78].forEach(lx => {
    ctx.fillStyle = shiftColor(hex, -14);
    ctx.fillRect(W*lx - W*0.013, H*0.005, W*0.026, H*0.065);
    ctx.strokeStyle = hexAlpha(acc, 0.22);
    ctx.lineWidth = W*0.003;
    ctx.strokeRect(W*lx - W*0.013, H*0.005, W*0.026, H*0.065);
  });

  // Fly
  ctx.strokeStyle = hexAlpha(acc, 0.26);
  ctx.lineWidth   = W * 0.005;
  ctx.beginPath();
  ctx.moveTo(W*0.50, H*0.08);
  ctx.lineTo(W*0.50, H*0.18);
  ctx.stroke();
  drawButton(ctx, W*0.50, H*0.14, W*0.018, shiftColor(hex, 20), 0.22);

  // LEFT LEG
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W*0.08, H*0.08);
  ctx.lineTo(W*0.42, H*0.08);
  ctx.quadraticCurveTo(W*0.46, H*0.22, W*0.47, H*0.30); // inner crotch curve
  ctx.lineTo(W*0.44, H*0.98);
  ctx.lineTo(W*0.08, H*0.98);
  ctx.quadraticCurveTo(W*0.07, H*0.70, W*0.08, H*0.08);
  ctx.closePath();
  ctx.fillStyle = hex; ctx.fill();
  ctx.save(); ctx.clip();
  drawFabricTexture(ctx, W, H, hex, 'twill');
  const lLG = ctx.createLinearGradient(W*0.08, 0, W*0.46, 0);
  lLG.addColorStop(0,   'rgba(0,0,0,0.20)');
  lLG.addColorStop(0.35,'rgba(255,255,255,0.06)');
  lLG.addColorStop(1,   'rgba(0,0,0,0.12)');
  ctx.fillStyle = lLG; ctx.fillRect(0, 0, W, H);
  // Knife crease
  ctx.strokeStyle = isBlack ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.28)';
  ctx.lineWidth = W*0.006;
  ctx.beginPath();
  ctx.moveTo(W*0.24, H*0.10); ctx.lineTo(W*0.26, H*0.97);
  ctx.stroke();
  // Pleat
  ctx.strokeStyle = isBlack ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.14)';
  ctx.lineWidth = W*0.004;
  ctx.setLineDash([H*0.018, H*0.012]);
  ctx.beginPath();
  ctx.moveTo(W*0.30, H*0.10); ctx.lineTo(W*0.30, H*0.30);
  ctx.stroke();
  ctx.setLineDash([]);
  // Hem cuff
  ctx.fillStyle = shiftColor(hex, -10);
  ctx.fillRect(W*0.08, H*0.94, W*0.36, H*0.04);
  drawStitch(ctx, W*0.08, H*0.940, W*0.44, H*0.940, hexAlpha(acc,0.32), 1.5);
  ctx.restore(); ctx.restore();

  // RIGHT LEG
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W*0.58, H*0.08);
  ctx.quadraticCurveTo(W*0.54, H*0.22, W*0.53, H*0.30);
  ctx.lineTo(W*0.56, H*0.98);
  ctx.lineTo(W*0.92, H*0.98);
  ctx.quadraticCurveTo(W*0.93, H*0.70, W*0.92, H*0.08);
  ctx.closePath();
  ctx.fillStyle = hex; ctx.fill();
  ctx.save(); ctx.clip();
  drawFabricTexture(ctx, W, H, hex, 'twill');
  const rLG = ctx.createLinearGradient(W*0.92, 0, W*0.54, 0);
  rLG.addColorStop(0,   'rgba(0,0,0,0.20)');
  rLG.addColorStop(0.35,'rgba(255,255,255,0.06)');
  rLG.addColorStop(1,   'rgba(0,0,0,0.12)');
  ctx.fillStyle = rLG; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = isBlack ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.28)';
  ctx.lineWidth = W*0.006;
  ctx.beginPath();
  ctx.moveTo(W*0.76, H*0.10); ctx.lineTo(W*0.74, H*0.97);
  ctx.stroke();
  ctx.strokeStyle = isBlack ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.14)';
  ctx.lineWidth = W*0.004;
  ctx.setLineDash([H*0.018, H*0.012]);
  ctx.beginPath();
  ctx.moveTo(W*0.70, H*0.10); ctx.lineTo(W*0.70, H*0.30);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = shiftColor(hex, -10);
  ctx.fillRect(W*0.56, H*0.94, W*0.36, H*0.04);
  drawStitch(ctx, W*0.56, H*0.940, W*0.92, H*0.940, hexAlpha(acc,0.32), 1.5);
  ctx.restore(); ctx.restore();
}

/* ═══════════════════════════════════════════════════════════════════════════
   PUBLIC EXPORT: createGarmentSprite
   ─────────────────────────────────────────────────────────────────────────
   Returns a 2048×2048 (or proportional) HTMLCanvasElement with the full
   garment illustration drawn on a transparent background.
   ═══════════════════════════════════════════════════════════════════════════ */

export function createGarmentSprite(item, colorway, cfg) {
  const key = `sprite_${item.id}_${colorway.name}`;
  if (spriteCache.has(key)) return spriteCache.get(key);

  // Canvas pixel size: keep ~1160 px per world-unit for sharpness
  const W = Math.round(cfg.w * PPU);
  const H = Math.round(cfg.h * PPU);

  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, W, H);

  // Dispatch to per-garment drawer
  switch (item.type) {
    case 'camp-shirt':
      drawShirt(ctx, W, H, item, colorway,
        item.id === 'white-shirt-01',   // isLong
        true);                           // isCamp
      break;
    case 'jacket':
      drawJacket(ctx, W, H, item, colorway);
      break;
    case 'jersey':
      drawJersey(ctx, W, H, item, colorway);
      break;
    case 'trousers':
      drawTrousers(ctx, W, H, item, colorway);
      break;
    case 'polo':
    case 'tee':
    default:
      drawTeeBody(ctx, W, H, item, colorway);
      break;
  }

  spriteCache.set(key, canvas);
  return canvas;
}

// Cache for generated textures to keep memory and performance optimal
const textureCache = new Map();
const previewImageCache = new Map();

/**
 * Procedural Bump/Normal map generator for realistic fabric weaves.
 * Uses 1024px resolution with anisotropic fiber layering for richer surface depth.
 */
export function createFabricBumpTexture(pattern = 'knit') {
  const key = `bump_${pattern}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  if (pattern === 'twill') {
    // 45-degree diagonal twill weave with strong anisotropy along warp direction
    // and a secondary subtle weft cross-thread layer for realism
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        // Primary diagonal warp rib — strong and directional
        const warp = Math.sin((x + y) * 0.55) * 40;
        // Secondary diagonal weft rib — perpendicular, weaker
        const weft = Math.sin((x - y) * 0.28) * 18;
        // Micro surface fuzz — tiny random fiber tufts
        const fuzz = Math.sin(x * 3.1) * Math.sin(y * 2.7) * 8;
        // Fiber compression shadow in the valley between ribs
        const shadow = Math.pow(Math.max(0, Math.sin((x + y) * 0.55)), 2.2) * -14;
        // Organic fabric noise (no perfectly straight lines in real cloth)
        const noise = (Math.random() - 0.5) * 10;
        const val = Math.min(255, Math.max(0, 128 + warp + weft + fuzz + shadow + noise));
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }
    }
  } else if (pattern === 'waffle') {
    // Pique / waffle knit — raised square cells with recessed grid channels
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        // Raised cell plateau
        const cellX = Math.sin(x * 0.62) * 0.5 + 0.5; // 0–1
        const cellY = Math.cos(y * 0.62) * 0.5 + 0.5;
        const cell = cellX * cellY * 60 - 10;
        // Recessed channel lines at cell boundaries (negative — push down)
        const chanX = Math.pow(Math.max(0, Math.cos(x * 0.62)), 8) * -28;
        const chanY = Math.pow(Math.max(0, Math.cos(y * 0.62)), 8) * -28;
        // Fine pique knit loop texture on top of each cell
        const loopDetail = Math.sin(x * 1.8) * Math.cos(y * 2.2) * 9;
        const noise = (Math.random() - 0.5) * 8;
        const val = Math.min(255, Math.max(0, 128 + cell + chanX + chanY + loopDetail + noise));
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }
    }
  } else {
    // Organic cotton jersey knit — interlocked horizontal course loops
    // with vertical wale columns giving the fabric its characteristic texture
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        // Horizontal course (rows of loops) — strongest signal
        const course = Math.sin(y * 0.9) * 30;
        // Vertical wale (columns) — weaker, gives that jersey rib feel
        const wale = Math.sin(x * 1.1) * 18;
        // Loop interlocking — the characteristic "V" shaped stitch
        const stitch = Math.sin(x * 1.1 + Math.sin(y * 0.9) * 0.5) * 14;
        // Fine fabric surface: individual fiber micro-texture
        const microFiber = Math.sin(x * 4.8) * Math.sin(y * 3.2) * 7;
        // Valley compression darkening
        const valley = Math.pow(Math.max(0, -Math.sin(y * 0.9)), 1.8) * -12;
        const noise = (Math.random() - 0.5) * 8;
        const val = Math.min(255, Math.max(0, 128 + course + wale + stitch + microFiber + valley + noise));
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // Slightly tighter repeat on the larger canvas to keep the same visual scale
  texture.repeat.set(pattern === 'twill' ? 16 : 20, pattern === 'twill' ? 16 : 20);
  texture.generateMipmaps = true;
  texture.anisotropy = 4; // sharper at glancing angles

  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates high-resolution canvas texture for garment diffuse/albedo
 */
export function createGarmentTexture(item, colorway) {
  const key = `${item.id}_${colorway.name}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // Base fabric tone
  ctx.fillStyle = colorway.hex;
  ctx.fillRect(0, 0, size, size);

  // Organic micro-speckle
  const speckleCount = 4000;
  for (let i = 0; i < speckleCount; i++) {
    const rx = Math.random() * size;
    const ry = Math.random() * size;
    const isLight = i % 2 === 0;
    ctx.fillStyle = isLight ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
    ctx.fillRect(rx, ry, 1.5, 2.5);
  }

  // Detailing based on garment ID / type
  if (item.id === 'faces-shirt-01') {
    // -------------------------------------------------------------
    // "Faces Shirt" — Black camp collar shirt with face line art
    // -------------------------------------------------------------
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(size / 2, 220);
    ctx.lineTo(size / 2, 880);
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(380, 520, 160, 0, Math.PI * 2);
    ctx.fillStyle = colorway.name.includes('Black') ? 'rgba(28, 30, 33, 0.95)' : 'rgba(0, 0, 0, 0.1)';
    ctx.fill();

    ctx.strokeStyle = colorway.accent;
    ctx.lineWidth = 4.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(330, 410);
    ctx.bezierCurveTo(390, 390, 430, 410, 440, 460);
    ctx.bezierCurveTo(448, 500, 415, 520, 420, 550);
    ctx.bezierCurveTo(442, 560, 460, 565, 462, 578);
    ctx.bezierCurveTo(440, 588, 424, 590, 442, 604);
    ctx.bezierCurveTo(450, 626, 428, 655, 368, 665);
    ctx.bezierCurveTo(330, 670, 305, 650, 300, 620);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(380, 485);
    ctx.bezierCurveTo(395, 475, 412, 485, 400, 495);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(370, 465);
    ctx.bezierCurveTo(390, 452, 415, 458, 425, 472);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(340, 540);
    ctx.bezierCurveTo(355, 565, 365, 595, 350, 625);
    ctx.stroke();
    ctx.restore();

    [320, 420, 520, 620, 720].forEach((by) => {
      ctx.beginPath();
      ctx.arc(size / 2, by, 7.5, 0, Math.PI * 2);
      ctx.fillStyle = '#111214';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

  } else if (item.id === 'artisan-shirt-01') {
    ctx.strokeStyle = colorway.accent;
    ctx.fillStyle = colorway.accent;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(size / 2, 220);
    ctx.lineTo(size / 2, 880);
    ctx.stroke();

    for (let y = 320; y <= 760; y += 120) {
      ctx.beginPath();
      ctx.arc(size / 2 + 75, y, 36, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(size / 2 + 75, y - 24);
      ctx.lineTo(size / 2 + 75, y + 24);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(size / 2 - 75, y + 40, 26, 0, Math.PI * 2);
      ctx.stroke();
    }

    [300, 400, 500, 600, 700].forEach((by) => {
      ctx.beginPath();
      ctx.arc(size / 2, by, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#4a3b2c';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

  } else if (item.id === 'white-shirt-01') {
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(size / 2, 220);
    ctx.lineTo(size / 2, 900);
    ctx.stroke();

    ctx.save();
    ctx.strokeStyle = colorway.accent;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(380, 460, 48, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(350, 460);
    ctx.lineTo(410, 460);
    ctx.moveTo(380, 430);
    ctx.lineTo(380, 490);
    ctx.stroke();

    ctx.font = '500 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = colorway.accent;
    ctx.textAlign = 'center';
    ctx.fillText('MILAN · STUDIO', 380, 530);
    ctx.restore();

    [320, 420, 520, 620, 720].forEach((by) => {
      ctx.beginPath();
      ctx.arc(size / 2, by, 6.5, 0, Math.PI * 2);
      ctx.fillStyle = '#f8f5ee';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

  } else if (item.id === 'grey-polo-01') {
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(size / 2 - 28, 220, 56, 240);

    [290, 380].forEach((by) => {
      ctx.beginPath();
      ctx.arc(size / 2, by, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#dedad2';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

  } else if (item.type === 'jersey') {
    ctx.fillStyle = colorway.accent;
    ctx.fillRect(100, 160, 55, 760);
    ctx.fillRect(size - 155, 160, 55, 760);

    ctx.textAlign = 'center';
    ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '8px';
    ctx.fillText('LIMITED EDITION', size / 2, 420);

    ctx.font = '900 62px "Playfair Display", Georgia, serif';
    ctx.fillText(colorway.print || 'SPORTS CLUB', size / 2, 500);

    ctx.font = '800 120px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('94', size / 2, 650);

  } else if (item.type === 'trousers') {
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 3.5;

    ctx.beginPath();
    ctx.moveTo(size / 2, 100);
    ctx.lineTo(size / 2, 340);
    ctx.arc(size / 2 + 25, 340, 25, Math.PI, Math.PI / 2, true);
    ctx.stroke();

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = item.id.includes('black') ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.moveTo(340, 120);
    ctx.lineTo(310, 960);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(size - 340, 120);
    ctx.lineTo(size - 310, 960);
    ctx.stroke();

    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    [240, 360, size - 360, size - 240].forEach((lx) => {
      ctx.fillRect(lx, 25, 22, 65);
    });

  } else if (item.type === 'jacket') {
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(size / 2, 200);
    ctx.lineTo(size / 2, 940);
    ctx.stroke();

    [280, 380, 480, 580, 680, 780].forEach((by) => {
      ctx.beginPath();
      ctx.arc(size / 2, by, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#2d241d';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(250, 640);
    ctx.lineTo(250, 780);
    ctx.moveTo(size - 250, 640);
    ctx.lineTo(size - 250, 780);
    ctx.stroke();

  } else {
    ctx.fillStyle = colorway.accent;
    ctx.textAlign = 'center';
    ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('R I C K \' S', size / 2, 420);
  }

  // Soft hem double stitching
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.moveTo(80, size - 45);
  ctx.lineTo(size - 80, size - 45);
  ctx.moveTo(80, size - 35);
  ctx.lineTo(size - 80, size - 35);
  ctx.stroke();
  ctx.setLineDash([]);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;

  textureCache.set(key, texture);
  return texture;
}

/**
 * Creates luxury wood grain texture for hangers
 */
export function createWoodHangerTexture() {
  const key = 'hanger_wood';
  if (textureCache.has(key)) return textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, '#ad7e52');
  grad.addColorStop(0.5, '#c99a6b');
  grad.addColorStop(1, '#a6774c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 128);

  ctx.lineWidth = 1.2;
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * 128;
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(80,50,25,0.25)' : 'rgba(230,195,150,0.3)';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(170, y + (Math.random() - 0.5) * 12, 340, y + (Math.random() - 0.5) * 12, 512, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Generates high-definition 2D product photograph preview for the detail card
 * Updates dynamically in real-time when switching colorways!
 */
export function getGarmentPreviewImage(item, colorway) {
  const key = `preview_${item.id}_${colorway.name}`;
  if (previewImageCache.has(key)) {
    return previewImageCache.get(key);
  }

  const width = 480;
  const height = 580;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // 1. Studio background with soft warm vignette
  const bgGrad = ctx.createRadialGradient(width / 2, height / 2 - 20, 40, width / 2, height / 2, width * 0.7);
  bgGrad.addColorStop(0, '#f9f6f1');
  bgGrad.addColorStop(0.65, '#f1eae0');
  bgGrad.addColorStop(1, '#e4dbcd');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Soft floor contact shadow
  const shadowGrad = ctx.createRadialGradient(width / 2, height - 32, 10, width / 2, height - 32, 160);
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0.28)');
  shadowGrad.addColorStop(0.5, 'rgba(0,0,0,0.10)');
  shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadowGrad;
  ctx.save();
  ctx.scale(1, 0.35);
  ctx.beginPath();
  ctx.arc(width / 2, (height - 32) / 0.35, 150, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const isPants = item.type === 'trousers';

  // 2. Brass Swivel Hook
  ctx.save();
  ctx.strokeStyle = '#c9a15d';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(width / 2, 75);
  ctx.lineTo(width / 2, 42);
  ctx.bezierCurveTo(width / 2 + 18, 22, width / 2 - 18, 12, width / 2 - 16, 26);
  ctx.stroke();

  // Hook tip ball
  ctx.fillStyle = '#dbb36c';
  ctx.beginPath();
  ctx.arc(width / 2 - 16, 26, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Hook collar
  ctx.fillStyle = '#b89047';
  ctx.fillRect(width / 2 - 6, 72, 12, 6);
  ctx.restore();

  // 3. Wooden Wishbone Shoulder Bar
  const woodGrad = ctx.createLinearGradient(60, 80, 420, 80);
  woodGrad.addColorStop(0, '#7d5537');
  woodGrad.addColorStop(0.5, '#b08154');
  woodGrad.addColorStop(1, '#744d2d');

  ctx.fillStyle = woodGrad;
  ctx.beginPath();
  ctx.moveTo(width / 2, 76);
  ctx.quadraticCurveTo(width / 2 + 80, 80, 400, 114);
  ctx.quadraticCurveTo(402, 124, 396, 126);
  ctx.quadraticCurveTo(width / 2 + 80, 96, width / 2, 92);
  ctx.quadraticCurveTo(width / 2 - 80, 96, 84, 126);
  ctx.quadraticCurveTo(78, 124, 80, 114);
  ctx.quadraticCurveTo(width / 2 - 80, 80, width / 2, 76);
  ctx.closePath();
  ctx.fill();

  // Hanger crossbar
  if (isPants) {
    ctx.strokeStyle = '#c9a15d';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(96, 116);
    ctx.lineTo(384, 116);
    ctx.stroke();

    // Two clips clamping trousers waistband
    [175, 305].forEach((cx) => {
      ctx.fillStyle = '#b89047';
      ctx.fillRect(cx - 5, 112, 10, 24);
      ctx.fillStyle = '#1c1b1a';
      ctx.fillRect(cx - 7, 128, 14, 8);
    });
  } else {
    ctx.fillStyle = '#8a5e3a';
    ctx.fillRect(96, 118, 288, 5);
  }

  // 4. Garment Body Rendering with realistic drape and specific artwork
  ctx.save();

  if (item.type === 'camp-shirt') {
    // -------------------------------------------------------------
    // Camp Shirt (Faces Shirt, Artisan Shirt, Artist Long-Sleeve)
    // -------------------------------------------------------------
    const isLong = item.id === 'white-shirt-01';
    const isFaces = item.id === 'faces-shirt-01';

    // Main Torso Silhouette
    ctx.fillStyle = colorway.hex;
    ctx.beginPath();
    ctx.moveTo(150, 98); // Left neck
    ctx.lineTo(76, 120); // Left shoulder
    ctx.lineTo(isLong ? 52 : 68, isLong ? 360 : 255); // Left cuff outer
    ctx.lineTo(isLong ? 84 : 106, isLong ? 362 : 258); // Left cuff inner
    ctx.lineTo(122, 185); // Left armpit
    ctx.lineTo(108, 440); // Left hem flare
    ctx.quadraticCurveTo(width / 2, 452, 372, 440); // Curved bottom hem
    ctx.lineTo(358, 185); // Right armpit
    ctx.lineTo(isLong ? 396 : 374, isLong ? 362 : 258); // Right cuff inner
    ctx.lineTo(isLong ? 428 : 412, isLong ? 360 : 255); // Right cuff outer
    ctx.lineTo(404, 120); // Right shoulder
    ctx.lineTo(330, 98); // Right neck
    // Open Cuban V-neck cutout
    ctx.lineTo(width / 2 + 35, 112);
    ctx.lineTo(width / 2, 178); // Deep V dip showing hanger inside
    ctx.lineTo(width / 2 - 35, 112);
    ctx.closePath();
    ctx.fill();

    // Fabric drape shading
    const shadeGrad = ctx.createLinearGradient(100, 0, 380, 0);
    shadeGrad.addColorStop(0, 'rgba(0,0,0,0.18)');
    shadeGrad.addColorStop(0.3, 'rgba(255,255,255,0.06)');
    shadeGrad.addColorStop(0.5, 'rgba(0,0,0,0.02)');
    shadeGrad.addColorStop(0.7, 'rgba(255,255,255,0.08)');
    shadeGrad.addColorStop(1, 'rgba(0,0,0,0.20)');
    ctx.fillStyle = shadeGrad;
    ctx.fill();

    // Open Camp Collar Lapels
    ctx.fillStyle = colorway.hex;
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1.5;

    // Left lapel
    ctx.beginPath();
    ctx.moveTo(width / 2 - 40, 102);
    ctx.lineTo(width / 2 - 10, 168);
    ctx.lineTo(width / 2 - 48, 154);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right lapel
    ctx.beginPath();
    ctx.moveTo(width / 2 + 40, 102);
    ctx.lineTo(width / 2 + 10, 168);
    ctx.lineTo(width / 2 + 48, 154);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Center placket line
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2, 178);
    ctx.lineTo(width / 2, 442);
    ctx.stroke();

    // Placket buttons
    [215, 270, 325, 380].forEach((by) => {
      ctx.beginPath();
      ctx.arc(width / 2, by, 4, 0, Math.PI * 2);
      ctx.fillStyle = isFaces ? '#111214' : '#f5f0e6';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Artwork on front
    if (isFaces) {
      // Dark circular moon backdrop
      ctx.beginPath();
      ctx.arc(195, 280, 56, 0, Math.PI * 2);
      ctx.fillStyle = colorway.name.includes('Black') ? 'rgba(28, 30, 33, 0.95)' : 'rgba(0, 0, 0, 0.12)';
      ctx.fill();

      // Continuous single-line face drawing
      ctx.strokeStyle = colorway.accent;
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(175, 245);
      ctx.bezierCurveTo(205, 235, 218, 245, 222, 265);
      ctx.bezierCurveTo(225, 285, 212, 295, 215, 308);
      ctx.bezierCurveTo(225, 312, 232, 315, 233, 322);
      ctx.bezierCurveTo(222, 328, 214, 328, 222, 335);
      ctx.bezierCurveTo(225, 345, 212, 358, 185, 362);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(198, 278, 6, 0, Math.PI);
      ctx.stroke();
    } else if (item.id === 'artisan-shirt-01') {
      ctx.strokeStyle = colorway.accent;
      ctx.lineWidth = 2;
      for (let y = 210; y <= 390; y += 50) {
        ctx.beginPath();
        ctx.arc(width / 2 + 35, y, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(width / 2 - 35, y + 25, 11, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (isLong) {
      // Artistic Milan Studio emblem on left chest
      ctx.save();
      ctx.strokeStyle = colorway.accent;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(185, 275, 24, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(167, 275);
      ctx.lineTo(203, 275);
      ctx.moveTo(185, 257);
      ctx.lineTo(185, 293);
      ctx.stroke();

      ctx.font = '600 7px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = colorway.accent;
      ctx.textAlign = 'center';
      ctx.fillText('MILAN · STUDIO', 185, 312);
      ctx.restore();
    }

  } else if (isPants) {
    // -------------------------------------------------------------
    // Pleated Trousers (Brown & Black)
    // -------------------------------------------------------------
    ctx.fillStyle = colorway.hex;

    // Pelvis & Waistband
    ctx.beginPath();
    ctx.moveTo(165, 130);
    ctx.lineTo(315, 130);
    ctx.lineTo(325, 240); // Right hip
    ctx.lineTo(335, 500); // Right outer hem
    ctx.lineTo(260, 500); // Right inner hem
    ctx.lineTo(width / 2 + 8, 255); // Crotch split
    ctx.lineTo(width / 2 - 8, 255);
    ctx.lineTo(220, 500); // Left inner hem
    ctx.lineTo(145, 500); // Left outer hem
    ctx.lineTo(155, 240); // Left hip
    ctx.closePath();
    ctx.fill();

    // Fabric shading
    const shadeGrad = ctx.createLinearGradient(140, 0, 340, 0);
    shadeGrad.addColorStop(0, 'rgba(0,0,0,0.18)');
    shadeGrad.addColorStop(0.5, 'rgba(255,255,255,0.06)');
    shadeGrad.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = shadeGrad;
    ctx.fill();

    // Knife creases
    ctx.strokeStyle = item.id.includes('black') ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(182, 175);
    ctx.lineTo(182, 498);
    ctx.moveTo(298, 175);
    ctx.lineTo(298, 498);
    ctx.stroke();

    // Fly seam
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.moveTo(width / 2, 130);
    ctx.lineTo(width / 2, 210);
    ctx.stroke();

    // Turned hem cuffs
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.fillRect(145, 484, 75, 16);
    ctx.fillRect(260, 484, 75, 16);

  } else if (item.type === 'jacket') {
    // -------------------------------------------------------------
    // Overcoat / Harrington
    // -------------------------------------------------------------
    ctx.fillStyle = colorway.hex;
    ctx.beginPath();
    ctx.moveTo(160, 100);
    ctx.lineTo(76, 122);
    ctx.lineTo(60, 380);
    ctx.lineTo(92, 382);
    ctx.lineTo(125, 200);
    ctx.lineTo(112, 495);
    ctx.lineTo(368, 495);
    ctx.lineTo(355, 200);
    ctx.lineTo(388, 382);
    ctx.lineTo(420, 380);
    ctx.lineTo(404, 122);
    ctx.lineTo(320, 100);
    ctx.closePath();
    ctx.fill();

    // Lapels
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(width / 2 - 22, 100, 44, 140);

    // Horn buttons
    [210, 275, 340, 405, 470].forEach((by) => {
      ctx.beginPath();
      ctx.arc(width / 2, by, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#2d241d';
      ctx.fill();
    });

  } else if (item.type === 'jersey') {
    // -------------------------------------------------------------
    // Varsity Jersey
    // -------------------------------------------------------------
    ctx.fillStyle = colorway.hex;
    ctx.beginPath();
    ctx.moveTo(160, 102);
    ctx.lineTo(76, 120);
    ctx.lineTo(68, 255);
    ctx.lineTo(106, 258);
    ctx.lineTo(125, 185);
    ctx.lineTo(114, 435);
    ctx.lineTo(366, 435);
    ctx.lineTo(355, 185);
    ctx.lineTo(374, 258);
    ctx.lineTo(412, 255);
    ctx.lineTo(404, 120);
    ctx.lineTo(320, 102);
    ctx.closePath();
    ctx.fill();

    // Side contrast stripes
    ctx.fillStyle = colorway.accent;
    ctx.fillRect(116, 185, 18, 250);
    ctx.fillRect(346, 185, 18, 250);

    // V-neck stripe collar
    ctx.strokeStyle = colorway.accent;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 32, 104);
    ctx.lineTo(width / 2, 155);
    ctx.lineTo(width / 2 + 32, 104);
    ctx.stroke();

    // Typography
    ctx.fillStyle = colorway.accent;
    ctx.textAlign = 'center';
    ctx.font = '800 12px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('LIMITED EDITION', width / 2, 240);

    ctx.font = '900 28px "Playfair Display", Georgia, serif';
    ctx.fillText(colorway.print || 'SPORTS CLUB', width / 2, 280);

    ctx.font = '800 68px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('94', width / 2, 360);

  } else {
    // -------------------------------------------------------------
    // Polo / Classic T-Shirt
    // -------------------------------------------------------------
    ctx.fillStyle = colorway.hex;
    ctx.beginPath();
    ctx.moveTo(160, 102);
    ctx.lineTo(76, 120);
    ctx.lineTo(68, 250);
    ctx.lineTo(106, 252);
    ctx.lineTo(125, 180);
    ctx.lineTo(116, 435);
    ctx.lineTo(364, 435);
    ctx.lineTo(355, 180);
    ctx.lineTo(374, 252);
    ctx.lineTo(412, 250);
    ctx.lineTo(404, 120);
    ctx.lineTo(320, 102);
    ctx.closePath();
    ctx.fill();

    if (item.type === 'polo') {
      // Polo Collar & Buttons
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 24, 104);
      ctx.lineTo(width / 2 - 8, 158);
      ctx.lineTo(width / 2, 158);
      ctx.lineTo(width / 2 + 8, 158);
      ctx.lineTo(width / 2 + 24, 104);
      ctx.stroke();

      [130, 150].forEach((by) => {
        ctx.beginPath();
        ctx.arc(width / 2, by, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#dedad2';
        ctx.fill();
      });
    } else {
      // Ribbed Crewneck
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(width / 2, 114, 26, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
  }

  ctx.restore();

  const dataUrl = canvas.toDataURL('image/png');
  previewImageCache.set(key, dataUrl);
  return dataUrl;
}

/**
 * Creates procedural HDR studio environment map using PMREMGenerator
 */
export function createStudioEnvironment(renderer) {
  const scene = new THREE.Scene();

  const geo = new THREE.SphereGeometry(15, 32, 32);
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Studio lighting: Soft warm boutique overhead softbox
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#ffffff'); // overhead softbox
  grad.addColorStop(0.4, '#f7f2ea'); // upper warm cream walls
  grad.addColorStop(0.7, '#ece4d8'); // warm horizon
  grad.addColorStop(1, '#dad0c0'); // warm boutique floor
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Softbox light reflection spot
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.ellipse(256, 45, 130, 35, 0, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;

  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide });
  scene.add(new THREE.Mesh(geo, mat));

  const pmremGen = new THREE.PMREMGenerator(renderer);
  pmremGen.compileEquirectangularShader();
  const envMap = pmremGen.fromScene(scene).texture;
  pmremGen.dispose();

  return envMap;
}
