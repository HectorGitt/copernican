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

// NASA EONET Data Integration
class EONETDataOverlay {
	constructor(earthObject) {
		this.earth = earthObject;
		this.events = [];
		this.markers = [];
		this.eventTypes = {
			wildfires: { color: 0xff4500, size: 0.3 },
			volcanoes: { color: 0xff0000, size: 0.4 },
			earthquakes: { color: 0x8b4513, size: 0.25 },
			floods: { color: 0x0080ff, size: 0.35 },
			storms: { color: 0xffff00, size: 0.3 },
			droughts: { color: 0x8b4513, size: 0.2 },
			dustHaze: { color: 0xffd700, size: 0.25 },
			seaLakeIce: { color: 0x87ceeb, size: 0.2 },
			snow: { color: 0xffffff, size: 0.2 },
			landslides: { color: 0x654321, size: 0.25 },
			manmade: { color: 0xff69b4, size: 0.2 },
		};
		this.fetchData();
	}

	async fetchData() {
		try {
			console.log("Fetching NASA EONET data...");

			// Try direct API call first
			let response;
			try {
				response = await fetch(
					"https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=100"
				);
			} catch (corsError) {
				console.log(
					"Direct API access blocked by CORS, trying alternative approach..."
				);
				// If CORS blocks direct access, we'll use sample data for now
				// In production, you would set up a proxy server or use a CORS proxy
				throw new Error("CORS blocked");
			}

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();
			console.log("Fetched EONET data:", data);
			this.events = data.events || [];
			console.log(`Loaded ${this.events.length} events from NASA EONET`);
			this.createMarkers();
		} catch (error) {
			console.error("Error fetching EONET data:", error);
			console.log("Loading sample data for demonstration...");
			this.createSampleData();
		}
	}

	createSampleData() {
		// Enhanced sample data for demonstration if API fails
		this.events = [
			{
				title: "California Wildfire",
				categories: [{ title: "Wildfires" }],
				geometry: [{ coordinates: [-120.5, 35.5] }],
			},
			{
				title: "Mount Etna Eruption",
				categories: [{ title: "Volcanoes" }],
				geometry: [{ coordinates: [15.0, 37.7] }],
			},
			{
				title: "Japan Earthquake",
				categories: [{ title: "Earthquakes" }],
				geometry: [{ coordinates: [140.0, 36.0] }],
			},
			{
				title: "Hurricane Atlantic",
				categories: [{ title: "Severe Storms" }],
				geometry: [{ coordinates: [-75.0, 25.0] }],
			},
			{
				title: "Bangladesh Flood",
				categories: [{ title: "Floods" }],
				geometry: [{ coordinates: [90.0, 24.0] }],
			},
			{
				title: "Amazon Fire",
				categories: [{ title: "Wildfires" }],
				geometry: [{ coordinates: [-60.0, -3.0] }],
			},
			{
				title: "Iceland Volcano",
				categories: [{ title: "Volcanoes" }],
				geometry: [{ coordinates: [-19.0, 64.0] }],
			},
			{
				title: "Turkey Earthquake",
				categories: [{ title: "Earthquakes" }],
				geometry: [{ coordinates: [37.0, 38.0] }],
			},
			{
				title: "Australian Bushfire",
				categories: [{ title: "Wildfires" }],
				geometry: [{ coordinates: [145.0, -37.0] }],
			},
			{
				title: "Philippines Typhoon",
				categories: [{ title: "Severe Storms" }],
				geometry: [{ coordinates: [121.0, 14.0] }],
			},
			{
				title: "European Flood",
				categories: [{ title: "Floods" }],
				geometry: [{ coordinates: [7.0, 51.0] }],
			},
			{
				title: "Indonesia Volcano",
				categories: [{ title: "Volcanoes" }],
				geometry: [{ coordinates: [110.0, -7.5] }],
			},
		];
		console.log(
			`Using sample EONET data with ${this.events.length} events`
		);
		this.createMarkers();
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

		return "manmade";
	}

