import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';
import { collection } from './data.js';
import { createGarmentPiece } from './garments.js';
import { createStudioEnvironment, getGarmentPreviewImage } from './textures.js';
import { sound } from './sound.js';

/* ==========================================================================
   State & App Variables
   ========================================================================== */

const RACK_SPACING = 2.25;

const state = {
  mode: 'carousel', // 'carousel' | 'inspect'
  selectedIndex: 4, // "Faces Shirt" centered initially matching reference
  cart: [],
  selectedSize: 'M',
  isDragging: false,
  dragMode: null, // 'rotateGarment' | 'rack' | 'selectOrRack'
  dragTargetPiece: null,
  dragStartX: 0,
  dragStartY: 0,
  dragStartOffset: 0,
  dragVelocity: 0,
  lastPointerX: 0,
  lastPointerTime: 0,
  hoveredIndex: -1
};

// Subtle mouse parallax state ("can move slightly")
let mouseParallaxX = 0;
let mouseParallaxY = 0;
let targetParallaxX = 0;
let targetParallaxY = 0;

/* ==========================================================================
   Three.js Scene, Camera, Renderer Setup
   ========================================================================== */

const container = document.querySelector('#webgl-container');
const scene = new THREE.Scene();

// Eye-level camera with natural perspective for boutique clothes rack
const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 100);
const carouselCamPos = new THREE.Vector3(0, 1.35, 8.8);
const carouselCamLook = new THREE.Vector3(0, 1.25, 0);

camera.position.copy(carouselCamPos);
camera.lookAt(carouselCamLook);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
});
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.36;
container.appendChild(renderer.domElement);

// Procedural warm studio environment map
const studioEnvMap = createStudioEnvironment(renderer);
scene.environment = studioEnvMap;

// Orbit Controls (Active only in 3D Inspect Mode)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false;
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2.2;
controls.maxDistance = 6.0;
controls.minPolarAngle = Math.PI * 0.28;
controls.maxPolarAngle = Math.PI * 0.72;
controls.target.set(0, 1.25, 0);

/* ==========================================================================
   Studio Lighting
   ========================================================================== */

const ambientLight = new THREE.HemisphereLight(0xfffdfa, 0xdcd3c4, 1.4);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xfffbf2, 2.8);
keyLight.position.set(-4.5, 8.5, 7.5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -16;
keyLight.shadow.camera.right = 16;
keyLight.shadow.camera.top = 10;
keyLight.shadow.camera.bottom = -10;
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 30;
keyLight.shadow.bias = -0.00015;
keyLight.shadow.radius = 4;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xece3d5, 1.2);
fillLight.position.set(7, 3.5, 5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xfff4db, 1.3);
rimLight.position.set(0, 5, -6.5);
scene.add(rimLight);

const spotLight = new THREE.SpotLight(0xfff6eb, 2.8, 22, Math.PI / 5, 0.45, 1.2);
spotLight.position.set(0, 6.0, 5.0);
spotLight.castShadow = true;
spotLight.shadow.mapSize.set(1024, 1024);
spotLight.shadow.bias = -0.0001;
scene.add(spotLight);
scene.add(spotLight.target);

/* ==========================================================================
   Wardrobe Rail Architecture
   ========================================================================== */

const railGroup = new THREE.Group();
scene.add(railGroup);

const railMaterial = new THREE.MeshStandardMaterial({
  color: 0x222426,
  metalness: 0.88,
  roughness: 0.28,
  envMapIntensity: 1.15
});

const railMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(0.016, 0.016, 120, 24),
  railMaterial
);
railMesh.rotation.z = Math.PI / 2;
railMesh.position.set(0, 2.62, 0);
railMesh.castShadow = true;
railGroup.add(railMesh);

[-12, -4, 4, 12].forEach((bx) => {
  const bracket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.011, 0.011, 2.2, 16),
    railMaterial
  );
  bracket.position.set(bx, 3.72, 0);
  railGroup.add(bracket);
});

