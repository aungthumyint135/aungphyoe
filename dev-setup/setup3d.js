/* Battle Station 3D — Three.js scene, animated with GSAP.
   Scroll / drag = infinite orbit around the desk. Click a part = camera flies in + detail panel. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

gsap.registerPlugin(Observer);
const $ = (s, r = document) => r.querySelector(s);
const narrow = matchMedia('(max-width: 760px)');
const rnd = (k) => { const x = Math.sin(k * 127.1 + 1.7) * 43758.5453; return x - Math.floor(x); };

/* ================================================================ data */
const ITEMS = {
  aoc: {
    name: 'AOC 27"', cat: 'Main monitor · IDE', sub: '27-inch · centre screen', color: '#ff7a7a',
    tag: 'The big screen in the middle. The IDE lives here — file tree, tabs, the code for this scene typing itself, and the dev server in the terminal.',
    specs: { Brand: 'AOC', Size: '27"', Shows: 'Code editor + terminal', Stand: 'V-shaped base' },
    stats: { 'Code space': 95, Focus: 92, Colour: 85 },
  },
  monitor: {
    name: 'Dragon Touch 4K', cat: 'Portable monitor', sub: '15.6-inch · 4K UHD', color: '#d9a0ff',
    tag: 'Side screen on its folding smart cover, kept for Claude — ask, review, ship.',
    specs: { Size: '15.6"', Resolution: '3840 × 2160 (4K UHD)', Panel: 'IPS', Connection: 'USB-C · mini-HDMI', Shows: 'Claude chat' },
    stats: { Sharpness: 95, Portability: 90, Brightness: 70 },
  },
  laptop: {
    name: 'MacBook Air M1', cat: 'Laptop', sub: '13.3-inch · 2020', color: '#7aa2f7',
    tag: 'The brain of the setup, raised on a cooling stand. Runs the tests and the git history, and drives the other screens.',
    specs: { Chip: 'Apple M1 · 8-core CPU', GPU: '7 / 8-core', Memory: '8 GB / 16 GB unified', Display: '13.3" Retina 2560 × 1600', Battery: 'Up to 18 h', Cooling: 'Fanless' },
    stats: { Performance: 85, Battery: 95, Silence: 100 },
  },
  stand: {
    name: 'Laptop Cooling Stand', cat: 'Laptop stand', sub: 'Tilted deck · twin fans', color: '#7dcfb6',
    tag: 'Lifts the MacBook to eye level and blows air under it. Click it and the fans spin up.',
    specs: { Deck: 'Tilted mesh', Fans: '2 × cooling fans', Power: 'USB', Job: 'Keeps the fanless M1 cool' },
    stats: { Cooling: 80, Ergonomics: 92, Quietness: 85 },
  },
  keyboard: {
    name: 'AULA Transparent', cat: 'Mechanical keyboard', sub: 'Mechanical · see-through', color: '#9ece6a',
    tag: 'Clear case and clear keycaps — nice to type on through long coding sessions. Try typing on your real keyboard.',
    specs: { Type: 'Mechanical', Case: 'Transparent', Keycaps: 'Transparent', Backlight: 'Follows the desk lighting' },
    stats: { Typing_feel: 90, Looks: 95, Sound: 85 },
  },
  mouse: {
    name: 'Mouse', cat: 'Mouse', sub: 'Right-hand', color: '#e0af68',
    tag: 'On the right side of the big desk mat. Click it and it does a little spin.',
    specs: { Type: 'Mouse', Hand: 'Right', Surface: 'Dota 2 XL desk mat' },
    stats: { Precision: 90, Grip: 88, Comfort: 86 },
  },
  mousepad: {
    name: 'Dota 2 XL Desk Mat', cat: 'Extra-large desk mat', sub: 'Desk-size · Dota 2 print', color: '#f7768e',
    tag: 'Extra-large mat that fits the keyboard and the mouse, so the desk stays quiet and the wrists stay warm.',
    specs: { Size: 'Extra large (desk mat)', Print: 'Dota 2', Covers: 'Keyboard + mouse' },
    stats: { Coverage: 100, Glide: 88, Comfort: 92 },
  },
};
const ORDER = ['aoc', 'monitor', 'laptop', 'stand', 'keyboard', 'mouse', 'mousepad'];

/* ============================================================ renderer */
const canvas = $('#gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101217);
scene.fog = new THREE.Fog(0x101217, 34, 85);
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 200);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.3, 0.4, 0.92);
composer.addPass(bloom);
composer.addPass(new OutputPass());

/* ============================================================== lights */
scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x1a1410, 1.0));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.7);
keyLight.position.set(7, 20, 14);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
Object.assign(keyLight.shadow.camera, { left: -18, right: 18, top: 18, bottom: -8, near: 1, far: 70 });
keyLight.shadow.normalBias = 0.03;
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0xbfd0ff, 0.45);
rimLight.position.set(-12, 9, -10);
scene.add(rimLight);
const glowLight = new THREE.PointLight(0x7c4dff, 90, 0, 2);
glowLight.position.set(0, 10.5, -3.8);
scene.add(glowLight);

/* =========================================================== materials */
const M = {
  dark: new THREE.MeshStandardMaterial({ color: 0x191924, roughness: 0.42, metalness: 0.6 }),
  darker: new THREE.MeshStandardMaterial({ color: 0x0c0c13, roughness: 0.5, metalness: 0.5 }),
  desk: new THREE.MeshStandardMaterial({ color: 0x6b4a33, roughness: 0.55, metalness: 0.05 }), // walnut
  pad: new THREE.MeshStandardMaterial({ color: 0x0b0b12, roughness: 0.95, metalness: 0 }),
  floor: new THREE.MeshStandardMaterial({ color: 0x1a1b20, roughness: 0.85, metalness: 0.05 }),
  wall: new THREE.MeshStandardMaterial({ color: 0x23262e, roughness: 0.95, metalness: 0 }),
  board: new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.6, metalness: 0.3 }),
  cap: new THREE.MeshStandardMaterial({ color: 0x1b1b26, roughness: 0.5, metalness: 0.1 }),
  alu: new THREE.MeshStandardMaterial({ color: 0xc9ccd2, roughness: 0.32, metalness: 0.9 }),
  keywell: new THREE.MeshStandardMaterial({ color: 0x9a9da3, roughness: 0.5, metalness: 0.7 }),
  macKey: new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.6, metalness: 0.1 }),
  trackpad: new THREE.MeshStandardMaterial({ color: 0xb4b7bd, roughness: 0.25, metalness: 0.8 }),
  bezel: new THREE.MeshStandardMaterial({ color: 0x050507, roughness: 0.3, metalness: 0.2 }),
  mesh: new THREE.MeshStandardMaterial({ color: 0x2a2a38, roughness: 0.5, metalness: 0.7, transparent: true, opacity: 0.55 }),
  cover: new THREE.MeshStandardMaterial({ color: 0x24242e, roughness: 0.9, metalness: 0 }),
  clear: new THREE.MeshPhysicalMaterial({ color: 0xdfe8ff, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.22, depthWrite: false }),
  clearCap: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.15, metalness: 0, transparent: true, opacity: 0.26, depthWrite: false }),
};
const rgbMats = [];
const rgbMat = (pos = 0.5) => {
  const m = new THREE.MeshBasicMaterial({ color: 0x00e5ff, toneMapped: false });
  rgbMats.push({ m, pos });
  return m;
};
const shadowy = (mesh) => ((mesh.castShadow = mesh.receiveShadow = true), mesh);
const rbox = (w, h, d, mat, r = 0.06) =>
  shadowy(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)), mat));
const box = (w, h, d, mat) => shadowy(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat));
const cyl = (r, h, mat, seg = 32) => shadowy(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), mat));
const put = (obj, parent, x = 0, y = 0, z = 0) => (obj.position.set(x, y, z), parent.add(obj), obj);

/* ========================================================= environment */
const floor = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), M.floor);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
const wall = new THREE.Mesh(new THREE.PlaneGeometry(56, 24), M.wall); // single-sided: invisible from behind
wall.position.set(0, 12, -5);
wall.receiveShadow = true;
scene.add(wall);

