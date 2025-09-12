import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import "./panel-controller.js";

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
const createPlanet = (radius, texture, distance, ring) => {
	const geometry = new THREE.SphereGeometry(radius, 30, 30);
	const material = new THREE.MeshStandardMaterial({
		map: textureLoader.load(texture),
	});
	const planet = new THREE.Mesh(geometry, material);
	const planetOrbit = new THREE.Object3D();

	// Position planet at orbital distance from orbit center
	planet.position.x = distance;

	// Add planet to orbit
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
		ringMesh.position.x = distance; // Position ring at same distance as planet
		planetOrbit.add(ringMesh);
	}

	// Add orbit to scene (orbit will be positioned at sun's center)
	scene.add(planetOrbit);
	return { planet, planetOrbit };
};

// Planets
const mercury = createPlanet(3.2, mercuryTexture, 20); // 2 AU * 10

const venus = createPlanet(5.8, venusTexture, 35); // 3.5 AU * 10
const earth = createPlanet(6, earthTexture, 50); // 5 AU * 10
const mars = createPlanet(4, marsTexture, 70); // 7 AU * 10
const jupiter = createPlanet(12, jupiterTexture, 120); // 12 AU * 10

// Saturn
const saturn = createPlanet(9.5, saturnTexture, 180, {
	// 18 AU * 10
	innerRadius: 10,
	outerRadius: 20,
	texture: saturnRingTexture,
});

const uranus = createPlanet(7, uranusTexture, 250, {
	// 25 AU * 10
	innerRadius: 7,
	outerRadius: 12,
	texture: uranusRingTexture,
});
const neptune = createPlanet(7, neptuneTexture, 320); // 32 AU * 10
const pluto = createPlanet(2.8, plutoTexture, 400); // 40 AU * 10

//Points of light
const pointLight = new THREE.PointLight(0xffffff, 30000, 300);
scene.add(pointLight);

