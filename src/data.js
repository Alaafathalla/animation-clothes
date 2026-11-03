// Collection data inspired by the natural boutique fashion rack
export const collection = [
  {
    id: 'faces-shirt-01',
    name: 'Faces Camp Shirt',
    category: 'tops',
    type: 'camp-shirt',
    tagline: 'Flowing Viscose Drape · Continuous Line Art',
    price: 92,
    material: '100% Breathable Twill Viscose',
    weight: '210 GSM',
    fit: 'Fluid Relaxed Camp Collar Silhouette',
    origin: 'Porto, Portugal',
    description: 'A fluid, easy-draping camp collar shirt tailored from soft matte viscose. Features an open notched lapel collar, flared lower drape, and an archival continuous line-art face illustration across the chest.',
    colorways: [
      { name: 'Pitch Black', hex: '#1c1d1f', accent: '#eae5dc', print: 'FACES' },
      { name: 'Raw Ecru', hex: '#ece7dd', accent: '#212224', print: 'FACES' },
      { name: 'Olive Drab', hex: '#3d4439', accent: '#e8e2d5', print: 'FACES' }
    ],
    hotspots: [
      { x: 0, y: 1.75, z: 0.16, title: 'Open Camp Notch Collar', text: 'Relaxed unstructured Cuban lapel collar designed to sit flat and easy against the neck.' },
      { x: -0.15, y: 1.15, z: 0.18, title: 'Continuous Line Art', text: 'Screen-printed figurative line illustration inspired by modern minimalist sculpture.' },
      { x: 0, y: 0.55, z: 0.16, title: 'Fluid Flared Drape', text: 'Generous cut through the torso that widens gently toward the hem for airy movement.' }
    ]
  },
  {
    id: 'trousers-01',
    name: 'Pleated Wide-Leg Trousers',
    category: 'bottoms',
    type: 'trousers',
    tagline: 'Brushed Italian Cotton Twill · Relaxed Leg',
    price: 185,
    material: '98% Cotton, 2% Elastane Twill',
    weight: '290 GSM',
    fit: 'Relaxed Wide-Leg with Deep Pleats',
    origin: 'Biella, Italy',
    description: 'Tailored trousers cut with generous double front pleats and a fluid straight leg. Woven from brushed Italian cotton with a matte peach finish, real horn buttons, and internal curtain waistband for all-day comfort.',
    colorways: [
      { name: 'Espresso Brown', hex: '#3c322b', accent: '#ded9cd', print: 'TAILORED' },
      { name: 'Dark Slate', hex: '#2f3435', accent: '#d9d4c9', print: 'TAILORED' },
      { name: 'Warm Khaki', hex: '#a59682', accent: '#262421', print: 'TAILORED' }
    ],
    hotspots: [
      { x: -0.22, y: 0.45, z: 0.15, title: 'Deep Double Pleats', text: 'Inward facing pleats create volume through the thigh that cascades down the leg.' },
      { x: 0, y: 0.65, z: 0.14, title: 'Extended Tab Closure', text: 'Clean waistband with hidden hook-and-bar closure and natural horn side tab adjusters.' },
      { x: 0.25, y: -0.85, z: 0.12, title: 'Straight Cuffed Hem', text: 'Wide 4cm turned hem with sufficient weight for an elegant break over shoes.' }
    ]
  },
  {
    id: 'printed-shirt-01',
    name: 'Artisan Printed Short-Sleeve',
    category: 'tops',
    type: 'camp-shirt',
    tagline: 'Silk-Cotton Blend · Archival Graphic Print',
    price: 110,
    material: '70% Cotton, 30% Mulberry Silk',
    weight: '160 GSM',
    fit: 'Relaxed Boxy Fit with Wide Sleeves',
    origin: 'Como, Italy',
    description: 'Lightweight summer shirt woven in Como from a lustrous silk-cotton blend. Features wide dropped short sleeves, an open camp collar, and vertical graphic woodcut artwork down the front.',
    colorways: [
      { name: 'Bone White', hex: '#f0ece3', accent: '#3d3429', print: 'ARTISAN' },
      { name: 'Washed Charcoal', hex: '#262829', accent: '#eae5d8', print: 'ARTISAN' },
      { name: 'Dusty Rose', hex: '#a5847e', accent: '#f5f0e8', print: 'ARTISAN' }
    ],
    hotspots: [
      { x: 0.18, y: 1.1, z: 0.16, title: 'Vertical Graphic Panel', text: 'Archival woodcut prints arranged along the front placket.' },
      { x: 0.55, y: 1.45, z: 0.12, title: 'Wide Elbow-Length Sleeves', text: 'Overcut shoulders cascading into wide, breezy sleeves.' },
      { x: 0, y: 1.7, z: 0.15, title: 'Split Camp Collar', text: 'Convertible collar that can be worn buttoned to the neck or open.' }
    ]
  },
  {
    id: 'trench-01',
    name: 'Minimalist Harrington Overcoat',
    category: 'outerwear',
    type: 'jacket',
    tagline: 'Water-Repellent Twill Canvas · Horn Buttons',
    price: 260,
    material: 'High-Density Cotton Canvas',
    weight: '340 GSM',
    fit: 'Contemporary Straight Duster Cut',
    origin: 'Manchester, UK',
    description: 'A contemporary mid-length lightweight overcoat tailored from high-density gabardine twill. Features natural horn buttons, structured point collar, raglan sleeves, and deep welt pockets.',
    colorways: [
      { name: 'Desert Camel', hex: '#a68c70', accent: '#26221c', print: 'ATELIER' },
      { name: 'Onyx Black', hex: '#1d1e20', accent: '#dedad0', print: 'ATELIER' },
      { name: 'Field Olive', hex: '#444c3e', accent: '#ede8dd', print: 'ATELIER' }
    ],
    hotspots: [
      { x: 0, y: 1.75, z: 0.16, title: 'Fused Point Collar', text: 'Crisp collar stand that can be popped or turned down flat.' },
      { x: 0, y: 1.25, z: 0.18, title: 'Horn Button Front Placket', text: 'Concealed front button placket with genuine marbled horn buttons.' },
      { x: -0.32, y: 0.8, z: 0.17, title: 'Deep Hand Welt Pockets', text: 'Reinforced slash pockets with soft brushed cotton pocket bags.' }
    ]
  },
  {
    id: 'charcoal-polo-01',
    name: 'Vintage Washed Knit Polo',
    category: 'tops',
    type: 'polo',
    tagline: 'Heavy Waffle Cotton · Open French Placket',
    price: 84,
    material: '100% Combed Cotton Waffle Knit',
    weight: '280 GSM',
    fit: 'Relaxed Retro Polo Fit',
    origin: 'Porto, Portugal',
    description: 'Spun from heavy waffle-knit organic cotton with a vintage garment wash. Features a relaxed collar, three-button placket, and ribbed cuffs that drape cleanly along the arms.',
    colorways: [
      { name: 'Washed Charcoal', hex: '#3a3d3c', accent: '#dad6cc', print: 'POLO' },
      { name: 'Oatmeal', hex: '#dcd7ca', accent: '#35322e', print: 'POLO' },
      { name: 'Vintage Navy', hex: '#253244', accent: '#eee9dd', print: 'POLO' }
    ],
    hotspots: [
      { x: 0, y: 1.7, z: 0.16, title: 'Waffle Knit Collar', text: 'Textured rib collar that retains natural structure without stiffening.' },
      { x: 0, y: 1.35, z: 0.17, title: 'Three-Button Placket', text: 'Reinforced cotton placket with cross-stitched horn buttons.' },
      { x: 0.5, y: 1.45, z: 0.13, title: 'Relaxed Sleeve Drape', text: 'Comfortable drop-shoulder cut designed for all-day ease.' }
    ]
  },
  {
    id: 'black-trousers-01',
    name: 'Tailored Jet Black Trousers',
    category: 'bottoms',
    type: 'trousers',
    tagline: 'Virgin Wool & Mohair · Sharp Knife Pleats',
    price: 210,
    material: '85% Virgin Wool, 15% Mohair',
    weight: '270 GSM',
    fit: 'Sharp Straight Leg with Front Crease',
    origin: 'Biella, Italy',
    description: 'Crisp evening trousers tailored from resilient high-twist wool-mohair. Retains razor-sharp permanent pleats and drapes cleanly with zero creasing throughout the day.',
    colorways: [
      { name: 'Jet Black', hex: '#161719', accent: '#dedad2', print: 'TAILORED' },
      { name: 'Midnight Blue', hex: '#1b2331', accent: '#e2dfd7', print: 'TAILORED' },
      { name: 'Charcoal Grey', hex: '#35383a', accent: '#e8e5dc', print: 'TAILORED' }
    ],
    hotspots: [
      { x: 0, y: 0.65, z: 0.14, title: 'Clean Waistband', text: 'Internal curtain construction with side tab adjusters and coin pocket.' },
      { x: -0.22, y: 0.1, z: 0.15, title: 'Permanent Knife Crease', text: 'Sharp vertical crease extending straight from the waist to the hem.' },
      { x: 0.23, y: -0.85, z: 0.12, title: 'Clean Unbroken Hem', text: 'Weighted interior hem tape for an immaculate drape over footwear.' }
    ]
  },
  {
    id: 'jersey-01',
    name: 'Heritage Varsity Jersey',
    category: 'tops',
    type: 'jersey',
    tagline: 'Ventilated Piqué Knit · Striped Collar & Cuffs',
    price: 88,
    material: '80% Recycled Poly, 20% Organic Cotton',
    weight: '240 GSM',
    fit: 'Athletic Relaxed Fit',
    origin: 'Milan, Italy',
    description: 'Inspired by 90s continental training kits. Knit in a custom micro-jacquard diamond weave with contrast striped rib collar, embroidered tonal chest herald, and retro club typography across the chest.',
    colorways: [
      { name: 'Ecru / Black', hex: '#ede8dd', accent: '#1b1c1d', print: 'CLUB D’ATHLÈTE' },
      { name: 'Forest Green', hex: '#22382c', accent: '#ede7db', print: 'CLUB D’ATHLÈTE' },
      { name: 'Deep Cobalt', hex: '#1e3250', accent: '#e3ecf5', print: 'CLUB D’ATHLÈTE' }
    ],
    hotspots: [
      { x: 0, y: 1.6, z: 0.16, title: 'Jacquard Stripe Rib Collar', text: 'Retro knit V-notch polo collar engineered with dual tonal contrast bands.' },
      { x: 0, y: 1.15, z: 0.17, title: 'Archival Flocked Chest Typo', text: 'Soft-touch velvet flock print inspired by mid-century athletics.' },
      { x: 0.5, y: 1.35, z: 0.13, title: 'Ventilated Sleeve Panels', text: 'Micro-perforated side underarm panels for breathability in warm weather.' }
    ]
  },
  {
    id: 'hoodie-01',
    name: 'French Terry Studio Hoodie',
    category: 'outerwear',
    type: 'hoodie',
    tagline: 'Loopback Heavyweight Fleece · 480 GSM',
    price: 165,
    material: '100% Combed Loopback Cotton',
    weight: '480 GSM',
    fit: 'Oversized Contemporary Fit',
    origin: 'Guimarães, Portugal',
    description: 'Custom developed heavyweight French terry with double-needle reverse coverstitching. Designed with a generous double-layered hood without hardware, seamless kangaroo front pocket, and elongated ribbed cuffs.',
    colorways: [
      { name: 'Oatmeal Heather', hex: '#d8d4c9', accent: '#3b3834', print: 'ARCHIVE STUDIO' },
      { name: 'Onyx Black', hex: '#1e1f21', accent: '#e2ddd5', print: 'ARCHIVE STUDIO' },
      { name: 'Washed Pine', hex: '#2e4138', accent: '#e8e2d4', print: 'ARCHIVE STUDIO' }
    ],
    hotspots: [
      { x: 0, y: 1.85, z: -0.15, title: 'Double-Layered Hood', text: 'Constructed from self-fabric without eyelets or drawstrings for a clean sculptural drape.' },
      { x: 0, y: 0.8, z: 0.22, title: 'Seamless Kangaroo Pocket', text: 'Bar-tacked pocket edges with reinforced cotton tape inside for hands and essentials.' },
      { x: 0.65, y: 0.7, z: 0.1, title: 'Heavy Ribbed Cuffs', text: 'Dense 2x2 elastane-rib cuffs designed to stack naturally at the wrists.' }
    ]
  }
];
