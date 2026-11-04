import * as THREE from 'three';
import { createWoodHangerTexture, createGarmentSprite } from './textures.js';

/* ==========================================================================
   Shared Hardware Materials  (reused across all hangers)
   ========================================================================== */

const brassMat = new THREE.MeshStandardMaterial({
  color: 0xd4a84b, metalness: 0.92, roughness: 0.18, envMapIntensity: 1.4,
});
const rubberMat = new THREE.MeshStandardMaterial({
  color: 0x1a1a1a, roughness: 0.92, metalness: 0.05,
});

/* ==========================================================================
   3-D Wooden Wishbone Hanger  (unchanged — it already looks great)
   ========================================================================== */

export function createHanger(isPants = false) {
  const g = new THREE.Group();
  g.name = 'hanger';

  // ── Brass swivel hook ──────────────────────────────────────────────────
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3( 0.00, 2.36, 0),
    new THREE.Vector3( 0.00, 2.50, 0),
    new THREE.Vector3( 0.08, 2.58, 0),
    new THREE.Vector3( 0.14, 2.67, 0),
    new THREE.Vector3( 0.04, 2.74, 0),
    new THREE.Vector3(-0.08, 2.72, 0),
    new THREE.Vector3(-0.11, 2.64, 0),
  ]);
  const hook = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.014, 12, false), brassMat);
  hook.castShadow = true;
  g.add(hook);

  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 16), brassMat);
  ball.position.set(-0.11, 2.64, 0);
  g.add(ball);

  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.048, 20), brassMat);
  collar.position.set(0, 2.36, 0);
  g.add(collar);

  // ── Wooden shoulder bar ────────────────────────────────────────────────
  const woodTex  = createWoodHangerTexture();
  const woodMat  = new THREE.MeshPhysicalMaterial({
    map: woodTex, color: 0x7a5638,
    roughness: 0.36, clearcoat: 0.45, clearcoatRoughness: 0.22, reflectivity: 0.55,
  });

  const sh = new THREE.Shape();
  sh.moveTo(-0.65, -0.15);
  sh.quadraticCurveTo(-0.35,  0.02,  0,     0.06);
  sh.quadraticCurveTo( 0.35,  0.02,  0.65, -0.15);
  sh.quadraticCurveTo( 0.67, -0.22,  0.63, -0.25);
  sh.quadraticCurveTo( 0.35, -0.06,  0,    -0.02);
  sh.quadraticCurveTo(-0.35, -0.06, -0.63, -0.25);
  sh.quadraticCurveTo(-0.67, -0.22, -0.65, -0.15);

  const shGeo = new THREE.ExtrudeGeometry(sh, {
    depth: 0.044, bevelEnabled: true,
    bevelThickness: 0.013, bevelSize: 0.011, bevelSegments: 5,
  });
  shGeo.center();

  const bar = new THREE.Mesh(shGeo, woodMat);
  bar.position.set(0, 2.30, 0);
  bar.castShadow = true;
  bar.receiveShadow = true;
  g.add(bar);

  // ── Pants clips  OR  lower wood bar ───────────────────────────────────
  if (isPants) {
    const xbar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.010, 0.010, 1.18, 14),
      brassMat
    );
    xbar.rotation.z = Math.PI / 2;
    xbar.position.set(0, 2.12, 0);
    g.add(xbar);

    [-0.33, 0.33].forEach((x) => {
      const arm  = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.14, 0.046), brassMat);
      arm.position.set(x, 2.07, 0);
      arm.castShadow = true;
      g.add(arm);

      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.042, 0.058), rubberMat);
      grip.position.set(x, 2.01, 0);
      grip.castShadow = true;
      g.add(grip);
    });
  } else {
    const lbar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 1.18, 14),
      woodMat
    );
    lbar.rotation.z = Math.PI / 2;
    lbar.position.set(0, 2.14, 0);
    g.add(lbar);
  }

  return g;
}

/* ==========================================================================
   Garment Sprite Plane
   ──────────────────────────────────────────────────────────────────────────
   Each garment is a *single* high-res canvas texture displayed on a
   PlaneGeometry that faces the camera.  The canvas contains:
     • Correct clothing silhouette (clipped to transparent outside)
     • Full internal shading (ambient-occlusion folds, side shadows)
     • Fabric texture detail baked in
     • Garment-specific print / artwork
     • Collar, lapels, sleeves — all drawn in 2-D at pixel level
   This is exactly how professional fashion 3-D showcases render clothes.
   ========================================================================== */

/**
 * World-space dimensions for the sprite plane.
 *  Tops:     width ≈ 1.70,  height ≈ 2.10  (fits between rail y≈2.28 and floor y≈0.18)
 *  Trousers: width ≈ 1.30,  height ≈ 2.60  (waistband near y≈2.00, cuffs y≈-0.60)
 *  Jacket:   width ≈ 1.80,  height ≈ 2.30
 *
 *  The plane's TOP EDGE is positioned at the shoulder seam (y ≈ 2.22) so the
 *  hanger bar visually emerges from the neckline.
 */
