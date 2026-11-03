import * as THREE from 'three';
import { createGarmentTexture, createFabricBumpTexture, createWoodHangerTexture } from './textures.js';

// Materials for hanger hardware
const brassMaterial = new THREE.MeshStandardMaterial({
  color: 0xd9b36c,
  metalness: 0.88,
  roughness: 0.22,
  envMapIntensity: 1.2
});

const darkMetalMaterial = new THREE.MeshStandardMaterial({
  color: 0x2e3033,
  metalness: 0.85,
  roughness: 0.3,
  envMapIntensity: 1.0
});

const rubberMaterial = new THREE.MeshStandardMaterial({
  color: 0x1a1a1a,
  roughness: 0.9,
  metalness: 0.1
});

/**
 * Creates luxury wooden wishbone hanger with metal hook and optional pants clips
 */
export function createHanger(isPants = false) {
  const hangerGroup = new THREE.Group();
  hangerGroup.name = 'hanger';

  // 1. Swiveling Curved Brass Hook that loops over the rail at y = 2.62
  const hookCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 2.36, 0),
    new THREE.Vector3(0, 2.50, 0),
    new THREE.Vector3(0.08, 2.58, 0),
    new THREE.Vector3(0.14, 2.67, 0),
    new THREE.Vector3(0.04, 2.74, 0),
    new THREE.Vector3(-0.08, 2.72, 0),
    new THREE.Vector3(-0.11, 2.64, 0)
  ]);
  const hookGeo = new THREE.TubeGeometry(hookCurve, 32, 0.013, 10, false);
  const hookMesh = new THREE.Mesh(hookGeo, brassMaterial);
  hookMesh.castShadow = true;
  hangerGroup.add(hookMesh);

  // Ball tip at hook end
  const ballTip = new THREE.Mesh(new THREE.SphereGeometry(0.02, 16, 16), brassMaterial);
  ballTip.position.set(-0.11, 2.64, 0);
  hangerGroup.add(ballTip);

  // Brass collar at hanger top
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.045, 16), brassMaterial);
  collar.position.set(0, 2.36, 0);
  hangerGroup.add(collar);

  // 2. Sculpted Wooden Shoulder Bar
  const woodTexture = createWoodHangerTexture();
  const woodMaterial = new THREE.MeshPhysicalMaterial({
    map: woodTexture,
    color: 0x7a563c,
    roughness: 0.38,
    clearcoat: 0.35,
    clearcoatRoughness: 0.25,
    reflectivity: 0.5
  });

  const shoulderShape = new THREE.Shape();
  shoulderShape.moveTo(-0.64, -0.16);
  shoulderShape.quadraticCurveTo(-0.35, 0.01, 0, 0.05);
  shoulderShape.quadraticCurveTo(0.35, 0.01, 0.64, -0.16);
  shoulderShape.quadraticCurveTo(0.66, -0.22, 0.63, -0.24);
  shoulderShape.quadraticCurveTo(0.35, -0.06, 0, -0.02);
  shoulderShape.quadraticCurveTo(-0.35, -0.06, -0.63, -0.24);
  shoulderShape.quadraticCurveTo(-0.66, -0.22, -0.64, -0.16);

  const shoulderGeo = new THREE.ExtrudeGeometry(shoulderShape, {
    depth: 0.042,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.010,
    bevelSegments: 4
  });
  shoulderGeo.center();

  const woodMesh = new THREE.Mesh(shoulderGeo, woodMaterial);
  woodMesh.position.set(0, 2.30, 0);
  woodMesh.castShadow = true;
  woodMesh.receiveShadow = true;
  hangerGroup.add(woodMesh);

  // 3. Hardware for Trousers or Tops
  if (isPants) {
    const crossbar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 1.15, 12),
      brassMaterial
    );
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, 2.12, 0);
    hangerGroup.add(crossbar);

    [-0.32, 0.32].forEach((xPos) => {
      const clipArm = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.14, 0.045), brassMaterial);
      clipArm.position.set(xPos, 2.07, 0);
      clipArm.castShadow = true;
      hangerGroup.add(clipArm);

      const clipGrip = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.04, 0.055), rubberMaterial);
      clipGrip.position.set(xPos, 2.01, 0);
      clipGrip.castShadow = true;
      hangerGroup.add(clipGrip);
    });
  } else {
    const lowerBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.011, 1.16, 12),
      woodMaterial
    );
    lowerBar.rotation.z = Math.PI / 2;
    lowerBar.position.set(0, 2.14, 0);
    hangerGroup.add(lowerBar);
  }

  return hangerGroup;
}

