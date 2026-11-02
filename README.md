# Rick's Closet — Three.js interactive clothing rail

A small, responsive 3D clothing carousel inspired by the reference screenshots. All garment models and fabric textures are generated procedurally — no external 3D model downloads required.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown in your terminal (usually http://localhost:5173).

## Build for production

```bash
npm run build
```

Deploy the `dist/` folder to a static hosting provider.

## Controls

- Previous / next buttons
- Drag left or right across the 3D view
- Arrow keys
- View Piece opens a product details dialog

## Customize

Edit the `items` array at the beginning of `src/main.js` to change names, prices, colors and descriptions. Replace the procedural models with GLB clothing assets later if you want photo-realistic garments.

Built with Three.js, Vite, vanilla JavaScript and CSS.