const LED_COUNT = 72;
const leds = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 12, 8), new THREE.MeshBasicMaterial({ toneMapped: false }), LED_COUNT);
scene.add(leds);
const ledPos = [];
for (let i = 0; i < LED_COUNT; i++) ledPos.push(i / (LED_COUNT - 1));

/* ================================================================ desk */
const desk = new THREE.Group();
scene.add(desk);
put(rbox(22, 0.4, 8, M.desk, 0.08), desk, 0, 5.8, 0);
for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(box(0.5, 5.6, 0.5, M.darker), desk, sx * 10.3, 2.8, sz * 3.5);

/* =============================================================== items */
const items = {};
const makeItem = (id, pos, rotY, view, look, anchor) => {
  const root = new THREE.Group();
  root.position.copy(pos);
  root.rotation.y = rotY;
  const inner = new THREE.Group();
  inner.userData.itemId = id;
  root.add(inner);
  scene.add(root);
  items[id] = { id, data: ITEMS[id], root, inner, view, look, anchor, baseY: pos.y };
  return items[id];
};
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

// canvas textures for the two screens
const makeScreen = (w, h) => {
  const cvs = document.createElement('canvas');
  cvs.width = w;
  cvs.height = h;
  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { cvs, ctx: cvs.getContext('2d'), tex };
};
const mainScreen = makeScreen(1280, 720);     // AOC 27" — the IDE
const portableScreen = makeScreen(1024, 576); // Dragon Touch 4K — Claude
const laptopScreen = makeScreen(800, 500);    // MacBook Air — tests + git
const padArt = makeScreen(1400, 390);         // XL mouse pad print

// --- Dragon Touch 4K portable monitor (15.6", ultra-thin, leaning on its folding smart-cover stand)
let monitorPanel;
{
  const it = makeItem('monitor', v3(-7.4, 6, -1.5), 0.45, v3(-2.2, 2.6, 10.2), v3(0, 2.2, 0), v3(0, 4.8, 0));
  const g = it.inner;
  // folded cover lying on the desk + the flap that props the panel up
  put(rbox(7.2, 0.06, 0.55, M.cover, 0.02), g, 0, 0.03, 0.05);
  const flap = put(rbox(7.0, 2.2, 0.05, M.cover, 0.02), g, 0, 1.05, -0.75);
  flap.rotation.x = 0.55;
  monitorPanel = new THREE.Group();
  put(monitorPanel, g, 0, 0.06, 0.05);
  monitorPanel.rotation.x = -0.2;
  put(rbox(7.2, 4.15, 0.09, M.darker, 0.06), monitorPanel, 0, 2.1, 0);
  put(rbox(7.2, 0.28, 0.12, M.dark, 0.04), monitorPanel, 0, 0.14, 0); // thicker bottom chin
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(6.98, 3.82), new THREE.MeshBasicMaterial({ map: portableScreen.tex, toneMapped: false }));
  put(scr, monitorPanel, 0, 2.18, 0.047);
  put(box(6.8, 0.05, 0.05, rgbMat(0.5)), monitorPanel, 0, 0.3, -0.07); // RGB back-glow (desk light)
}

// --- laptop cooling stand: tilted mesh deck with two RGB fans underneath
const fans = [];
const STAND_POS = v3(7.7, 6, -0.7), STAND_YAW = -0.5, STAND_TILT = 0.18, DECK_Y = 0.9;
{
  const it = makeItem('stand', STAND_POS.clone(), STAND_YAW, v3(6.2, 1.0, 4.8), v3(0, 0.75, 0), v3(0, 1.4, 1.8));
  const g = it.inner;
  const deck = new THREE.Group();
  put(deck, g, 0, DECK_Y - 0.05, 0);
  deck.rotation.x = STAND_TILT;
  put(rbox(4.9, 0.08, 3.5, M.mesh, 0.05), deck, 0, 0, 0);
  put(box(4.9, 0.22, 0.1, M.dark), deck, 0, 0.1, 1.75); // front lip stops the laptop sliding
  put(box(4.7, 0.04, 0.04, rgbMat(0.3)), deck, 0, 0.14, 1.81);
  // two fans facing up, just under the mesh
  for (const x of [-1.1, 1.1]) {
    const f = new THREE.Group();
    put(f, deck, x, -0.14, -0.1);
    f.rotation.x = -Math.PI / 2;
    put(new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.05, 10, 48), rgbMat(x < 0 ? 0.25 : 0.4)), f);
    const blades = new THREE.Group();
    f.add(blades);
    for (let k = 0; k < 7; k++) {
      const pivot = new THREE.Group();
      pivot.rotation.z = (k / 7) * Math.PI * 2;
      const b = box(0.2, 0.55, 0.02, M.darker);
      b.position.y = 0.38;
      b.rotation.y = 0.45;
      pivot.add(b);
      blades.add(pivot);
    }
    const hub = cyl(0.18, 0.08, M.darker);
    hub.rotation.x = Math.PI / 2;
    f.add(hub);
    fans.push(blades);
  }
  // legs: short at the front, tall at the back
  const backY = DECK_Y + Math.sin(STAND_TILT) * 1.6;
  for (const x of [-2.2, 2.2]) {
    put(box(0.18, backY, 0.18, M.dark), g, x, backY / 2, -1.55);
    put(box(0.18, 0.62, 0.18, M.dark), g, x, 0.31, 1.5);
  }
}

// --- MacBook Air M1 (13.3", silver, fanless) — sits on the cooling stand
let laptopLid;
{
  const it = makeItem('laptop', v3(STAND_POS.x, STAND_POS.y + DECK_Y, STAND_POS.z), STAND_YAW, v3(0, 3, 8.4), v3(0, 1.3, -0.5), v3(0, 3.3, -1.3));
  it.root.rotation.order = 'YXZ';
  it.root.rotation.x = STAND_TILT;
  const g = it.inner;
  put(rbox(4.6, 0.12, 3.2, M.alu, 0.06), g, 0, 0.06, 0); // base
  put(box(4.0, 0.012, 1.55, M.keywell), g, 0, 0.125, -0.55); // keyboard well
  const lkeys = new THREE.InstancedMesh(new RoundedBoxGeometry(0.24, 0.03, 0.22, 1, 0.02), M.macKey, 12 * 5);
  for (let r = 0; r < 5; r++)
    for (let c = 0; c < 12; c++) {
      const d = new THREE.Object3D();
      d.position.set(-1.79 + c * 0.325, 0.14, -1.17 + r * 0.31);
      if (r === 4 && c >= 4 && c <= 7) d.scale.x = c === 4 ? 4.9 : 0.0001; // spacebar
      if (r === 4 && c === 4) d.position.x += 0.49;
      d.updateMatrix();
      lkeys.setMatrixAt(r * 12 + c, d.matrix);
    }
  g.add(lkeys);
  put(rbox(1.7, 0.01, 1.05, M.trackpad, 0.02), g, 0, 0.125, 0.92); // trackpad
  // lid hinges at the back edge; rotation.x = -0.3 ≈ open, +1.52 ≈ closed
  laptopLid = new THREE.Group();
  put(laptopLid, g, 0, 0.12, -1.57);
  laptopLid.rotation.x = -0.3;
  put(rbox(4.6, 3.0, 0.07, M.alu, 0.06), laptopLid, 0, 1.5, 0);
  put(box(4.48, 2.9, 0.005, M.bezel), laptopLid, 0, 1.5, 0.037);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.63), new THREE.MeshBasicMaterial({ map: laptopScreen.tex, toneMapped: false }));
  put(scr, laptopLid, 0, 1.56, 0.041);
}

