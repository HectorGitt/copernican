import "../styles/base.css";
import "../styles/solar.css";
import * as THREE from "three";
import { BODIES, BODY_BY_ID } from "./data.js";
import { createScene } from "./scene.js";
import { orbitalSpeed, VALID_RANGE, AU_KM } from "./ephemeris.js";

const $ = (id) => document.getElementById(id);
const DAY = 86400;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/** Simulated seconds per real second. */
const SPEEDS = [
	{ v: -31557600, label: "−1 year / s" },
	{ v: -2629800, label: "−1 month / s" },
	{ v: -604800, label: "−1 week / s" },
	{ v: -DAY, label: "−1 day / s" },
	{ v: -3600, label: "−1 hour / s" },
	{ v: 1, label: "Real time" },
	{ v: 60, label: "1 min / s" },
	{ v: 3600, label: "1 hour / s" },
	{ v: DAY, label: "1 day / s" },
	{ v: 604800, label: "1 week / s" },
	{ v: 2629800, label: "1 month / s" },
	{ v: 31557600, label: "1 year / s" },
];
const DEFAULT_SPEED = SPEEDS.findIndex((s) => s.v === DAY);
const MIN_TIME = Date.UTC(1000, 0, 1);
const MAX_TIME = Date.UTC(3000, 0, 1);

const OVERVIEW = {
	visual: new THREE.Vector3(-70, 95, 150),
	true: new THREE.Vector3(-600, 900, 1500),
};

// ---------------------------------------------------------------- persistence

const prefs = (() => {
	const defaults = { orbits: true, labels: true, trueScale: false };
	try {
		return { ...defaults, ...JSON.parse(localStorage.getItem("copernican:prefs")) };
	} catch {
		return defaults;
	}
})();
const savePrefs = () => {
	try {
		localStorage.setItem("copernican:prefs", JSON.stringify(prefs));
	} catch {
		/* storage unavailable — preferences just won't persist */
	}
};

// ---------------------------------------------------------------- scene

const loadingManager = new THREE.LoadingManager();
loadingManager.onProgress = (_url, loaded, total) => {
	$("loader-fill").style.width = `${(loaded / total) * 100}%`;
};
loadingManager.onLoad = () => {
	$("loader").classList.add("is-done");
	setTimeout(() => $("loader").remove(), 700);
};

const world = createScene($("stage"), loadingManager);
const { camera, controls, bodies } = world;

// ---------------------------------------------------------------- state

const state = {
	time: Date.now(),
	speedIndex: DEFAULT_SPEED,
	paused: false,
	scaleBlend: prefs.trueScale ? 1 : 0,
	selected: null,
	follow: true,
	flight: null,
	lastFocusPos: new THREE.Vector3(),
};

// ---------------------------------------------------------------- formatting

const fmtDate = new Intl.DateTimeFormat(undefined, {
	weekday: "short",
	year: "numeric",
	month: "short",
	day: "numeric",
});
const fmtTime = new Intl.DateTimeFormat(undefined, {
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
	timeZoneName: "short",
});
const num = (digits) =>
	new Intl.NumberFormat(undefined, {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits,
	});
const n0 = num(0);
const n1 = num(1);
const n2 = num(2);
const n3 = num(3);

function formatLightTime(au) {
	const seconds = au * (AU_KM / 299792.458);
	if (seconds < 60) return `${n1.format(seconds)} light-sec`;
	if (seconds < 3600) return `${n1.format(seconds / 60)} light-min`;
	return `${n2.format(seconds / 3600)} light-hours`;
}

