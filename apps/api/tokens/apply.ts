import { resolve } from "node:path";
import {
	LANGUAGE_FILE,
	TONES,
	TYPES,
	buildLanguageTokens,
	buildToneTokens,
	buildTypeTokens,
	checkDuplicates,
	deepMerge,
	readTokenFile,
	writeTokenFile,
} from "@figma-content/core";
import type { ApplyRequest, ApplyResult } from "@figma-content/core";
import { api } from "encore.dev/api";

const REPO_ROOT = resolve(import.meta.dirname, "../../..");

export const apply = api(
	{ method: "POST", path: "/tokens/apply", expose: true },
	async (params: ApplyRequest): Promise<ApplyResult> => {
		const { domain, name, content, dryRun } = params;

		// Check for duplicates
		const exists = await checkDuplicates(REPO_ROOT, domain, name);
		if (exists) {
			throw new Error(`Content entry "${domain}.${name}" already exists`);
		}

		const filesModified: { file: string; tokensAdded: number }[] = [];

		// Language layer (36 tokens in 1 file)
		const langTokens = buildLanguageTokens(domain, name, content);
		if (!dryRun) {
			const langData = await readTokenFile(REPO_ROOT, LANGUAGE_FILE);
			const merged = deepMerge(langData, langTokens);
			await writeTokenFile(REPO_ROOT, LANGUAGE_FILE, merged);
		}
		filesModified.push({ file: LANGUAGE_FILE, tokensAdded: 36 });

		// Type layer (6 tokens per file × 6 files = 36 tokens)
		for (const type of TYPES) {
			const typeTokens = buildTypeTokens(domain, name, type.abbr);
			if (!dryRun) {
				const typeData = await readTokenFile(REPO_ROOT, type.file);
				const merged = deepMerge(typeData, typeTokens);
				await writeTokenFile(REPO_ROOT, type.file, merged);
			}
			filesModified.push({ file: type.file, tokensAdded: 6 });
		}

		// Tone layer (1 token per file × 6 files = 6 tokens)
		for (const tone of TONES) {
			const toneTokens = buildToneTokens(domain, name, tone.abbr);
			if (!dryRun) {
				const toneData = await readTokenFile(REPO_ROOT, tone.file);
				const merged = deepMerge(toneData, toneTokens);
				await writeTokenFile(REPO_ROOT, tone.file, merged);
			}
			filesModified.push({ file: tone.file, tokensAdded: 1 });
		}

		const totalTokens = filesModified.reduce((sum, f) => sum + f.tokensAdded, 0);

		return { filesModified, totalTokens };
	},
);
