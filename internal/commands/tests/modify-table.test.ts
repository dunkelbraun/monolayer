/* eslint-disable max-lines */
import { check } from "@monorepo/pg/schema/check.js";
import { bigserial } from "@monorepo/pg/schema/column/data-types/bigserial.js";
import { varchar } from "@monorepo/pg/schema/column/data-types/character-varying.js";
import { integer } from "@monorepo/pg/schema/column/data-types/integer.js";
import { serial } from "@monorepo/pg/schema/column/data-types/serial.js";
import { text } from "@monorepo/pg/schema/column/data-types/text.js";
import { timestamptz } from "@monorepo/pg/schema/column/data-types/timestamp-with-time-zone.js";
import { timestamp } from "@monorepo/pg/schema/column/data-types/timestamp.js";
import { extension } from "@monorepo/pg/schema/extension.js";
import { foreignKey } from "@monorepo/pg/schema/foreign-key.js";
import { index } from "@monorepo/pg/schema/index.js";
import { primaryKey } from "@monorepo/pg/schema/primary-key.js";
import { schema } from "@monorepo/pg/schema/schema.js";
import { table } from "@monorepo/pg/schema/table.js";
import { trigger } from "@monorepo/pg/schema/trigger.js";
import { unique } from "@monorepo/pg/schema/unique.js";
import { sql } from "kysely";
import { afterEach, beforeEach, describe, test } from "vitest";
import { type DbContext } from "~tests/__setup__/helpers/kysely.js";
import { testChangesetAndMigrations } from "~tests/__setup__/helpers/migration-success.js";
import {
	setUpContext,
	teardownContext,
} from "~tests/__setup__/helpers/test-context.js";

