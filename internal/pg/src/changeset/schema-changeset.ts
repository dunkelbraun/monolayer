import { gen, type Effect } from "effect/Effect";
import microdiff, { type Difference } from "microdiff";
import { ChangesetGeneratorState } from "~pg/changeset/changeset-generator.js";
import { migrationOpGenerators } from "~pg/changeset/generators.js";
import {
	isCreateColumn,
	isDropColumn,
} from "~pg/changeset/generators/column.js";
import { isCreateTable, isDropTable } from "~pg/changeset/generators/table.js";
import type { TypeAlignment } from "~pg/changeset/helpers/alignment.js";
import { type Changeset } from "~pg/changeset/types.js";
import { toSnakeCase } from "~pg/helpers/to-snake-case.js";
import {
	type ColumnsToRename,
	type TablesToRename,
} from "~pg/introspection/schema.js";
import type { SchemaMigrationInfo } from "~pg/schema/column/types.js";
import type { AnySchema } from "~pg/schema/schema.js";

type Generator = (
	diff: Difference,
) => Effect<
	Changeset | Changeset[] | undefined,
	never,
	ChangesetGeneratorState | never
>;

export type SchemaIntrospection = {
	schema: AnySchema;
	allSchemas: AnySchema[];
	schemaName: string;
	local: SchemaMigrationInfo;
	remote: SchemaMigrationInfo;
	tableDiff: {
		added: string[];
		deleted: string[];
	};
	tablesToRename: TablesToRename;
	tablePriorities: string[];
	columnsToRename: ColumnsToRename;
};

export function schemaChangeset(
	introspection: SchemaIntrospection,
	camelCase: boolean,
	typeAlignments: TypeAlignment[],
	generators: Generator[] = migrationOpGenerators,
) {
	return gen(function* () {
		const { diff, addedTables, droppedTables, addedColumns, droppedColumns } =
			changesetDiff(
				{
					...introspection.local,
					tablePriorities: [],
				},
				{
					...introspection.remote,
					tablePriorities: [],
				},
			);

		yield* ChangesetGeneratorState.update({
			local: introspection.local,
			db: introspection.remote,
			addedTables,
			droppedTables,
			schemaName: toSnakeCase(introspection.schemaName, camelCase),
			camelCase: camelCase,
			tablesToRename: introspection.tablesToRename,
			columnsToRename: introspection.columnsToRename,
			typeAlignments: typeAlignments,
			addedColumns,
			droppedColumns,
		});

		let changesets: Changeset[] = [];

		for (const difference of diff) {
			for (const generator of generators) {
				const op = yield* generator(difference);
				if (op !== undefined) {
					changesets = [...changesets, ...(Array.isArray(op) ? op : [op])];
				}
			}
		}
		return sortChangeset([...changesets], introspection);
	});
}

export function changesetDiff(
	local: SchemaMigrationInfo,
	remote: SchemaMigrationInfo,
) {
	const diff = microdiff(remote, local);
	return {
		diff,
		addedTables: diff.filter(isCreateTable).map((diff) => diff.path[1]),
		droppedTables: diff.filter(isDropTable).map((diff) => diff.path[1]),
		addedColumns: addedColumns(diff),
		droppedColumns: droppedColumns(diff),
	};
}

function addedColumns(diff: Difference[]) {
	return diff
		.filter((diff) => isCreateColumn(diff))
		.map((diff) => [diff.path[1], diff.path[3]] as [string, string])
		.reduce(
			(acc, [table, column]) => {
				if (acc[table] === undefined) {
					acc[table] = [];
				}
				acc[table].push(column);
				return acc;
			},
			{} as Record<string, string[]>,
		);
}

function droppedColumns(diff: Difference[]) {
	return diff
		.filter(isDropColumn)
		.map((diff) => [diff.path[1], diff.path[3]] as [string, string])
		.reduce(
			(acc, [table, column]) => {
				if (acc[table] === undefined) {
					acc[table] = [];
				}
				acc[table].push(column);
				return acc;
			},
			{} as Record<string, string[]>,
		);
}

function sortChangeset(
	changeset: Changeset[],
	introspection: SchemaIntrospection,
) {
	const tableOrderIndex = introspection.tablePriorities.reduce(
		(acc, name, index) => {
			acc[name] = index;
			return acc;
		},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		{} as Record<string, any>,
	);

	return changeset
		.sort((a, b) => (a.priority || 1) - (b.priority || 1))
		.sort((a, b) => {
			if (a.type === "createTable" || a.type === "dropTable") {
				const indexA = introspection.tablePriorities.includes(a.tableName)
					? tableOrderIndex[a.tableName]
					: -changeset.length;
				const indexB = introspection.tablePriorities.includes(b.tableName)
					? tableOrderIndex[b.tableName]
					: -changeset.length;
				return indexA - indexB;
			}
			return 1 - 1;
		});
}
