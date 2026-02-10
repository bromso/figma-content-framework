import {
	LANGUAGE_FILE,
	TONES,
	TYPES,
	buildLanguageTokens,
	buildToneTokens,
	buildTypeTokens,
} from "@figma-content/core";
import { api } from "encore.dev/api";
import type { PreviewFile, PreviewParams, PreviewResponse } from "./types.js";

function extractTokens(obj: unknown, prefix = ""): Record<string, string> {
	const result: Record<string, string> = {};

	if (!obj || typeof obj !== "object") return result;

	for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
		const path = prefix ? `${prefix}.${key}` : key;

		if (val && typeof val === "object" && "$type" in (val as Record<string, unknown>)) {
			result[path] = String((val as Record<string, string>).$value);
		} else if (val && typeof val === "object") {
			Object.assign(result, extractTokens(val, path));
		}
	}

	return result;
}

export const preview = api(
	{ method: "POST", path: "/content/preview", expose: true },
	async (params: PreviewParams): Promise<PreviewResponse> => {
		const files: PreviewFile[] = [];

		// Language layer
		const langTokens = buildLanguageTokens(params.domain, params.name, params.content);
		const langExtracted = extractTokens(langTokens);
		files.push({
			file: LANGUAGE_FILE,
			layer: "language",
			tokenCount: Object.keys(langExtracted).length,
			tokens: langExtracted,
		});

		// Type layer (6 files)
		for (const type of TYPES) {
			const typeTokens = buildTypeTokens(params.domain, params.name, type.abbr);
			const typeExtracted = extractTokens(typeTokens);
			files.push({
				file: type.file,
				layer: "type",
				tokenCount: Object.keys(typeExtracted).length,
				tokens: typeExtracted,
			});
		}

		// Tone layer (6 files)
		for (const tone of TONES) {
			const toneTokens = buildToneTokens(params.domain, params.name, tone.abbr);
			const toneExtracted = extractTokens(toneTokens);
			files.push({
				file: tone.file,
				layer: "tone",
				tokenCount: Object.keys(toneExtracted).length,
				tokens: toneExtracted,
			});
		}

		const totalTokens = files.reduce((sum, f) => sum + f.tokenCount, 0);

		return { files, totalTokens };
	},
);
