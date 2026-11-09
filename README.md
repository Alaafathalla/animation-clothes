# ATELIER 3D — Haute Prêt-à-Porter Digital Archive

A luxury, interactive 3D fashion showcase and wardrobe rail experience built with **Three.js**, **Vite**, and **vanilla modern JavaScript**.

Inspired by high-end digital fashion houses and archival ateliers (Acne Studios, Jacquemus, Balenciaga, SSENSE, Loro Piana).

---

## Key Features

1. **Procedural Volumetric 3D Garments (No Flat Cutouts)**:
   - **Tees, Jerseys & Knit Polos**: Curved volumetric chests with organic cloth drape waves, dropped shoulders, hollow arm cuffs, and 3D ribbed collar bands.
   - **Heavyweight Hoodies**: Sculpted volumetric body, kangaroo pocket shell with stitch details, draped 3D hood, and braided drawstrings with brass aglets.
   - **Structured Jackets & Overshirts**: Point collars, lapels, center placket with metallic zipper slider, and cuff bands.
   - **Tailored & Cargo Trousers**: Contoured waistband, sharp front pleats, distinct 3D tubular legs with knee drape waves, cuffed hems, and 3D cargo pockets.
   - **Luxury Beechwood & Brass Hangers**: Swiveling curved brass hooks resting on the titanium rail, beveled wooden shoulder bars, and metal clamp clips for trousers.

2. **Physically Based Rendering (PBR) & Fabric Shading**:
   - Built on Three.js `MeshPhysicalMaterial`.
   - Procedural micro-weave bump and normal maps (cotton jersey knit, diagonal twill, waffle pique).
   - High-end fabric **micro-fiber sheen** (`sheen: 1.0, sheenRoughness: 0.5`) producing realistic velvet/cotton rim lighting along edges.
   - Procedural studio HDR environment map generated with `PMREMGenerator` for reflections on brass hardware, metals, and cloth.
   - Soft architectural directional shadows with PCF soft shadow mapping.

3. **Dual Interactive Experience Modes**:
   - **Mode 1: The Wardrobe Rail Carousel**:
     - Physics-based horizontal momentum scrolling and spring dampening.
     - Damped harmonic pendulum cloth sway: garments swing naturally on their hangers when sliding or stopping.
     - Raycaster hover interaction: hovering lifts garments on the rail with cursor feedback.
     - Click-to-center any garment, or click the centered garment to inspect.
     - Interactive scrubber bar and category filters (`All Pieces`, `Tops`, `Outerwear`, `Bottoms`).
   - **Mode 2: 360° Studio Product Inspector**:
     - Orbit controls with smooth trackball damping, rotation, and zoom.
     - Interactive 3D Hotspot Pins projected from 3D space to screen coordinates, showcasing tailoring and fabric specifications.
     - Live Real-time Colorway Switcher with dynamic canvas texture re-rendering.
     - Size selector (`S`, `M`, `L`, `XL`), stock indicators, and full editorial write-up.
     - Functional slide-over Shopping Bag drawer with live subtotal calculation.

4. **Synthetic Web Audio API Sound Design**:
   - Zero external audio assets required.
   - Custom synthesized metallic hanger glide, resonant tap, button clicks, and camera whoosh.
   - Toggleable mute control with dynamic SVG soundwave animation.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

## Build for Production

```bash
npm run build
```

The production-ready assets are compiled to the `dist/` folder.

---

## Controls

| Action | Control |
| :--- | :--- |
| **Browse Collection** | Drag / Swipe across 3D canvas |
| **Previous / Next** | `←` / `→` arrow keys or nav buttons |
| **Inspect 3D** | Click centered garment, click `INSPECT 3D`, or press `Space` / `Enter` |
| **360° Rotate & Zoom** | Drag to orbit, wheel / pinch to zoom in inspector mode |
| **Inspect Hotspot** | Click glowing gold pins on garment |
| **Return to Rack** | Press `ESC` or click `RETURN TO RACK` |

---

## Project Structure

```
animation-clothes/
├── index.html          # Semantic editorial HTML5 layout & HUD
├── src/
│   ├── main.js         # Three.js scene, camera transitions, rack physics, raycasting
│   ├── garments.js     # Procedural 3D garment & hanger geometry builders
│   ├── textures.js     # Fabric bump maps, diffuse graphics, studio environment
│   ├── sound.js        # Synthetic Web Audio API engine
│   ├── data.js         # Curated 8-piece fashion collection & specifications
│   └── style.css       # Luxury editorial dark-neutral styling & glassmorphism
└── package.json        # Project scripts & dependencies
```

## Atelier update (November 2026)

- Garment previews now use subdivided, curved Three.js meshes with subtle moving fold and hem displacement. These are stylized fabric surfaces, **not** full physically simulated cloth or scanned 3D garments.
- The hanger hardware and visible rail have been reduced for a cleaner showroom appearance.
- Use the **AUTO TOUR** button to cycle automatically through the collection. Click again to pause.
- Existing inspection, colorway switching, products, and shopping cart logic remain in place.

### Run

```bash
npm install
npm run dev
```

For truly photorealistic 360-degree garments, the next step is to replace these procedurally animated panels with properly modeled and textured GLB garments (e.g. CLO3D/Blender exported models).