const SPRITE_CONFIG = {
  'tee':        { w: 1.70, h: 1.82, topY: 2.22, z: 0.0 },
  'polo':       { w: 1.70, h: 1.82, topY: 2.22, z: 0.0 },
  'camp-shirt': { w: 1.78, h: 1.90, topY: 2.22, z: 0.0 },
  'jersey':     { w: 1.76, h: 1.85, topY: 2.22, z: 0.0 },
  'jacket':     { w: 1.86, h: 2.15, topY: 2.24, z: 0.0 },
  'trousers':   { w: 1.35, h: 2.55, topY: 2.06, z: 0.0 },
};

function buildGarmentSpriteMesh(item, colorway) {
  const cfg    = SPRITE_CONFIG[item.type] || SPRITE_CONFIG['tee'];
  const canvas = createGarmentSprite(item, colorway, cfg);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace       = THREE.SRGBColorSpace;
  tex.generateMipmaps  = true;
  tex.minFilter        = THREE.LinearMipmapLinearFilter;
  tex.magFilter        = THREE.LinearFilter;
  tex.anisotropy       = 8;

  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.02,
    side: THREE.FrontSide,
    depthWrite: false,
  });

  const geo  = new THREE.PlaneGeometry(cfg.w, cfg.h, 1, 1);
  const mesh = new THREE.Mesh(geo, mat);

  // Position: center X=0, plane center Y = topY - h/2
  mesh.position.set(0, cfg.topY - cfg.h * 0.5, cfg.z);
  mesh.castShadow    = false;
  mesh.receiveShadow = false;

  return { mesh, mat, tex, cfg };
}

/* ==========================================================================
   createGarmentPiece  ← the ONE function imported by main.js
   ========================================================================== */

export function createGarmentPiece(item, index) {
  const root = new THREE.Group();
  root.name = `piece_${item.id}`;

  const isPants = item.type === 'trousers';

  // swivelGroup: hanger + garment sprite rotate together
  const swivelGroup = new THREE.Group();
  swivelGroup.name = 'swivel_group';
  root.add(swivelGroup);

  // ── 1. 3-D Hanger ──────────────────────────────────────────────────────
  const hanger = createHanger(isPants);
  swivelGroup.add(hanger);

  // ── 2. Garment Sprite Plane ────────────────────────────────────────────
  const initialColorway = item.colorways[0];
  const { mesh: spriteMesh, mat: spriteMat, tex: spriteTex, cfg } =
    buildGarmentSpriteMesh(item, initialColorway);

  // Wrap the sprite so garmentGroup is traversable (raycaster needs children)
  const garmentGroup = new THREE.Group();
  garmentGroup.name = 'garment_body';
  garmentGroup.add(spriteMesh);
  swivelGroup.add(garmentGroup);

  // ── 3. Soft contact shadow on the floor ───────────────────────────────
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width  = 256;
  shadowCanvas.height = 128;
  const sc = shadowCanvas.getContext('2d');
  const sg = sc.createRadialGradient(128, 64, 0, 128, 64, 64);
  sg.addColorStop(0,   'rgba(0,0,0,0.50)');
  sg.addColorStop(0.35,'rgba(0,0,0,0.24)');
  sg.addColorStop(0.7, 'rgba(0,0,0,0.09)');
  sg.addColorStop(1,   'rgba(0,0,0,0)');
  sc.fillStyle = sg;
  sc.fillRect(0, 0, 256, 128);

  const shadowMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.1),
    new THREE.MeshBasicMaterial({
      map: new THREE.CanvasTexture(shadowCanvas),
      transparent: true, opacity: 0.60, depthWrite: false,
    })
  );
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.set(0, -1.88, 0.10);
  root.add(shadowMesh);

  // ── 4. Position on rack ────────────────────────────────────────────────
  root.position.x = index * 2.25;

  // ── Public interface (consumed by main.js) ─────────────────────────────
  return {
    item,
    index,
    root,
    swivelGroup,
    garmentGroup,
    material: spriteMat,          // kept for API compatibility
    hanger,
    currentColorway: initialColorway,

    // Physics springs used by the animation loop
    swingAngle: 0,
    swingVelocity: 0,
    rotationY: 0,
    targetRotationY: 0,
    rotationVelocityY: 0,
    is360Spinning: false,
    spinProgress: 0,
    spinStartAngle: 0,

    /** Swap texture when user changes colorway */
    updateColorway(newColorway) {
      this.currentColorway = newColorway;
      const newCanvas = createGarmentSprite(item, newColorway, cfg);
      spriteTex.image = newCanvas;
      spriteTex.needsUpdate = true;
    },

    trigger360Spin() {
      this.is360Spinning = true;
      this.spinProgress  = 0;
      this.spinStartAngle = this.rotationY;
    },

    resetRotation() {
      this.targetRotationY  = 0;
      this.is360Spinning    = false;
      this.rotationVelocityY = 0;
    },
  };
}
