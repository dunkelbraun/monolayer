import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { ChangesetPhase } from "@monorepo/pg/changeset/types.js";
import { applyMigrations } from "@monorepo/programs/migrations/apply.js";
import { exit } from "node:process";
import { cliAction } from "~monolayer/cli-action.js";

type MigrationPhase = "all" | ChangesetPhase;

export function applyAction(program: Command) {
	return commandWithDefaultOptions({
		name: "apply",
		program: program,
	})
		.description("Apply pending migrations")
		.requiredOption(
			"-p, --phase <name>",
			"migration phase to apply. One of: `all`, `alter`, `contract`, `data`, or `expand`.",
			(value) =>
				["all", "alter", "contract", "data", "expand"].includes(value)
					? (value as MigrationPhase)
					: "none",
		)
		.option(
			"-m, --migration <name>",
			"named migration to apply. Can only be used when applying the `contract` phase.",
		)
		.action(async (opts) => {
			if (
				validPhase(opts.phase) &&
				validMigrationName(opts.phase, opts.migration)
			) {
				const message =
					opts.phase === "all"
						? `Migrate all pending migrations (expand, alter, data, contract)`
						: `Migrate pending ${opts.phase} migrations`;
				await cliAction(message, opts, [
					applyMigrations(applyOptions(opts.phase, opts.migration)),
				]);
			}
		});
}

function validPhase(phase: MigrationPhase | "none"): phase is MigrationPhase {
	if (phase === "none") {
		console.log(
			"error: invalid phase: should be one of `all`, `expand`, `alter`, `data`, `contract`.",
		);
		exit(1);
	}
	return true;
}

function validMigrationName(phase: MigrationPhase, migration?: string) {
	if (phase !== "contract" && migration) {
		console.log(
			"error: invalid option: --migration is only allowed when phase is `contract`.",
		);
		exit(1);
	}
	return true;
}
function applyOptions(phase: MigrationPhase, migration?: string) {
	return phase === "contract"
		? {
				phase: phase,
				...(migration ? { migrationName: migration } : {}),
			}
		: {
				phase,
			};
}
