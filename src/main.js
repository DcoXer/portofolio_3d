import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import anime from "animejs/lib/anime.es.js";
import "./style.css";

const canvas = document.querySelector("#scene");
const heroStage = document.querySelector(".hero-scroll");
const heroCopy = document.querySelector(".hero-copy");
const phaseWash = document.querySelector("#phaseWash");
const scrollMeterFill = document.querySelector("#scrollMeterFill");
const heroTitle = document.querySelector("[data-split]");

function getPerformanceProfile(width) {
  if (width < 640) {
    return {
      pixelRatioCap: 1.6,
      useBloom: true,
      bloomStrength: 0.12,
      bloomRadius: 0.2,
      bloomThreshold: 0.3,
      particleCount: 40,
      knotTubularSegments: 150,
      knotRadialSegments: 22,
      haloSegments: 28,
      domUpdateEpsilon: 0.01,
    };
  }

  if (width < 980) {
    return {
      pixelRatioCap: 1.8,
      useBloom: true,
      bloomStrength: 0.15,
      bloomRadius: 0.22,
      bloomThreshold: 0.29,
      particleCount: 44,
      knotTubularSegments: 150,
      knotRadialSegments: 22,
      haloSegments: 28,
      domUpdateEpsilon: 0.006,
    };
  }

  return {
    pixelRatioCap: 2,
    useBloom: true,
    bloomStrength: 0.21,
    bloomRadius: 0.28,
    bloomThreshold: 0.28,
    particleCount: 72,
    knotTubularSegments: 180,
    knotRadialSegments: 26,
    haloSegments: 36,
    domUpdateEpsilon: 0.003,
  };
}

let perf = getPerformanceProfile(window.innerWidth);

const TUNE = {
  rightAnchorDesktop: 2.2,
  rightAnchorMobile: 0.72,
  zoomStrength: 3.1,
  groupZoomStrength: 1.08,
  fadeSpeed: 0.9,
  cameraFollowX: 0.2,
  scrollSmoothing: 0.042,
};

function getViewportConfig(width) {
  if (width < 640) {
    return {
      rightAnchor: TUNE.rightAnchorMobile,
      baseScale: 0.66,
      zoomScale: 0.52,
      cameraBaseZ: 8.85,
      cameraZoomStrength: 1.9,
      cameraBaseY: 0.32,
      cameraFollowX: 0.12,
      pointerBase: 0.02,
      pointerDelta: 0.02,
    };
  }

  if (width < 980) {
    return {
      rightAnchor: 1.12,
      baseScale: 0.82,
      zoomScale: 0.76,
      cameraBaseZ: 8.05,
      cameraZoomStrength: 2.45,
      cameraBaseY: 0.35,
      cameraFollowX: 0.16,
      pointerBase: 0.025,
      pointerDelta: 0.03,
    };
  }

  return {
    rightAnchor: TUNE.rightAnchorDesktop,
    baseScale: 1.02,
    zoomScale: TUNE.groupZoomStrength,
    cameraBaseZ: 7.35,
    cameraZoomStrength: TUNE.zoomStrength,
    cameraBaseY: 0.38,
    cameraFollowX: TUNE.cameraFollowX,
    pointerBase: 0.035,
    pointerDelta: 0.045,
  };
}

function splitWords(target) {
  if (!target) return [];
  const words = target.textContent.trim().split(/\s+/);
  target.innerHTML = words.map((word) => `<span class=\"word\">${word}</span>`).join(" ");
  return [...target.querySelectorAll(".word")];
}

const titleWords = splitWords(heroTitle);
const heroFadeItems = [...document.querySelectorAll(".hero-copy [data-fade]")];

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x03120d, 0.03);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0.45, 7.05);

const renderer = new THREE.WebGLRenderer({
  canvas,
  alpha: true,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, perf.pixelRatioCap));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;

const pmremGenerator = new THREE.PMREMGenerator(renderer);
const fallbackEnvironment = pmremGenerator.fromScene(new RoomEnvironment(), 0.05).texture;
scene.environment = fallbackEnvironment;
const HDRI_URL =
  "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/equirectangular/royal_esplanade_1k.hdr";
const rgbeLoader = new RGBELoader();
rgbeLoader.load(
  HDRI_URL,
  (hdrTexture) => {
    const hdriEnv = pmremGenerator.fromEquirectangular(hdrTexture).texture;
    scene.environment = hdriEnv;
    hdrTexture.dispose();
  },
  undefined,
  () => {
    scene.environment = fallbackEnvironment;
  }
);