// --- AOC 27" main monitor (V-shaped stand, red accent)
{
  const it = makeItem('aoc', v3(0.2, 6, -2.4), 0, v3(0, 4.6, 15.5), v3(0, 4.4, 0), v3(0, 8, 0));
  const g = it.inner;
  for (const sd of [-1, 1]) put(rbox(2.4, 0.1, 0.45, M.dark, 0.04), g, sd * 0.95, 0.05, 0.3).rotation.y = sd * 0.55;
  put(rbox(0.5, 3.0, 0.3, M.dark, 0.06), g, 0, 1.55, -0.3);
  put(rbox(3.4, 2.4, 0.5, M.dark, 0.1), g, 0, 4.4, -0.3);
  put(rbox(9.9, 5.75, 0.3, M.darker, 0.08), g, 0, 4.6, 0);
  put(box(9.3, 0.05, 0.05, rgbMat(0.5)), g, 0, 1.9, -0.18); // back glow onto the wall
  put(box(1.0, 0.04, 0.02, new THREE.MeshBasicMaterial({ color: 0xff2a2a, toneMapped: false })), g, 0, 1.83, 0.16); // red chin accent
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(9.62, 5.41), new THREE.MeshBasicMaterial({ map: mainScreen.tex, toneMapped: false }));
  put(scr, g, 0, 4.68, 0.152);
}

// --- extra-large Dota 2 mouse pad (desk mat under keyboard + mouse)
{
  const it = makeItem('mousepad', v3(-0.6, 6, 2.1), 0, v3(0, 12.5, 11.5), v3(0, 0, 0), v3(0, 0.4, -1.6));
  const g = it.inner;
  put(box(13.1, 0.03, 3.7, M.darker), g, 0, 0.015, 0); // stitched edge
  put(rbox(13, 0.05, 3.6, M.pad, 0.02), g, 0, 0.035, 0);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(12.9, 3.52), new THREE.MeshStandardMaterial({ map: padArt.tex, roughness: 0.9, metalness: 0 }));
  top.rotation.x = -Math.PI / 2;
  top.receiveShadow = true;
  put(top, g, 0, 0.062, 0);
}

// --- mouse
{
  const it = makeItem('mouse', v3(4.3, 6.07, 2.2), -0.1, v3(0.6, 2.0, 3.6), v3(0, 0.2, 0), v3(0, 0.8, 0));
  const g = it.inner;
  const body = shadowy(new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), M.dark));
  body.scale.set(0.42, 0.22, 0.66);
  put(body, g, 0, 0.2, 0);
  const wheel = cyl(0.06, 0.08, M.darker, 16);
  wheel.rotation.z = Math.PI / 2;
  put(wheel, g, 0, 0.4, -0.28);
}

// --- dev desk props (decor, not clickable)
let lightBarLamp, lightBarStrip;
{
  // monitor light bar clipped on top of the AOC, lighting the keyboard area
  const bar = new THREE.Group();
  put(bar, scene, 0.2, 13.62, -2.32);
  const tube = cyl(0.11, 6.2, M.darker, 24);
  tube.rotation.z = Math.PI / 2;
  bar.add(tube);
  put(box(0.5, 0.35, 0.08, M.darker), bar, 0, -0.18, -0.2); // clip over the back
  lightBarStrip = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  put(box(5.8, 0.02, 0.1, lightBarStrip), bar, 0, -0.11, 0.05);
  lightBarLamp = new THREE.SpotLight(0xfff1dc, 140, 22, 0.75, 0.7, 1.4);
  lightBarLamp.position.set(0.2, 13.45, -2.1);
  lightBarLamp.target.position.set(-0.5, 6, 2.2);
  scene.add(lightBarLamp, lightBarLamp.target);

  // plant in the back-left corner
  const plant = new THREE.Group();
  put(plant, scene, -10.1, 6, -3.0);
  put(cyl(0.55, 1.0, new THREE.MeshStandardMaterial({ color: 0xb8673f, roughness: 0.8 })), plant, 0, 0.5, 0);
  put(cyl(0.5, 0.05, new THREE.MeshStandardMaterial({ color: 0x2a1d14, roughness: 1 })), plant, 0, 0.98, 0);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f8f52, roughness: 0.6, side: THREE.DoubleSide });
  for (let i = 0; i < 11; i++) {
    const leaf = shadowy(new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), leafMat));
    leaf.scale.set(0.2, 1 + rnd(i) * 0.5, 0.05);
    const pivot = new THREE.Group();
    pivot.rotation.set(0.35 + rnd(i + 4) * 0.4, (i / 11) * Math.PI * 2, 0, 'YXZ');
    leaf.position.y = leaf.scale.y;
    pivot.add(leaf);
    put(pivot, plant, 0, 1.0, 0);
  }

  // coffee mug + notebook and pen
  const mug = new THREE.Group();
  put(mug, scene, -9.2, 6, 2.6);
  const ceramic = new THREE.MeshStandardMaterial({ color: 0xece8df, roughness: 0.35 });
  put(cyl(0.4, 0.8, ceramic), mug, 0, 0.4, 0);
  put(cyl(0.34, 0.02, new THREE.MeshStandardMaterial({ color: 0x3b2414, roughness: 0.3 })), mug, 0, 0.72, 0);
  put(shadowy(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.06, 8, 20), ceramic)), mug, 0.45, 0.42, 0);
  const book = new THREE.Group();
  put(book, scene, 9.4, 6, 3.0);
  book.rotation.y = 0.35;
  put(rbox(2.0, 0.14, 2.7, new THREE.MeshStandardMaterial({ color: 0x2c3a56, roughness: 0.8 }), 0.03), book, 0, 0.07, 0);
  put(box(1.9, 0.02, 2.6, new THREE.MeshStandardMaterial({ color: 0xf1ede4, roughness: 0.9 })), book, 0.04, 0.1, 0);
  const pen = cyl(0.04, 1.8, new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4, metalness: 0.4 }), 12);
  pen.rotation.set(Math.PI / 2, 0, 0.3);
  put(pen, book, 0.6, 0.2, 0);
}

// --- AULA transparent keyboard (clear case + clear keycaps, RGB shines through)
const COLS = 15, ROWS = 5, KEYS = COLS * ROWS;
const keyData = [];
let keyCaps, keyGlow;
{
  const it = makeItem('keyboard', v3(-1.9, 6.07, 2.15), 0, v3(0, 5.4, 8.6), v3(0, 0.2, -0.3), v3(0, 0.9, 0));
  const g = it.inner;
  put(box(5.3, 0.03, 1.8, M.board), g, 0, 0.09, 0); // PCB inside
  for (const [w, d, x, z, p] of [[5.5, 0.05, 0, 0.98, 0.5], [5.5, 0.05, 0, -0.98, 0.5], [0.05, 1.9, -2.73, 0, 0], [0.05, 1.9, 2.73, 0, 1]])
    put(box(w, 0.05, d, rgbMat(p)), g, x, 0.05, z); // light ring inside the clear case
  const shell = put(new THREE.Mesh(new RoundedBoxGeometry(5.6, 0.3, 2.1, 3, 0.08), M.clear), g, 0, 0.15, 0);
  shell.renderOrder = 2;
  keyGlow = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.02, 0.3), new THREE.MeshBasicMaterial({ toneMapped: false }), KEYS);
  keyCaps = new THREE.InstancedMesh(new RoundedBoxGeometry(0.29, 0.15, 0.29, 2, 0.05), M.clearCap, KEYS);
  keyCaps.renderOrder = 3;
  g.add(keyGlow, keyCaps);
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      keyData.push({ c, r, x: -2.45 + c * 0.35, z: -0.7 + r * 0.35, pos: (c + r * 0.6) / (COLS + ROWS * 0.6), d: Math.hypot(c - 7, (r - 2) * 1.5) / 8 });
}

/* ======================================================== shared state */
const S = { rgbBoost: 1, fanSpeed: 7, screen: 'off', boot: 0, flash: 0, keyPop: 0, ledPop: 0, shiftX: 0, shiftY: 0, rgb: 'focus' };

