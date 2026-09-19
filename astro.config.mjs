import { defineConfig } from "astro/config"
import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"
import tailwind from "@astrojs/tailwind"
import solidJs from "@astrojs/solid-js"
import react from "@astrojs/react"
import keystatic from "@keystatic/astro"

// https://astro.build/config
export default defineConfig({
  cacheDir: process.env.KEYSTATIC_LOCAL === "true" ? "./node_modules/.astro-editor" : "./node_modules/.astro",
  vite: { cacheDir: process.env.KEYSTATIC_LOCAL === "true" ? "node_modules/.vite-editor" : "node_modules/.vite" },
  output: process.env.KEYSTATIC_LOCAL === "true" ? "hybrid" : "static",
  site: process.env.SITE_URL || "https://blake.pm",
  integrations: [mdx(), sitemap({ filter: page => !page.endsWith("/debris-lab/") }), solidJs({ include: ["**/src/components/**"] }), ...(process.env.KEYSTATIC_LOCAL === "true" ? [react({ include: ["**/node_modules/@keystatic/**", "**/keystatic.config.*"] }), keystatic()] : []), tailwind({ applyBaseStyles: false })],
})
