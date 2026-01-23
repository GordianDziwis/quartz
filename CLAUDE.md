# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development server with live reload (custom wiki directory)
just develop

# CLI commands via npm
npx quartz build --directory <path> --serve    # Build and serve
npx quartz build --watch --serve               # Watch mode
npx quartz create                              # Create new content
npx quartz sync                                # Sync with git

# Quality checks
npm run check          # TypeScript + Prettier validation
npm run format         # Apply formatting
npm run test           # Run tests with tsx
```

## Architecture Overview

Quartz is a static site generator that transforms markdown into a digital garden website. Built on the unified ecosystem (remark/rehype) with Preact for UI components.

### Build Pipeline

1. **Glob** - Find markdown files
2. **Parse** - Transform markdown via worker thread pool (parallel processing)
3. **Filter** - Apply visibility filters (drafts, private pages)
4. **Emit** - Generate output files (HTML, RSS, search index, etc.)

### Plugin System (`quartz/plugins/`)

Three plugin types form the transform pipeline:

- **Transformers** (`transformers/`): Process content - frontmatter parsing, syntax highlighting, link resolution, LaTeX rendering
- **Filters** (`filters/`): Control content visibility
- **Emitters** (`emitters/`): Generate output - pages, RSS feeds, search index, sitemaps

Plugin interface in `quartz/plugins/types.ts`. Each plugin type has specific hooks:
- Transformers: `textTransform`, `markdownPlugins`, `htmlPlugins`, `externalResources`
- Filters: `shouldPublish`
- Emitters: `emit`, `partialEmit`, `getQuartzComponents`

### Component System (`quartz/components/`)

Preact components with optional static resources:

```ts
type QuartzComponent = ComponentType<QuartzComponentProps> & {
  css?: StringResource
  beforeDOMLoaded?: StringResource  // Runs before DOM ready
  afterDOMLoaded?: StringResource   // Runs after DOM ready
}
```

Client-side scripts use `.inline.ts` suffix in `components/scripts/` - these get bundled and inlined.

### Configuration

- `quartz.config.ts` - Main config: site metadata, theme, plugin selection
- `quartz.layout.ts` - Page layout: component placement (head, header, left sidebar, right sidebar, footer)

### Key Directories

- `quartz/processors/` - Parse, filter, emit orchestration
- `quartz/util/` - Path handling, theming, logging, performance tracing
- `quartz/static/` - Themes and static assets
- `docs/` - Quartz documentation (also serves as example content)

## Testing

Uses Node.js native test runner via tsx:

```bash
npm run test                    # Run all tests
npx tsx --test path/to/test.ts  # Run single test file
```

Test files: `*.test.ts` colocated with source files.

## Gotchas

- **Link resolution**: Use `file.data.relativePath` (not `slug`) for resolving links - `slug` is overwritten by `publish` frontmatter
- **Sharp images**: Read as buffer first to avoid libvips issues: `sharp(fs.readFileSync(path))`
