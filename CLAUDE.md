# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Figma Design Token repository** for managing UX copy/text content. It uses a three-tier hierarchical token system to support multiple tones and content types, consumed via Figma's Variables/Modes system.

There is no build system, no dependencies, and no package manager — the repo consists entirely of JSON token files.

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

## Token Format

Each token uses `$type: "text"` with Figma extensions for scoping, code syntax (WEB/ANDROID/iOS), publishing visibility, and reference keys. References use `{path.to.token}` syntax.

## Manifest

`manifest.json` defines three collections (Language, Type, Tone) and maps each mode to its corresponding token file.

## Adding Content

To add a new content domain (e.g., `onboarding.welcome`):
1. Add all tone×type variants to `Language.English.tokens.json`
2. Add type references in each `Type.*.tokens.json` file
3. Add tone references in each `Tone.*.tokens.json` file (with `hiddenFromPublishing: false` and `scopes: ["TEXT_CONTENT"]`)
