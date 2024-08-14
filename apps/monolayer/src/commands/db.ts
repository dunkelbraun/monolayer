import type { Command } from "@commander-js/extra-typings";
import { commandWithDefaultOptions } from "@monorepo/cli/command-with-default-options.js";
import { createDatabase } from "~monolayer/actions/database/create.js";
import { cliAction, cliActionWithoutContext } from "~monolayer/cli-action.js";
import { dropDatabase } from "../actions/database/drop.js";
import { seed } from "../actions/database/seed.js";
import { structureLoad } from "../actions/database/structure-load.js";
import { importSchema } from "../actions/import-schema.js";

export function dbCommand(program: Command) {
	const db = program.command("db");

	db.description("Database commands");

	commandWithDefaultOptions({
		name: "create",
		program: db,
	})
		.description("creates a database")
		.action(
			async (opts) =>
				await cliAction("Create Database", opts, [createDatabase]),
		);

	commandWithDefaultOptions({
		name: "drop",
		program: db,
	})
		.description("drops a database")
		.action(
			async (opts) => await cliAction("Drop Database", opts, [dropDatabase()]),
		);

	commandWithDefaultOptions({
		name: "reset",
		program: db,
	})
		.description("Restores a database from its structure file")
		.action(async (opts) => {
			await cliAction("Reset Database", opts, [structureLoad()]);
		});

	db.command("import")
		.description("imports schema")
		.action(async () => {
			await cliActionWithoutContext("Import database", [importSchema]);
		});

	commandWithDefaultOptions({
		name: "seed",
		program: db,
	})
		.description("seeds a database")
		.option("-r, --replant", "Truncate tables before seeding")
		.option("-d, --disable-warnings", "disable truncation warnings")
		.option("-f, --file <seed-file-name>", "seed file", "seed.ts")
		.action(async (opts) => {
			await cliAction("monolayer seed", opts, [
				seed({
					replant: opts.replant,
					disableWarnings: opts.disableWarnings,
					seedFile: opts.file,
				}),
			]);
		});

	return db;
}