/* ============================================================ screens */
/* ---------- shared screen helpers ---------- */
const MONO = '"SF Mono", Menlo, Consolas, monospace';
const rrect = (c, x, y, w, h, r) => {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
};
const flashOver = (c, W, H) => {
  if (S.flash > 0) {
    c.fillStyle = `rgba(255,255,255,${S.flash})`;
    c.fillRect(0, 0, W, H);
  }
};
const drawBoot = (c, W, H, col) => {
  c.fillStyle = '#020205';
  c.fillRect(0, 0, W, H);
  c.fillStyle = '#1d1d33';
  rrect(c, W / 2 - 160, H / 2 + 20, 320, 8, 4);
  c.fillStyle = col;
  rrect(c, W / 2 - 160, H / 2 + 20, 320 * S.boot, 8, 4);
  c.globalAlpha = Math.min(1, S.boot * 2);
  c.fillStyle = '#cfd3ff';
  c.font = `600 26px ${MONO}`;
  c.textAlign = 'center';
  c.fillText('~/dev-setup', W / 2, H / 2 - 16);
  c.textAlign = 'left';
  c.globalAlpha = 1;
};

/* ---------- syntax highlighting for the IDE ---------- */
const CODE = `import * as THREE from 'three';
import { gsap } from 'gsap';

// boot the desk, then hand control to the orbit camera
export function intro(desk, monitors, state) {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from(desk.position, { y: -7, duration: 1.2 })
    .from(monitors, { y: '+=14', ease: 'bounce.out', stagger: 0.15 })
    .to(state, { keyPop: 1, duration: 1.2 }, '<')
    .add(() => (state.screen = 'code'));
  return tl;
}

// click any device: fly the camera in and open its details
export function focusItem(item, camera) {
  const to = item.root.localToWorld(item.view.clone());
  gsap.to(camera.position, { ...to, duration: 1.5 });
  openPanel(item.data);
}`.split('\n');
const SYN = { kw: '#c586ff', str: '#9ee68a', com: '#6a7090', num: '#ffcb6b', fn: '#6cb6ff', id: '#e6e8ff', pun: '#9aa0c8' };
const tokenize = (line) => {
  const re = /(\/\/.*$)|('[^']*')|\b(import|from|export|function|const|return|new)\b|\b(\d+\.?\d*)\b|([A-Za-z_$][\w$]*)(?=\()|([A-Za-z_$][\w$]*)|(\s+)|(.)/g;
  const out = [];
  let m;
  while ((m = re.exec(line))) {
    const kind = m[1] ? 'com' : m[2] ? 'str' : m[3] ? 'kw' : m[4] ? 'num' : m[5] ? 'fn' : m[6] ? 'id' : 'pun';
    out.push([m[0], SYN[kind]]);
  }
  return out;
};
const CODE_TOKENS = CODE.map(tokenize);
const CODE_CHARS = CODE.reduce((n, l) => n + l.length + 1, 0);

/* ---------- AOC 27": the IDE ---------- */
function drawMain(t) {
  const c = mainScreen.ctx, W = 1280, H = 720;
  if (S.screen !== 'game') {
    if (S.screen === 'boot') drawBoot(c, W, H, '#6cb6ff');
    else (c.fillStyle = '#020205'), c.fillRect(0, 0, W, H);
    flashOver(c, W, H);
    mainScreen.tex.needsUpdate = true;
    return;
  }
  const TERM_H = 170, TAB_H = 38, STATUS_H = 26, SIDE = 230, ACT = 52, MINI = 90;
  c.fillStyle = '#1b1b27';
  c.fillRect(0, 0, W, H);
  // activity bar
  c.fillStyle = '#13131c';
  c.fillRect(0, 0, ACT, H);
  ['#e6e8ff', '#6a7090', '#6a7090', '#6a7090', '#d97757'].forEach((col, i) => {
    c.fillStyle = col;
    rrect(c, 14, 18 + i * 52, 24, 24, 5);
  });
  // explorer
  c.fillStyle = '#16161f';
  c.fillRect(ACT, 0, SIDE, H - STATUS_H);
  c.font = `600 13px Inter, sans-serif`;
  c.fillStyle = '#8a8cb3';
  c.fillText('EXPLORER', ACT + 18, 26);
  const tree = [['▾ dev-setup', 0], ['index.html', 1], ['main.js', 1], ['setup3d.html', 1], ['setup3d.js', 1, true], ['setup3d.css', 1], ['style.css', 1], ['▸ node_modules', 0], ['package.json', 0], ['README.md', 0]];
  c.font = `15px ${MONO}`;
  tree.forEach(([name, depth, active], i) => {
    const y = 58 + i * 28;
    if (active) {
      c.fillStyle = '#2a2a44';
      c.fillRect(ACT, y - 19, SIDE, 28);
    }
    c.fillStyle = active ? '#ffffff' : name.endsWith('.js') ? '#ffcb6b' : '#b9bcdf';
    c.fillText(name, ACT + 18 + depth * 18, y);
  });
  // tabs
  const EX = ACT + SIDE;
  c.fillStyle = '#16161f';
  c.fillRect(EX, 0, W - EX, TAB_H);
  ['setup3d.js', 'setup3d.css', 'README.md'].forEach((name, i) => {
    c.fillStyle = i === 0 ? '#1b1b27' : '#16161f';
    c.fillRect(EX + i * 160, 0, 158, TAB_H);
    if (i === 0) {
      c.fillStyle = '#6cb6ff';
      c.fillRect(EX, 0, 158, 2);
    }
    c.fillStyle = i === 0 ? '#fff' : '#8a8cb3';
    c.font = `14px Inter, sans-serif`;
    c.fillText(name, EX + 18 + i * 160, 24);
  });
  // code with typing animation
  const cycle = CODE_CHARS / 34 + 4;
  const typed = Math.floor(((t % cycle) * 34));
  let left = typed;
  const LH = 25;
  c.font = `17px ${MONO}`;
  const charW = c.measureText('M').width;
  let cursor = null;
  CODE_TOKENS.forEach((tokens, li) => {
    const y = TAB_H + 28 + li * LH;
    c.fillStyle = '#4a4e6a';
    c.textAlign = 'right';
    c.fillText(String(li + 1), EX + 44, y);
    c.textAlign = 'left';
    if (left < 0) return;
    let x = EX + 64, budget = left;
    for (const [txt, col] of tokens) {
      if (budget <= 0) break;
      const part = txt.slice(0, budget);
      c.fillStyle = col;
      c.fillText(part, x, y);
      x += part.length * charW;
      budget -= txt.length;
    }
    if (left <= CODE[li].length) cursor = [x, y];
    left -= CODE[li].length + 1;
  });
  if (cursor && Math.floor(t * 2) % 2 === 0) {
    c.fillStyle = '#e6e8ff';
    c.fillRect(cursor[0] + 1, cursor[1] - 17, 2, 22);
  }
  // minimap
  c.fillStyle = '#17172299';
  c.fillRect(W - MINI, TAB_H, MINI, H - TAB_H - TERM_H - STATUS_H);
  CODE.forEach((l, i) => {
    c.fillStyle = '#ffffff22';
    c.fillRect(W - MINI + 10, TAB_H + 10 + i * 5, Math.min(70, l.length * 1.3), 2);
  });
  // terminal
  const TY = H - STATUS_H - TERM_H;
  c.fillStyle = '#14141d';
  c.fillRect(EX, TY, W - EX, TERM_H);
  c.fillStyle = '#2a2a3c';
  c.fillRect(EX, TY, W - EX, 1);
  c.font = `600 12px Inter, sans-serif`;
  c.fillStyle = '#e6e8ff';
  c.fillText('TERMINAL', EX + 18, TY + 22);
  c.fillStyle = '#6a7090';
  c.fillText('PROBLEMS   OUTPUT   DEBUG CONSOLE', EX + 110, TY + 22);
  const LOG = [
    ['$ npm run dev', '#e6e8ff'], ['  VITE v5.4  ready in 312 ms', '#9ee68a'], ['  ➜  Local:   http://localhost:5173/', '#6cb6ff'],
    ['  hmr update /setup3d.js', '#8a8cb3'], ['  hmr update /setup3d.css', '#8a8cb3'], ['  ✓ 6 devices loaded · 60 fps', '#9ee68a'],
  ];
  const shown = 3 + (Math.floor(t / 1.6) % 4);
  c.font = `15px ${MONO}`;
  for (let i = 0; i < Math.min(shown, LOG.length); i++) {
    c.fillStyle = LOG[i][1];
    c.fillText(LOG[i][0], EX + 18, TY + 50 + i * 22);
  }
  // status bar
  c.fillStyle = '#5b4dd6';
  c.fillRect(0, H - STATUS_H, W, STATUS_H);
  c.fillStyle = '#fff';
  c.font = `13px Inter, sans-serif`;
  c.fillText('⎇ main   ✓ 0  ⚠ 0', 14, H - 8);
  c.textAlign = 'right';
  c.fillText(`Ln ${Math.min(CODE.length, 1 + Math.floor(typed / 40))}, Col ${1 + (typed % 40)}    UTF-8    JavaScript    Claude ●`, W - 14, H - 8);
  c.textAlign = 'left';
  flashOver(c, W, H);
  mainScreen.tex.needsUpdate = true;
}

