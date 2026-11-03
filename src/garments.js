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
 * Creates luxury wooden hanger with metal hook and optional pants clips
 */
export function createHanger(isPants = false) {
  const hangerGroup = new THREE.Group();
  hangerGroup.name = 'hanger';

  // 1. Swiveling Curved Brass Hook
  const hookCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 2.38, 0),
    new THREE.Vector3(0, 2.50, 0),
    new THREE.Vector3(0.08, 2.58, 0),
    new THREE.Vector3(0.14, 2.67, 0),
    new THREE.Vector3(0.04, 2.74, 0),
    new THREE.Vector3(-0.08, 2.72, 0),
    new THREE.Vector3(-0.11, 2.65, 0)
  ]);
  const hookGeo = new THREE.TubeGeometry(hookCurve, 32, 0.014, 10, false);
  const hookMesh = new THREE.Mesh(hookGeo, brassMaterial);
  hookMesh.castShadow = true;
  hangerGroup.add(hookMesh);

  // Ball tip at hook end
  const ballTip = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 16), brassMaterial);
  ballTip.position.set(-0.11, 2.65, 0);
  hangerGroup.add(ballTip);

  // Brass collar at hanger base
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.05, 16), brassMaterial);
  collar.position.set(0, 2.37, 0);
  hangerGroup.add(collar);

  // 2. Sculpted Wooden Shoulder Bar
  const woodTexture = createWoodHangerTexture();
  const woodMaterial = new THREE.MeshPhysicalMaterial({
    map: woodTexture,
    color: 0x755239,
    roughness: 0.38,
    clearcoat: 0.35,
    clearcoatRoughness: 0.25,
    reflectivity: 0.5
  });

  // Hanger shoulder shape with natural contoured slope and backward sweep
  const shoulderShape = new THREE.Shape();
  shoulderShape.moveTo(-0.64, -0.16);
  shoulderShape.quadraticCurveTo(-0.35, 0.01, 0, 0.05);
  shoulderShape.quadraticCurveTo(0.35, 0.01, 0.64, -0.16);
  shoulderShape.quadraticCurveTo(0.66, -0.22, 0.63, -0.24);
  shoulderShape.quadraticCurveTo(0.35, -0.06, 0, -0.02);
  shoulderShape.quadraticCurveTo(-0.35, -0.06, -0.63, -0.24);
  shoulderShape.quadraticCurveTo(-0.66, -0.22, -0.64, -0.16);

  const shoulderGeo = new THREE.ExtrudeGeometry(shoulderShape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.012,
    bevelSegments: 4
  });
  shoulderGeo.center();

  const woodMesh = new THREE.Mesh(shoulderGeo, woodMaterial);
  woodMesh.position.set(0, 2.32, 0);
  woodMesh.castShadow = true;
  woodMesh.receiveShadow = true;
  hangerGroup.add(woodMesh);

  // 3. Hardware for Trousers or Tops
  if (isPants) {
    // Crossbar connecting the shoulders
    const crossbar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, 1.15, 12),
      brassMaterial
    );
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(0, 2.12, 0);
    hangerGroup.add(crossbar);

    // Two detailed metal clips with rubber grips
    [-0.32, 0.32].forEach((xPos) => {
      const clipArm = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.05), brassMaterial);
      clipArm.position.set(xPos, 2.06, 0);
      clipArm.castShadow = true;
      hangerGroup.add(clipArm);

      const clipGrip = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.04, 0.06), rubberMaterial);
      clipGrip.position.set(xPos, 1.98, 0);
      hangerGroup.add(clipGrip);
    });
  } else {
    // Wooden lower bar for stability
    const lowerBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 1.18, 12),
      woodMaterial
    );
    lowerBar.rotation.z = Math.PI / 2;
    lowerBar.position.set(0, 2.16, 0);
    hangerGroup.add(lowerBar);
  }

  return hangerGroup;
}