/**
 * Creates 3D Volumetric Mesh for Camp Collar Shirts (Faces Shirt, Artisan Shirt, Artist Long-Sleeve)
 */
export function createCampShirtMesh(item, colorway) {
  const group = new THREE.Group();
  group.name = 'garment_body';

  const bumpMap = createFabricBumpTexture('twill');
  const colorMap = createGarmentTexture(item, colorway);

  const fabricMaterial = new THREE.MeshPhysicalMaterial({
    map: colorMap,
    bumpMap: bumpMap,
    bumpScale: 0.02,
    roughness: 0.90,
    metalness: 0.0,
    sheen: 0.95,
    sheenRoughness: 0.45,
    sheenColor: new THREE.Color(colorway.hex).clone().lerp(new THREE.Color(0xffffff), 0.32),
    side: THREE.DoubleSide
  });

  const nx = 36;
  const ny = 24;
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let j = 0; j <= ny; j++) {
    const v = j / ny;
    for (let i = 0; i <= nx; i++) {
      const u = i / nx;
      const angle = (u - 0.5) * Math.PI * 2;
      const width = 1.18 + v * 0.28;
      const x = Math.sin(angle) * (width * 0.5);
      let z = Math.cos(angle) * (0.15 + v * 0.05);

      let y = (2.28 - Math.abs(x) * 0.19) - v * 1.72;

      // Open Cuban camp collar cutout in front showing the wooden hanger crossbar inside
      if (z > 0 && Math.abs(u - 0.5) < 0.12 && v < 0.35) {
        const neckFactor = (1 - Math.abs(u - 0.5) / 0.12) * (1 - v / 0.35);
        y -= neckFactor * 0.38;
        z += neckFactor * 0.04;
      }

      if (z > 0) {
        z += Math.sin(x * 6.2) * 0.035 * v;
      } else {
        z -= Math.sin(x * 6.2) * 0.020 * v;
      }

      positions.push(x, y, z);
      uvs.push(u, 1 - v);
    }
  }

  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      const b = j * (nx + 1) + (i + 1);
      const c = (j + 1) * (nx + 1) + (i + 1);
      const d = (j + 1) * (nx + 1) + i;
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const torsoGeo = new THREE.BufferGeometry();
  torsoGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  torsoGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  torsoGeo.setIndex(indices);
  torsoGeo.computeVertexNormals();

  const torsoMesh = new THREE.Mesh(torsoGeo, fabricMaterial);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  group.add(torsoMesh);

  // Open Relaxed Camp Collar Lapels
  [-1, 1].forEach((side) => {
    const lapelGeo = new THREE.BoxGeometry(0.24, 0.16, 0.022);
    const lapel = new THREE.Mesh(lapelGeo, fabricMaterial);
    lapel.position.set(side * 0.14, 2.06, 0.16);
    lapel.rotation.z = side * 0.40;
    lapel.rotation.y = side * -0.24;
    lapel.rotation.x = 0.30;
    lapel.castShadow = true;
    group.add(lapel);
  });

  // Sleeves with Hollow Cuffs
  const isLongSleeve = item.id === 'white-shirt-01';
  const sleeveLength = isLongSleeve ? 0.88 : (item.id === 'faces-shirt-01' ? 0.76 : 0.60);

  [-1, 1].forEach((side) => {
    const sleeveGeo = new THREE.CylinderGeometry(0.22, 0.17, sleeveLength, 24, 12, true);
    const sPos = sleeveGeo.attributes.position;
    for (let i = 0; i < sPos.count; i++) {
      sPos.setZ(i, sPos.getZ(i) * 0.52);
    }
    sleeveGeo.computeVertexNormals();

    const sleeveMesh = new THREE.Mesh(sleeveGeo, fabricMaterial);
    const shoulderAttachX = side * 0.62;
    const shoulderAttachY = 2.14;
    const sleeveAngle = 0.62;

    sleeveMesh.position.set(
      shoulderAttachX + side * Math.sin(sleeveAngle) * (sleeveLength * 0.5),
      shoulderAttachY - Math.cos(sleeveAngle) * (sleeveLength * 0.5),
      0
    );
    sleeveMesh.rotation.z = side * -sleeveAngle;
    sleeveMesh.rotation.y = side * 0.08;
    sleeveMesh.castShadow = true;
    sleeveMesh.receiveShadow = true;
    group.add(sleeveMesh);

    // Cuff ring
    const cuffGeo = new THREE.TorusGeometry(0.175, 0.016, 8, 24);
    cuffGeo.scale(1, 0.52, 1);
    const cuffMesh = new THREE.Mesh(cuffGeo, fabricMaterial);
    cuffMesh.position.set(
      shoulderAttachX + side * Math.sin(sleeveAngle) * sleeveLength,
      shoulderAttachY - Math.cos(sleeveAngle) * sleeveLength,
      0
    );
    cuffMesh.rotation.z = side * -sleeveAngle;
    group.add(cuffMesh);
  });

  return { group, fabricMaterial };
}

