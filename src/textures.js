import * as THREE from 'three';

// Cache for generated textures to keep memory and performance optimal
const textureCache = new Map();

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

  // Organic micro-speckle / heathering
  const speckleCount = 4500;
  for (let i = 0; i < speckleCount; i++) {
    const rx = Math.random() * size;
    const ry = Math.random() * size;
    const isLight = i % 2 === 0;
    ctx.fillStyle = isLight ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.035)';
    ctx.fillRect(rx, ry, 1.5, 3);
  }

  // Seam & garment specific graphic detailing
    if (item.type === 'camp-shirt') {
      // Camp collar relaxed shirt (Faces Shirt inspired by reference)
      if (item.id === 'faces-shirt-01') {
        // Dark circular artistic backdrop on chest
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2 - 25, 490, 150, 0, Math.PI * 2);
        ctx.fillStyle = colorway.name.includes('Black') ? 'rgba(38, 40, 44, 0.95)' : 'rgba(0, 0, 0, 0.08)';
        ctx.fill();

        // Continuous single line-art face illustration
        ctx.strokeStyle = colorway.accent;
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Head contour
        ctx.beginPath();
        ctx.moveTo(size / 2 - 85, 385);
        ctx.bezierCurveTo(size / 2 - 30, 365, size / 2 + 10, 385, size / 2 + 25, 435);
        ctx.bezierCurveTo(size / 2 + 35, 470, size / 2, 495, size / 2 + 5, 525);
        // Nose & lips profile
        ctx.bezierCurveTo(size / 2 + 25, 535, size / 2 + 45, 540, size / 2 + 48, 552);
        ctx.bezierCurveTo(size / 2 + 28, 562, size / 2 + 10, 564, size / 2 + 28, 578);
        // Chin & Jawline
        ctx.bezierCurveTo(size / 2 + 38, 600, size / 2 + 15, 630, size / 2 - 45, 640);
        ctx.bezierCurveTo(size / 2 - 80, 645, size / 2 - 105, 625, size / 2 - 110, 595);
        ctx.stroke();

        // Eye & Eyebrow lines
        ctx.beginPath();
        ctx.moveTo(size / 2 - 25, 460);
        ctx.bezierCurveTo(size / 2 - 10, 450, size / 2 + 8, 460, size / 2 - 5, 470);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(size / 2 - 35, 442);
        ctx.bezierCurveTo(size / 2 - 15, 430, size / 2 + 12, 435, size / 2 + 22, 450);
        ctx.stroke();
        ctx.restore();

      } else if (item.id === 'printed-shirt-01') {
        // Woodcut artisan figurative panels
        ctx.fillStyle = colorway.accent;
        ctx.strokeStyle = colorway.accent;
        ctx.lineWidth = 3;

        // Vertical artwork column
        for (let y = 340; y <= 720; y += 130) {
          ctx.beginPath();
          ctx.arc(size / 2 + 60, y, 42, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(size / 2 + 60, y - 30);
          ctx.lineTo(size / 2 + 60, y + 30);
          ctx.stroke();
        }
      }

      // Open V-neck notch collar placket line
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(size / 2, 200);
      ctx.lineTo(size / 2, 420);
      ctx.stroke();

      // Natural button stitches
      [270, 340, 410].forEach((by) => {
        ctx.beginPath();
        ctx.arc(size / 2, by, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#f2ede2';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

    } else if (item.type === 'jersey') {
      // Athletic jersey styling: contrast panels & retro typography
      ctx.fillStyle = colorway.accent;

      // Bold vertical club side stripes
      ctx.fillRect(110, 140, 60, 740);
      ctx.fillRect(size - 170, 140, 60, 740);

      // Collar V trim
      ctx.beginPath();
      ctx.moveTo(size / 2 - 120, 210);
      ctx.lineTo(size / 2, 310);
      ctx.lineTo(size / 2 + 120, 210);
      ctx.lineWidth = 14;
      ctx.strokeStyle = colorway.accent;
      ctx.stroke();

      // Chest typography
      ctx.fillStyle = colorway.accent;
      ctx.textAlign = 'center';
      ctx.font = '700 24px "DM Sans", -apple-system, sans-serif';
      ctx.letterSpacing = '6px';
      ctx.fillText('EDITION LIMITÉE', size / 2, 420);

      ctx.font = '900 68px "Playfair Display", Georgia, serif';
      ctx.fillText(colorway.print || 'ATHLÈTE', size / 2, 510);

      // Large archival number
      ctx.font = '800 130px "DM Sans", sans-serif';
      ctx.fillText('94', size / 2, 670);

      // Woven club badge at hem
      ctx.strokeStyle = colorway.accent;
      ctx.lineWidth = 2;
      ctx.strokeRect(size / 2 - 60, 840, 120, 36);
      ctx.font = '600 13px "DM Sans", sans-serif';
      ctx.fillText('AUTHENTIC 01', size / 2, 863);

    } else if (item.type === 'hoodie') {
      // Hoodie: Kangaroo pocket stitching + tonal embroidered chest typography
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 5]);

      // Kangaroo pocket outline
      ctx.beginPath();
      ctx.moveTo(260, 620);
      ctx.lineTo(340, 530);
      ctx.lineTo(684, 530);
      ctx.lineTo(764, 620);
      ctx.lineTo(764, 830);
      ctx.lineTo(260, 830);
      ctx.closePath();
      ctx.stroke();

      ctx.setLineDash([]);
      // Pocket shadow
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.fill();

      // Chest branding: Tonal refined architectural logo
      ctx.fillStyle = colorway.accent;
      ctx.textAlign = 'center';
      ctx.font = '700 26px "DM Sans", -apple-system, sans-serif';
      ctx.fillText(colorway.print || 'ARCHIVE STUDIO', size / 2, 380);

      // Minimal coordinates
      ctx.font = '500 14px "DM Sans", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillText('41.1579° N, 8.6291° W', size / 2, 412);

    } else if (item.type === 'jacket') {
      // Harrington / Overshirt: Center zipper / placket, pockets, collar lines
      // Center zipper line
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(size / 2, 210);
      ctx.lineTo(size / 2, 920);
      ctx.stroke();

      // Metal zipper teeth highlights
      ctx.strokeStyle = 'rgba(210,195,170,0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(size / 2 - 2, 220);
      ctx.lineTo(size / 2 - 2, 920);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(size / 2 + 2, 220);
      ctx.lineTo(size / 2 + 2, 920);
      ctx.stroke();
      ctx.setLineDash([]);

      // Chest pocket
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 3;
      ctx.strokeRect(270, 390, 160, 190);

      // Flap
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(266, 386, 168, 48);

      // Tonal chest tag
      ctx.fillStyle = colorway.accent;
      ctx.font = '600 16px "DM Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(colorway.print || 'ATELIER', size / 2, 320);

    } else if (item.type === 'trousers') {
      // Pleated trousers: Sharp pleat lines, waistband top stitching, fly line
      ctx.strokeStyle = 'rgba(0,0,0,0.28)';
      ctx.lineWidth = 3.5;

      // Fly seam
      ctx.beginPath();
      ctx.moveTo(size / 2, 100);
      ctx.lineTo(size / 2, 340);
      ctx.arc(size / 2 + 30, 340, 30, Math.PI, Math.PI / 2, true);
      ctx.stroke();

      // Left and right sharp pleat crease lines
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath();
      ctx.moveTo(340, 120);
      ctx.lineTo(310, 960);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(size - 340, 120);
      ctx.lineTo(size - 310, 960);
      ctx.stroke();

      // Belt loops
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      [240, 360, size - 360, size - 240].forEach((lx) => {
        ctx.fillRect(lx, 30, 24, 70);
      });

    } else if (item.type === 'polo') {
      // Knit polo: Three button placket and collar rib
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(size / 2 - 32, 200, 64, 260);

      // Buttons
      [240, 320, 400].forEach((by) => {
        ctx.beginPath();
        ctx.arc(size / 2, by, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#f4eedd';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Button holes
        ctx.fillStyle = '#666';
        ctx.fillRect(size / 2 - 4, by - 1, 2, 2);
        ctx.fillRect(size / 2 + 2, by - 1, 2, 2);
      });

    } else {
      // Classic Architectural Tee
      ctx.fillStyle = colorway.accent;
      ctx.textAlign = 'center';

      // Refined typographic chest print
      ctx.font = '700 24px "DM Sans", -apple-system, sans-serif';
      ctx.fillText('A T E L I E R', size / 2, 420);

      ctx.font = '400 13px "DM Sans", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('COLLECTION ARCHIVE · 2026', size / 2, 452);

      ctx.strokeStyle = colorway.accent;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(size / 2 - 40, 474);
      ctx.lineTo(size / 2 + 40, 474);
      ctx.stroke();
    }

    // Soft hem stitching line at bottom
    ctx.strokeStyle = 'rgba(0,0,0,0.14)';
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(80, size - 50);
    ctx.lineTo(size - 80, size - 50);
    ctx.moveTo(80, size - 40);
    ctx.lineTo(size - 80, size - 40);
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

    // Warm natural European beechwood / blonde oak base
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, '#ad7e52');
    grad.addColorStop(0.5, '#c99a6b');
    grad.addColorStop(1, '#a6774c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 128);

    // Subtle wood grain lines
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
   * Creates procedural HDR studio environment map using PMREMGenerator
   */
  export function createStudioEnvironment(renderer) {
    const scene = new THREE.Scene();

    // Soft gradient background sphere for environment bounce
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

