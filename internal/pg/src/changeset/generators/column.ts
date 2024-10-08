/* eslint-disable max-lines */
import { gen } from "effect/Effect";
import { Difference } from "microdiff";
import { ChangesetGeneratorState } from "~pg/changeset/changeset-generator.js";
import type { GeneratorContext } from "~pg/changeset/generator-context.js";
import {
	type ColumnInfoDiff,
	commentForDefault,
	compileDataType,
	optionsForColumn,
	toValueAndHash,
} from "~pg/changeset/generators/helpers.js";
import {
	columnNullableMigrationOperation,
	setNotNullOp,
} from "~pg/changeset/generators/modify-column-nullable.js";
import type { ColumnToAlign } from "~pg/changeset/helpers/alignment.js";
import {
	executeKyselySchemaStatement,
	sqlStatement,
} from "~pg/changeset/helpers/helpers.js";
import {
	type Changeset,
	ChangesetPhase,
	ChangesetType,
	MigrationOpPriority,
} from "~pg/changeset/types.js";
import { ChangeWarningType } from "~pg/changeset/warnings/change-warning-type.js";
import { ChangeWarningCode } from "~pg/changeset/warnings/codes.js";
import type { ChangeWarning } from "~pg/changeset/warnings/warnings.js";
import { currentTableName } from "~pg/introspection/introspection/table-name.js";

export function columnMigrationOpGenerator(diff: Difference) {
	return gen(function* () {
		const context = yield* ChangesetGeneratorState.current;

		if (isCreateColumn(diff)) {
			return createColumnMigration(diff, context);
		}
		if (isCreateColumnNonNullableColumn(diff)) {
			return createNonNullableColumnMigration(diff, context);
		}
		if (isDropColumn(diff)) {
			return dropColumnMigration(diff, context);
		}
	});
}

export type CreateColumnDiff = {
	type: "CREATE";
	path: ["table", string, "column", string];
	value: ColumnInfoDiff;
};

export function isCreateColumn(
	test: Difference,
	// context?: GeneratorContext,
): test is CreateColumnDiff {
	return (
		test.type === "CREATE" &&
		test.path.length === 4 &&
		test.path[0] === "table" &&
		test.path[2] === "columns" &&
		test.value.isNullable !== false
	);
}

function isCreateColumnNonNullableColumn(
	test: Difference,
	// context: GeneratorContext,
): test is CreateColumnDiff {
	return (
		test.type === "CREATE" &&
		test.path.length === 4 &&
		test.path[0] === "table" &&
		test.path[2] === "columns" &&
		test.value.isNullable === false
	);
}

function createColumnMigration(
	diff: CreateColumnDiff,
	{ schemaName, tablesToRename }: GeneratorContext,
	skipNullable: boolean = true,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[3];
	const columnDef = diff.value;

	const up = [
		executeKyselySchemaStatement(
			schemaName,
			`alterTable("${tableName}")`,
			`addColumn("${columnName}", ${compileDataType(
				columnDef.dataType,
			)}${optionsForColumn(columnDef, skipNullable)})`,
		),
	];
	const defaultValueAndHash = toValueAndHash(String(columnDef.defaultValue));

	if (columnDef.defaultValue !== null) {
		up.push(
			commentForDefault(schemaName, tableName, columnName, defaultValueAndHash),
		);
	}
	const changeset: Changeset = {
		priority: MigrationOpPriority.ColumnCreate,
		phase: ChangesetPhase.Expand,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangesetType.CreateColumn,
		up: up,
		down: [
			executeKyselySchemaStatement(
				schemaName,
				`alterTable("${tableName}")`,
				`dropColumn("${columnName}")`,
			),
		],
		schemaName,
	};
	addWarnings(changeset, columnDef, schemaName, tableName, columnName);
	return changeset;
}

function createNonNullableColumnMigration(
	diff: CreateColumnDiff,
	{
		local,
		db,
		addedTables,
		droppedTables,
		schemaName,
		camelCase,
		tablesToRename,
		columnsToRename,
		typeAlignments,
		addedColumns,
		droppedColumns,
	}: GeneratorContext,
) {
	const tableName = diff.path[1];
	const columnName = diff.path[3];
	const columnDef = diff.value;

	const context: GeneratorContext = {
		local,
		db,
		addedTables,
		droppedTables,
		schemaName,
		camelCase,
		tablesToRename,
		columnsToRename,
		typeAlignments,
		addedColumns,
		droppedColumns,
	};
	if (columnDef.splitColumn) {
		return [
			createColumnMigration(diff, context, false),
			columnNullableMigrationOperation(
				{
					type: "CHANGE",
					path: ["table", tableName, "columns", columnName, "isNullable"],
					value: false,
					oldValue: true,
				},
				context,
			),
		];
	}

	const up = [
		executeKyselySchemaStatement(
			schemaName,
			`alterTable("${tableName}")`,
			`addColumn("${columnName}", ${compileDataType(columnDef.dataType)}${nullableColumnOptions(columnDef)})`,
		),
	];

	if (columnDef.defaultValue !== null) {
		const defaultValueAndHash = toValueAndHash(String(columnDef.defaultValue));

		up.push(
			commentForDefault(schemaName, tableName, columnName, defaultValueAndHash),
		);
	}

	if (columnDef.dataType !== "serial" && columnDef.dataType !== "bigserial") {
		up.push(...setNotNullOp(schemaName, tableName, columnName));
	}

	const down = [
		executeKyselySchemaStatement(
			schemaName,
			`alterTable("${tableName}")`,
			`dropColumn("${columnName}")`,
		),
	];

	const changeset: Changeset = {
		priority: MigrationOpPriority.ColumnCreate,
		phase: ChangesetPhase.Expand,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangesetType.CreateNonNullableColumn,
		up,
		down,
		schemaName,
	};
	addWarnings(changeset, columnDef, schemaName, tableName, columnName);
	return changeset;
}

