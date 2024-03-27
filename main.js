import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import starsTexture from "./src/img/stars.jpg";
import sunTexture from "./src/img/sun.jpg";
import mercuryTexture from "./src/img/mercury.jpg";
import venusTexture from "./src/img/venus.jpg";
import earthTexture from "./src/img/earth.jpg";
import marsTexture from "./src/img/mars.jpg";
import jupiterTexture from "./src/img/jupiter.jpg";
import saturnTexture from "./src/img/saturn.jpg";
import saturnRingTexture from "./src/img/saturn ring.png";
import uranusTexture from "./src/img/uranus.jpg";
import uranusRingTexture from "./src/img/uranus ring.png";
import neptuneTexture from "./src/img/neptune.jpg";
import plutoTexture from "./src/img/pluto.jpg";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Sets the color of the background
renderer.setClearColor(0xfefefe);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);

// Sets orbit control to move the camera around
const orbit = new OrbitControls(camera, renderer.domElement);

// Camera positioning
camera.position.set(-90, 140, 140);
orbit.update();

//added light
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

//Texture loader

const textureLoader = new THREE.TextureLoader();

const geometry = new THREE.SphereGeometry(1000, 60, 40);
// invert the geometry on the x-axis so that all of the faces point inward
geometry.scale(-1, 1, 1);

const texture = textureLoader.load(starsTexture);
const material = new THREE.MeshBasicMaterial({ map: texture });
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

// Sun
const sunGeometry = new THREE.SphereGeometry(16, 30, 30);
const sunMaterial = new THREE.MeshBasicMaterial({
  map: textureLoader.load(sunTexture),
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

//create planets function
const createPlanet = (radius, texture, position, ring) => {
  const geometry = new THREE.SphereGeometry(radius, 30, 30);
  const material = new THREE.MeshStandardMaterial({
    map: textureLoader.load(texture),
  });
  const planet = new THREE.Mesh(geometry, material);
  const planetOrbit = new THREE.Object3D();
  planetOrbit.add(planet);

  if (ring) {
    const ringGeometry = new THREE.RingGeometry(
      ring.innerRadius,
      ring.outerRadius,
      32
    );
    const ringMaterial = new THREE.MeshBasicMaterial({
      map: textureLoader.load(ring.texture),
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = Math.PI / -2;
    ringMesh.position.x = position;
    planetOrbit.add(ringMesh);
  }
  scene.add(planetOrbit);
  planet.position.x = position;
  return { planet, planetOrbit };
};

//Points of light
const pointLight = new THREE.PointLight(0xffffff, 30000, 300);
scene.add(pointLight);

function animate() {
  sun.rotateY(0.004);
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