/**
 * Creates 3D Volumetric Mesh for Tailored Pleated Trousers (Brown & Jet Black)
 */
export function createTrousersMesh(item, colorway) {
  const group = new THREE.Group();
  group.name = 'garment_body';

  const bumpMap = createFabricBumpTexture('twill');
  const colorMap = createGarmentTexture(item, colorway);

  const fabricMaterial = new THREE.MeshPhysicalMaterial({
    map: colorMap,
    bumpMap: bumpMap,
    bumpScale: 0.024,
    roughness: 0.90,
    metalness: 0.0,
    sheen: 0.95,
    sheenRoughness: 0.48,
    sheenColor: new THREE.Color(colorway.hex).clone().lerp(new THREE.Color(0xffffff), 0.28),
    side: THREE.DoubleSide
  });

  // Waistband & Pelvis Block
  const waistRadius = 0.44;
  const waistHeight = 0.52;
  const waistGeo = new THREE.CylinderGeometry(waistRadius, waistRadius * 1.04, waistHeight, 32, 10, true);

  const wPos = waistGeo.attributes.position;
  for (let i = 0; i < wPos.count; i++) {
    wPos.setZ(i, wPos.getZ(i) * 0.38);
  }
  waistGeo.computeVertexNormals();

  const waistMesh = new THREE.Mesh(waistGeo, fabricMaterial);
  waistMesh.position.set(0, 1.76, 0);
  waistMesh.rotation.y = Math.PI;
  waistMesh.castShadow = true;
  waistMesh.receiveShadow = true;
  group.add(waistMesh);

  // Top waistband ridge
  const beltBand = new THREE.Mesh(
    new THREE.TorusGeometry(waistRadius, 0.018, 10, 32),
    fabricMaterial
  );
  beltBand.scale.set(1, 0.38, 1);
  beltBand.rotation.x = Math.PI / 2;
  beltBand.position.set(0, 2.02, 0);
  group.add(beltBand);

  // Distinct Left & Right Volumetric Trouser Legs
  const legHeight = 1.95;
  const legTopRadius = 0.23;
  const legBottomRadius = 0.19;

  [-1, 1].forEach((side) => {
    const legGeo = new THREE.CylinderGeometry(legTopRadius, legBottomRadius, legHeight, 28, 20, true);
    const lPos = legGeo.attributes.position;

    for (let i = 0; i < lPos.count; i++) {
      let x = lPos.getX(i);
      let y = lPos.getY(i);
      let z = lPos.getZ(i) * 0.42;

      // Front knife pleat crease sharpness
      if (z > 0 && Math.abs(x) < 0.06) {
        z += 0.038;
      }

      // Natural cloth drape wave at knee
      if (y < 0.2 && y > -0.6) {
        z += Math.sin((y + 0.2) * 5) * 0.024;
      }

      lPos.setXYZ(i, x, y, z);
    }
    legGeo.computeVertexNormals();

    const legMesh = new THREE.Mesh(legGeo, fabricMaterial);
    legMesh.position.set(side * 0.22, 0.52, 0);
    legMesh.castShadow = true;
    legMesh.receiveShadow = true;
    group.add(legMesh);

    // Turned Hem Cuffs at bottom
    const hemCuff = new THREE.Mesh(
      new THREE.CylinderGeometry(legBottomRadius + 0.012, legBottomRadius + 0.012, 0.08, 24, 2, true),
      fabricMaterial
    );
    hemCuff.scale.set(1, 1, 0.42);
    hemCuff.position.set(side * 0.22, -0.42, 0);
    hemCuff.castShadow = true;
    group.add(hemCuff);
  });

  return { group, fabricMaterial };
}

