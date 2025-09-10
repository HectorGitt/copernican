import "./earth-view.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import earthTexture from "./src/img/earth.jpg";
import starsTexture from "./src/img/stars.jpg";

// Scene Setup
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000011, 1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
);

// Enhanced Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 15;
controls.maxDistance = 50;
controls.autoRotate = false;
controls.autoRotateSpeed = 0.5;

// Camera positioning
camera.position.set(25, 15, 25);
controls.update();

// Sunlight Simulation System
class SunlightSimulator {
	constructor() {
		this.currentTime = new Date();
		this.timeSpeed = 1; // 1 = real time, higher = faster
		this.isRealTime = true;
		this.manualTime = 12; // Manual time in hours (0-24)
		this.isPaused = false; // New pause state
		this.useLocalTime = true; // Use client's local timezone
		this.clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

		this.setupSun();
		this.setupLighting();
		this.setupAtmosphere();
		this.updateTimezoneDisplay();
	}

	setupSun() {
		// Create visible sun - STATIONARY at fixed position
		const sunGeometry = new THREE.SphereGeometry(2, 32, 32);
		const sunMaterial = new THREE.MeshBasicMaterial({
			color: 0xffffff,
		});

		this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
		// Fixed position - Sun stays here and never moves
		this.sun.position.set(100, 0, 0);
		scene.add(this.sun);

		// Sun glow effect
		const glowGeometry = new THREE.SphereGeometry(3, 32, 32);
		const glowMaterial = new THREE.MeshBasicMaterial({
			color: 0xffffaa,
			transparent: true,
			opacity: 0.3,
			side: THREE.BackSide,
		});

		this.sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
		this.sun.add(this.sunGlow);
	}

	setupLighting() {
		// Main sunlight (directional light) - STATIONARY
		this.sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
		this.sunLight.position.set(100, 0, 0); // Fixed position matching the sun
		this.sunLight.target.position.set(0, 0, 0); // Always points to Earth center
		this.sunLight.castShadow = true;
		this.sunLight.shadow.mapSize.width = 4096;
		this.sunLight.shadow.mapSize.height = 4096;
		this.sunLight.shadow.camera.near = 0.1;
		this.sunLight.shadow.camera.far = 200;
		this.sunLight.shadow.camera.left = -50;
		this.sunLight.shadow.camera.right = 50;
		this.sunLight.shadow.camera.top = 50;
		this.sunLight.shadow.camera.bottom = -50;
		scene.add(this.sunLight);
		scene.add(this.sunLight.target);

		// Ambient light for space illumination
		this.spaceAmbient = new THREE.AmbientLight(0xffffff, 0.1);
		scene.add(this.spaceAmbient);

		// Earth's atmospheric scattering simulation - moved farther away and reduced intensity
		this.atmosphereLight = new THREE.DirectionalLight(0xffffff, 0.1); // Changed to white light
		this.atmosphereLight.position.set(-150, 0, 0); // Moved much farther away (from -30 to -150)
		this.atmosphereLight.target.position.set(0, 0, 0); // Always points to Earth center
		this.atmosphereLight.castShadow = false; // Disable shadows for atmosphere light
		scene.add(this.atmosphereLight);
		scene.add(this.atmosphereLight.target);
	}

	setupAtmosphere() {
		// Create atmosphere glow around Earth
		const atmosphereGeometry = new THREE.SphereGeometry(10.5, 64, 64);
		const atmosphereMaterial = new THREE.ShaderMaterial({
			uniforms: {
				c: { value: 0.8 },
				p: { value: 6.0 },
				glowColor: { value: new THREE.Color(0xffffff) }, // Changed to white glow
				viewVector: { value: camera.position },
			},
			vertexShader: `
        uniform vec3 viewVector;
        uniform float c;
        uniform float p;
        varying float intensity;
        void main() {
          vec3 vNormal = normalize(normalMatrix * normal);
          vec3 vNormel = normalize(normalMatrix * viewVector);
          intensity = pow(c - dot(vNormal, vNormel), p);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
			fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4(glow, intensity);
        }
      `,
			side: THREE.BackSide,
			blending: THREE.AdditiveBlending,
			transparent: true,
		});

		this.atmosphere = new THREE.Mesh(
			atmosphereGeometry,
			atmosphereMaterial
		);
		earthGroup.add(this.atmosphere);
	}

	// Calculate Earth's rotation based on time (Sun remains stationary)
	calculateEarthRotation(timeInHours) {
		// Earth rotates 360° in 24 hours = 15°/hour
		// We want local solar noon (12:00) to face the Sun (sun positioned on +X).
		// Therefore rotation should be 0 at 12:00, and 180° at 00:00 (midnight).
		// Compute degrees as (12 - hours) * 15 and convert to radians.
		const hours = ((timeInHours % 24) + 24) % 24; // normalize to [0,24)
		const degrees = (12 - hours) * 15; // 15° per hour, 0° at noon
		const earthRotationAngle = degrees * (Math.PI / 180);
		return earthRotationAngle;
	}

	getCurrentTime() {
		if (this.isPaused) {
			return this.manualTime; // Return current time when paused
		}

		if (this.isRealTime) {
			const now = new Date();
			if (this.useLocalTime) {
				// Use client's local time
				return (
					now.getHours() +
					now.getMinutes() / 60 +
					now.getSeconds() / 3600
				);
			} else {
				// Use UTC time
				return (
					now.getUTCHours() +
					now.getUTCMinutes() / 60 +
					now.getUTCSeconds() / 3600
				);
			}
		} else {
			return this.manualTime;
		}
	}

	getCurrentDate() {
		const now = new Date();
		return {
			date: now,
			localTime: {
				hours: now.getHours(),
				minutes: now.getMinutes(),
				seconds: now.getSeconds(),
				timezone: this.clientTimezone,
				offset: now.getTimezoneOffset(),
			},
			utcTime: {
				hours: now.getUTCHours(),
				minutes: now.getUTCMinutes(),
				seconds: now.getUTCSeconds(),
			},
		};
	}

	updateTimezoneDisplay() {
		const timezoneDisplay = document.getElementById("timezone-info");
		if (timezoneDisplay) {
			const offset = new Date().getTimezoneOffset();
			const offsetHours = Math.floor(Math.abs(offset) / 60);
			const offsetMinutes = Math.abs(offset) % 60;
			const offsetSign = offset <= 0 ? "+" : "-";

			timezoneDisplay.textContent = `${
				this.clientTimezone
			} (UTC${offsetSign}${offsetHours
				.toString()
				.padStart(2, "0")}:${offsetMinutes
				.toString()
				.padStart(2, "0")})`;
		}
	}

