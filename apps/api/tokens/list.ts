import { resolve } from "node:path";
import { LANGUAGE_FILE, readTokenFile } from "@figma-content/core";
import { api } from "encore.dev/api";

interface ListParams {
	domain?: string;
	tone?: string;
	type?: string;
}

interface TokenInfo {
	path: string;
	value: string;
	tone: string;
	type: string;
}

interface ListResponse {
	entries: Record<string, TokenInfo[]>;
}

const REPO_ROOT = resolve(import.meta.dirname, "../../..");

function extractEntries(
	obj: unknown,
	prefix: string,
	filters: ListParams,
): Record<string, TokenInfo[]> {
	const result: Record<string, TokenInfo[]> = {};

	if (!obj || typeof obj !== "object") return result;

	for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
		const path = prefix ? `${prefix}.${key}` : key;

		if (val && typeof val === "object" && "$type" in (val as Record<string, unknown>)) {
			// This is a token — parse tone and type from the key
			const match = key.match(/^lang--(\w+)--(\w+)--(.+)$/);
			if (!match) continue;

			const [, tone, type, name] = match;
			if (!tone || !type || !name) continue;

			if (filters.tone && tone !== filters.tone) continue;
			if (filters.type && type !== filters.type) continue;

			// Group by domain.name
			const pathParts = path.split(".");
			const groupKey = pathParts.slice(0, -2).join(".");

			if (!result[groupKey]) result[groupKey] = [];
			result[groupKey].push({
				path,
				value: String((val as Record<string, string>).$value),
				tone,
				type,
			});
		} else if (val && typeof val === "object") {
			const nested = extractEntries(val, path, filters);
			for (const [k, v] of Object.entries(nested)) {
				if (!result[k]) result[k] = [];
				result[k].push(...v);
			}
		}
	}

	return result;
}

export const list = api(
	{ method: "GET", path: "/tokens", expose: true },
	async (params: ListParams): Promise<ListResponse> => {
		const data = await readTokenFile(REPO_ROOT, LANGUAGE_FILE);

		let searchRoot: unknown = data;
		if (params.domain) {
			for (const part of params.domain.split(".")) {
				if (searchRoot && typeof searchRoot === "object") {
					searchRoot = (searchRoot as Record<string, unknown>)[part];
				} else {
					return { entries: {} };
				}
			}
		}

		const entries = extractEntries(searchRoot, params.domain ?? "", params);
		return { entries };
	},
);