/**
 * Creates 3D Volumetric Mesh for T-Shirt / Polo Shirt
 */
export function createTeeMesh(item, colorway) {
  const group = new THREE.Group();
  group.name = 'garment_body';

  const patternType = item.type === 'polo' ? 'waffle' : 'knit';
  const bumpMap = createFabricBumpTexture(patternType);
  const colorMap = createGarmentTexture(item, colorway);

  const fabricMaterial = new THREE.MeshPhysicalMaterial({
    map: colorMap,
    bumpMap: bumpMap,
    bumpScale: 0.02,
    roughness: 0.92,
    metalness: 0.0,
    sheen: 1.0,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color(colorway.hex).clone().lerp(new THREE.Color(0xffffff), 0.35),
    side: THREE.DoubleSide
  });

  const nx = 36;
  const ny = 24;
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let j = 0; j <= ny; j++) {
    const v = j / ny;
    for (let i = 0; i <= nx; i++) {
      const u = i / nx;
      const angle = (u - 0.5) * Math.PI * 2;
      const width = 1.16 + v * 0.08;
      const x = Math.sin(angle) * (width * 0.5);
      let z = Math.cos(angle) * (0.16 + v * 0.03);

      let y = (2.28 - Math.abs(x) * 0.18) - v * 1.66;

      if (z > 0 && Math.abs(u - 0.5) < 0.10 && v < 0.20) {
        const neckFactor = (1 - Math.abs(u - 0.5) / 0.10) * (1 - v / 0.20);
        y -= neckFactor * 0.18;
      }

      if (z > 0) {
        z += Math.sin(x * 6.0) * 0.030 * v;
      }

      positions.push(x, y, z);
      uvs.push(u, 1 - v);
    }
  }

  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      const b = j * (nx + 1) + (i + 1);
      const c = (j + 1) * (nx + 1) + (i + 1);
      const d = (j + 1) * (nx + 1) + i;
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const torsoGeo = new THREE.BufferGeometry();
  torsoGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  torsoGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  torsoGeo.setIndex(indices);
  torsoGeo.computeVertexNormals();

  const torsoMesh = new THREE.Mesh(torsoGeo, fabricMaterial);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  group.add(torsoMesh);

  if (item.type === 'polo') {
    const flapGeo = new THREE.BoxGeometry(0.24, 0.14, 0.024);
    [-1, 1].forEach((side) => {
      const flap = new THREE.Mesh(flapGeo, fabricMaterial);
      flap.position.set(side * 0.13, 2.10, 0.14);
      flap.rotation.z = side * 0.35;
      flap.rotation.x = 0.25;
      flap.castShadow = true;
      group.add(flap);
    });
  } else {
    const collarGeo = new THREE.TorusGeometry(0.22, 0.028, 14, 32);
    collarGeo.scale(1.2, 0.65, 0.9);
    const collarMesh = new THREE.Mesh(collarGeo, fabricMaterial);
    collarMesh.rotation.x = Math.PI / 2 - 0.2;
    collarMesh.position.set(0, 2.14, 0.04);
    collarMesh.castShadow = true;
    group.add(collarMesh);
  }

  const sleeveLength = 0.58;
  [-1, 1].forEach((side) => {
    const sleeveGeo = new THREE.CylinderGeometry(0.20, 0.16, sleeveLength, 24, 12, true);
    const sPos = sleeveGeo.attributes.position;
    for (let i = 0; i < sPos.count; i++) {
      sPos.setZ(i, sPos.getZ(i) * 0.54);
    }
    sleeveGeo.computeVertexNormals();

    const sleeveMesh = new THREE.Mesh(sleeveGeo, fabricMaterial);
    const shoulderAttachX = side * 0.60;
    const shoulderAttachY = 2.14;
    const sleeveAngle = 0.65;

    sleeveMesh.position.set(
      shoulderAttachX + side * Math.sin(sleeveAngle) * (sleeveLength * 0.5),
      shoulderAttachY - Math.cos(sleeveAngle) * (sleeveLength * 0.5),
      0
    );
    sleeveMesh.rotation.z = side * -sleeveAngle;
    sleeveMesh.rotation.y = side * 0.08;
    sleeveMesh.castShadow = true;
    sleeveMesh.receiveShadow = true;
    group.add(sleeveMesh);

    const cuffGeo = new THREE.TorusGeometry(0.165, 0.016, 8, 24);
    cuffGeo.scale(1, 0.54, 1);
    const cuffMesh = new THREE.Mesh(cuffGeo, fabricMaterial);
    cuffMesh.position.set(
      shoulderAttachX + side * Math.sin(sleeveAngle) * sleeveLength,
      shoulderAttachY - Math.cos(sleeveAngle) * sleeveLength,
      0
    );
    cuffMesh.rotation.z = side * -sleeveAngle;
    group.add(cuffMesh);
  });

  return { group, fabricMaterial };
}