const floorGeo = new THREE.PlaneGeometry(160, 40);
const floorMat = new THREE.MeshStandardMaterial({
  color: 0xeae4d9,
  roughness: 0.96,
  metalness: 0.04
});
const floorMesh = new THREE.Mesh(floorGeo, floorMat);
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.position.y = -1.90;
floorMesh.receiveShadow = true;
scene.add(floorMesh);

/* ==========================================================================
   Garment Pieces & Rack Management
   ========================================================================== */

const rackContainer = new THREE.Group();
scene.add(rackContainer);

const pieces = collection.map((item, index) => {
  const piece = createGarmentPiece(item, index);
  rackContainer.add(piece.root);
  return piece;
});

let targetOffset = -state.selectedIndex * RACK_SPACING;
let currentOffset = targetOffset;
let previousOffset = currentOffset;
rackContainer.position.x = currentOffset;

/* ==========================================================================
   UI DOM Elements
   ========================================================================== */

const dockItemTitleEl = document.querySelector('#dock-item-title');
const dockItemPriceEl = document.querySelector('#dock-item-price');
const rotateLeftBtn = document.querySelector('#rotate-left-btn');
const rotateRightBtn = document.querySelector('#rotate-right-btn');
const rackPrevBtn = document.querySelector('#rack-prev-btn');
const rackNextBtn = document.querySelector('#rack-next-btn');
const viewPieceBtn = document.querySelector('#view-piece-btn');
const resetBtn = document.querySelector('#reset-btn');
const soundBtn = document.querySelector('#sound-btn');
const bagBtn = document.querySelector('#bag-btn');
const bagCountEl = document.querySelector('#bag-count');

// Detail Sheet Elements
const detailBackdrop = document.querySelector('#detail-backdrop');
const detailSheet = document.querySelector('#detail-sheet');
const sheetProductImg = document.querySelector('#sheet-product-img');
const sheetImgColorBadge = document.querySelector('#sheet-img-color-badge');
const sheetCloseBtn = document.querySelector('#sheet-close-btn');
const sheetBadgeEl = document.querySelector('#sheet-badge');
const sheetTitleEl = document.querySelector('#sheet-title');
const sheetPriceEl = document.querySelector('#sheet-price');
const sheetUsdPriceEl = document.querySelector('#sheet-usd-price');
const sheetDescEl = document.querySelector('#sheet-desc');
const sheetColorNameEl = document.querySelector('#sheet-color-name');
const sheetSwatchesEl = document.querySelector('#sheet-swatches');
const sheetSizesEl = document.querySelector('#sheet-sizes');
const sheetFabricEl = document.querySelector('#sheet-fabric');
const sheetWeightEl = document.querySelector('#sheet-weight');
const sheetFitEl = document.querySelector('#sheet-fit');
const sheetOriginEl = document.querySelector('#sheet-origin');
const sheetAddBagBtn = document.querySelector('#sheet-add-bag-btn');
const sheetBtnPriceEl = document.querySelector('#sheet-btn-price');
const sheetInspectBtn = document.querySelector('#sheet-inspect-btn');
const exitInspectBtn = document.querySelector('#exit-inspect-btn');

// Cart Drawer Elements
const bagDrawer = document.querySelector('#bag-drawer');
const drawerBackdrop = document.querySelector('#drawer-backdrop');
const closeBagBtn = document.querySelector('#close-bag-btn');
const cartItemsContainer = document.querySelector('#cart-items');
const cartItemCountEl = document.querySelector('#cart-item-count');
const cartSubtotalEl = document.querySelector('#cart-subtotal');
const checkoutBtn = document.querySelector('#checkout-btn');
const toastEl = document.querySelector('#toast');

/* ==========================================================================
   UI Updates & Synchronization
   ========================================================================== */

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('visible');
  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toastEl.classList.remove('visible');
  }, 2600);
}

