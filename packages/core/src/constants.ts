import type { ToneDefinition, TypeDefinition } from "./types.js";

export const TONES: ToneDefinition[] = [
	{ full: "neutral", abbr: "neut", file: "Tone.Neutral.tokens.json" },
	{ full: "formal", abbr: "form", file: "Tone.Formal.tokens.json" },
	{ full: "playful", abbr: "play", file: "Tone.Playful.tokens.json" },
	{ full: "minimal", abbr: "mini", file: "Tone.Minimal.tokens.json" },
	{ full: "witty", abbr: "witt", file: "Tone.Witty.tokens.json" },
	{ full: "quirky", abbr: "quirk", file: "Tone.Quirky.tokens.json" },
];

export const TYPES: TypeDefinition[] = [
	{ full: "title", abbr: "title", file: "Type.Title.tokens.json" },
	{ full: "subtitle", abbr: "subt", file: "Type.Subtitle.tokens.json" },
	{ full: "description", abbr: "desc", file: "Type.Description.tokens.json" },
	{ full: "caption", abbr: "capt", file: "Type.Caption.tokens.json" },
	{ full: "abbreviation", abbr: "abbr", file: "Type.Abbreviation.tokens.json" },
	{ full: "emoji", abbr: "emoji", file: "Type.Emoji.tokens.json" },
];

export const LANGUAGE_FILE = "Language.English.tokens.json";

export const TONE_ABBR_MAP: Record<string, string> = Object.fromEntries(
	TONES.map((t) => [t.full, t.abbr]),
);

export const TYPE_ABBR_MAP: Record<string, string> = Object.fromEntries(
	TYPES.map((t) => [t.full, t.abbr]),
);