/**
 * Creates 3D Volumetric Mesh for T-Shirt / Jersey / Knit Polo
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

  // 1. Volumetric Torso with Organic Fabric Folds
  // Using a segmented cylinder displaced by drape waves for genuine 3D cloth realism
  const torsoRadiusTop = 0.52;
  const torsoRadiusBottom = 0.55;
  const torsoHeight = 1.62;
  const radialSegments = 40;
  const heightSegments = 28;

  const torsoGeo = new THREE.CylinderGeometry(
    torsoRadiusTop,
    torsoRadiusBottom,
    torsoHeight,
    radialSegments,
    heightSegments,
    true
  );

  // Apply natural drape wave displacement to simulate hanging cloth
  const pos = torsoGeo.attributes.position;
  const uv = torsoGeo.attributes.uv;

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Flatten depth to give natural chest-to-back profile (elliptical rather than round)
    z *= 0.38;

    // Natural downward cloth folds/waves (stronger towards the bottom hem)
    const factor = (0.8 - y) / torsoHeight;
    const foldWave = Math.sin(x * 6.5) * 0.038 * factor;
    const subtleBreeze = Math.cos(y * 4.2 + x * 2.1) * 0.02 * factor;

    // Slight waist drape
    z += foldWave + subtleBreeze;

    pos.setXYZ(i, x, y, z);
  }

  torsoGeo.computeVertexNormals();

  const torsoMesh = new THREE.Mesh(torsoGeo, fabricMaterial);
  torsoMesh.position.set(0, 1.25, 0);
  torsoMesh.rotation.y = Math.PI;
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  group.add(torsoMesh);

  // 2. Ribbed Neck Collar (Volumetric Torus ring)
  const collarGeo = new THREE.TorusGeometry(0.24, 0.032, 14, 32);
  collarGeo.scale(1.2, 0.65, 0.9);
  const collarMesh = new THREE.Mesh(collarGeo, fabricMaterial);
  collarMesh.rotation.x = Math.PI / 2 - 0.2;
  collarMesh.position.set(0, 2.05, 0.02);
  collarMesh.castShadow = true;
  group.add(collarMesh);

  // 3. Volumetric 3D Sleeves (Left & Right)
  [-1, 1].forEach((side) => {
    const sleeveLength = 0.62;
    const sleeveGeo = new THREE.CylinderGeometry(0.21, 0.17, sleeveLength, 24, 12, true);
    // Flatten sleeve cross-section slightly
    const sPos = sleeveGeo.attributes.position;
    for (let i = 0; i < sPos.count; i++) {
      sPos.setZ(i, sPos.getZ(i) * 0.55);
    }
    sleeveGeo.computeVertexNormals();

    const sleeveMesh = new THREE.Mesh(sleeveGeo, fabricMaterial);
    sleeveMesh.position.set(side * 0.62, 1.76, 0);
    sleeveMesh.rotation.z = side * -0.68;
    sleeveMesh.rotation.y = side * 0.08;
    sleeveMesh.castShadow = true;
    sleeveMesh.receiveShadow = true;
    group.add(sleeveMesh);

    // Ribbed sleeve cuff ring
    const cuffGeo = new THREE.TorusGeometry(0.17, 0.02, 10, 24);
    cuffGeo.scale(1, 0.55, 1);
    const cuffMesh = new THREE.Mesh(cuffGeo, fabricMaterial);
    cuffMesh.position.set(side * 0.81, 1.54, 0);
    cuffMesh.rotation.z = side * -0.68;
    group.add(cuffMesh);
  });

  // 4. Polo Specific details (Collar flaps and placket)
  if (item.type === 'polo') {
    const flapGeo = new THREE.BoxGeometry(0.26, 0.14, 0.025);
    [-1, 1].forEach((side) => {
      const flap = new THREE.Mesh(flapGeo, fabricMaterial);
      flap.position.set(side * 0.14, 1.98, 0.14);
      flap.rotation.z = side * 0.35;
      flap.rotation.x = 0.25;
      flap.castShadow = true;
      group.add(flap);
    });
  }

  // 5. Bottom Hem Seam Bead
  const hemRing = new THREE.Mesh(
    new THREE.TorusGeometry(torsoRadiusBottom, 0.016, 8, 36),
    fabricMaterial
  );
  hemRing.scale.set(1, 0.38, 1);
  hemRing.rotation.x = Math.PI / 2;
  hemRing.position.set(0, 0.44, 0);
  group.add(hemRing);

  return { group, fabricMaterial };
}

/**
 * Creates 3D Volumetric Mesh for Camp Collar Shirt (Faces Shirt / Relaxed Summer Shirt)
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
    roughness: 0.9,
    metalness: 0.0,
    sheen: 0.95,
    sheenRoughness: 0.45,
    sheenColor: new THREE.Color(colorway.hex).clone().lerp(new THREE.Color(0xffffff), 0.3),
    side: THREE.DoubleSide
  });

  // 1. Natural A-line Flared Torso (as seen in reference image)
  const torsoRadiusTop = 0.51;
  const torsoRadiusBottom = 0.66; // Flared A-line silhouette
  const torsoHeight = 1.62;
  const radialSegments = 40;
  const heightSegments = 28;

  const torsoGeo = new THREE.CylinderGeometry(
    torsoRadiusTop,
    torsoRadiusBottom,
    torsoHeight,
    radialSegments,
    heightSegments,
    true
  );

  const pos = torsoGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i) * 0.36; // Organic flattened chest profile

    const factor = (0.8 - y) / torsoHeight;
    // Natural cloth wave ripples cascading toward the hem
    const drapeWave = Math.sin(x * 6.0) * 0.045 * factor;
    const sideFlare = Math.sin(y * 2.5) * 0.015;

    z += drapeWave;
    x += sideFlare;
    pos.setXYZ(i, x, y, z);
  }
  torsoGeo.computeVertexNormals();

  const torsoMesh = new THREE.Mesh(torsoGeo, fabricMaterial);
  torsoMesh.position.set(0, 1.25, 0);
  torsoMesh.rotation.y = Math.PI;
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  group.add(torsoMesh);

  // 2. Open Relaxed Camp Collar Lapels
  [-1, 1].forEach((side) => {
    const lapelGeo = new THREE.BoxGeometry(0.24, 0.16, 0.024);
    const lapel = new THREE.Mesh(lapelGeo, fabricMaterial);
    lapel.position.set(side * 0.13, 2.02, 0.14);
    lapel.rotation.z = side * 0.42;
    lapel.rotation.y = side * -0.22;
    lapel.rotation.x = 0.32;
    lapel.castShadow = true;
    group.add(lapel);
  });

  // 3. Natural Draped Sleeves (Quarter to full length)
  const sleeveLength = item.id === 'printed-shirt-01' ? 0.58 : 0.72;
  [-1, 1].forEach((side) => {
    const sleeveGeo = new THREE.CylinderGeometry(0.22, 0.18, sleeveLength, 24, 12, true);
    const sPos = sleeveGeo.attributes.position;
    for (let i = 0; i < sPos.count; i++) {
      sPos.setZ(i, sPos.getZ(i) * 0.52);
    }
    sleeveGeo.computeVertexNormals();

    const sleeveMesh = new THREE.Mesh(sleeveGeo, fabricMaterial);
    sleeveMesh.position.set(side * 0.65, 1.72, 0);
    sleeveMesh.rotation.z = side * -0.66;
    sleeveMesh.rotation.y = side * 0.08;
    sleeveMesh.castShadow = true;
    sleeveMesh.receiveShadow = true;
    group.add(sleeveMesh);

    // Turned cuff ring
    const cuffGeo = new THREE.TorusGeometry(0.18, 0.018, 8, 24);
    cuffGeo.scale(1, 0.52, 1);
    const cuffMesh = new THREE.Mesh(cuffGeo, fabricMaterial);
    cuffMesh.position.set(side * (0.65 + Math.sin(0.66) * sleeveLength * 0.45), 1.72 - Math.cos(0.66) * sleeveLength * 0.45, 0);
    cuffMesh.rotation.z = side * -0.66;
    group.add(cuffMesh);
  });

  // 4. Curved Bottom Hem Bead
  const hemRing = new THREE.Mesh(
    new THREE.TorusGeometry(torsoRadiusBottom, 0.016, 8, 36),
    fabricMaterial
  );
  hemRing.scale.set(1, 0.36, 1);
  hemRing.rotation.x = Math.PI / 2;
  hemRing.position.set(0, 0.44, 0);
  group.add(hemRing);

  return { group, fabricMaterial };
}

/**
 * Creates 3D Volumetric Mesh for Hoodie
 */
