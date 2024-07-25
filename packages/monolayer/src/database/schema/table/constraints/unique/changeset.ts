/* eslint-disable max-lines */
import type { Difference } from "microdiff";
import type { GeneratorContext } from "~/changeset/schema-changeset.js";
import {
	ChangesetPhase,
	ChangeSetType,
	MigrationOpPriority,
	type Changeset,
} from "~/changeset/types.js";
import { ChangeWarningCode } from "~/changeset/warnings/codes.js";
import { ChangeWarningType } from "~/changeset/warnings/types.js";
import { currentColumName } from "~/introspection/column-name.js";
import type { TablesToRename } from "~/introspection/introspect-schemas.js";
import type {
	LocalTableInfo,
	SchemaMigrationInfo,
} from "~/introspection/introspection.js";
import { extractColumnsFromPrimaryKey } from "~/introspection/schema.js";
import {
	currentTableName,
	previousTableName,
} from "~/introspection/table-name.js";
import { hashValue } from "~/utils.js";
import {
	executeKyselyDbStatement,
	executeKyselySchemaStatement,
	existingColumns,
	toSnakeCase,
} from "../../../../../changeset/helpers.js";
import { concurrentIndex } from "../../index/changeset.js";

export function uniqueConstraintMigrationOpGenerator(
	diff: Difference,
	context: GeneratorContext,
) {
	if (isUniqueConstraintCreateFirst(diff)) {
		return createUniqueFirstConstraintMigration(diff, context);
	}
	if (isUniqueConstraintDropLast(diff)) {
		return dropUniqueLastConstraintMigration(diff, context);
	}
	if (isUniqueContraintCreateDiff(diff)) {
		return createUniqueConstraintMigration(diff, context);
	}
	if (isUniqueConstraintDropDiff(diff)) {
		return dropUniqueConstraintMigration(diff, context);
	}
	if (isUniqueChangeNameDiff(diff)) {
		return changeUniqueConstraintNameMigration(diff, context);
	}
}

type UniqueCreateFirst = {
	type: "CREATE";
	path: ["uniqueConstraints", string];
	value: {
		[key: string]: string;
	};
};

type UniqueCreateDiff = {
	type: "CREATE";
	path: ["uniqueConstraints", string, string];
	value: string;
};

type UniqueDropLast = {
	type: "REMOVE";
	path: ["uniqueConstraints", string];
	oldValue: {
		[key: string]: string;
	};
};

type UuniqueDropDiff = {
	type: "REMOVE";
	path: ["uniqueConstraints", string, string];
	oldValue: string;
};

type UniqueChangeNameDiff = {
	type: "CHANGE";
	path: ["uniqueConstraints", string, string];
	value: string;
	oldValue: string;
};

function isUniqueChangeNameDiff(
	test: Difference,
): test is UniqueChangeNameDiff {
	return (
		test.type === "CHANGE" &&
		test.path.length === 3 &&
		test.path[0] === "uniqueConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.value === "string" &&
		typeof test.oldValue === "string"
	);
}

function isUniqueConstraintCreateFirst(
	test: Difference,
): test is UniqueCreateFirst {
	return (
		test.type === "CREATE" &&
		test.path.length === 2 &&
		test.path[0] === "uniqueConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.value === "object"
	);
}

function isUniqueContraintCreateDiff(
	test: Difference,
): test is UniqueCreateDiff {
	return (
		test.type === "CREATE" &&
		test.path.length === 3 &&
		test.path[0] === "uniqueConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.value === "string"
	);
}

function isUniqueConstraintDropLast(test: Difference): test is UniqueDropLast {
	return (
		test.type === "REMOVE" &&
		test.path.length === 2 &&
		test.path[0] === "uniqueConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.oldValue === "object"
	);
}

function isUniqueConstraintDropDiff(test: Difference): test is UuniqueDropDiff {
	return (
		test.type === "REMOVE" &&
		test.path.length === 3 &&
		test.path[0] === "uniqueConstraints" &&
		typeof test.path[1] === "string" &&
		typeof test.path[2] === "string" &&
		typeof test.oldValue === "string"
	);
}