/**
 * Creates 3D Volumetric Mesh for Harrington / Overcoat
 */
export function createJacketMesh(item, colorway) {
  const group = new THREE.Group();
  group.name = 'garment_body';

  const bumpMap = createFabricBumpTexture('twill');
  const colorMap = createGarmentTexture(item, colorway);

  const fabricMaterial = new THREE.MeshPhysicalMaterial({
    map: colorMap,
    bumpMap: bumpMap,
    bumpScale: 0.024,
    roughness: 0.88,
    metalness: 0.02,
    sheen: 0.85,
    sheenRoughness: 0.45,
    sheenColor: new THREE.Color(colorway.hex).clone().lerp(new THREE.Color(0xffffff), 0.28),
    side: THREE.DoubleSide
  });

  const nx = 36;
  const ny = 26;
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let j = 0; j <= ny; j++) {
    const v = j / ny;
    for (let i = 0; i <= nx; i++) {
      const u = i / nx;
      const angle = (u - 0.5) * Math.PI * 2;
      const width = 1.22 + v * 0.16;
      const x = Math.sin(angle) * (width * 0.5);
      let z = Math.cos(angle) * (0.18 + v * 0.04);
      let y = (2.30 - Math.abs(x) * 0.20) - v * 1.95;

      positions.push(x, y, z);
      uvs.push(u, 1 - v);
    }
  }

  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      const b = j * (nx + 1) + (i + 1);
      const c = (j + 1) * (nx + 1) + (i + 1);
      const d = (j + 1) * (nx + 1) + i;
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const torsoGeo = new THREE.BufferGeometry();
  torsoGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  torsoGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  torsoGeo.setIndex(indices);
  torsoGeo.computeVertexNormals();

  const torsoMesh = new THREE.Mesh(torsoGeo, fabricMaterial);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  group.add(torsoMesh);

  [-1, 1].forEach((side) => {
    const lapelGeo = new THREE.BoxGeometry(0.30, 0.18, 0.028);
    const lapel = new THREE.Mesh(lapelGeo, fabricMaterial);
    lapel.position.set(side * 0.17, 2.10, 0.16);
    lapel.rotation.z = side * 0.42;
    lapel.rotation.y = side * -0.22;
    lapel.rotation.x = 0.25;
    lapel.castShadow = true;
    group.add(lapel);
  });

  const sleeveLength = 0.82;
  [-1, 1].forEach((side) => {
    const sleeveGeo = new THREE.CylinderGeometry(0.22, 0.17, sleeveLength, 24, 12, true);
    const sPos = sleeveGeo.attributes.position;
    for (let i = 0; i < sPos.count; i++) {
      sPos.setZ(i, sPos.getZ(i) * 0.54);
    }
    sleeveGeo.computeVertexNormals();

    const sleeveMesh = new THREE.Mesh(sleeveGeo, fabricMaterial);
    const shoulderAttachX = side * 0.62;
    const shoulderAttachY = 2.15;
    const sleeveAngle = 0.62;

    sleeveMesh.position.set(
      shoulderAttachX + side * Math.sin(sleeveAngle) * (sleeveLength * 0.5),
      shoulderAttachY - Math.cos(sleeveAngle) * (sleeveLength * 0.5),
      0
    );
    sleeveMesh.rotation.z = side * -sleeveAngle;
    sleeveMesh.castShadow = true;
    sleeveMesh.receiveShadow = true;
    group.add(sleeveMesh);
  });

  return { group, fabricMaterial };
}

