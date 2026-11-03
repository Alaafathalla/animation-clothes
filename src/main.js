import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';
import { collection } from './data.js';
import { createGarmentPiece } from './garments.js';
import { createStudioEnvironment } from './textures.js';
import { sound } from './sound.js';

/* ==========================================================================
   State & App Variables
   ========================================================================== */

const state = {
  mode: 'carousel', // 'carousel' | 'inspect'
  selectedIndex: 0,
  activeCategory: 'all',
  filteredIndices: collection.map((_, i) => i),
  cart: [],
  selectedSize: 'M',
  isDragging: false,
  dragMode: null, // 'spin' | 'rack'
  dragTargetPiece: null,
  dragStartX: 0,
  dragStartY: 0,
  dragStartOffset: 0,
  dragVelocity: 0,
  lastPointerX: 0,
  lastPointerTime: 0,
  hoveredIndex: -1,
  isFloatingCardOpen: false
};

const RACK_SPACING = 2.25;

/* ==========================================================================
   Three.js Scene, Camera, Renderer Setup
   ========================================================================== */

const container = document.querySelector('#webgl-container');
const scene = new THREE.Scene();

// Camera setup with perspective suited for fashion editorial showcasing
const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 100);
const carouselCamPos = new THREE.Vector3(0, 1.35, 9.6);
const carouselCamLook = new THREE.Vector3(0, 1.15, 0);

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
renderer.toneMappingExposure = 1.38;
container.appendChild(renderer.domElement);

// Procedural Studio Environment for realistic soft reflections on metals & fabrics
const studioEnvMap = createStudioEnvironment(renderer);
scene.environment = studioEnvMap;

// Orbit Controls for 360° Inspector Mode
const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false;
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2.4;
controls.maxDistance = 6.8;
controls.minPolarAngle = Math.PI * 0.28;
controls.maxPolarAngle = Math.PI * 0.72;
controls.target.set(0, 1.25, 0);

/* ==========================================================================
   Studio Lighting
   ========================================================================== */

// Soft ambient bounce matching warm boutique aesthetic
const ambientLight = new THREE.HemisphereLight(0xfffdfa, 0xdcd3c4, 1.35);
scene.add(ambientLight);

// Key Directional Light (Soft architectural key shadow)
const keyLight = new THREE.DirectionalLight(0xfffbf2, 2.6);
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

// Warm Fill Light
const fillLight = new THREE.DirectionalLight(0xece3d5, 1.15);
fillLight.position.set(7, 3.5, 5);
scene.add(fillLight);

// Kicker / Rim Backlight (Accentuates shoulder contours and cloth sheen)
const rimLight = new THREE.DirectionalLight(0xfff4db, 1.2);
rimLight.position.set(0, 5, -6.5);
scene.add(rimLight);

// Dynamic Gallery Spotlight that tracks the active piece
const spotLight = new THREE.SpotLight(0xfff6eb, 2.8, 20, Math.PI / 5, 0.45, 1.2);
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

// Sleek dark gunmetal steel wardrobe rail as in reference
const railMaterial = new THREE.MeshStandardMaterial({
  color: 0x222426,
  metalness: 0.85,
  roughness: 0.3,
  envMapIntensity: 1.1
});

const railMesh = new THREE.Mesh(
  new THREE.CylinderGeometry(0.016, 0.016, 120, 24),
  railMaterial
);
railMesh.rotation.z = Math.PI / 2;
railMesh.position.set(0, 2.62, 0);
railMesh.castShadow = true;
railGroup.add(railMesh);

// Minimalist Wall/Ceiling Drop Brackets along the rail
[-12, -4, 4, 12].forEach((bx) => {
  const bracket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 2.2, 16),
    railMaterial
  );
  bracket.position.set(bx, 3.72, 0);
  railGroup.add(bracket);
});

