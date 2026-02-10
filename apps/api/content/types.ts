import type { ContentMatrix } from "@figma-content/core";

export interface GenerateParams {
	domain: string;
	name: string;
	neutralTitle: string;
	context?: string;
}

export interface GenerateResponse {
	domain: string;
	name: string;
	content: ContentMatrix;
}

export interface PreviewParams {
	domain: string;
	name: string;
	content: ContentMatrix;
}

export interface PreviewFile {
	file: string;
	layer: "language" | "type" | "tone";
	tokenCount: number;
	tokens: Record<string, string>;
}

export interface PreviewResponse {
	files: PreviewFile[];
	totalTokens: number;
}
