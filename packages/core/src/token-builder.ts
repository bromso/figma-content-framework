import crypto from "node:crypto";
import { codeSyntax } from "./code-syntax.js";
import { TONES, TYPES } from "./constants.js";
import type { ContentMatrix, TokenValue, TypeName } from "./types.js";

function randomReferenceKey(): string {
	return crypto.randomBytes(20).toString("hex");
}

function contentKey(toneFull: string, typeFull: string): TypeName {
	const map: Record<string, TypeName> = {
		title: "title",
		subtitle: "subtitle",
		description: "description",
		caption: "caption",
		abbreviation: "abbreviation",
		emoji: "emoji",
	};
	return map[typeFull] as TypeName;
}

/**
 * Build Language layer tokens for a single content entry.
 *
 * Structure: { [domain]: { [name]: { [toneFull]: { [tokenKey]: TokenValue } } } }
 * Produces 36 tokens (6 tones × 6 types).
 */
export function buildLanguageTokens(
	domain: string,
	name: string,
	content: ContentMatrix,
): Record<string, unknown> {
	const nameGroup: Record<string, Record<string, TokenValue>> = {};

	for (const tone of TONES) {
		const toneContent = content[tone.full as keyof ContentMatrix];
		const toneTokens: Record<string, TokenValue> = {};

		for (const type of TYPES) {
			const tokenName = `lang--${tone.abbr}--${type.abbr}--${name}`;
			const path = `${domain}.${name}.${tone.full}.${tokenName}`;

			toneTokens[tokenName] = {
				$type: "text",
				$value: toneContent[contentKey(tone.full, type.full)],
				$extensions: {
					figma: {
						scopes: [],
						codeSyntax: codeSyntax(path),
						hiddenFromPublishing: true,
					},
				},
			};
		}

		nameGroup[tone.full] = toneTokens;
	}

	return setNested(domain, name, nameGroup);
}

/**
 * Build Type layer tokens for a single content entry in a single Type file.
 *
 * Structure: { [domain]: { [name]: { [tokenKey]: TokenValue } } }
 * Produces 6 tokens per Type file (one per tone).
 */
export function buildTypeTokens(
	domain: string,
	name: string,
	typeAbbr: string,
): Record<string, unknown> {
	const tokens: Record<string, TokenValue> = {};
	const type = TYPES.find((t) => t.abbr === typeAbbr);
	if (!type) throw new Error(`Unknown type abbreviation: ${typeAbbr}`);

	for (const tone of TONES) {
		const tokenName = `type--${tone.abbr}--${name}`;
		const path = `${domain}.${name}.${tokenName}`;
		const langRef = `{${domain}.${name}.${tone.full}.lang--${tone.abbr}--${type.abbr}--${name}}`;

		tokens[tokenName] = {
			$type: "text",
			$value: langRef,
			$extensions: {
				figma: {
					scopes: [],
					codeSyntax: codeSyntax(path),
					hiddenFromPublishing: true,
					referenceKey: randomReferenceKey(),
				},
			},
		};
	}

	return setNested(domain, name, tokens);
}

/**
 * Build Tone layer tokens for a single content entry in a single Tone file.
 *
 * Structure: { [domain]: { [name]: { [tokenKey]: TokenValue } } }
 * Produces 1 token per Tone file.
 */
export function buildToneTokens(
	domain: string,
	name: string,
	toneAbbr: string,
): Record<string, unknown> {
	const tokenName = `tone--${name}`;
	const path = `${domain}.${name}.${tokenName}`;
	const typeRef = `{${domain}.${name}.type--${toneAbbr}--${name}}`;

	const token: TokenValue = {
		$type: "text",
		$value: typeRef,
		$extensions: {
			figma: {
				scopes: ["TEXT_CONTENT"],
				codeSyntax: codeSyntax(path),
				hiddenFromPublishing: false,
				referenceKey: randomReferenceKey(),
			},
		},
	};

	return setNested(domain, name, { [tokenName]: token });
}

/**
 * Helper to build a nested object from dot-separated domain.
 * "legal.copyright" → { legal: { copyright: value } }
 *
 * For simple "nav" domain with name "dashboard":
 *   → { nav: { dashboard: value } }
 */
function setNested(domain: string, name: string, value: unknown): Record<string, unknown> {
	const parts = domain.split(".");
	parts.push(name);

	const result: Record<string, unknown> = {};
	let current = result;

	for (let i = 0; i < parts.length - 1; i++) {
		const next: Record<string, unknown> = {};
		const key = parts[i];
		if (key !== undefined) {
			current[key] = next;
			current = next;
		}
	}

	const lastKey = parts[parts.length - 1];
	if (lastKey !== undefined) {
		current[lastKey] = value;
	}
	return result;
}