	updateEarthRotation() {
		const currentHour = this.getCurrentTime();
		const rotationAngle = this.calculateEarthRotation(currentHour);

		// Rotate Earth around its Y-axis (day/night cycle)
		// Note: We're rotating the entire earthGroup which includes markers
		earthGroup.rotation.y = rotationAngle;

		return currentHour;
	}

	updateLightingIntensity(timeInHours) {
		// Keep sunlight and atmosphere constant; only Earth's rotation determines day/night
		this.sunLight.intensity = 1.5;
		this.sunLight.color.setRGB(1, 1, 0.8); // Slightly warm white
		this.atmosphere.material.uniforms.c.value = 0.8;
		this.sunGlow.material.opacity = 0.35;
	}

	setTimeSpeed(speed) {
		this.timeSpeed = speed;
	}

	setManualTime(hours) {
		this.manualTime = hours;
		this.isRealTime = false;
	}

	enableRealTime() {
		this.isRealTime = true;
		// Always sync to system time when enabling real-time
		const now = new Date();
		if (this.useLocalTime) {
			this.manualTime =
				now.getHours() +
				now.getMinutes() / 60 +
				now.getSeconds() / 3600;
		} else {
			this.manualTime =
				now.getUTCHours() +
				now.getUTCMinutes() / 60 +
				now.getUTCSeconds() / 3600;
		}
	}

	pauseTime() {
		this.isPaused = true;
	}

	resumeTime() {
		this.isPaused = false;
	}

	togglePause() {
		this.isPaused = !this.isPaused;
		return this.isPaused;
	}

	setTimeMode(useLocal) {
		this.useLocalTime = useLocal;
		this.updateTimezoneDisplay();
	}

