import Anthropic from "@anthropic-ai/sdk";
import type { ContentMatrix } from "@figma-content/core";
import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import type { GenerateParams, GenerateResponse } from "./types.js";

const AnthropicAPIKey = secret("AnthropicAPIKey");

const SYSTEM_PROMPT = `You are a UX copywriter generating content for a design token system. You produce text in 6 tones × 6 types = 36 variations.

## Tones

- **Neutral**: Clear, direct, professional. No personality flourishes. Default corporate voice.
- **Formal**: Authoritative, precise, institutional. Legal or academic register.
- **Playful**: Warm, friendly, enthusiastic. Uses exclamation marks, casual phrasing.
- **Minimal**: Extremely concise. Fewest possible words. Telegram-style.
- **Witty**: Clever, self-aware, dry humor. Wordplay welcome.
- **Quirky**: Eccentric, unexpected metaphors, personality-heavy. Memorable and unique.

## Types

- **title**: Primary heading. 1-4 words. Capitalized appropriately for the tone.
- **subtitle**: Supporting line. 3-8 words. Adds context to the title.
- **description**: Full explanation. 1-2 sentences. Informative and complete.
- **caption**: Supplementary detail. Short phrase or sentence. Metadata-like.
- **abbreviation**: Shortest possible representation. 1-4 characters (symbol, initials, or very short word).
- **emoji**: Single emoji that represents the concept.

## Output Format

Return ONLY valid JSON matching this exact structure (no markdown, no explanation):
{
  "neutral": { "title": "", "subtitle": "", "description": "", "caption": "", "abbreviation": "", "emoji": "" },
  "formal": { "title": "", "subtitle": "", "description": "", "caption": "", "abbreviation": "", "emoji": "" },
  "playful": { "title": "", "subtitle": "", "description": "", "caption": "", "abbreviation": "", "emoji": "" },
  "minimal": { "title": "", "subtitle": "", "description": "", "caption": "", "abbreviation": "", "emoji": "" },
  "witty": { "title": "", "subtitle": "", "description": "", "caption": "", "abbreviation": "", "emoji": "" },
  "quirky": { "title": "", "subtitle": "", "description": "", "caption": "", "abbreviation": "", "emoji": "" }
}`;

function buildUserPrompt(params: GenerateParams): string {
	let prompt = `Generate content for: "${params.neutralTitle}"
Domain: ${params.domain}
Entry name: ${params.name}`;

	if (params.context) {
		prompt += `\nAdditional context: ${params.context}`;
	}

	return prompt;
}

function validateContentMatrix(data: unknown): data is ContentMatrix {
	if (!data || typeof data !== "object") return false;

	const tones = ["neutral", "formal", "playful", "minimal", "witty", "quirky"] as const;
	const types = ["title", "subtitle", "description", "caption", "abbreviation", "emoji"] as const;

	for (const tone of tones) {
		const toneObj = (data as Record<string, unknown>)[tone];
		if (!toneObj || typeof toneObj !== "object") return false;
		for (const type of types) {
			const val = (toneObj as Record<string, unknown>)[type];
			if (typeof val !== "string" || val.length === 0) return false;
		}
	}

	return true;
}

export const generate = api(
	{ method: "POST", path: "/content/generate", expose: true },
	async (params: GenerateParams): Promise<GenerateResponse> => {
		const client = new Anthropic({ apiKey: AnthropicAPIKey() });

		let content: ContentMatrix | null = null;
		let attempts = 0;

		while (!content && attempts < 2) {
			attempts++;

			const response = await client.messages.create({
				model: "claude-sonnet-4-5-20250929",
				max_tokens: 2048,
				system: SYSTEM_PROMPT,
				messages: [{ role: "user", content: buildUserPrompt(params) }],
			});

			const textBlock = response.content.find((b) => b.type === "text");
			if (!textBlock || textBlock.type !== "text") continue;

			try {
				const parsed = JSON.parse(textBlock.text);
				if (validateContentMatrix(parsed)) {
					content = parsed as ContentMatrix;
				}
			} catch {
				// retry on parse failure
			}
		}

		if (!content) {
			throw new Error("Failed to generate valid content after 2 attempts");
		}

		return { domain: params.domain, name: params.name, content };
	},
);