// Warm boutique studio floor matching reference photo
const floorGeo = new THREE.PlaneGeometry(160, 40);
const floorMat = new THREE.MeshStandardMaterial({
  color: 0xeae4d9,
  roughness: 0.96,
  metalness: 0.04
});
const floorMesh = new THREE.Mesh(floorGeo, floorMat);
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.position.y = -1.9;
floorMesh.receiveShadow = true;
scene.add(floorMesh);

/* ==========================================================================
   Garment Pieces Creation & Rack Management
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

/* ==========================================================================
   UI DOM Elements
   ========================================================================== */

const itemIndexEl = document.querySelector('#item-index');
const itemBadgeEl = document.querySelector('#item-badge');
const itemTitleEl = document.querySelector('#item-title');
const itemTaglineEl = document.querySelector('#item-tagline');
const itemPriceEl = document.querySelector('#item-price');
const swatchesPreviewEl = document.querySelector('#swatches-preview');
const scrubberFillEl = document.querySelector('#scrubber-fill');
const scrubberHandleEl = document.querySelector('#scrubber-handle');
const scrubberTrackEl = document.querySelector('#scrubber-track');

// Floating 3D Info Card Elements
const floatingCardEl = document.querySelector('#floating-info-card');
const cardBadgeEl = document.querySelector('#card-badge');
const cardCloseBtn = document.querySelector('#card-close-btn');
const cardTitleEl = document.querySelector('#card-title');
const cardPriceEl = document.querySelector('#card-price');
const cardOriginEl = document.querySelector('#card-origin');
const cardDescEl = document.querySelector('#card-desc');
const cardActiveColorEl = document.querySelector('#card-active-color');
const cardSwatchesRowEl = document.querySelector('#card-swatches-row');
const cardSpinBtn = document.querySelector('#card-spin-btn');
const cardInspectBtn = document.querySelector('#card-inspect-btn');
const cardAddBagBtn = document.querySelector('#card-add-bag-btn');
const cardBtnPriceEl = document.querySelector('#card-btn-price');
const connectorLine = document.querySelector('#connector-line');
const connectorAnchor = document.querySelector('#connector-anchor');

// Inspector DOM elements
const inspKickerEl = document.querySelector('#insp-kicker');
const inspTitleEl = document.querySelector('#insp-title');
const inspPriceEl = document.querySelector('#insp-price');
const inspDescEl = document.querySelector('#insp-description');
const inspFabricEl = document.querySelector('#insp-fabric');
const inspWeightEl = document.querySelector('#insp-weight');
const inspFitEl = document.querySelector('#insp-fit');
const inspOriginEl = document.querySelector('#insp-origin');
const ctaPriceEl = document.querySelector('#cta-price');
const colorwayListEl = document.querySelector('#colorway-list');
const activeColorwayNameEl = document.querySelector('#active-colorway-name');
const sizeChipsContainer = document.querySelector('#size-chips');
const hotspotsLayerEl = document.querySelector('#hotspots-layer');

// Header & Utility elements
const soundBtn = document.querySelector('#sound-btn');
const helpBtn = document.querySelector('#help-btn');
const bagBtn = document.querySelector('#bag-btn');
const bagCountEl = document.querySelector('#bag-count');
const bagDrawer = document.querySelector('#bag-drawer');
const drawerBackdrop = document.querySelector('#drawer-backdrop');
const closeBagBtn = document.querySelector('#close-bag-btn');
const cartItemsContainer = document.querySelector('#cart-items');
const cartItemCountEl = document.querySelector('#cart-item-count');
const cartSubtotalEl = document.querySelector('#cart-subtotal');
const checkoutBtn = document.querySelector('#checkout-btn');
const helpDialog = document.querySelector('#help-dialog');
const closeHelpBtn = document.querySelector('#close-help-btn');
const gotItBtn = document.querySelector('#got-it-btn');
const toastEl = document.querySelector('#toast');
const exitInspectBtn = document.querySelector('#exit-inspect-btn');
const closeInspBtn = document.querySelector('#close-insp-btn');
const inspectBtn = document.querySelector('#inspect-btn');
const addToBagBtn = document.querySelector('#add-to-bag-btn');
const prevBtn = document.querySelector('#prev-btn');
const nextBtn = document.querySelector('#next-btn');