/* ---------- Dragon Touch: chat with Claude ---------- */
const CHATS = [
  { q: 'Add a laptop stand with fans under the MacBook', a: 'Sure — I’ll add a tilted cooling stand under the MacBook with two RGB fans spinning underneath, then raise the laptop onto it so the screen sits higher.' },
  { q: 'Make the AOC show my IDE instead of a game', a: 'Done. The 27" now shows an editor with the file tree, tabs, a typing animation and an integrated terminal running the dev server.' },
  { q: 'Why is the camera too close on the pad?', a: 'The view offset was only 7.8 units back. I pulled it to 11.5 and raised it so the whole desk mat fits beside the panel.' },
];
const wrapText = (c, text, maxW) => {
  const lines = [];
  let line = '';
  for (const w of text.split(' ')) {
    const test = line ? line + ' ' + w : w;
    if (c.measureText(test).width > maxW && line) lines.push(line), (line = w);
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
};
function drawPortable(t) {
  const c = portableScreen.ctx, W = 1024, H = 576;
  if (S.screen !== 'game') {
    if (S.screen === 'boot') drawBoot(c, W, H, '#d97757');
    else (c.fillStyle = '#020205'), c.fillRect(0, 0, W, H);
    flashOver(c, W, H);
    portableScreen.tex.needsUpdate = true;
    return;
  }
  c.fillStyle = '#1f1e1d';
  c.fillRect(0, 0, W, H);
  // sidebar
  c.fillStyle = '#191817';
  c.fillRect(0, 0, 200, H);
  c.fillStyle = '#d97757';
  c.beginPath();
  c.arc(30, 32, 9, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#f2efe8';
  c.font = `600 20px Georgia, serif`;
  c.fillText('Claude', 48, 39);
  c.font = `14px Inter, sans-serif`;
  ['3D dev setup', 'GSAP timelines', 'Three.js bloom', 'Refactor panel'].forEach((s, i) => {
    if (i === 0) (c.fillStyle = '#2c2a28'), rrect(c, 10, 70 + i * 38, 180, 30, 8);
    c.fillStyle = i === 0 ? '#f2efe8' : '#a8a39a';
    c.fillText(s, 22, 90 + i * 38);
  });
  // conversation: question appears, answer streams in, then the next one
  const PER = 9;
  const k = Math.floor(t / PER) % CHATS.length, local = t % PER;
  const { q, a } = CHATS[k];
  const X = 240, MW = 700;
  c.font = `17px Inter, sans-serif`;
  const qLines = wrapText(c, q, 420);
  const qW = Math.max(...qLines.map((l) => c.measureText(l).width)) + 36;
  c.fillStyle = '#393734';
  rrect(c, W - 44 - qW, 40, qW, 22 + qLines.length * 26, 16);
  c.fillStyle = '#f2efe8';
  qLines.forEach((l, i) => c.fillText(l, W - 26 - qW, 70 + i * 26));
  if (local > 1) {
    const streamed = a.slice(0, Math.floor((local - 1) * 40));
    const lines = wrapText(c, streamed, MW);
    const ay = 70 + qLines.length * 26 + 50;
    c.fillStyle = '#d97757';
    c.beginPath();
    c.arc(X + 10, ay - 6, 8, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#f2efe8';
    c.font = `18px Georgia, serif`;
    lines.forEach((l, i) => c.fillText(l, X + 34, ay + i * 30));
    if (streamed.length === a.length) {
      c.fillStyle = '#141312';
      rrect(c, X + 34, ay + lines.length * 30 + 10, 560, 74, 10);
      c.font = `15px ${MONO}`;
      c.fillStyle = '#c586ff';
      c.fillText('gsap', X + 54, ay + lines.length * 30 + 42);
      c.fillStyle = '#e6e8ff';
      c.fillText('.to(fans, { speed: 30, duration: 1.5 });', X + 94, ay + lines.length * 30 + 42);
      c.fillStyle = '#6a7090';
      c.fillText('// fans spin up when you click the stand', X + 54, ay + lines.length * 30 + 66);
    } else if (Math.floor(t * 3) % 2) {
      c.fillStyle = '#d97757';
      c.fillRect(X + 34 + c.measureText(lines.at(-1) || '').width + 4, ay - 16 + (lines.length - 1) * 30, 9, 20);
    }
  }
  // input box
  c.fillStyle = '#2c2a28';
  rrect(c, X, H - 86, W - X - 40, 56, 14);
  c.fillStyle = '#8a857c';
  c.font = `16px Inter, sans-serif`;
  c.fillText('Reply to Claude…', X + 22, H - 52);
  c.fillStyle = '#d97757';
  rrect(c, W - 88, H - 76, 36, 36, 10);
  flashOver(c, W, H);
  portableScreen.tex.needsUpdate = true;
}

/* ---------- MacBook: tests + git ---------- */
function drawLaptop(t) {
  const c = laptopScreen.ctx, W = 800, H = 500;
  if (S.screen !== 'game' || S.laptopOff) {
    if (S.screen === 'boot' && !S.laptopOff) drawBoot(c, W, H, '#e8e9ff');
    else (c.fillStyle = '#020205'), c.fillRect(0, 0, W, H);
    flashOver(c, W, H);
    laptopScreen.tex.needsUpdate = true;
    return;
  }
  const bg = c.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1a0f3a');
  bg.addColorStop(1, '#05202e');
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);
  c.fillStyle = '#ffffff14';
  c.fillRect(0, 0, W, 22);
  c.fillStyle = '#ffffffcc';
  c.font = `600 12px Inter, sans-serif`;
  c.fillText('Terminal   Shell   Edit   View', 14, 15);
  // terminal window: tests running
  c.fillStyle = '#0d0d14f2';
  rrect(c, 16, 36, 470, 448, 10);
  ['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => {
    c.fillStyle = col;
    c.beginPath();
    c.arc(34 + i * 18, 52, 6, 0, Math.PI * 2);
    c.fill();
  });
  const TESTS = [
    ['$ npm test', '#e6e8ff'], ['', ''], [' PASS  scene/desk.test.js', '#9ee68a'], ['   ✓ builds desk + LED strip (12 ms)', '#9aa0c8'],
    [' PASS  scene/devices.test.js', '#9ee68a'], ['   ✓ AOC, Dragon Touch, MacBook (31 ms)', '#9aa0c8'], ['   ✓ cooling stand fans spin (8 ms)', '#9aa0c8'],
    [' PASS  ui/panel.test.js', '#9ee68a'], ['   ✓ opens + counts up stats (19 ms)', '#9aa0c8'], ['', ''],
    ['Tests:  7 passed, 7 total', '#9ee68a'], ['Time:   1.84 s', '#9aa0c8'], ['', ''], ['$ git push origin main', '#e6e8ff'],
  ];
  const shown = Math.floor((t % 10) * 2.2);
  c.font = `14px ${MONO}`;
  for (let i = 0; i < Math.min(shown, TESTS.length); i++) {
    c.fillStyle = TESTS[i][1];
    c.fillText(TESTS[i][0], 32, 92 + i * 26);
  }
  // git graph window
  c.fillStyle = '#0d0d14f2';
  rrect(c, 500, 36, 284, 448, 10);
  c.fillStyle = '#e6e8ff';
  c.font = `600 13px ${MONO}`;
  c.fillText('GIT · main', 518, 64);
  const COMMITS = ['Programmer setup screens', 'Laptop cooling stand', 'AOC 27 + XL pad', 'Real devices', '3D setup scene', 'Scroll portfolio'];
  c.font = `13px Inter, sans-serif`;
  COMMITS.forEach((msg, i) => {
    const y = 100 + i * 60;
    c.strokeStyle = '#6cb6ff55';
    c.lineWidth = 3;
    if (i < COMMITS.length - 1) {
      c.beginPath();
      c.moveTo(530, y);
      c.lineTo(530, y + 60);
      c.stroke();
    }
    c.fillStyle = i === 0 ? '#d97757' : `hsl(${200 + i * 25} 90% 65%)`;
    c.beginPath();
    c.arc(530, y, i === 0 ? 8 + Math.sin(t * 4) * 1.5 : 7, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#e6e8ff';
    c.fillText(msg, 550, y + 5);
    c.fillStyle = '#6a7090';
    c.fillText(`${(0x1a2b3c + i * 0x9f3e1).toString(16).slice(0, 7)}`, 550, y + 24);
  });
  flashOver(c, W, H);
  laptopScreen.tex.needsUpdate = true;
}


// XL mouse pad print: an original dark-red "battle map" design (no official artwork)
function drawPad() {
  const c = padArt.ctx, W = 1400, H = 390;
  const bg = c.createLinearGradient(0, H, W, 0);
  bg.addColorStop(0, '#163a24');
  bg.addColorStop(0.45, '#2a0e12');
  bg.addColorStop(1, '#6a0c0a');
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);
  // faction glows in opposite corners
  for (const [x, y, col] of [[120, H - 40, '#2bd96a88'], [W - 120, 40, '#ff3a1a99']]) {
    const g = c.createRadialGradient(x, y, 10, x, y, 420);
    g.addColorStop(0, col);
    g.addColorStop(1, 'transparent');
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  }
  // diagonal river
  c.strokeStyle = '#3fb8ff77';
  c.lineWidth = 46;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-40, 40);
  c.bezierCurveTo(400, 120, 900, 260, W + 40, H - 30);
  c.stroke();
  c.strokeStyle = '#7fd4ff22';
  c.lineWidth = 12;
  c.stroke();
  // three lanes
  c.strokeStyle = '#ffffff12';
  c.lineWidth = 6;
  for (const pts of [[[80, H - 20], [80, 40], [W - 60, 40]], [[80, H - 20], [W - 60, 40]], [[80, H - 20], [W - 60, H - 20], [W - 60, 40]]]) {
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
  }
  // embers
  for (let i = 0; i < 160; i++) {
    c.fillStyle = `rgba(255,${80 + rnd(i) * 120},40,${0.15 + rnd(i + 3) * 0.5})`;
    c.fillRect(rnd(i + 11) * W, rnd(i + 23) * H, 2 + rnd(i + 5) * 3, 2 + rnd(i + 5) * 3);
  }
  c.fillStyle = '#ffffff40';
  c.font = '900 120px Georgia, serif';
  c.textAlign = 'right';
  c.fillText('DOTA 2', W - 50, H - 50);
  padArt.tex.needsUpdate = true;
}
drawPad();
document.fonts?.ready.then(drawPad);


