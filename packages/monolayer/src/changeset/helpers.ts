import { CamelCasePlugin } from "kysely";
import type { CamelCaseOptions } from "~/configuration.js";
import type {
	LocalTableInfo,
	SchemaMigrationInfo,
} from "~/introspection/introspection.js";
import { findColumnByNameInTable } from "~/introspection/schema.js";

export function executeKyselySchemaStatement(
	schemaName: string,
	...args: string[]
) {
	return [
		`await db.withSchema("${schemaName}").schema`,
		...args,
		"execute();",
	].filter((x) => x !== "");
}

export function executeKyselyDbStatement(statement: string) {
	return [`await ${sqlStatement(statement)}`, "execute(db);"];
}

export function sqlStatement(value: string) {
	return ["sql`", value, "`"].join("");
}

class CamelCase extends CamelCasePlugin {
	toSnakeCase(str: string): string {
		return this.snakeCase(str);
	}
}

export function toSnakeCase(str: string, camelCase: CamelCaseOptions) {
	if (camelCase.enabled === true) {
		return new CamelCase(camelCase.options).toSnakeCase(str);
	}
	return str;
}

export type ColumnExists =
	| {
			exists: true;
			nullable: boolean;
	  }
	| {
			exists: false;
	  };

export function columnInDb(
	tableName: string,
	column: string,
	db: SchemaMigrationInfo,
): ColumnExists {
	const table = db.table[tableName];
	if (table !== undefined) {
		const tableColumn =
			table.columns[column] || findColumnByNameInTable(table, column);
		if (tableColumn !== undefined) {
			return {
				exists: true,
				nullable: tableColumn.isNullable,
			};
		}
	}
	return {
		exists: false,
	};
}

export function columnInTable(
	tableName: string,
	column: string,
	local: LocalTableInfo,
): ColumnExists {
	const table = local.table[tableName];
	if (table !== undefined) {
		const tableColumn =
			table.columns[column] || findColumnByNameInTable(table, column);
		if (tableColumn !== undefined) {
			return {
				exists: true,
				nullable: tableColumn.isNullable,
			};
		}
	}
	return {
		exists: false,
	};
}

export function existingColumns(options: {
	columns: string[];
	table: string;
	local: LocalTableInfo;
	db: SchemaMigrationInfo;
}) {
	const { columns, table, local, db } = options;
	const existingColumns = columns.filter((column) => {
		const localColumn = columnInTable(table, column, local);
		const dbColumn = columnInDb(table, column, db);
		return localColumn.exists === true && dbColumn.exists === true;
	});
	return existingColumns;
}
