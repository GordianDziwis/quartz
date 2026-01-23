import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { ComponentChildren, ComponentType } from "preact"
import { wikilinkRegex } from "../plugins/transformers/ofm"
import style from "./styles/pageProperties.scss"
import { pathToRoot, simplifySlug, slugTag, transformLink } from "../util/path"
import { getFullInternalLink } from "../plugins/transformers/links"

export type FieldComponent = ComponentType<
  QuartzComponentProps & { fieldName: string; fieldValue: any }
>

interface PagePropertiesOptions {
  fieldComponents: { [name: string]: FieldComponent }
  defaultFieldComponent: FieldComponent
}

// this is ugly, we kind of ripped out what quartz does from ofm.ts
// at least in my earlier commit we separated out the `getFullInternalLink` part
// also hardcoded "shortest" transform strategy
function renderInternalLink(
  value: string,
  rawFp: string,
  rawHeader: string | undefined,
  rawAlias: string | undefined,
  props: QuartzComponentProps,
): ComponentChildren {
  const fp = rawFp?.trim() ?? ""
  const anchor = rawHeader?.trim() ?? ""
  const alias = rawAlias?.slice(1).trim()

  const url = fp + anchor
  const text = alias ?? fp

  const href = transformLink(props.fileData.slug!, url, {
    strategy: "shortest",
    allSlugs: props.ctx.allSlugs,
  })
  const full = getFullInternalLink(href, simplifySlug(props.fileData.slug!))

  return (
    <a class="internal" href={href} data-slug={full}>
      {text}
    </a>
  )
}

// Markdown link regex for use in global matching
const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g

