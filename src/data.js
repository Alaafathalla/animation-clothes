// Collection data for Rick's Closet — 3D Interactive Clothes Collection
export const collection = [
  {
    id: 'grey-polo-01',
    name: 'Heather Knit Polo',
    category: 'tops',
    type: 'polo',
    tagline: 'Combed Cotton Pique · Open Collar Placket',
    price: 78,
    displayPrice: '₦95,000',
    material: '100% Organic Combed Cotton Pique',
    weight: '260 GSM',
    fit: 'Relaxed Retro Polo Fit',
    origin: 'Porto, Portugal',
    description: 'Fine-gauge waffle knit polo with an unstructured spread collar, two horn buttons, and rib-knit cuffs designed to drape softly along the arms.',
    colorways: [
      { name: 'Heather Grey', hex: '#63676b', accent: '#eae5dc', print: 'POLO' },
      { name: 'Vintage Oatmeal', hex: '#d9d4c7', accent: '#32302b', print: 'POLO' },
      { name: 'Navy Blue', hex: '#232c38', accent: '#ece7dc', print: 'POLO' }
    ],
    hotspots: [
      { x: 0, y: 1.7, z: 0.16, title: 'Waffle Knit Collar', text: 'Textured rib collar that retains natural structure without stiffening.' },
      { x: 0, y: 1.35, z: 0.17, title: 'Two-Button Placket', text: 'Reinforced cotton placket with cross-stitched horn buttons.' },
      { x: 0.5, y: 1.45, z: 0.13, title: 'Relaxed Sleeve Drape', text: 'Comfortable drop-shoulder cut designed for all-day ease.' }
    ]
  },
  {
    id: 'dark-tee-01',
    name: 'Classic Heavyweight T-Shirt',
    category: 'tops',
    type: 'tee',
    tagline: 'High-Density Organic Cotton · Ribbed Crewneck',
    price: 65,
    displayPrice: '₦80,000',
    material: '100% Combed Ring-Spun Cotton',
    weight: '320 GSM',
    fit: 'Sculpted Boxy Drop-Shoulder Fit',
    origin: 'Barcelos, Portugal',
    description: 'Heavyweight organic cotton jersey engineered for an architectural drop-shoulder drape. Finished with a dense bound rib collar that holds its shape permanently.',
    colorways: [
      { name: 'Pitch Navy', hex: '#1d222b', accent: '#ded9cd', print: 'ORIGINAL' },
      { name: 'Pitch Black', hex: '#18191b', accent: '#e8e4dc', print: 'ORIGINAL' },
      { name: 'Washed Olive', hex: '#373e35', accent: '#e6e1d6', print: 'ORIGINAL' }
    ],
    hotspots: [
      { x: 0, y: 1.75, z: 0.15, title: 'Bound Rib Neck', text: 'Durable 1x1 cotton-elastane rib collar that resists stretching.' },
      { x: 0, y: 1.15, z: 0.17, title: 'Seamless Body', text: 'Knit on circular tubular looms with zero side seams for ultimate comfort.' },
      { x: 0, y: 0.65, z: 0.15, title: 'Straight Weighted Hem', text: 'Twin-needle stitched hem weighted for clean drape.' }
    ]
  },
  {
    id: 'brown-trousers-01',
    name: 'Pleated Wide-Leg Trousers',
    category: 'bottoms',
    type: 'trousers',
    tagline: 'Brushed Cotton Twill · Relaxed Leg',
    price: 185,
    displayPrice: '₦225,000',
    material: '98% Cotton, 2% Elastane Twill',
    weight: '290 GSM',
    fit: 'Relaxed Wide-Leg with Deep Pleats',
    origin: 'Biella, Italy',
    description: 'Tailored trousers cut with generous double front pleats and a fluid straight leg. Woven from brushed cotton with a matte finish, horn buttons, and internal curtain waistband.',
    colorways: [
      { name: 'Espresso Brown', hex: '#3e342c', accent: '#ded9cd', print: 'TAILORED' },
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
    id: 'artisan-shirt-01',
    name: 'Artisan Printed Camp Shirt',
    category: 'tops',
    type: 'camp-shirt',
    tagline: 'Silk-Cotton Blend · Graphic Art Print',
    price: 110,
    displayPrice: '₦135,000',
    material: '70% Cotton, 30% Mulberry Silk',
    weight: '160 GSM',
    fit: 'Relaxed Boxy Fit with Wide Sleeves',
    origin: 'Como, Italy',
    description: 'Lightweight summer shirt woven from a lustrous silk-cotton blend. Features wide dropped short sleeves, an open camp collar, and vertical graphic artwork panels down the front.',
    colorways: [
      { name: 'Bone White', hex: '#eee9df', accent: '#3d3429', print: 'ARTISAN' },
      { name: 'Washed Charcoal', hex: '#262829', accent: '#eae5d8', print: 'ARTISAN' },
      { name: 'Dusty Rose', hex: '#a5847e', accent: '#f5f0e8', print: 'ARTISAN' }
    ],
    hotspots: [
      { x: 0.18, y: 1.1, z: 0.16, title: 'Vertical Graphic Panel', text: 'Archival woodcut artwork prints arranged along the front placket.' },
      { x: 0.55, y: 1.45, z: 0.12, title: 'Wide Elbow-Length Sleeves', text: 'Overcut shoulders cascading into wide, breezy sleeves.' },
      { x: 0, y: 1.7, z: 0.15, title: 'Split Camp Collar', text: 'Convertible collar that can be worn buttoned to the neck or open.' }
    ]
  },
  {
    id: 'faces-shirt-01',
    name: 'Faces Shirt',
    category: 'tops',
    type: 'camp-shirt',
    tagline: 'Flowing Viscose Drape · Continuous Line Art',
    price: 92,
    displayPrice: '₦115,000',
    material: '100% Breathable Twill Viscose',
    weight: '210 GSM',
    fit: 'Fluid Relaxed Camp Collar Fit',
    origin: 'Porto, Portugal',
    description: 'A fluid, easy-draping camp collar shirt tailored from soft matte viscose. Features an open notched collar, flared lower drape, and a continuous single line-art face illustration across the chest.',
    colorways: [
      { name: 'Pitch Black', hex: '#1c1d1f', accent: '#f4efe6', print: 'FACES' },
      { name: 'Raw Ecru', hex: '#ece7dd', accent: '#212224', print: 'FACES' },
      { name: 'Olive Drab', hex: '#3d4439', accent: '#e8e2d5', print: 'FACES' }
    ],
    hotspots: [
      { x: 0, y: 1.75, z: 0.16, title: 'Open Camp Notch Collar', text: 'Relaxed unstructured camp lapel collar designed to sit flat and easy against the neck.' },
      { x: -0.15, y: 1.15, z: 0.18, title: 'Continuous Line Art', text: 'Screen-printed figurative line illustration inspired by modern minimalist sculpture.' },
      { x: 0, y: 0.55, z: 0.16, title: 'Fluid Flared Drape', text: 'Generous cut through the torso that widens gently toward the hem for airy movement.' }
    ]
  },
  {
    id: 'black-trousers-01',
    name: 'Tailored Jet Black Trousers',
    category: 'bottoms',
    type: 'trousers',
    tagline: 'Virgin Wool Blend · Permanent Crease',
    price: 210,
    displayPrice: '₦255,000',
    material: '85% Virgin Wool, 15% Mohair',
    weight: '270 GSM',
    fit: 'Sharp Straight Leg with Front Crease',
    origin: 'Biella, Italy',
    description: 'Crisp trousers tailored from resilient high-twist wool-mohair. Retains razor-sharp permanent pleats and drapes cleanly with zero creasing throughout the day.',
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
    id: 'white-shirt-01',
    name: 'Artist Graphic Long-Sleeve Shirt',
    category: 'tops',
    type: 'camp-shirt',
    tagline: 'Crisp Cotton Poplin · Minimalist Art Print',
    price: 105,
    displayPrice: '₦130,000',
    material: '100% Organic Crisp Cotton Poplin',
    weight: '175 GSM',
    fit: 'Fluid Relaxed Long-Sleeve Cut',
    origin: 'Milan, Italy',
    description: 'Tailored from high-thread-count crisp cotton poplin with clean French seams. Features delicate artistic prints on the chest and mother-of-pearl buttons.',
    colorways: [
      { name: 'Chalk White', hex: '#f6f3ed', accent: '#26231f', print: 'STUDIO' },
      { name: 'Pale Sage', hex: '#dce2d7', accent: '#2c352a', print: 'STUDIO' },
      { name: 'Sky Mist', hex: '#d7e1e8', accent: '#222d36', print: 'STUDIO' }
    ],
    hotspots: [
      { x: 0, y: 1.7, z: 0.15, title: 'Spread Collar', text: 'Fused collar designed to retain a crisp profile under layering.' },
      { x: -0.15, y: 1.2, z: 0.17, title: 'Minimalist Chest Artwork', text: 'Subtle line drawing hand-printed on the chest.' },
      { x: 0.65, y: 1.1, z: 0.14, title: 'Button Barrel Cuffs', text: 'Two-button adjustable cuffs with curved edges.' }
    ]
  },
  {
    id: 'tan-overcoat-01',
    name: 'Minimalist Harrington Overcoat',
    category: 'outerwear',
    type: 'jacket',
    tagline: 'Water-Repellent Cotton Canvas · Horn Buttons',
    price: 260,
    displayPrice: '₦320,000',
    material: 'High-Density Cotton Canvas Gabardine',
    weight: '340 GSM',
    fit: 'Contemporary Straight Long Cut',
    origin: 'Manchester, United Kingdom',
    description: 'A contemporary mid-length lightweight overcoat tailored from high-density gabardine twill. Features natural horn buttons, structured point collar, raglan sleeves, and deep welt pockets.',
    colorways: [
      { name: 'Desert Camel', hex: '#9d8368', accent: '#26221c', print: 'CLASSIC' },
      { name: 'Onyx Black', hex: '#1d1e20', accent: '#dedad0', print: 'CLASSIC' },
      { name: 'Field Olive', hex: '#444c3e', accent: '#ede8dd', print: 'CLASSIC' }
    ],
    hotspots: [
      { x: 0, y: 1.75, z: 0.16, title: 'Fused Point Collar', text: 'Crisp collar stand that can be popped or turned down flat.' },
      { x: 0, y: 1.25, z: 0.18, title: 'Horn Button Front Placket', text: 'Concealed front button placket with genuine marbled horn buttons.' },
      { x: -0.32, y: 0.8, z: 0.17, title: 'Deep Hand Welt Pockets', text: 'Reinforced slash pockets with soft brushed cotton pocket bags.' }
    ]
  },
  {
    id: 'varsity-jersey-01',
    name: 'Heritage Varsity Jersey',
    category: 'tops',
    type: 'jersey',
    tagline: 'Breathable Knit · Striped Collar & Cuffs',
    price: 88,
    displayPrice: '₦110,000',
    material: '80% Recycled Poly, 20% Organic Cotton',
    weight: '240 GSM',
    fit: 'Athletic Relaxed Fit',
    origin: 'Milan, Italy',
    description: 'Inspired by classic continental athletic training kits. Knit in a custom micro-jacquard diamond weave with contrast striped rib collar, embroidered tonal heraldry, and retro athletic typography.',
    colorways: [
      { name: 'Ecru / Forest Green', hex: '#eee9df', accent: '#1f3c2a', print: 'SPORTS CLUB' },
      { name: 'Forest Green', hex: '#1f3c2a', accent: '#ede7db', print: 'SPORTS CLUB' },
      { name: 'Deep Cobalt', hex: '#1e3250', accent: '#e3ecf5', print: 'SPORTS CLUB' }
    ],
    hotspots: [
      { x: 0, y: 1.6, z: 0.16, title: 'Jacquard Stripe Rib Collar', text: 'Retro knit V-notch polo collar engineered with dual tonal contrast bands.' },
      { x: 0, y: 1.15, z: 0.17, title: 'Chest Typography', text: 'Soft-touch velvet flock print inspired by vintage athletics.' },
      { x: 0.5, y: 1.35, z: 0.13, title: 'Ventilated Sleeve Panels', text: 'Micro-perforated side underarm panels for breathability in warm weather.' }
    ]
  }
];
