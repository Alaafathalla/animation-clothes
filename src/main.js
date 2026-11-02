import * as THREE from 'three';
import './style.css';

const items = [
  { name: 'Midnight Tee', type: 'shirt', color: '#292d2b', accent: '#dedad0', price: 32, material: 'Heavyweight organic cotton', detail: 'A clean, relaxed silhouette made for everyday wear.' },
  { name: 'Tailored Trousers', type: 'pants', color: '#3f4642', accent: '#8a8c82', price: 64, material: 'Soft brushed twill', detail: 'Easy straight-leg trousers with an understated finish.' },
  { name: 'Cloud Nine Shirt', type: 'shirt', color: '#cde7e4', accent: '#3d6c80', price: 46, material: 'Lightweight cotton', detail: 'A breezy shirt for brighter days.' },
  { name: 'Stone Oversized Tee', type: 'shirt', color: '#a49b8b', accent: '#f0e9d9', price: 38, material: 'Washed cotton jersey', detail: 'Naturally relaxed, soft, and easy to style.' },
  { name: 'Matchday Jersey', type: 'jersey', color: '#f0f0e8', accent: '#1f3229', price: 48, material: 'Breathable cotton blend', detail: 'A nostalgic football-inspired top with bold trim.' },
  { name: 'Studio Pleated Pants', type: 'pants', color: '#a2a097', accent: '#e6e0d5', price: 72, material: 'Structured cotton twill', detail: 'Clean lines and a flowing drape.' },
  { name: 'Navy Club Shirt', type: 'shirt', color: '#293e57', accent: '#efebdf', price: 44, material: 'Premium cotton', detail: 'Low-key color, elevated details.' },
  { name: 'Black Knit Polo', type: 'shirt', color: '#252729', accent: '#b9b8a5', price: 58, material: 'Soft knit cotton', detail: 'A vintage-inspired essential with timeless appeal.' },
  { name: 'Charcoal Everyday Tee', type: 'shirt', color: '#59615f', accent: '#c5c4b7', price: 36, material: 'Heavyweight washed cotton', detail: 'Your new favorite everyday layer.' },
];

const root = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.7;
root.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-6, 6, 3.5, -3.5, 0.1, 100);
camera.position.set(0, 1.3, 15);
camera.lookAt(0, 1.05, 0);

scene.add(new THREE.HemisphereLight('#ffffff', '#d2ccc2', 3));
const key = new THREE.DirectionalLight('#ffffff', 3.1);
key.position.set(-4, 9, 8);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -20;
key.shadow.camera.right = 20;
key.shadow.camera.top = 14;
key.shadow.camera.bottom = -14;
key.shadow.bias = -0.0002;
key.shadow.radius = 5;
scene.add(key);
const fill = new THREE.DirectionalLight('#d3e0ff', 0.75);
fill.position.set(8, 4, 5);
scene.add(fill);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 30), new THREE.MeshStandardMaterial({ color: '#e8e5de', roughness: 1 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.8;
floor.receiveShadow = true;
scene.add(floor);

function line(points, color, radius = 0.018, tubularSegments = 24) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  return new THREE.Mesh(new THREE.TubeGeometry(curve, tubularSegments, radius, 7, false), new THREE.MeshStandardMaterial({ color, metalness: 0.67, roughness: 0.25 }));
}

const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 200, 12), new THREE.MeshStandardMaterial({ color: '#4f5653', metalness: 0.8, roughness: 0.28 }));
rail.rotation.z = Math.PI / 2;
rail.position.set(0, 2.62, -0.13);
scene.add(rail);

function createGarmentShape(type) {
  const s = new THREE.Shape();
  if (type === 'pants') {
    s.moveTo(-0.52, 0.65); s.lineTo(0.52, 0.65);
    s.lineTo(0.48, 0.05); s.lineTo(0.63, -1.55); s.lineTo(0.13, -1.55);
    s.lineTo(0.02, -0.35); s.lineTo(-0.07, -0.35); s.lineTo(-0.16, -1.55);
    s.lineTo(-0.66, -1.55); s.lineTo(-0.49, 0.05); s.closePath();
  } else {
    s.moveTo(-0.39, 0.82); s.lineTo(-0.21, 0.86); s.quadraticCurveTo(0, 0.65, 0.21, 0.86);
    s.lineTo(0.39, 0.82); s.lineTo(0.79, 0.56); s.lineTo(1.04, 0.02);
    s.lineTo(0.65, -0.18); s.lineTo(0.49, 0.1); s.lineTo(0.49, -1.35);
    s.quadraticCurveTo(0, -1.42, -0.49, -1.35); s.lineTo(-0.49, 0.1);
    s.lineTo(-0.65, -0.18); s.lineTo(-1.04, 0.02); s.lineTo(-0.79, 0.56); s.closePath();
  }
  return s;
}

