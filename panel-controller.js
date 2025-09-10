// Panel Controller for handling panel visibility
document.addEventListener("DOMContentLoaded", function () {
	// Initialize all panels as hidden
	const panels = document.querySelectorAll(".nav-panel");
	panels.forEach((panel) => {
		if (!panel.classList.contains("hidden")) {
			panel.classList.add("hidden");
		}
	});

	// Show the info panel by default
	const infoPanel = document.getElementById("info-panel");
	if (infoPanel) {
		infoPanel.classList.remove("hidden");
	}

	// Set up close button event listeners
	const closeButtons = document.querySelectorAll(".close-btn");
	closeButtons.forEach((button) => {
		button.addEventListener("click", function (e) {
			// Find the parent panel
			const panel = e.target.closest(".nav-panel");
			if (panel) {
				panel.classList.add("hidden");
			}
		});
	});

	// Set up toggle buttons in mini-info-bar
	const infoBtn = document.getElementById("info-btn");
	if (infoBtn) {
		infoBtn.addEventListener("click", function () {
			togglePanel("info-panel");
		});
	}

	const controlsBtn = document.getElementById("controls-btn");
	if (controlsBtn) {
		controlsBtn.addEventListener("click", function () {
			togglePanel("controls-panel");
		});
	}

	// Helper function to toggle panel visibility
	window.togglePanel = function (panelId) {
		const panel = document.getElementById(panelId);
		if (!panel) return;

		// Hide all other panels first
		panels.forEach((p) => {
			if (p.id !== panelId) {
				p.classList.add("hidden");
			}
		});

		// Toggle the target panel
		panel.classList.toggle("hidden");
	};
});