/* ========================================================== RGB engine */
const tmpC = new THREE.Color();
const boost = (col, k = 1) => {
  const lum = 0.2126 * col.r + 0.7152 * col.g + 0.0722 * col.b;
  return col.multiplyScalar(Math.min(3, Math.max(1.15, 0.85 / Math.max(lum, 0.01))) * k);
};
function rgbAt(t, pos, out) {
  return rgbBase(t, pos, out).multiplyScalar(S.rgbBoost);
}
function rgbBase(t, pos, out) {
  switch (S.rgb) {
    case 'focus': return out.setRGB(0.85, 0.92, 1).multiplyScalar(1.1); // cool white
    case 'warm': return out.setRGB(1, 0.62, 0.3).multiplyScalar(1.2);     // amber
    case 'night': return out.setRGB(0.25, 0.32, 0.9).multiplyScalar(0.9); // dim blue
    default: return out.setRGB(0.015, 0.015, 0.02);
  }
}

/* ======================================================= key ripples */
const ripples = [];
const ripple = (idx) => ripples.push({ c: keyData[idx].c, r: keyData[idx].r, t0: performance.now() });
const LAYOUT = { 1: '1234567890', 2: 'qwertyuiop', 3: 'asdfghjkl', 4: 'zxcvbnm' };
const keyIndex = (key) => {
  if (key === ' ') return 4 * COLS + 7;
  const ch = key.toLowerCase();
  for (const [row, chars] of Object.entries(LAYOUT)) {
    const c = chars.indexOf(ch);
    if (c >= 0) return (row - 1) * COLS + c + 2 + (row > 2 ? row - 2 : 0);
  }
  return Math.floor(Math.random() * KEYS);
};
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && current) return backToOrbit();
  if (current && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) return stepItem(e.key === 'ArrowRight' ? 1 : -1);
  if (e.metaKey || e.ctrlKey || e.repeat || e.target.closest('button')) return;
  if (e.key.length === 1) ripple(keyIndex(e.key));
});

/* ================================================== orbit + interaction */
const O = { theta: -1.1, target: 0, r: 42, y: 16, look: v3(0, 7.8, -0.5) };
const lookTarget = O.look.clone();
let mode = 'intro'; // intro | orbit | fly | focus
let current = null;
let lastInput = 0;
const pointer = { x: 0, y: 0, ndc: new THREE.Vector2(9, 9) };

const radiusScale = () => (camera.aspect < 1 ? Math.min(2.1, 1 / (camera.aspect * 1.2)) : 1);
const orbitPos = (out) =>
  out.set(
    Math.sin(O.theta + pointer.x * 0.05) * O.r * radiusScale(),
    O.y + Math.sin(O.theta * 2) * 0.8 - pointer.y * 1.2,
    Math.cos(O.theta + pointer.x * 0.05) * O.r * radiusScale()
  );

let dragDist = 0;
Observer.create({
  target: canvas,
  type: 'wheel,touch,pointer',
  tolerance: 3,
  onPress: () => (dragDist = 0),
  onChange: (self) => {
    const isWheel = self.event.type === 'wheel';
    if (!isWheel) dragDist += Math.abs(self.deltaX) + Math.abs(self.deltaY);
    if (mode !== 'orbit') return;
    lastInput = performance.now();
    O.target += isWheel ? (self.deltaY + self.deltaX) * 0.0016 : -self.deltaX * 0.006;
  },
});

canvas.addEventListener('pointermove', (e) => {
  pointer.ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  if (e.pointerType === 'mouse') {
    gsap.to(pointer, { x: pointer.ndc.x, y: pointer.ndc.y, duration: 1.2, ease: 'power2.out', overwrite: true });
  }
});
canvas.addEventListener('pointerleave', () => pointer.ndc.set(9, 9));

/* ------------------------------------------------------------ hover */
const raycaster = new THREE.Raycaster();
const pickables = ORDER.map((id) => items[id].inner);
let hovered = null;
let lastHit = null;
const tagEl = $('#tag');
const itemFromObject = (o) => {
  while (o) {
    if (o.userData.itemId) return items[o.userData.itemId];
    o = o.parent;
  }
  return null;
};
function setHover(it) {
  if (hovered === it) return;
  if (hovered && hovered !== items[current]) gsap.to(hovered.inner.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'power3.out' });
  hovered = it;
  document.querySelectorAll('.part-btn').forEach((b) => b.classList.toggle('is-hover', it && b.dataset.id === it.id));
  canvas.style.cursor = it ? 'pointer' : '';
  if (it) {
    if (it.id !== current) gsap.to(it.inner.scale, { x: 1.04, y: 1.04, z: 1.04, duration: 0.5, ease: 'back.out(3)' });
    tagEl.textContent = it.data.name;
    tagEl.style.setProperty('--accent', it.data.color);
    gsap.to(tagEl, { opacity: 1, duration: 0.25 });
  } else gsap.to(tagEl, { opacity: 0, duration: 0.25 });
}
canvas.addEventListener('click', () => {
  if (dragDist > 6) return;
  if (lastHit && lastHit.object === keyCaps && lastHit.instanceId != null) ripple(lastHit.instanceId);
  if (hovered && hovered.id !== current && mode !== 'intro') focusItem(hovered.id);
  else if (!hovered && current) backToOrbit();
});

