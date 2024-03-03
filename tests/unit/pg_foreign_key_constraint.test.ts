import { describe, expect, test } from "vitest";
import { type PgSerial } from "../../src/database/schema/pg_column.js";
import {
	PgForeignKey,
	pgForeignKey,
} from "../../src/database/schema/pg_foreign_key.js";
import { type PgTable } from "../../src/database/schema/pg_table.js";

describe("PgForeignKeyConstraint", () => {
	test("it can be instantiated with pgForeignKeyConstraint", () => {
		const users = "users" as unknown as PgTable<{ id: PgSerial }>;
		const constraint = pgForeignKey(["user_id"], users, ["id"]);
		expect(constraint).toBeInstanceOf(PgForeignKey);
	});

	test("sets columns", () => {
		const users = "users" as unknown as PgTable<{ id: PgSerial }>;
		const constraint = pgForeignKey(["user_id"], users, ["id"]);
		expect(constraint.columns).toStrictEqual(["user_id"]);
	});

	test("sets targetTable", () => {
		const users = "users" as unknown as PgTable<{ id: PgSerial }>;
		const constraint = pgForeignKey(["user_id"], users, ["id"]);
		expect(constraint.targetTable).toBe("users");
	});

	test("sets targetColumns", () => {
		const users = "users" as unknown as PgTable<{ id: PgSerial }>;
		const constraint = pgForeignKey(["user_id"], users, ["id"]);
		expect(constraint.targetColumns).toStrictEqual(["id"]);
	});

	test("has no action as default for deleteRule", () => {
		const users = "users" as unknown as PgTable<{ id: PgSerial }>;
		const constraint = pgForeignKey(["user_id"], users, ["id"]);
		expect(constraint.options.deleteRule).toBe("NO ACTION");
	});

	test("has no action as default for updateRule", () => {
		const users = "users" as unknown as PgTable<{ id: PgSerial }>;
		const constraint = pgForeignKey(["user_id"], users, ["id"]);
		expect(constraint.options.updateRule).toBe("NO ACTION");
	});

	test("options can be set", () => {
		const users = "users" as unknown as PgTable<{ id: PgSerial }>;
		const constraint = pgForeignKey(["user_id"], users, ["id"], {
			deleteRule: "cascade",
			updateRule: "cascade",
		});
		expect(constraint.options).toStrictEqual({
			deleteRule: "CASCADE",
			updateRule: "CASCADE",
		});
	});
});
