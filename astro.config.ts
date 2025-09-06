// @ts-check

import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import remarkCallout from "@r4ai/remark-callout";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	devToolbar: {
		enabled: false,
	},
	vite: {
		plugins: [tailwindcss()],
	},
	integrations: [react(), mdx()],
	markdown: {
		remarkPlugins: [remarkCallout],
	},
});