/* ------------------------------------------------------ parts list */
const partsNav = $('#parts');
ORDER.forEach((id) => {
  const b = document.createElement('button');
  b.className = 'part-btn';
  b.dataset.id = id;
  b.style.setProperty('--c', ITEMS[id].color);
  b.innerHTML = `<i></i>${ITEMS[id].name}`;
  b.addEventListener('click', () => mode !== 'intro' && focusItem(id));
  b.addEventListener('pointerenter', () => mode !== 'intro' && setHover(items[id]));
  b.addEventListener('pointerleave', () => setHover(null));
  partsNav.appendChild(b);
});

/* ------------------------------------------------------ RGB modes */
document.querySelectorAll('.mode').forEach((btn) =>
  btn.addEventListener('click', () => {
    S.rgb = btn.dataset.mode;
    gsap.to(S, { fanSpeed: S.rgb === 'off' ? 0 : 7, duration: 2 });
    document.querySelectorAll('.mode').forEach((b) => b.classList.toggle('is-active', b === btn));
    gsap.fromTo(btn, { scale: 0.85 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, .5)' });
    ripple(2 * COLS + 7);
  })
);

/* =========================================================== detail */
const panel = $('#panel');
let panelOpen = false;
const resetPanel = () => gsap.set(panel, { x: 0, y: 0, xPercent: narrow.matches ? 0 : 105, yPercent: narrow.matches ? 105 : 0 });
resetPanel();

function fillPanel(id) {
  const d = ITEMS[id];
  document.documentElement.style.setProperty('--accent', d.color);
  $('#p-cat').textContent = `${String(ORDER.indexOf(id) + 1).padStart(2, '0')} · ${d.cat}`;
  $('#p-name').textContent = d.name;
  $('#p-tag').textContent = d.tag;
  $('#p-price').textContent = d.sub;
  $('#p-specs').innerHTML = Object.entries(d.specs).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  $('#p-stats').innerHTML = Object.entries(d.stats)
    .map(([k, v]) => `<div class="stat-row"><span>${k.replace('_', ' ')}</span><span class="stat-track"><span class="stat-fill" data-v="${v}"></span></span><b>0</b></div>`)
    .join('');
  document.querySelectorAll('.part-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.id === id));
}

function revealPanel(delay) {
  const tl = gsap.timeline({ delay });
  tl.fromTo('.p-reveal', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.06 });
  document.querySelectorAll('.stat-fill').forEach((bar, k) => {
    const v = +bar.dataset.v, label = bar.parentElement.nextElementSibling, n = { v: 0 };
    tl.fromTo(bar, { scaleX: 0 }, { scaleX: v / 100, duration: 1, ease: 'expo.out' }, 0.35 + k * 0.1);
    tl.to(n, { v, duration: 1, ease: 'expo.out', onUpdate: () => (label.textContent = Math.round(n.v)) }, '<');
  });
}

const panelShift = () => (narrow.matches ? { shiftX: 0, shiftY: innerHeight * 0.27 } : { shiftX: Math.min(420, innerWidth) / 2, shiftY: 0 });

function focusItem(id) {
  const it = items[id];
  const prev = current;
  current = id;
  mode = 'fly';
  setHover(null);
  if (prev && prev !== id) items[prev].unfocus?.();
  gsap.to(it.inner.scale, { x: 1, y: 1, z: 1, duration: 0.4 });

  const camTo = it.root.localToWorld(it.view.clone());
  const lookTo = it.root.localToWorld(it.look.clone());
  gsap.killTweensOf([camera.position, lookTarget]);
  gsap.timeline({ onComplete: () => (mode = 'focus') })
    .to(camera.position, { x: camTo.x, y: camTo.y, z: camTo.z, duration: 1.5, ease: 'power3.inOut' }, 0)
    .to(lookTarget, { x: lookTo.x, y: lookTo.y, z: lookTo.z, duration: 1.5, ease: 'power3.inOut' }, 0);
  gsap.to(S, { ...panelShift(), duration: 1.4, ease: 'power3.inOut' });

  fillPanel(id);
  if (!panelOpen) {
    panelOpen = true;
    panel.setAttribute('aria-hidden', 'false');
    gsap.set(panel, { visibility: 'visible' });
    gsap.to(panel, { xPercent: 0, yPercent: 0, duration: 0.9, ease: 'expo.out', delay: 0.3 });
    gsap.to(['.title-block', '.hint'], { opacity: 0, y: -10, duration: 0.4 });
  }
  revealPanel(panelOpen ? 0.35 : 0.1);
  it.focusAnim?.();
}

function backToOrbit() {
  if (!current) return;
  items[current].unfocus?.();
  current = null;
  mode = 'fly';
  panelOpen = false;
  document.querySelectorAll('.part-btn').forEach((b) => b.classList.remove('is-active'));
  gsap.to(panel, {
    xPercent: narrow.matches ? 0 : 105, yPercent: narrow.matches ? 105 : 0, duration: 0.6, ease: 'power3.in',
    onComplete: () => { gsap.set(panel, { visibility: 'hidden' }); panel.setAttribute('aria-hidden', 'true'); },
  });
  gsap.to(['.title-block', '.hint'], { opacity: 1, y: 0, duration: 0.6, delay: 0.6 });
  gsap.to(S, { shiftX: 0, shiftY: 0, duration: 1.4, ease: 'power3.inOut' });
  const to = orbitPos(new THREE.Vector3());
  gsap.killTweensOf([camera.position, lookTarget]);
  gsap.timeline({ onComplete: () => { mode = 'orbit'; O.target = O.theta; lastInput = performance.now(); } })
    .to(camera.position, { x: to.x, y: to.y, z: to.z, duration: 1.5, ease: 'power3.inOut' }, 0)
    .to(lookTarget, { x: O.look.x, y: O.look.y, z: O.look.z, duration: 1.5, ease: 'power3.inOut' }, 0);
}

function stepItem(dir) {
  const i = ORDER.indexOf(current);
  focusItem(ORDER[(i + dir + ORDER.length) % ORDER.length]);
}
$('#p-close').addEventListener('click', backToOrbit);
$('#p-back').addEventListener('click', backToOrbit);
$('#p-next').addEventListener('click', () => stepItem(1));
$('#p-prev').addEventListener('click', () => stepItem(-1));

/* --------------------------------------- per-item focus animations */
const flashScreens = () => gsap.timeline().to(S, { flash: 0.6, duration: 0.08 }).to(S, { flash: 0, duration: 0.7, ease: 'power2.out' });
items.monitor.focusAnim = () =>
  gsap.timeline({ delay: 0.9 })
    .to(monitorPanel.rotation, { x: -0.06, duration: 0.6, ease: 'power2.out' })
    .add(flashScreens, 0.2)
    .to(monitorPanel.rotation, { x: -0.2, duration: 1.2, ease: 'elastic.out(1, .4)' });
items.stand.focusAnim = () => {
  gsap.timeline({ delay: 0.8 })
    .to(S, { fanSpeed: 34, duration: 1.2, ease: 'power2.in' })
    .to(items.laptop.root.position, { y: '+=0.5', duration: 0.6, ease: 'power2.out' }, 0)
    .to(items.laptop.root.position, { y: STAND_POS.y + DECK_Y, duration: 0.8, ease: 'bounce.out' }, 0.8);
};
items.stand.unfocus = () => gsap.to(S, { fanSpeed: S.rgb === 'off' ? 0 : 7, duration: 1.5 });
items.aoc.focusAnim = () => gsap.delayedCall(1, flashScreens);
items.mouse.focusAnim = () =>
  gsap.timeline({ delay: 0.9 })
    .to(items.mouse.inner.position, { y: 0.6, duration: 0.5, ease: 'power2.out' })
    .to(items.mouse.inner.rotation, { y: '+=' + Math.PI * 2, duration: 1.2, ease: 'power3.inOut' }, 0.2)
    .to(items.mouse.inner.position, { y: 0, duration: 0.6, ease: 'bounce.out' }, 1.2);
// XL desk mat: a wave runs across the keyboard sitting on it
items.mousepad.focusAnim = () => {
  [0, 7, 14].forEach((c, k) => gsap.delayedCall(1 + k * 0.25, () => ripple(2 * COLS + c)));
};
// MacBook: close the lid, then open it again and wake the screen
items.laptop.focusAnim = () =>
  gsap.timeline({ delay: 0.9 })
    .to(laptopLid.rotation, { x: 1.35, duration: 0.8, ease: 'power2.in' })
    .add(() => (S.laptopOff = true))
    .to(laptopLid.rotation, { x: -0.3, duration: 1.1, ease: 'power3.out' }, '+=0.25')
    .add(() => (S.laptopOff = false), '-=0.9')
    .add(flashScreens, '-=0.9');
items.laptop.unfocus = () => {
  gsap.killTweensOf(laptopLid.rotation);
  gsap.to(laptopLid.rotation, { x: -0.3, duration: 0.6 });
  S.laptopOff = false;
};

/* ============================================================== loop */
const dummy = new THREE.Object3D();
const clock = new THREE.Clock();
const anchorV = new THREE.Vector3();
let firstFrame = true;

function updateKeys(now) {
  for (let i = 0; i < KEYS; i++) {
    const k = keyData[i];
    let yo = 0;
    for (const rp of ripples) {
      const phase = ((now - rp.t0) / 1000) * 14 - Math.hypot(k.c - rp.c, (k.r - rp.r) * 1.3);
      if (phase > 0 && phase < Math.PI) yo -= Math.sin(phase) * 0.07;
    }
    const s = Math.max(0.0001, gsap.utils.clamp(0, 1, (S.keyPop - k.d * 0.5) / 0.5));
    dummy.position.set(k.x, 0.36 + yo, k.z);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    keyCaps.setMatrixAt(i, dummy.matrix);
    dummy.position.y = 0.2 + yo;
    dummy.updateMatrix();
    keyGlow.setMatrixAt(i, dummy.matrix);
  }
  keyCaps.instanceMatrix.needsUpdate = keyGlow.instanceMatrix.needsUpdate = true;
  while (ripples.length && now - ripples[0].t0 > 2500) ripples.shift();
}

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  const now = performance.now();

  // camera
  if (mode === 'orbit' || mode === 'intro') {
    if (mode === 'orbit') {
      if (now - lastInput > 4000) O.target += dt * 0.06; // idle auto-spin
      O.theta += (O.target - O.theta) * (1 - Math.pow(0.0015, dt));
    }
    orbitPos(camera.position);
    lookTarget.copy(O.look);
  }
  camera.lookAt(lookTarget);
  if (S.shiftX || S.shiftY) camera.setViewOffset(innerWidth, innerHeight, S.shiftX, S.shiftY, innerWidth, innerHeight);
  else if (camera.view && camera.view.enabled) camera.clearViewOffset();

  // RGB
  const rt = (t / 6) % 1;
  for (let i = 0; i < KEYS; i++) keyGlow.setColorAt(i, rgbAt(rt, keyData[i].pos, tmpC));
  keyGlow.instanceColor.needsUpdate = true;
  for (let i = 0; i < LED_COUNT; i++) {
    const s = Math.max(0.0001, gsap.utils.clamp(0, 1, S.ledPop * 2 - Math.abs(ledPos[i] - 0.5) * 2));
    dummy.position.set(-13 + ledPos[i] * 26, 14.8, -4.9);
    dummy.scale.setScalar(s);
    dummy.updateMatrix();
    leds.setMatrixAt(i, dummy.matrix);
    leds.setColorAt(i, rgbAt(rt, ledPos[i], tmpC));
  }
  leds.instanceMatrix.needsUpdate = leds.instanceColor.needsUpdate = true;
  for (const { m, pos } of rgbMats) rgbAt(rt, pos, m.color);
  if (S.rgb === 'off') glowLight.intensity = 4;
  else {
    rgbAt(rt, 0.5, glowLight.color);
    glowLight.color.multiplyScalar(1 / Math.max(glowLight.color.r, glowLight.color.g, glowLight.color.b));
    glowLight.intensity = S.rgb === 'night' ? 30 : 55;
  }
  const lampTarget = { focus: 140, warm: 110, night: 25, off: 0 }[S.rgb];
  lightBarLamp.intensity += (lampTarget - lightBarLamp.intensity) * 0.08;
  lightBarStrip.color.setScalar(lightBarLamp.intensity / 140 * 1.4);

  updateKeys(now);
  for (const f of fans) f.rotation.z -= S.fanSpeed * dt;
  drawMain(t);
  drawLaptop(t);
  drawPortable(t);

  // hover picking
  if ((mode === 'orbit' || mode === 'focus') && pointer.ndc.x < 2) {
    raycaster.setFromCamera(pointer.ndc, camera);
    lastHit = raycaster.intersectObjects(pickables, true)[0] || null;
    setHover(lastHit ? itemFromObject(lastHit.object) : null);
  } else lastHit = null;
  if (hovered) {
    hovered.root.localToWorld(anchorV.copy(hovered.anchor)).project(camera);
    tagEl.style.left = `${(anchorV.x * 0.5 + 0.5) * innerWidth}px`;
    tagEl.style.top = `${(-anchorV.y * 0.5 + 0.5) * innerHeight}px`;
  }

  composer.render();
  if (firstFrame) {
    firstFrame = false;
    gsap.to('#loader', { opacity: 0, duration: 0.6, onComplete: () => $('#loader').remove() });
    intro();
  }
  requestAnimationFrame(tick);
}

