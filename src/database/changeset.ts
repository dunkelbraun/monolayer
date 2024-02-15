import microdiff, { type Difference } from "microdiff";
import type { DbTableInfo, LocalTableInfo } from "./introspection/types.js";
import { Changeset } from "./migration_op/changeset.js";
import {
	type CreateTableDiff,
	type DropTableTableDiff,
	isCreateTable,
	isDropTable,
} from "./migration_op/table.js";
import { migrationOpGenerators } from "./migration_op_generators.js";
import type { MigrationSchema } from "./migrations/migration_schema.js";

interface Generator {
	(
		diff: Difference,
		addedTables: string[],
		droppedTables: string[],
		local: LocalTableInfo,
		db: DbTableInfo,
	): Changeset | Changeset[] | undefined;
}

export function changeset(
	local: MigrationSchema,
	remote: MigrationSchema,
	generators: Generator[] = migrationOpGenerators,
): Changeset[] {
	const { diff, addedTables, droppedTables } = changesetDiff(local, remote);
	return diff
		.flatMap((difference) => {
			for (const generator of generators) {
				const op = generator(
					difference,
					addedTables,
					droppedTables,
					local,
					remote,
				);
				if (op !== undefined) return op;
			}
			return [];
		})
		.sort((a, b) => (a.priority || 1) - (b.priority || 1));
}

export function changesetDiff(local: MigrationSchema, remote: MigrationSchema) {
	const diff = microdiff(remote, local);
	const tableName = (diff: CreateTableDiff | DropTableTableDiff) =>
		diff.path[1];
	const addedTables = diff.filter(isCreateTable).map(tableName);
	const droppedTables = diff.filter(isDropTable).map(tableName);
	return {
		diff,
		addedTables,
		droppedTables,
	};
}
