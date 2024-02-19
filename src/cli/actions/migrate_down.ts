import fs from "node:fs/promises";
import path from "path";
import * as p from "@clack/prompts";
import {
	FileMigrationProvider,
	Kysely,
	Migrator,
	PostgresDialect,
} from "kysely";
import pg from "pg";
import color from "picocolors";
import { cwd } from "process";
import { importConfig } from "~/config.js";
import { dumpStructure } from "../components/dump_structure.js";
import { checkEnvironmentIsConfigured } from "../utils/clack.js";

export async function migrateDown(environment: string) {
	p.intro("Migrate Down");
	const config = await importConfig();
	const environmentConfig =
		config.environments[environment as keyof (typeof config)["environments"]];

	checkEnvironmentIsConfigured(config, environment, {
		outro: true,
	});

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const db = new Kysely<any>({
		dialect: new PostgresDialect({
			pool: new pg.Pool(environmentConfig),
		}),
	});

	const migrator = new Migrator({
		db,
		provider: new FileMigrationProvider({
			fs,
			path,
			migrationFolder: path.join(cwd(), config.folder, "migrations"),
		}),
	});

	const { error, results } = await migrator.migrateDown();
	if (error !== undefined || results === undefined) {
		p.cancel("Unexpected error while migrating");
		console.error(error);
		process.exit(1);
	}
	for (const result of results) {
		switch (result.status) {
			case "Success":
				p.log.info(`${color.green("down")} ${result.migrationName}`);
				break;
			case "Error":
				p.log.error(`${color.red("error")} ${result.migrationName}`);
				break;
			case "NotExecuted":
				p.log.warn(`${color.yellow("not executed")} ${result.migrationName}`);
				break;
		}
	}

	const result = await dumpStructure(config, environment);
	if (result instanceof Error) {
		p.log.error(`${color.red("error")} while dumping structure`);
		console.error(error);
		process.exit(1);
	}
	p.log.info(`${color.green("dumped")} ${result}`);
	db.destroy();

	p.outro("Done");
}