function updateDockUI() {
  const currentItem = collection[state.selectedIndex];
  if (!currentItem) return;

  dockItemTitleEl.textContent = currentItem.name;
  dockItemPriceEl.textContent = currentItem.displayPrice || `₦${(currentItem.price * 1000).toLocaleString()}`;
}

function updateSheetProductImage(item, colorway) {
  if (sheetProductImg) {
    const imgDataUrl = getGarmentPreviewImage(item, colorway);
    sheetProductImg.src = imgDataUrl;
    sheetProductImg.alt = `${item.name} - ${colorway.name}`;
  }
  if (sheetImgColorBadge) {
    sheetImgColorBadge.textContent = colorway.name.toUpperCase();
  }
}

function showDetailSheet() {
  const currentItem = collection[state.selectedIndex];
  const currentPiece = pieces[state.selectedIndex];
  if (!currentItem || !currentPiece) return;

  sheetBadgeEl.textContent = `${currentItem.category.toUpperCase()} · ${currentItem.weight}`;
  sheetTitleEl.textContent = currentItem.name;
  sheetPriceEl.textContent = currentItem.displayPrice;
  sheetUsdPriceEl.textContent = `($${currentItem.price}.00 USD)`;
  sheetDescEl.textContent = currentItem.description;
  sheetColorNameEl.textContent = currentPiece.currentColorway.name;
  sheetFabricEl.textContent = currentItem.material;
  sheetWeightEl.textContent = currentItem.weight;
  sheetFitEl.textContent = currentItem.fit;
  sheetOriginEl.textContent = currentItem.origin;
  sheetBtnPriceEl.textContent = currentItem.displayPrice;

  // Render product reference image matching active colorway
  updateSheetProductImage(currentItem, currentPiece.currentColorway);

  sheetSwatchesEl.innerHTML = '';
  currentItem.colorways.forEach((cw) => {
    const dot = document.createElement('button');
    dot.className = `sheet-swatch-dot ${cw.name === currentPiece.currentColorway.name ? 'active' : ''}`;
    dot.style.backgroundColor = cw.hex;
    dot.title = cw.name;
    dot.addEventListener('click', () => {
      currentPiece.updateColorway(cw);
      sound.tapButton();
      updateSheetProductImage(currentItem, cw);
      sheetColorNameEl.textContent = cw.name;
      sheetSwatchesEl.querySelectorAll('.sheet-swatch-dot').forEach((sDot, sIdx) => {
        sDot.classList.toggle('active', currentItem.colorways[sIdx].name === cw.name);
      });
    });
    sheetSwatchesEl.appendChild(dot);
  });

  detailSheet.classList.add('visible');
  detailBackdrop.classList.add('visible');
  detailSheet.setAttribute('aria-hidden', 'false');
}

function hideDetailSheet() {
  detailSheet.classList.remove('visible');
  detailBackdrop.classList.remove('visible');
  detailSheet.setAttribute('aria-hidden', 'true');
}

function updateCartUI() {
  const totalCount = state.cart.reduce((sum, item) => sum + item.qty, 0);
  const totalSubtotal = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  bagCountEl.textContent = totalCount;
  cartItemCountEl.textContent = totalCount;
  cartSubtotalEl.textContent = `₦${(totalSubtotal * 1250).toLocaleString()}`;

  cartItemsContainer.innerHTML = '';
  if (state.cart.length === 0) {
    cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Your shopping cart is empty.</div>';
    return;
  }

  state.cart.forEach((cItem) => {
    const row = document.createElement('div');
    row.className = 'cart-item-row';
    row.innerHTML = `
      <div>
        <div class="cart-item-title">${cItem.name}</div>
        <div class="cart-item-sub">${cItem.colorway} · Size ${cItem.size} · Qty ${cItem.qty}</div>
      </div>
      <div class="cart-item-price">${cItem.displayPrice}</div>
    `;
    cartItemsContainer.appendChild(row);
  });
}

/* ==========================================================================
   Navigation & Selection Logic
   ========================================================================== */

