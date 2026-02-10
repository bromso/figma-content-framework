import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import type { ContentMatrix } from "@figma-content/core";
import type { ApiClient } from "../api-client.js";

interface AddOptions {
	domain?: string;
	autoApprove: boolean;
	dryRun: boolean;
	input?: string;
	interactive: boolean;
	names: string[];
}

interface ResolvedEntry {
	domain: string;
	name: string;
	neutralTitle: string;
}

function resolveEntry(raw: string, defaultDomain?: string): ResolvedEntry {
	const trimmed = raw.trim();

	// Dot notation: "nav.dashboard" → domain=nav, name=dashboard
	if (trimmed.includes(".")) {
		const parts = trimmed.split(".");
		const last = parts.pop();
		const name = (last ?? "").toLowerCase();
		const domain = parts.join(".");
		return { domain, name, neutralTitle: raw.trim() };
	}

	// With --domain flag
	if (defaultDomain) {
		const name = trimmed.toLowerCase().replace(/\s+/g, "-");
		return { domain: defaultDomain, name, neutralTitle: trimmed };
	}

	throw new Error(
		`Cannot resolve "${trimmed}" without a domain. Use --domain or dot notation (e.g., "nav.${trimmed.toLowerCase()}")`,
	);
}

function parseNames(options: AddOptions): string[] {
	if (options.input) {
		const content = readFileSync(options.input, "utf-8");
		return content
			.split("\n")
			.map((l) => l.trim())
			.filter(Boolean);
	}

	// Comma-separated expansion
	const names: string[] = [];
	for (const arg of options.names) {
		for (const part of arg.split(",")) {
			const trimmed = part.trim();
			if (trimmed) names.push(trimmed);
		}
	}

	return names;
}

function printContentTable(content: ContentMatrix) {
	const tones = ["neutral", "formal", "playful", "minimal", "witty", "quirky"] as const;
	const types = ["title", "subtitle", "description", "caption", "abbreviation", "emoji"] as const;

	// Header
	console.log(
		`\n  ${"Type".padEnd(14)} ${"Neutral".padEnd(20)} ${"Formal".padEnd(20)} ${"Playful".padEnd(20)} ${"Minimal".padEnd(20)} ${"Witty".padEnd(20)} Quirky`,
	);
	console.log(`  ${"─".repeat(134)}`);

	for (const type of types) {
		const vals = tones.map((t) => {
			const val = content[t][type];
			return val.length > 18 ? `${val.slice(0, 17)}…` : val;
		});
		console.log(`  ${type.padEnd(14)} ${vals.map((v) => v.padEnd(20)).join(" ")}`);
	}

	console.log();
}

async function confirm(question: string): Promise<boolean> {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	const answer = await rl.question(`${question} (y/N) `);
	rl.close();
	return answer.toLowerCase() === "y";
}

export async function addCommand(client: ApiClient, options: AddOptions) {
	const rawNames = options.interactive ? await promptForNames() : parseNames(options);

	if (rawNames.length === 0) {
		console.error("No content entries specified.");
		process.exit(1);
	}

	const entries = rawNames.map((n) => resolveEntry(n, options.domain));

	console.log(
		`\nProcessing ${entries.length} content ${entries.length === 1 ? "entry" : "entries"}…\n`,
	);

	let successCount = 0;
	let skipCount = 0;

	for (const entry of entries) {
		console.log(`── ${entry.domain}.${entry.name} ──`);
		console.log(`  Generating content for "${entry.neutralTitle}"…`);

		try {
			const { content } = await client.generate({
				domain: entry.domain,
				name: entry.name,
				neutralTitle: entry.neutralTitle,
			});

			printContentTable(content);

			// Preview
			const preview = await client.preview({
				domain: entry.domain,
				name: entry.name,
				content,
			});
			console.log(
				`  Will write ${preview.totalTokens} tokens across ${preview.files.length} files.`,
			);

			// Approval
			if (!options.autoApprove) {
				const approved = await confirm("  Apply these tokens?");
				if (!approved) {
					console.log("  Skipped.\n");
					skipCount++;
					continue;
				}
			}

			// Apply
			const result = await client.apply({
				domain: entry.domain,
				name: entry.name,
				content,
				dryRun: options.dryRun,
			});

			if (options.dryRun) {
				console.log(
					`  [DRY RUN] Would write ${result.totalTokens} tokens to ${result.filesModified.length} files.\n`,
				);
			} else {
				console.log(
					`  Written ${result.totalTokens} tokens to ${result.filesModified.length} files.\n`,
				);
			}
			successCount++;
		} catch (err) {
			console.error(`  Error: ${err instanceof Error ? err.message : String(err)}\n`);
		}
	}

	console.log("── Summary ──");
	console.log(
		`  ${successCount} added, ${skipCount} skipped, ${entries.length - successCount - skipCount} failed`,
	);
}

async function promptForNames(): Promise<string[]> {
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	const names: string[] = [];

	console.log("Enter content names (one per line, empty line to finish):");

	while (true) {
		const line = await rl.question("> ");
		if (!line.trim()) break;
		names.push(line.trim());
	}

	rl.close();
	return names;
}