// Navigation and UI Controls
class NavigationController {
	constructor() {
		this.animationSpeed = 0.01;
		this.timeSpeed = 1; // Days per second
		this.isPaused = false;
		this.zoomSpeed = 1;
		this.rotateSpeed = 1;
		this.sunIntensity = 30000;
		this.ambientIntensity = 0.2;
		this.focusedPlanet = null;
		this.followingPlanet = false; // Whether camera should follow the planet
		this.followingAngle = 0; // The angle at which we're viewing the planet
		this.followingDistance = 0; // The distance from the planet we're maintaining

		// Time-based simulation
		this.simulationDate = new Date();
		this.startDate = new Date(this.simulationDate); // For elapsed time calculation
		this.lastUpdateTime = Date.now();

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

		this.planets = {
			sun: sun,
			mercury: mercury,
			venus: venus,
			earth: earth,
			mars: mars,
			jupiter: jupiter,
			saturn: saturn,
			uranus: uranus,
			neptune: neptune,
			pluto: pluto,
		};

		this.setupEventListeners();
		this.updateUI();

		// Initialize displays
		const speedValue = document.getElementById("speed-value");
		if (speedValue) {
			speedValue.textContent = `${this.animationSpeed.toFixed(2)}x`;
		}

		const timeValue = document.getElementById("time-value");
		if (timeValue) {
			timeValue.textContent = `${this.timeSpeed} days/sec`;
		}

		const timeMultiplier = document.getElementById("time-multiplier");
		if (timeMultiplier) {
			timeMultiplier.value = this.timeSpeed.toString();
		}

		// Initialize time displays
		this.updateSimulationDateDisplay();
		this.updateSimulationTimeDisplay();
		this.updateTimeElapsedDisplay();

		// Set initial planet positions
		this.updatePlanetPositions();
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
				).textContent = `${this.animationSpeed.toFixed(2)}x`;
				this.updateAnimationSpeed();
			});

		// Time speed slider
		document
			.getElementById("time-speed")
			?.addEventListener("input", (e) => {
				this.timeSpeed = parseFloat(e.target.value);
				document.getElementById(
					"time-value"
				).textContent = `${this.timeSpeed} days/sec`;
			});

		// Date input
		document
			.getElementById("date-input")
			?.addEventListener("change", (e) => {
				this.simulationDate = new Date(e.target.value);
				this.recalculatePositions();
			});

		// Time multiplier dropdown
		document
			.getElementById("time-multiplier")
			?.addEventListener("change", (e) => {
				const value = parseFloat(e.target.value);
				if (value === 0) {
					this.isPaused = true;
					const pauseCheckbox =
						document.getElementById("pause-animation");
					if (pauseCheckbox) {
						pauseCheckbox.checked = true;
					}
					this.updateUI();
				} else {
					this.isPaused = false;
					this.timeSpeed = value;
					const pauseCheckbox =
						document.getElementById("pause-animation");
					if (pauseCheckbox) {
						pauseCheckbox.checked = false;
					}
					this.updateUI();
				}
				document.getElementById("time-value").textContent =
					value === 0 ? "Paused" : `${this.timeSpeed} days/sec`;
			});

		// Time input
		document
			.getElementById("time-input")
			?.addEventListener("change", (e) => {
				const [hours, minutes, seconds] = e.target.value
					.split(":")
					.map(Number);
				this.simulationDate.setHours(hours, minutes, seconds || 0);
				this.recalculatePositions();
			});

		// Time jump buttons in mini controls
		document
			.getElementById("time-backward")
			?.addEventListener("click", () => {
				this.jumpTime(-1); // Jump back 1 day
			});

		document
			.getElementById("time-forward")
			?.addEventListener("click", () => {
				this.jumpTime(1); // Jump forward 1 day
			});

		// Quick time jump buttons in controls panel
		document.getElementById("jump-1day")?.addEventListener("click", () => {
			this.jumpTime(1);
		});

		document
			.getElementById("jump-1month")
			?.addEventListener("click", () => {
				this.jumpTime(30);
			});

		document.getElementById("jump-1year")?.addEventListener("click", () => {
			this.jumpTime(365);
		});

		document.getElementById("jump-today")?.addEventListener("click", () => {
			this.simulationDate = new Date();
			this.startDate = new Date(this.simulationDate);
			this.recalculatePositions();
		});

		// Pause animation checkbox
		document
			.getElementById("pause-animation")
			?.addEventListener("change", (e) => {
				this.isPaused = e.target.checked;
				this.updateUI();
			});

		// Follow planet checkbox
		document
			.getElementById("follow-planet")
			?.addEventListener("change", (e) => {
				this.followingPlanet = e.target.checked;
				if (!this.followingPlanet) {
					this.followingAngle = 0; // Reset following angle
					this.followingDistance = 0; // Reset following distance
				} else {
					// If checked but no planet is focused, focus on the sun
					if (!this.focusedPlanet) {
						this.focusOnPlanet("sun");
					}
				}
				this.updateUI();
			}); // Keyboard shortcuts
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
		// Use the global togglePanel function
		window.togglePanel(panelId);
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
		const planetObj = this.planets[planetName];
		if (!planetObj) return;

		const scale = this.planetScales[planetName] || 6;

		let x, z;

		// Special handling for the sun (which doesn't have planetOrbit)
		if (planetName === "sun") {
			x = 0;
			z = 0;
		} else {
			// Use astronomical calculations for accurate real-time positions
			const astronomicalPositions = this.calculateAstronomicalPositions();
			const planetPosition = astronomicalPositions[planetName];

			if (planetPosition) {
				// Convert astronomical units to scene units (already scaled in getPlanetDistance)
				x = planetPosition.x * 10; // Scene scale factor
				z = planetPosition.z * 10; // Scene scale factor
			} else {
				// Fallback to simplified orbit calculation if astronomical calculation fails
				const distance = this.getPlanetDistance(planetName);
				const angle = planetObj.planetOrbit.rotation.y;
				x = Math.cos(angle) * distance;
				z = Math.sin(angle) * distance;
			}
		}

		// Calculate camera position for good view of the planet
		const cameraDistance = scale * 8; // Distance based on planet size
		const height = scale * 3; // Height above the planet

		// Smooth camera movement
		const targetPosition = new THREE.Vector3(
			x + cameraDistance,
			height,
			z + cameraDistance
		);

		const targetLookAt = new THREE.Vector3(x, 0, z);

		// Animate camera to new position
		this.animateCamera(targetPosition, targetLookAt);

		// Update focused planet
		this.focusedPlanet = planetName;
		this.followingPlanet = true; // Enable camera following

		// Store the initial viewing angle and distance for following
		const planetPos = new THREE.Vector3(x, 0, z);
		const cameraPos = targetPosition;
		const direction = new THREE.Vector3().subVectors(cameraPos, planetPos);
		this.followingAngle = Math.atan2(direction.x, direction.z);
		this.followingDistance = direction.length();

		this.updatePlanetButtons();
		this.updateUI();

		console.log(
			`Focusing on ${planetName} at position (${x.toFixed(
				2
			)}, 0, ${z.toFixed(2)})`
		);
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
		this.followingPlanet = false; // Disable camera following
		this.followingAngle = 0; // Reset following angle
		this.followingDistance = 0; // Reset following distance
		this.updatePlanetButtons();
		this.updateUI();
	}

	solarSystemOverview() {
		const targetPosition = new THREE.Vector3(0, 300, 300);
		const targetLookAt = new THREE.Vector3(0, 0, 0);

		this.animateCamera(targetPosition, targetLookAt);
		this.focusedPlanet = null;
		this.followingPlanet = false; // Disable camera following
		this.followingAngle = 0; // Reset following angle
		this.followingDistance = 0; // Reset following distance
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

	// Update camera to follow focused planet
	getPlanetDistance(planetName) {
		// Orbital distances in AU (matching the astronomical calculations)
		const astronomicalDistances = {
			mercury: 2,
			venus: 3.5,
			earth: 5,
			mars: 7,
			jupiter: 12,
			saturn: 18,
			uranus: 25,
			neptune: 32,
			pluto: 40,
		};

		// Convert AU to scene units (multiply by scale factor)
		const sceneScale = 10;
		return (astronomicalDistances[planetName] || 5) * sceneScale;
	}

	updateCameraForPlanetFollowing() {
		const planetName = this.focusedPlanet;
		if (!planetName) return;

		const planetObj = this.planets[planetName];
		if (!planetObj) return;

		let x, z;

		// Special handling for the sun (which doesn't have planetOrbit)
		if (planetName === "sun") {
			x = 0;
			z = 0;
		} else {
			// Use astronomical calculations for accurate real-time positions
			const astronomicalPositions = this.calculateAstronomicalPositions();
			const planetPosition = astronomicalPositions[planetName];

			if (planetPosition) {
				// Convert astronomical units to scene units
				x = planetPosition.x * 10; // Scene scale factor
				z = planetPosition.z * 10; // Scene scale factor
			} else {
				// Fallback to simplified orbit calculation if astronomical calculation fails
				const distance = this.getPlanetDistance(planetName);
				const angle = planetObj.planetOrbit.rotation.y;
				x = Math.cos(angle) * distance;
				z = Math.sin(angle) * distance;
			}
		}

		// Use the stored viewing angle and distance to maintain consistent camera position
		const planetPosition = new THREE.Vector3(x, 0, z);

		// Calculate camera position using the stored angle and distance
		const cameraX =
			x + Math.sin(this.followingAngle) * this.followingDistance;
		const cameraZ =
			z - Math.cos(this.followingAngle) * this.followingDistance;
		const cameraY = this.followingDistance * 0.3; // Maintain some height above the planet

		const targetPosition = new THREE.Vector3(cameraX, cameraY, cameraZ);
		console.log(
			`${cameraX}, ${cameraY}, ${cameraZ} this.followingAngle, this.followingDistance, x, z: ${this.followingAngle}, ${this.followingDistance}, ${x}, ${z}`
		);
		console.log(Math.sin(this.followingAngle), this.followingDistance);
		const targetLookAt = new THREE.Vector3(x, 0, z);

		// Use smooth follow with a bit of lag/damping for more natural movement
		const smoothFactor = 0.1; // Lower value = smoother, higher = more immediate

		// Smoothly update camera position and target
		camera.position.lerp(targetPosition, smoothFactor);
		orbit.target.lerp(targetLookAt, smoothFactor);
		orbit.update();
	}

	calculateAstronomicalPositions() {
		const currentTime = this.simulationDate.getTime();
		const baseDate = new Date("2000-01-01").getTime();
		const daysSinceBase = (currentTime - baseDate) / (1000 * 60 * 60 * 24);

		// Orbital periods in Earth days (approximate)
		const orbitalPeriods = {
			mercury: 88,
			venus: 225,
			earth: 365.25,
			mars: 687,
			jupiter: 4333,
			saturn: 10759,
			uranus: 30687,
			neptune: 60190,
			pluto: 90560,
		};

		// Semi-major axes in AU (adjusted to prevent overlap)
		const semiMajorAxes = {
			mercury: 2,
			venus: 3.5,
			earth: 5,
			mars: 7,
			jupiter: 12,
			saturn: 18,
			uranus: 25,
			neptune: 32,
			pluto: 40,
		};

		const positions = {};

		Object.keys(orbitalPeriods).forEach((planetName) => {
			const period = orbitalPeriods[planetName];
			const semiMajorAxis = semiMajorAxes[planetName];

			// Calculate mean anomaly
			const meanAnomaly = (2 * Math.PI * daysSinceBase) / period;

			// Simplified Kepler's equation solution (for circular orbits)
			const trueAnomaly = meanAnomaly;

			// Calculate position
			const x = semiMajorAxis * Math.cos(trueAnomaly);
			const z = semiMajorAxis * Math.sin(trueAnomaly);

			positions[planetName] = { x, y: 0, z };
		});

		return positions;
	}

	recalculatePositions() {
		// Update planet positions based on new simulation date
		this.updatePlanetPositions();
		this.updateSimulationDateDisplay();
	}

	updateSimulationDateDisplay() {
		const dateStr = this.simulationDate.toLocaleDateString();
		const simulationDateElement =
			document.getElementById("simulation-date");
		if (simulationDateElement) {
			simulationDateElement.textContent = dateStr;
		}

		// Update date input
		const dateInput = document.getElementById("date-input");
		if (dateInput) {
			dateInput.value = this.simulationDate.toISOString().slice(0, 10);
		}

		// Update time input
		const timeInput = document.getElementById("time-input");
		if (timeInput) {
			const hours = this.simulationDate
				.getHours()
				.toString()
				.padStart(2, "0");
			const minutes = this.simulationDate
				.getMinutes()
				.toString()
				.padStart(2, "0");
			const seconds = this.simulationDate
				.getSeconds()
				.toString()
				.padStart(2, "0");
			timeInput.value = `${hours}:${minutes}:${seconds}`;
		}
	}

	updateSimulationTimeDisplay() {
		const timeStr = this.simulationDate.toLocaleTimeString();
		const simulationTimeElement =
			document.getElementById("simulation-time");
		if (simulationTimeElement) {
			simulationTimeElement.textContent = timeStr;
		}
	}

	updateTimeElapsedDisplay() {
		const elapsedMs =
			this.simulationDate.getTime() - this.startDate.getTime();
		const elapsedDays = Math.abs(elapsedMs / (1000 * 60 * 60 * 24));

		let elapsedText;
		if (elapsedDays < 1) {
			const elapsedHours = Math.abs(elapsedMs / (1000 * 60 * 60));
			if (elapsedHours < 1) {
				const elapsedMinutes = Math.abs(elapsedMs / (1000 * 60));
				elapsedText = `${elapsedMinutes.toFixed(1)} min`;
			} else {
				elapsedText = `${elapsedHours.toFixed(1)} hrs`;
			}
		} else if (elapsedDays < 365) {
			elapsedText = `${elapsedDays.toFixed(1)} days`;
		} else {
			const elapsedYears = elapsedDays / 365;
			elapsedText = `${elapsedYears.toFixed(1)} years`;
		}

		const prefix = elapsedMs >= 0 ? "+" : "-";
		const timeElapsedElement = document.getElementById("time-elapsed");
		if (timeElapsedElement) {
			timeElapsedElement.textContent = `Elapsed: ${prefix}${elapsedText}`;
		}
	}

	jumpTime(days) {
		this.simulationDate = new Date(
			this.simulationDate.getTime() + days * 24 * 60 * 60 * 1000
		);
		this.recalculatePositions();
	}

	updatePlanetPositions() {
		// Update planet orbital positions based on astronomical calculations
		const astronomicalPositions = this.calculateAstronomicalPositions();

		// Scene scale factor to convert AU to scene units
		const sceneScale = 10;

		// Apply astronomical positions to visual planets
		Object.keys(astronomicalPositions).forEach((planetName) => {
			const planetObj = this.planets[planetName];
			const position = astronomicalPositions[planetName];

			if (planetObj && planetObj.planetOrbit && position) {
				// Update the orbit object's rotation to match astronomical position
				const angle = Math.atan2(position.z, position.x);
				planetObj.planetOrbit.rotation.y = angle;

				// Also update the planet's position within the orbit
				const distance = this.getPlanetDistance(planetName);
				planetObj.planet.position.x = distance;
			}
		});
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

	// Handle keyboard shortcuts for disabling planet following
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
			"escape",
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

			case "f": // Toggle following planet
				this.followingPlanet = !this.followingPlanet;
				if (!this.followingPlanet) {
					this.followingAngle = 0; // Reset following angle
					this.followingDistance = 0; // Reset following distance
				}
				const followCheckbox = document.getElementById("follow-planet");
				if (followCheckbox) {
					followCheckbox.checked = this.followingPlanet;
				}
				this.updateUI();
				break;

			case "i": // Toggle info panel
				this.togglePanel("info-panel");
				break;

			case "c": // Toggle controls panel
				this.togglePanel("controls-panel");
				break;

			case "escape": // Stop following planet but keep focus
				if (this.followingPlanet) {
					this.followingPlanet = false;
					this.followingAngle = 0; // Reset following angle
					this.followingDistance = 0; // Reset following distance
					const followCheckbox =
						document.getElementById("follow-planet");
					if (followCheckbox) {
						followCheckbox.checked = false;
					}
					this.updateUI();
				}
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
			const followText =
				this.followingPlanet && this.focusedPlanet
					? " (Following)"
					: "";
			cameraInfo.textContent = `Camera: ${planetName}${followText}`;
		}
	}

	// Method to be called from animation loop
	updateAnimation() {
		if (this.isPaused) return;

		const currentTime = Date.now();
		const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
		this.lastUpdateTime = currentTime;

		// Advance simulation time
		const timeAdvance = this.timeSpeed * deltaTime; // Days to advance
		this.simulationDate = new Date(
			this.simulationDate.getTime() + timeAdvance * 24 * 60 * 60 * 1000
		);

		// Update planet orbital rotations based on astronomical calculations
		this.updatePlanetPositions();
		this.updateSimulationDateDisplay();
		this.updateSimulationTimeDisplay();
		this.updateTimeElapsedDisplay();

		// If following a planet, update camera position to keep following it
		if (this.followingPlanet && this.focusedPlanet) {
			this.updateCameraForPlanetFollowing();
		}

		const speed = this.animationSpeed;

		// Update planet axial rotations based on real astronomical data
		// Rotation periods in Earth days (negative values indicate retrograde rotation)
		const rotationPeriods = {
			sun: 25, // ~25 days (differential rotation, approximate)
			mercury: 58.6, // 58.6 days
			venus: -243, // 243 days (retrograde)
			earth: 1, // 1 day (24 hours)
			mars: 1.03, // 1.03 days
			jupiter: 0.41, // 0.41 days (9.9 hours)
			saturn: 0.45, // 0.45 days (10.8 hours)
			uranus: -0.72, // 0.72 days retrograde (17.2 hours)
			neptune: 0.67, // 0.67 days (16.1 hours)
			pluto: 6.39, // 6.39 days
		};

		// Calculate rotation speed based on time elapsed and rotation period
		const daysPerSecond = this.timeSpeed; // How many Earth days pass per second in simulation
		const baseRotationSpeed = (2 * Math.PI) / (24 * 60 * 60); // Base rotation speed for 1 Earth day

		// Apply axial rotation to each planet
		Object.keys(rotationPeriods).forEach((planetName) => {
			const period = rotationPeriods[planetName];
			const planetObj = this.planets[planetName];

			if (planetObj) {
				// Calculate rotation speed: full rotation / period in seconds
				const rotationSpeed =
					((2 * Math.PI) / period) * daysPerSecond * deltaTime;

				// Apply rotation (negative period means retrograde rotation)
				if (planetName === "sun") {
					sun.rotateY(rotationSpeed);
				} else {
					planetObj.planet.rotateY(rotationSpeed);
				}
			}
		});
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