function toLocalInputValue(ms) {
	const d = new Date(ms);
	const pad = (x) => String(x).padStart(2, "0");
	return `${String(d.getFullYear()).padStart(4, "0")}-${pad(d.getMonth() + 1)}-${pad(
		d.getDate()
	)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ---------------------------------------------------------------- toast

let toastTimer;
function toast(message) {
	const el = $("toast");
	el.textContent = message;
	el.classList.add("is-visible");
	clearTimeout(toastTimer);
	toastTimer = setTimeout(() => el.classList.remove("is-visible"), 1800);
}

// ---------------------------------------------------------------- time

function setTime(ms) {
	state.time = THREE.MathUtils.clamp(ms, MIN_TIME, MAX_TIME);
	if (state.time === MIN_TIME || state.time === MAX_TIME) {
		if (!state.paused) setPaused(true);
		toast("Reached the edge of the simulated timeline");
	}
}

function setPaused(paused) {
	state.paused = paused;
	document.body.classList.toggle("is-paused", paused);
	const btn = $("play-btn");
	btn.setAttribute("aria-pressed", String(paused));
	btn.title = paused ? "Play (Space)" : "Pause (Space)";
	btn.setAttribute("aria-label", paused ? "Play" : "Pause");
	renderSpeed();
}

function stepSpeed(dir) {
	const next = THREE.MathUtils.clamp(state.speedIndex + dir, 0, SPEEDS.length - 1);
	if (next === state.speedIndex && !state.paused) return;
	state.speedIndex = next;
	if (state.paused) setPaused(false);
	renderSpeed();
}

function renderSpeed() {
	const s = SPEEDS[state.speedIndex];
	const el = $("speed-label");
	el.textContent = state.paused ? "Paused" : s.label;
	el.classList.toggle("is-reverse", s.v < 0 && !state.paused);
	$("slower-btn").disabled = state.speedIndex === 0;
	$("faster-btn").disabled = state.speedIndex === SPEEDS.length - 1;
}

let lastClockText = "";
function renderClock() {
	const d = new Date(state.time);
	const dateText = fmtDate.format(d);
	const timeText = fmtTime.format(d);
	if (dateText + timeText === lastClockText) return;
	lastClockText = dateText + timeText;
	$("sim-date").textContent = dateText;
	$("sim-time").textContent = timeText;
	$("range-warning").hidden =
		state.time >= VALID_RANGE.start && state.time <= VALID_RANGE.end;
}

// ---------------------------------------------------------------- camera

const worldPos = (id, out = new THREE.Vector3()) =>
	bodies[id].root.getWorldPosition(out);

const easeInOutCubic = (t) =>
	t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * Fly the camera to a body (or to a fixed overview when `id` is null).
 * The destination is re-evaluated each frame so moving planets are tracked
 * smoothly during the flight.
 */
function flyTo(id) {
	const fromPos = camera.position.clone();
	const fromTarget = controls.target.clone();
	let offset;

	if (id) {
		const body = BODY_BY_ID[id];
		const distance = id === "sun" ? 32 : Math.max(body.size * 7, 3.5);
		// Approach from the current viewing direction, slightly above the plane.
		const dir = fromPos.clone().sub(worldPos(id)).normalize();
		dir.y = Math.max(dir.y, 0.28);
		offset = dir.normalize().multiplyScalar(distance);
		controls.minDistance = body.size * 1.6;
	} else {
		controls.minDistance = 2;
	}

	state.flight = {
		id,
		fromPos,
		fromTarget,
		offset,
		start: performance.now(),
		duration: reduceMotion.matches ? 1 : 1600,
	};
	controls.enabled = false;
}

function updateFlight(now) {
	const f = state.flight;
	const t = Math.min((now - f.start) / f.duration, 1);
	const e = easeInOutCubic(t);
	let target;
	let dest;
	if (f.id) {
		target = worldPos(f.id);
		dest = target.clone().add(f.offset);
	} else {
		target = new THREE.Vector3();
		dest = (prefs.trueScale ? OVERVIEW.true : OVERVIEW.visual).clone();
	}
	camera.position.lerpVectors(f.fromPos, dest, e);
	controls.target.lerpVectors(f.fromTarget, target, e);

	if (t >= 1) {
		state.flight = null;
		controls.enabled = true;
		if (f.id) state.lastFocusPos.copy(target);
	}
}

/** Carry the camera along with the followed body, preserving user orbiting. */
function updateFollow() {
	if (!state.selected || !state.follow || state.flight) return;
	const p = worldPos(state.selected);
	const delta = p.clone().sub(state.lastFocusPos);
	camera.position.add(delta);
	controls.target.add(delta);
	state.lastFocusPos.copy(p);
}

// ---------------------------------------------------------------- selection

function select(id) {
	if (!id) return deselect();
	state.selected = id;
	state.follow = true;
	$("follow-toggle").checked = true;
	flyTo(id);
	renderPanel();
	syncSelectionUI();
	history.replaceState(null, "", `#${id}`);
}

