import { describe, expect, test } from "vitest";
import { tableInfo } from "~/introspection/table.js";
import { integer } from "~/schema/column/data-types/integer.js";
import { foreignKey, foreignKeyOptions } from "~/schema/foreign-key.js";
import { table } from "~/schema/table.js";

describe("PgForeignKeyConstraint", () => {
	test("foreign key with defaults", () => {
		const users = table({
			columns: {
				id: integer(),
			},
		});
		const documments = table({
			columns: {
				id: integer(),
				user_id: integer(),
			},
			constraints: {
				foreignKeys: [foreignKey(["user_id"], users, ["id"])],
			},
		});
		const constraint =
			tableInfo(documments).definition.constraints?.foreignKeys![0];

		const options = foreignKeyOptions(constraint!);
		expect(options.columns).toStrictEqual(["user_id"]);
		expect(options.targetColumns).toStrictEqual(["id"]);
		expect(options.targetTable).toBe(users);
		expect(options.deleteRule).toBe("NO ACTION");
		expect(options.updateRule).toBe("NO ACTION");
	});

	test("foreign key with custom update and delete rules", () => {
		const users = table({
			columns: {
				id: integer(),
			},
		});
		const documments = table({
			columns: {
				id: integer(),
				user_id: integer(),
			},
			constraints: {
				foreignKeys: [
					foreignKey(["user_id"], users, ["id"])
						.deleteRule("restrict")
						.updateRule("cascade"),
				],
			},
		});
		const constraint =
			tableInfo(documments).definition.constraints?.foreignKeys![0];

		const options = foreignKeyOptions(constraint!);
		expect(options.columns).toStrictEqual(["user_id"]);
		expect(options.targetColumns).toStrictEqual(["id"]);
		expect(options.targetTable).toBe(users);
		expect(options.deleteRule).toBe("RESTRICT");
		expect(options.updateRule).toBe("CASCADE");
	});

	test("self referential foreign key with defaults", () => {
		const tree = table({
			columns: {
				node_id: integer(),
				parent_id: integer(),
			},
			constraints: {
				foreignKeys: [foreignKey(["parent_id"], ["node_id"])],
			},
		});
		const constraint = tableInfo(tree).definition.constraints?.foreignKeys![0];

		const options = foreignKeyOptions(constraint!);
		expect(options.columns).toStrictEqual(["parent_id"]);
		expect(options.targetColumns).toStrictEqual(["node_id"]);
		expect(options.deleteRule).toBe("NO ACTION");
		expect(options.updateRule).toBe("NO ACTION");
	});
});