export type DropColumnDiff = {
	type: "REMOVE";
	path: ["table", string, "columns", string];
	oldValue: ColumnInfoDiff;
};

export function isDropColumn(test: Difference): test is DropColumnDiff {
	return (
		test.type === "REMOVE" &&
		test.path.length === 4 &&
		test.path[0] === "table" &&
		test.path[2] === "columns"
	);
}

function dropColumnMigration(
	diff: DropColumnDiff,
	{ schemaName, tablesToRename }: GeneratorContext,
) {
	const tableName = diff.path[1];
	const columnDef = diff.oldValue;
	const columnName = diff.path[3];

	const down = [
		executeKyselySchemaStatement(
			schemaName,
			`alterTable("${tableName}")`,
			`addColumn("${columnName}", ${compileDataType(
				columnDef.dataType,
			)}${optionsForColumn(columnDef)})`,
		),
	];
	if (columnDef.defaultValue !== null) {
		const defaultValueAndHash = toValueAndHash(String(columnDef.defaultValue));
		down.push(
			commentForDefault(schemaName, tableName, columnName, defaultValueAndHash),
		);
	}
	const changeset: Changeset = {
		priority: MigrationOpPriority.ColumnDrop,
		phase: ChangesetPhase.Contract,
		tableName: tableName,
		currentTableName: currentTableName(tableName, tablesToRename, schemaName),
		type: ChangesetType.DropColumn,
		warnings: [
			{
				type: ChangeWarningType.Destructive,
				code: ChangeWarningCode.ColumnDrop,
				schema: schemaName,
				table: currentTableName(tableName, tablesToRename, schemaName),
				column: columnName,
			},
		],
		up: [
			executeKyselySchemaStatement(
				schemaName,
				`alterTable("${tableName}")`,
				`dropColumn("${columnName}")`,
			),
		],
		down: down,
		schemaName,
	};
	return changeset;
}

function addWarnings(
	changeset: Changeset,
	columnDef: ColumnInfoDiff,
	schemaName: string,
	tableName: string,
	columnName: string,
) {
	const warnings: ChangeWarning[] = [];

	if (columnDef.dataType === "serial" || columnDef.dataType === "bigserial") {
		warnings.push({
			type: ChangeWarningType.Blocking,
			code:
				columnDef.dataType === "serial"
					? ChangeWarningCode.AddSerialColumn
					: ChangeWarningCode.AddBigSerialColumn,
			schema: schemaName,
			table: tableName,
			column: columnName,
		});
	}

	if (columnDef.volatileDefault === "yes") {
		warnings.push({
			type: ChangeWarningType.Blocking,
			code: ChangeWarningCode.AddVolatileDefault,
			schema: schemaName,
			table: tableName,
			column: columnName,
		});
	}
	if (columnDef.isNullable === false) {
		warnings.push({
			type: ChangeWarningType.MightFail,
			code: ChangeWarningCode.AddNonNullableColumn,
			schema: schemaName,
			table: tableName,
			column: columnName,
		});
	}
	if (warnings.length > 0) {
		changeset.warnings = warnings;
	}
}

function nullableColumnOptions(column: ColumnToAlign | ColumnInfoDiff) {
	let columnOptions = "";
	const options = [];

	if (column.defaultValue !== null) {
		const defaultValueAndHash = toValueAndHash(String(column.defaultValue));

		options.push(`defaultTo(${sqlStatement(defaultValueAndHash.value ?? "")})`);
	}
	switch (column.identity) {
		case "ALWAYS":
			options.push(`generatedAlwaysAsIdentity()`);
			break;
		case "BY DEFAULT":
			options.push(`generatedByDefaultAsIdentity()`);
			break;
		default:
			break;
	}

	if (options.length !== 0)
		columnOptions = `, (col) => col.${options.join(".")}`;
	return columnOptions;
}
