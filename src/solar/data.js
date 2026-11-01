import sunTexture from "../img/sun.jpg";
import mercuryTexture from "../img/mercury.jpg";
import venusTexture from "../img/venus.jpg";
import earthTexture from "../img/earth.jpg";
import marsTexture from "../img/mars.jpg";
import jupiterTexture from "../img/jupiter.jpg";
import saturnTexture from "../img/saturn.jpg";
import saturnRingTexture from "../img/saturn ring.png";
import uranusTexture from "../img/uranus.jpg";
import uranusRingTexture from "../img/uranus ring.png";
import neptuneTexture from "../img/neptune.jpg";
import plutoTexture from "../img/pluto.jpg";

/**
 * Display + physical data for every body.
 * `size` is the exaggerated scene radius; real values live in `facts`.
 * `rotationHours` is the sidereal day. Retrograde spin is expressed through
 * an obliquity above 90°, so every period here is positive.
 */
export const BODIES = [
	{
		id: "sun",
		name: "Sun",
		kind: "G-type main-sequence star",
		color: "#ffb347",
		texture: sunTexture,
		size: 5,
		tilt: 7.25,
		rotationHours: 609.12,
		blurb: "The star at the centre of it all — 99.86% of the solar system's mass, fusing 600 million tonnes of hydrogen every second.",
		facts: {
			radiusKm: 695700,
			day: "25.4 days (equator)",
			year: "—",
			moons: "8 planets",
			temp: "5,500 °C surface",
			gravity: "274 m/s²",
		},
	},
	{
		id: "mercury",
		name: "Mercury",
		kind: "Terrestrial planet",
		color: "#a8a29e",
		texture: mercuryTexture,
		size: 0.55,
		tilt: 0.03,
		rotationHours: 1407.6,
		blurb: "The smallest planet and the fastest, racing around the Sun in just 88 days on the most eccentric planetary orbit.",
		facts: {
			radiusKm: 2439.7,
			day: "58.6 days",
			year: "88.0 days",
			moons: "0",
			temp: "167 °C mean",
			gravity: "3.7 m/s²",
		},
	},
	{
		id: "venus",
		name: "Venus",
		kind: "Terrestrial planet",
		color: "#e8c07d",
		texture: venusTexture,
		size: 0.95,
		tilt: 177.36,
		rotationHours: 5832.5,
		blurb: "Wrapped in a crushing CO₂ atmosphere, Venus is the hottest planet — and it spins backwards, slower than it orbits.",
		facts: {
			radiusKm: 6051.8,
			day: "243 days (retrograde)",
			year: "224.7 days",
			moons: "0",
			temp: "464 °C mean",
			gravity: "8.87 m/s²",
		},
	},
	{
		id: "earth",
		name: "Earth",
		kind: "Terrestrial planet",
		color: "#4f9dff",
		texture: earthTexture,
		size: 1,
		tilt: 23.44,
		rotationHours: 23.934,
		blurb: "Home. The only world known to harbour life, with liquid water covering 71% of its surface.",
		facts: {
			radiusKm: 6371,
			day: "23.93 hours",
			year: "365.26 days",
			moons: "1",
			temp: "15 °C mean",
			gravity: "9.81 m/s²",
		},
	},
	{
		id: "mars",
		name: "Mars",
		kind: "Terrestrial planet",
		color: "#e2683c",
		texture: marsTexture,
		size: 0.7,
		tilt: 25.19,
		rotationHours: 24.623,
		blurb: "The Red Planet hosts Olympus Mons, the tallest volcano in the solar system, and a canyon that would span a continent.",
		facts: {
			radiusKm: 3389.5,
			day: "24.62 hours",
			year: "687 days",
			moons: "2",
			temp: "−65 °C mean",
			gravity: "3.71 m/s²",
		},
	},
	{
		id: "jupiter",
		name: "Jupiter",
		kind: "Gas giant",
		color: "#d8a47f",
		texture: jupiterTexture,
		size: 2.8,
		tilt: 3.13,
		rotationHours: 9.925,
		blurb: "More than twice as massive as every other planet combined, with a storm — the Great Red Spot — wider than Earth.",
		facts: {
			radiusKm: 69911,
			day: "9.93 hours",
			year: "11.86 years",
			moons: "97",
			temp: "−110 °C cloud tops",
			gravity: "24.79 m/s²",
		},
	},
	{
		id: "saturn",
		name: "Saturn",
		kind: "Gas giant",
		color: "#e9d19c",
		texture: saturnTexture,
		size: 2.4,
		tilt: 26.73,
		rotationHours: 10.656,
		ring: { texture: saturnRingTexture, inner: 1.05, outer: 2.1 },
		blurb: "Its rings stretch 280,000 km across yet are mostly only tens of metres thick. Saturn is less dense than water.",
		facts: {
			radiusKm: 58232,
			day: "10.66 hours",
			year: "29.46 years",
			moons: "274",
			temp: "−140 °C cloud tops",
			gravity: "10.44 m/s²",
		},
	},
	{
		id: "uranus",
		name: "Uranus",
		kind: "Ice giant",
		color: "#8fd8e0",
		texture: uranusTexture,
		size: 1.6,
		tilt: 97.77,
		rotationHours: 17.24,
		ring: { texture: uranusRingTexture, inner: 1.0, outer: 1.7 },
		blurb: "Knocked on its side, Uranus rolls around the Sun — each pole gets 42 years of continuous daylight, then 42 of night.",
		facts: {
			radiusKm: 25362,
			day: "17.24 hours (retrograde)",
			year: "84.0 years",
			moons: "29",
			temp: "−195 °C mean",
			gravity: "8.69 m/s²",
		},
	},
	{
		id: "neptune",
		name: "Neptune",
		kind: "Ice giant",
		color: "#4b70dd",
		texture: neptuneTexture,
		size: 1.55,
		tilt: 28.32,
		rotationHours: 16.11,
		blurb: "The windiest world, with supersonic gusts over 2,000 km/h. It was found by mathematics before it was seen.",
		facts: {
			radiusKm: 24622,
			day: "16.11 hours",
			year: "164.8 years",
			moons: "16",
			temp: "−200 °C mean",
			gravity: "11.15 m/s²",
		},
	},
	{
		id: "pluto",
		name: "Pluto",
		kind: "Dwarf planet",
		color: "#cbb59b",
		texture: plutoTexture,
		size: 0.35,
		tilt: 122.53,
		rotationHours: 153.29,
		blurb: "A Kuiper Belt world with a heart-shaped nitrogen glacier. Its orbit is tilted 17° and dips inside Neptune's.",
		facts: {
			radiusKm: 1188.3,
			day: "6.39 days (retrograde)",
			year: "247.9 years",
			moons: "5",
			temp: "−225 °C mean",
			gravity: "0.62 m/s²",
		},
	},
];

export const BODY_BY_ID = Object.fromEntries(BODIES.map((b) => [b.id, b]));
