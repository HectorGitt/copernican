import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
	CSS2DRenderer,
	CSS2DObject,
} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import starsTexture from "../img/stars.jpg";
import { BODIES } from "./data.js";
import { heliocentricPosition, orbitPath, moonLongitude } from "./ephemeris.js";

const DEG = Math.PI / 180;
const YEAR_MS = 365.25 * 86400000;
const SUN_RADIUS = BODIES[0].size;

/**
 * Real distances span 0.3–49 au, which can't be shown alongside visible
 * planets. "Visual" compresses radius with a square root; "true" is linear.
 * Direction is always preserved, so alignments and orbital phase are real.
 */
const SCALES = {
	visual: (r) => SUN_RADIUS + 1 + 16 * Math.sqrt(r),
	true: (r) => SUN_RADIUS + 40 * r,
};

/** J2000 ecliptic (z = north) → scene space (y = up). */
function eclipticToScene(p, blend, out) {
	const d = THREE.MathUtils.lerp(SCALES.visual(p.r), SCALES.true(p.r), blend);
	const k = p.r > 0 ? d / p.r : 0;
	return out.set(p.x * k, p.z * k, -p.y * k);
}

function glowTexture(inner, outer) {
	const size = 256;
	const canvas = document.createElement("canvas");
	canvas.width = canvas.height = size;
	const ctx = canvas.getContext("2d");
	const g = ctx.createRadialGradient(
		size / 2,
		size / 2,
		0,
		size / 2,
		size / 2,
		size / 2
	);
	g.addColorStop(0, inner);
	g.addColorStop(0.25, outer);
	g.addColorStop(1, "rgba(0,0,0,0)");
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, size, size);
	const tex = new THREE.CanvasTexture(canvas);
	tex.colorSpace = THREE.SRGBColorSpace;
	return tex;
}

