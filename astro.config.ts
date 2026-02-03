// @ts-check

import fs from "node:fs";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import remarkCallout from "@r4ai/remark-callout";
import { remarkModifiedTime } from "./src/lib/remark-modified-time";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import expressiveCode from "astro-expressive-code";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSlug from "rehype-slug";

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
    remarkPlugins: [remarkCallout, remarkModifiedTime],
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          target: "_blank",
          rel: ["nofollow", "noreferrer", "noopener"],
        },
      ],
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "append",
          content: {
            type: "element",
            tagName: "svg",
            properties: {
              className: ["anchor-icon"],
              ariaHidden: "true",
              xmlns: "http://www.w3.org/2000/svg",
              width: 16,
              height: 16,
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: 2,
              strokeLinecap: "round",
              strokeLinejoin: "round",
            },
            children: [
              {
                type: "element",
                tagName: "path",
                properties: {
                  d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
                },
                children: [],
              },
              {
                type: "element",
                tagName: "path",
                properties: {
                  d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
                },
                children: [],
              },
            ],
          },
          properties: {
            className: ["anchor-link"],
          },
        },
      ],
    ],
  },
});