	createMarkers() {
		// Clear existing markers
		this.markers.forEach((marker) => {
			this.earth.planetOrbit.remove(marker);
		});
		this.markers = [];

		const earthRadius = 6; // Earth radius in your scene

		this.events.forEach((event) => {
			if (!event.geometry || event.geometry.length === 0) return;

			const coords = event.geometry[0].coordinates;
			if (coords.length < 2) return;

			const lon = coords[0];
			const lat = coords[1];

			// Get event type and visual properties
			const eventType = this.getEventType(event.categories);
			const properties = this.eventTypes[eventType];

			// Create marker geometry
			const markerGeometry = new THREE.SphereGeometry(
				properties.size,
				8,
				8
			);
			const markerMaterial = new THREE.MeshBasicMaterial({
				color: properties.color,
				transparent: true,
				opacity: 0.8,
			});

			const marker = new THREE.Mesh(markerGeometry, markerMaterial);

			// Position marker on Earth surface
			const position = this.latLonToVector3(lat, lon, earthRadius + 0.1);
			marker.position.copy(position);

			// Add pulsing animation
			marker.userData = {
				originalScale: properties.size,
				phase: Math.random() * Math.PI * 2,
				eventData: event,
				eventType: eventType,
			};

			// Add to Earth's orbit so it rotates with Earth
			this.earth.planetOrbit.add(marker);
			this.markers.push(marker);
		});

		console.log(`Created ${this.markers.length} event markers on Earth`);
	}

	animate() {
		// Animate markers with pulsing effect
		this.markers.forEach((marker) => {
			const userData = marker.userData;
			const pulseScale =
				1 + 0.3 * Math.sin(Date.now() * 0.005 + userData.phase);
			marker.scale.setScalar(pulseScale);
		});
	}

	// Method to filter events by type
	filterEventsByType(eventType) {
		this.markers.forEach((marker) => {
			marker.visible =
				eventType === "all" || marker.userData.eventType === eventType;
		});
	}

	// Method to get event info (for future UI integration)
	getEventInfo(marker) {
		return marker.userData.eventData;
	}
}

// Initialize EONET overlay after Earth is created
const eonetOverlay = new EONETDataOverlay(earth);

// EONET Controls Event Listeners
function initializeEONETControls() {
	const filterButtons = document.querySelectorAll(".filter-btn");
	const eventCounter = document.getElementById("event-counter");

	// Filter button event listeners
	filterButtons.forEach((button) => {
		button.addEventListener("click", () => {
			// Remove active class from all buttons
			filterButtons.forEach((btn) => btn.classList.remove("active"));
			// Add active class to clicked button
			button.classList.add("active");

			// Extract filter type from button id
			const filterType = button.id.replace("filter-", "");

			// Apply filter
			eonetOverlay.filterEventsByType(filterType);

			// Update counter
			updateEventCounter(filterType);
		});
	});

	// Update event counter
	function updateEventCounter(filterType = "all") {
		if (!eonetOverlay.markers) {
			eventCounter.textContent = "Loading events...";
			return;
		}

		let visibleCount = 0;
		if (filterType === "all") {
			visibleCount = eonetOverlay.markers.length;
		} else {
			visibleCount = eonetOverlay.markers.filter(
				(marker) => marker.userData.eventType === filterType
			).length;
		}

		eventCounter.textContent = `Showing ${visibleCount} events`;
	}

	// Update counter when data loads
	const checkDataLoaded = () => {
		if (eonetOverlay.markers && eonetOverlay.markers.length > 0) {
			updateEventCounter();
		} else {
			setTimeout(checkDataLoaded, 1000);
		}
	};
	checkDataLoaded();
}

// Initialize controls when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeEONETControls);

function animate() {
	//Self-rotation
	sun.rotateY(0.004);
	mercury.planet.rotateY(0.004);
	venus.planet.rotateY(0.002);
	earth.planet.rotateY(0.02);
	mars.planet.rotateY(0.018);
	jupiter.planet.rotateY(0.04);
	saturn.planet.rotateY(0.038);
	uranus.planet.rotateY(0.03);
	neptune.planet.rotateY(0.032);
	pluto.planet.rotateY(0.008);

	//Around-sun-rotation
	mercury.planetOrbit.rotateY(0.04);
	venus.planetOrbit.rotateY(0.015);
	earth.planetOrbit.rotateY(0.01);
	mars.planetOrbit.rotateY(0.008);
	jupiter.planetOrbit.rotateY(0.002);
	saturn.planetOrbit.rotateY(0.0009);
	uranus.planetOrbit.rotateY(0.0004);
	neptune.planetOrbit.rotateY(0.0001);
	pluto.planetOrbit.rotateY(0.00007);

	// Animate EONET data markers
	if (eonetOverlay) {
		eonetOverlay.animate();
	}

	renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener("resize", function () {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});
