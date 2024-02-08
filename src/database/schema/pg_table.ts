import type { Insertable, Selectable, Updateable } from "kysely";
import { type Simplify } from "type-fest";
import { PgColumnTypes } from "./pg_column.js";
import type { PgForeignKeyConstraint } from "./pg_foreign_key.js";
import { pgIndex } from "./pg_index.js";
import type { PgPrimaryKeyConstraint } from "./pg_primary_key.js";
import type { PgUniqueConstraint } from "./pg_unique.js";

export type ColumnRecord = Record<string, PgColumnTypes>;

export type Constraints = (
	| PgUniqueConstraint
	| PgForeignKeyConstraint
	| PgPrimaryKeyConstraint
)[];

type TableSchema<T> = {
	columns: T extends ColumnRecord ? T : never;
	constraints?: (
		| PgUniqueConstraint
		| PgForeignKeyConstraint
		| PgPrimaryKeyConstraint
	)[];
	indexes?: pgIndex[];
};

export function pgTable<N extends string, T extends ColumnRecord>(
	name: N,
	schema: TableSchema<T>,
) {
	return new PgTable(name, schema);
}

export class PgTable<N extends string, T extends ColumnRecord> {
	declare infer: Simplify<{
		[K in keyof TableSchema<T>["columns"]]: TableSchema<T>["columns"][K]["_columnType"];
	}>;
	declare inferSelect: Selectable<typeof this.infer>;
	declare inferInsert: Simplify<Insertable<typeof this.infer>>;
	declare inferUpdate: Simplify<Updateable<typeof this.infer>>;

	constructor(
		public name: N,
		public schema: TableSchema<T>,
	) {
		this.schema.indexes = this.schema.indexes || [];
		this.schema.constraints = this.schema.constraints || [];
		this.schema.columns = this.schema.columns || {};
	}

	get columns() {
		return this.schema.columns;
	}

	get indexes() {
		return this.schema.indexes;
	}

	get constraints() {
		return this.schema.constraints;
	}
}
