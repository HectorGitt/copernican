# 🌌 Copernican Solar System

An interactive 3D solar system simulation built with Three.js, featuring accurate astronomical data, real-time planet tracking, and immersive navigation controls.

![Copernican Solar System](https://img.shields.io/badge/Three.js-Interactive-blue)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![Vite](https://img.shields.io/badge/Vite-Build%20Tool-purple)

## 📝 Project Overview

**Copernican Solar System** is an interactive 3D astronomical simulation built with Three.js and modern web technologies that combines real scientific data with immersive visualization. The project implements accurate orbital mechanics using Kepler's laws, calculating planetary positions in real-time based on astronomical units and orbital periods sourced from NASA/JPL data. The 3D scene features sophisticated camera systems including orbital controls, smooth transitions using lerp (linear interpolation) for camera position and target vectors, and a dynamic planet-following mechanism that maintains consistent viewing angles by storing initial angular offsets and distances. Planet rotations are handled through Three.js's rotation matrices applied to individual mesh objects and orbital groups, with each celestial body rotating on its axis while simultaneously orbiting the sun at scientifically accurate speeds scaled for visual clarity. The lighting system employs a point light source positioned at the sun with realistic intensity falloff, combined with ambient lighting to ensure visibility of distant planets, while high-resolution texture maps are applied to sphere geometries using UV mapping for photorealistic planetary surfaces.

The application architecture demonstrates advanced software engineering with modular JavaScript ES6+ classes managing distinct concerns: a NavigationController handles camera movement and user input, a custom API integration layer fetches ephemeris data from NASA's Horizons system with fallback mechanisms, and a time simulation system that accelerates or decelerates orbital motion while maintaining synchronized updates across all planetary bodies. Performance optimization techniques include efficient WebGL rendering through Three.js's scene graph, memory management for large texture assets, and requestAnimationFrame-based animation loops ensuring consistent 60fps across devices. The UI integrates seamlessly with the 3D canvas through event-driven state management, featuring keyboard shortcuts (1-9 for planet focus, Space for pause, F for camera following), responsive controls that adapt to desktop and mobile inputs, and real-time data displays showing simulation date, elapsed time, and camera status. The project also includes a dedicated Earth view integrating NASA's EONET API for visualizing natural disasters and events, cross-browser compatibility testing, and deployment optimization through Vite's build system with code splitting and asset compression.

## ✨ Features

### 🌍 Interactive Solar System

-   **Real-time astronomical calculations** using NASA/JPL data
-   **Accurate planetary positions** based on orbital periods and semi-major axes
-   **Realistic planet sizes and textures** with high-quality images
-   **Dynamic time simulation** with adjustable speed controls

### 🎮 Advanced Navigation

-   **Planet focusing** - Press 1-9 to focus on specific planets
-   **Camera following** - Track planets as they orbit the sun
-   **Smooth camera transitions** with easing animations
-   **Orbit controls** - Mouse/touch navigation with zoom and rotation

### ⏰ Time Controls

-   **Real-time simulation** with adjustable time speed
-   **Date/time picker** to jump to specific moments
-   **Time jump buttons** for quick navigation (1 day, 1 month, 1 year)
-   **Pause/resume** functionality

### 📊 Information Panels

-   **Mini info bar** showing current status
-   **Detailed controls panel** with all settings
-   **Information panel** with navigation tips and shortcuts
-   **Real-time data display** (simulation date, elapsed time, camera status)

### 🎨 Visual Features

-   **Starry background** for immersive experience
-   **Point lighting** from the sun
-   **Responsive design** that works on desktop and mobile
-   **Fullscreen support**

## 🚀 Installation

### Prerequisites

-   Node.js (v14 or higher)
-   npm or yarn

### Setup

1. **Clone the repository**

    ```bash
    git clone https://github.com/HectorGitt/copernican.git
    cd copernican
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Start the development server**

    ```bash
    npm run dev
    ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (or the port shown in your terminal)

### Build for Production

```bash
npm run build
```

## 🎯 Usage

### Basic Navigation

-   **Mouse Controls**: Click and drag to rotate the view, scroll to zoom
-   **Planet Focus**: Press number keys 1-9 to focus on planets:
    -   `1` - Sun
    -   `2` - Mercury
    -   `3` - Venus
    -   `4` - Earth
    -   `5` - Mars
    -   `6` - Jupiter
    -   `7` - Saturn
    -   `8` - Uranus
    -   `9` - Neptune

### Camera Controls

-   **Reset Camera**: Press `R` or click "Reset Camera" button
-   **Solar System Overview**: Click "Solar System Overview" button
-   **Follow Planet**: Check "Follow Planet" checkbox or press `F` to track a focused planet
-   **Stop Following**: Press `Escape` or uncheck the follow checkbox

### Time Controls

-   **Pause/Resume**: Press `Space` or use the pause checkbox
-   **Time Speed**: Adjust the time multiplier dropdown or slider
-   **Jump to Date**: Use the date/time inputs to jump to specific moments
-   **Quick Jumps**: Use the time jump buttons for 1 day, 1 month, or 1 year

### Keyboard Shortcuts

| Key      | Action                            |
| -------- | --------------------------------- |
| `Space`  | Pause/Resume animation            |
| `R`      | Reset camera                      |
| `F`      | Toggle planet following           |
| `I`      | Toggle info panel                 |
| `C`      | Toggle controls panel             |
| `Escape` | Stop following planet             |
| `1-9`    | Focus on planets (Sun to Neptune) |

## 📚 Concepts & Outcomes

This project demonstrates a comprehensive understanding of modern web development, 3D graphics, and scientific computing. Here are the key concepts and skills developed:

### 🛠️ Core Technologies

-   **Three.js & WebGL**: 3D scene creation, geometries, materials, lighting, and camera systems
-   **Vite Build System**: Modern development workflow with hot reloading and optimized production builds
-   **Node.js & Express**: Server-side development for API proxying and CORS handling

### 🌐 Web Development

-   **JavaScript ES6+**: Classes, modules, async/await, and modern syntax patterns
-   **HTML5 & CSS3**: Responsive design, animations, and cross-device compatibility
-   **Fetch API**: Asynchronous HTTP requests and JSON data handling

### 🔭 Scientific Computing

-   **Kepler's Laws**: Implementing orbital mechanics for accurate planetary motion
-   **Astronomical Units**: Scaling real astronomical distances for 3D visualization
-   **NASA APIs**: Integrating real scientific data (JPL Horizons, EONET) with fallback systems

### 🎮 3D Graphics & Animation

-   **Camera Systems**: Orbit controls, smooth transitions, and planet following mechanics
-   **Animation Loops**: 60fps rendering with requestAnimationFrame and performance optimization
-   **Lighting & Materials**: Realistic illumination and texture mapping

### 🎯 User Experience

-   **Event Handling**: Cross-platform input (keyboard, mouse, touch) with responsive controls
-   **State Management**: Complex application state synchronization between UI and 3D scene
-   **Error Handling**: Graceful degradation and user-friendly fallback mechanisms

### 🔧 Software Engineering

-   **Code Architecture**: Modular design with separation of concerns across multiple files
-   **Performance Optimization**: Efficient rendering, memory management, and resource loading
-   **Cross-Browser Compatibility**: Testing and fixes for different browser environments

### 📈 Key Learning Outcomes

-   **Scientific Accuracy**: Translating astronomical formulas into working code
-   **3D Mathematics**: Vector operations, rotations, and coordinate transformations
-   **API Integration**: Handling real-world data with error resilience
-   **Performance Tuning**: Balancing visual quality with smooth user experience
-   **Project Management**: Structuring and documenting complex web applications

## 🏗️ Project Structure

```
copernican/
├── index.html              # Main HTML file
├── main.js                 # Core Three.js application
├── style.css               # Main styles
├── earth-controls.css      # Earth view specific styles
├── panel-controller.js     # UI panel management
├── earth-view.html         # Earth-focused view
├── earth-view.js           # Earth view logic
├── eonet-categories.js     # NASA EONET categories
├── server.js               # Development server
├── vite.config.js          # Vite configuration
├── package.json            # Dependencies and scripts
├── netlify.toml           # Netlify deployment config
├── public/                 # Static assets
│   └── vite.svg
└── src/                    # Source assets
    ├── img/                # Planet textures and images
    │   ├── sun.jpg
    │   ├── mercury.jpg
    │   ├── venus.jpg
    │   ├── earth.jpg
    │   ├── mars.jpg
    │   ├── jupiter.jpg
    │   ├── saturn.jpg
    │   ├── saturn ring.png
    │   ├── uranus.jpg
    │   ├── uranus ring.png
    │   ├── neptune.jpg
    │   ├── pluto.jpg
    │   └── stars.jpg
    └── ...
```

## 🔧 Technical Details

### Technologies Used

-   **Three.js** - 3D graphics and WebGL rendering
-   **Vite** - Fast build tool and development server
-   **JavaScript ES6+** - Modern JavaScript features
-   **HTML5 & CSS3** - Responsive web design

### Astronomical Accuracy

-   **Orbital periods** based on real astronomical data
-   **Semi-major axes** scaled for visual clarity
-   **Circular orbit approximation** for simplicity
-   **Real-time position calculations** using Kepler's laws

### Performance Optimizations

-   **Efficient rendering** with WebGL
-   **Smooth animations** using requestAnimationFrame
-   **Memory management** for large textures
-   **Responsive controls** for different screen sizes

## 🌍 Earth View Feature

The project includes a dedicated Earth view that integrates with NASA's EONET (Earth Observatory Natural Event Tracker) API to display:

-   Real-time natural disasters and events
-   Satellite imagery and data
-   Interactive event markers
-   Time-based event filtering

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
    ```bash
    git checkout -b feature/amazing-feature
    ```
3. **Commit your changes**
    ```bash
    git commit -m 'Add amazing feature'
    ```
4. **Push to the branch**
    ```bash
    git push origin feature/amazing-feature
    ```
5. **Open a Pull Request**

### Development Guidelines

-   Follow ES6+ JavaScript standards
-   Use meaningful variable and function names
-   Add comments for complex calculations
-   Test on multiple browsers and devices
-   Maintain performance optimizations

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

-   **NASA/JPL** for astronomical data and imagery
-   **Three.js** community for excellent documentation
-   **NASA EONET** for real-time Earth event data
-   **Open-source contributors** for textures and assets

## 📞 Contact

**HectorGitt**

-   GitHub: [@HectorGitt](https://github.com/HectorGitt)
-   Project Link: [https://github.com/HectorGitt/copernican](https://github.com/HectorGitt/copernican)

---

_Experience the wonders of our solar system through accurate astronomical simulation and immersive 3D visualization._
