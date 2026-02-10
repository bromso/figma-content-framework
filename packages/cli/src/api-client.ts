import type { ApplyResult, ContentMatrix } from "@figma-content/core";

export class ApiClient {
	constructor(private baseUrl: string) {}

	async generate(params: {
		domain: string;
		name: string;
		neutralTitle: string;
		context?: string;
	}): Promise<{ domain: string; name: string; content: ContentMatrix }> {
		const res = await fetch(`${this.baseUrl}/content/generate`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(params),
		});

		if (!res.ok) {
			const body = await res.text();
			throw new Error(`Generate failed (${res.status}): ${body}`);
		}

		return res.json();
	}

	async preview(params: {
		domain: string;
		name: string;
		content: ContentMatrix;
	}): Promise<{
		files: Array<{ file: string; layer: string; tokenCount: number }>;
		totalTokens: number;
	}> {
		const res = await fetch(`${this.baseUrl}/content/preview`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(params),
		});

		if (!res.ok) {
			const body = await res.text();
			throw new Error(`Preview failed (${res.status}): ${body}`);
		}

		return res.json();
	}

	async apply(params: {
		domain: string;
		name: string;
		content: ContentMatrix;
		dryRun?: boolean;
	}): Promise<ApplyResult> {
		const res = await fetch(`${this.baseUrl}/tokens/apply`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(params),
		});

		if (!res.ok) {
			const body = await res.text();
			throw new Error(`Apply failed (${res.status}): ${body}`);
		}

		return res.json();
	}
}
