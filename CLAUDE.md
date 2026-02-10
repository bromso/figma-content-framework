# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Figma Design Token repository** for managing UX copy/text content. It uses a three-tier hierarchical token system to support multiple tones and content types, consumed via Figma's Variables/Modes system.

The repo is a **Turborepo monorepo** with a Bun workspace containing an Encore.ts API service and a CLI tool for automated content generation.

## Monorepo Structure

```
figma-content-framework/
├── apps/api/              # Encore.ts API service
│   ├── content/           # AI content generation (POST /content/generate, /content/preview)
│   └── tokens/            # Token file management (GET /tokens, POST /tokens/apply)
├── packages/
│   ├── core/              # Shared token logic (constants, builders, file I/O)
│   └── cli/               # CLI tool (bun run cli add ...)
├── *.tokens.json          # 13 Figma token files (stay at root)
└── manifest.json          # Figma collection/mode definitions
```

## Architecture

The framework uses three token layers that chain together via references:

```
Tone (published) → Type → Language (base content)
```

### Layer Details

1. **Language** (`Language.English.tokens.json`): Base content with all tone×type combinations. Token pattern: `lang--{tone}--{type}--{name}`
2. **Type** (`Type.*.tokens.json`): Selects the appropriate tone variant per content type. Token pattern: `type--{tone}--{name}`
3. **Tone** (`Tone.*.tokens.json`): Final published tokens consumers see. Token pattern: `tone--{name}`. Only this layer has `hiddenFromPublishing: false`.

### Resolution Example

```
Tone.Playful → tone--copyright
  references → {legal.copyright.type--play--copyright}
    references → {legal.copyright.playful.lang--play--title--copyright}
      resolves → "Made by Us!"
```

### Available Modes

- **Tones**: Neutral, Formal, Playful, Minimal, Witty, Quirky
- **Types**: Title, Subtitle, Description, Caption, Abbreviation, Emoji
- **Languages**: English (currently)

### Abbreviations

- **Tones**: neut, form, play, mini, witt, quirk
- **Types**: title, subt, desc, capt, abbr, emoji

## Token Format

Each token uses `$type: "text"` with Figma extensions for scoping, code syntax (WEB/ANDROID/iOS), publishing visibility, and reference keys. References use `{path.to.token}` syntax.

## Manifest

`manifest.json` defines three collections (Language, Type, Tone) and maps each mode to its corresponding token file.

## Adding Content

### Manual

To add a new content domain (e.g., `onboarding.welcome`):
1. Add all tone×type variants to `Language.English.tokens.json`
2. Add type references in each `Type.*.tokens.json` file
3. Add tone references in each `Tone.*.tokens.json` file (with `hiddenFromPublishing: false` and `scopes: ["TEXT_CONTENT"]`)

### Automated (CLI + API)

```bash
# Start the API
encore run                                          # localhost:4000, dashboard at localhost:9400

# Generate and apply content
bun run cli add --domain nav "Dashboard, Settings"  # Comma-separated
bun run cli add "nav.dashboard" "nav.settings"      # Dot notation
bun run cli add --input words.txt --auto-approve    # From file
bun run cli add --domain nav "Dashboard" --dry-run  # Preview only
```

## Development Commands

```bash
bun install          # Install all workspace dependencies
bun run dev          # Turborepo: start Encore API in dev mode
encore run           # Start API directly
bun run cli add ...  # Run CLI
bun run lint         # Biome check across all packages
bun run format       # Biome format across all packages
bun run check        # TypeScript check across all packages
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/content/generate` | POST | AI-generates 6×6 content matrix from a title |
| `/content/preview` | POST | Previews token structures before writing |
| `/tokens` | GET | Lists existing tokens (filterable by domain/tone/type) |
| `/tokens/apply` | POST | Writes tokens to all 13 files |

## Key Packages

- **`@figma-content/core`** — Token constants, code-syntax generators, token-builder, file I/O. Source-only package (no build step).
- **`@figma-content/api`** — Encore.ts API with `content` and `tokens` services. Uses `@anthropic-ai/sdk` for AI generation.
- **`@figma-content/cli`** — Thin HTTP client that calls the API. Handles input parsing and display.

## Secrets

The API requires an Anthropic API key set via Encore secrets:
```bash
encore secret set AnthropicAPIKey
```