export function createHoodieMesh(item, colorway) {
  const group = new THREE.Group();
  group.name = 'garment_body';

  const bumpMap = createFabricBumpTexture('knit');
  const colorMap = createGarmentTexture(item, colorway);

  const fabricMaterial = new THREE.MeshPhysicalMaterial({
    map: colorMap,
    bumpMap: bumpMap,
    bumpScale: 0.025,
    roughness: 0.94,
    metalness: 0.0,
    sheen: 1.0,
    sheenRoughness: 0.55,
    sheenColor: new THREE.Color(colorway.hex).clone().lerp(new THREE.Color(0xffffff), 0.3),
    side: THREE.DoubleSide
  });

  // 1. Heavyweight Torso
  const torsoRadiusTop = 0.56;
  const torsoRadiusBottom = 0.58;
  const torsoHeight = 1.66;
  const torsoGeo = new THREE.CylinderGeometry(torsoRadiusTop, torsoRadiusBottom, torsoHeight, 40, 28, true);

  const pos = torsoGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i) * 0.45;
    const factor = (0.8 - y) / torsoHeight;
    z += Math.sin(x * 5.5) * 0.045 * factor;
    pos.setXYZ(i, x, y, z);
  }
  torsoGeo.computeVertexNormals();

  const torsoMesh = new THREE.Mesh(torsoGeo, fabricMaterial);
  torsoMesh.position.set(0, 1.25, 0);
  torsoMesh.rotation.y = Math.PI;
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  group.add(torsoMesh);

  // 2. 3D Kangaroo Pocket Shell
  const pocketGeo = new THREE.CylinderGeometry(0.38, 0.48, 0.46, 20, 8, false, -Math.PI / 3, (Math.PI * 2) / 3);
  const pPos = pocketGeo.attributes.position;
  for (let i = 0; i < pPos.count; i++) {
    pPos.setZ(i, pPos.getZ(i) * 0.35 + 0.06);
  }
  pocketGeo.computeVertexNormals();
  const pocketMesh = new THREE.Mesh(pocketGeo, fabricMaterial);
  pocketMesh.position.set(0, 0.88, 0.16);
  pocketMesh.castShadow = true;
  group.add(pocketMesh);

  // 3. Volumetric 3D Hood draped behind
  const hoodGeo = new THREE.SphereGeometry(0.32, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.75);
  hoodGeo.scale(0.85, 1.15, 0.95);
  const hoodMesh = new THREE.Mesh(hoodGeo, fabricMaterial);
  hoodMesh.position.set(0, 2.05, -0.16);
  hoodMesh.rotation.x = 0.45;
  hoodMesh.castShadow = true;
  group.add(hoodMesh);

  // 4. Drawstrings with Brass Aglets
  [-0.08, 0.08].forEach((xPos) => {
    const stringCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(xPos, 1.95, 0.12),
      new THREE.Vector3(xPos * 1.3, 1.65, 0.18),
      new THREE.Vector3(xPos * 0.9, 1.35, 0.17)
    ]);
    const stringGeo = new THREE.TubeGeometry(stringCurve, 16, 0.01, 8, false);
    const stringMesh = new THREE.Mesh(stringGeo, fabricMaterial);
    group.add(stringMesh);

    // Aglet at tip
    const aglet = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.06, 12), brassMaterial);
    aglet.position.set(xPos * 0.9, 1.32, 0.17);
    group.add(aglet);
  });

  // 5. Volumetric Wide Sleeves
  [-1, 1].forEach((side) => {
    const sleeveLength = 0.74;
    const sleeveGeo = new THREE.CylinderGeometry(0.24, 0.18, sleeveLength, 24, 12, true);
    const sPos = sleeveGeo.attributes.position;
    for (let i = 0; i < sPos.count; i++) {
      sPos.setZ(i, sPos.getZ(i) * 0.58);
    }
    sleeveGeo.computeVertexNormals();

    const sleeveMesh = new THREE.Mesh(sleeveGeo, fabricMaterial);
    sleeveMesh.position.set(side * 0.66, 1.68, 0);
    sleeveMesh.rotation.z = side * -0.62;
    sleeveMesh.castShadow = true;
    sleeveMesh.receiveShadow = true;
    group.add(sleeveMesh);

    // Elongated Ribbed Cuff
    const cuffGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.14, 20, 4, true);
    const cuffMesh = new THREE.Mesh(cuffGeo, fabricMaterial);
    cuffMesh.position.set(side * 0.9, 1.38, 0);
    cuffMesh.rotation.z = side * -0.62;
    group.add(cuffMesh);
  });

  // 6. Ribbed Waistband Hem
  const ribHem = new THREE.Mesh(
    new THREE.CylinderGeometry(torsoRadiusBottom, torsoRadiusBottom - 0.02, 0.14, 36, 4, true),
    fabricMaterial
  );
  ribHem.scale.set(1, 1, 0.45);
  ribHem.position.set(0, 0.42, 0);
  ribHem.castShadow = true;
  group.add(ribHem);

  return { group, fabricMaterial };
}

