import { sql } from "kysely";
import { compileIndex } from "tests/__setup__/helpers/indexes.js";
import { describe, expect, test } from "vitest";
import { index } from "~pg/schema/index.js";

describe("pgIndex", () => {
	test("one column", async () => {
		const idx = index(["id"]).ifNotExists();
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			"84f7fd21":
				'create index if not exists "test_table_84f7fd21_monolayer_idx" on "public"."test_table" ("id")',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("multiple columns", async () => {
		const idx = index(["id", "name"]).ifNotExists();
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			f1a23764:
				'create index if not exists "test_table_f1a23764_monolayer_idx" on "public"."test_table" ("id", "name")',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("ifNotExists", async () => {
		const idx = index(["id"]).ifNotExists();
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			"84f7fd21":
				'create index if not exists "test_table_84f7fd21_monolayer_idx" on "public"."test_table" ("id")',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("unique", async () => {
		const idx = index(["id"]).unique();
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			e8f5ecda:
				'create unique index "test_table_e8f5ecda_monolayer_idx" on "public"."test_table" ("id")',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("nullsNotDistinct", async () => {
		const idx = index(["id"]).nullsNotDistinct();
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			"53ec1d71":
				'create index "test_table_53ec1d71_monolayer_idx" on "public"."test_table" ("id") nulls not distinct',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("column and expression", async () => {
		const idx = index(["first_name"]).expression(
			sql`first_name COLLATE "fi_FI"`,
		);
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			"4ac64663":
				'create index "test_table_4ac64663_monolayer_idx" on "public"."test_table" ("first_name", first_name COLLATE "fi_FI")',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("expression", async () => {
		const idx = index().expression(sql`upper(${sql.ref("name")})`);
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			"19a3d7e0":
				'create index "test_table_19a3d7e0_monolayer_idx" on "public"."test_table" (upper("name"))',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("using", async () => {
		const idx = index(["id"]).using("btree");
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			"83683299":
				'create index "test_table_83683299_monolayer_idx" on "public"."test_table" using btree ("id")',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("where comparison", async () => {
		const idx = index(["order_nr"]).where(sql.ref("billed"), "is not", true);
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			"8b9db888":
				'create index "test_table_8b9db888_monolayer_idx" on "public"."test_table" ("order_nr") where "billed" is not true',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("where expression builder", async () => {
		const idx = index(["id"]).where((eb) =>
			eb.and([eb("first_name", "=", "Igal"), eb(sql.ref("age"), ">=", 18)]),
		);

		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			"607d70fb":
				'create index "test_table_607d70fb_monolayer_idx" on "public"."test_table" ("id") where ("first_name" = \'Igal\' and "age" >= 18)',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("where expression", async () => {
		const idx = index(["id"]).where(sql<boolean>`SELECT 1`);
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			be8fd558:
				'create index "test_table_be8fd558_monolayer_idx" on "public"."test_table" ("id") where SELECT 1',
		};
		expect(compiledIndex).toEqual(expected);
	});

	test("multiple where", async () => {
		const idx = index(["id"])
			.where(sql<boolean>`SELECT 1`)
			.where("id", ">", "100")
			.where((eb) =>
				eb.and([eb("first_name", "=", "Igal"), eb(sql.ref("age"), ">=", 18)]),
			);
		const compiledIndex = await compileIndex(idx, "test_table");

		const expected = {
			"6fa4d840":
				'create index "test_table_6fa4d840_monolayer_idx" on "public"."test_table" ("id") where SELECT 1 and "id" > \'100\' and ("first_name" = \'Igal\' and "age" >= 18)',
		};
		expect(compiledIndex).toEqual(expected);
	});
});