/**
 * Creates 3D Volumetric Mesh for Heritage Varsity Jersey
 */
export function createJerseyMesh(item, colorway) {
  const group = new THREE.Group();
  group.name = 'garment_body';

  const bumpMap = createFabricBumpTexture('knit');
  const colorMap = createGarmentTexture(item, colorway);

  const fabricMaterial = new THREE.MeshPhysicalMaterial({
    map: colorMap,
    bumpMap: bumpMap,
    bumpScale: 0.02,
    roughness: 0.90,
    metalness: 0.0,
    sheen: 1.0,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color(colorway.hex).clone().lerp(new THREE.Color(0xffffff), 0.35),
    side: THREE.DoubleSide
  });

  const nx = 36;
  const ny = 24;
  const positions = [];
  const uvs = [];
  const indices = [];

  for (let j = 0; j <= ny; j++) {
    const v = j / ny;
    for (let i = 0; i <= nx; i++) {
      const u = i / nx;
      const angle = (u - 0.5) * Math.PI * 2;
      const width = 1.18 + v * 0.12;
      const x = Math.sin(angle) * (width * 0.5);
      let z = Math.cos(angle) * (0.16 + v * 0.03);
      let y = (2.28 - Math.abs(x) * 0.18) - v * 1.68;

      if (z > 0 && Math.abs(u - 0.5) < 0.10 && v < 0.25) {
        const neckFactor = (1 - Math.abs(u - 0.5) / 0.10) * (1 - v / 0.25);
        y -= neckFactor * 0.28;
      }

      positions.push(x, y, z);
      uvs.push(u, 1 - v);
    }
  }

  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      const b = j * (nx + 1) + (i + 1);
      const c = (j + 1) * (nx + 1) + (i + 1);
      const d = (j + 1) * (nx + 1) + i;
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const torsoGeo = new THREE.BufferGeometry();
  torsoGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  torsoGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  torsoGeo.setIndex(indices);
  torsoGeo.computeVertexNormals();

  const torsoMesh = new THREE.Mesh(torsoGeo, fabricMaterial);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  group.add(torsoMesh);

  const collarGeo = new THREE.TorusGeometry(0.24, 0.026, 12, 32);
  collarGeo.scale(1.2, 0.60, 0.9);
  const collarMesh = new THREE.Mesh(collarGeo, fabricMaterial);
  collarMesh.rotation.x = Math.PI / 2 - 0.25;
  collarMesh.position.set(0, 2.10, 0.06);
  collarMesh.castShadow = true;
  group.add(collarMesh);

  const sleeveLength = 0.62;
  [-1, 1].forEach((side) => {
    const sleeveGeo = new THREE.CylinderGeometry(0.21, 0.17, sleeveLength, 24, 12, true);
    const sPos = sleeveGeo.attributes.position;
    for (let i = 0; i < sPos.count; i++) {
      sPos.setZ(i, sPos.getZ(i) * 0.54);
    }
    sleeveGeo.computeVertexNormals();

    const sleeveMesh = new THREE.Mesh(sleeveGeo, fabricMaterial);
    const shoulderAttachX = side * 0.61;
    const shoulderAttachY = 2.14;
    const sleeveAngle = 0.64;

    sleeveMesh.position.set(
      shoulderAttachX + side * Math.sin(sleeveAngle) * (sleeveLength * 0.5),
      shoulderAttachY - Math.cos(sleeveAngle) * (sleeveLength * 0.5),
      0
    );
    sleeveMesh.rotation.z = side * -sleeveAngle;
    sleeveMesh.castShadow = true;
    sleeveMesh.receiveShadow = true;
    group.add(sleeveMesh);
  });

  return { group, fabricMaterial };
}