/* ==========================================================================
   UI Updates & Synchronization
   ========================================================================== */

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('visible');
  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toastEl.classList.remove('visible');
  }, 2800);
}

function updateCarouselUI() {
  const currentItem = collection[state.selectedIndex];
  if (!currentItem) return;

  const currentFilteredPos = state.filteredIndices.indexOf(state.selectedIndex);
  const total = state.filteredIndices.length;

  itemIndexEl.textContent = `${String(currentFilteredPos + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  itemBadgeEl.textContent = currentItem.category.toUpperCase();
  itemTitleEl.textContent = currentItem.name;
  itemTaglineEl.textContent = currentItem.tagline;
  itemPriceEl.textContent = `$${currentItem.price}`;

  // Swatches preview
  swatchesPreviewEl.innerHTML = '';
  const currentPiece = pieces[state.selectedIndex];
  currentItem.colorways.forEach((cw) => {
    const dot = document.createElement('div');
    dot.className = `swatch-dot ${cw.name === currentPiece.currentColorway.name ? 'active' : ''}`;
    dot.style.backgroundColor = cw.hex;
    dot.title = cw.name;
    swatchesPreviewEl.appendChild(dot);
  });

  // Scrubber percentage
  const pct = total > 1 ? (currentFilteredPos / (total - 1)) * 100 : 50;
  scrubberFillEl.style.width = `${pct}%`;
  scrubberHandleEl.style.left = `${pct}%`;
}

/* ==========================================================================
   Floating 3D Info Card Management
   ========================================================================== */

function showFloatingInfoCard(piece) {
  state.isFloatingCardOpen = true;
  const item = piece.item;

  cardBadgeEl.textContent = `${item.category.toUpperCase()} // ${item.weight}`;
  cardTitleEl.textContent = item.name;
  cardPriceEl.textContent = `$${item.price}.00`;
  cardOriginEl.textContent = item.origin.toUpperCase();
  cardDescEl.textContent = item.description;
  cardActiveColorEl.textContent = piece.currentColorway.name;
  cardBtnPriceEl.textContent = `$${item.price}`;

  // Build swatches
  cardSwatchesRowEl.innerHTML = '';
  item.colorways.forEach((cw) => {
    const dot = document.createElement('button');
    dot.className = `card-swatch-dot ${cw.name === piece.currentColorway.name ? 'active' : ''}`;
    dot.style.backgroundColor = cw.hex;
    dot.title = cw.name;
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      piece.updateColorway(cw);
      sound.tapButton();
      showFloatingInfoCard(piece);
      updateCarouselUI();
    });
    cardSwatchesRowEl.appendChild(dot);
  });

  floatingCardEl.classList.add('visible');
  floatingCardEl.setAttribute('aria-hidden', 'false');
}

function hideFloatingInfoCard() {
  state.isFloatingCardOpen = false;
  floatingCardEl.classList.remove('visible');
  floatingCardEl.setAttribute('aria-hidden', 'true');
}

cardCloseBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  hideFloatingInfoCard();
  sound.tapButton();
});

cardSpinBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  const currentPiece = pieces[state.selectedIndex];
  if (currentPiece) {
    currentPiece.triggerPresentationSpin();
    sound.swivelHanger();
  }
});

cardInspectBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  enterInspectMode();
});

cardAddBagBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  addToBagBtn.click();
});

