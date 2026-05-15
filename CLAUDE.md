# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A **Figma Design Token repository** for managing UX copy/text content. Uses a three-tier hierarchical token system (Tone → Type → Language) to support multiple tones and content types, consumed via Figma's Variables/Modes system.

**Turborepo monorepo** with Bun workspaces, an Encore.ts API service, and a CLI tool for automated content generation.

## Development Commands

```bash
bun install          # Install all workspace dependencies
bun run dev          # Turborepo: start Encore API in dev mode
encore run           # Start API directly (localhost:4000, dashboard at localhost:9400)
bun run cli add ...  # Run CLI (see "Adding Content" below)
bun run lint         # Biome check across all packages
bun run format       # Biome format across all packages
bun run check        # TypeScript check across all packages
```

The API requires an Anthropic API key: `encore secret set AnthropicAPIKey`

## Monorepo Structure

```
apps/api/              # Encore.ts API service (@figma-content/api)
  content/             # AI content generation (POST /content/generate, /content/preview)
  tokens/              # Token file management (GET /tokens, POST /tokens/apply)
packages/
  core/                # Shared token logic (@figma-content/core) — source-only, no build step
  cli/                 # CLI tool (@figma-content/cli) — thin HTTP client calling the API
*.tokens.json          # 13 Figma token files (must stay at repo root)
manifest.json          # Figma collection/mode definitions
```

### Cross-Package Imports

`packages/core` exports directly from `./src/index.ts` (no build). Consumers use tsconfig `paths` to resolve `@figma-content/core`. The API resolves the repo root via `import.meta.dirname` with relative traversal (`../../..` from service dirs).

## Code Style

- **Biome** for lint/format: tabs for TS, spaces for JSON, 100-char line width
- **TypeScript strict mode** with `noUncheckedIndexedAccess` — indexed access returns `T | undefined`, so use `??`, type guards, or explicit checks
- Biome enforces `noNonNullAssertion` — avoid `!` postfix, prefer `??` or narrowing
- Token JSON files (`*.tokens.json`, `manifest.json`) are excluded from Biome

## Token Architecture

Three layers chain via `{reference}` syntax:

```
Tone (published) → Type → Language (base content)
```

1. **Language** (`Language.English.tokens.json`): Base content — 36 tokens per entry (6 tones × 6 types). Pattern: `lang--{toneAbbr}--{typeAbbr}--{name}`
2. **Type** (`Type.*.tokens.json`): Selects tone variant per content type — 6 tokens per entry (one per tone). Pattern: `type--{toneAbbr}--{name}`
3. **Tone** (`Tone.*.tokens.json`): Published consumer-facing tokens — 1 token per entry. Pattern: `tone--{name}`. Only layer with `hiddenFromPublishing: false` and `scopes: ["TEXT_CONTENT"]`.

### Resolution Example

```
Tone.Playful → tone--copyright
  → {legal.copyright.type--play--copyright}
    → {legal.copyright.playful.lang--play--title--copyright}
      → "Made by Us!"
```

### Modes and Abbreviations

| Category | Full Names | Abbreviations |
|----------|-----------|---------------|
| **Tones** | Neutral, Formal, Playful, Minimal, Witty, Quirky | neut, form, play, mini, witt, quirk |
| **Types** | Title, Subtitle, Description, Caption, Abbreviation, Emoji | title, subt, desc, capt, abbr, emoji |

### Token Value Structure

Every token uses `$type: "text"` with Figma extensions for scoping, platform code syntax (WEB/ANDROID/iOS), publishing visibility, and reference keys.

### codeSyntax Generation (packages/core/src/code-syntax.ts)

Given path `domain.name.tone.tokenKey`:
- **WEB**: `var(--domain-name-tone-tokenKey)` — dots→dashes, `--` in token names preserved
- **ANDROID**: `domain_name_tone_tokenKey` — dots→underscores, dashes→underscores, `--`→`__`
- **iOS**: `domainNameToneTokenKey` — split on dots and dashes, camelCase

### Key Core Behaviors

- `deepMerge` (file-manager.ts) is **additive only** — it never overwrites existing leaf values, only adds new keys
- `checkDuplicates` verifies if a domain+name already exists in the Language file before writing
- Type/Tone tokens get random `referenceKey` values (hex strings) for Figma's internal reference system

## Adding Content

### Automated (CLI + API)

```bash
bun run cli add --domain nav "Dashboard, Settings"  # Comma-separated
bun run cli add "nav.dashboard" "nav.settings"      # Dot notation
bun run cli add --input words.txt --auto-approve    # From file
bun run cli add --domain nav "Dashboard" --dry-run  # Preview only
```

### Manual

To add a new content entry (e.g., `onboarding.welcome`):
1. Add all 36 tone×type variants to `Language.English.tokens.json`
2. Add type references in each `Type.*.tokens.json` (6 files, 6 tokens each)
3. Add tone references in each `Tone.*.tokens.json` (6 files, 1 token each) with `hiddenFromPublishing: false` and `scopes: ["TEXT_CONTENT"]`

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/content/generate` | POST | AI-generates 6×6 content matrix from a title |
| `/content/preview` | POST | Previews token structures before writing |
| `/tokens` | GET | Lists existing tokens (filterable by domain/tone/type) |
| `/tokens/apply` | POST | Writes generated tokens to all 13 files |
