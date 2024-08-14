/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Kysely, sql } from "kysely";
import type { Migration } from "~monolayer/migration.js";

export const migration = {
	name: "20240405T153857-alphard-black",
	scaffold: false,
	transaction: false,
} satisfies Migration;

export async function up(db: Kysely<any>): Promise<void> {
	await sql`CREATE INDEX CONCURRENTLY alphard_black_idx ON alphard_blallck (name);`.execute(
		db,
	);
}

export async function down(db: Kysely<any>): Promise<void> {}