function updateInspectorUI() {
  const item = collection[state.selectedIndex];
  const piece = pieces[state.selectedIndex];
  if (!item || !piece) return;

  inspKickerEl.textContent = `${item.origin.toUpperCase()} · ${item.weight}`;
  inspTitleEl.textContent = item.name;
  inspPriceEl.textContent = `$${item.price}.00`;
  inspDescEl.textContent = item.description;
  inspFabricEl.textContent = item.material;
  inspWeightEl.textContent = item.weight;
  inspFitEl.textContent = item.fit;
  inspOriginEl.textContent = item.origin;
  ctaPriceEl.textContent = `$${item.price}`;
  activeColorwayNameEl.textContent = piece.currentColorway.name;

  // Build colorway pill selector
  colorwayListEl.innerHTML = '';
  item.colorways.forEach((cw) => {
    const pill = document.createElement('button');
    pill.className = `colorway-pill ${cw.name === piece.currentColorway.name ? 'active' : ''}`;
    pill.innerHTML = `<span class="color-dot" style="background-color: ${cw.hex}"></span><span>${cw.name}</span>`;
    pill.addEventListener('click', () => {
      piece.updateColorway(cw);
      sound.tapButton();
      updateInspectorUI();
      updateCarouselUI();
      if (state.isFloatingCardOpen) {
        showFloatingInfoCard(piece);
      }
    });
    colorwayListEl.appendChild(pill);
  });

  // Rebuild 3D Hotspot pins
  hotspotsLayerEl.innerHTML = '';
  if (item.hotspots) {
    item.hotspots.forEach((hs, idx) => {
      const pin = document.createElement('div');
      pin.className = 'hotspot-pin';
      pin.dataset.index = idx;
      pin.innerHTML = `
        <div class="hotspot-pulse"></div>
        <div class="hotspot-circle"></div>
        <div class="hotspot-tooltip">
          <strong>${hs.title}</strong>
          <p>${hs.text}</p>
        </div>
      `;
      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        sound.snapFocus();
        pin.classList.toggle('active');
      });
      hotspotsLayerEl.appendChild(pin);
    });
  }
}

function updateCartUI() {
  const totalCount = state.cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  bagCountEl.textContent = totalCount;
  cartItemCountEl.textContent = totalCount;
  cartSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;

  cartItemsContainer.innerHTML = '';
  if (state.cart.length === 0) {
    cartItemsContainer.innerHTML = '<div class="empty-cart-msg">Your collection bag is empty.</div>';
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
      <div class="cart-item-price">$${cItem.price * cItem.qty}</div>
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

  if (playAudio) {
    sound.slideHanger(1.1);
    sound.snapFocus();
  }

  updateCarouselUI();
  if (state.mode === 'inspect') {
    updateInspectorUI();
  }
}

function selectCategory(category) {
  state.activeCategory = category;
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.category === category);
  });

  if (category === 'all') {
    state.filteredIndices = collection.map((_, i) => i);
  } else {
    state.filteredIndices = collection
      .map((item, idx) => (item.category === category ? idx : -1))
      .filter((idx) => idx !== -1);
  }

  const categoryLabel = document.querySelector('#stamp-category');
  if (categoryLabel) {
    categoryLabel.textContent = category.toUpperCase() + ` (${state.filteredIndices.length})`;
  }

  // Jump to first item in this category if active item is outside
  if (!state.filteredIndices.includes(state.selectedIndex) && state.filteredIndices.length > 0) {
    selectIndex(state.filteredIndices[0]);
  } else {
    updateCarouselUI();
  }
}

/* ==========================================================================
   Mode Switching: Carousel <-> 360° Inspector
   ========================================================================== */

function enterInspectMode() {
  state.mode = 'inspect';
  hideFloatingInfoCard();
  document.body.classList.remove('mode-carousel');
  document.body.classList.add('mode-inspect');

  sound.whoosh();
  updateInspectorUI();

  // Position camera focused directly in front of the selected garment
  const selectedPiece = pieces[state.selectedIndex];
  const pieceWorldX = selectedPiece.root.position.x + currentOffset;

  controls.enabled = true;
  controls.target.set(pieceWorldX, 1.25, 0);
  camera.position.set(pieceWorldX, 1.35, 4.2);
}

