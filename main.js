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

// Planets
const mercury = createPlanet(3.2, mercuryTexture, 28);

const venus = createPlanet(5.8, venusTexture, 44);
const earth = createPlanet(6, earthTexture, 62);
const mars = createPlanet(4, marsTexture, 78);
const jupiter = createPlanet(12, jupiterTexture, 100);

// Saturn
const saturn = createPlanet(9.5, saturnTexture, 138, {
	innerRadius: 10,
	outerRadius: 20,
	texture: saturnRingTexture,
});

const uranus = createPlanet(7, uranusTexture, 176, {
	innerRadius: 7,
	outerRadius: 12,
	texture: uranusRingTexture,
});
const neptune = createPlanet(7, neptuneTexture, 200);
const pluto = createPlanet(2.8, plutoTexture, 216);

//Points of light
const pointLight = new THREE.PointLight(0xffffff, 30000, 300);
scene.add(pointLight);

// Navigation and UI Controls
class NavigationController {
	constructor() {
		this.animationSpeed = 1;
		this.isPaused = false;
		this.zoomSpeed = 1;
		this.rotateSpeed = 1;
		this.sunIntensity = 30000;
		this.ambientIntensity = 0.2;
		this.focusedPlanet = null;

		this.planetPositions = {
			sun: { x: 0, y: 0, z: 0 },
			mercury: { x: 28, y: 0, z: 0 },
			venus: { x: 44, y: 0, z: 0 },
			earth: { x: 62, y: 0, z: 0 },
			mars: { x: 78, y: 0, z: 0 },
			jupiter: { x: 100, y: 0, z: 0 },
			saturn: { x: 138, y: 0, z: 0 },
			uranus: { x: 176, y: 0, z: 0 },
			neptune: { x: 200, y: 0, z: 0 },
			pluto: { x: 216, y: 0, z: 0 },
		};

		this.planetScales = {
			sun: 16,
			mercury: 3.2,
			venus: 5.8,
			earth: 6,
			mars: 4,
			jupiter: 12,
			saturn: 9.5,
			uranus: 7,
			neptune: 7,
			pluto: 2.8,
		};

		this.setupEventListeners();
		this.updateUI();

		// Initialize speed value display
		const speedValue = document.getElementById("speed-value");
		if (speedValue) {
			speedValue.textContent = `${this.animationSpeed.toFixed(1)}x`;
		}
	}

	setupEventListeners() {
		// Navigation toggle button
		document.getElementById("nav-toggle")?.addEventListener("click", () => {
			this.toggleNavigationMenu();
		});

		// Mini info bar buttons
		document.getElementById("info-btn")?.addEventListener("click", () => {
			this.togglePanel("info-panel");
		});

		document
			.getElementById("controls-btn")
			?.addEventListener("click", () => {
				this.togglePanel("controls-panel");
			});

		// Control buttons
		document
			.getElementById("reset-camera")
			?.addEventListener("click", () => {
				this.resetCamera();
			});

		document
			.getElementById("solar-overview")
			?.addEventListener("click", () => {
				this.solarSystemOverview();
			});

		document
			.getElementById("toggle-fullscreen")
			?.addEventListener("click", () => {
				this.toggleFullscreen();
			});

		// Animation speed slider
		document
			.getElementById("animation-speed")
			?.addEventListener("input", (e) => {
				this.animationSpeed = parseFloat(e.target.value);
				document.getElementById(
					"speed-value"
				).textContent = `${this.animationSpeed.toFixed(1)}x`;
				this.updateAnimationSpeed();
			});

		// Pause animation checkbox
		document
			.getElementById("pause-animation")
			?.addEventListener("change", (e) => {
				this.isPaused = e.target.checked;
				this.updateUI();
			});

		// Keyboard shortcuts
		document.addEventListener("keydown", (e) => {
			this.handleKeyboard(e);
		});

		// Click outside to close panels
		document.addEventListener("click", (e) => {
			if (
				!e.target.closest(".nav-panel") &&
				!e.target.closest(".mini-btn") &&
				!e.target.closest("#nav-toggle")
			) {
				this.hideAllPanels();
			}
		});
	}

