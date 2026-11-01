# Copernican — Solar System Explorer

An interactive 3D solar system in the browser. Planet positions are computed
from NASA/JPL orbital elements for any date, and a companion Earth view plots
live natural events from NASA EONET.

![Three.js](https://img.shields.io/badge/Three.js-r162-blue)
![Vite](https://img.shields.io/badge/Vite-build-purple)

## Features

### Solar system

-   **Real positions for any date.** Planets sit where they actually are, using
    JPL's Keplerian elements (valid 1800–2050), solved with Kepler's equation.
    Orbits are elliptical and inclined, so Mercury's eccentricity and Pluto's 17°
    tilt show up.
-   **Time machine.** Play, pause and reverse, at speeds from real time up to
    a year per second. You can pick any date or jump back to now.
-   **Fly-to and follow.** Click a planet, its label, or a chip in the dock and
    the camera flies there and tracks it along its orbit. You can still orbit
    and zoom around it freely.
-   **Live details.** Each body's panel shows its current distance from the
    Sun and from Earth, light-travel time, and orbital speed (vis-viva), plus
    physical facts.
-   **Two distance scales.** Compressed (the default, so everything fits) or
    true linear distances, with an animated transition between them.
-   **Realistic touches.** Axial tilts (including Uranus on its side and
    retrograde Venus), ringed Saturn and Uranus, the Moon, a sun glow, and ACES
    tone mapping.
-   **Shareable links.** `/#mars` opens straight onto Mars.

### Earth view

-   Live open events (wildfires, storms, volcanoes, ice and more) from
    [NASA EONET](https://eonet.gsfc.nasa.gov/), filterable by category.
-   Real-time day/night lighting in local time or UTC, or scrub the time of day
    by hand.
-   A marker for your location, based on your time zone.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Controls

| Input                          | Action                              |
| ------------------------------ | ----------------------------------- |
| Drag / scroll / right-drag     | Orbit / zoom / pan                  |
| Click a planet or label        | Fly to it and follow                |
| `1`–`9`, `0`                   | Sun … Neptune, Pluto                |
| `Space`                        | Play / pause                        |
| `[` `]`                        | Slower (down into reverse) / faster |
| `←` `→` (`Shift` for a month)  | Step a day                          |
| `N`                            | Jump to now                         |
| `R`                            | Overview                            |
| `F`                            | Toggle follow                       |
| `O` / `L` / `T`                | Orbits / labels / true distances    |
| `?`                            | Help                                |
| `Esc`                          | Deselect                            |

## Project structure

```
copernican/
├── index.html            # Solar system page
├── earth-view.html       # Earth events page
├── earth-view.js         # Earth view: globe, sunlight, EONET markers
├── earth-view.css
├── public/favicon.svg
└── src/
    ├── solar/
    │   ├── main.js       # App controller: time, camera, selection, HUD
    │   ├── scene.js      # Renderer, bodies, orbits, labels
    │   ├── ephemeris.js  # Kepler solver and position calculations
    │   ├── elements.js   # JPL orbital elements
    │   └── data.js       # Body sizes, colours, textures, facts
    ├── styles/
    │   ├── base.css      # Shared design system (tokens, top bar, controls)
    │   └── solar.css     # Solar system page styles
    └── img/              # Planet, ring and sky textures
```

## Accuracy notes

-   Elements come from E. M. Standish, _Keplerian Elements for Approximate
    Positions of the Major Planets_ (JPL). Within 1800–2050 the positions are good
    to within a fraction of a degree. The timeline goes from 1000 to 3000 AD and
    shows a warning outside the valid range.
-   Earth's position is the Earth–Moon barycentre. The Moon's position is a
    simplified model, drawn at an exaggerated distance.
-   Planet sizes are always enlarged. Distances are compressed with a square
    root unless true scale is on. Directions are never distorted, so
    alignments, conjunctions and oppositions are real.

## Acknowledgments

-   NASA/JPL for orbital elements, and NASA EONET for Earth event data
-   The Three.js community

## Contact

**HectorGitt** · [github.com/HectorGitt/copernican](https://github.com/HectorGitt/copernican)
