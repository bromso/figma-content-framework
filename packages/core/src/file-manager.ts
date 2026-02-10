import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function readTokenFile(
	repoRoot: string,
	filename: string,
): Promise<Record<string, unknown>> {
	const filePath = join(repoRoot, filename);
	const raw = await readFile(filePath, "utf-8");
	return JSON.parse(raw) as Record<string, unknown>;
}

export async function writeTokenFile(
	repoRoot: string,
	filename: string,
	data: Record<string, unknown>,
): Promise<void> {
	const filePath = join(repoRoot, filename);
	const json = JSON.stringify(data, null, 2);
	await writeFile(filePath, `${json}\n`, "utf-8");
}

/**
 * Deep merge source into target. Returns a new object.
 * Does NOT overwrite existing leaf values — only adds new keys.
 */
export function deepMerge(
	target: Record<string, unknown>,
	source: Record<string, unknown>,
): Record<string, unknown> {
	const result = { ...target };

	for (const key of Object.keys(source)) {
		const targetVal = result[key];
		const sourceVal = source[key];

		if (
			targetVal &&
			typeof targetVal === "object" &&
			!Array.isArray(targetVal) &&
			sourceVal &&
			typeof sourceVal === "object" &&
			!Array.isArray(sourceVal)
		) {
			result[key] = deepMerge(
				targetVal as Record<string, unknown>,
				sourceVal as Record<string, unknown>,
			);
		} else if (!(key in result)) {
			result[key] = sourceVal;
		}
	}

	return result;
}

/**
 * Check if a content entry already exists in the Language file.
 */
export async function checkDuplicates(
	repoRoot: string,
	domain: string,
	name: string,
): Promise<boolean> {
	const { LANGUAGE_FILE } = await import("./constants.js");
	const data = await readTokenFile(repoRoot, LANGUAGE_FILE);

	const parts = domain.split(".");
	parts.push(name);

	let current: unknown = data;
	for (const part of parts) {
		if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
			current = (current as Record<string, unknown>)[part];
		} else {
			return false;
		}
	}

	return true;
}