const composer = new EffectComposer(renderer);
composer.setPixelRatio(Math.min(window.devicePixelRatio, perf.pixelRatioCap));
const renderPass = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.32, 0.24, 0.24);
composer.addPass(renderPass);
composer.addPass(bloomPass);

const group = new THREE.Group();
scene.add(group);

const ambient = new THREE.AmbientLight(0x8cf2cf, 0.52);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xc5ffe8, 1.28);
keyLight.position.set(4, 5, 4);
scene.add(keyLight);

const keyLight2 = new THREE.DirectionalLight(0xffffff, 0.92);
keyLight2.position.set(-3.8, 2.9, 5.1);
scene.add(keyLight2);

const rimLight = new THREE.PointLight(0x2de9aa, 18, 20, 2);
rimLight.position.set(-3, 1.2, 3.2);
scene.add(rimLight);

const fillLight = new THREE.PointLight(0x10825f, 10.5, 18, 2);
fillLight.position.set(2.8, -1.8, -1.5);
scene.add(fillLight);

const ring = new THREE.Mesh(
  new THREE.TorusGeometry(2.25, 0.1, 32, 280),
  new THREE.MeshStandardMaterial({
    color: 0x9effdf,
    roughness: 0.14,
    metalness: 0.38,
    transparent: true,
    opacity: 0.96,
    emissive: 0x29b883,
    emissiveIntensity: 0.12,
  })
);
ring.rotation.x = Math.PI * 0.56;
ring.rotation.y = Math.PI * 0.2;
ring.rotation.z = Math.PI * 0.08;
ring.position.z = -0.95;

const halo = new THREE.Mesh(
  new THREE.SphereGeometry(2.65, perf.haloSegments, perf.haloSegments),
  new THREE.MeshBasicMaterial({
    color: 0x66ffd1,
    transparent: true,
    opacity: 0.07,
    wireframe: true,
  })
);

const accentRing = new THREE.Mesh(
  new THREE.TorusGeometry(2.25, 0.1, 32, 280),
  new THREE.MeshStandardMaterial({
    color: 0x9effdf,
    roughness: 0.14,
    metalness: 0.38,
    transparent: true,
    opacity: 0.96,
    emissive: 0x29b883,
    emissiveIntensity: 0.12,
  })
);
accentRing.rotation.x = Math.PI * 0.3;
accentRing.rotation.y = Math.PI * 0.55;
accentRing.rotation.z = Math.PI * 0.12;

let viewport = getViewportConfig(window.innerWidth);

group.add(ring, halo, accentRing);
group.scale.setScalar(viewport.baseScale);

const particles = new THREE.Group();
scene.add(particles);
const pGeo = new THREE.SphereGeometry(0.028, 8, 8);
const pMat = new THREE.MeshBasicMaterial({ color: 0x9effde, transparent: true, opacity: 0.48 });
for (let i = 0; i < perf.particleCount; i += 1) {
  const p = new THREE.Mesh(pGeo, pMat);
  const radius = THREE.MathUtils.randFloat(3.4, 6.8);
  const angle = THREE.MathUtils.randFloat(0, Math.PI * 2);
  p.position.set(Math.cos(angle) * radius, THREE.MathUtils.randFloat(-2.6, 2.6), Math.sin(angle) * radius - 2.4);
  p.userData.speed = THREE.MathUtils.randFloat(0.07, 0.16);
  p.userData.offset = THREE.MathUtils.randFloat(0, Math.PI * 2);
  particles.add(p);
}

const pointer = new THREE.Vector2();
window.addEventListener("pointermove", (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
});

const clamp01 = (v) => Math.min(Math.max(v, 0), 1);
const range01 = (value, start, end) => clamp01((value - start) / (end - start));
const smootherstep = (value, start, end) => {
  const t = range01(value, start, end);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
const damp = (current, target, lambda, dt) => THREE.MathUtils.damp(current, target, lambda, dt);

const CUT = {
  moveStart: 0.12,
  moveEnd: 0.42,
  cardInStart: 0.38,
  cardInEnd: 0.58,
  cardOutStart: 0.72,
  cardOutEnd: 0.9,
  returnStart: 0.76,
  returnEnd: 0.92,
  zoomStart: 0.955,
  zoomEnd: 1,
  fadeStart: 0.985,
  fadeEnd: 1,
};
let scrollTarget = 0;
let scrollSmooth = 0;

function updateScrollProgress() {
  if (!heroStage) return;
  const top = heroStage.offsetTop;
  const h = heroStage.offsetHeight;
  const range = Math.max(h - window.innerHeight, 1);
  scrollTarget = clamp01((window.scrollY - top) / range);
  if (scrollMeterFill) scrollMeterFill.style.width = `${(scrollTarget * 100).toFixed(1)}%`;
}

window.addEventListener("scroll", updateScrollProgress, { passive: true });

const revealGroups = [...document.querySelectorAll("[data-reveal-group]")];
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const items = [...entry.target.querySelectorAll("[data-reveal]")];
      anime({
        targets: items,
        opacity: [0, 1],
        translateY: [42, 0],
        filter: ["blur(7px)", "blur(0px)"],
        duration: 800,
        delay: anime.stagger(100),
        easing: "cubicBezier(0.16, 1, 0.3, 1)",
      });
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.2 }
);
revealGroups.forEach((section) => revealObserver.observe(section));

