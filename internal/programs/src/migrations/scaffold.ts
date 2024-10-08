import { ChangesetPhase } from "@monorepo/pg/changeset/types.js";
import { appEnvironmentMigrationsFolder } from "@monorepo/state/app-environment.js";
import { PackageNameState } from "@monorepo/state/package-name.js";
import { createFile } from "@monorepo/utils/create-file.js";
import { dateStringWithMilliseconds } from "@monorepo/utils/date-string.js";
import { Effect } from "effect";
import { mkdirSync } from "fs";
import nunjucks from "nunjucks";
import path from "path";
import { migrationNamePrompt } from "~programs/migration-name.js";

export function scaffoldMigration(
	migrationPhase: ChangesetPhase,
	transaction?: boolean,
) {
	return Effect.gen(function* () {
		const name = yield* migrationNamePrompt();
		const dateStr = dateStringWithMilliseconds();
		const scaffoldName = `${dateStr}-${name}`;
		const filePath = path.join(
			yield* appEnvironmentMigrationsFolder,
			migrationPhase,
			`${scaffoldName}.ts`,
		);
		mkdirSync(path.dirname(filePath), { recursive: true });
		const content = nunjucks.compile(migrationTemplate).render({
			name: scaffoldName,
			transaction,
			packageName: (yield* PackageNameState.current).name,
		});
		createFile(filePath, content, true);

		return filePath;
	});
}

const migrationTemplate = `import { Kysely } from "kysely";
import { type Migration } from "{{ packageName }}/migration";

export const migration: Migration = {
  name: "{{ name }}",
  transaction: {{ transaction }},
  scaffold: true,
};

export async function up(db: Kysely<any>): Promise<void> {
}

export async function down(db: Kysely<any>): Promise<void> {
}`;
