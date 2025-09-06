// @ts-check

import fs from "fs";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import remarkCallout from "@r4ai/remark-callout";
import rehypeExternalLinks from "rehype-external-links";
import { defineConfig } from "astro/config";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";

import expressiveCode from "astro-expressive-code";

// https://astro.build/config
export default defineConfig({
	site: "https://z0x.ca",
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
				borderColor: "var(--border)",
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
					terminalBackground: "var(--card)",
					terminalTitlebarBackground: "transparent",
					terminalTitlebarBorderBottomColor: "transparent",
					terminalTitlebarForeground: "var(--muted-foreground)",
				},
				lineNumbers: {
					foreground: "var(--muted-foreground)",
				},
				codeFontFamily: "var(--font-mono)",
				uiFontFamily: "var(--font-sans)",
			},
		}),
		mdx(),
	],
	markdown: {
		remarkPlugins: [remarkCallout],
		rehypePlugins: [
			[rehypeExternalLinks, {
				target: '_blank',
				rel: ['nofollow', 'noreferrer', 'noopener']
			}]
		],
	},
});