// Naked URL regex - matches http:// or https:// followed by non-whitespace characters
const nakedUrlRegex = /https?:\/\/[^\s<>\[\]"']+/g

function renderStringWithLinks(
  text: string,
  props: QuartzComponentProps,
): ComponentChildren {
  const parts: ComponentChildren[] = []
  let lastIndex = 0

  // Create a combined regex that matches both wikilinks and markdown links
  // We need to use a global regex to find all matches
  const wikilinkGlobal = new RegExp(wikilinkRegex.source, 'g')

  // Collect all matches with their positions
  type LinkMatch = {
    index: number
    length: number
    render: () => ComponentChildren
  }

  const matches: LinkMatch[] = []

  // Find all wikilinks (excluding embeds that start with !)
  let match: RegExpExecArray | null
  while ((match = wikilinkGlobal.exec(text)) !== null) {
    if (!match[0].startsWith("!")) {
      const m = match
      matches.push({
        index: m.index,
        length: m[0].length,
        render: () => renderInternalLink(m[0], m[1], m[2], m[3], props),
      })
    }
  }

  // Find all markdown links
  while ((match = mdLinkRegex.exec(text)) !== null) {
    const m = match
    const displayText = m[1]
    const url = m[2]
    const isExternal = url.startsWith("http://") || url.startsWith("https://")

    matches.push({
      index: m.index,
      length: m[0].length,
      render: () => {
        if (isExternal) {
          return (
            <a class="external" href={url} target="_blank">
              {displayText}
            </a>
          )
        }
        // Transform internal markdown links the same way as wikilinks
        const href = transformLink(props.fileData.slug!, url, {
          strategy: "shortest",
          allSlugs: props.ctx.allSlugs,
        })
        const full = getFullInternalLink(href, simplifySlug(props.fileData.slug!))
        return (
          <a class="internal" href={href} data-slug={full}>
            {displayText}
          </a>
        )
      },
    })
  }

  // Find all naked external links
  while ((match = nakedUrlRegex.exec(text)) !== null) {
    const m = match
    const url = m[0]

    matches.push({
      index: m.index,
      length: m[0].length,
      render: () => (
        <a class="external" href={url} target="_blank">
          {url}
        </a>
      ),
    })
  }

  // If no matches, return the original text
  if (matches.length === 0) {
    return text
  }

  // Sort matches by index
  matches.sort((a, b) => a.index - b.index)

  // Filter out overlapping matches (keep the first one)
  const filteredMatches: LinkMatch[] = []
  for (const m of matches) {
    const last = filteredMatches[filteredMatches.length - 1]
    if (!last || m.index >= last.index + last.length) {
      filteredMatches.push(m)
    }
  }

  // Build the result with text segments and rendered links
  for (const m of filteredMatches) {
    // Add text before this match
    if (m.index > lastIndex) {
      parts.push(text.slice(lastIndex, m.index))
    }

    // Add the rendered link
    parts.push(m.render())
    lastIndex = m.index + m.length
  }

  // Add any remaining text after the last match
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return <>{parts}</>
}

export const DefaultFieldComponent: FieldComponent = (props) => {
  const { fieldValue } = props

  if (fieldValue === null) {
    return "null"
  }

  if (fieldValue === undefined) {
    return null
  }

  if (typeof fieldValue === "string") {
    return renderStringWithLinks(fieldValue, props)
  }

  if (Array.isArray(fieldValue)) {
    if (fieldValue.length === 0) {
      return null
    }
    return (
      <ul class="property-list">
        {fieldValue.map((v) => (
          <li>
            <DefaultFieldComponent {...props} fieldValue={v} />
          </li>
        ))}
      </ul>
    )
  }

  if (typeof fieldValue === "object") {
    return <code>{JSON.stringify(fieldValue, null, 2)}</code>
  }

  return fieldValue.toString?.() ?? null
}

export const TagFieldComponent: FieldComponent = ({ fieldValue, fileData }) => {
  const tags = Array.isArray(fieldValue) ? fieldValue : [fieldValue]
  const baseDir = pathToRoot(fileData.slug!)

  return (
    <ul class="property-list">
      {tags.map((tag) => {
        return (
          <li>
            <a href={`${baseDir}/tags/${slugTag(`${tag}`)}`} class="internal tag-link">
              {tag}
            </a>
          </li>
        )
      })}
    </ul>
  )
}

// A sentinel value that hides a field
export const HIDE = () => null

const defaultOptions: PagePropertiesOptions = {
  fieldComponents: {
    title: HIDE,
    date: HIDE,
    cssclasses: HIDE,
    publish: HIDE,
    aliases: HIDE,
    lang: HIDE,
    tags: TagFieldComponent,
    ["hide-props"]: HIDE,
  },
  defaultFieldComponent: DefaultFieldComponent,
}

export default ((opts?: Partial<PagePropertiesOptions>) => {
  const fieldComponents = { ...defaultOptions.fieldComponents, ...opts?.fieldComponents }
  const DefaultFieldComponent = opts?.defaultFieldComponent ?? defaultOptions.defaultFieldComponent

  const PageProperties: QuartzComponent = (props: QuartzComponentProps) => {
    if (!props.fileData.frontmatterRaw) {
      return null
    }

    const hideRaw = props.fileData.frontmatter?.["hide-props"] ?? []
    const hide = Array.isArray(hideRaw) ? hideRaw : [hideRaw]

    const entries = Object.entries(props.fileData.frontmatterRaw).map(([name, value]) => {
      // allow hiding through frontmatter
      if (hide.includes(name)) {
        return null
      }

      const FieldComponent = fieldComponents[name] ?? DefaultFieldComponent

      // allow hiding through config
      if (FieldComponent === HIDE) {
        return null
      }

      return (
        <>
          <dt>{name}</dt>
          <dd>
            <FieldComponent {...props} fieldName={name} fieldValue={value} />
          </dd>
        </>
      )
    })

    // avoid the padding if there's no frontmatter
    return entries.length !== 0 ? (
      <dl class={classNames(props.displayClass, "page-props")}>{entries}</dl>
    ) : null
  }

  PageProperties.css = style

  return PageProperties
}) satisfies QuartzComponentConstructor