export function createScene(container, loadingManager) {
	const renderer = new THREE.WebGLRenderer({
		antialias: true,
		powerPreference: "high-performance",
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.1;
	container.appendChild(renderer.domElement);

	const labelRenderer = new CSS2DRenderer();
	labelRenderer.setSize(window.innerWidth, window.innerHeight);
	labelRenderer.domElement.className = "label-layer";
	container.appendChild(labelRenderer.domElement);

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x02030a);

	const camera = new THREE.PerspectiveCamera(
		45,
		window.innerWidth / window.innerHeight,
		0.05,
		40000
	);
	camera.position.set(-70, 95, 150);

	const controls = new OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.dampingFactor = 0.07;
	controls.minDistance = 2;
	controls.maxDistance = 6000;
	controls.zoomSpeed = 1.2;

	const loader = new THREE.TextureLoader(loadingManager);
	const loadTexture = (url) => {
		const t = loader.load(url);
		t.colorSpace = THREE.SRGBColorSpace;
		t.anisotropy = renderer.capabilities.getMaxAnisotropy();
		return t;
	};

	// Sky — a sphere that travels with the camera so it's always "at infinity".
	const sky = new THREE.Mesh(
		new THREE.SphereGeometry(20000, 64, 32),
		new THREE.MeshBasicMaterial({
			map: loadTexture(starsTexture),
			side: THREE.BackSide,
			depthWrite: false,
			toneMapped: false,
			color: new THREE.Color(0.42, 0.42, 0.48),
		})
	);
	sky.renderOrder = -1;
	scene.add(sky);

	scene.add(new THREE.AmbientLight(0xffffff, 0.09));
	const sunLight = new THREE.PointLight(0xfff4e0, 3.2, 0, 0);
	scene.add(sunLight);

	const bodies = {};
	const orbitGroup = new THREE.Group();
	scene.add(orbitGroup);

	for (const data of BODIES) {
		const root = new THREE.Group(); // positioned in the orbit
		const tilt = new THREE.Group(); // axial tilt
		tilt.rotation.z = data.tilt * DEG;
		root.add(tilt);

		const isSun = data.id === "sun";
		const material = isSun
			? new THREE.MeshBasicMaterial({
					map: loadTexture(data.texture),
					toneMapped: false,
			  })
			: new THREE.MeshStandardMaterial({
					map: loadTexture(data.texture),
					roughness: 0.95,
					metalness: 0,
			  });
		const mesh = new THREE.Mesh(
			new THREE.SphereGeometry(data.size, isSun ? 96 : 64, isSun ? 64 : 48),
			material
		);
		mesh.userData.bodyId = data.id;
		tilt.add(mesh);

		if (data.ring) {
			const ringGeo = new THREE.RingGeometry(
				data.size * data.ring.inner,
				data.size * data.ring.outer,
				128
			);
			const ring = new THREE.Mesh(
				ringGeo,
				new THREE.MeshStandardMaterial({
					map: loadTexture(data.ring.texture),
					side: THREE.DoubleSide,
					transparent: true,
					roughness: 1,
					depthWrite: false,
				})
			);
			ring.rotation.x = -Math.PI / 2;
			tilt.add(ring);
		}

		if (isSun) {
			const halo = new THREE.Sprite(
				new THREE.SpriteMaterial({
					map: glowTexture(
						"rgba(255,230,170,0.9)",
						"rgba(255,140,40,0.35)"
					),
					blending: THREE.AdditiveBlending,
					depthWrite: false,
					transparent: true,
					toneMapped: false,
				})
			);
			halo.scale.setScalar(data.size * 7);
			root.add(halo);
			const corona = new THREE.Sprite(
				new THREE.SpriteMaterial({
					map: glowTexture(
						"rgba(255,200,120,0.35)",
						"rgba(255,120,30,0.08)"
					),
					blending: THREE.AdditiveBlending,
					depthWrite: false,
					transparent: true,
					toneMapped: false,
				})
			);
			corona.scale.setScalar(data.size * 22);
			root.add(corona);
		}

		// Label
		const labelEl = document.createElement("button");
		labelEl.className = "body-label";
		labelEl.type = "button";
		labelEl.dataset.body = data.id;
		labelEl.style.setProperty("--body-color", data.color);
		labelEl.innerHTML = `<span class="body-label__dot"></span><span>${data.name}</span>`;
		const label = new CSS2DObject(labelEl);
		label.position.set(0, data.size * 1.25, 0);
		label.center.set(0.5, 1);
		root.add(label);

		scene.add(root);

		let orbitLine = null;
		if (!isSun) {
			const geo = new THREE.BufferGeometry();
			geo.setAttribute(
				"position",
				new THREE.BufferAttribute(new Float32Array(361 * 3), 3)
			);
			orbitLine = new THREE.Line(
				geo,
				new THREE.LineBasicMaterial({
					color: new THREE.Color(data.color),
					transparent: true,
					opacity: 0.28,
					depthWrite: false,
				})
			);
			orbitLine.frustumCulled = false;
			orbitGroup.add(orbitLine);
		}

		bodies[data.id] = {
			data,
			root,
			mesh,
			label,
			labelEl,
			orbitLine,
			orbitPoints: null,
			helio: { x: 0, y: 0, z: 0, r: 0, a: 0 },
		};
	}

	// Earth's Moon — decorative, at an exaggerated distance.
	const moon = new THREE.Mesh(
		new THREE.SphereGeometry(0.27, 32, 24),
		new THREE.MeshStandardMaterial({ color: 0xbdbab3, roughness: 1 })
	);
	bodies.earth.root.add(moon);

	const tmp = new THREE.Vector3();
	let orbitEpoch = null;
	let orbitBlend = null;

	/** Place every body for a simulated time and scale blend (0 visual → 1 true). */
	function update(ms, blend) {
		// Elements drift slowly, so orbit paths are resampled at most yearly.
		const epochStale =
			orbitEpoch === null || Math.abs(ms - orbitEpoch) > YEAR_MS;
		const redrawOrbits = epochStale || blend !== orbitBlend;
		if (epochStale) orbitEpoch = ms;
		orbitBlend = blend;

		for (const id in bodies) {
			if (id === "sun") continue;
			const b = bodies[id];
			b.helio = heliocentricPosition(id, ms);
			eclipticToScene(b.helio, blend, b.root.position);

			if (epochStale) {
				b.orbitPoints = orbitPath(id, ms);
				for (const p of b.orbitPoints) p.r = Math.hypot(p.x, p.y, p.z);
			}
			if (redrawOrbits) {
				const attr = b.orbitLine.geometry.attributes.position;
				b.orbitPoints.forEach((p, i) => {
					eclipticToScene(p, blend, tmp);
					attr.setXYZ(i, tmp.x, tmp.y, tmp.z);
				});
				attr.needsUpdate = true;
			}
		}

		const lon = moonLongitude(ms);
		moon.position.set(Math.cos(lon) * 2.2, 0, -Math.sin(lon) * 2.2);
	}

	/** Advance axial spin by a simulated interval, capped to avoid strobing. */
	function spin(simSeconds) {
		for (const id in bodies) {
			const { data, mesh } = bodies[id];
			let delta = ((2 * Math.PI) / (data.rotationHours * 3600)) * simSeconds;
			delta = THREE.MathUtils.clamp(delta, -0.12, 0.12);
			mesh.rotation.y += delta;
		}
	}

	function resize() {
		const w = window.innerWidth;
		const h = window.innerHeight;
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		renderer.setSize(w, h);
		labelRenderer.setSize(w, h);
	}

	function render() {
		sky.position.copy(camera.position);
		renderer.render(scene, camera);
		labelRenderer.render(scene, camera);
	}

	return {
		renderer,
		scene,
		camera,
		controls,
		bodies,
		orbitGroup,
		update,
		spin,
		resize,
		render,
		pickables: Object.values(bodies).map((b) => b.mesh),
	};
}
