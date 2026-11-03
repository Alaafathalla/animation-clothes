import * as THREE from 'three';

// Cache for generated textures to keep memory and performance optimal
const textureCache = new Map();
const previewImageCache = new Map();

/**
 * Procedural Bump/Normal map generator for realistic fabric weaves
 */
export function createFabricBumpTexture(pattern = 'knit') {
  const key = `bump_${pattern}`;
  if (textureCache.has(key)) return textureCache.get(key);

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  if (pattern === 'twill') {
    // 45-degree diagonal twill weave
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const diag = Math.sin((x + y) * 0.45) * 28;
        const cross = Math.sin((x - y) * 0.2) * 12;
        const noise = (Math.random() - 0.5) * 14;
        const val = Math.min(255, Math.max(0, 128 + diag + cross + noise));
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }
    }
  } else if (pattern === 'waffle') {
    // Pique / waffle knit pattern
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const cell = Math.sin(x * 0.5) * Math.cos(y * 0.5) * 35;
        const noise = (Math.random() - 0.5) * 16;
        const val = Math.min(255, Math.max(0, 128 + cell + noise));
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }
    }
  } else {
    // Default: Organic cotton jersey knit (interlooping loops)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        const loop = Math.sin(x * 0.8) * Math.sin(y * 0.4) * 22;
        const fineWeft = Math.cos(y * 1.6) * 10;
        const noise = (Math.random() - 0.5) * 16;
        const val = Math.min(255, Math.max(0, 128 + loop + fineWeft + noise));
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
  texture.repeat.set(pattern === 'twill' ? 14 : 18, pattern === 'twill' ? 14 : 18);
  texture.generateMipmaps = true;

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