function selectIndex(newIndex, playAudio = true) {
  const count = collection.length;
  state.selectedIndex = ((newIndex % count) + count) % count;
  targetOffset = -state.selectedIndex * RACK_SPACING;

  // Reset rotation of other garments smoothly back to facing front
  pieces.forEach((piece, idx) => {
    if (idx !== state.selectedIndex) {
      piece.resetRotation();
    }
  });

  if (playAudio) {
    sound.slideHanger(1.0);
    sound.snapFocus();
  }

  updateDockUI();
  if (detailSheet.classList.contains('visible')) {
    showDetailSheet();
  }
}

/* ==========================================================================
   Rotate Active Piece by Arrows ("rotate by arrows")
   ========================================================================== */

function rotateActivePiece(directionMultiplier) {
  const activePiece = pieces[state.selectedIndex];
  if (!activePiece) return;

  activePiece.is360Spinning = false;
  // Rotate smoothly by 45 degrees (PI / 4) per click
  activePiece.targetRotationY += directionMultiplier * (Math.PI / 4);
  sound.swivelHanger();
}

let arrowHoldTimer = null;
let arrowHoldInterval = null;

function setupArrowRotation(btn, direction) {
  const startRotate = (e) => {
    e.preventDefault();
    e.stopPropagation();
    rotateActivePiece(direction);

    // If held down, continuously spin 360 smoothly
    arrowHoldTimer = setTimeout(() => {
      arrowHoldInterval = setInterval(() => {
        const activePiece = pieces[state.selectedIndex];
        if (activePiece) {
          activePiece.targetRotationY += direction * 0.07;
        }
      }, 25);
    }, 280);
  };

  const stopRotate = () => {
    clearTimeout(arrowHoldTimer);
    clearInterval(arrowHoldInterval);
    arrowHoldTimer = null;
    arrowHoldInterval = null;
  };

  btn.addEventListener('pointerdown', startRotate);
  btn.addEventListener('pointerup', stopRotate);
  btn.addEventListener('pointerleave', stopRotate);
  btn.addEventListener('pointercancel', stopRotate);
}

setupArrowRotation(rotateLeftBtn, -1);
setupArrowRotation(rotateRightBtn, 1);

/* ==========================================================================
   Mode Switching: Carousel <-> 360° Orbit Inspector
   ========================================================================== */

function enterInspectMode() {
  state.mode = 'inspect';
  hideDetailSheet();
  document.body.classList.remove('mode-carousel');
  document.body.classList.add('mode-inspect');

  sound.whoosh();

  const selectedPiece = pieces[state.selectedIndex];
  const pieceWorldX = selectedPiece.root.position.x + currentOffset;

  controls.enabled = true;
  controls.target.set(pieceWorldX, 1.25, 0);
  camera.position.set(pieceWorldX, 1.35, 4.0);
}

function exitInspectMode() {
  state.mode = 'carousel';
  document.body.classList.remove('mode-inspect');
  document.body.classList.add('mode-carousel');

  controls.enabled = false;
  sound.whoosh();
}

/* ==========================================================================
   Raycasting & Pointer Interactions
   - Active centered piece can move slightly / tilt / rotate
   - Dragging outside moves the rack horizontally
   ========================================================================== */

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function getIntersectedPiece(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const candidateMeshes = [];
  pieces.forEach((piece) => {
    piece.garmentGroup.traverse((child) => {
      if (child.isMesh) {
        child.userData.piece = piece;
        candidateMeshes.push(child);
      }
    });
  });

  const intersects = raycaster.intersectObjects(candidateMeshes);
  if (intersects.length > 0) {
    return intersects[0].object.userData.piece;
  }
  return null;
}