function createUniqueFirstConstraintMigration(
	diff: UniqueCreateFirst,
	{
		schemaName,
		addedTables,
		columnsToRename,
		tablesToRename,
		local,
		db,
	}: GeneratorContext,
) {
	const tableName = diff.path[1];
	return Object.entries(diff.value).reduce((acc, [hash, value]) => {
		const uniqueConstraint = uniqueConstraintDefinitionFromString(
			value,
			tableName,
			hash,
		);
		uniqueConstraint.columns = uniqueConstraint.columns.map((col) =>
			currentColumName(tableName, schemaName, col, columnsToRename),
		);
		const newHash = hashValue(
			`${uniqueConstraint.distinct}_${uniqueConstraint.columns.sort().join("_")}`,
		);
		uniqueConstraint.name = `${tableName}_${newHash}_monolayer_key`;

		if (!addedTables.includes(tableName)) {
			acc.push(
				...createUniqueConstraintWithIndex(
					schemaName,
					tableName,
					uniqueConstraint,
					tablesToRename,
					local,
					db,
					addedTables,
				),
			);
		} else {
			const changeset: Changeset = {
				priority: MigrationOpPriority.UniqueCreate,
				phase: addedTables.includes(tableName)
					? ChangesetPhase.Expand
					: ChangesetPhase.Unsafe,
				schemaName,
				tableName: tableName,
				currentTableName: currentTableName(
					tableName,
					tablesToRename,
					schemaName,
				),
				type: ChangeSetType.CreateUnique,
				up: [addUniqueConstraintOp(tableName, uniqueConstraint, schemaName)],
				down: addedTables.includes(tableName)
					? [[]]
					: [
							...dropUniqueConstraintOp(
								tableName,
								uniqueConstraint,
								schemaName,
							),
						],
			};
			acc.push(changeset);
		}
		return acc;
	}, [] as Changeset[]);
}

function dropUniqueLastConstraintMigration(
	diff: UniqueDropLast,
	{ schemaName, droppedTables, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];

	return Object.entries(diff.oldValue).reduce(
		(acc, [hashValue, constraintValue]) => {
			const uniqueConstraint = uniqueConstraintDefinitionFromString(
				constraintValue,
				previousTableName(tableName, tablesToRename),
				hashValue,
			);
			const changeset: Changeset = {
				priority: MigrationOpPriority.UniqueConstraintDrop,
				phase: droppedTables.includes(tableName)
					? ChangesetPhase.Contract
					: ChangesetPhase.Unsafe,
				schemaName,
				tableName: previousTableName(tableName, tablesToRename),
				currentTableName: currentTableName(
					tableName,
					tablesToRename,
					schemaName,
				),
				type: ChangeSetType.DropUnique,
				up: droppedTables.includes(tableName)
					? [[]]
					: [
							...dropUniqueConstraintOp(
								previousTableName(tableName, tablesToRename),
								uniqueConstraint,
								schemaName,
							),
						],
				down: [
					addUniqueConstraintOp(
						previousTableName(tableName, tablesToRename),
						uniqueConstraint,
						schemaName,
					),
				],
			};
			acc.push(changeset);
			return acc;
		},
		[] as Changeset[],
	);
}

function createUniqueConstraintMigration(
	diff: UniqueCreateDiff,
	{ schemaName, tablesToRename, addedTables, local, db }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const hashValue = diff.path[2];
	const uniqueConstraint = uniqueConstraintDefinitionFromString(
		diff.value,
		tableName,
		hashValue,
	);

	if (!addedTables.includes(tableName)) {
		return createUniqueConstraintWithIndex(
			schemaName,
			tableName,
			uniqueConstraint,
			tablesToRename,
			local,
			db,
			addedTables,
		);
	} else {
		const changeset: Changeset = {
			priority: MigrationOpPriority.UniqueCreate,
			phase: addedTables.includes(tableName)
				? ChangesetPhase.Expand
				: ChangesetPhase.Unsafe,
			schemaName,
			tableName: tableName,
			currentTableName: currentTableName(tableName, tablesToRename, schemaName),
			type: ChangeSetType.CreateUnique,
			up: [addUniqueConstraintOp(tableName, uniqueConstraint, schemaName)],
			down: [
				...dropUniqueConstraintOp(tableName, uniqueConstraint, schemaName),
			],
		};
		return changeset;
	}
}