	toggleNavigationMenu() {
		const navMenu = document.querySelector(".nav-menu");
		const toggleBtn = document.getElementById("nav-toggle");

		if (navMenu) {
			const isHidden =
				navMenu.style.display === "none" ||
				navMenu.style.display === "";
			navMenu.style.display = isHidden ? "flex" : "none";

			if (toggleBtn) {
				toggleBtn.classList.toggle("active", isHidden);
			}
		}
	}

	togglePanel(panelId) {
		const panel = document.getElementById(panelId);
		const isHidden = panel.classList.contains("hidden");

		this.hideAllPanels();

		if (isHidden) {
			this.showPanel(panelId);
		}
	}

	showPanel(panelId) {
		const panel = document.getElementById(panelId);
		if (panel) {
			panel.classList.remove("hidden");
		}
	}

	hidePanel(panelId) {
		const panel = document.getElementById(panelId);
		if (panel) {
			panel.classList.add("hidden");
		}
	}

	hideAllPanels() {
		const panels = document.querySelectorAll(".nav-panel");
		panels.forEach((panel) => panel.classList.add("hidden"));
	}

	focusOnPlanet(planetName) {
		if (!this.planetPositions[planetName]) return;

		const position = this.planetPositions[planetName];
		const scale = this.planetScales[planetName] || 6;

		// Calculate camera position for good view of the planet
		const distance = scale * 8; // Distance based on planet size
		const height = scale * 3; // Height above the planet

		// Smooth camera movement
		const targetPosition = new THREE.Vector3(
			position.x + distance,
			position.y + height,
			position.z + distance
		);

		const targetLookAt = new THREE.Vector3(
			position.x,
			position.y,
			position.z
		);

		// Animate camera to new position
		this.animateCamera(targetPosition, targetLookAt);

		// Update focused planet
		this.focusedPlanet = planetName;
		this.updatePlanetButtons();
		this.updateUI();

		console.log(`Focusing on ${planetName}`);
	}

	animateCamera(targetPosition, targetLookAt) {
		const startPosition = camera.position.clone();
		const startLookAt = orbit.target.clone();

		const duration = 1000; // 1 second animation
		const startTime = Date.now();

		const animate = () => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);

			// Easing function for smooth animation
			const easeInOutCubic =
				progress < 0.5
					? 4 * progress * progress * progress
					: 1 - Math.pow(-2 * progress + 2, 3) / 2;

			// Interpolate position
			camera.position.lerpVectors(
				startPosition,
				targetPosition,
				easeInOutCubic
			);

			// Interpolate look-at target
			orbit.target.lerpVectors(startLookAt, targetLookAt, easeInOutCubic);
			orbit.update();

