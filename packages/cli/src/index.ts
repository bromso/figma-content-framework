import { parseArgs } from "node:util";
import { ApiClient } from "./api-client.js";
import { addCommand } from "./commands/add.js";

const HELP = `
figma-content CLI — Generate and apply design token content

Usage:
  bun run cli add [options] <names...>

Commands:
  add     Generate AI content and apply tokens to all 13 files

Options:
  --domain <name>    Content domain (e.g., "nav", "legal")
  --input <file>     Read names from a file (one per line)
  --interactive      Prompt for names interactively
  --auto-approve     Skip approval prompts
  --dry-run          Preview changes without writing files
  --api-url <url>    API base URL (default: http://localhost:4000)
  --help             Show this help message

Examples:
  bun run cli add --domain nav "Dashboard, Settings, Profile"
  bun run cli add "nav.dashboard" "nav.settings"
  bun run cli add --input words.txt --auto-approve
  bun run cli add --domain legal "Privacy Policy" --dry-run
`;

function main() {
	const { values, positionals } = parseArgs({
		allowPositionals: true,
		args: process.argv.slice(2),
		options: {
			domain: { type: "string" },
			input: { type: "string" },
			interactive: { type: "boolean", default: false },
			"auto-approve": { type: "boolean", default: false },
			"dry-run": { type: "boolean", default: false },
			"api-url": { type: "string", default: "http://localhost:4000" },
			help: { type: "boolean", default: false },
		},
	});

	if (values.help || positionals.length === 0) {
		console.log(HELP);
		process.exit(0);
	}

	const [command, ...rest] = positionals;

	if (command !== "add") {
		console.error(`Unknown command: ${command}\n`);
		console.log(HELP);
		process.exit(1);
	}

	const client = new ApiClient(values["api-url"] ?? "http://localhost:4000");

	addCommand(client, {
		domain: values.domain,
		autoApprove: values["auto-approve"] ?? false,
		dryRun: values["dry-run"] ?? false,
		input: values.input,
		interactive: values.interactive ?? false,
		names: rest,
	});
}

main();
