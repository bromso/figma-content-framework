/**
 * Generate platform-specific code syntax variable names.
 *
 * The `path` is the full dot-separated token path, e.g.
 *   "legal.copyright.neutral.lang--neut--title--copyright"
 *
 * WEB:     var(--legal-copyright-neutral-lang--neut--title--copyright)
 * ANDROID: legal_copyright_neutral_lang__neut__title__copyright
 * iOS:     legalCopyrightNeutralLangNeutTitleCopyright
 */

export function webSyntax(path: string): string {
	const cssVar = path.replace(/\./g, "-");
	return `var(--${cssVar})`;
}

export function androidSyntax(path: string): string {
	return path.replace(/\./g, "_").replace(/-/g, "_");
}

export function iosSyntax(path: string): string {
	const parts = path.split(/[.-]+/);
	return parts
		.map((part, i) => (i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
		.join("");
}

export function codeSyntax(path: string) {
	return {
		WEB: webSyntax(path),
		ANDROID: androidSyntax(path),
		iOS: iosSyntax(path),
	};
}