// Pointer Down
renderer.domElement.addEventListener('pointerdown', (e) => {
  if (state.mode === 'inspect') return;

  const hitPiece = getIntersectedPiece(e);
  state.isDragging = true;
  state.dragStartX = e.clientX;
  state.dragStartY = e.clientY;
  state.lastPointerX = e.clientX;
  state.lastPointerTime = performance.now();
  state.dragVelocity = 0;
  state.dragStartOffset = targetOffset;

  if (hitPiece && hitPiece.index === state.selectedIndex) {
    // Pressed directly on the active piece: can move/rotate it slightly
    state.dragMode = 'rotateGarment';
    state.dragTargetPiece = hitPiece;
    hitPiece.is360Spinning = false;
  } else if (hitPiece && hitPiece.index !== state.selectedIndex) {
    // Clicked an off-center piece on the rail
    state.dragMode = 'selectOrRack';
    state.dragTargetPiece = hitPiece;
  } else {
    // Dragging background slides the rack
    state.dragMode = 'rack';
    state.dragTargetPiece = null;
  }

  renderer.domElement.setPointerCapture(e.pointerId);
});

// Pointer Move: Tracks parallax ("can move slightly") and drag
window.addEventListener('pointermove', (e) => {
  // Update mouse parallax coordinates
  const widthHalf = window.innerWidth / 2;
  const heightHalf = window.innerHeight / 2;
  targetParallaxX = (e.clientX - widthHalf) / widthHalf; // -1 to +1
  targetParallaxY = (e.clientY - heightHalf) / heightHalf; // -1 to +1

  if (state.mode === 'carousel') {
    if (state.isDragging) {
      const now = performance.now();
      const dt = Math.max(1, now - state.lastPointerTime);
      const deltaX = e.clientX - state.lastPointerX;

      state.dragVelocity = deltaX / dt;
      state.lastPointerX = e.clientX;
      state.lastPointerTime = now;

      if (state.dragMode === 'rotateGarment' && state.dragTargetPiece) {
        // Dragging garment moves/rotates it slightly or 360
        state.dragTargetPiece.is360Spinning = false;
        const spinDelta = deltaX * 0.018;
        state.dragTargetPiece.rotationVelocityY = spinDelta;
        state.dragTargetPiece.targetRotationY += spinDelta;
      } else {
        // Sliding the rack horizontally
        const travel = (e.clientX - state.dragStartX) * 0.0075;
        targetOffset = state.dragStartOffset + travel;
      }
    } else {
      // Hover feedback
      const hitPiece = getIntersectedPiece(e);
      if (hitPiece) {
        state.hoveredIndex = hitPiece.index;
        if (hitPiece.index === state.selectedIndex) {
          renderer.domElement.style.cursor = 'grab';
        } else {
          renderer.domElement.style.cursor = 'pointer';
        }
      } else {
        state.hoveredIndex = -1;
        renderer.domElement.style.cursor = 'default';
      }
    }
  }
});

// Pointer Up / Tap Handler
function finishDrag(e) {
  if (!state.isDragging) return;
  state.isDragging = false;

  const totalDist = Math.hypot(e.clientX - state.dragStartX, e.clientY - state.dragStartY);

  if (totalDist < 12) {
    if (state.dragTargetPiece) {
      const tappedPiece = state.dragTargetPiece;
      if (tappedPiece.index === state.selectedIndex) {
        // Tapping active garment gives a gentle slight turn (or opens details)
        rotateActivePiece(1);
        return;
      } else {
        // Clicking off-center garment centers it
        selectIndex(tappedPiece.index);
        return;
      }
    } else {
      hideDetailSheet();
    }
  }

  // Fling momentum for sliding rack
  if (state.dragMode === 'rack' || state.dragMode === 'selectOrRack') {
    const projectedOffset = targetOffset + state.dragVelocity * 180 * 0.0075;
    const nearestIndex = Math.round(-projectedOffset / RACK_SPACING);
    selectIndex(nearestIndex);
  }

  state.dragMode = null;
  state.dragTargetPiece = null;
}

window.addEventListener('pointerup', finishDrag);
window.addEventListener('pointercancel', finishDrag);

