export type ChangeWarning = BackwardIncompatibleChange | DestructiveChange;

export enum ChangeWarningType {
	BackwardIncompatible = "backwardIncompatible",
	Destructive = "destructive",
}

export enum ChangeWarningCode {
	TableRename = "BI001",
	ColumnRename = "BI002",
	SchemaDrop = "D001",
	TableDrop = "D002",
	ColumnDrop = "D003",
}

export type BackwardIncompatibleChange =
	| TableRenameWarning
	| ColumnRenameWarning;

export type TableRenameWarning = {
	type: ChangeWarningType.BackwardIncompatible;
	code: ChangeWarningCode.TableRename;
	schema: string;
	tableRename: { from: string; to: string };
};

export type ColumnRenameWarning = {
	type: ChangeWarningType.BackwardIncompatible;
	code: ChangeWarningCode.ColumnRename;
	schema: string;
	table: string;
	columnRename: { from: string; to: string };
};

export type DestructiveChange =
	| SchemaDropWarning
	| TableDropWarning
	| ColumnDropWarning;

export type SchemaDropWarning = {
	type: ChangeWarningType.Destructive;
	code: ChangeWarningCode.SchemaDrop;
	schema: string;
};

export type TableDropWarning = {
	type: ChangeWarningType.Destructive;
	code: ChangeWarningCode.TableDrop;
	schema: string;
	table: string;
};

export type ColumnDropWarning = {
	type: ChangeWarningType.Destructive;
	code: ChangeWarningCode.ColumnDrop;
	schema: string;
	table: string;
	column: string;
};
