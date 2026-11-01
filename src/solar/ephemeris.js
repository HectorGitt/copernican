import { ELEMENTS } from "./elements.js";

const DEG = Math.PI / 180;
const J2000 = 2451545.0;
const AU_KM = 149597870.7;
const GM_SUN = 1.32712440018e11; // km³/s²

/** Range over which JPL's approximate elements are published as valid. */
export const VALID_RANGE = {
	start: Date.UTC(1800, 0, 1),
	end: Date.UTC(2050, 11, 31),
};

export const toJulianDate = (ms) => ms / 86400000 + 2440587.5;

const centuriesSinceJ2000 = (ms) => (toJulianDate(ms) - J2000) / 36525;

/** Elements for one body at time T (Julian centuries past J2000). */
function elementsAt(id, T) {
	const el = ELEMENTS[id];
	const v = (k) => el[k][0] + el[k][1] * T;
	const a = v("a");
	const e = v("e");
	const I = v("I") * DEG;
	const L = v("L");
	const w = v("w");
	const O = v("O") * DEG;
	return {
		a,
		e,
		I,
		O,
		omega: (w - v("O")) * DEG, // argument of perihelion
		M: normalizeAngle((L - w) * DEG), // mean anomaly
	};
}

const normalizeAngle = (x) => {
	const t = x % (2 * Math.PI);
	return t > Math.PI ? t - 2 * Math.PI : t < -Math.PI ? t + 2 * Math.PI : t;
};

/** Solve Kepler's equation M = E − e·sin E with Newton–Raphson. */
function eccentricAnomaly(M, e) {
	let E = e < 0.8 ? M : Math.PI;
	for (let i = 0; i < 12; i++) {
		const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
		E -= dE;
		if (Math.abs(dE) < 1e-10) break;
	}
	return E;
}

/** Orbital-plane coordinates → heliocentric J2000 ecliptic (au). */
function toEcliptic(xp, yp, { omega, O, I }) {
	const cw = Math.cos(omega);
	const sw = Math.sin(omega);
	const cO = Math.cos(O);
	const sO = Math.sin(O);
	const cI = Math.cos(I);
	const sI = Math.sin(I);
	return {
		x: (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
		y: (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
		z: sw * sI * xp + cw * sI * yp,
	};
}

/** Heliocentric ecliptic position of a body in au at a given time (ms). */
export function heliocentricPosition(id, ms) {
	const el = elementsAt(id, centuriesSinceJ2000(ms));
	const E = eccentricAnomaly(el.M, el.e);
	const xp = el.a * (Math.cos(E) - el.e);
	const yp = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E);
	const p = toEcliptic(xp, yp, el);
	p.r = Math.hypot(p.x, p.y, p.z);
	p.a = el.a;
	return p;
}

/** Sampled closed orbit path (ecliptic au) for a body at a given epoch. */
export function orbitPath(id, ms, segments = 360) {
	const el = elementsAt(id, centuriesSinceJ2000(ms));
	const b = el.a * Math.sqrt(1 - el.e * el.e);
	const pts = [];
	for (let i = 0; i <= segments; i++) {
		const E = (i / segments) * Math.PI * 2;
		pts.push(toEcliptic(el.a * (Math.cos(E) - el.e), b * Math.sin(E), el));
	}
	return pts;
}

/** Orbital speed from the vis-viva equation, km/s. */
export function orbitalSpeed(r, a) {
	return Math.sqrt(GM_SUN * (2 / (r * AU_KM) - 1 / (a * AU_KM)));
}

/** Geocentric ecliptic longitude of the Moon (low precision, radians). */
export function moonLongitude(ms) {
	const d = toJulianDate(ms) - J2000;
	const L = 218.316 + 13.176396 * d;
	const M = 134.963 + 13.064993 * d;
	return (L + 6.289 * Math.sin(M * DEG)) * DEG;
}

export { AU_KM };