// Mouse Wheel Navigation across rack
window.addEventListener('wheel', (e) => {
  if (state.mode === 'inspect') return;
  if (Math.abs(e.deltaY) > 20 || Math.abs(e.deltaX) > 20) {
    const dir = (e.deltaY + e.deltaX) > 0 ? 1 : -1;
    selectIndex(state.selectedIndex + dir);
  }
}, { passive: true });

/* ==========================================================================
   DOM Event Listeners
   ========================================================================== */

// Stage edge chevrons to glide between garments
rackPrevBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  selectIndex(state.selectedIndex - 1);
});

rackNextBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  selectIndex(state.selectedIndex + 1);
});

viewPieceBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  sound.snapFocus();
  showDetailSheet();
});

sheetCloseBtn.addEventListener('click', hideDetailSheet);
detailBackdrop.addEventListener('click', hideDetailSheet);

resetBtn.addEventListener('click', () => {
  selectIndex(4);
  showToast("RESET TO FACES SHIRT");
});

document.querySelector('.hanging-sign').addEventListener('click', () => {
  selectIndex(4);
});

sheetSizesEl.querySelectorAll('.size-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    sheetSizesEl.querySelectorAll('.size-chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    state.selectedSize = chip.dataset.size;
    sound.tapButton();
  });
});

sheetAddBagBtn.addEventListener('click', () => {
  const item = collection[state.selectedIndex];
  const piece = pieces[state.selectedIndex];
  sound.snapFocus();

  const existing = state.cart.find(
    (c) => c.id === item.id && c.colorway === piece.currentColorway.name && c.size === state.selectedSize
  );

  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      displayPrice: item.displayPrice,
      colorway: piece.currentColorway.name,
      size: state.selectedSize,
      qty: 1
    });
  }

  updateCartUI();
  showToast(`ADDED "${item.name}" (SIZE ${state.selectedSize}) TO CART`);
});

sheetInspectBtn.addEventListener('click', enterInspectMode);
exitInspectBtn.addEventListener('click', exitInspectMode);

bagBtn.addEventListener('click', () => {
  bagDrawer.classList.add('open');
  drawerBackdrop.classList.add('visible');
  sound.tapButton();
});

const closeBag = () => {
  bagDrawer.classList.remove('open');
  drawerBackdrop.classList.remove('visible');
};
closeBagBtn.addEventListener('click', closeBag);
drawerBackdrop.addEventListener('click', closeBag);

checkoutBtn.addEventListener('click', () => {
  if (state.cart.length === 0) {
    showToast('YOUR CART IS EMPTY');
    return;
  }
  sound.snapFocus();
  showToast('PROCEEDING TO CHECKOUT...');
});

soundBtn.addEventListener('click', () => {
  const isMuted = sound.toggleMute();
  soundBtn.classList.toggle('muted', isMuted);
  showToast(isMuted ? 'AUDIO MUTED' : 'AUDIO ACTIVE');
});

// Keyboard Navigation: Left/Right arrows rotate the piece ("rotate by arrows")!
window.addEventListener('keydown', (e) => {
  if (bagDrawer.classList.contains('open')) {
    if (e.key === 'Escape') closeBag();
    return;
  }

  if (detailSheet.classList.contains('visible')) {
    if (e.key === 'Escape') hideDetailSheet();
    return;
  }

  if (state.mode === 'inspect') {
    if (e.key === 'Escape') exitInspectMode();
    return;
  }

  if (e.key === 'ArrowLeft') {
    // Rotate left with arrow key
    rotateActivePiece(-1);
  } else if (e.key === 'ArrowRight') {
    // Rotate right with arrow key
    rotateActivePiece(1);
  } else if (e.key === 'a' || e.key === 'A') {
    // Rack previous
    selectIndex(state.selectedIndex - 1);
  } else if (e.key === 'd' || e.key === 'D') {
    // Rack next
    selectIndex(state.selectedIndex + 1);
  } else if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    showDetailSheet();
  }
});

