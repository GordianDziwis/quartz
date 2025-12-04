import matter from "gray-matter"
import remarkFrontmatter from "remark-frontmatter"
import { QuartzTransformerPlugin } from "../types"
import yaml from "js-yaml"
import toml from "toml"
import { FullSlug } from "../../util/path"
import { QuartzPluginData } from "../vfile"
import { i18n } from "../../i18n"



export interface Options {
  delimiters: string | [string, string]
  language: "yaml" | "toml"
}

const defaultOptions: Options = {
  delimiters: "---",
  language: "yaml",
}

function coalesceAliases(data: { [key: string]: any }, aliases: string[]) {
  for (const alias of aliases) {
    if (data[alias] !== undefined && data[alias] !== null) return data[alias]
  }
}

function coerceToArray(input: string | string[]): string[] | undefined {
  if (input === undefined || input === null) return undefined

  // coerce to array
  if (!Array.isArray(input)) {
    input = input
      .toString()
      .split(",")
      .map((tag: string) => tag.trim())
  }

  // remove all non-strings
  return input
    .filter((tag: unknown) => typeof tag === "string" || typeof tag === "number")
    .map((tag: string | number) => tag.toString())
}

export const FrontMatterFixer: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }
  return {
    name: "FrontMatterFixer",
    markdownPlugins(ctx) {
      const { cfg } = ctx
      return [
        [remarkFrontmatter, ["yaml", "toml"]],
        () => {
          return (_, file) => {
            const fileData = Buffer.from(file.value as Uint8Array)
            const { data } = matter(fileData, {
              ...opts,
              engines: {
                yaml: (s) => yaml.load(s, { schema: yaml.JSON_SCHEMA }) as object,
                toml: (s) => toml.parse(s) as object,
              },
            })

            const aliases = coerceToArray(coalesceAliases(data, ["aliases", "alias"]))
            if (data.title != null && data.title.toString() !== "") {
              data.title = data.title.toString()
            } else if (aliases && aliases.length > 0) {
              data.title = aliases[0].toString()
            } else {
              data.title = file.stem ?? i18n(cfg.configuration.locale).propertyDefaults.title
            }
            file.data.frontmatter = data as QuartzPluginData["frontmatter"]
          }
        },
      ]
    },
  }
}

declare module "vfile" {
  interface DataMap {
    aliases: FullSlug[]
    frontmatter: { [key: string]: unknown } & {
      title: string
    } & Partial<{
      tags: string[]
      aliases: string[]
      modified: string
      created: string
      published: string
      description: string
      socialDescription: string
      publish: boolean | string
      draft: boolean | string
      lang: string
      enableToc: string
      cssclasses: string[]
      socialImage: string
      comments: boolean | string
    }>
  }
}
