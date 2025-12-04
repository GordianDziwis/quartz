import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

import fs from 'fs'

// Strip comments from JSONC (simple approach)
function parseJsonc(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8')
  // Remove single-line comments
  const stripped = content.replace(/\/\/.*$/gm, '')
  return JSON.parse(stripped)
}

const darkTheme = parseJsonc('./quartz/static/summerfruit-dark.jsonc')
const lightTheme = parseJsonc('./quartz/static/summerfruit-light.jsonc')
/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Quartz 4",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "en-US",
    baseUrl: "quartz.jzhao.xyz",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "IBM Plex Mono",
        body: "Source Sans Pro",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#E0E0E0",
          lightgray: "#D0D0D0",
          gray: "#505050",
          darkgray: "#101010",
          dark: "#000000",
          secondary: "#FF0086",
          tertiary: "#101010",
          highlight: "#D0D0D0",
          textHighlight: "#CC6633",
        },
        darkMode: {
          light: "#000000",
          lightgray: "#303030",
          gray: "#505050",
          darkgray: "#D0D0D0",
          dark: "#E0E0E0",
          secondary: "#FF0086",
          tertiary: "#D0D0D0",
          highlight: "#303030",
          textHighlight: "#CC6633",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: lightTheme,
          dark: darkTheme,
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