describe("Modify table", () => {
	beforeEach<DbContext>(async (context) => {
		await setUpContext(context);
	});

	afterEach<DbContext>(async (context) => {
		await teardownContext(context);
	});

	describe("primary keys", () => {
		test<DbContext>("add", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addColumn("fullName", "text")
				.execute();

			await context.kysely.schema
				.createTable("books")
				.addColumn("name", "text")
				.execute();

			const users = table({
				columns: {
					fullName: text(),
					name: text(),
				},
				constraints: {
					primaryKey: primaryKey(["fullName", "name"]),
				},
			});

			const books = table({
				columns: {
					name: text().notNull(),
				},
				constraints: {
					primaryKey: primaryKey(["name"]),
				},
			});

			const dbSchema = schema({
				tables: {
					users,
					books,
				},
			});

			const expected = [
				{
					priority: 3011,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "changeColumnNullable",
					phase: "alter",
					warnings: [
						{
							code: "MF005",
							column: "name",
							schema: "public",
							table: "books",
							type: "mightFail",
						},
					],
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("books")
    .addCheckConstraint("temporary_not_null_check_constraint_public_books_name", sql\`"name" IS NOT NULL\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "temporary_not_null_check_constraint_public_books_name"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'alterColumn("name", (col) => col.setNotNull())',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("temporary_not_null_check_constraint_public_books_name")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumnNullable",
					phase: "alter",
					up: [],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("fullName", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumnNullable",
					phase: "alter",
					up: [],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createIndex",
					phase: "alter",
					transaction: false,
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "users_pkey_idx" on "public"."users" ("fullName", "name")\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("users_pkey_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "createIndex",
					phase: "alter",
					transaction: false,
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "books_pkey_idx" on "public"."books" ("name")\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("books_pkey_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4013,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createPrimaryKey",
					phase: "alter",
					warnings: [
						{
							code: "MF001",
							columns: ["fullName", "name"],
							schema: "public",
							table: "users",
							type: "mightFail",
						},
					],
					up: [
						[
							"await sql`${sql.raw(\n" +
								"  db\n" +
								'    .withSchema("public")\n' +
								'    .schema.alterTable("users")\n' +
								'    .addCheckConstraint("fullName_temporary_not_null_check_constraint", sql`"fullName" IS NOT NULL`)\n' +
								"    .compile()\n" +
								'    .sql.concat(" not valid")\n' +
								")}`.execute(db);",
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "fullName_temporary_not_null_check_constraint"`',
							"execute(db);",
						],
						[
							"await sql`${sql.raw(\n" +
								"  db\n" +
								'    .withSchema("public")\n' +
								'    .schema.alterTable("users")\n' +
								'    .addCheckConstraint("name_temporary_not_null_check_constraint", sql`"name" IS NOT NULL`)\n' +
								"    .compile()\n" +
								'    .sql.concat(" not valid")\n' +
								")}`.execute(db);",
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "name_temporary_not_null_check_constraint"`',
							"execute(db);",
						],
						[
							'await sql`alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("fullName_temporary_not_null_check_constraint")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("name_temporary_not_null_check_constraint")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_pkey")',
							"execute();",
						],
					],
				},
				{
					priority: 4013,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "createPrimaryKey",
					phase: "alter",
					warnings: [
						{
							code: "MF001",
							columns: ["name"],
							schema: "public",
							table: "books",
							type: "mightFail",
						},
					],
					up: [
						[
							"await sql`${sql.raw(\n" +
								"  db\n" +
								'    .withSchema("public")\n' +
								'    .schema.alterTable("books")\n' +
								'    .addCheckConstraint("name_temporary_not_null_check_constraint", sql`"name" IS NOT NULL`)\n' +
								"    .compile()\n" +
								'    .sql.concat(" not valid")\n' +
								")}`.execute(db);",
						],
						[
							'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "name_temporary_not_null_check_constraint"`',
							"execute(db);",
						],
						[
							'await sql`alter table "public"."books" add constraint "books_pkey" primary key using index "books_pkey_idx"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("name_temporary_not_null_check_constraint")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_pkey")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("add to notNull column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("name", "text", (col) => col.notNull())
				.execute();

			const books = table({
				columns: {
					name: text().notNull(),
				},
				constraints: {
					primaryKey: primaryKey(["name"]),
				},
			});

			const dbSchema = schema({
				tables: {
					books,
				},
			});

			const expected = [
				{
					priority: 4003,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "createIndex",
					phase: "alter",
					transaction: false,
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "books_pkey_idx" on "public"."books" ("name")\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("books_pkey_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4013,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "createPrimaryKey",
					phase: "alter",
					up: [
						[
							'await sql`alter table "public"."books" add constraint "books_pkey" primary key using index "books_pkey_idx"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_pkey")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("add to new column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("name", "text")
				.execute();

			const books = table({
				columns: {
					id: integer(),
					name: text(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const dbSchema = schema({
				tables: {
					books,
				},
			});

			const expected = [
				{
					currentTableName: "books",
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropColumn("id")',
							"execute();",
						],
					],
					priority: 2003,
					schemaName: "public",
					tableName: "books",
					type: "createColumn",
					phase: "expand",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'addColumn("id", "integer")',
							"execute();",
						],
					],
				},
				{
					currentTableName: "books",
					priority: 3011,
					schemaName: "public",
					tableName: "books",
					type: "changeColumnNullable",
					phase: "expand",
					up: [],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'alterColumn("id", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "createIndex",
					phase: "expand",
					transaction: false,
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "books_pkey_idx" on "public"."books" ("id")\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("books_pkey_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4013,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "createPrimaryKey",
					phase: "expand",
					warnings: [
						{
							code: "MF002",
							columns: ["id"],
							schema: "public",
							table: "books",
							type: "mightFail",
						},
					],
					up: [
						[
							"await sql`${sql.raw(\n" +
								"  db\n" +
								'    .withSchema("public")\n' +
								'    .schema.alterTable("books")\n' +
								'    .addCheckConstraint("id_temporary_not_null_check_constraint", sql`"id" IS NOT NULL`)\n' +
								"    .compile()\n" +
								'    .sql.concat(" not valid")\n' +
								")}`.execute(db);",
						],
						[
							'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "id_temporary_not_null_check_constraint"`',
							"execute(db);",
						],
						[
							'await sql`alter table "public"."books" add constraint "books_pkey" primary key using index "books_pkey_idx"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("id_temporary_not_null_check_constraint")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_pkey")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("drop", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addColumn("fullName", "text")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addPrimaryKeyConstraint("users_pkey", ["name", "fullName"])
				.execute();

			await context.kysely.schema
				.createTable("books")
				.addColumn("name", "text")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_pkey", ["name"])
				.execute();

			const users = table({
				columns: {
					fullName: text(),
					name: text(),
				},
			});

			const books = table({
				columns: {
					name: text(),
				},
			});

			const dbSchema = schema({
				tables: {
					users,
					books,
				},
			});

			const expected = [
				{
					priority: 1004,
					tableName: "books",
					currentTableName: "books",
					schemaName: "public",
					type: "dropPrimaryKey",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_pkey")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'addPrimaryKeyConstraint("books_pkey", ["name"])',
							"execute();",
						],
					],
				},
				{
					priority: 1004,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropPrimaryKey",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_pkey")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addPrimaryKeyConstraint("users_pkey", ["fullName", "name"])',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "changeColumnNullable",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumnNullable",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("fullName", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumnNullable",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("drop with column drop", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addColumn("fullName", "text")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addPrimaryKeyConstraint("users_pkey", ["name", "fullName"])
				.execute();

			await context.kysely.schema
				.createTable("books")
				.addColumn("name", "text")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_pkey", ["name"])
				.execute();

			const users = table({
				columns: {
					name: text(),
				},
			});

			const books = table({
				columns: {},
			});

			const dbSchema = schema({
				tables: {
					users,
					books,
				},
			});

			const expected = [
				{
					priority: 1004,
					tableName: "books",
					currentTableName: "books",
					schemaName: "public",
					type: "dropPrimaryKey",
					phase: "contract",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_pkey")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'addPrimaryKeyConstraint("books_pkey", ["name"])',
							"execute();",
						],
					],
				},
				{
					priority: 1004,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropPrimaryKey",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_pkey")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addPrimaryKeyConstraint("users_pkey", ["fullName", "name"])',
							"execute();",
						],
					],
				},
				{
					currentTableName: "books",
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'addColumn("name", "text", (col) => col.notNull())',
							"execute();",
						],
					],
					phase: "contract",
					priority: 1005,
					schemaName: "public",
					tableName: "books",
					type: "dropColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropColumn("name")',
							"execute();",
						],
					],
					warnings: [
						{
							code: "D003",
							column: "name",
							schema: "public",
							table: "books",
							type: "destructive",
						},
					],
				},
				{
					currentTableName: "users",
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addColumn("fullName", "text", (col) => col.notNull())',
							"execute();",
						],
					],
					phase: "contract",
					priority: 1005,
					schemaName: "public",
					tableName: "users",
					type: "dropColumn",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropColumn("fullName")',
							"execute();",
						],
					],
					warnings: [
						{
							code: "D003",
							column: "fullName",
							schema: "public",
							table: "users",
							type: "destructive",
						},
					],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumnNullable",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("change", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addColumn("fullName", "text")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addPrimaryKeyConstraint("users_pkey", ["name", "fullName"])
				.execute();

			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("description", sql`character varying(255)`, (col) =>
					col.notNull(),
				)
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_pkey", ["description", "id"])
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])
				.execute();

			const books = table({
				columns: {
					id: integer(),
					description: varchar(255).notNull(),
				},
				constraints: {
					primaryKey: primaryKey(["description"]),
					unique: [unique(["id"])],
				},
			});

			const users = table({
				columns: {
					fullName: text(),
					name: text(),
				},
				constraints: {
					primaryKey: primaryKey(["name"]),
				},
			});

			const dbSchema = schema({
				tables: {
					users,
					books,
				},
			});

			const expected = [
				{
					priority: 1004,
					tableName: "books",
					currentTableName: "books",
					schemaName: "public",
					type: "dropPrimaryKey",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_pkey")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'addPrimaryKeyConstraint("books_pkey", ["description", "id"])',
							"execute();",
						],
					],
				},
				{
					priority: 1004,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropPrimaryKey",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_pkey")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addPrimaryKeyConstraint("users_pkey", ["fullName", "name"])',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "changeColumnNullable",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'alterColumn("id", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumnNullable",
					phase: "alter",
					up: [],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumnNullable",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("fullName", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumnNullable",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "createIndex",
					transaction: false,
					phase: "alter",
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "books_pkey_idx" on "public"."books" ("description")\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("books_pkey_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createIndex",
					transaction: false,
					phase: "alter",
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "users_pkey_idx" on "public"."users" ("name")\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("users_pkey_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4013,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "createPrimaryKey",
					phase: "alter",
					up: [
						[
							'await sql`alter table "public"."books" add constraint "books_pkey" primary key using index "books_pkey_idx"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_pkey")',
							"execute();",
						],
					],
				},
				{
					priority: 4013,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createPrimaryKey",
					phase: "alter",
					up: [
						[
							'await sql`alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_pkey")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("change camel case", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addColumn("full_name", "text")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addPrimaryKeyConstraint("users_pkey", ["name", "full_name"])
				.execute();

			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("location_id", sql`character varying(255)`, (col) =>
					col.notNull(),
				)
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_pkey", ["location_id", "id"])
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_acdd8fa3_monolayer_key", ["id"])
				.execute();

			const books = table({
				columns: {
					id: integer(),
					locationId: varchar(255).notNull(),
				},
				constraints: {
					primaryKey: primaryKey(["locationId"]),
					unique: [unique(["id"])],
				},
			});

			const users = table({
				columns: {
					fullName: text(),
					name: text(),
				},
				constraints: {
					primaryKey: primaryKey(["name"]),
				},
			});

			const dbSchema = schema({
				tables: {
					users,
					books,
				},
			});

			const expected = [
				{
					priority: 1004,
					tableName: "books",
					currentTableName: "books",
					schemaName: "public",
					type: "dropPrimaryKey",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_pkey")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'addPrimaryKeyConstraint("books_pkey", ["id", "location_id"])',
							"execute();",
						],
					],
				},
				{
					priority: 1004,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropPrimaryKey",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_pkey")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addPrimaryKeyConstraint("users_pkey", ["full_name", "name"])',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "changeColumnNullable",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'alterColumn("id", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumnNullable",
					phase: "alter",
					up: [],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumnNullable",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("full_name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumnNullable",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "createIndex",
					transaction: false,
					phase: "alter",
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "books_pkey_idx" on "public"."books" ("location_id")\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("books_pkey_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createIndex",
					transaction: false,
					phase: "alter",
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "users_pkey_idx" on "public"."users" ("name")\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("users_pkey_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4013,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "createPrimaryKey",
					phase: "alter",
					up: [
						[
							'await sql`alter table "public"."books" add constraint "books_pkey" primary key using index "books_pkey_idx"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_pkey")',
							"execute();",
						],
					],
				},
				{
					priority: 4013,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createPrimaryKey",
					phase: "alter",
					up: [
						[
							'await sql`alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_pkey")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: {
					id: "default",
					schemas: [dbSchema],
					camelCase: true,
				},
				expected,
				down: "same",
			});
		});

		test<DbContext>("change with column notNull on affected columns does not remove not null constraint", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addColumn("fullName", "text")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addPrimaryKeyConstraint("users_pkey", ["name", "fullName"])
				.execute();

			const users = table({
				columns: {
					fullName: text().notNull(),
					name: text(),
				},
				constraints: {
					primaryKey: primaryKey(["name"]),
				},
			});

			const dbSchema = schema({
				tables: {
					users,
				},
			});

			const expected = [
				{
					priority: 1004,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropPrimaryKey",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_pkey")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addPrimaryKeyConstraint("users_pkey", ["fullName", "name"])',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumnNullable",
					phase: "alter",
					up: [],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumnNullable",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createIndex",
					transaction: false,
					phase: "alter",
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "users_pkey_idx" on "public"."users" ("name")\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("users_pkey_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4013,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createPrimaryKey",
					phase: "alter",
					up: [
						[
							'await sql`alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_pkey")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("change drops not null on affected columns with explicit notNull in new primary key", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("email", "text")
				.addColumn("name", "text")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addPrimaryKeyConstraint("users_pkey", ["name"])
				.execute();

			const users = table({
				columns: {
					name: text(),
					email: text().notNull(),
				},
				constraints: {
					primaryKey: primaryKey(["email"]),
				},
			});

			const dbSchema = schema({
				tables: {
					users,
				},
			});

			const expected = [
				{
					priority: 1004,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropPrimaryKey",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_pkey")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addPrimaryKeyConstraint("users_pkey", ["name"])',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumnNullable",
					phase: "alter",
					warnings: [
						{
							code: "MF005",
							column: "email",
							schema: "public",
							table: "users",
							type: "mightFail",
						},
					],
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addCheckConstraint("temporary_not_null_check_constraint_public_users_email", sql\`"email" IS NOT NULL\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "temporary_not_null_check_constraint_public_users_email"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("email", (col) => col.setNotNull())',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("temporary_not_null_check_constraint_public_users_email")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("email", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "changeColumnNullable",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("name", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createIndex",
					transaction: false,
					phase: "alter",
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "users_pkey_idx" on "public"."users" ("email")\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("users_pkey_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_pkey_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4013,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createPrimaryKey",
					phase: "alter",
					warnings: [
						{
							code: "MF001",
							columns: ["email"],
							schema: "public",
							table: "users",
							type: "mightFail",
						},
					],
					up: [
						[
							"await sql`${sql.raw(\n" +
								"  db\n" +
								'    .withSchema("public")\n' +
								'    .schema.alterTable("users")\n' +
								'    .addCheckConstraint("email_temporary_not_null_check_constraint", sql`"email" IS NOT NULL`)\n' +
								"    .compile()\n" +
								'    .sql.concat(" not valid")\n' +
								")}`.execute(db);",
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "email_temporary_not_null_check_constraint"`',
							"execute(db);",
						],
						[
							'await sql`alter table "public"."users" add constraint "users_pkey" primary key using index "users_pkey_idx"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("email_temporary_not_null_check_constraint")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_pkey")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});
	});

	describe("foreign keys", () => {
		test<DbContext>("add", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_pkey", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("name", "varchar")
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					id: serial(),
					book_id: integer(),
					name: varchar(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["id"], books, ["id"])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					books,
					users,
				},
			});

			const expected = [
				{
					priority: 2003,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createColumn",
					phase: "expand",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addColumn("book_id", "integer")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropColumn("book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 4014,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createForeignKey",
					phase: "alter",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_8abc8e0b_monolayer_fk", ["id"], "public.books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_8abc8e0b_monolayer_fk"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_8abc8e0b_monolayer_fk")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("add with new column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_pkey", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("name", "varchar")
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					id: serial(),
					book_id: integer(),
					name: varchar(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["book_id"], books, ["id"])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					books,
					users,
				},
			});

			const expected = [
				{
					priority: 2003,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createColumn",
					phase: "expand",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addColumn("book_id", "integer")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropColumn("book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 4014,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createForeignKey",
					phase: "expand",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_58e6ca22_monolayer_fk", ["book_id"], "public.books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_58e6ca22_monolayer_fk"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_58e6ca22_monolayer_fk")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("add with new column and existing foreign key", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_pkey", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("name", "varchar")
				.addForeignKeyConstraint(
					"users_8abc8e0b_monolayer_fk",
					["id"],
					"public.books",
					["id"],
					(fk) => fk.onDelete("set null").onUpdate("set null"),
				)
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					id: serial(),
					book_id: integer(),
					name: varchar(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["id"], books, ["id"])
							.updateRule("set null")
							.deleteRule("set null"),
						foreignKey(["book_id"], books, ["id"])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					books,
					users,
				},
			});

			const expected = [
				{
					priority: 2003,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createColumn",
					phase: "expand",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addColumn("book_id", "integer")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropColumn("book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 4014,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createForeignKey",
					phase: "expand",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_58e6ca22_monolayer_fk", ["book_id"], "public.books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_58e6ca22_monolayer_fk"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_58e6ca22_monolayer_fk")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("add multiple", async (context) => {
			await context.kysely.schema
				.createTable("old_books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("old_books")
				.addPrimaryKeyConstraint("old_books_id_pkey", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_pkey", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("name", "varchar")
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const old_books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					id: serial(),
					book_id: integer(),
					second_book_id: integer(),
					name: varchar(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["id"], books, ["id"])
							.updateRule("set null")
							.deleteRule("set null"),
						foreignKey(["second_book_id"], old_books, ["id"])
							.updateRule("set null")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					books,
					old_books,
					users,
				},
			});

			const expected = [
				{
					priority: 2003,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createColumn",
					phase: "expand",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addColumn("book_id", "integer")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropColumn("book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 2003,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createColumn",
					phase: "expand",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addColumn("second_book_id", "integer")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropColumn("second_book_id")',
							"execute();",
						],
					],
				},
				{
					priority: 4014,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createForeignKey",
					phase: "alter",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_8abc8e0b_monolayer_fk", ["id"], "public.books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_8abc8e0b_monolayer_fk"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_8abc8e0b_monolayer_fk")',
							"execute();",
						],
					],
				},
				{
					priority: 4014,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createForeignKey",
					phase: "expand",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_ea23dc14_monolayer_fk", ["second_book_id"], "public.old_books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_ea23dc14_monolayer_fk"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_ea23dc14_monolayer_fk")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("drop", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_pkey", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_58e6ca22_monolayer_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					id: serial(),
					book_id: integer(),
				},
			});

			const dbSchema = schema({
				tables: {
					books,
					users,
				},
			});

			const expected = [
				{
					priority: 810,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropForeignKey",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_58e6ca22_monolayer_fk")',
							"execute();",
						],
					],
					down: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_58e6ca22_monolayer_fk", ["book_id"], "public.books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_58e6ca22_monolayer_fk"`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("drop with column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_pkey", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_58e6ca22_monolayer_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					id: serial(),
					book_id: integer(),
				},
			});

			const dbSchema = schema({
				tables: {
					books,
					users,
				},
			});

			const expected = [
				{
					priority: 810,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropForeignKey",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_58e6ca22_monolayer_fk")',
							"execute();",
						],
					],
					down: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_58e6ca22_monolayer_fk", ["book_id"], "public.books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_58e6ca22_monolayer_fk"`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("drop multiple", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_pkey", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("old_books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("old_books")
				.addPrimaryKeyConstraint("old_books_id_pkey", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("book_id", "integer")
				.addColumn("old_book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_58e6ca22_monolayer_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_8875a5c8_monolayer_fk",
					["old_book_id"],
					"old_books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const old_books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					id: serial(),
					book_id: integer(),
					old_book_id: integer(),
				},
			});

			const dbSchema = schema({
				tables: {
					books,
					old_books,
					users,
				},
			});

			const expected = [
				{
					priority: 810,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropForeignKey",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_58e6ca22_monolayer_fk")',
							"execute();",
						],
					],
					down: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_58e6ca22_monolayer_fk", ["book_id"], "public.books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_58e6ca22_monolayer_fk"`',
							"execute(db);",
						],
					],
				},
				{
					priority: 810,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropForeignKey",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_8875a5c8_monolayer_fk")',
							"execute();",
						],
					],
					down: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_8875a5c8_monolayer_fk", ["old_book_id"], "public.old_books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_8875a5c8_monolayer_fk"`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("replace", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_pkey", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_58e6ca22_monolayer_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					id: serial(),
					book_id: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["id"], books, ["id"])
							.updateRule("cascade")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					books,
					users,
				},
			});

			const expected = [
				{
					priority: 810,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropForeignKey",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_58e6ca22_monolayer_fk")',
							"execute();",
						],
					],
					down: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_58e6ca22_monolayer_fk", ["book_id"], "public.books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_58e6ca22_monolayer_fk"`',
							"execute(db);",
						],
					],
				},
				{
					priority: 4014,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createForeignKey",
					phase: "alter",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_35cf8008_monolayer_fk", ["id"], "public.books", ["id"])
    .onDelete("set null")
    .onUpdate("cascade")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_35cf8008_monolayer_fk"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_35cf8008_monolayer_fk")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("change drops the old and creates a new", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addPrimaryKeyConstraint("books_id_pkey", ["id"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("book_id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addForeignKeyConstraint(
					"users_58e6ca22_monolayer_fk",
					["book_id"],
					"books",
					["id"],
				)
				.onDelete("set null")
				.onUpdate("set null")
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
				},
			});

			const users = table({
				columns: {
					id: serial(),
					book_id: integer(),
				},
				constraints: {
					foreignKeys: [
						foreignKey(["book_id"], books, ["id"])
							.updateRule("cascade")
							.deleteRule("set null"),
					],
				},
			});

			const dbSchema = schema({
				tables: {
					books,
					users,
				},
			});

			const expected = [
				{
					priority: 810,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropForeignKey",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_58e6ca22_monolayer_fk")',
							"execute();",
						],
					],
					down: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_58e6ca22_monolayer_fk", ["book_id"], "public.books", ["id"])
    .onDelete("set null")
    .onUpdate("set null")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_58e6ca22_monolayer_fk"`',
							"execute(db);",
						],
					],
				},
				{
					priority: 4014,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createForeignKey",
					phase: "alter",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addForeignKeyConstraint("users_9fe2ea61_monolayer_fk", ["book_id"], "public.books", ["id"])
    .onDelete("set null")
    .onUpdate("cascade")
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_9fe2ea61_monolayer_fk"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_9fe2ea61_monolayer_fk")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});
	});

	describe("check constraints", () => {
		test<DbContext>("add", async (context) => {
			const firstCheck = check(sql`${sql.ref("id")} > 50`);
			const secondCheck = check(sql`${sql.ref("id")} < 50000`);

			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addCheckConstraint("books_918b4271_monolayer_chk", sql`"id" > 50`)
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					checks: [firstCheck, secondCheck],
				},
			});

			const dbSchema = schema({
				tables: {
					books,
				},
			});

			const expected = [
				{
					priority: 4012,
					tableName: "books",
					currentTableName: "books",
					schemaName: "public",
					type: "createCheckConstraint",
					phase: "alter",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("books")
    .addCheckConstraint("books_e37c55a5_monolayer_chk", sql\`"id" < 50000\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "books_e37c55a5_monolayer_chk"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_e37c55a5_monolayer_chk")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("add with new column", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			const books = table({
				columns: {
					id: integer(),
					count: integer(),
				},
				constraints: {
					checks: [check(sql`${sql.ref("count")} < 50000`)],
				},
			});

			const dbSchema = schema({
				tables: {
					books,
				},
			});

			const expected = [
				{
					currentTableName: "books",
					priority: 2003,
					schemaName: "public",
					tableName: "books",
					type: "createColumn",
					phase: "expand",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'addColumn("count", "integer")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropColumn("count")',
							"execute();",
						],
					],
				},
				{
					priority: 4012,
					tableName: "books",
					currentTableName: "books",
					schemaName: "public",
					type: "createCheckConstraint",
					phase: "alter",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("books")
    .addCheckConstraint("books_a40b9865_monolayer_chk", sql\`"count" < 50000\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "books_a40b9865_monolayer_chk"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_a40b9865_monolayer_chk")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("add multiple", async (context) => {
			const firstCheck = check(sql`${sql.ref("id")} > 50`);
			const secondCheck = check(sql`${sql.ref("id")} < 50000`);

			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					checks: [firstCheck, secondCheck],
				},
			});

			const dbSchema = schema({
				tables: {
					books,
				},
			});

			const expected = [
				{
					priority: 4012,
					tableName: "books",
					currentTableName: "books",
					schemaName: "public",
					type: "createCheckConstraint",
					phase: "alter",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("books")
    .addCheckConstraint("books_918b4271_monolayer_chk", sql\`"id" > 50\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "books_918b4271_monolayer_chk"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_918b4271_monolayer_chk")',
							"execute();",
						],
					],
				},
				{
					priority: 4012,
					tableName: "books",
					currentTableName: "books",
					schemaName: "public",
					type: "createCheckConstraint",
					phase: "alter",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("books")
    .addCheckConstraint("books_e37c55a5_monolayer_chk", sql\`"id" < 50000\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "books_e37c55a5_monolayer_chk"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_e37c55a5_monolayer_chk")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("drop", async (context) => {
			const firstCheck = check(sql`"id" > 5`);

			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addCheckConstraint("books_2f1f415e_monolayer_chk", sql`"id" > 5`)
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addCheckConstraint("books_e37c55a5_monolayer_chk", sql`"id" < 50000`)
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					checks: [firstCheck],
				},
			});

			const dbSchema = schema({
				tables: {
					books,
				},
			});

			const expected = [
				{
					priority: 812,
					tableName: "books",
					currentTableName: "books",
					schemaName: "public",
					type: "dropCheckConstraint",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_e37c55a5_monolayer_chk")',
							"execute();",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."books" ADD CONSTRAINT "books_e37c55a5_monolayer_chk" CHECK ((id < 50000)) NOT VALID`',
							"execute(db);",
						],
						[
							'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "books_e37c55a5_monolayer_chk"`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("drop all", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addCheckConstraint("books_918b4271_monolayer_chk", sql`"id" < 50000`)
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
			});

			const dbSchema = schema({
				tables: {
					books,
				},
			});

			const expected = [
				{
					priority: 812,
					tableName: "books",
					currentTableName: "books",
					schemaName: "public",
					type: "dropCheckConstraint",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_918b4271_monolayer_chk")',
							"execute();",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."books" ADD CONSTRAINT "books_918b4271_monolayer_chk" CHECK ((id < 50000)) NOT VALID`',
							"execute(db);",
						],
						[
							'await sql`ALTER TABLE "public"."books" VALIDATE CONSTRAINT "books_918b4271_monolayer_chk"`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("add across schemas", async (context) => {
			const users = table({
				columns: {
					id: serial(),
				},
				constraints: {
					checks: [check(sql`${sql.ref("id")} > 50`)],
				},
			});

			const dbSchema = schema({
				tables: {
					users,
				},
			});

			const usersSchema = schema({
				name: "users",
				tables: {
					users,
				},
			});

			const expected = [
				{
					priority: 2001,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createTable",
					phase: "expand",
					up: [
						[
							'await db.withSchema("public").schema',
							'createTable("users")',
							'addColumn("id", "serial", (col) => col.notNull())',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropTable("users")',
							"execute();",
						],
					],
				},
				{
					priority: 4012,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createCheckConstraint",
					phase: "expand",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addCheckConstraint("users_918b4271_monolayer_chk", sql\`"id" > 50\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "users_918b4271_monolayer_chk"`',
							"execute(db);",
						],
					],
					down: [[]],
				},
				{
					priority: 0,
					tableName: "none",
					currentTableName: "none",
					schemaName: "users",
					type: "createSchema",
					phase: "expand",
					up: [
						['await sql`CREATE SCHEMA IF NOT EXISTS "users";`', "execute(db);"],
						[
							"await sql`COMMENT ON SCHEMA \"users\" IS 'monolayer'`",
							"execute(db);",
						],
					],
					down: [['await sql`DROP SCHEMA IF EXISTS "users";`', "execute(db);"]],
				},
				{
					priority: 2001,
					tableName: "users",
					currentTableName: "users",
					schemaName: "users",
					type: "createTable",
					phase: "expand",
					up: [
						[
							'await db.withSchema("users").schema',
							'createTable("users")',
							'addColumn("id", "serial", (col) => col.notNull())',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("users").schema',
							'dropTable("users")',
							"execute();",
						],
					],
				},
				{
					priority: 4012,
					tableName: "users",
					currentTableName: "users",
					schemaName: "users",
					type: "createCheckConstraint",
					phase: "expand",
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("users")
    .schema.alterTable("users")
    .addCheckConstraint("users_918b4271_monolayer_chk", sql\`"id" > 50\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "users"."users" VALIDATE CONSTRAINT "users_918b4271_monolayer_chk"`',
							"execute(db);",
						],
					],
					down: [[]],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema, usersSchema] },
				expected,
				down: "same",
			});
		});
	});

	describe("unique constraints", () => {
		test<DbContext>("add unique constraints", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("name", "varchar")
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("fullName", "varchar")
				.execute();

			const books = table({
				columns: {
					id: integer(),
					name: varchar(),
				},
				constraints: {
					unique: [unique(["id"]).nullsNotDistinct(), unique(["name"])],
				},
			});

			const users = table({
				columns: {
					id: serial(),
					fullName: varchar(),
				},
				constraints: {
					unique: [unique(["id", "fullName"])],
				},
			});

			const dbSchema = schema({
				tables: {
					books,
					users,
				},
			});

			const expected = [
				{
					priority: 4003,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "createIndex",
					transaction: false,
					phase: "alter",
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "books_a91945e0_monolayer_key_monolayer_uc_idx" on "public"."books" ("id") nulls not distinct\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("books_a91945e0_monolayer_key_monolayer_uc_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_a91945e0_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "createIndex",
					transaction: false,
					phase: "alter",
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "books_adbefd84_monolayer_key_monolayer_uc_idx" on "public"."books" ("name") \')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("books_adbefd84_monolayer_key_monolayer_uc_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_adbefd84_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createIndex",
					transaction: false,
					phase: "alter",
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "users_83137b76_monolayer_key_monolayer_uc_idx" on "public"."users" ("fullName", "id") \')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("users_83137b76_monolayer_key_monolayer_uc_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_83137b76_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4010,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "createUniqueConstraint",
					phase: "alter",
					warnings: [
						{
							code: "MF003",
							columns: ["id"],
							schema: "public",
							table: "books",
							type: "mightFail",
						},
					],
					up: [
						[
							'await sql`alter table "public"."books" add constraint "books_a91945e0_monolayer_key" unique using index "books_a91945e0_monolayer_key_monolayer_uc_idx"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_a91945e0_monolayer_key")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_a91945e0_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4010,
					schemaName: "public",
					tableName: "books",
					currentTableName: "books",
					type: "createUniqueConstraint",
					phase: "alter",
					warnings: [
						{
							code: "MF003",
							columns: ["name"],
							schema: "public",
							table: "books",
							type: "mightFail",
						},
					],
					up: [
						[
							'await sql`alter table "public"."books" add constraint "books_adbefd84_monolayer_key" unique using index "books_adbefd84_monolayer_key_monolayer_uc_idx"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_adbefd84_monolayer_key")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_adbefd84_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4010,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createUniqueConstraint",
					phase: "alter",
					warnings: [
						{
							code: "MF003",
							columns: ["fullName", "id"],
							schema: "public",
							table: "users",
							type: "mightFail",
						},
					],
					up: [
						[
							'await sql`alter table "public"."users" add constraint "users_83137b76_monolayer_key" unique using index "users_83137b76_monolayer_key_monolayer_uc_idx"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_83137b76_monolayer_key")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_83137b76_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("remove unique constraints", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.addColumn("name", "varchar")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_a91945e0_monolayer_key", ["id"], (uc) =>
					uc.nullsNotDistinct(),
				)
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_adbefd84_monolayer_key", ["name"])
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("fullName", "varchar")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addUniqueConstraint("users_83137b76_monolayer_key", ["id", "fullName"])
				.execute();

			const books = table({
				columns: {
					id: integer(),
					name: varchar(),
				},
			});

			const users = table({
				columns: {
					id: serial(),
					fullName: varchar(),
				},
				constraints: {
					unique: [unique(["fullName", "id"])],
				},
			});

			const dbSchema = schema({
				tables: {
					books,
					users,
				},
			});

			const expected = [
				{
					priority: 811,
					tableName: "books",
					currentTableName: "books",
					schemaName: "public",
					type: "dropUniqueConstraint",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_a91945e0_monolayer_key")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_a91945e0_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'addUniqueConstraint("books_a91945e0_monolayer_key", ["id"], (col) => col.nullsNotDistinct())',
							"execute();",
						],
					],
				},
				{
					priority: 811,
					tableName: "books",
					currentTableName: "books",
					schemaName: "public",
					type: "dropUniqueConstraint",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'dropConstraint("books_adbefd84_monolayer_key")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("books_adbefd84_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("books")',
							'addUniqueConstraint("books_adbefd84_monolayer_key", ["name"])',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("replace unique constraints", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_a91945e0_monolayer_key", ["id"], (uc) =>
					uc.nullsNotDistinct(),
				)
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("fullName", "varchar")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addUniqueConstraint("users_83137b76_monolayer_key", ["id", "fullName"])
				.execute();

			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					unique: [unique(["id"]).nullsNotDistinct()],
				},
			});

			const users = table({
				columns: {
					id: serial(),
					fullName: varchar(),
				},
				constraints: {
					unique: [unique(["id"])],
				},
			});

			const dbSchema = schema({
				tables: {
					books,
					users,
				},
			});

			const expected = [
				{
					priority: 811,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropUniqueConstraint",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_83137b76_monolayer_key")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_83137b76_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addUniqueConstraint("users_83137b76_monolayer_key", ["fullName", "id"])',
							"execute();",
						],
					],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createIndex",
					transaction: false,
					phase: "alter",
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "users_acdd8fa3_monolayer_key_monolayer_uc_idx" on "public"."users" ("id") \')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("users_acdd8fa3_monolayer_key_monolayer_uc_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_acdd8fa3_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4010,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createUniqueConstraint",
					phase: "alter",
					warnings: [
						{
							code: "MF003",
							columns: ["id"],
							schema: "public",
							table: "users",
							type: "mightFail",
						},
					],
					up: [
						[
							'await sql`alter table "public"."users" add constraint "users_acdd8fa3_monolayer_key" unique using index "users_acdd8fa3_monolayer_key_monolayer_uc_idx"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_acdd8fa3_monolayer_key")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_acdd8fa3_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("change unique constraints", async (context) => {
			await context.kysely.schema
				.createTable("books")
				.addColumn("id", "integer")
				.execute();

			await context.kysely.schema
				.alterTable("books")
				.addUniqueConstraint("books_a91945e0_monolayer_key", ["id"], (uc) =>
					uc.nullsNotDistinct(),
				)
				.execute();

			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "serial")
				.addColumn("fullName", "varchar")
				.execute();

			await context.kysely.schema
				.alterTable("users")
				.addUniqueConstraint("users_83137b76_monolayer_key", ["id", "fullName"])
				.execute();
			// users_fbf55213_monolayer_key
			const books = table({
				columns: {
					id: integer(),
				},
				constraints: {
					unique: [unique(["id"]).nullsNotDistinct()],
				},
			});

			const users = table({
				columns: {
					id: serial(),
					fullName: varchar(),
				},
				constraints: {
					unique: [unique(["id", "fullName"]).nullsNotDistinct()],
				},
			});

			const dbSchema = schema({
				tables: {
					books,
					users,
				},
			});

			const expected = [
				{
					priority: 811,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropUniqueConstraint",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_83137b76_monolayer_key")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_83137b76_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addUniqueConstraint("users_83137b76_monolayer_key", ["fullName", "id"])',
							"execute();",
						],
					],
				},
				{
					priority: 4003,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createIndex",
					phase: "alter",
					transaction: false,
					up: [
						[
							"try {\n" +
								'    await sql`${sql.raw(\'create unique index concurrently "users_fbf55213_monolayer_key_monolayer_uc_idx" on "public"."users" ("fullName", "id") nulls not distinct\')}`.execute(db);\n' +
								"  }\n" +
								"  catch (error: any) {\n" +
								"    if (error.code === '23505') {\n" +
								'      await db.withSchema("public").schema.dropIndex("users_fbf55213_monolayer_key_monolayer_uc_idx").ifExists().execute();\n' +
								"    }\n" +
								"    throw error;\n" +
								"  }",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_fbf55213_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
				{
					priority: 4010,
					schemaName: "public",
					tableName: "users",
					currentTableName: "users",
					type: "createUniqueConstraint",
					phase: "alter",
					warnings: [
						{
							code: "MF003",
							columns: ["fullName", "id"],
							schema: "public",
							table: "users",
							type: "mightFail",
						},
					],
					up: [
						[
							'await sql`alter table "public"."users" add constraint "users_fbf55213_monolayer_key" unique using index "users_fbf55213_monolayer_key_monolayer_uc_idx"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("users_fbf55213_monolayer_key")',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_fbf55213_monolayer_key_monolayer_uc_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
			];
			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("unique constraints across schemas", async (context) => {
			const users = table({
				columns: {
					id: serial(),
					email: varchar(255).notNull(),
				},
				constraints: {
					primaryKey: primaryKey(["id"]),
					unique: [unique(["email"])],
				},
			});

			const dbSchema = schema({
				tables: {
					users,
				},
			});

			const usersSchema = schema({
				name: "users",
				tables: {
					users,
				},
			});

			const expected = [
				{
					priority: 2001,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createTable",
					phase: "expand",
					up: [
						[
							'await db.withSchema("public").schema',
							'createTable("users")',
							'addColumn("id", "serial", (col) => col.notNull())',
							'addColumn("email", sql`character varying(255)`, (col) => col.notNull())',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropTable("users")',
							"execute();",
						],
					],
				},
				{
					priority: 4010,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createUniqueConstraint",
					phase: "expand",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addUniqueConstraint("users_f368ca51_monolayer_key", ["email"])',
							"execute();",
						],
					],
					down: [[]],
				},
				{
					priority: 4013,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createPrimaryKey",
					phase: "expand",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addPrimaryKeyConstraint("users_pkey", ["id"])',
							"execute();",
						],
					],
					down: [[]],
				},
				{
					priority: 0,
					tableName: "none",
					currentTableName: "none",
					schemaName: "users",
					type: "createSchema",
					phase: "expand",
					up: [
						['await sql`CREATE SCHEMA IF NOT EXISTS "users";`', "execute(db);"],
						[
							"await sql`COMMENT ON SCHEMA \"users\" IS 'monolayer'`",
							"execute(db);",
						],
					],
					down: [['await sql`DROP SCHEMA IF EXISTS "users";`', "execute(db);"]],
				},
				{
					priority: 2001,
					tableName: "users",
					currentTableName: "users",
					schemaName: "users",
					type: "createTable",
					phase: "expand",
					up: [
						[
							'await db.withSchema("users").schema',
							'createTable("users")',
							'addColumn("id", "serial", (col) => col.notNull())',
							'addColumn("email", sql`character varying(255)`, (col) => col.notNull())',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("users").schema',
							'dropTable("users")',
							"execute();",
						],
					],
				},
				{
					priority: 4010,
					tableName: "users",
					currentTableName: "users",
					schemaName: "users",
					type: "createUniqueConstraint",
					phase: "expand",
					up: [
						[
							'await db.withSchema("users").schema',
							'alterTable("users")',
							'addUniqueConstraint("users_f368ca51_monolayer_key", ["email"])',
							"execute();",
						],
					],
					down: [[]],
				},
				{
					priority: 4013,
					tableName: "users",
					currentTableName: "users",
					schemaName: "users",
					type: "createPrimaryKey",
					phase: "expand",
					up: [
						[
							'await db.withSchema("users").schema',
							'alterTable("users")',
							'addPrimaryKeyConstraint("users_pkey", ["id"])',
							"execute();",
						],
					],
					down: [[]],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema, usersSchema] },
				expected,
				down: "same",
			});
		});
	});

	describe("indexes", () => {
		test<DbContext>("add indexes", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addColumn("fullName", "text")
				.execute();

			await context.kysely.schema
				.createIndex("users_3cf2733f_monolayer_idx")
				.on("users")
				.column("fullName")
				.execute();

			const users = table({
				columns: {
					fullName: text(),
					name: text(),
				},
				indexes: [index(["fullName"]), index(["name"])],
			});

			const dbSchema = schema({
				tables: {
					users,
				},
			});

			const expected = [
				{
					priority: 4003,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createIndex",
					transaction: false,
					phase: "expand",
					up: [
						[
							`try {
    await sql\`\${sql.raw('create index concurrently "users_e42f0227_monolayer_idx" on "public"."users" ("name")')}\`.execute(db);
  }
  catch (error: any) {
    if (error.code === '23505') {
      await db.withSchema("public").schema.dropIndex("users_e42f0227_monolayer_idx").ifExists().execute();
    }
    throw error;
  }`,
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_e42f0227_monolayer_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("remove indexes", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addColumn("fullName", "text")
				.execute();

			await context.kysely.schema
				.createIndex("users_3cf2733f_monolayer_idx")
				.on("users")
				.column("fullName")
				.execute();

			await context.kysely.schema
				.createIndex("users_e42f0227_monolayer_idx")
				.on("users")
				.column("name")
				.execute();

			const users = table({
				columns: {
					fullName: text(),
					name: text(),
				},
				indexes: [index(["name"])],
			});

			const dbSchema = schema({
				tables: {
					users,
				},
			});

			const expected = [
				{
					priority: 800,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropIndex",
					transaction: false,
					phase: "contract",
					up: [
						[
							'await sql`DROP INDEX CONCURRENTLY IF EXISTS "public"."users_3cf2733f_monolayer_idx"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`CREATE INDEX users_3cf2733f_monolayer_idx ON public.users USING btree ("fullName")`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("add and remove indexes", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addColumn("fullName", "text")
				.execute();

			await context.kysely.schema
				.createIndex("users_3cf2733f_monolayer_idx")
				.on("users")
				.column("fullName")
				.execute();

			await context.kysely.schema
				.createIndex("users_e42f0227_monolayer_idx")
				.on("users")
				.column("name")
				.execute();

			const users = table({
				columns: {
					fullName: text(),
					name: text(),
				},
				indexes: [index(["name"]), index(["name", "fullName"])],
			});

			const dbSchema = schema({
				tables: {
					users,
				},
			});

			const expected = [
				{
					priority: 800,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropIndex",
					phase: "contract",
					transaction: false,
					up: [
						[
							'await sql`DROP INDEX CONCURRENTLY IF EXISTS "public"."users_3cf2733f_monolayer_idx"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`CREATE INDEX users_3cf2733f_monolayer_idx ON public.users USING btree ("fullName")`',
							"execute(db);",
						],
					],
				},
				{
					priority: 4003,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createIndex",
					phase: "expand",
					transaction: false,
					up: [
						[
							`try {
    await sql\`\${sql.raw('create index concurrently "users_2d87ba04_monolayer_idx" on "public"."users" ("name", "fullName")')}\`.execute(db);
  }
  catch (error: any) {
    if (error.code === '23505') {
      await db.withSchema("public").schema.dropIndex("users_2d87ba04_monolayer_idx").ifExists().execute();
    }
    throw error;
  }`,
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_2d87ba04_monolayer_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("change index", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("name", "text")
				.addColumn("fullName", "text")
				.execute();

			await context.kysely.schema
				.createIndex("users_3cf2733f_monolayer_idx")
				.on("users")
				.column("fullName")
				.execute();

			await context.kysely.schema
				.createIndex("users_e42f0227_monolayer_idx")
				.on("users")
				.column("name")
				.execute();

			const users = table({
				columns: {
					fullName: text(),
					name: text(),
				},
				indexes: [index(["name"]), index(["fullName"]).unique()],
			});

			const dbSchema = schema({
				tables: {
					users,
				},
			});

			const expected = [
				{
					priority: 800,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropIndex",
					phase: "contract",
					transaction: false,
					up: [
						[
							'await sql`DROP INDEX CONCURRENTLY IF EXISTS "public"."users_3cf2733f_monolayer_idx"`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`CREATE INDEX users_3cf2733f_monolayer_idx ON public.users USING btree ("fullName")`',
							"execute(db);",
						],
					],
				},
				{
					priority: 4003,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createIndex",
					phase: "expand",
					transaction: false,
					up: [
						[
							`try {
    await sql\`\${sql.raw('create unique index concurrently "users_861127a4_monolayer_idx" on "public"."users" ("fullName")')}\`.execute(db);
  }
  catch (error: any) {
    if (error.code === '23505') {
      await db.withSchema("public").schema.dropIndex("users_861127a4_monolayer_idx").ifExists().execute();
    }
    throw error;
  }`,
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'dropIndex("users_861127a4_monolayer_idx")',
							"ifExists()",
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});
	});

	describe("triggers", () => {
		test<DbContext>("add trigger", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("updatedAt", "timestamp", (col) =>
					col.defaultTo(sql`CURRENT_TIMESTAMP`),
				)
				.execute();

			await sql`COMMENT ON COLUMN "users"."updatedAt" IS '9ff7b5b7'`.execute(
				context.kysely,
			);

			const users = table({
				columns: {
					id: integer(),
					updatedAt: timestamp().default(sql`CURRENT_TIMESTAMP`),
				},
				triggers: [
					trigger({
						fireWhen: "before",
						events: ["update"],
						forEach: "row",
						function: {
							name: "moddatetime",
							args: [sql.ref("updatedAt")],
						},
					}),
					trigger({
						fireWhen: "after",
						events: ["update"],
						forEach: "row",
						function: {
							name: "moddatetime",
							args: [sql.ref("updatedAt")],
						},
					}),
				],
			});

			const dbSchema = schema({
				tables: {
					users,
				},
			});

			const expected = [
				{
					priority: 1,
					tableName: "none",
					currentTableName: "none",
					schemaName: null,
					type: "createExtension",
					phase: "expand",
					up: [
						[
							"await sql`CREATE EXTENSION IF NOT EXISTS moddatetime;`",
							"execute(db);",
						],
					],
					down: [
						[
							"await sql`DROP EXTENSION IF EXISTS moddatetime;`",
							"execute(db);",
						],
					],
				},
				{
					priority: 4004,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createTrigger",
					phase: "expand",
					up: [
						[
							`await sql\`CREATE OR REPLACE TRIGGER users_8659ae36_monolayer_trg
BEFORE UPDATE ON "public"."users"
FOR EACH ROW
EXECUTE FUNCTION moddatetime("updatedAt")\``,
							`execute(db);`,
						],
					],
					down: [
						[
							'await sql`DROP TRIGGER users_8659ae36_monolayer_trg ON "public"."users"`',
							"execute(db);",
						],
					],
				},
				{
					priority: 4004,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createTrigger",
					phase: "expand",
					up: [
						[
							`await sql\`CREATE OR REPLACE TRIGGER users_cd708de3_monolayer_trg
AFTER UPDATE ON "public"."users"
FOR EACH ROW
EXECUTE FUNCTION moddatetime("updatedAt")\``,
							`execute(db);`,
						],
					],
					down: [
						[
							'await sql`DROP TRIGGER users_cd708de3_monolayer_trg ON "public"."users"`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: {
					id: "default",
					schemas: [dbSchema],
					extensions: [extension("moddatetime")],
				},
				expected,
				down: "same",
			});
		});

		test<DbContext>("drop trigger", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("updatedAt", "timestamp", (col) => col.defaultTo(sql`now()`))
				.execute();

			await sql`COMMENT ON COLUMN "users"."updatedAt" IS '28a4dae0'`.execute(
				context.kysely,
			);

			await sql`CREATE EXTENSION IF NOT EXISTS moddatetime;`.execute(
				context.kysely,
			);

			await sql`CREATE OR REPLACE TRIGGER users_c2304485_monolayer_trg
									BEFORE UPDATE ON users
									FOR EACH ROW
									EXECUTE FUNCTION moddatetime(updatedAt);`.execute(context.kysely);

			await sql`CREATE OR REPLACE TRIGGER users_9463c7cd_monolayer_trg
									AFTER UPDATE ON users
									FOR EACH ROW
									EXECUTE FUNCTION moddatetime(updatedAt);`.execute(context.kysely);

			const users = table({
				columns: {
					id: integer(),
					updatedAt: timestamp().default(sql`now()`),
				},
			});

			const dbSchema = schema({
				tables: {
					users,
				},
			});

			const expected = [
				{
					priority: 1001,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropTrigger",
					phase: "contract",
					up: [
						[
							'await sql`DROP TRIGGER users_c2304485_monolayer_trg ON "public"."users"`',
							"execute(db);",
						],
					],
					down: [
						[
							"await sql`CREATE OR REPLACE TRIGGER users_c2304485_monolayer_trg BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION moddatetime('updatedat')`",
							"execute(db);",
						],
					],
					warnings: [
						{
							code: "D004",
							schema: "public",
							table: "users",
							type: "destructive",
						},
					],
				},
				{
					priority: 1001,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropTrigger",
					phase: "contract",
					up: [
						[
							'await sql`DROP TRIGGER users_9463c7cd_monolayer_trg ON "public"."users"`',
							"execute(db);",
						],
					],
					down: [
						[
							"await sql`CREATE OR REPLACE TRIGGER users_9463c7cd_monolayer_trg AFTER UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION moddatetime('updatedat')`",
							"execute(db);",
						],
					],
					warnings: [
						{
							code: "D004",
							schema: "public",
							table: "users",
							type: "destructive",
						},
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: {
					id: "default",
					schemas: [dbSchema],
					extensions: [extension("moddatetime")],
				},
				expected,
				down: "reverse",
			});
		});

		test<DbContext>("change trigger", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("updatedAt", "timestamp", (col) => col.defaultTo(sql`now()`))
				.execute();

			await sql`COMMENT ON COLUMN "users"."updatedAt" IS '28a4dae0'`.execute(
				context.kysely,
			);

			await sql`CREATE EXTENSION IF NOT EXISTS moddatetime;`.execute(
				context.kysely,
			);

			await sql`CREATE OR REPLACE TRIGGER users_c2304485_monolayer_trg
									BEFORE UPDATE ON users
									FOR EACH ROW
									EXECUTE FUNCTION moddatetime(updatedAt);`.execute(context.kysely);

			const users = table({
				columns: {
					id: integer(),
					updatedAt: timestamp().default(sql`now()`),
				},
				triggers: [
					trigger({
						fireWhen: "after",
						events: ["update"],
						forEach: "row",
						function: {
							name: "moddatetime",
							args: [sql.ref("updatedAt")],
						},
					}),
				],
			});

			const dbSchema = schema({
				tables: {
					users,
				},
			});

			const expected = [
				{
					down: [
						[
							"await sql`CREATE OR REPLACE TRIGGER users_c2304485_monolayer_trg BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION moddatetime('updatedat')`",
							"execute(db);",
						],
					],
					priority: 1001,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropTrigger",
					phase: "contract",
					up: [
						[
							'await sql`DROP TRIGGER users_c2304485_monolayer_trg ON "public"."users"`',
							"execute(db);",
						],
					],
					warnings: [
						{
							code: "D004",
							schema: "public",
							table: "users",
							type: "destructive",
						},
					],
				},
				{
					priority: 4004,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createTrigger",
					phase: "expand",
					up: [
						[
							`await sql\`CREATE OR REPLACE TRIGGER users_cd708de3_monolayer_trg
AFTER UPDATE ON "public"."users"
FOR EACH ROW
EXECUTE FUNCTION moddatetime("updatedAt")\``,
							`execute(db);`,
						],
					],
					down: [
						[
							'await sql`DROP TRIGGER users_cd708de3_monolayer_trg ON "public"."users"`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: {
					id: "default",
					schemas: [dbSchema],
					extensions: [extension("moddatetime")],
				},
				expected,
				down: "same",
			});
		});
	});

	describe("identity columns", () => {
		test<DbContext>("add", async (context) => {
			await context.kysely.schema.createTable("users").execute();

			const dbSchema = schema({
				tables: {
					users: table({
						columns: {
							id: integer().generatedAlwaysAsIdentity(),
							count: integer().generatedByDefaultAsIdentity(),
						},
					}),
				},
			});

			const expected = [
				{
					priority: 2003,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createNonNullableColumn",
					phase: "expand",
					warnings: [
						{
							code: "MF004",
							column: "id",
							schema: "public",
							table: "users",
							type: "mightFail",
						},
					],
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addColumn("id", "integer", (col) => col.generatedAlwaysAsIdentity())',
							"execute();",
						],
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addCheckConstraint("temporary_not_null_check_constraint_public_users_id", sql\`"id" IS NOT NULL\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "temporary_not_null_check_constraint_public_users_id"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("id", (col) => col.setNotNull())',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("temporary_not_null_check_constraint_public_users_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropColumn("id")',
							"execute();",
						],
					],
				},
				{
					priority: 2003,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "createNonNullableColumn",
					phase: "expand",
					warnings: [
						{
							code: "MF004",
							column: "count",
							schema: "public",
							table: "users",
							type: "mightFail",
						},
					],
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addColumn("count", "integer", (col) => col.generatedByDefaultAsIdentity())',
							"execute();",
						],
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addCheckConstraint("temporary_not_null_check_constraint_public_users_count", sql\`"count" IS NOT NULL\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "temporary_not_null_check_constraint_public_users_count"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("count", (col) => col.setNotNull())',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("temporary_not_null_check_constraint_public_users_count")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropColumn("count")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("remove", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer", (col) =>
					col.notNull().generatedAlwaysAsIdentity(),
				)
				.addColumn("count", "integer", (col) =>
					col.notNull().generatedByDefaultAsIdentity(),
				)
				.execute();

			const dbSchema = schema({
				tables: {
					users: table({
						columns: {},
					}),
				},
			});

			const expected = [
				{
					priority: 1005,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropColumn",
					phase: "contract",
					warnings: [
						{
							code: "D003",
							column: "count",
							schema: "public",
							table: "users",
							type: "destructive",
						},
					],
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropColumn("count")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addColumn("count", "integer", (col) => col.notNull().generatedByDefaultAsIdentity())',
							"execute();",
						],
					],
				},
				{
					priority: 1005,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "dropColumn",
					phase: "contract",
					warnings: [
						{
							code: "D003",
							column: "id",
							schema: "public",
							table: "users",
							type: "destructive",
						},
					],
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropColumn("id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'addColumn("id", "integer", (col) => col.notNull().generatedAlwaysAsIdentity())',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("change into", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer")
				.addColumn("count", "integer")
				.execute();

			const dbSchema = schema({
				tables: {
					users: table({
						columns: {
							id: integer().generatedAlwaysAsIdentity(),
							count: integer().generatedByDefaultAsIdentity(),
						},
					}),
				},
			});

			const expected = [
				{
					priority: 3011,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "changeColumnNullable",
					phase: "alter",
					warnings: [
						{
							code: "MF005",
							column: "count",
							schema: "public",
							table: "users",
							type: "mightFail",
						},
					],
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addCheckConstraint("temporary_not_null_check_constraint_public_users_count", sql\`"count" IS NOT NULL\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "temporary_not_null_check_constraint_public_users_count"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("count", (col) => col.setNotNull())',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("temporary_not_null_check_constraint_public_users_count")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("count", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "changeColumnNullable",
					phase: "alter",
					warnings: [
						{
							code: "MF005",
							column: "id",
							schema: "public",
							table: "users",
							type: "mightFail",
						},
					],
					up: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addCheckConstraint("temporary_not_null_check_constraint_public_users_id", sql\`"id" IS NOT NULL\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "temporary_not_null_check_constraint_public_users_id"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("id", (col) => col.setNotNull())',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("temporary_not_null_check_constraint_public_users_id")',
							"execute();",
						],
					],
					down: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("id", (col) => col.dropNotNull())',
							"execute();",
						],
					],
				},
				{
					priority: 3012,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "changeColumnGeneration",
					phase: "alter",
					up: [
						[
							'await sql`ALTER TABLE "public"."users" ALTER COLUMN "count" ADD GENERATED BY DEFAULT AS IDENTITY`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."users" ALTER COLUMN "count" DROP IDENTITY`',
							"execute(db);",
						],
					],
				},
				{
					priority: 3012,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "changeColumnGeneration",
					phase: "alter",
					up: [
						[
							'await sql`ALTER TABLE "public"."users" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."users" ALTER COLUMN "id" DROP IDENTITY`',
							"execute(db);",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});

		test<DbContext>("change from", async (context) => {
			await context.kysely.schema
				.createTable("users")
				.addColumn("id", "integer", (col) =>
					col.notNull().generatedAlwaysAsIdentity(),
				)
				.addColumn("count", "integer", (col) =>
					col.notNull().generatedByDefaultAsIdentity(),
				)
				.execute();

			const dbSchema = schema({
				tables: {
					users: table({
						columns: {
							id: integer(),
							count: integer(),
						},
					}),
				},
			});

			const expected = [
				{
					priority: 3004,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "changeColumnGeneration",
					phase: "alter",
					up: [
						[
							'await sql`ALTER TABLE "public"."users" ALTER COLUMN "count" DROP IDENTITY`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."users" ALTER COLUMN "count" ADD GENERATED BY DEFAULT AS IDENTITY`',
							"execute(db);",
						],
					],
				},
				{
					priority: 3004,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "changeColumnGeneration",
					phase: "alter",
					up: [
						[
							'await sql`ALTER TABLE "public"."users" ALTER COLUMN "id" DROP IDENTITY`',
							"execute(db);",
						],
					],
					down: [
						[
							'await sql`ALTER TABLE "public"."users" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY`',
							"execute(db);",
						],
					],
				},
				{
					priority: 3011,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "changeColumnNullable",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("count", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addCheckConstraint("temporary_not_null_check_constraint_public_users_count", sql\`"count" IS NOT NULL\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "temporary_not_null_check_constraint_public_users_count"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("count", (col) => col.setNotNull())',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("temporary_not_null_check_constraint_public_users_count")',
							"execute();",
						],
					],
				},
				{
					priority: 3011,
					tableName: "users",
					currentTableName: "users",
					schemaName: "public",
					type: "changeColumnNullable",
					phase: "alter",
					up: [
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("id", (col) => col.dropNotNull())',
							"execute();",
						],
					],
					down: [
						[
							`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addCheckConstraint("temporary_not_null_check_constraint_public_users_id", sql\`"id" IS NOT NULL\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
						],
						[
							'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "temporary_not_null_check_constraint_public_users_id"`',
							"execute(db);",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'alterColumn("id", (col) => col.setNotNull())',
							"execute();",
						],
						[
							'await db.withSchema("public").schema',
							'alterTable("users")',
							'dropConstraint("temporary_not_null_check_constraint_public_users_id")',
							"execute();",
						],
					],
				},
			];

			await testChangesetAndMigrations({
				context,
				configuration: { id: "default", schemas: [dbSchema] },
				expected,
				down: "same",
			});
		});
	});

	test<DbContext>("add serial and bigserial columns", async (context) => {
		await context.kysely.schema
			.createTable("users")
			.addColumn("count", "integer")
			.execute();

		const dbSchema = schema({
			tables: {
				users: table({
					columns: {
						id: serial(),
						second_id: bigserial(),
						count: integer(),
					},
				}),
			},
		});

		const expected = [
			{
				priority: 2003,
				schemaName: "public",
				tableName: "users",
				currentTableName: "users",
				type: "createNonNullableColumn",
				phase: "expand",
				warnings: [
					{
						code: "B003",
						column: "id",
						schema: "public",
						table: "users",
						type: "blocking",
					},
					{
						code: "MF004",
						column: "id",
						schema: "public",
						table: "users",
						type: "mightFail",
					},
				],
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("id", "serial")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("id")',
						"execute();",
					],
				],
			},
			{
				priority: 2003,
				schemaName: "public",
				tableName: "users",
				currentTableName: "users",
				type: "createNonNullableColumn",
				phase: "expand",
				warnings: [
					{
						code: "B004",
						column: "second_id",
						schema: "public",
						table: "users",
						type: "blocking",
					},
					{
						code: "MF004",
						column: "second_id",
						schema: "public",
						table: "users",
						type: "mightFail",
					},
				],
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("second_id", "bigserial")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("second_id")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: { id: "default", schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});

	test<DbContext>("add non nullable column", async (context) => {
		await context.kysely.schema.createTable("users").execute();

		const dbSchema = schema({
			tables: {
				users: table({
					columns: {
						name: text().notNull(),
					},
				}),
			},
		});

		const expected = [
			{
				priority: 2003,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createNonNullableColumn",
				phase: "expand",
				warnings: [
					{
						code: "MF004",
						column: "name",
						schema: "public",
						table: "users",
						type: "mightFail",
					},
				],
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("name", "text")',
						"execute();",
					],
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addCheckConstraint("temporary_not_null_check_constraint_public_users_name", sql\`"name" IS NOT NULL\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "temporary_not_null_check_constraint_public_users_name"`',
						"execute(db);",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("name", (col) => col.setNotNull())',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropConstraint("temporary_not_null_check_constraint_public_users_name")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("name")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: { id: "default", schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});

	test<DbContext>("add non nullable column with volatile default", async (context) => {
		await context.kysely.schema.createTable("users").execute();

		const dbSchema = schema({
			tables: {
				users: table({
					columns: {
						createdAt: timestamptz()
							.default(sql`now()`)
							.notNull(),
					},
				}),
			},
		});

		const expected = [
			{
				priority: 2003,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createNonNullableColumn",
				phase: "expand",
				warnings: [
					{
						code: "B002",
						column: "createdAt",
						schema: "public",
						table: "users",
						type: "blocking",
					},
					{
						code: "MF004",
						column: "createdAt",
						schema: "public",
						table: "users",
						type: "mightFail",
					},
				],
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("createdAt", sql`timestamp with time zone`, (col) => col.defaultTo(sql`now()`))',
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "public"."users"."createdAt" IS \'28a4dae0\'`',
						"execute(db);",
					],
					[
						`await sql\`\${sql.raw(
  db
    .withSchema("public")
    .schema.alterTable("users")
    .addCheckConstraint("temporary_not_null_check_constraint_public_users_createdAt", sql\`"createdAt" IS NOT NULL\`)
    .compile()
    .sql.concat(" not valid")
)}\`.execute(db);`,
					],
					[
						'await sql`ALTER TABLE "public"."users" VALIDATE CONSTRAINT "temporary_not_null_check_constraint_public_users_createdAt"`',
						"execute(db);",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'alterColumn("createdAt", (col) => col.setNotNull())',
						"execute();",
					],
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropConstraint("temporary_not_null_check_constraint_public_users_createdAt")',
						"execute();",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("createdAt")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: { id: "default", schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});

	test<DbContext>("add column with volatile default", async (context) => {
		await context.kysely.schema.createTable("users").execute();

		const dbSchema = schema({
			tables: {
				users: table({
					columns: {
						createdAt: timestamptz().default(sql`now()`),
					},
				}),
			},
		});

		const expected = [
			{
				priority: 2003,
				tableName: "users",
				currentTableName: "users",
				schemaName: "public",
				type: "createColumn",
				phase: "expand",
				warnings: [
					{
						code: "B002",
						column: "createdAt",
						schema: "public",
						table: "users",
						type: "blocking",
					},
				],
				up: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'addColumn("createdAt", sql`timestamp with time zone`, (col) => col.defaultTo(sql`now()`))',
						"execute();",
					],
					[
						'await sql`COMMENT ON COLUMN "public"."users"."createdAt" IS \'28a4dae0\'`',
						"execute(db);",
					],
				],
				down: [
					[
						'await db.withSchema("public").schema',
						'alterTable("users")',
						'dropColumn("createdAt")',
						"execute();",
					],
				],
			},
		];
		await testChangesetAndMigrations({
			context,
			configuration: { id: "default", schemas: [dbSchema] },
			expected,
			down: "same",
		});
	});
});