function onResize() {
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
window.addEventListener('resize', onResize);

/* ==========================================================================
   Animation Loop & Physics
   - "can move slightly": active piece subtly sways and tilts with mouse parallax
   - "rotate by arrows": active piece smoothly rotates when arrow buttons are clicked
   ========================================================================== */

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.getElapsedTime();

  // Smooth rack offset spring lerp
  previousOffset = currentOffset;
  currentOffset += (targetOffset - currentOffset) * 0.11;
  rackContainer.position.x = currentOffset;

  const rackDelta = currentOffset - previousOffset;

  // Smooth mouse parallax lerp ("can move slightly")
  mouseParallaxX += (targetParallaxX - mouseParallaxX) * 0.06;
  mouseParallaxY += (targetParallaxY - mouseParallaxY) * 0.06;

  // Spotlight smoothly tracks active piece
  const activePiece = pieces[state.selectedIndex];
  if (activePiece) {
    const activeWorldX = activePiece.root.position.x + currentOffset;
    spotLight.target.position.set(activeWorldX, 1.3, 0);
    spotLight.position.x = THREE.MathUtils.lerp(spotLight.position.x, activeWorldX * 0.45, 0.08);
  }

  pieces.forEach((piece, index) => {
    const isSelected = index === state.selectedIndex;
    const isHovered = index === state.hoveredIndex;

    // 1. Natural pendulum cloth sway when sliding on rail
    piece.swingVelocity += -rackDelta * 0.45;
    piece.swingVelocity += -piece.swingAngle * 14.0 * dt;
    piece.swingVelocity *= Math.pow(0.82, dt * 60);
    piece.swingAngle += piece.swingVelocity * dt;

    // 2. Active piece: responds slightly to mouse parallax ("can move slightly")
    let parallaxY = 0;
    let parallaxX = 0;
    let parallaxZ = 0;

    if (isSelected && state.mode === 'carousel') {
      parallaxY = mouseParallaxX * 0.16; // moves slightly in Y rotation (about 9 degrees)
      parallaxZ = -mouseParallaxX * 0.035; // moves slightly in Z tilt
      parallaxX = mouseParallaxY * 0.06; // moves slightly in pitch
    }

    piece.garmentGroup.rotation.z = piece.swingAngle + parallaxZ;
    piece.garmentGroup.rotation.x = parallaxX;

    // 3. Arrow Rotation & Drag Rotation Physics
    if (state.isDragging && state.dragMode === 'rotateGarment' && isSelected) {
      piece.targetRotationY += piece.rotationVelocityY;
      piece.rotationVelocityY *= Math.pow(0.88, dt * 60);
    } else if (!isSelected) {
      // Off-center pieces always smoothly face forward
      piece.targetRotationY = 0;
      piece.rotationVelocityY = 0;
    }

    piece.rotationY += (piece.targetRotationY - piece.rotationY) * 0.14;
    // Combine base rotation + slight parallax movement
    piece.swivelGroup.rotation.y = piece.rotationY + parallaxY;

    if (state.mode === 'carousel') {
      const breathing = Math.sin(elapsed * 1.3 + index * 0.8) * 0.006;
      piece.garmentGroup.position.y = breathing + (isHovered ? 0.05 : 0);

      const targetScale = isSelected ? 1.05 : 0.90;
      piece.root.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

      const distFromCenter = Math.abs(index - state.selectedIndex);
      piece.root.visible = distFromCenter <= 5;
    } else {
      if (isSelected) {
        piece.root.scale.lerp(new THREE.Vector3(1.15, 1.15, 1.15), 0.08);
        piece.root.visible = true;
      } else {
        piece.root.visible = false;
      }
    }
  });

  if (state.mode === 'inspect') {
    controls.update();
  } else {
    camera.position.lerp(carouselCamPos, 0.08);
    camera.lookAt(carouselCamLook);
  }

  renderer.render(scene, camera);
}

// Initial bootstrap
updateDockUI();
updateCartUI();
animate();