/**
 * Creates 3D Volumetric Mesh for Jacket / Overshirt
 */
export function createJacketMesh(item, colorway) {
  const group = new THREE.Group();
  group.name = 'garment_body';

  const bumpMap = createFabricBumpTexture('twill');
  const colorMap = createGarmentTexture(item, colorway);

  const fabricMaterial = new THREE.MeshPhysicalMaterial({
    map: colorMap,
    bumpMap: bumpMap,
    bumpScale: 0.022,
    roughness: 0.88,
    metalness: 0.02,
    sheen: 0.8,
    sheenRoughness: 0.45,
    sheenColor: new THREE.Color(colorway.hex).clone().lerp(new THREE.Color(0xffffff), 0.25),
    side: THREE.DoubleSide
  });

  // 1. Structured Torso with Center Split Placket
  const torsoRadiusTop = 0.55;
  const torsoRadiusBottom = 0.56;
  const torsoHeight = 1.62;
  const torsoGeo = new THREE.CylinderGeometry(torsoRadiusTop, torsoRadiusBottom, torsoHeight, 40, 24, true);

  const pos = torsoGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i) * 0.44;
    pos.setXYZ(i, x, y, z);
  }
  torsoGeo.computeVertexNormals();

  const torsoMesh = new THREE.Mesh(torsoGeo, fabricMaterial);
  torsoMesh.position.set(0, 1.25, 0);
  torsoMesh.rotation.y = Math.PI;
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  group.add(torsoMesh);

  // 2. Folded Point Collar Lapels
  [-1, 1].forEach((side) => {
    const lapelGeo = new THREE.BoxGeometry(0.32, 0.18, 0.03);
    const lapel = new THREE.Mesh(lapelGeo, fabricMaterial);
    lapel.position.set(side * 0.18, 2.05, 0.14);
    lapel.rotation.z = side * 0.42;
    lapel.rotation.y = side * -0.25;
    lapel.rotation.x = 0.25;
    lapel.castShadow = true;
    group.add(lapel);
  });

  // 3. Front Zipper / Placket strip with Metal Slider
  const placketMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, torsoHeight - 0.1, 0.02),
    darkMetalMaterial
  );
  placketMesh.position.set(0, 1.25, 0.23);
  group.add(placketMesh);

  // Metal zipper pull tab
  const pullTab = new THREE.Mesh(
    new THREE.BoxGeometry(0.025, 0.08, 0.015),
    brassMaterial
  );
  pullTab.position.set(0, 1.48, 0.25);
  pullTab.castShadow = true;
  group.add(pullTab);

  // 4. Volumetric Structured Sleeves
  [-1, 1].forEach((side) => {
    const sleeveLength = 0.68;
    const sleeveGeo = new THREE.CylinderGeometry(0.23, 0.18, sleeveLength, 24, 12, true);
    const sPos = sleeveGeo.attributes.position;
    for (let i = 0; i < sPos.count; i++) {
      sPos.setZ(i, sPos.getZ(i) * 0.52);
    }
    sleeveGeo.computeVertexNormals();

    const sleeveMesh = new THREE.Mesh(sleeveGeo, fabricMaterial);
    sleeveMesh.position.set(side * 0.65, 1.72, 0);
    sleeveMesh.rotation.z = side * -0.66;
    sleeveMesh.castShadow = true;
    group.add(sleeveMesh);

    // Cuffed wrist band with button
    const cuffGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 20, 2, true);
    const cuffMesh = new THREE.Mesh(cuffGeo, fabricMaterial);
    cuffMesh.position.set(side * 0.88, 1.44, 0);
    cuffMesh.rotation.z = side * -0.66;
    group.add(cuffMesh);
  });

  return { group, fabricMaterial };
}