function deselect() {
	if (!state.selected) return;
	state.selected = null;
	controls.minDistance = 2;
	$("body-panel").hidden = true;
	syncSelectionUI();
	history.replaceState(null, "", location.pathname + location.search);
}

function overview() {
	deselect();
	flyTo(null);
}

function syncSelectionUI() {
	document.querySelectorAll("[data-body]").forEach((el) => {
		const active = el.dataset.body === state.selected;
		el.classList.toggle("is-active", active);
		if (el.matches(".body-chip")) el.setAttribute("aria-pressed", String(active));
	});
}

function setFollow(on) {
	if (!state.selected) return;
	state.follow = on;
	$("follow-toggle").checked = on;
	if (on) flyTo(state.selected);
	toast(on ? `Following ${BODY_BY_ID[state.selected].name}` : "Camera released");
}

function renderPanel() {
	const body = BODY_BY_ID[state.selected];
	$("body-panel").hidden = false;
	$("body-panel").style.setProperty("--body-color", body.color);
	$("body-swatch").style.backgroundImage = `url("${body.texture}")`;
	$("body-kind").textContent = body.kind;
	$("body-name").textContent = body.name;
	$("body-blurb").textContent = body.blurb;

	const f = body.facts;
	const facts = [
		["Radius", `${n0.format(f.radiusKm)} km`],
		["Day length", f.day],
		["Year", f.year],
		[body.id === "sun" ? "Orbited by" : "Known moons", f.moons],
		["Temperature", f.temp],
		["Surface gravity", f.gravity],
		["Axial tilt", `${n2.format(body.tilt)}°`],
	];
	$("body-facts").innerHTML = facts
		.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`)
		.join("");
	renderLiveStats();
}

let lastStatsAt = 0;
function renderLiveStats(now = performance.now()) {
	if (!state.selected || now - lastStatsAt < 200) return;
	lastStatsAt = now;
	const id = state.selected;
	if (id === "sun") {
		const e = bodies.earth.helio;
		$("stat-sun").textContent = "—";
		$("stat-sun-km").textContent = "You are here";
		$("stat-earth").textContent = `${n3.format(e.r)} au`;
		$("stat-light").textContent = formatLightTime(e.r);
		$("stat-speed").textContent = "—";
		return;
	}
	const h = bodies[id].helio;
	$("stat-sun").textContent = `${n3.format(h.r)} au`;
	$("stat-sun-km").textContent = `${n1.format((h.r * AU_KM) / 1e6)} million km`;

	if (id === "earth") {
		$("stat-earth").textContent = "—";
		$("stat-light").textContent = "You are here";
	} else {
		const e = bodies.earth.helio;
		const d = Math.hypot(h.x - e.x, h.y - e.y, h.z - e.z);
		$("stat-earth").textContent = `${n3.format(d)} au`;
		$("stat-light").textContent = formatLightTime(d);
	}
	$("stat-speed").textContent = n2.format(orbitalSpeed(h.r, h.a));
}

// ---------------------------------------------------------------- layers

function applyLayers() {
	world.orbitGroup.visible = prefs.orbits;
	document.body.classList.toggle("hide-labels", !prefs.labels);
	$("toggle-orbits").checked = prefs.orbits;
	$("toggle-labels").checked = prefs.labels;
	$("toggle-scale").checked = prefs.trueScale;
}

function setLayer(key, value, message) {
	prefs[key] = value;
	savePrefs();
	applyLayers();
	if (message) toast(message);
	if (key === "trueScale") {
		// Keep the view framed while distances animate between scales.
		if (!state.selected) flyTo(null);
		controls.maxDistance = value ? 20000 : 6000;
	}
}

// ---------------------------------------------------------------- UI wiring

function buildBodyStrip() {
	const strip = $("bodies-strip");
	strip.innerHTML = BODIES.map(
		(b, i) => `
		<button class="body-chip" type="button" data-body="${b.id}" aria-pressed="false"
			style="--body-color:${b.color}" title="${b.name} (${(i + 1) % 10})">
			<span class="body-chip__dot"></span>${b.name}
		</button>`
	).join("");
}

function wireUI() {
	document.addEventListener("click", (e) => {
		const bodyEl = e.target.closest("[data-body]");
		if (bodyEl) select(bodyEl.dataset.body);
	});

	$("body-close").addEventListener("click", deselect);
	$("follow-toggle").addEventListener("change", (e) => setFollow(e.target.checked));

	$("play-btn").addEventListener("click", () => setPaused(!state.paused));
	$("slower-btn").addEventListener("click", () => stepSpeed(-1));
	$("faster-btn").addEventListener("click", () => stepSpeed(1));
	$("now-btn").addEventListener("click", jumpToNow);
	$("overview-btn").addEventListener("click", overview);

	const dateInput = $("date-input");
	$("date-btn").addEventListener("click", () => {
		dateInput.value = toLocalInputValue(state.time);
		try {
			dateInput.showPicker();
		} catch {
			dateInput.focus();
		}
	});
	dateInput.addEventListener("change", () => {
		const ms = new Date(dateInput.value).getTime();
		if (!Number.isNaN(ms)) setTime(ms);
	});

	// Layers popover
	const layersBtn = $("layers-btn");
	const layersMenu = $("layers-menu");
	const setMenu = (open) => {
		layersMenu.hidden = !open;
		layersBtn.setAttribute("aria-expanded", String(open));
	};
	layersBtn.addEventListener("click", () => setMenu(layersMenu.hidden));
	document.addEventListener("pointerdown", (e) => {
		if (!e.target.closest(".popover-anchor")) setMenu(false);
	});
	$("toggle-orbits").addEventListener("change", (e) => setLayer("orbits", e.target.checked));
	$("toggle-labels").addEventListener("change", (e) => setLayer("labels", e.target.checked));
	$("toggle-scale").addEventListener("change", (e) =>
		setLayer("trueScale", e.target.checked, e.target.checked ? "True distances" : "Compressed distances")
	);

	// Help
	const help = $("help-dialog");
	$("help-btn").addEventListener("click", () => help.showModal());
	help.addEventListener("click", (e) => {
		if (e.target === help || e.target.closest("[data-close]")) help.close();
	});

	$("fullscreen-btn").addEventListener("click", () => {
		if (document.fullscreenElement) document.exitFullscreen();
		else document.documentElement.requestFullscreen?.().catch(() => {});
	});

	document.addEventListener("keydown", onKey);
	wirePicking();
}

function jumpToNow() {
	setTime(Date.now());
	state.speedIndex = SPEEDS.findIndex((s) => s.v === 1);
	setPaused(false);
	toast("Synced to the current time");
}

function onKey(e) {
	if (e.metaKey || e.ctrlKey || e.altKey) return;
	if (e.target.closest("input, select, textarea") || $("help-dialog").open) return;

	const key = e.key.toLowerCase();
	const digit = "1234567890".indexOf(e.key);
	if (digit !== -1 && BODIES[digit]) {
		select(BODIES[digit].id);
		return;
	}

	const actions = {
		" ": () => setPaused(!state.paused),
		"[": () => stepSpeed(-1),
		"]": () => stepSpeed(1),
		arrowleft: () => setTime(state.time - (e.shiftKey ? 30 : 1) * DAY * 1000),
		arrowright: () => setTime(state.time + (e.shiftKey ? 30 : 1) * DAY * 1000),
		n: jumpToNow,
		r: overview,
		f: () => setFollow(!state.follow),
		o: () => setLayer("orbits", !prefs.orbits, prefs.orbits ? "Orbits hidden" : "Orbits shown"),
		l: () => setLayer("labels", !prefs.labels, prefs.labels ? "Labels hidden" : "Labels shown"),
		t: () =>
			setLayer("trueScale", !prefs.trueScale, prefs.trueScale ? "Compressed distances" : "True distances"),
		"?": () => $("help-dialog").showModal(),
		escape: deselect,
	};
	const action = actions[key];
	if (action) {
		e.preventDefault();
		action();
	}
}

function wirePicking() {
	const canvas = world.renderer.domElement;
	const raycaster = new THREE.Raycaster();
	const pointer = new THREE.Vector2();
	let down = null;

	const pick = (e) => {
		pointer.set(
			(e.clientX / window.innerWidth) * 2 - 1,
			-(e.clientY / window.innerHeight) * 2 + 1
		);
		raycaster.setFromCamera(pointer, camera);
		const hit = raycaster.intersectObjects(world.pickables, false)[0];
		return hit?.object.userData.bodyId ?? null;
	};

	canvas.addEventListener("pointerdown", (e) => {
		down = { x: e.clientX, y: e.clientY };
		// Grabbing the view hands control back to the user mid-flight.
		if (state.flight) {
			state.flight = null;
			controls.enabled = true;
			if (state.selected) state.lastFocusPos.copy(worldPos(state.selected));
		}
	});
	canvas.addEventListener("pointerup", (e) => {
		if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
		const id = pick(e);
		if (id) select(id);
		down = null;
	});

	let hoverQueued = false;
	canvas.addEventListener("pointermove", (e) => {
		if (e.pointerType !== "mouse" || hoverQueued) return;
		hoverQueued = true;
		requestAnimationFrame(() => {
			hoverQueued = false;
			canvas.style.cursor = pick(e) ? "pointer" : "";
		});
	});
}

// ---------------------------------------------------------------- loop

let lastFrame = performance.now();

function frame(now) {
	const dt = Math.min((now - lastFrame) / 1000, 0.1);
	lastFrame = now;

	const simSeconds = state.paused ? 0 : SPEEDS[state.speedIndex].v * dt;
	if (simSeconds) setTime(state.time + simSeconds * 1000);

	const targetBlend = prefs.trueScale ? 1 : 0;
	if (state.scaleBlend !== targetBlend) {
		const step = reduceMotion.matches ? 1 : dt * 0.9;
		state.scaleBlend =
			targetBlend > state.scaleBlend
				? Math.min(targetBlend, state.scaleBlend + step)
				: Math.max(targetBlend, state.scaleBlend - step);
	}

	world.update(state.time, easeInOutCubic(state.scaleBlend));
	world.spin(simSeconds);

	if (state.flight) updateFlight(now);
	else updateFollow();

	controls.update();
	world.render();
	renderClock();
	renderLiveStats(now);
}

// ---------------------------------------------------------------- boot

buildBodyStrip();
wireUI();
applyLayers();
renderSpeed();
controls.maxDistance = prefs.trueScale ? 20000 : 6000;
if (prefs.trueScale) camera.position.copy(OVERVIEW.true);
world.update(state.time, state.scaleBlend);
window.addEventListener("resize", world.resize);
world.renderer.setAnimationLoop(frame);

const linked = location.hash.slice(1);
if (BODY_BY_ID[linked]) select(linked);
