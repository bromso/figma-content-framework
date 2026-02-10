export interface ToneDefinition {
	full: string;
	abbr: string;
	file: string;
}

export interface TypeDefinition {
	full: string;
	abbr: string;
	file: string;
}

export interface ContentEntry {
	title: string;
	subtitle: string;
	description: string;
	caption: string;
	abbreviation: string;
	emoji: string;
}

export interface ContentMatrix {
	neutral: ContentEntry;
	formal: ContentEntry;
	playful: ContentEntry;
	minimal: ContentEntry;
	witty: ContentEntry;
	quirky: ContentEntry;
}

export type ToneName = keyof ContentMatrix;

export type TypeName = keyof ContentEntry;

export interface TokenValue {
	$type: "text";
	$value: string;
	$extensions: {
		figma: FigmaExtensions;
	};
}

export interface FigmaExtensions {
	scopes: string[];
	codeSyntax: {
		WEB: string;
		ANDROID: string;
		iOS: string;
	};
	hiddenFromPublishing: boolean;
	referenceKey?: string;
}

export interface GenerateRequest {
	domain: string;
	name: string;
	neutralTitle: string;
	context?: string;
}

export interface ApplyRequest {
	domain: string;
	name: string;
	content: ContentMatrix;
	dryRun?: boolean;
}

export interface ApplyResult {
	filesModified: { file: string; tokensAdded: number }[];
	totalTokens: number;
}