/**
 * Creates complete 3D Garment piece (Hanger + Garment Body + Soft Drop Shadow Plane)
 */
export function createGarmentPiece(item, index) {
  const root = new THREE.Group();
  root.name = `piece_${item.id}`;

  const isPants = item.type === 'trousers';

  // Swivel Group: hanger + garment body rotate together
  const swivelGroup = new THREE.Group();
  swivelGroup.name = 'swivel_group';
  root.add(swivelGroup);

  // 1. Wooden Hanger with brass hook
  const hanger = createHanger(isPants);
  swivelGroup.add(hanger);

  // 2. Garment 3D Model based on type
  let garmentResult;
  const initialColorway = item.colorways[0];

  switch (item.type) {
    case 'camp-shirt':
      garmentResult = createCampShirtMesh(item, initialColorway);
      break;
    case 'jacket':
      garmentResult = createJacketMesh(item, initialColorway);
      break;
    case 'jersey':
      garmentResult = createJerseyMesh(item, initialColorway);
      break;
    case 'trousers':
      garmentResult = createTrousersMesh(item, initialColorway);
      break;
    case 'polo':
    case 'tee':
    default:
      garmentResult = createTeeMesh(item, initialColorway);
      break;
  }

  swivelGroup.add(garmentResult.group);

  // 3. Soft Ambient Ground Contact Shadow Plane
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 256;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d');

  const grad = sCtx.createRadialGradient(128, 64, 0, 128, 64, 64);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.46)');
  grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.22)');
  grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.08)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 256, 128);

  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowGeo = new THREE.PlaneGeometry(2.6, 1.2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.65,
    depthWrite: false
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.rotation.z = -0.28;
  shadowMesh.position.set(0.12, -1.88, 0.15);
  root.add(shadowMesh);

  // Spacing along the wardrobe rack
  const rackSpacing = 2.25;
  root.position.x = index * rackSpacing;

  return {
    item,
    index,
    root,
    swivelGroup,
    garmentGroup: garmentResult.group,
    material: garmentResult.fabricMaterial,
    hanger,
    currentColorway: initialColorway,
    swingAngle: 0,
    swingVelocity: 0,
    // 360-degree rotation state for when stopped at this piece
    rotationY: 0,
    targetRotationY: 0,
    rotationVelocityY: 0,
    is360Spinning: false,
    spinProgress: 0,
    spinStartAngle: 0,
    updateColorway(newColorway) {
      this.currentColorway = newColorway;
      const newMap = createGarmentTexture(this.item, newColorway);
      this.material.map = newMap;
      this.material.sheenColor = new THREE.Color(newColorway.hex).clone().lerp(new THREE.Color(0xffffff), 0.3);
      this.material.needsUpdate = true;
    },
    trigger360Spin() {
      this.is360Spinning = true;
      this.spinProgress = 0;
      this.spinStartAngle = this.rotationY;
    },
    resetRotation() {
      this.targetRotationY = 0;
      this.is360Spinning = false;
      this.rotationVelocityY = 0;
    }
  };
}