/**
 * Creates 3D Volumetric Mesh for Tailored Trousers / Cargo Pants
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
    roughness: 0.9,
    metalness: 0.0,
    sheen: 0.95,
    sheenRoughness: 0.48,
    sheenColor: new THREE.Color(colorway.hex).clone().lerp(new THREE.Color(0xffffff), 0.25),
    side: THREE.DoubleSide
  });

  // 1. Waistband & Pelvis Block
  const waistRadius = 0.46;
  const waistHeight = 0.52;
  const waistGeo = new THREE.CylinderGeometry(waistRadius, waistRadius * 1.05, waistHeight, 32, 10, true);

  const wPos = waistGeo.attributes.position;
  for (let i = 0; i < wPos.count; i++) {
    wPos.setZ(i, wPos.getZ(i) * 0.38);
  }
  waistGeo.computeVertexNormals();

  const waistMesh = new THREE.Mesh(waistGeo, fabricMaterial);
  waistMesh.position.set(0, 1.75, 0);
  waistMesh.rotation.y = Math.PI;
  waistMesh.castShadow = true;
  waistMesh.receiveShadow = true;
  group.add(waistMesh);

  // Top waistband ridge
  const beltBand = new THREE.Mesh(
    new THREE.TorusGeometry(waistRadius, 0.02, 10, 32),
    fabricMaterial
  );
  beltBand.scale.set(1, 0.38, 1);
  beltBand.rotation.x = Math.PI / 2;
  beltBand.position.set(0, 2.01, 0);
  group.add(beltBand);

  // 2. Distinct Left & Right Volumetric Trouser Legs
  const legHeight = 1.95;
  const legTopRadius = 0.24;
  const legBottomRadius = 0.19;

  [-1, 1].forEach((side) => {
    const legGeo = new THREE.CylinderGeometry(legTopRadius, legBottomRadius, legHeight, 28, 20, true);
    const lPos = legGeo.attributes.position;

    for (let i = 0; i < lPos.count; i++) {
      let x = lPos.getX(i);
      let y = lPos.getY(i);
      let z = lPos.getZ(i) * 0.42;

      // Front pleat / crease sharpness
      if (z > 0 && Math.abs(x) < 0.06) {
        z += 0.035;
      }

      // Natural cloth drape wave at knee
      if (y < 0.2 && y > -0.6) {
        z += Math.sin((y + 0.2) * 5) * 0.025;
      }

      lPos.setXYZ(i, x, y, z);
    }
    legGeo.computeVertexNormals();

    const legMesh = new THREE.Mesh(legGeo, fabricMaterial);
    legMesh.position.set(side * 0.23, 0.52, 0);
    legMesh.castShadow = true;
    legMesh.receiveShadow = true;
    group.add(legMesh);

    // Turned Hem Cuffs at bottom
    const hemCuff = new THREE.Mesh(
      new THREE.CylinderGeometry(legBottomRadius + 0.012, legBottomRadius + 0.012, 0.09, 24, 2, true),
      fabricMaterial
    );
    hemCuff.scale.set(1, 1, 0.42);
    hemCuff.position.set(side * 0.23, -0.42, 0);
    hemCuff.castShadow = true;
    group.add(hemCuff);

    // Cargo pocket if cargo pants
    if (item.id === 'cargo-01') {
      const cargoPocket = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.32, 0.18),
        fabricMaterial
      );
      cargoPocket.position.set(side * 0.44, 0.35, 0);
      cargoPocket.castShadow = true;
      group.add(cargoPocket);

      // Flap
      const cargoFlap = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.08, 0.19),
        fabricMaterial
      );
      cargoFlap.position.set(side * 0.44, 0.52, 0);
      group.add(cargoFlap);
    }
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

  // Swivel Group: hanger + garment body rotate together around vertical hook axis (x=0, z=0)
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
    case 'hoodie':
      garmentResult = createHoodieMesh(item, initialColorway);
      break;
    case 'jacket':
      garmentResult = createJacketMesh(item, initialColorway);
      break;
    case 'trousers':
      garmentResult = createTrousersMesh(item, initialColorway);
      break;
    case 'polo':
    case 'jersey':
    case 'tee':
    default:
      garmentResult = createTeeMesh(item, initialColorway);
      break;
  }

  swivelGroup.add(garmentResult.group);

  // 3. Soft Ambient Ground Contact Shadow Disc (elongated soft blurred ellipse like in photo)
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sCtx = shadowCanvas.getContext('2d');
  const grad = sCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.42)');
  grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.18)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  sCtx.fillStyle = grad;
  sCtx.fillRect(0, 0, 128, 128);

  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowGeo = new THREE.PlaneGeometry(2.2, 1.1);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.6,
    depthWrite: false
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.rotation.x = -Math.PI / 2;
  shadowMesh.position.set(0, -1.88, 0);
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
    // Vertical Swivel Rotation State & Physics
    rotationY: 0,
    targetRotationY: 0,
    rotationVelocityY: 0,
    isPresentationSpinning: false,
    spinProgress: 0,
    spinStartAngle: 0,
    updateColorway(newColorway) {
      this.currentColorway = newColorway;
      const newMap = createGarmentTexture(this.item, newColorway);
      this.material.map = newMap;
      this.material.sheenColor = new THREE.Color(newColorway.hex).clone().lerp(new THREE.Color(0xffffff), 0.3);
      this.material.needsUpdate = true;
    },
    triggerPresentationSpin() {
      this.isPresentationSpinning = true;
      this.spinProgress = 0;
      this.spinStartAngle = this.rotationY;
    }
  };
}