function exitInspectMode() {
  state.mode = 'carousel';
  document.body.classList.remove('mode-inspect');
  document.body.classList.add('mode-carousel');

  controls.enabled = false;
  sound.whoosh();
}

/* ==========================================================================
   Raycasting & Touch/Pointer Interactions
   ========================================================================== */

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function getIntersectedPiece(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Test intersection against garments in rack
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

// Touch / Pointer Down on WebGL Canvas
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

  if (hitPiece) {
    // Touch directly on garment: enable spin mode
    state.dragMode = 'spin';
    state.dragTargetPiece = hitPiece;
  } else {
    // Touch on background: slide wardrobe rack
    state.dragMode = 'rack';
    state.dragTargetPiece = null;
  }

  renderer.domElement.setPointerCapture(e.pointerId);
});

window.addEventListener('pointermove', (e) => {
  if (state.mode === 'carousel') {
    if (state.isDragging) {
      const now = performance.now();
      const dt = Math.max(1, now - state.lastPointerTime);
      const deltaX = e.clientX - state.lastPointerX;

      state.dragVelocity = deltaX / dt;
      state.lastPointerX = e.clientX;
      state.lastPointerTime = now;

      if (state.dragMode === 'spin' && state.dragTargetPiece) {
        // Direct touch spin rotation on the garment!
        state.dragTargetPiece.isPresentationSpinning = false;
        state.dragTargetPiece.targetRotationY += deltaX * 0.022;
        state.dragTargetPiece.rotationVelocityY = deltaX * 0.022;
      } else {
        // Carousel rack scroll
        const travel = (e.clientX - state.dragStartX) * 0.0075;
        targetOffset = state.dragStartOffset + travel;
      }
    } else {
      // Hover feedback
      const hitPiece = getIntersectedPiece(e);
      if (hitPiece) {
        state.hoveredIndex = hitPiece.index;
        renderer.domElement.style.cursor = 'grab';
      } else {
        state.hoveredIndex = -1;
        renderer.domElement.style.cursor = 'default';
      }
    }
  }
});

function finishDrag(e) {
  if (!state.isDragging) return;
  state.isDragging = false;

  const totalDist = Math.hypot(e.clientX - state.dragStartX, e.clientY - state.dragStartY);

  if (totalDist < 10) {
    // TAP / TOUCH ACTION!
    if (state.dragTargetPiece) {
      const tappedPiece = state.dragTargetPiece;

      // Center the tapped piece if not already centered
      if (tappedPiece.index !== state.selectedIndex) {
        selectIndex(tappedPiece.index);
      }

      // Smooth 360 presentation spin on touch!
      tappedPiece.triggerPresentationSpin();
      sound.swivelHanger();

      // Show the Floating 3D Info Card!
      showFloatingInfoCard(tappedPiece);
      return;
    } else {
      // Tap on empty space closes floating card
      hideFloatingInfoCard();
    }
  }

  if (state.dragMode === 'rack') {
    // Momentum fling to closest garment
    const projectedOffset = targetOffset + state.dragVelocity * 220 * 0.0075;
    const nearestIndex = Math.round(-projectedOffset / RACK_SPACING);
    selectIndex(nearestIndex);
  }

  state.dragMode = null;
  state.dragTargetPiece = null;
}

window.addEventListener('pointerup', finishDrag);
window.addEventListener('pointercancel', finishDrag);

// Mouse Wheel navigation (horizontal scroll across wardrobe)
window.addEventListener('wheel', (e) => {
  if (state.mode === 'inspect') return;
  if (Math.abs(e.deltaY) > 20 || Math.abs(e.deltaX) > 20) {
    const dir = (e.deltaY + e.deltaX) > 0 ? 1 : -1;
    selectIndex(state.selectedIndex + dir);
  }
}, { passive: true });

/* ==========================================================================
   DOM Event Listeners
   ========================================================================= */