	getFormattedTime() {
		const dateInfo = this.getCurrentDate();
		const currentTime = this.getCurrentTime();

		const hours = Math.floor(currentTime);
		const minutes = Math.floor((currentTime - hours) * 60);
		const seconds = Math.floor(((currentTime - hours) * 60 - minutes) * 60);

		return {
			time: `${hours.toString().padStart(2, "0")}:${minutes
				.toString()
				.padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
			timeOnly: `${hours.toString().padStart(2, "0")}:${minutes
				.toString()
				.padStart(2, "0")}`,
			timezone: this.useLocalTime ? dateInfo.localTime.timezone : "UTC",
			date: dateInfo.date.toLocaleDateString(),
			isLocal: this.useLocalTime,
		};
	}

	animate() {
		if (!this.isPaused && !this.isRealTime) {
			// Advance manual time only when not paused
			this.manualTime += this.timeSpeed * 0.001; // Adjust speed
			if (this.manualTime >= 24) this.manualTime = 0;
		}

		const currentTime = this.updateEarthRotation();
		this.updateLightingIntensity(currentTime);

		// Update atmosphere shader uniforms
		this.atmosphere.material.uniforms.viewVector.value = camera.position;

		return currentTime;
	}
}

// User Timezone Marker System
class UserTimezoneMarker {
	constructor() {
		this.userMarker = null;
		this.userLabel = null;
		this.isVisible = true;
		this.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

		this.createUserMarker();
		this.setupEventListeners();
	}

	// Get approximate coordinates for timezone (simplified mapping)
	getTimezoneCoordinates(timezone) {
		// Major timezone to coordinates mapping (approximate)
		const timezoneMap = {
			// Americas
			"America/New_York": { lat: 40.7128, lon: -74.006 },
			"America/Los_Angeles": { lat: 34.0522, lon: -118.2437 },
			"America/Chicago": { lat: 41.8781, lon: -87.6298 },
			"America/Denver": { lat: 39.7392, lon: -104.9903 },
			"America/Toronto": { lat: 43.6532, lon: -79.3832 },
			"America/Mexico_City": { lat: 19.4326, lon: -99.1332 },
			"America/Sao_Paulo": { lat: -23.5505, lon: -46.6333 },
			"America/Buenos_Aires": { lat: -34.6118, lon: -58.396 },

			// Europe
			"Europe/London": { lat: 51.5074, lon: -0.1278 },
			"Europe/Paris": { lat: 48.8566, lon: 2.3522 },
			"Europe/Berlin": { lat: 52.52, lon: 13.405 },
			"Europe/Rome": { lat: 41.9028, lon: 12.4964 },
			"Europe/Madrid": { lat: 40.4168, lon: -3.7038 },
			"Europe/Amsterdam": { lat: 52.3676, lon: 4.9041 },
			"Europe/Stockholm": { lat: 59.3293, lon: 18.0686 },
			"Europe/Moscow": { lat: 55.7558, lon: 37.6176 },

			// Asia
			"Asia/Tokyo": { lat: 35.6762, lon: 139.6503 },
			"Asia/Shanghai": { lat: 31.2304, lon: 121.4737 },
			"Asia/Hong_Kong": { lat: 22.3193, lon: 114.1694 },
			"Asia/Singapore": { lat: 1.3521, lon: 103.8198 },
			"Asia/Mumbai": { lat: 19.076, lon: 72.8777 },
			"Asia/Dubai": { lat: 25.2048, lon: 55.2708 },
			"Asia/Seoul": { lat: 37.5665, lon: 126.978 },
			"Asia/Bangkok": { lat: 13.7563, lon: 100.5018 },

			// Oceania
			"Australia/Sydney": { lat: -33.8688, lon: 151.2093 },
			"Australia/Melbourne": { lat: -37.8136, lon: 144.9631 },
			"Pacific/Auckland": { lat: -36.8485, lon: 174.7633 },

			// Africa
			"Africa/Cairo": { lat: 30.0444, lon: 31.2357 },
			"Africa/Johannesburg": { lat: -26.2041, lon: 28.0473 },
			"Africa/Lagos": { lat: 6.5244, lon: 3.3792 },
		};

		// Return coordinates if found, otherwise estimate from timezone offset
		if (timezoneMap[timezone]) {
			return timezoneMap[timezone];
		}

		// Fallback: estimate longitude from timezone offset
		const offset = new Date().getTimezoneOffset() / 60; // Hours from UTC
		const estimatedLon = -offset * 15; // 15 degrees per hour
		return { lat: 0, lon: estimatedLon }; // Place on equator
	}

	// Convert latitude/longitude to 3D coordinates on sphere
	latLonToVector3(lat, lon, radius) {
		const phi = (90 - lat) * (Math.PI / 180);
		const theta = (lon + 180) * (Math.PI / 180);

		const x = -(radius * Math.sin(phi) * Math.cos(theta));
		const z = radius * Math.sin(phi) * Math.sin(theta);
		const y = radius * Math.cos(phi);

		return new THREE.Vector3(x, y, z);
	}

	createUserMarker() {
		const coords = this.getTimezoneCoordinates(this.timezone);
		const earthRadius = 10;

		// Create distinctive user marker (smaller)
		const markerGroup = new THREE.Group();

		// Main marker - smaller and unobtrusive
		const markerGeometry = new THREE.SphereGeometry(0.35, 12, 12);
		const markerMaterial = new THREE.MeshPhongMaterial({
			color: 0x00ff00, // Bright green for user location
			transparent: true,
			opacity: 0.9,
		});

		const marker = new THREE.Mesh(markerGeometry, markerMaterial);

		// Pulsing ring effect (smaller)
		const ringGeometry = new THREE.RingGeometry(0.6, 1.0, 32);
		const ringMaterial = new THREE.MeshBasicMaterial({
			color: 0x00ff00,
			transparent: true,
			opacity: 0.35,
			side: THREE.DoubleSide,
		});
		const ring = new THREE.Mesh(ringGeometry, ringMaterial);
		ring.lookAt(camera.position); // Face the camera

		// Vertical beam effect (shorter)
		const beamGeometry = new THREE.CylinderGeometry(0.06, 0.06, 7.5, 8);
		const beamMaterial = new THREE.MeshBasicMaterial({
			color: 0x00ff00,
			transparent: true,
			opacity: 0.28,
		});
		const beam = new THREE.Mesh(beamGeometry, beamMaterial);
		beam.position.y = 3.75; // Extend upward from surface

		markerGroup.add(marker);
		markerGroup.add(ring);
		markerGroup.add(beam);

		// Position on Earth surface (slightly closer)
		const position = this.latLonToVector3(
			coords.lat,
			coords.lon,
			earthRadius + 0.45
		);
		markerGroup.position.copy(position);

		// Store references for animation
		markerGroup.userData = {
			ring: ring,
			beam: beam,
			marker: marker,
			coords: coords,
			phase: 0,
		};

		earthGroup.add(markerGroup);
		this.userMarker = markerGroup;

		// Create label
		this.createUserLabel(coords);

		console.log(
			`User timezone marker created for ${this.timezone} at ${coords.lat}, ${coords.lon}`
		);
	}

	createUserLabel(coords) {
		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d");
		canvas.width = 220;
		canvas.height = 56;

		// Background (smaller)
		context.fillStyle = "rgba(0, 100, 0, 0.85)";
		context.fillRect(0, 0, canvas.width, canvas.height);

		// Border
		context.strokeStyle = "#00ff00";
		context.lineWidth = 2;
		context.strokeRect(0, 0, canvas.width, canvas.height);

		// Text (smaller font)
		context.fillStyle = "#ffffff";
		context.font = "bold 14px Arial";
		context.textAlign = "center";
		context.fillText("📍 Your Location", canvas.width / 2, 22);

		context.font = "11px Arial";
		context.fillText(this.timezone, canvas.width / 2, 38);
		context.fillText(
			`${coords.lat.toFixed(1)}°, ${coords.lon.toFixed(1)}°`,
			canvas.width / 2,
			50
		);

		const texture = new THREE.CanvasTexture(canvas);
		const material = new THREE.SpriteMaterial({
			map: texture,
			transparent: true,
		});
		const sprite = new THREE.Sprite(material);

		const position = this.latLonToVector3(coords.lat, coords.lon, 10);
		sprite.position.copy(position);
		sprite.position.multiplyScalar(1.3);
		sprite.scale.set(3.2, 1.2, 1);

		earthGroup.add(sprite);
		this.userLabel = sprite;
	}

	setupEventListeners() {
		// Add toggle button listener when DOM is ready
		document.addEventListener("DOMContentLoaded", () => {
			const toggleBtn = document.getElementById("toggle-user-marker");
			if (toggleBtn) {
				toggleBtn.addEventListener("click", () => {
					this.toggleVisibility();
				});
			}
		});
	}

	toggleVisibility() {
		this.isVisible = !this.isVisible;
		if (this.userMarker) {
			this.userMarker.visible = this.isVisible;
		}
		if (this.userLabel) {
			this.userLabel.visible = this.isVisible;
		}

		const toggleBtn = document.getElementById("toggle-user-marker");
		if (toggleBtn) {
			toggleBtn.textContent = this.isVisible
				? "👤 Hide My Location"
				: "👤 Show My Location";
			toggleBtn.classList.toggle("active", this.isVisible);
		}
	}

	animate() {
		if (!this.userMarker || !this.isVisible) return;

		const time = Date.now() * 0.001;
		const userData = this.userMarker.userData;

		// Pulsing ring animation
		const pulseScale = 1 + 0.3 * Math.sin(time * 2);
		userData.ring.scale.setScalar(pulseScale);
		userData.ring.material.opacity = 0.2 + 0.3 * Math.sin(time * 2);

		// Beam opacity animation
		userData.beam.material.opacity = 0.1 + 0.2 * Math.sin(time * 1.5);

		// Keep ring facing camera
		userData.ring.lookAt(camera.position);
	}
}

// Earth Creation
const textureLoader = new THREE.TextureLoader();
const earthGeometry = new THREE.SphereGeometry(10, 64, 64);
const earthMaterial = new THREE.MeshPhongMaterial({
	map: textureLoader.load(earthTexture),
	shininess: 100,
	transparent: false,
	opacity: 1.0,
});

const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earth.castShadow = true;
earth.receiveShadow = true;

// Create Earth group to hold both the planet and markers
const earthGroup = new THREE.Group();
earthGroup.add(earth);
scene.add(earthGroup);

// Initialize sunlight simulator after earthGroup is created
const sunlightSim = new SunlightSimulator();

// Star Field Background with image texture
function createStarField() {
	// Use the imported stars texture
	const starsTextureMap = textureLoader.load(starsTexture);

	// Create a large sphere with inside faces
	const starsGeometry = new THREE.SphereGeometry(900, 64, 64);
	const starsMaterial = new THREE.MeshBasicMaterial({
		map: starsTextureMap,
		side: THREE.BackSide, // Show inside of sphere
	});

	// Create mesh and add to scene
	const stars = new THREE.Mesh(starsGeometry, starsMaterial);
	scene.add(stars);

	// Also add some particle stars for additional depth
	const starsPointsGeometry = new THREE.BufferGeometry();
	const starsPointsMaterial = new THREE.PointsMaterial({
		color: 0xffffff,
		size: 1.5,
		sizeAttenuation: false,
	});

	const starsVertices = [];
	for (let i = 0; i < 3000; i++) {
		const x = (Math.random() - 0.5) * 2000;
		const y = (Math.random() - 0.5) * 2000;
		const z = (Math.random() - 0.5) * 2000;
		starsVertices.push(x, y, z);
	}

	starsPointsGeometry.setAttribute(
		"position",
		new THREE.Float32BufferAttribute(starsVertices, 3)
	);
	const starsPoints = new THREE.Points(
		starsPointsGeometry,
		starsPointsMaterial
	);
	scene.add(starsPoints);
}

// Initialize user timezone marker
const userLocationMarker = new UserTimezoneMarker();

// Create the star field after everything else is initialized
createStarField();

// EONET Categories Data
const eonetCategories = {
	title: "EONET Event Categories",
	description:
		"List of all the available event categories in the EONET system",
	categories: [
		{
			id: 6,
			title: "Drought",
			link: "https://eonet.gsfc.nasa.gov/api/v2.1/categories/6",
			description:
				"Long lasting absence of precipitation affecting agriculture and livestock, and the overall availability of food and water.",
			color: 0x8b4513,
			size: 0.5,
			emoji: "🏜️",
		},
		{
			id: 7,
			title: "Dust and Haze",
			link: "https://eonet.gsfc.nasa.gov/api/v2.1/categories/7",
			description:
				"Related to dust storms, air pollution and other non-volcanic aerosols. Volcano-related plumes shall be included with the originating eruption event.",
			color: 0xffd700,
			size: 0.6,
			emoji: "🌫️",
		},
		{
			id: 16,
			title: "Earthquakes",
			link: "https://eonet.gsfc.nasa.gov/api/v2.1/categories/16",
			description:
				"Related to all manner of shaking and displacement. Certain aftermath of earthquakes may also be found under landslides and floods.",
			color: 0x8b4513,
			size: 0.6,
			emoji: "🌋",
		},
		{
			id: 9,
			title: "Floods",
			link: "https://eonet.gsfc.nasa.gov/api/v2.1/categories/9",
			description:
				"Related to aspects of actual flooding--e.g., inundation, water extending beyond river and lake extents.",
			color: 0x0080ff,
			size: 0.7,
			emoji: "🌊",
		},
		{
			id: 14,
			title: "Landslides",
			link: "https://eonet.gsfc.nasa.gov/api/v2.1/categories/14",
			description:
				"Related to landslides and variations thereof: mudslides, avalanche.",
			color: 0x654321,
			size: 0.6,
			emoji: "⛰️",
		},
		{
			id: 19,
			title: "Manmade",
			link: "https://eonet.gsfc.nasa.gov/api/v2.1/categories/19",
			description:
				"Events that have been human-induced and are extreme in their extent.",
			color: 0xff69b4,
			size: 0.5,
			emoji: "🏭",
		},
		{
			id: 15,
			title: "Sea and Lake Ice",
			link: "https://eonet.gsfc.nasa.gov/api/v2.1/categories/15",
			description:
				"Related to all ice that resides on oceans and lakes, including sea and lake ice (permanent and seasonal) and icebergs.",
			color: 0x87ceeb,
			size: 0.4,
			emoji: "❄️",
		},
		{
			id: 10,
			title: "Severe Storms",
			link: "https://eonet.gsfc.nasa.gov/api/v2.1/categories/10",
			description:
				"Related to the atmospheric aspect of storms (hurricanes, cyclones, tornadoes, etc.). Results of storms may be included under floods, landslides, etc.",
			color: 0xffff00,
			size: 0.8,
			emoji: "🌪️",
		},
		{
			id: 17,
			title: "Snow",
			link: "https://eonet.gsfc.nasa.gov/api/v2.1/categories/17",
			description:
				"Related to snow events, particularly extreme/anomalous snowfall in either timing or extent/depth.",
			color: 0xffffff,
			size: 0.4,
			emoji: "❄️",
		},
		{
			id: 18,
			title: "Temperature Extremes",
			link: "https://eonet.gsfc.nasa.gov/api/v2.1/categories/18",
			description:
				"Related to anomalous land temperatures, either heat or cold.",
			color: 0xff6347,
			size: 0.5,
			emoji: "🔥",
		},
		{
			id: 12,
			title: "Volcanoes",
			link: "https://eonet.gsfc.nasa.gov/api/v2.1/categories/12",
			description:
				"Related to both the physical effects of an eruption (rock, ash, lava) and the atmospheric (ash and gas plumes).",
			color: 0xff0000,
			size: 1.0,
			emoji: "🌋",
		},
		{
			id: 13,
			title: "Water Color",
			link: "https://eonet.gsfc.nasa.gov/api/v2.1/categories/13",
			description:
				"Related to events that alter the appearance of water: phytoplankton, red tide, algae, sediment, whiting, etc.",
			color: 0x00ffff,
			size: 0.5,
			emoji: "🌊",
		},
		{
			id: 8,
			title: "Wildfires",
			link: "https://eonet.gsfc.nasa.gov/api/v2.1/categories/8",
			description:
				"Wildland fires includes all nature of fire, in forest and plains, as well as those that spread to become urban and industrial fire events. Fires may be naturally caused or manmade.",
			color: 0xff4500,
			size: 0.8,
			emoji: "🔥",
		},
	],
};

// Helper function to get category by ID
function getCategoryById(categoryId) {
	return eonetCategories.categories.find(
		(category) => category.id === categoryId
	);
}

// Helper function to get category key from title
function getCategoryKey(title) {
	// Convert category title to a key (e.g. "Wildfires" -> "wildfires")
	const map = {
		Wildfires: "wildfires",
		Volcanoes: "volcanoes",
		Earthquakes: "earthquakes",
		Floods: "floods",
		"Severe Storms": "storms",
		Drought: "droughts",
		"Dust and Haze": "dustHaze",
		"Sea and Lake Ice": "seaLakeIce",
		Snow: "snow",
		Landslides: "landslides",
		Manmade: "manmade",
		"Temperature Extremes": "tempExtremes",
		"Water Color": "waterColor",
	};

	return map[title] || title.toLowerCase().replace(/\s+/g, "");
}

// Create category color map
const categoryMap = {};
eonetCategories.categories.forEach((category) => {
	const key = getCategoryKey(category.title);
	categoryMap[key] = {
		id: category.id,
		title: category.title,
		color: category.color,
		size: category.size,
		description: category.description,
		link: category.link,
		emoji: category.emoji || "📍",
	};
});

// Enhanced EONET Data Overlay for Earth View
class EarthViewEONET {
	constructor() {
		this.events = [];
		this.markers = [];
		this.labels = [];
		this.categories = eonetCategories.categories;
		this.eventTypes = this.initEventTypesFromCategories();
		this.animationSpeed = 1;
		this.markerSize = 0.5;
		this.showLabels = true;
		this.selectedMarker = null;
		this.eventLimit = 200; // Default limit of events to display

		this.setupEventListeners();
		this.setupFilterButtons();
		this.createLegend();
		this.fetchData();
	}

	initEventTypesFromCategories() {
		const eventTypes = {};

		this.categories.forEach((category) => {
			const key = getCategoryKey(category.title);
			eventTypes[key] = {
				id: category.id,
				title: category.title,
				color: category.color || 0xcccccc,
				size: category.size || 0.5,
				description: category.description,
				link: category.link,
				emoji: category.emoji || "📍",
				glow: this.calculateGlowColor(category.color || 0xcccccc),
			};
		});

		return eventTypes;
	}

	calculateGlowColor(baseColor) {
		// Calculate a slightly brighter version of the base color for the glow
		const color = new THREE.Color(baseColor);
		color.r = Math.min(1, color.r * 1.3);
		color.g = Math.min(1, color.g * 1.3);
		color.b = Math.min(1, color.b * 1.3);
		return color.getHex();
	}

	setupFilterButtons() {
		const filterContainer = document.querySelector(".filter-buttons");
		if (!filterContainer) return;

		// Clear existing buttons
		filterContainer.innerHTML = "";

		// Add "All Events" button
		const allButton = document.createElement("button");
		allButton.id = "filter-all";
		allButton.className = "filter-btn active";
		allButton.textContent = "All Events";
		filterContainer.appendChild(allButton);

		// Add a button for each category
		this.categories.forEach((category) => {
			const button = document.createElement("button");
			const key = getCategoryKey(category.title);
			button.id = `filter-${key}`;
			button.className = "filter-btn";
			button.textContent = category.title;

			// Set button background color to match category
			const color = new THREE.Color(category.color || 0xcccccc);
			const r = Math.floor(color.r * 255);
			const g = Math.floor(color.g * 255);
			const b = Math.floor(color.b * 255);
			button.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.7)`;

			// Set text color (white or black) based on background brightness
			const brightness = (r * 299 + g * 587 + b * 114) / 1000;
			button.style.color = brightness > 128 ? "#000" : "#fff";

			filterContainer.appendChild(button);
		});
	}

	createLegend() {
		const legendContainer = document.querySelector(".legend");
		if (!legendContainer) return;

		// Clear existing legend
		legendContainer.innerHTML = "<h4>🏷️ Event Types</h4>";

		// Add a legend item for each category
		this.categories.forEach((category) => {
			const item = document.createElement("div");
			item.className = "legend-item";

			const color = new THREE.Color(category.color || 0xcccccc);
			const r = Math.floor(color.r * 255);
			const g = Math.floor(color.g * 255);
			const b = Math.floor(color.b * 255);

			item.innerHTML = `
				<span class="legend-color" style="background-color: rgb(${r}, ${g}, ${b})"></span>
				<span class="legend-text">${category.title}</span>
			`;

			legendContainer.appendChild(item);
		});
	}

	setupEventListeners() {
		// Marker size control
		document
			.getElementById("marker-size")
			.addEventListener("input", (e) => {
				this.markerSize = parseFloat(e.target.value);
				this.updateMarkerSizes();
			});

		// Animation speed control
		document
			.getElementById("animation-speed")
			.addEventListener("input", (e) => {
				this.animationSpeed = parseFloat(e.target.value);
			});

		// Show labels toggle
		document
			.getElementById("show-labels")
			.addEventListener("change", (e) => {
				this.showLabels = e.target.checked;
				this.toggleLabels();
			});

		// Event limit control
		document
			.getElementById("event-limit")
			.addEventListener("input", (e) => {
				this.eventLimit = parseInt(e.target.value);
				document.getElementById("event-limit-value").textContent =
					this.eventLimit;
			});

		// Refresh data button
		document
			.getElementById("refresh-data")
			.addEventListener("click", () => {
				this.fetchData();
			});

		// Auto rotate toggle
		document
			.getElementById("auto-rotate-btn")
			.addEventListener("click", () => {
				controls.autoRotate = !controls.autoRotate;
				const btn = document.getElementById("auto-rotate-btn");
				btn.textContent = controls.autoRotate
					? "⏸️ Stop Rotate"
					: "🔄 Auto Rotate";
			});

		// Mouse interaction for marker selection
		this.setupMouseInteraction();
	}

	setupMouseInteraction() {
		const raycaster = new THREE.Raycaster();
		const mouse = new THREE.Vector2();

		renderer.domElement.addEventListener("click", (event) => {
			mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
			mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

			raycaster.setFromCamera(mouse, camera);

			// Only get visible markers for intersection testing
			const visibleMarkers = this.markers.filter(
				(marker) => marker.visible
			);
			const intersects = raycaster.intersectObjects(visibleMarkers, true); // Enable recursive intersection

			if (intersects.length > 0) {
				// Find the parent marker group
				let marker = intersects[0].object;
				while (marker.parent && !marker.userData.eventData) {
					marker = marker.parent;
				}

				if (marker.userData.eventData) {
					this.showEventDetails(marker.userData.eventData);
					this.highlightMarker(marker);
				}
			} else {
				this.hideEventDetails();
				this.clearHighlight();
			}
		});
	}

	async fetchData() {
		const loadingOverlay = document.getElementById("loading-overlay");
		loadingOverlay.style.display = "flex";

		try {
			console.log("Fetching NASA EONET data...");
			let response;

			try {
				response = await fetch(
					`https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=${this.eventLimit}`
				);
				if (!response.ok)
					throw new Error(`HTTP error! status: ${response.status}`);

				const data = await response.json();
				this.events = data.events || [];
				console.log(
					`Loaded ${this.events.length} real events from NASA EONET`
				);
			} catch (corsError) {
				console.log(
					"API access blocked, using enhanced sample data..."
				);
				this.createEnhancedSampleData();
			}

			this.createMarkers();
		} catch (error) {
			console.error("Error fetching EONET data:", error);
			this.createEnhancedSampleData();
		} finally {
			loadingOverlay.style.display = "none";
		}
	}

	createEnhancedSampleData() {
		const sampleEvents = [
			// Wildfires
			{
				title: "California Wildfire Complex",
				categories: [{ title: "Wildfires" }],
				geometry: [{ coordinates: [-121.5, 38.5] }],
				description: "Large wildfire complex in Northern California",
			},
			{
				title: "Amazon Rainforest Fire",
				categories: [{ title: "Wildfires" }],
				geometry: [{ coordinates: [-60.0, -3.0] }],
				description: "Active fire in Amazon rainforest",
			},
			{
				title: "Australian Bushfire",
				categories: [{ title: "Wildfires" }],
				geometry: [{ coordinates: [145.0, -37.0] }],
				description: "Bushfire in Victoria, Australia",
			},
			{
				title: "Canadian Forest Fire",
				categories: [{ title: "Wildfires" }],
				geometry: [{ coordinates: [-110.0, 55.0] }],
				description: "Large forest fire in Alberta",
			},

			// Volcanoes
			{
				title: "Mount Etna Activity",
				categories: [{ title: "Volcanoes" }],
				geometry: [{ coordinates: [15.0, 37.7] }],
				description: "Ongoing volcanic activity at Mount Etna",
			},
			{
				title: "Kilauea Eruption",
				categories: [{ title: "Volcanoes" }],
				geometry: [{ coordinates: [-155.3, 19.4] }],
				description: "Active lava flows from Kilauea volcano",
			},
			{
				title: "Stromboli Eruption",
				categories: [{ title: "Volcanoes" }],
				geometry: [{ coordinates: [15.2, 38.8] }],
				description: "Strombolian activity in Italy",
			},
			{
				title: "Krakatoa Activity",
				categories: [{ title: "Volcanoes" }],
				geometry: [{ coordinates: [105.4, -6.1] }],
				description: "Volcanic activity in Indonesia",
			},

			// Earthquakes
			{
				title: "Japan Earthquake",
				categories: [{ title: "Earthquakes" }],
				geometry: [{ coordinates: [140.0, 36.0] }],
				description: "Magnitude 6.2 earthquake near Tokyo",
			},
			{
				title: "California Earthquake",
				categories: [{ title: "Earthquakes" }],
				geometry: [{ coordinates: [-118.2, 34.1] }],
				description: "Magnitude 5.4 earthquake in Los Angeles area",
			},
			{
				title: "Turkey Earthquake",
				categories: [{ title: "Earthquakes" }],
				geometry: [{ coordinates: [37.0, 38.0] }],
				description: "Major earthquake in southeastern Turkey",
			},
			{
				title: "Chile Earthquake",
				categories: [{ title: "Earthquakes" }],
				geometry: [{ coordinates: [-71.0, -33.0] }],
				description: "Earthquake off the coast of Chile",
			},

			// Storms
			{
				title: "Atlantic Hurricane",
				categories: [{ title: "Severe Storms" }],
				geometry: [{ coordinates: [-75.0, 25.0] }],
				description: "Category 3 hurricane in Atlantic",
			},
			{
				title: "Pacific Typhoon",
				categories: [{ title: "Severe Storms" }],
				geometry: [{ coordinates: [135.0, 20.0] }],
				description: "Powerful typhoon approaching Japan",
			},
			{
				title: "Indian Ocean Cyclone",
				categories: [{ title: "Severe Storms" }],
				geometry: [{ coordinates: [85.0, 15.0] }],
				description: "Cyclone in Bay of Bengal",
			},

			// Floods
			{
				title: "Bangladesh Flood",
				categories: [{ title: "Floods" }],
				geometry: [{ coordinates: [90.0, 24.0] }],
				description: "Severe flooding in Bangladesh",
			},
			{
				title: "European Flood",
				categories: [{ title: "Floods" }],
				geometry: [{ coordinates: [7.0, 51.0] }],
				description: "River flooding in Germany",
			},
			{
				title: "Pakistan Flood",
				categories: [{ title: "Floods" }],
				geometry: [{ coordinates: [70.0, 30.0] }],
				description: "Monsoon flooding in Pakistan",
			},
		];

		// Limit the sample events according to eventLimit
		this.events = sampleEvents.slice(0, this.eventLimit);

		console.log(
			`Using enhanced sample data with ${this.events.length} events (limited to ${this.eventLimit})`
		);
	}

	// Convert latitude/longitude to 3D coordinates on sphere
	latLonToVector3(lat, lon, radius) {
		const phi = (90 - lat) * (Math.PI / 180);
		const theta = (lon + 180) * (Math.PI / 180);

		const x = -(radius * Math.sin(phi) * Math.cos(theta));
		const z = radius * Math.sin(phi) * Math.sin(theta);
		const y = radius * Math.cos(phi);

		return new THREE.Vector3(x, y, z);
	}

	getEventType(categories) {
		if (!categories || categories.length === 0) return "manmade";

		// First try to match by category ID
		if (categories[0].id) {
			const categoryId = categories[0].id;
			const foundCategory = this.categories.find(
				(cat) => cat.id === categoryId
			);
			if (foundCategory) {
				return getCategoryKey(foundCategory.title);
			}
		}

		// Fall back to matching by title
		const category = categories[0].title.toLowerCase();
		if (category.includes("wildfire")) return "wildfires";
		if (category.includes("volcano")) return "volcanoes";
		if (category.includes("earthquake")) return "earthquakes";
		if (category.includes("flood")) return "floods";
		if (
			category.includes("storm") ||
			category.includes("cyclone") ||
			category.includes("hurricane")
		)
			return "storms";
		if (category.includes("drought")) return "droughts";
		if (category.includes("dust") || category.includes("haze"))
			return "dustHaze";
		if (category.includes("ice")) return "seaLakeIce";
		if (category.includes("snow")) return "snow";
		if (category.includes("landslide")) return "landslides";
		if (category.includes("temperature")) return "tempExtremes";
		if (category.includes("water") && category.includes("color"))
			return "waterColor";

		return "manmade";
	}

	createMarkers() {
		// Clear existing markers and labels
		this.markers.forEach((marker) => earthGroup.remove(marker));
		this.labels.forEach((label) => earthGroup.remove(label));
		this.markers = [];
		this.labels = [];

		const earthRadius = 10;

		this.events.forEach((event, index) => {
			if (!event.geometry || event.geometry.length === 0) return;

			const coords = event.geometry[0].coordinates;
			if (coords.length < 2) return;

			const lon = coords[0];
			const lat = coords[1];

			const eventType = this.getEventType(event.categories);
			const properties = this.eventTypes[eventType];

			// Create enhanced marker with glow effect
			const markerGroup = new THREE.Group();

			// Main marker
			const markerGeometry = new THREE.SphereGeometry(
				properties.size * this.markerSize,
				16,
				16
			);
			const markerMaterial = new THREE.MeshPhongMaterial({
				color: properties.color,
				transparent: true,
				opacity: 0.9,
				shininess: 100,
			});

			const marker = new THREE.Mesh(markerGeometry, markerMaterial);

			// Glow effect
			const glowGeometry = new THREE.SphereGeometry(
				properties.size * this.markerSize * 1.5,
				16,
				16
			);
			const glowMaterial = new THREE.MeshBasicMaterial({
				color: properties.glow,
				transparent: true,
				opacity: 0.3,
				side: THREE.BackSide,
			});
			const glow = new THREE.Mesh(glowGeometry, glowMaterial);

			markerGroup.add(marker);
			markerGroup.add(glow);

			// Position on Earth surface
			const position = this.latLonToVector3(lat, lon, earthRadius + 0.5);
			markerGroup.position.copy(position);

			// Add animation data
			markerGroup.userData = {
				originalScale: properties.size * this.markerSize,
				phase: Math.random() * Math.PI * 2,
				eventData: event,
				eventType: eventType,
				glowMesh: glow,
				mainMesh: marker,
				categoryInfo: properties,
			};

			earthGroup.add(markerGroup);
			this.markers.push(markerGroup);

			// Labels have been removed as requested
			// We'll still create an empty entry to maintain array parity
			if (this.showLabels) {
				// Instead of creating a visible label, we just add a null placeholder to the labels array
				this.labels.push(null);
			}
		});

		this.updateEventCounter();
		console.log(`Created ${this.markers.length} enhanced event markers`);
	}

	createLabel(text, position, eventType) {
		// Text banners have been removed as requested
		// This function is kept as a stub to maintain compatibility
		// but doesn't create any visible elements

		// Simply return without creating any sprites or labels
		this.labels.push(null);
	}

	updateMarkerSizes() {
		this.markers.forEach((marker) => {
			const userData = marker.userData;
			const newSize = userData.originalScale * this.markerSize;
			marker.scale.set(newSize, newSize, newSize);
		});
	}

	toggleLabels() {
		// Nothing to toggle since text banners have been removed
		// Function kept as a stub for compatibility
	}

	animate() {
		const time = Date.now() * 0.001 * this.animationSpeed;

		this.markers.forEach((marker) => {
			const userData = marker.userData;

			// Pulsing animation
			const pulseScale = 1 + 0.4 * Math.sin(time * 2 + userData.phase);
			const baseScale = userData.originalScale * this.markerSize;
			marker.scale.setScalar(baseScale * pulseScale);

			// Glow intensity animation
			if (userData.glowMesh) {
				userData.glowMesh.material.opacity =
					0.2 + 0.3 * Math.sin(time * 1.5 + userData.phase);
			}
		});
	}

	filterEventsByType(eventType) {
		// Check if the currently selected marker will become invisible
		let selectedWillBeHidden = false;
		if (this.selectedMarker) {
			const selectedType = this.selectedMarker.userData.eventType;
			selectedWillBeHidden =
				eventType !== "all" && selectedType !== eventType;
		}

		this.markers.forEach((marker, index) => {
			const visible =
				eventType === "all" || marker.userData.eventType === eventType;
			marker.visible = visible;
		});

		// If the selected marker is now hidden, clear the selection
		if (selectedWillBeHidden) {
			this.clearHighlight();
		}

		this.updateEventCounter(eventType);
	}

	updateEventCounter(filterType = "all") {
		const eventCounter = document.getElementById("event-counter");
		let visibleCount = 0;

		if (filterType === "all") {
			visibleCount = this.markers.length;
		} else {
			visibleCount = this.markers.filter(
				(marker) => marker.userData.eventType === filterType
			).length;
		}

		eventCounter.innerHTML = `
      <span class="counter-number">${visibleCount}</span>
      <span class="counter-text">events visible</span>
    `;
	}

	showEventDetails(eventData) {
		const detailsPanel = document.getElementById("event-details");
		const eventInfo = document.getElementById("event-info");
		console.log("Showing details for event:", eventData);

		// Get category info
		let categoryInfo = "";
		if (eventData.categories && eventData.categories.length > 0) {
			const category = eventData.categories[0];
			const categoryId = category.id;

			// Look up detailed category information
			const fullCategory = getCategoryById(categoryId);
			const emoji = fullCategory?.emoji || "📍";

			if (fullCategory) {
				categoryInfo = `
				<p><strong>Type:</strong> ${emoji} ${fullCategory.title}</p>
				<p><strong>Category Description:</strong> ${
					fullCategory.description || "No description available"
				}</p>
				`;
			} else {
				categoryInfo = `<p><strong>Type:</strong> ${
					category.title || "Unknown"
				}</p>`;
			}
		} else {
			categoryInfo = `<p><strong>Type:</strong> Unknown</p>`;
		}

		// Create source links HTML
		let sourcesHtml = "";
		if (eventData.sources && eventData.sources.length > 0) {
			sourcesHtml = `<p><strong>Sources:</strong></p><div class="source-links">`;
			eventData.sources.forEach((source) => {
				if (source.url) {
					sourcesHtml += `<a href="${
						source.url
					}" target="_blank" class="source-link-btn">${
						source.id || "Source"
					}</a>`;
				}
			});
			sourcesHtml += `</div>`;
		}

		// Add category link if available
		let categoryLink = "";
		if (eventData.categories && eventData.categories.length > 0) {
			const categoryId = eventData.categories[0].id;
			const fullCategory = getCategoryById(categoryId);

			if (fullCategory && fullCategory.link) {
				categoryLink = `<a href="${fullCategory.link}" target="_blank" class="category-link-btn">View Category Details</a>`;
			}
		}

		eventInfo.innerHTML = `
      <h4>${eventData.title}</h4>
      ${categoryInfo}
      <p><strong>Location:</strong> ${
			eventData.geometry?.[0]?.coordinates?.join(", ") || "Unknown"
		}</p>
      <p><strong>Description:</strong> ${
			eventData.description || "No description available"
		}</p>
      ${
			eventData.link
				? `<p><a href="${eventData.link}" target="_blank" class="main-link-btn">Event Details</a> ${categoryLink}</p>`
				: categoryLink
				? `<p>${categoryLink}</p>`
				: ""
		}
      ${sourcesHtml}
    `;

		detailsPanel.classList.remove("hidden");
	}

	hideEventDetails() {
		document.getElementById("event-details").classList.add("hidden");
	}

	highlightMarker(marker) {
		this.clearHighlight();
		this.selectedMarker = marker;
		marker.userData.mainMesh.material.color.setHex(0xffffff); // Change to white when highlighted
	}

	clearHighlight() {
		if (this.selectedMarker) {
			// Restore original color
			const eventType = this.selectedMarker.userData.eventType;
			const properties = this.eventTypes[eventType];
			this.selectedMarker.userData.mainMesh.material.color.setHex(
				properties.color
			);
			this.selectedMarker = null;
		}
	}
}

