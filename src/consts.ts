import type { Site, Page, Links, Socials } from "@types"

// Global
export const SITE: Site = {
  TITLE: "Blake Mitchell",
  DESCRIPTION: "Notes, ideas, and updates from Blake Mitchell.",
  AUTHOR: "Blake Mitchell",
}

// Work Page
export const WORK: Page = {
  TITLE: "Work",
  DESCRIPTION: "Places I have worked.",
}

// Blog Page
export const BLOG: Page = {
  TITLE: "Blog",
  DESCRIPTION: "Writing on topics I am passionate about.",
}

// Projects Page 
export const PROJECTS: Page = {
  TITLE: "Projects",
  DESCRIPTION: "Recent projects I have worked on.",
}

// Search Page
export const SEARCH: Page = {
  TITLE: "Search",
  DESCRIPTION: "Search all posts and projects by keyword.",
}

// Links
export const LINKS: Links = [
  { 
    TEXT: "Home", 
    HREF: "/", 
  },
  { 
    TEXT: "Work", 
    HREF: "/work", 
  },
  { 
    TEXT: "Blog", 
    HREF: "/blog", 
  },
  { TEXT: "Contact", HREF: "/contact" },
  { TEXT: "Social", HREF: "/social" },
]

// Socials
export const SOCIALS: Socials = [
  { NAME: "Contact", ICON: "email", TEXT: "Send a message", HREF: "/contact" },
  { NAME: "LinkedIn", ICON: "linkedin", TEXT: "gblakemitchell", HREF: "https://www.linkedin.com/in/gblakemitchell/" },
  { NAME: "Bluesky", ICON: "bluesky", TEXT: "@blakemitchell.bsky.social", HREF: "https://bsky.app/profile/blakemitchell.bsky.social" },
  { NAME: "Mastodon", ICON: "mastodon", TEXT: "@gbm@mas.to", HREF: "https://mas.to/@gbm" },
  { NAME: "Instagram", ICON: "instagram", TEXT: "@blakemitchell", HREF: "https://www.instagram.com/blakemitchell/" },
]