			if (progress < 1) {
				requestAnimationFrame(animate);
			}
		};

		animate();
	}

	resetCamera() {
		const targetPosition = new THREE.Vector3(-90, 140, 140);
		const targetLookAt = new THREE.Vector3(0, 0, 0);

		this.animateCamera(targetPosition, targetLookAt);
		this.focusedPlanet = null;
		this.updatePlanetButtons();
		this.updateUI();
	}

	solarSystemOverview() {
		const targetPosition = new THREE.Vector3(0, 300, 300);
		const targetLookAt = new THREE.Vector3(0, 0, 0);

		this.animateCamera(targetPosition, targetLookAt);
		this.focusedPlanet = null;
		this.updatePlanetButtons();
		this.updateUI();
	}

	updatePlanetButtons() {
		document.querySelectorAll(".planet-btn").forEach((btn) => {
			btn.classList.remove("active");
		});

		if (this.focusedPlanet) {
			const activeBtn = document.querySelector(
				`[data-planet="${this.focusedPlanet}"]`
			);
			if (activeBtn) {
				activeBtn.classList.add("active");
			}
		}
	}

	updateAnimationSpeed() {
		// This will be used in the animation loop
	}

	toggleFullscreen() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().catch((err) => {
				console.log(
					`Error attempting to enable fullscreen: ${err.message}`
				);
			});
		} else {
			document.exitFullscreen();
		}
	}

	handleKeyboard(e) {
		// Prevent default behavior for our shortcuts
		const shortcuts = [
			" ",
			"r",
			"f",
			"i",
			"c",
			"1",
			"2",
			"3",
			"4",
			"5",
			"6",
			"7",
			"8",
			"9",
		];

		if (shortcuts.includes(e.key.toLowerCase())) {
			e.preventDefault();
		}

		switch (e.key.toLowerCase()) {
			case " ": // Spacebar - pause/resume
				this.isPaused = !this.isPaused;
				const pauseCheckbox =
					document.getElementById("pause-animation");
				if (pauseCheckbox) {
					pauseCheckbox.checked = this.isPaused;
				}
				this.updateUI();
				break;

			case "r": // Reset camera
				this.resetCamera();
				break;

			case "f": // Toggle fullscreen
				this.toggleFullscreen();
				break;

			case "i": // Toggle info panel
				this.togglePanel("info-panel");
				break;

			case "c": // Toggle controls panel
				this.togglePanel("controls-panel");
				break;

			case "1":
				this.focusOnPlanet("sun");
				break;
			case "2":
				this.focusOnPlanet("mercury");
				break;
			case "3":
				this.focusOnPlanet("venus");
				break;
			case "4":
				this.focusOnPlanet("earth");
				break;
			case "5":
				this.focusOnPlanet("mars");
				break;
			case "6":
				this.focusOnPlanet("jupiter");
				break;
			case "7":
				this.focusOnPlanet("saturn");
				break;
			case "8":
				this.focusOnPlanet("uranus");
				break;
			case "9":
				this.focusOnPlanet("neptune");
				break;
		}
	}

	updateUI() {
		// Update animation status
		const animationStatus = document.getElementById("animation-status");
		if (animationStatus) {
			animationStatus.textContent = this.isPaused
				? "Animation: OFF"
				: "Animation: ON";
		}

		// Update camera info
		const cameraInfo = document.getElementById("camera-info");
		if (cameraInfo) {
			const planetName = this.focusedPlanet
				? this.focusedPlanet.charAt(0).toUpperCase() +
				  this.focusedPlanet.slice(1)
				: "Free";
			cameraInfo.textContent = `Camera: ${planetName}`;
		}
	}

	// Method to be called from animation loop
	updateAnimation() {
		if (this.isPaused) return;

		const speed = this.animationSpeed;

		// Update planet rotations with speed multiplier
		sun.rotateY(0.004 * speed);
		mercury.planet.rotateY(0.004 * speed);
		venus.planet.rotateY(0.002 * speed);
		earth.planet.rotateY(0.02 * speed);
		mars.planet.rotateY(0.018 * speed);
		jupiter.planet.rotateY(0.04 * speed);
		saturn.planet.rotateY(0.038 * speed);
		uranus.planet.rotateY(0.03 * speed);
		neptune.planet.rotateY(0.032 * speed);
		pluto.planet.rotateY(0.008 * speed);

		// Update orbital rotations with speed multiplier
		mercury.planetOrbit.rotateY(0.04 * speed);
		venus.planetOrbit.rotateY(0.015 * speed);
		earth.planetOrbit.rotateY(0.01 * speed);
		mars.planetOrbit.rotateY(0.008 * speed);
		jupiter.planetOrbit.rotateY(0.002 * speed);
		saturn.planetOrbit.rotateY(0.0009 * speed);
		uranus.planetOrbit.rotateY(0.0004 * speed);
		neptune.planetOrbit.rotateY(0.0001 * speed);
		pluto.planetOrbit.rotateY(0.00007 * speed);
	}
}

// Initialize navigation controller
const navigationController = new NavigationController();

function animate() {
	// Use navigation controller for all animations
	navigationController.updateAnimation();

	// Render the scene
	renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener("resize", function () {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});
