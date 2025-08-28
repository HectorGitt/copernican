import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
	build: {
		rollupOptions: {
			input: {
				main: resolve(__dirname, "index.html"),
				earth: resolve(__dirname, "earth-view.html"),
			},
		},
	},
});
