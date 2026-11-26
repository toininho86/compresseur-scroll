/* Compresseur scroll : modèle 3D procédural + géométrie des spirales + rendu 2D des poches.
   Unités : cm. Axe du compresseur = Y, poulie en haut. Partagé par le site et la vidéo. */
(function () {
  const SC = {};
  // ---------- Géométrie des spirales (développante de cercle) ----------
  const A = 0.26, BETA = 0.577, PHI0 = 1.0, PHI1 = 16.4;
  const T = 2 * A * BETA, ORB = Math.PI * A - T;
  SC.geo = { a: A, beta: BETA, t: T, orbit: ORB, phi0: PHI0, phi1: PHI1, rimIn: 4.98, rimOut: 5.25 };
  function inv(phi, alpha) {
    const k = phi - alpha;
    return [A * (Math.cos(phi) + k * Math.sin(phi)), A * (Math.sin(phi) - k * Math.cos(phi))];
  }
  SC.geo.h = 2.4; SC.geo.pitch = 2 * Math.PI * A; SC.geo.turns = (PHI1 - PHI0) / (2 * Math.PI);
  // point (x, y) dans la paroi de la volute fixe ?
  SC.inFixedWall = function (x, y) {
    const rho = Math.hypot(x, y), u2 = (rho / A) ** 2 - 1; if (u2 <= 0) return false;
    const u = Math.sqrt(u2), T2 = 2 * Math.PI; let al = Math.atan2(y, x) - (u - Math.atan(u)); al = ((al + BETA) % T2 + T2) % T2 - BETA;
    if (al > BETA) return false; const phi = u + al; return phi >= PHI0 && phi <= PHI1;
  };
  SC.wallOutline = function (n) {
    n = n || 420; const p = [];
    for (let i = 0; i <= n; i++) p.push(inv(PHI0 + (PHI1 - PHI0) * i / n, -BETA));
    for (let i = n; i >= 0; i--) p.push(inv(PHI0 + (PHI1 - PHI0) * i / n, BETA));
    return p;
  };

  // ---------- Pièces : données bilingues ----------
  // g = sous-ensemble ; cat = fichier CATIA
  SC.groups = {
    comp: { fr: 'Bloc de compression', en: 'Compression unit' },
    trans: { fr: 'Transmission et anti-rotation', en: 'Drive and anti-rotation' },
    carter: { fr: 'Carters et étanchéité', en: 'Housings and sealing' },
    clutch: { fr: 'Poulie débrayable', en: 'Clutch pulley' },
    fix: { fr: 'Visserie et accessoires', en: 'Fasteners and accessories' }
  };
  const P = (id, g, cat, qty, fr, en, fnFr, fnEn, matFr, matEn, prFr, prEn) =>
    ({ id, g, cat, qty, name: { fr, en }, fn: { fr: fnFr, en: fnEn }, mat: { fr: matFr, en: matEn }, proc: { fr: prFr, en: prEn } });
  SC.PARTS = [
    P('corps', 'carter', 'CS-Corps-Livr', 1, 'Corps (carter principal)', 'Main housing (body)',
      'Pièce de référence : elle loge les spirales, porte l’arbre, les roulements et l’embrayage, et se fixe sur le moteur.',
      'Reference part: it houses the scrolls, carries the shaft, bearings and clutch, and bolts onto the engine.',
      'Alliage d’aluminium de fonderie (type AlSi9Cu3)', 'Cast aluminium alloy (AlSi9Cu3 type)',
      'Moulage sous pression, puis usinage des alésages, plans de joint et taraudages', 'High-pressure die casting, then machining of bores, joint faces and threads'),
    P('couvercle', 'carter', 'CS-Couvercle-Livr', 1, 'Couvercle arrière', 'Rear head (cover)',
      'Ferme le compresseur. Il contient la chambre de refoulement haute pression et porte les orifices d’aspiration et de refoulement.',
      'Closes the compressor. It contains the high-pressure discharge chamber and carries the suction and discharge ports.',
      'Alliage d’aluminium de fonderie', 'Cast aluminium alloy',
      'Moulage sous pression + usinage des orifices', 'Die casting + machining of the ports'),
    P('voluteFixe', 'comp', 'CS-Volute-Fixe-Livr', 1, 'Volute fixe', 'Fixed scroll',
      'Spirale immobile. Avec la volute mobile, elle forme les chambres de compression. Le gaz comprimé sort par l’orifice central.',
      'Stationary spiral. With the orbiting scroll it forms the compression chambers. Compressed gas leaves through the central port.',
      'Alliage aluminium-silicium (résistant à l’usure)', 'Aluminium-silicon alloy (wear resistant)',
      'Moulage ou forgeage, puis usinage CN de la spirale (tolérances de quelques µm)', 'Casting or forging, then CNC machining of the spiral (µm tolerances)'),
    P('voluteMobile', 'comp', 'CS-Volute-Mobile-Livr', 1, 'Volute mobile', 'Orbiting scroll',
      'Orbite autour de la volute fixe sans tourner sur elle-même. Elle emprisonne le gaz et le pousse vers le centre en réduisant son volume.',
      'Orbits around the fixed scroll without spinning. It traps the gas and pushes it toward the centre while reducing its volume.',
      'Alliage aluminium-silicium, léger (faible inertie)', 'Light aluminium-silicon alloy (low inertia)',
      'Forgeage + usinage CN + traitement de surface (anodisation)', 'Forging + CNC machining + surface treatment (anodising)'),
    P('clapetSouple', 'comp', 'CS-Clapet-souple-Livr', 1, 'Clapet de refoulement (lame souple)', 'Discharge reed valve',
      'Laisse sortir le gaz haute pression et empêche son retour vers les spirales (clapet anti-retour).',
      'Lets the high-pressure gas out and stops it flowing back into the scrolls (non-return valve).',
      'Acier à ressort (feuillard)', 'Spring steel strip',
      'Découpage fin + traitement thermique', 'Fine blanking + heat treatment'),
    P('clapetRigide', 'comp', 'CS-Clapet-Rigide-Livr', 1, 'Butée de clapet', 'Valve stop',
      'Limite l’ouverture de la lame pour qu’elle ne se déforme pas.', 'Limits how far the reed opens so it does not bend permanently.',
      'Acier', 'Steel', 'Découpage-pliage', 'Stamping and bending'),
    P('visClapet', 'fix', 'CS-Vis M4x20-Livr', 1, 'Vis M4×20', 'M4×20 screw',
      'Fixe la lame et sa butée sur le dos de la volute fixe.', 'Holds the reed and its stop on the back of the fixed scroll.',
      'Acier zingué classe 8.8', 'Zinc-plated steel, class 8.8', 'Frappe à froid + roulage du filet', 'Cold heading + thread rolling'),
    P('axe', 'trans', 'CS-Axe-Excentrique-Livr', 1, 'Axe excentrique (arbre à maneton)', 'Eccentric shaft (crankshaft)',
      'Reçoit le couple de l’embrayage. Son maneton, décalé du rayon d’orbite, entraîne la volute mobile.',
      'Receives torque from the clutch. Its crank pin, offset by the orbit radius, drives the orbiting scroll.',
      'Acier allié traité (type 42CrMo4)', 'Heat-treated alloy steel (42CrMo4 type)',
      'Forgeage, tournage, rectification des portées de roulement', 'Forging, turning, grinding of bearing seats'),
    P('masselotte', 'trans', 'CS-Masselotte-Livr', 1, 'Masselotte (bague excentrique)', 'Eccentric bush with balance weight',
      'Relie le maneton à la volute mobile. Elle plaque la spirale mobile contre la fixe (étanchéité radiale) et équilibre une partie de la masse.',
      'Links the crank pin to the orbiting scroll. It presses the moving spiral against the fixed one (radial sealing) and balances part of the mass.',
      'Acier ou acier fritté', 'Steel or sintered steel', 'Frittage ou usinage', 'Sintering or machining'),
    P('roulementExc', 'trans', 'CS-Roulmt-axe-excentrique-Livr', 1, 'Roulement de l’axe excentrique', 'Eccentric (crank pin) bearing',
      'Guide en rotation la volute mobile sur la masselotte.', 'Lets the orbiting scroll turn freely on the eccentric bush.',
      'Acier à roulement 100Cr6', 'Bearing steel 100Cr6', 'Tournage, trempe, rectification', 'Turning, hardening, grinding'),
    P('masseInertie', 'trans', 'CS-Masse-Inertie-Livr', 1, 'Masse d’inertie (contrepoids)', 'Counterweight',
      'Équilibre la masse excentrée de la volute mobile pour limiter les vibrations.', 'Balances the off-centre mass of the orbiting scroll to limit vibration.',
      'Acier', 'Steel', 'Découpage ou usinage', 'Blanking or machining'),
    P('billes', 'trans', 'CS-Billes-Livr', 6, 'Billes anti-rotation', 'Anti-rotation balls',
      'Roulent dans des alvéoles : elles empêchent la volute mobile de tourner sur elle-même et reprennent l’effort axial.',
      'Roll in pockets: they stop the orbiting scroll from spinning and carry the axial thrust.',
      'Acier 100Cr6 trempé', 'Hardened 100Cr6 steel', 'Frappe, rectification, polissage', 'Heading, grinding, lapping'),
    P('rondGuide', 'trans', 'CS-Rond-Guide-bille-Livr', 1, 'Rond guide-billes', 'Ball retainer ring',
      'Positionne les billes dans leurs alvéoles.', 'Keeps each ball in its pocket.',
      'Acier', 'Steel', 'Découpage + usinage', 'Blanking + machining'),
    P('feuilleVM', 'trans', 'CS-Feuille-Metal-VM-Livr', 1, 'Feuille métal côté volute mobile', 'Thrust plate, orbiting side',
      'Piste de roulement dure pour les billes, côté volute mobile.', 'Hard rolling track for the balls on the orbiting-scroll side.',
      'Acier trempé', 'Hardened steel', 'Découpage + trempe', 'Blanking + hardening'),
    P('feuilleVF', 'trans', 'CS-Feuille-Metal-VF-Livr', 1, 'Feuille métal côté fixe', 'Thrust plate, fixed side',
      'Piste de roulement dure pour les billes, côté corps.', 'Hard rolling track for the balls on the housing side.',
      'Acier trempé', 'Hardened steel', 'Découpage + trempe', 'Blanking + hardening'),
    P('patins', 'trans', 'CS-Patin-VF-Livr / CS-Patin-VM-Livr', 8, 'Patins VF et VM', 'Thrust pads (fixed / orbiting)',
      'Appuis axiaux à faible frottement entre les feuilles métal et le corps.', 'Low-friction axial supports between the thrust plates and the housing.',
      'Acier ou polymère chargé (à confirmer)', 'Steel or filled polymer (to be confirmed)', 'Découpage ou injection', 'Blanking or injection moulding'),
    P('roulement3547', 'trans', 'CS-Roulmt-35-47-Livr', 1, 'Roulement 35×47 (arbre)', '35×47 main bearing',
      'Guide le plateau-manivelle de l’arbre dans le corps.', 'Supports the crank end of the shaft in the housing.',
      'Acier 100Cr6', '100Cr6 steel', 'Tournage, trempe, rectification', 'Turning, hardening, grinding'),
    P('circlipsInt45', 'fix', 'CS-Circlips-Int-45-Livr', 1, 'Circlips intérieur Ø45', 'Ø45 internal circlip',
      'Arrête axialement le roulement 35×47 dans son logement.', 'Holds the 35×47 bearing axially in its bore.',
      'Acier à ressort', 'Spring steel', 'Découpage + trempe', 'Blanking + hardening'),
    P('roulement1228', 'trans', 'CS-Roulement-12-28-Livr', 1, 'Roulement 12×28 (avant)', '12×28 front bearing',
      'Guide l’extrémité avant de l’arbre dans le nez du corps.', 'Supports the front end of the shaft in the housing nose.',
      'Acier 100Cr6', '100Cr6 steel', 'Tournage, trempe, rectification', 'Turning, hardening, grinding'),
    P('jointSPI', 'carter', 'CS-Joint-SPI-Livr', 1, 'Joint à lèvre (SPI)', 'Lip seal (shaft seal)',
      'Rend étanche la sortie de l’arbre tournant : ni fluide frigorigène ni huile ne s’échappent.', 'Seals the rotating shaft exit so neither refrigerant nor oil escapes.',
      'Élastomère HNBR + armature acier', 'HNBR elastomer + steel case', 'Moulage + sertissage', 'Moulding + crimping'),
    P('circlips10', 'fix', 'CS-Circlips-Ext-10-Livr', 1, 'Circlips extérieur Ø10', 'Ø10 external circlip',
      'Arrête axialement le roulement avant sur l’arbre.', 'Locates the front bearing on the shaft.',
      'Acier à ressort', 'Spring steel', 'Découpage + trempe', 'Blanking + hardening'),
    P('jointCouvercle', 'carter', 'CS-Joint-Torique-Couvercle', 1, 'Joint torique de couvercle', 'Rear head O-ring',
      'Étanchéité entre le couvercle et la volute fixe (sépare haute et basse pression).', 'Seals between rear head and fixed scroll (separates high and low pressure).',
      'Élastomère HNBR', 'HNBR elastomer', 'Moulage par compression', 'Compression moulding'),
    P('grandJoint', 'carter', 'CS-Grand-Joint-Torique-Livr', 1, 'Grand joint torique', 'Large O-ring',
      'Étanchéité entre la volute fixe et le corps.', 'Seals between the fixed scroll and the housing.',
      'Élastomère HNBR', 'HNBR elastomer', 'Moulage par compression', 'Compression moulding'),
    P('jointMetal', 'carter', 'CS-Joint-Metal-Livr', 1, 'Joint métallique', 'Metal gasket',
      'Joint plat entre le corps et le couvercle, serré par les vis.', 'Flat gasket between housing and rear head, clamped by the bolts.',
      'Acier revêtu d’élastomère', 'Rubber-coated steel', 'Découpage', 'Blanking'),
    P('electro', 'clutch', 'CS-Electro-Aimant-Livr', 1, 'Électro-aimant (bobine)', 'Electromagnet (field coil)',
      'Alimentée en 12 V, la bobine crée un champ magnétique qui colle le plateau d’embrayage contre la poulie.',
      'Powered with 12 V, the coil creates a magnetic field that pulls the clutch plate against the pulley.',
      'Fil de cuivre émaillé + carcasse en acier doux', 'Enamelled copper wire + low-carbon steel shell',
      'Bobinage + emboutissage + surmoulage résine', 'Winding + deep drawing + resin potting'),
    P('circlips46', 'fix', 'CS-Circlips-Ext-46-Livr', 1, 'Circlips extérieur Ø46', 'Ø46 external circlip',
      'Arrête axialement la bobine sur le nez du corps.', 'Locates the coil on the housing nose.',
      'Acier à ressort', 'Spring steel', 'Découpage + trempe', 'Blanking + hardening'),
    P('roulement3552', 'clutch', 'CS-Roulmt-35-52-Livr', 1, 'Roulement de poulie 35×52', '35×52 pulley bearing',
      'Laisse la poulie tourner librement sur le nez du corps, même quand le compresseur est à l’arrêt.', 'Lets the pulley spin freely on the housing nose, even when the compressor is stopped.',
      'Acier 100Cr6, double rangée de billes', '100Cr6 steel, double-row ball bearing', 'Tournage, trempe, rectification', 'Turning, hardening, grinding'),
    P('circlips33', 'fix', 'CS-Circlips-Ext33-Livr', 1, 'Circlips extérieur Ø33', 'Ø33 external circlip',
      'Arrête le roulement de poulie sur le nez du corps.', 'Locates the pulley bearing on the housing nose.',
      'Acier à ressort', 'Spring steel', 'Découpage + trempe', 'Blanking + hardening'),
    P('poulie', 'clutch', 'CS-Poulie-Friction-Livr', 1, 'Poulie à friction (poly-V)', 'Friction pulley (poly-V)',
      'Entraînée en permanence par la courroie du moteur. Sa face avant sert de surface de friction pour le plateau.',
      'Always driven by the engine belt. Its front face is the friction surface for the clutch plate.',
      'Acier doux (conduit le champ magnétique)', 'Low-carbon steel (carries the magnetic flux)',
      'Emboutissage ou forgeage + tournage des gorges', 'Pressing or forging + turning of the grooves'),
    P('rondelle', 'clutch', 'CS-Grande-Rondelle-Livr', 1, 'Grande rondelle (cale)', 'Shim washer',
      'Règle l’entrefer entre plateau et poulie (quelques dixièmes de mm).', 'Sets the air gap between plate and pulley (a few tenths of a mm).',
      'Acier', 'Steel', 'Découpage + rectification', 'Blanking + grinding'),
    P('embrayage', 'clutch', 'CS-Embrayage-Livr', 1, 'Plateau d’embrayage', 'Clutch plate (armature)',
      'Fixé sur l’arbre. Attiré par l’aimant, il est entraîné par la poulie et fait tourner l’arbre. Des lames-ressorts le rappellent.',
      'Fixed to the shaft. Pulled by the magnet, it is driven by the pulley and turns the shaft. Leaf springs pull it back.',
      'Acier doux + lames-ressorts + moyeu', 'Low-carbon steel + leaf springs + hub', 'Emboutissage + rivetage', 'Pressing + riveting'),
    P('ecrou', 'fix', 'CS-Ecrou-M8', 1, 'Écrou M8', 'M8 nut',
      'Serre le plateau d’embrayage sur l’arbre.', 'Clamps the clutch plate onto the shaft.',
      'Acier classe 8', 'Class 8 steel', 'Frappe à froid + taraudage', 'Cold forming + tapping'),
    P('visCouvercle', 'fix', 'CS-Vis-M8x32-Livr', 4, 'Vis M8×32', 'M8×32 bolts',
      'Assemblent le couvercle sur le corps en serrant le joint métallique.', 'Clamp the rear head onto the housing over the metal gasket.',
      'Acier classe 8.8 zingué', 'Zinc-plated class 8.8 steel', 'Frappe à froid + roulage', 'Cold heading + thread rolling'),
    P('visM6', 'fix', 'CS-Vis M6x22-Livr / CS-VIS-M6x16-Livr', 6, 'Vis M6×22 et M6×16', 'M6×22 and M6×16 screws',
      'Fixent l’avant du corps et les accessoires.', 'Hold the front of the housing and the accessories.',
      'Acier classe 8.8 zingué', 'Zinc-plated class 8.8 steel', 'Frappe à froid + roulage', 'Cold heading + thread rolling'),
    P('capteur', 'fix', 'CS-Capteur-Livr', 1, 'Capteur de température', 'Fail-safe temperature sensor',
      'Surveille la température. En cas de surchauffe, il coupe l’alimentation de la bobine et donc le compresseur.',
      'Monitors temperature. If the compressor overheats it cuts power to the coil, which stops the compressor.',
      'Boîtier polymère + élément thermosensible', 'Polymer housing + thermal element', 'Injection plastique + assemblage', 'Injection moulding + assembly'),
    P('visCHC', 'fix', 'CS-Vis-CHC-M4x16', 1, 'Vis CHC M4×16', 'M4×16 socket head screw',
      'Fixe le capteur sur le corps.', 'Holds the sensor on the housing.',
      'Acier classe 12.9', 'Class 12.9 steel', 'Frappe à froid + roulage', 'Cold heading + thread rolling'),
    P('gicleur', 'fix', 'CS-Vis Gicleur M10x10-Livr', 1, 'Vis gicleur M10×10', 'M10×10 jet screw',
      'Calibre ou bouche le passage d’huile de lubrification.', 'Meters or plugs the lubricating oil passage.',
      'Acier ou laiton', 'Steel or brass', 'Décolletage', 'Bar turning'),
    P('bouchon', 'fix', 'CS-VisM20x10-Livr', 1, 'Bouchon M20×10', 'M20×10 plug',
      'Bouchon de remplissage ou de vidange d’huile.', 'Oil filler or drain plug.',
      'Acier', 'Steel', 'Décolletage', 'Bar turning')
  ];
  SC.partById = {}; SC.PARTS.forEach(p => SC.partById[p.id] = p);

  // Décalages de la vue éclatée (cm), dans l’ordre de l’éclaté linéaire CATIA
  const EX = {
    visCouvercle: [0, -21, 0], couvercle: [0, -15, 0], bouchon: [0, -15, -5], visClapet: [0, -11.5, 0], clapetRigide: [0, -10.2, 0],
    clapetSouple: [0, -8.9, 0], jointMetal: [0, -7.2, 0], jointCouvercle: [0, -6.0, 0], voluteFixe: [0, -3.2, 0], grandJoint: [0, -1.4, 0],
    voluteMobile: [0, 2.8, 0], feuilleVM: [0, 4.2, 0], billes: [0, 5.2, 0], rondGuide: [0, 6.1, 0], feuilleVF: [0, 7.0, 0], patins: [0, 7.8, 0],
    roulementExc: [0, 9.0, 0], masselotte: [0, 10.4, 0], axe: [0, 12.5, 0], masseInertie: [0, 11.6, 0], roulement3547: [0, 14.6, 0],
    circlipsInt45: [0, 15.6, 0], corps: [0, 21, 0], capteur: [5, 21, 0], visCHC: [7.5, 21, 0], gicleur: [-5, 21, 0], visM6: [0, 29, 0],
    jointSPI: [0, 26.5, 0], roulement1228: [0, 28.0, 0], circlips10: [0, 29.2, 0], electro: [0, 31.5, 0], circlips46: [0, 33.5, 0],
    roulement3552: [0, 35.0, 0], circlips33: [0, 36.6, 0], poulie: [0, 39.5, 0], rondelle: [0, 42.5, 0], embrayage: [0, 44.5, 0], ecrou: [0, 47.5, 0]
  };
  // repères : ordre de l’éclaté, de l’arrière (couvercle) vers l’avant (embrayage)
  SC.REP = {}; SC.PARTS.slice().sort((a, b) => (EX[a.id] || [0, 0])[1] - (EX[b.id] || [0, 0])[1] || (EX[a.id][0] - EX[b.id][0])).forEach((p, i) => SC.REP[p.id] = i + 1);
  // mouvement pendant le fonctionnement
  const MOTION = { axe: 'shaft', masseInertie: 'shaft', embrayage: 'clutch', ecrou: 'clutch', rondelle: 'clutch', voluteMobile: 'orbit', feuilleVM: 'orbit',
    roulementExc: 'orbit', masselotte: 'pin', billes: 'half', poulie: 'pulley', circlips10: 'shaft' };

  // ---------- Construction 3D ----------
  SC.build = function (THREE) {
    const D = THREE.DoubleSide;
    const S = (c, m, r, x) => new THREE.MeshStandardMaterial(Object.assign({ color: c, metalness: m, roughness: r, side: D }, x || {}));
    const M = {
      cast: S(0xa9b1b8, 0.6, 0.48), alu: S(0xcdd3d8, 0.8, 0.32), scroll: S(0xc3cad0, 0.85, 0.26), orbit: S(0xd9b56d, 0.8, 0.3),
      steel: S(0xa2abb3, 1, 0.24), dark: S(0x3a4047, 0.7, 0.42), black: S(0x17191c, 0.45, 0.5), copper: S(0xc8763a, 1, 0.32),
      rubber: S(0x1d1f22, 0, 0.9), zinc: S(0xdfe4e8, 0.9, 0.28), brass: S(0xc9a34c, 1, 0.3), plastic: S(0x2a2e33, 0.05, 0.55),
      hole: S(0x0b0c0e, 0, 1), wire: S(0x111214, 0, 0.7)
    };
    const root = new THREE.Group();
    const V2 = (p) => new THREE.Vector2(p[0], p[1]);
    const mesh = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; return m; };
    const lathe = (prof, seg, ps, pl) => new THREE.LatheGeometry(prof.map(V2), seg || 72, ps || 0, pl === undefined ? Math.PI * 2 : pl);
    const ring = (r0, r1, y0, y1, seg) => lathe([[r0, y0], [r1, y0], [r1, y1], [r0, y1], [r0, y0]], seg);
    const cyl = (r, y0, y1, seg) => { const g = new THREE.CylinderGeometry(r, r, y1 - y0, seg || 48); g.translate(0, (y0 + y1) / 2, 0); return g; };
    const torus = (R, r, y) => { const g = new THREE.TorusGeometry(R, r, 12, 96); g.rotateX(Math.PI / 2); g.translate(0, y, 0); return g; };
    const hex = (s, h) => new THREE.CylinderGeometry(s, s, h, 6);
    function bolt(g, x, y, z, dir, headS, headH, len, r, mat) {
      const b = new THREE.Group();
      const h = mesh(hex(headS, headH), mat); h.position.y = headH / 2; b.add(h);
      const sh = mesh(cyl(r, headH, headH + len, 20), mat); b.add(sh);
      b.position.set(x, y, z); if (dir < 0) b.rotation.x = Math.PI; g.add(b); return b;
    }
    function bearing(g, r0, r1, y0, y1, nb, mat) {
      const w = (r1 - r0) * 0.28;
      g.add(mesh(ring(r0, r0 + w, y0, y1), mat)); g.add(mesh(ring(r1 - w, r1, y0, y1), mat));
      g.add(mesh(ring(r0 + w, r1 - w, y1 - 0.04, y1 - 0.02), M.dark));
      const rb = (r1 - r0) / 2 * 0.62, rc = (r0 + r1) / 2;
      const sg = new THREE.SphereGeometry(rb, 14, 10);
      for (let i = 0; i < nb; i++) { const a = i / nb * Math.PI * 2; const s = mesh(sg, M.steel); s.position.set(Math.cos(a) * rc, (y0 + y1) / 2, Math.sin(a) * rc); g.add(s); }
    }
    function circlip(g, r0, r1, y, mat) {
      const geo = lathe([[r0, y], [r1, y], [r1, y + 0.08], [r0, y + 0.08], [r0, y]], 48, 0.35, Math.PI * 2 - 0.7);
      g.add(mesh(geo, mat || M.dark));
      for (const a of [0.35, -0.35]) { const e = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 10), mat || M.dark); e.position.set(Math.cos(a) * (r1 + 0.08), y + 0.04, -Math.sin(a) * (r1 + 0.08)); g.add(e); }
    }
    const parts = {};
    function part(id, fn) { const g = new THREE.Group(); g.userData.partId = id; fn(g); root.add(g); parts[id] = { id, g, ex: new THREE.Vector3().fromArray(EX[id] || [0, 0, 0]), motion: MOTION[id] || 'static' }; }

    // ----- spirales -----
    const shapeFrom = (pts, sign) => { const s = new THREE.Shape(); pts.forEach((p, i) => i ? s.lineTo(sign * p[0], sign * p[1]) : s.moveTo(sign * p[0], sign * p[1])); s.closePath(); return s; };
    const wall = SC.wallOutline(520);
    const H = 2.4;
    const extr = (sign) => { const g = new THREE.ExtrudeGeometry(shapeFrom(wall, sign), { depth: H, bevelEnabled: false, curveSegments: 1, steps: 1 }); g.rotateX(-Math.PI / 2); return g; };

    part('voluteFixe', g => {
      g.add(mesh(cyl(5.25, 3.1, 3.9, 96), M.scroll));
      const w = mesh(extr(1), M.scroll); w.position.y = 3.9; g.add(w);
      g.add(mesh(lathe([[4.98, 3.9], [5.25, 3.9], [5.25, 6.3], [4.98, 6.3], [4.98, 3.9]], 96, 0.5, Math.PI * 2 - 0.95), M.scroll));
      const port = mesh(cyl(0.2, 3.901, 3.93, 24), M.hole); port.position.set(0.12, 0, -0.05); g.add(port);
    });
    part('voluteMobile', g => {
      const w = mesh(extr(-1), M.orbit); w.position.y = 3.9; g.add(w);
      g.add(mesh(cyl(4.45, 6.3, 6.9, 96), M.orbit));
      g.add(mesh(ring(1.0, 1.3, 6.9, 7.75), M.orbit));
    });
    // ----- couvercle -----
    part('couvercle', g => {
      g.add(mesh(lathe([[0, -0.1], [5.45, -0.1], [5.8, 0.25], [5.8, 3.0], [5.3, 3.0], [5.3, 0.55], [0, 0.55]], 96), M.cast));
      for (let i = 0; i < 16; i++) { const b = mesh(new THREE.BoxGeometry(0.22, 2.4, 0.5), M.cast); const a = i / 16 * Math.PI * 2 + 0.2; b.position.set(Math.cos(a) * 5.85, 1.45, Math.sin(a) * 5.85); b.rotation.y = -a; g.add(b); }
      for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; const e = mesh(cyl(0.75, 2.2, 3.0, 24), M.cast); e.position.set(Math.cos(a) * 6.15, 0, Math.sin(a) * 6.15); g.add(e); }
      const suc = mesh(new THREE.CylinderGeometry(1.05, 1.15, 1.8, 32), M.cast); suc.rotation.z = Math.PI / 2; suc.position.set(6.4, 1.4, 1.6); g.add(suc);
      const sh = mesh(new THREE.CircleGeometry(0.62, 28), M.hole); sh.rotation.y = Math.PI / 2; sh.position.set(7.31, 1.4, 1.6); g.add(sh);
      const dis = mesh(new THREE.CylinderGeometry(0.8, 0.9, 1.6, 32), M.cast); dis.rotation.z = Math.PI / 2; dis.position.set(6.3, 1.4, -1.9); g.add(dis);
      const dh = mesh(new THREE.CircleGeometry(0.42, 28), M.hole); dh.rotation.y = Math.PI / 2; dh.position.set(7.11, 1.4, -1.9); g.add(dh);
      const ribB = mesh(cyl(2.2, -0.35, -0.1, 48), M.cast); g.add(ribB);
    });
    part('bouchon', g => { const h = mesh(hex(0.75, 0.5), M.steel); h.rotation.x = Math.PI / 2; h.position.set(0, 1.5, -6.05); g.add(h); const f = mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.12, 32), M.steel); f.rotation.x = Math.PI / 2; f.position.set(0, 1.5, -5.75); g.add(f); });
    part('visCouvercle', g => { for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; bolt(g, Math.cos(a) * 6.15, 2.2, Math.sin(a) * 6.15, -1, 0.55, 0.55, 3.2, 0.4, M.zinc); } });
    part('clapetSouple', g => { const b = mesh(new THREE.BoxGeometry(2.4, 0.04, 0.55), M.steel); b.position.set(1.0, 3.06, 0); g.add(b); });
    part('clapetRigide', g => { const b = mesh(new THREE.BoxGeometry(2.4, 0.22, 0.6), M.dark); b.position.set(1.0, 2.91, 0); b.rotation.z = 0.06; g.add(b); });
    part('visClapet', g => { bolt(g, 2.0, 2.8, 0, -1, 0.3, 0.28, 0.8, 0.2, M.zinc); });
    part('jointCouvercle', g => g.add(mesh(torus(5.05, 0.1, 3.05), M.rubber)));
    part('jointMetal', g => g.add(mesh(ring(5.3, 6.2, 3.0, 3.06, 96), M.dark)));
    part('grandJoint', g => g.add(mesh(torus(5.15, 0.1, 3.55), M.rubber)));
    // ----- anti-rotation -----
    part('feuilleVM', g => g.add(mesh(ring(1.9, 4.2, 6.9, 6.95, 72), M.steel)));
    part('billes', g => { const sg = new THREE.SphereGeometry(0.24, 20, 14); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; const s = mesh(sg, M.steel); s.position.set(Math.cos(a) * 3.1, 7.19, Math.sin(a) * 3.1); g.add(s); } });
    part('rondGuide', g => { g.add(mesh(ring(2.3, 3.9, 7.0, 7.38, 72), M.dark)); });
    part('feuilleVF', g => g.add(mesh(ring(1.9, 4.2, 7.43, 7.48, 72), M.steel)));
    part('patins', g => { for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + 0.2; const b = mesh(new THREE.BoxGeometry(0.7, 0.18, 0.45), M.plastic); b.position.set(Math.cos(a) * 4.6, 7.58, Math.sin(a) * 4.6); b.rotation.y = -a; g.add(b); } });
    // ----- arbre -----
    part('roulementExc', g => bearing(g, 0.66, 1.0, 6.95, 7.7, 14, M.steel));
    part('masselotte', g => {
      g.add(mesh(ring(0.4, 0.66, 6.95, 7.72, 32), M.dark));
      g.add(mesh(lathe([[0.4, 7.76], [1.25, 7.76], [1.25, 8.0], [0.4, 8.0], [0.4, 7.76]], 32, Math.PI * 0.5, Math.PI), M.dark));
    });
    part('axe', g => {
      const pin = mesh(cyl(0.4, 6.95, 8.05, 24), M.steel); pin.position.x = ORB; g.add(pin);
      g.add(mesh(cyl(1.75, 8.05, 8.65, 64), M.steel));
      g.add(mesh(cyl(0.85, 8.65, 13.5, 40), M.steel));
      g.add(mesh(cyl(0.6, 13.5, 18.3, 32), M.steel));
      g.add(mesh(cyl(0.4, 18.3, 18.95, 20), M.steel));
      const key = mesh(new THREE.BoxGeometry(0.2, 0.9, 0.3), M.steel); key.position.set(0.6, 17.6, 0); g.add(key);
    });
    part('masseInertie', g => { g.add(mesh(lathe([[0.85, 8.75], [3.1, 8.75], [3.1, 9.15], [0.85, 9.15], [0.85, 8.75]], 48, Math.PI * 0.5, Math.PI), M.dark)); });
    part('roulement3547', g => bearing(g, 1.75, 2.35, 8.05, 8.65, 22, M.steel));
    part('circlipsInt45', g => circlip(g, 2.2, 2.45, 8.7));
    // ----- corps -----
    part('corps', g => {
      g.add(mesh(lathe([[5.3, 3.06], [5.8, 3.06], [5.8, 11.6], [5.3, 12.5], [4.3, 12.95], [2.6, 13.2], [1.75, 13.3], [1.75, 17.0], [1.4, 17.0], [1.4, 13.6], [2.4, 13.0], [4.0, 12.3], [5.3, 11.5], [5.3, 3.06]], 120), M.cast));
      g.add(mesh(ring(2.35, 5.3, 7.7, 8.7, 96), M.cast));
      for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; const e = mesh(cyl(0.75, 3.06, 3.9, 24), M.cast); e.position.set(Math.cos(a) * 6.15, 0, Math.sin(a) * 6.15); g.add(e); const r = mesh(new THREE.BoxGeometry(0.9, 0.84, 0.8), M.cast); r.position.set(Math.cos(a) * 5.7, 3.48, Math.sin(a) * 5.7); r.rotation.y = -a; g.add(r); }
      for (const s of [1, -1]) { // pattes de fixation moteur
        const lug = mesh(new THREE.BoxGeometry(1.6, 1.5, 1.6), M.cast); lug.position.set(-6.2, s > 0 ? 10.2 : 5.0, 0); g.add(lug);
        const bos = mesh(new THREE.CylinderGeometry(0.95, 0.95, 4.2, 28), M.cast); bos.rotation.x = Math.PI / 2; bos.position.set(-6.9, s > 0 ? 10.2 : 5.0, 0); g.add(bos);
        const hol = mesh(new THREE.CircleGeometry(0.45, 24), M.hole); hol.position.set(-6.9, s > 0 ? 10.2 : 5.0, 2.11); g.add(hol);
      }
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3; const b = mesh(cyl(0.55, 12.0, 12.9, 20), M.cast); b.position.set(Math.cos(a) * 4.7, 0, Math.sin(a) * 4.7); g.add(b); }
      // étiquette HFC134a
      if (typeof document !== 'undefined') {
        const c = document.createElement('canvas'); c.width = 512; c.height = 256; const x = c.getContext('2d');
        x.fillStyle = '#f1f1ee'; x.fillRect(0, 0, 512, 256); x.strokeStyle = '#333'; x.lineWidth = 4; x.strokeRect(6, 6, 500, 244);
        x.fillStyle = '#222'; x.font = 'bold 64px Arial'; x.fillText('HFC134a', 150, 92); x.font = '28px Arial'; x.fillText('SCROLL A/C COMPRESSOR', 70, 150);
        x.font = '22px monospace'; x.fillText('OIL: PAG  ·  12 V DC', 120, 200);
        const tex = new THREE.CanvasTexture(c);
        const lab = mesh(new THREE.CylinderGeometry(5.83, 5.83, 2.6, 48, 1, true, -0.55, 1.1), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, metalness: 0, side: D }));
        lab.position.y = 8.6; lab.rotation.y = Math.PI / 2; g.add(lab);
      }
    });
    part('visM6', g => { for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.3; bolt(g, Math.cos(a) * 4.7, 12.9, Math.sin(a) * 4.7, 1, 0.42, 0.4, 0.2, 0.3, M.zinc); } });
    part('capteur', g => {
      const b = mesh(new THREE.BoxGeometry(0.9, 1.4, 1.1), M.plastic); b.position.set(6.2, 9.6, 2.6); g.add(b);
      const tab = mesh(new THREE.BoxGeometry(0.15, 0.8, 2.0), M.steel); tab.position.set(5.85, 9.6, 2.4); g.add(tab);
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(6.3, 10.3, 2.6), new THREE.Vector3(6.6, 11.8, 2.2), new THREE.Vector3(6.2, 13.4, 1.0), new THREE.Vector3(4.3, 14.2, 0.6)]);
      g.add(mesh(new THREE.TubeGeometry(curve, 40, 0.07, 8, false), M.wire));
      const c2 = new THREE.CatmullRomCurve3([new THREE.Vector3(6.4, 10.3, 2.8), new THREE.Vector3(6.9, 12.0, 2.6), new THREE.Vector3(7.2, 13.0, 3.6)]);
      g.add(mesh(new THREE.TubeGeometry(c2, 30, 0.07, 8, false), M.wire));
    });
    part('visCHC', g => { const b = bolt(g, 6.05, 9.0, 2.4, 1, 0.22, 0.3, 0.6, 0.16, M.dark); b.rotation.z = -Math.PI / 2; });
    part('gicleur', g => { const h = mesh(hex(0.55, 0.45), M.brass); h.rotation.z = Math.PI / 2; h.position.set(-5.95, 7.4, 3.2); g.add(h); });
    // ----- nez : étanchéité, roulements -----
    part('jointSPI', g => { g.add(mesh(ring(0.62, 1.4, 13.65, 14.05, 48), M.rubber)); g.add(mesh(ring(1.2, 1.4, 13.65, 14.05, 48), M.steel)); });
    part('roulement1228', g => bearing(g, 0.6, 1.4, 16.1, 16.75, 9, M.steel));
    part('circlips10', g => circlip(g, 0.6, 0.78, 16.8));
    // ----- embrayage -----
    part('electro', g => {
      g.add(mesh(lathe([[2.0, 13.25], [4.05, 13.25], [4.05, 15.25], [3.75, 15.25], [3.75, 13.55], [2.3, 13.55], [2.3, 15.25], [2.0, 15.25], [2.0, 13.25]], 96), M.dark));
      g.add(mesh(ring(2.3, 3.75, 13.55, 15.1, 96), M.copper));
      const plug = mesh(new THREE.BoxGeometry(0.8, 0.5, 0.6), M.plastic); plug.position.set(4.2, 13.6, 0.3); g.add(plug);
    });
    part('circlips46', g => circlip(g, 1.75, 2.05, 15.32));
    part('roulement3552', g => bearing(g, 1.75, 2.62, 15.45, 16.55, 16, M.steel));
    part('circlips33', g => circlip(g, 1.62, 1.9, 16.62));
    part('poulie', g => {
      const prof = [[2.62, 15.4], [3.0, 15.4], [3.0, 13.4], [4.15, 13.4]];
      for (let i = 0; i <= 12; i++) prof.push([i % 2 ? 5.15 : 5.45, 13.4 + i * 0.25]);
      prof.push([5.45, 16.95], [2.62, 16.95], [2.62, 15.4]);
      g.add(mesh(lathe(prof, 120), M.black));
      for (let k = 0; k < 2; k++) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + k * 0.5; const s = mesh(lathe([[k ? 4.35 : 3.4, 16.955], [k ? 4.9 : 4.0, 16.955]], 2, a, 0.38), M.hole); g.add(s); }
    });
    part('rondelle', g => g.add(mesh(ring(0.6, 1.05, 16.98, 17.05, 32), M.steel)));
    part('embrayage', g => {
      g.add(mesh(ring(1.05, 5.1, 17.0, 17.3, 120), M.black));
      g.add(mesh(lathe([[0.6, 17.05], [1.05, 17.05], [1.05, 17.3], [1.6, 17.3], [1.6, 17.9], [1.2, 18.3], [0.6, 18.3], [0.6, 17.05]], 48), M.dark));
      for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2; const sp = mesh(new THREE.BoxGeometry(3.2, 0.08, 0.7), M.dark); sp.position.set(Math.cos(a) * 2.7, 17.36, Math.sin(a) * 2.7); sp.rotation.y = -a + 0.9; g.add(sp); }
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + 0.2; const r = mesh(cyl(0.32, 17.3, 17.48, 20), M.zinc); r.position.set(Math.cos(a) * (i % 2 ? 2.2 : 3.9), 0, Math.sin(a) * (i % 2 ? 2.2 : 3.9)); g.add(r); }
    });
    part('ecrou', g => { const n = mesh(hex(0.62, 0.5), M.zinc); n.position.y = 18.55; g.add(n); });

    // materials per part (for highlight)
    Object.values(parts).forEach(p => { p.g.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.userData.partId = p.id; o.userData.baseEmissive = o.material.emissive.getHex(); } }); });

    const state = { explode: 0, theta: 0, pulley: 0, gap: 0.25, spread: 0.62 };
    const tmp = new THREE.Vector3();
    function apply() {
      const th = state.theta, ox = ORB * Math.cos(th), oz = -ORB * Math.sin(th);
      for (const id in parts) {
        const p = parts[id]; const g = p.g;
        const e = (state.per && id in state.per) ? state.per[id] : state.explode;
        g.visible = !(state.hidden && state.hidden[id]);
        tmp.copy(p.ex).multiplyScalar(e * state.spread);
        g.position.copy(tmp); g.rotation.set(0, 0, 0);
        switch (p.motion) {
          case 'shaft': g.rotation.y = th; break;
          case 'clutch': g.rotation.y = th; g.position.y += state.gap; break;
          case 'orbit': g.position.x += ox; g.position.z += oz; break;
          case 'pin': g.position.x += ox; g.position.z += oz; g.rotation.y = th; break;
          case 'half': g.position.x += ox / 2; g.position.z += oz / 2; break;
          case 'pulley': g.rotation.y = state.pulley; break;
        }
      }
      // l’axe tourne autour de son centre : le maneton suit l’orbite
    }
    apply();
    function highlight(id, color) {
      for (const k in parts) parts[k].g.traverse(o => { if (o.isMesh) { o.material.emissive.setHex(k === id ? color : o.userData.baseEmissive); o.material.emissiveIntensity = k === id ? 0.55 : 1; } });
    }
    function setOpacity(fn) { // fn(id) -> opacity
      for (const k in parts) { const op = fn(k); parts[k].g.traverse(o => { if (o.isMesh) { o.material.transparent = op < 1; o.material.opacity = op; o.material.depthWrite = op >= 1; } }); }
    }
    function setClip(planes) { for (const k in parts) parts[k].g.traverse(o => { if (o.isMesh) o.material.clippingPlanes = planes; }); }
    return { root, parts, state, apply, highlight, setOpacity, setClip, materials: M };
  };

  // ---------- Rendu 2D des poches (détection des poches par remplissage) ----------
  SC.makePocketRenderer = function (N) {
    N = N || 200;
    const R = 5.35, px = 2 * R / N;
    const cv = (typeof document !== 'undefined') ? document.createElement('canvas') : null; if (cv) { cv.width = N; cv.height = N; }
    const cx = cv && cv.getContext('2d'); const img = cx && cx.createImageData(N, N);
    const lab = new Int32Array(N * N), wallM = new Uint8Array(N * N), q = new Int32Array(N * N);
    const pre = new Float32Array(N * N * 3); // u, psi, rho
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = -R + (i + 0.5) * px, y = R - (j + 0.5) * px, k = j * N + i; pre[k * 3] = x; pre[k * 3 + 1] = y; pre[k * 3 + 2] = Math.hypot(x, y); }
    const dl = 0.035, TWO = Math.PI * 2;
    function inWall(x, y) {
      const rho = Math.hypot(x, y), u2 = (rho / A) ** 2 - 1; if (u2 <= 0) return false;
      const u = Math.sqrt(u2), psi = Math.atan2(y, x);
      let al = psi - (u - Math.atan(u)); al = ((al + BETA + dl) % TWO + TWO) % TWO - BETA - dl;
      if (al > BETA + dl) return false; const phi = u + al; return phi >= PHI0 - 0.02 && phi <= PHI1 + 0.02;
    }
    function compute(theta) {
      const ox = ORB * Math.cos(theta), oy = ORB * Math.sin(theta);
      for (let k = 0; k < N * N; k++) {
        const x = pre[k * 3], y = pre[k * 3 + 1], rho = pre[k * 3 + 2];
        let w = 0; if (rho > SC.geo.rimOut) w = 3; else if (rho > SC.geo.rimIn) w = isGapOpen(k) ? 0 : 2; else if (inWall(x, y)) w = 1; else if (inWall(-(x - ox), -(y - oy))) w = 1;
        wallM[k] = w; lab[k] = -1;
      }
      // remplissage 4-connexe
      const regions = []; let nreg = 0;
      for (let s = 0; s < N * N; s++) {
        if (wallM[s] || lab[s] >= 0) continue;
        let h = 0, t = 0; q[t++] = s; lab[s] = nreg; let area = 0, open = false, sr = 0;
        while (h < t) { const k = q[h++]; area++; const i = k % N, j = (k / N) | 0; sr += pre[k * 3 + 2];
          const nb = [i > 0 ? k - 1 : -1, i < N - 1 ? k + 1 : -1, j > 0 ? k - N : -1, j < N - 1 ? k + N : -1];
          for (const n of nb) { if (n < 0 || wallM[n] === 3) { open = true; continue; } if (wallM[n]) continue; if (lab[n] < 0) { lab[n] = nreg; q[t++] = n; } } }
        regions.push({ area, open, mr: sr / area }); nreg++;
      }
      return regions;
    }
    // ouverture d’aspiration dans la jante (angle 0.5 rad autour de 0 côté x+)
    function isGapOpen(n) { const x = pre[n * 3], y = pre[n * 3 + 1]; const a = Math.atan2(-y, x); return Math.abs(a) < 0.47; }
    function pressureOf(regions) {
      let inner = -1, minr = 1e9; regions.forEach((r, i) => { if (r.mr < minr && r.area > 4) { minr = r.mr; inner = i; } });
      return regions.map((r, i) => {
        if (r.open) return 0; if (i === inner) return 1;
        // une poche fermée est d’autant plus comprimée qu’elle est proche du centre
        return Math.max(0.25, Math.min(0.88, 1.05 - 0.3 * Math.round(r.mr / (2 * Math.PI * A))));
      });
    }
    const hexToRgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    const wallPts = SC.wallOutline(360);
    function path(ctx, s, c, sign, ox, oy) { ctx.beginPath(); wallPts.forEach((p, i) => { const X = c + (sign * p[0] + ox) * s, Y = c - (sign * p[1] + oy) * s; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.closePath(); }
    function draw(ctx, size, theta, o) {
      const regions = compute(theta), pr = pressureOf(regions);
      const lp = hexToRgb(o.lp), hp = hexToRgb(o.hp), mid = hexToRgb(o.mid || '#b06ad8');
      const d = img.data;
      for (let k = 0; k < N * N; k++) {
        const l = lab[k]; let c = null, al = 255;
        if (wallM[k] === 0 && l >= 0) { const p = pr[l]; c = p < 0.5 ? lp.map((v, z) => v + (mid[z] - v) * p * 2) : mid.map((v, z) => v + (hp[z] - v) * (p - 0.5) * 2); }
        if (!c) { d[k * 4 + 3] = 0; continue; }
        d[k * 4] = c[0]; d[k * 4 + 1] = c[1]; d[k * 4 + 2] = c[2]; d[k * 4 + 3] = al;
      }
      cx.putImageData(img, 0, 0);
      const s = size / (2 * R), c0 = size / 2;
      ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(cv, 0, 0, size, size);
      // jante
      ctx.fillStyle = o.fixed; ctx.beginPath(); ctx.arc(c0, c0, SC.geo.rimOut * s, 0.47, TWO - 0.47); ctx.arc(c0, c0, SC.geo.rimIn * s, TWO - 0.47, 0.47, true); ctx.closePath(); ctx.fill();
      const ox = ORB * Math.cos(theta), oy = ORB * Math.sin(theta);
      ctx.lineJoin = 'round';
      path(ctx, s, c0, 1, 0, 0); ctx.fillStyle = o.fixed; ctx.fill(); if (o.edge) { ctx.strokeStyle = o.edge; ctx.lineWidth = 1; ctx.stroke(); }
      path(ctx, s, c0, -1, ox, oy); ctx.fillStyle = o.mobile; ctx.fill(); if (o.edge) { ctx.strokeStyle = o.edge; ctx.lineWidth = 1; ctx.stroke(); }
      if (o.showOrbit) { ctx.strokeStyle = o.orbitColor || o.mobile; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(c0, c0, ORB * s, 0, TWO); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = o.orbitColor || o.mobile; ctx.beginPath(); ctx.arc(c0 + ox * s, c0 - oy * s, 3.5, 0, TWO); ctx.fill(); }
      ctx.restore();
      return regions.filter((r, i) => !r.open).length;
    }
    return { draw };
  };

  if (typeof window !== 'undefined') window.SC = SC;
})();
