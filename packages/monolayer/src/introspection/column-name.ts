import type { ColumnsToRename } from "~/introspection/introspect-schemas.js";

export function changedColumnNames(
	table: string,
	schemaName: string,
	columnsToRename: ColumnsToRename,
) {
	return columnsToRename[`${schemaName}.${table}`] ?? [];
}

export function previousColumnName(
	tableName: string,
	schemaName: string,
	changedColumName: string,
	columnsToRename: ColumnsToRename,
) {
	return (
		changedColumnNames(tableName, schemaName, columnsToRename).find(
			(column) => {
				return column.to === changedColumName;
			},
		)?.from || changedColumName
	);
}

export function currentColumName(
	tableName: string,
	schemaName: string,
	previousColumName: string,
	columnsToRename: ColumnsToRename,
) {
	return (
		changedColumnNames(tableName, schemaName, columnsToRename).find(
			(column) => {
				return column.from === previousColumName;
			},
		)?.to || previousColumName
	);
}
