import { indexToInfo } from "~/introspection/indexes.js";
import { triggerInfo } from "~/introspection/triggers.js";
import { uniqueToInfo } from "~/introspection/unique_constraint.js";
import type { PgIndex } from "~/schema/pg_index.js";
import type { PgTrigger } from "~/schema/pg_trigger.js";
import type { PgUnique } from "~/schema/pg_unique.js";
import { kyselyWithEmptyPool } from "~tests/setup/kysely.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function compileIndex(index: PgIndex<any>, tableName: string) {
	const kysely = kyselyWithEmptyPool();
	const opts = {
		enabled: false,
		options: {},
	};
	return indexToInfo(index, tableName, kysely, opts);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function compileUnique(unique: PgUnique<any>, tableName: string) {
	const kysely = kyselyWithEmptyPool();
	return uniqueToInfo(unique, tableName, kysely, {
		enabled: false,
		options: {},
	});
}

export function compileTrigger(
	trigger: PgTrigger,
	triggerName: string,
	tableName: string,
) {
	const kysely = kyselyWithEmptyPool();

	return triggerInfo(trigger, triggerName, tableName, kysely, {
		enabled: false,
		options: {},
	});
}