function fabricTexture(item) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const c = canvas.getContext('2d');
  c.fillStyle = item.color; c.fillRect(0, 0, 512, 512);
  const rnd = (n) => Math.abs(Math.sin(n * 123.45) * 10000) % 1;
  for (let i = 0; i < 2800; i++) {
    const x = rnd(i + 1) * 512, y = rnd(i + 700) * 512;
    c.fillStyle = i % 2 ? '#ffffff09' : '#00000008';
    c.fillRect(x, y, 1.5, 4);
  }
  if (item.type === 'jersey') {
    c.fillStyle = item.accent;
    c.fillRect(60, 87, 40, 370); c.fillRect(410, 87, 40, 370);
    c.fillRect(210, 145, 92, 10);
    c.font = 'bold 30px Arial'; c.textAlign = 'center'; c.fillText('CLUB  /  26', 256, 240);
    c.font = 'bold 48px Arial'; c.fillText('MATCHDAY', 256, 296);
  } else if (item.type === 'shirt') {
    c.fillStyle = item.accent;
    c.font = 'bold 28px Arial'; c.textAlign = 'center';
    c.fillText(item.name === 'Navy Club Shirt' ? 'ATHLETIC CLUB' : 'R / C', 256, 230);
    c.fillRect(232, 245, 48, 2);
  } else {
    c.strokeStyle = '#00000020'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(190, 10); c.lineTo(220, 510); c.moveTo(320, 10); c.lineTo(292, 510); c.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createPiece(item, index) {
  const group = new THREE.Group();
  const center = new THREE.Group();
  group.add(center);
  const hanger = line([[0, 2.64, 0], [0.07, 2.65, 0], [0.13, 2.56, 0], [0.07, 2.49, 0], [-0.63, 2.18, 0], [0, 2.15, 0], [0.63, 2.18, 0], [0.07, 2.49, 0]], '#8d7354', 0.014);
  center.add(hanger);
  const geometry = new THREE.ExtrudeGeometry(createGarmentShape(item.type), { depth: 0.065, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.02, bevelSegments: 2, steps: 1, curveSegments: 12 });
  geometry.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ color: '#ffffff', map: fabricTexture(item), roughness: 0.94, metalness: 0, side: THREE.DoubleSide });
  const garment = new THREE.Mesh(geometry, material);
  garment.position.set(0, item.type === 'pants' ? 1.38 : 1.24, 0.075);
  garment.castShadow = true;
  garment.receiveShadow = true;
  center.add(garment);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 35), new THREE.LineBasicMaterial({ color: '#333333', transparent: true, opacity: 0.045 }));
  edge.position.copy(garment.position); center.add(edge);
  group.position.x = index * 2.05;
  scene.add(group);
  return { group, center };
}
const pieces = items.map(createPiece);
let selected = 4;
let targetOffset = -selected * 2.05;
let currentOffset = targetOffset;
const groupWrap = new THREE.Group();
for (const piece of pieces) { scene.remove(piece.group); groupWrap.add(piece.group); }
scene.add(groupWrap);

const nameEl = document.querySelector('#product-name');
const detailEl = document.querySelector('#product-detail');
const counterEl = document.querySelector('#counter');
const dialog = document.querySelector('#product-dialog');
function renderDetails() {
  const item = items[selected];
  nameEl.textContent = item.name;
  detailEl.textContent = `${item.material} · $${item.price}`;
  counterEl.textContent = `${String(selected + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
}
function select(index) {
  selected = (index + items.length) % items.length;
  targetOffset = -selected * 2.05;
  renderDetails();
}
document.querySelector('#prev').addEventListener('click', () => select(selected - 1));
document.querySelector('#next').addEventListener('click', () => select(selected + 1));
document.querySelector('#view').addEventListener('click', () => {
  const item = items[selected];
  document.querySelector('#dialog-name').textContent = item.name;
  document.querySelector('#dialog-description').textContent = item.detail + ' Fabric: ' + item.material + '.';
  document.querySelector('#dialog-price').textContent = `$${item.price}.00`;
  dialog.showModal();
});
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
document.querySelector('#dialog-cta').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
document.querySelector('#info-button').addEventListener('click', () => {
  const toast = document.querySelector('#toast');
  toast.textContent = 'Click arrows, drag the rack, or use keyboard ← → to browse.';
  toast.classList.add('visible');
  clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => toast.classList.remove('visible'), 3400);
});
window.addEventListener('keydown', (event) => {
  if (dialog.open) return;
  if (event.key === 'ArrowLeft') select(selected - 1);
  if (event.key === 'ArrowRight') select(selected + 1);
});
let pointerX = null;
renderer.domElement.addEventListener('pointerdown', event => { pointerX = event.clientX; renderer.domElement.setPointerCapture(event.pointerId); });
renderer.domElement.addEventListener('pointerup', event => {
  if (pointerX === null) return;
  const delta = event.clientX - pointerX;
  if (Math.abs(delta) > 30) select(selected + (delta < 0 ? 1 : -1));
  pointerX = null;
});
renderer.domElement.addEventListener('pointercancel', () => { pointerX = null; });

function resize() {
  const width = root.clientWidth;
  const height = root.clientHeight;
  const aspect = width / Math.max(height, 1);
  const visibleHeight = aspect < 0.85 ? 8.6 : aspect < 1.45 ? 7.1 : 6.3;
  camera.left = -visibleHeight * aspect / 2;
  camera.right = visibleHeight * aspect / 2;
  camera.top = visibleHeight / 2;
  camera.bottom = -visibleHeight / 2;
  camera.position.y = aspect < 0.85 ? 1.55 : 1.25;
  camera.lookAt(0, aspect < 0.85 ? 0.85 : 1.05, 0);
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
window.addEventListener('resize', resize);
resize();
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  currentOffset += (targetOffset - currentOffset) * 0.095;
  groupWrap.position.x = currentOffset;
  pieces.forEach(({ center }, index) => {
    const active = index === selected;
    const targetScale = active ? 1.08 : 0.86;
    center.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.09);
    center.rotation.y += ((active ? 0 : Math.max(-0.13, Math.min(0.13, (index - selected) * -0.035))) - center.rotation.y) * 0.08;
    center.rotation.z = Math.sin(elapsed * 0.85 + index * 0.7) * 0.007;
    center.position.y = Math.sin(elapsed * 1.1 + index * 0.5) * 0.012;
  });
  renderer.render(scene, camera);
}
renderDetails();
animate();