function dropUniqueConstraintMigration(
	diff: UuniqueDropDiff,
	{ droppedTables, schemaName, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const hashValue = diff.path[2];
	const uniqueConstraint = uniqueConstraintDefinitionFromString(
		diff.oldValue,
		previousTableName(tableName, tablesToRename),
		hashValue,
	);

	const changeset: Changeset = {
		priority: MigrationOpPriority.UniqueConstraintDrop,
		phase: droppedTables.includes(tableName)
			? ChangesetPhase.Expand
			: ChangesetPhase.Unsafe,
		schemaName,
		tableName: previousTableName(tableName, tablesToRename),
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangeSetType.DropUnique,
		up: [
			...dropUniqueConstraintOp(
				previousTableName(tableName, tablesToRename),
				uniqueConstraint,
				schemaName,
			),
		],
		down: [
			addUniqueConstraintOp(
				previousTableName(tableName, tablesToRename),
				uniqueConstraint,
				schemaName,
			),
		],
	};
	return changeset;
}

function changeUniqueConstraintNameMigration(
	diff: UniqueChangeNameDiff,
	{ schemaName, tablesToRename, camelCaseOptions }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const oldName = `${previousTableName(toSnakeCase(tableName, camelCaseOptions), tablesToRename)}_${diff.path[2]}_monolayer_key`;
	const newName = `${tableName}_${hashValue(
		`${diff.value.includes("UNIQUE NULLS DISTINCT") ? true : false}_${extractColumnsFromPrimaryKey(diff.value).sort().join("_")}`,
	)}_monolayer_key`;

	const changeset: Changeset = {
		priority: MigrationOpPriority.ConstraintChange,
		phase: ChangesetPhase.Unsafe,
		schemaName,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangeSetType.RenameUnique,
		up: [
			executeKyselyDbStatement(
				`ALTER TABLE "${schemaName}"."${tableName}" RENAME CONSTRAINT ${oldName} TO ${newName}`,
			),
		],
		down: [
			executeKyselyDbStatement(
				`ALTER TABLE "${schemaName}"."${tableName}" RENAME CONSTRAINT ${newName} TO ${oldName}`,
			),
		],
	};
	return changeset;
}

type ConstraintDefinition = {
	name: string;
	distinct: boolean;
	columns: string[];
};

export function uniqueConstraintDefinitionFromString(
	unique: string,
	tableName: string,
	hashValue: string,
) {
	const [, columns] = unique.split("DISTINCT (");

	const definition: ConstraintDefinition = {
		name: `${tableName}_${hashValue}_monolayer_key`,
		distinct: unique.includes("UNIQUE NULLS DISTINCT"),
		columns: columns?.replace(/"/g, "").split(")")[0]?.split(", ") || [],
	};
	return definition;
}

function addUniqueConstraintOp(
	tableName: string,
	definition: ConstraintDefinition,
	schemaName: string,
): string[] {
	return executeKyselySchemaStatement(
		schemaName,
		`alterTable("${tableName}")`,
		`addUniqueConstraint("${definition.name}", [${definition.columns
			.map((col) => `"${col}"`)
			.join(", ")}]${
			!definition.distinct ? ", (col) => col.nullsNotDistinct()" : ""
		})`,
	);
}

function dropUniqueConstraintOp(
	tableName: string,
	definition: ConstraintDefinition,
	schemaName: string,
) {
	return [
		executeKyselySchemaStatement(
			schemaName,
			`alterTable("${tableName}")`,
			`dropConstraint("${definition.name}")`,
		),
		executeKyselySchemaStatement(
			schemaName,
			`dropIndex("${definition.name}_monolayer_uc_idx")`,
			"ifExists()",
		),
	];
}

function indexForUniqueConstraint(
	schemaName: string,
	tableName: string,
	definition: ConstraintDefinition,
	tablesToRename: TablesToRename,
	addedTables: string[],
) {
	const indexName = `${definition.name}_monolayer_uc_idx`;
	const uniqueConstraintColumns = definition.columns
		.map((col) => `"${col}"`)
		.join(", ");

	const nullsDistinct = !definition.distinct ? "nulls not distinct" : "";
	const indexDefinition = `create unique index concurrently "${indexName}" on "${schemaName}"."${tableName}" (${uniqueConstraintColumns}) ${nullsDistinct}`;

	const changeset: Changeset = {
		priority: MigrationOpPriority.IndexCreate,
		phase: addedTables.includes(tableName)
			? ChangesetPhase.Expand
			: ChangesetPhase.Unsafe,
		schemaName,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangeSetType.CreateIndex,
		transaction: false,
		up: [concurrentIndex(schemaName, indexName, indexDefinition)],
		down: [
			executeKyselySchemaStatement(
				schemaName,
				`dropIndex("${indexName}")`,
				"ifExists()",
			),
		],
	};
	return changeset;
}

function createUniqueConstraintWithIndex(
	schemaName: string,
	tableName: string,
	definition: ConstraintDefinition,
	tablesToRename: TablesToRename,
	local: LocalTableInfo,
	db: SchemaMigrationInfo,
	addedTables: string[],
) {
	const indexName = `${definition.name}_monolayer_uc_idx`;
	const uniqueConstraintDefinition = `alter table "${schemaName}"."${tableName}" add constraint "${definition.name}" unique using index "${indexName}"`;
	const existingColumnsWithUniqueAdded = existingColumns({
		columns: definition.columns,
		table: tableName,
		local,
		db,
	});
	const createConstraint: Changeset = {
		priority: MigrationOpPriority.UniqueCreate,
		phase: addedTables.includes(tableName)
			? ChangesetPhase.Expand
			: ChangesetPhase.Unsafe,
		schemaName,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangeSetType.CreateUnique,
		up: [executeKyselyDbStatement(uniqueConstraintDefinition)],
		down: dropUniqueConstraintOp(tableName, definition, schemaName),
	};
	if (existingColumnsWithUniqueAdded.length > 0) {
		createConstraint.warnings = [
			{
				type: ChangeWarningType.MightFail,
				code: ChangeWarningCode.AddUniqueToExistingColumn,
				schema: schemaName,
				table: tableName,
				columns: existingColumnsWithUniqueAdded,
			},
		];
	}
	const changeset: Changeset[] = [
		indexForUniqueConstraint(
			schemaName,
			tableName,
			definition,
			tablesToRename,
			addedTables,
		),
		createConstraint,
	];
	return changeset;
}