// Scrubber Click & Jump
scrubberTrackEl.addEventListener('click', (e) => {
  const rect = scrubberTrackEl.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const targetFilterPos = Math.round(ratio * (state.filteredIndices.length - 1));
  const newIndex = state.filteredIndices[targetFilterPos];
  if (newIndex !== undefined) {
    selectIndex(newIndex);
  }
});

// Category Filter Buttons
document.querySelectorAll('.filter-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    sound.tapButton();
    selectCategory(btn.dataset.category);
  });
});

// Navigation Buttons
prevBtn.addEventListener('click', () => {
  const currPos = state.filteredIndices.indexOf(state.selectedIndex);
  const prevPos = (currPos - 1 + state.filteredIndices.length) % state.filteredIndices.length;
  selectIndex(state.filteredIndices[prevPos]);
  const piece = pieces[state.selectedIndex];
  if (state.isFloatingCardOpen && piece) {
    showFloatingInfoCard(piece);
  }
});

nextBtn.addEventListener('click', () => {
  const currPos = state.filteredIndices.indexOf(state.selectedIndex);
  const nextPos = (currPos + 1) % state.filteredIndices.length;
  selectIndex(state.filteredIndices[nextPos]);
  const piece = pieces[state.selectedIndex];
  if (state.isFloatingCardOpen && piece) {
    showFloatingInfoCard(piece);
  }
});

inspectBtn.addEventListener('click', enterInspectMode);
exitInspectBtn.addEventListener('click', exitInspectMode);
closeInspBtn.addEventListener('click', exitInspectMode);

// Size Chips
sizeChipsContainer.querySelectorAll('.size-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    sizeChipsContainer.querySelectorAll('.size-chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    state.selectedSize = chip.dataset.size;
    sound.tapButton();
  });
});

// Add To Bag CTA
addToBagBtn.addEventListener('click', () => {
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
      colorway: piece.currentColorway.name,
      size: state.selectedSize,
      qty: 1
    });
  }

  updateCartUI();
  showToast(`ADDED "${item.name}" (SIZE ${state.selectedSize}) TO BAG`);
});

// Shopping Bag Drawer Toggle
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
    showToast('YOUR BAG IS EMPTY');
    return;
  }
  sound.snapFocus();
  showToast('PROCEEDING TO ATELIER PRIVATE CHECKOUT...');
});

// Sound Toggle
soundBtn.addEventListener('click', () => {
  const isMuted = sound.toggleMute();
  soundBtn.classList.toggle('muted', isMuted);
  showToast(isMuted ? 'AUDIO MUTED' : 'AUDIO ACTIVE');
});

// Help Modal
helpBtn.addEventListener('click', () => {
  helpDialog.showModal();
  sound.tapButton();
});
closeHelpBtn.addEventListener('click', () => helpDialog.close());
gotItBtn.addEventListener('click', () => helpDialog.close());
helpDialog.addEventListener('click', (e) => {
  if (e.target === helpDialog) helpDialog.close();
});

// Keyboard Navigation
window.addEventListener('keydown', (e) => {
  if (helpDialog.open) {
    if (e.key === 'Escape') helpDialog.close();
    return;
  }

  if (bagDrawer.classList.contains('open')) {
    if (e.key === 'Escape') closeBag();
    return;
  }

  if (state.mode === 'inspect') {
    if (e.key === 'Escape') exitInspectMode();
    return;
  }

  if (state.isFloatingCardOpen && e.key === 'Escape') {
    hideFloatingInfoCard();
    return;
  }

  if (e.key === 'ArrowLeft') {
    prevBtn.click();
  } else if (e.key === 'ArrowRight') {
    nextBtn.click();
  } else if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    enterInspectMode();
  }
});

// Window Resize Handler
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
   ========================================================================== */

const clock = new THREE.Clock();
const tempVec = new THREE.Vector3();

