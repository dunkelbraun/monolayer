import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { handleMissingDatabase } from "~monolayer/actions/database/handle-missing.js";
import { generateMigration } from "~monolayer/actions/migrations/generate.js";
import { handlePendingSchemaMigrations } from "~monolayer/actions/migrations/pending.js";
import { cliAction } from "~monolayer/cli-action.js";

export function generateAction(program: Command) {
	commandWithDefaultOptions({
		name: "generate",
		program: program,
	})
		.description("generate a schema migration")
		.action(async (opts) => {
			await cliAction("monolayer generate", opts, [
				handleMissingDatabase,
				handlePendingSchemaMigrations,
				generateMigration(),
			]);
		});
}
