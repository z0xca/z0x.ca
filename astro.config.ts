// @ts-check

import fs from "fs";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import remarkCallout from "@r4ai/remark-callout";
import { defineConfig } from "astro/config";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";

import expressiveCode from "astro-expressive-code";

// https://astro.build/config
export default defineConfig({
    devToolbar: {
        enabled: false,
    },
    vite: {
        plugins: [tailwindcss()],
    },
    integrations: [
			expressiveCode({
				themes: ["github-light", "github-dark"],
				shiki: {
					langs: [
						JSON.parse(fs.readFileSync("caddyfile.tmLanguage.json", "utf-8")),
					],
				},
				plugins: [pluginLineNumbers()],
				useDarkModeMediaQuery: true,
				defaultProps: {
					wrap: true,
					overridesByLang: {
						"ansi,bat,bash,batch,cmd,console,powershell,ps,ps1,psd1,psm1,sh,shell,shellscript,shellsession,text,zsh":
							{
								showLineNumbers: false,
							},
					},
				},
				styleOverrides: {
					codeFontSize: "0.75rem",
					borderColor: "var(--border)",
					codeFontFamily: "var(--font-mono)",
					codeBackground:
						"color-mix(in oklab, var(--secondary) 25%, transparent)",
					frames: {
						editorActiveTabForeground: "var(--muted-foreground)",
						editorActiveTabBackground:
							"color-mix(in oklab, var(--secondary) 25%, transparent)",
						editorActiveTabIndicatorBottomColor: "transparent",
						editorActiveTabIndicatorTopColor: "transparent",
						editorTabBorderRadius: "0",
						editorTabBarBackground: "transparent",
						editorTabBarBorderBottomColor: "transparent",
						frameBoxShadowCssValue: "none",
						terminalBackground:
							"color-mix(in oklab, var(--secondary) 25%, transparent)",
						terminalTitlebarBackground: "transparent",
						terminalTitlebarBorderBottomColor: "transparent",
						terminalTitlebarForeground: "var(--muted-foreground)",
					},
					lineNumbers: {
						foreground: "var(--muted-foreground)",
					},
					uiFontFamily: "var(--font-sans)",
				},
			}),
			react(),
			mdx(),
		],
    markdown: {
        remarkPlugins: [remarkCallout],
    },
});