function updateHotspotsPosition() {
  if (state.mode !== 'inspect') return;
  const item = collection[state.selectedIndex];
  const piece = pieces[state.selectedIndex];
  if (!item || !item.hotspots || !piece) return;

  const widthHalf = container.clientWidth / 2;
  const heightHalf = container.clientHeight / 2;

  const pins = hotspotsLayerEl.querySelectorAll('.hotspot-pin');

  item.hotspots.forEach((hs, idx) => {
    const pin = pins[idx];
    if (!pin) return;

    // Transform local coordinate to piece world coordinate
    tempVec.set(hs.x, hs.y, hs.z);
    piece.garmentGroup.localToWorld(tempVec);

    tempVec.project(camera);

    const x = tempVec.x * widthHalf + widthHalf;
    const y = -(tempVec.y * heightHalf) + heightHalf;

    if (tempVec.z > 1) {
      pin.style.display = 'none';
    } else {
      pin.style.display = 'flex';
      pin.style.left = `${x}px`;
      pin.style.top = `${y}px`;
    }
  });
}

function updateFloatingCardPosition() {
  if (!state.isFloatingCardOpen || state.mode !== 'carousel') return;

  const piece = pieces[state.selectedIndex];
  if (!piece) return;

  const width = container.clientWidth;
  const height = container.clientHeight;
  const widthHalf = width / 2;
  const heightHalf = height / 2;

  // Garment chest anchor point in 3D
  tempVec.set(0, 1.45, 0.15);
  piece.garmentGroup.localToWorld(tempVec);
  tempVec.project(camera);

  const anchorX = tempVec.x * widthHalf + widthHalf;
  const anchorY = -(tempVec.y * heightHalf) + heightHalf;

  // Card positioning
  let cardX, cardY;
  if (width < 760) {
    // Mobile: center card
    cardX = widthHalf;
    cardY = height * 0.38;
  } else {
    // Desktop: anchor to right or left of piece
    const isRightSpace = anchorX < width - 360;
    cardX = isRightSpace ? anchorX + 220 : anchorX - 220;
    cardY = Math.max(160, Math.min(height - 240, anchorY - 20));
  }

  floatingCardEl.style.left = `${cardX}px`;
  floatingCardEl.style.top = `${cardY}px`;

  // Update tether connector line
  if (width >= 760) {
    const deltaX = anchorX - cardX;
    const deltaY = anchorY - cardY;
    connectorLine.setAttribute('x1', '0');
    connectorLine.setAttribute('y1', '0');
    connectorLine.setAttribute('x2', `${deltaX}`);
    connectorLine.setAttribute('y2', `${deltaY}`);
    connectorAnchor.setAttribute('cx', `${deltaX}`);
    connectorAnchor.setAttribute('cy', `${deltaY}`);
  } else {
    connectorLine.setAttribute('x1', '0');
    connectorLine.setAttribute('y1', '0');
    connectorLine.setAttribute('x2', '0');
    connectorLine.setAttribute('y2', '0');
    connectorAnchor.setAttribute('cx', '-9999');
    connectorAnchor.setAttribute('cy', '-9999');
  }
}

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.getElapsedTime();

  // Smooth rack offset spring lerp
  previousOffset = currentOffset;
  currentOffset += (targetOffset - currentOffset) * 0.11;
  rackContainer.position.x = currentOffset;

  const rackDelta = currentOffset - previousOffset;

  // Update gallery spotlight target to follow active garment
  const activePiece = pieces[state.selectedIndex];
  if (activePiece) {
    const activeWorldX = activePiece.root.position.x + currentOffset;
    spotLight.target.position.set(activeWorldX, 1.3, 0);
    spotLight.position.x = THREE.MathUtils.lerp(spotLight.position.x, activeWorldX * 0.45, 0.08);
  }

  // Garment Cloth Sway, Swivel Rotation & Interactive Hover
  pieces.forEach((piece, index) => {
    const isSelected = index === state.selectedIndex;
    const isHovered = index === state.hoveredIndex;

    // 1. Natural pendulum cloth sway when rack accelerates/stops
    piece.swingVelocity += -rackDelta * 0.55;
    piece.swingVelocity += -piece.swingAngle * 16.0 * dt;
    piece.swingVelocity *= Math.pow(0.82, dt * 60);
    piece.swingAngle += piece.swingVelocity * dt;
    piece.garmentGroup.rotation.z = piece.swingAngle;

    // 2. Swivel Rotation (Touch, Presentation Spin, and Natural Hanging Rack Angle)
    if (piece.isPresentationSpinning) {
      piece.spinProgress += dt / 1.4; // 1.4s duration for a smooth 360 showcase
      if (piece.spinProgress >= 1) {
        piece.isPresentationSpinning = false;
        piece.spinProgress = 1;
        piece.targetRotationY = piece.spinStartAngle + Math.PI * 2;
      } else {
        const t = piece.spinProgress;
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        piece.targetRotationY = piece.spinStartAngle + ease * Math.PI * 2;
      }
    } else if (state.dragMode === 'spin' && state.dragTargetPiece === piece) {
      // User is actively dragging this piece to spin it
      piece.rotationVelocityY *= Math.pow(0.86, dt * 60);
      piece.targetRotationY += piece.rotationVelocityY * dt * 60;
    } else {
      // Natural resting rack orientation like in the reference photo:
      // Active center piece faces flat forward (0 radians).
      // Items to the left/right naturally hang turned sideways along the rail (~76 degrees)!
      let naturalRackAngle = 0;
      if (state.mode === 'carousel') {
        if (index > state.selectedIndex) {
          naturalRackAngle = -1.32; // ~-76 degrees (turned along rail to the right)
        } else if (index < state.selectedIndex) {
          naturalRackAngle = 1.32; // ~+76 degrees (turned along rail to the left)
        } else {
          naturalRackAngle = 0; // Center piece faces camera flat!
        }
      }
      piece.targetRotationY = naturalRackAngle;
      piece.rotationVelocityY *= Math.pow(0.86, dt * 60);
    }

    piece.rotationY += (piece.targetRotationY - piece.rotationY) * 0.14;
    piece.swivelGroup.rotation.y = piece.rotationY;

    if (state.mode === 'carousel') {
      // Subtle organic breathing motion
      const breathing = Math.sin(elapsed * 1.3 + index * 0.8) * 0.008;
      piece.garmentGroup.position.y = breathing + (isHovered ? 0.07 : 0);

      // Scale & Depth modulation for selected item
      const targetScale = isSelected ? 1.05 : 0.88;
      piece.root.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);

      // Slight perspective angle towards center
      const angleToCenter = Math.max(-0.16, Math.min(0.16, (index - state.selectedIndex) * -0.04));
      piece.root.rotation.y += (angleToCenter - piece.root.rotation.y) * 0.1;

      // Soft visibility culling for distant items
      const distFromCenter = Math.abs(index - state.selectedIndex);
      piece.root.visible = distFromCenter <= 4;
    } else {
      // Inspect Mode: Target piece stays active, others fade out
      if (isSelected) {
        piece.root.scale.lerp(new THREE.Vector3(1.15, 1.15, 1.15), 0.08);
        piece.root.visible = true;
      } else {
        piece.root.scale.lerp(new THREE.Vector3(0.5, 0.5, 0.5), 0.1);
        piece.root.visible = false;
      }
    }
  });

  if (state.mode === 'inspect') {
    controls.update();
    updateHotspotsPosition();
  } else {
    // Camera gently tracks carousel center
    camera.position.lerp(carouselCamPos, 0.08);
    camera.lookAt(carouselCamLook);
    updateFloatingCardPosition();
  }

  renderer.render(scene, camera);
}

// Initial bootstrap
updateCarouselUI();
updateCartUI();
animate();