function applyTheme(theme) {
  scene.fog.color.setHex(0x03120d);
  ambient.intensity = 0.48;
  keyLight.intensity = 1.14;
  keyLight2.intensity = 0.92;
  rimLight.intensity = 18;
  fillLight.intensity = 10.5;

  ring.material.color.setHex(0x9effdf);
  ring.material.emissive.setHex(0x29b883);
  accentRing.material.color.setHex(0x9effdf);
  accentRing.material.emissive.setHex(0x29b883);
  pMat.color.setHex(0x9effde);
  halo.material.color.setHex(0x66ffd1);
  bloomPass.strength = perf.bloomStrength;
  bloomPass.radius = perf.bloomRadius;
  bloomPass.threshold = perf.bloomThreshold;
}

const clock = new THREE.Clock();
const lookTarget = new THREE.Vector3(0, -0.08, -0.5);
let lastTextVisibility = -1;
let lastCardOut = -1;
let lastZoomPhase = -1;
function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.033);
  const t = clock.elapsedTime;
  scrollSmooth = damp(scrollSmooth, scrollTarget, 1 / TUNE.scrollSmoothing, dt);

  const moveRightIn = smootherstep(scrollSmooth, CUT.moveStart, CUT.moveEnd);
  const moveBackCenter = smootherstep(scrollSmooth, CUT.returnStart, CUT.returnEnd);
  const zoomPhase = smootherstep(scrollSmooth, CUT.zoomStart, CUT.zoomEnd);
  const settleCenter = smootherstep(scrollSmooth, CUT.returnEnd, CUT.zoomStart);
  const fadeOut = smootherstep(scrollSmooth, CUT.fadeStart, CUT.fadeEnd) * TUNE.fadeSpeed;

  const rightAnchor = viewport.rightAnchor;
  const stagedX = rightAnchor * moveRightIn * (1 - moveBackCenter);
  const centerLock = Math.max(moveBackCenter, settleCenter, smootherstep(zoomPhase, 0.01, 0.45));
  const centeredX = THREE.MathUtils.lerp(stagedX, 0, centerLock);

  const cardIn = smootherstep(scrollSmooth, CUT.cardInStart, CUT.cardInEnd);
  const cardOut = smootherstep(scrollSmooth, CUT.cardOutStart, CUT.cardOutEnd);
  const textVisibility = cardIn * (1 - cardOut);

  const needsDomUpdate =
    Math.abs(textVisibility - lastTextVisibility) > perf.domUpdateEpsilon ||
    Math.abs(cardOut - lastCardOut) > perf.domUpdateEpsilon ||
    Math.abs(zoomPhase - lastZoomPhase) > perf.domUpdateEpsilon;

  if (needsDomUpdate) {
    if (heroCopy) {
      heroCopy.style.opacity = textVisibility.toFixed(3);
      heroCopy.style.pointerEvents = textVisibility > 0.05 ? "auto" : "none";
      const yIn = 30 - textVisibility * 34;
      const yOut = cardOut * 120;
      const xIn = -(1 - cardIn) * 36;
      heroCopy.style.transform = `translate3d(${xIn.toFixed(2)}px, ${(yIn - yOut).toFixed(2)}px, 0)`;
    }

    titleWords.forEach((word, index) => {
      const wordStart = index * 0.035;
      const wordProgress = smootherstep(textVisibility, wordStart, wordStart + 0.24);
      word.style.opacity = wordProgress.toFixed(3);
      word.style.transform = `translateY(${(24 * (1 - wordProgress) + cardOut * 8).toFixed(2)}px) rotate(${(3 * (1 - wordProgress)).toFixed(2)}deg)`;
    });

    heroFadeItems.forEach((item, index) => {
      const itemStart = 0.2 + index * 0.12;
      const itemProgress = smootherstep(textVisibility, itemStart, itemStart + 0.28);
      const visibility = itemProgress * (1 - cardOut);
      item.style.opacity = visibility.toFixed(3);
      item.style.transform = `translateY(${(16 * (1 - itemProgress) + cardOut * 20).toFixed(2)}px)`;
    });

    lastTextVisibility = textVisibility;
    lastCardOut = cardOut;
    lastZoomPhase = zoomPhase;
  }

  if (phaseWash) {
    phaseWash.style.opacity = smootherstep(scrollSmooth, 0.82, 0.99).toFixed(3);
  }

  ring.rotation.x = Math.PI * 0.56 + t * 0.09 + moveRightIn * 0.26;
  ring.rotation.y = Math.PI * 0.2 + t * 0.14 + zoomPhase * 0.44;
  ring.rotation.z = Math.PI * 0.08 + t * 0.22 + moveRightIn * 1.2 + zoomPhase * 1.6;
  ring.scale.setScalar(1 + zoomPhase * 0.34);
  halo.rotation.y = t * 0.11 + moveRightIn * 0.46;
  halo.rotation.x = t * 0.07;
  halo.scale.setScalar(1 + zoomPhase * 0.35);
  accentRing.rotation.x = Math.PI * 0.3 - t * 0.11 + moveRightIn * 0.2;
  accentRing.rotation.y = Math.PI * 0.55 + t * 0.19 + zoomPhase * 0.34;
  accentRing.rotation.z = Math.PI * 0.12 - t * 0.32 + moveRightIn * 1.1 + zoomPhase * 2;
  accentRing.position.y = -0.2 + Math.sin(t * 1.5) * 0.12;

  const pointerGain = viewport.pointerBase + moveRightIn * viewport.pointerDelta;
  const targetX = centeredX + pointer.x * pointerGain;
  const targetY = pointer.y * -0.08 - zoomPhase * 0.28;
  group.position.x = damp(group.position.x, targetX, 6.2, dt);
  group.position.y = damp(group.position.y, targetY, 6.2, dt);
  group.rotation.y = damp(group.rotation.y, pointer.x * 0.12 + moveRightIn * 0.3, 6.1, dt);
  group.rotation.x = damp(group.rotation.x, -pointer.y * 0.1 - zoomPhase * 0.14, 6.1, dt);
  const targetScale = viewport.baseScale + zoomPhase * viewport.zoomScale;
  group.scale.setScalar(damp(group.scale.x, targetScale, 5.2, dt));

  camera.position.z = damp(camera.position.z, viewport.cameraBaseZ - zoomPhase * viewport.cameraZoomStrength, 5.2, dt);
  camera.position.y = damp(camera.position.y, viewport.cameraBaseY + zoomPhase * 0.3, 5.2, dt);
  lookTarget.x = damp(lookTarget.x, centeredX * viewport.cameraFollowX, 5.4, dt);
  lookTarget.y = damp(lookTarget.y, -0.08, 5.4, dt);
  lookTarget.z = damp(lookTarget.z, -0.5, 5.4, dt);
  camera.lookAt(lookTarget);

  rimLight.position.x = damp(rimLight.position.x, Math.sin(t * 0.76) * 3.1 + centeredX * 0.32, 4.8, dt);
  rimLight.position.z = damp(rimLight.position.z, 2.9 + Math.cos(t * 0.8) * 1.2, 4.8, dt);
  rimLight.intensity = damp(rimLight.intensity, 12 + zoomPhase * 3, 5, dt);

  const visibility = 1 - clamp01(fadeOut);
  ring.material.opacity = 0.9 * visibility;
  halo.material.opacity = 0.07 * visibility;
  accentRing.material.opacity = 0.9 * visibility;
  pMat.opacity = 0.48 * visibility;

  particles.children.forEach((p, i) => {
    const d = t * p.userData.speed + p.userData.offset;
    p.position.y += Math.sin(d + i) * 0.00125;
    p.position.x += Math.cos(d * 0.45 + i) * 0.00095;
    p.position.z += Math.sin(d * 0.74 + i) * 0.0007;
  });

  if (perf.useBloom) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
}

updateScrollProgress();
applyTheme();
animate();

window.addEventListener("resize", () => {
  viewport = getViewportConfig(window.innerWidth);
  perf = getPerformanceProfile(window.innerWidth);
  bloomPass.strength = perf.bloomStrength;
  bloomPass.radius = perf.bloomRadius;
  bloomPass.threshold = perf.bloomThreshold;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, perf.pixelRatioCap));
  composer.setPixelRatio(Math.min(window.devicePixelRatio, perf.pixelRatioCap));
  composer.setSize(window.innerWidth, window.innerHeight);
  updateScrollProgress();
});
