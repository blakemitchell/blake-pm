import { defineConfig } from "astro/config"
import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"
import tailwind from "@astrojs/tailwind"
import solidJs from "@astrojs/solid-js"

// https://astro.build/config
export default defineConfig({
  output: "static",
  site: process.env.SITE_URL || "https://blake.pm",
  integrations: [mdx(), sitemap({ filter: page => !page.endsWith("/debris-lab/") }), solidJs({ include: ["**/src/components/**"] }), tailwind({ applyBaseStyles: false })],
})