// Initialize Earth View EONET
const earthEONET = new EarthViewEONET();

// Control event listeners
document.addEventListener("DOMContentLoaded", () => {
	// Initialize event limit display
	document.getElementById("event-limit-value").textContent =
		earthEONET.eventLimit;

	// Set up filter button event listeners
	document.querySelector(".filter-buttons").addEventListener("click", (e) => {
		if (e.target.classList.contains("filter-btn")) {
			// Remove active class from all buttons
			document
				.querySelectorAll(".filter-btn")
				.forEach((btn) => btn.classList.remove("active"));

			// Add active class to clicked button
			e.target.classList.add("active");

			// Get filter type from button id
			const filterType = e.target.id.replace("filter-", "");

			// Apply filter
			earthEONET.filterEventsByType(filterType);

			// Clear any displayed event details when changing filters
			earthEONET.hideEventDetails();
			earthEONET.clearHighlight();
		}
	});

	// Close details panel
	document.getElementById("close-details").addEventListener("click", () => {
		earthEONET.hideEventDetails();
	});

	// Controls panel toggle
	document.getElementById("close-controls").addEventListener("click", () => {
		toggleControlsPanel();
	});

	// Function to toggle the controls panel visibility
	function toggleControlsPanel() {
		const controlsPanel = document.getElementById("earth-eonet-controls");
		if (controlsPanel) {
			controlsPanel.classList.toggle("hidden");
		}
	}

	// Add button to nav bar to show controls when hidden
	const earthNav = document.getElementById("earth-nav");
	const showControlsBtn = document.createElement("button");
	showControlsBtn.id = "show-controls-btn";
	showControlsBtn.className = "nav-btn";
	showControlsBtn.textContent = "🎮 Controls";
	showControlsBtn.style.display = "none";
	showControlsBtn.addEventListener("click", toggleControlsPanel);
	earthNav.appendChild(showControlsBtn);

	// Monitor controls visibility to show/hide the button
	const controlsObserver = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			if (
				mutation.type === "attributes" &&
				mutation.attributeName === "class"
			) {
				const controlsPanel = document.getElementById(
					"earth-eonet-controls"
				);
				const showBtn = document.getElementById("show-controls-btn");
				if (controlsPanel.classList.contains("hidden")) {
					showBtn.style.display = "block";
				} else {
					showBtn.style.display = "none";
				}
			}
		});
	});

	const controlsPanel = document.getElementById("earth-eonet-controls");
	controlsObserver.observe(controlsPanel, { attributes: true });

	// Sunlight control event listeners
	const realTimeCheckbox = document.getElementById("real-time");
	const manualTimeSlider = document.getElementById("manual-time");
	const timeSpeedSlider = document.getElementById("time-speed");
	const timePresetButtons = document.querySelectorAll(".time-preset-btn");
	const localTimeRadio = document.getElementById("local-time");
	const utcTimeRadio = document.getElementById("utc-time");

	// Timezone mode controls
	localTimeRadio.addEventListener("change", (e) => {
		if (e.target.checked) {
			sunlightSim.setTimeMode(true); // Use local time
		}
	});

	utcTimeRadio.addEventListener("change", (e) => {
		if (e.target.checked) {
			sunlightSim.setTimeMode(false); // Use UTC time
		}
	});

	// Real-time toggle
	realTimeCheckbox.addEventListener("change", (e) => {
		if (e.target.checked) {
			// When enabling real-time, sync to system time
			sunlightSim.enableRealTime();
			manualTimeSlider.disabled = true;
			timeSpeedSlider.disabled = true;
		} else {
			// When disabling real-time, continue from current sim time
			const simTime = sunlightSim.getCurrentTime();
			sunlightSim.setManualTime(simTime);
			manualTimeSlider.value = simTime;
			manualTimeSlider.disabled = false;
			timeSpeedSlider.disabled = false;
		}
	});

	// Manual time control
	manualTimeSlider.addEventListener("input", (e) => {
		if (!realTimeCheckbox.checked) {
			sunlightSim.setManualTime(parseFloat(e.target.value));
		}
	});

	// Time speed control
	timeSpeedSlider.addEventListener("input", (e) => {
		sunlightSim.setTimeSpeed(parseFloat(e.target.value));
	});

	// Time preset buttons
	timePresetButtons.forEach((button) => {
		button.addEventListener("click", () => {
			const time = parseFloat(button.dataset.time);
			manualTimeSlider.value = time;
			realTimeCheckbox.checked = false;
			manualTimeSlider.disabled = false;
			timeSpeedSlider.disabled = false;
			sunlightSim.setManualTime(time);
		});
	});

	// Pause/Play button
	const pausePlayBtn = document.getElementById("pause-play-btn");
	if (pausePlayBtn) {
		pausePlayBtn.addEventListener("click", () => {
			const isPaused = sunlightSim.togglePause();
			pausePlayBtn.textContent = isPaused ? "▶️ Play" : "⏸️ Pause";
			pausePlayBtn.classList.toggle("paused", isPaused);
		});
	}
});

// Animation Loop
function animate() {
	requestAnimationFrame(animate);

	controls.update();
	// Earth rotation is now handled by sunlight simulator - removed duplicate rotation

	// Update sunlight simulation
	const currentTime = sunlightSim.animate();

	// Update enhanced time display (if element exists)
	const timeDisplay = document.getElementById("current-time");
	if (timeDisplay) {
		const timeInfo = sunlightSim.getFormattedTime();
		timeDisplay.innerHTML = `
			<div class="time-main">${timeInfo.timeOnly}</div>
			<div class="time-details">${timeInfo.date} • ${timeInfo.timezone}</div>
		`;
	}

	if (earthEONET) {
		earthEONET.animate();
	}

	// Animate user timezone marker
	if (userLocationMarker) {
		userLocationMarker.animate();
	}

	renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate();