/* ============================================================= intro */
function intro() {
  const drops = ['aoc', 'monitor', 'stand', 'laptop'].map((id) => items[id].root.position);
  const pops = [items.keyboard.inner.scale, items.mouse.inner.scale];
  gsap.timeline({ delay: 0.2, onComplete: () => { mode = 'orbit'; O.target = O.theta; lastInput = performance.now(); } })
    .to(O, { theta: 0.3, r: 27, y: 12, duration: 3.6, ease: 'power2.inOut' }, 0)
    .from(desk.position, { y: -7, duration: 1.2, ease: 'power3.out' }, 0.1)
    .from(drops, { y: '+=14', duration: 1.3, ease: 'bounce.out', stagger: 0.15 }, 0.7)
    .from(items.mousepad.inner.scale, { x: 0.001, duration: 0.6, ease: 'power3.out' }, 1.4)
    .from(pops, { x: 0.001, y: 0.001, z: 0.001, duration: 0.7, ease: 'back.out(2)', stagger: 0.12 }, 1.6)
    .from(laptopLid.rotation, { x: 1.5, duration: 1.2, ease: 'power3.out' }, 1.9)
    .from(monitorPanel.rotation, { x: -1.2, duration: 1.2, ease: 'back.out(1.6)' }, 1.5)
    .to(S, { keyPop: 1, duration: 1.2, ease: 'power2.out' }, 1.9)
    .to(S, { ledPop: 1, duration: 1.4, ease: 'power2.out' }, 1.5)
    .add(() => (S.screen = 'boot'), 2.3)
    .to(S, { boot: 1, duration: 1.6, ease: 'power1.inOut' }, 2.4)
    .add(() => (S.screen = 'game'))
    .to(S, { flash: 0.7, duration: 0.08 })
    .to(S, { flash: 0, duration: 0.6 })
    .from(['.title-block > *', '.part-btn', '.hint'], { y: 20, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.06 }, 2.2);
}

/* ============================================================ resize */
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  if (current) Object.assign(S, panelShift());
  else resetPanel();
});

requestAnimationFrame(tick);
