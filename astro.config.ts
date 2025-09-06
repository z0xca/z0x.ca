// @ts-check

import fs from "node:fs"
import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers"
import remarkCallout from "@r4ai/remark-callout"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import expressiveCode from "astro-expressive-code"
import rehypeExternalLinks from "rehype-external-links"

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
				langs: [JSON.parse(fs.readFileSync("caddyfile.tmLanguage.json", "utf-8"))],
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
				codeBackground: "var(--card)",
				frames: {
					editorActiveTabForeground: "var(--muted-foreground)",
					editorActiveTabBackground: "var(--card)",
					editorActiveTabIndicatorBottomColor: "transparent",
					editorActiveTabIndicatorTopColor: "var(--card)",
					editorTabBarBackground: "var(--secondary)",
					editorTabBarBorderBottomColor: "transparent",
					frameBoxShadowCssValue: "none",
					terminalBackground: "var(--card)",
					terminalTitlebarBackground: "var(--secondary)",
					terminalTitlebarBorderBottomColor: "var(--border)",
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
		sitemap(),
	],
	markdown: {
		remarkPlugins: [remarkCallout],
		rehypePlugins: [
			[
				rehypeExternalLinks,
				{
					target: "_blank",
					rel: ["nofollow", "noreferrer", "noopener"],
				},
			],
		],
	},
})
