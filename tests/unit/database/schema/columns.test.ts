import { Equal, Expect } from "type-testing";
import { describe, expect, expectTypeOf, test } from "vitest";
import {
	NestedRecord,
	columnMeta,
	pgBigInt,
	pgBigSerial,
	pgBoolean,
	pgBytea,
	pgChar,
	pgDate,
	pgDoublePrecision,
	pgFloat4,
	pgFloat8,
	pgInt2,
	pgInt4,
	pgInt8,
	pgInteger,
	pgJson,
	pgJsonB,
	pgNumeric,
	pgReal,
	pgSerial,
	pgText,
	pgTime,
	pgTimeTz,
	pgTimestamp,
	pgTimestampTz,
	pgUuid,
	pgVarchar,
} from "~/database/schema/columns.js";
import { testMetaValue } from "~tests/helpers/test_meta_value.js";

describe("boolean column", () => {
	test("type is Boolean", () => {
		const obj = pgBoolean();
		expectTypeOf(obj).toMatchTypeOf<pgBoolean>();
	});

	test("argument for default is boolean", () => {
		const obj = pgBoolean();
		const expect: Expect<
			Equal<
				boolean | "true" | "false" | "1" | "0" | 1 | 0,
				Parameters<typeof obj.default>[0]
			>
		> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	test("method chaining", () => {
		const obj = pgBoolean().nullable().default(true).nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgBoolean>();
	});

	testMetaValue(pgBoolean(), "dataType", "boolean");
	testMetaValue(pgBoolean(), "defaultValue", null);
	testMetaValue(pgBoolean(), "isNullable", true);
	testMetaValue(pgBoolean(), "renameFrom", null);
	testMetaValue(pgBoolean().renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(pgBoolean().default(true), "defaultValue", true);
	testMetaValue(pgBoolean().nullable(), "isNullable", true);
	testMetaValue(pgBoolean().nonNullable(), "isNullable", false);
	testMetaValue(pgBoolean(), "primaryKey", null);
	testMetaValue(pgBoolean().primaryKey(), "primaryKey", true);
});

describe("text column", () => {
	test("type is Text", () => {
		const obj = pgText();
		expectTypeOf(obj).toMatchTypeOf<pgText>();
	});

	test("method chaining", () => {
		const obj = pgText().nullable().default("hellotrue").nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgText>();
	});

	test("argument for default is string", () => {
		const obj = pgText();
		const expect: Expect<Equal<string, Parameters<typeof obj.default>[0]>> =
			true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgText(), "dataType", "text");
	testMetaValue(pgText(), "defaultValue", null);
	testMetaValue(pgText(), "isNullable", true);
	testMetaValue(pgText(), "renameFrom", null);
	testMetaValue(pgText().renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(pgText().default("hello"), "defaultValue", "hello");
	testMetaValue(pgText().nullable(), "isNullable", true);
	testMetaValue(pgText().nonNullable(), "isNullable", false);
	testMetaValue(pgText(), "primaryKey", null);
	testMetaValue(pgText().primaryKey(), "primaryKey", true);
});

describe("varchar column", () => {
	test("type is Varchar", () => {
		const obj = pgVarchar();
		expectTypeOf(obj).toMatchTypeOf<pgVarchar>();
	});

	test("method chaining", () => {
		const obj = pgVarchar().nullable().default("hellotrue").nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgVarchar>();
	});

	test("argument for default is string", () => {
		const obj = pgText();
		const expect: Expect<Equal<string, Parameters<typeof obj.default>[0]>> =
			true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgVarchar(), "dataType", "varchar");
	testMetaValue(pgVarchar(), "defaultValue", null);
	testMetaValue(pgVarchar(), "isNullable", true);
	testMetaValue(pgVarchar(), "renameFrom", null);
	testMetaValue(pgVarchar().renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(pgVarchar().default("hello"), "defaultValue", "hello");
	testMetaValue(pgVarchar().nullable(), "isNullable", true);
	testMetaValue(pgVarchar().nonNullable(), "isNullable", false);
	testMetaValue(pgVarchar(), "primaryKey", null);
	testMetaValue(pgVarchar().primaryKey(), "primaryKey", true);

	test("dataType is varchar({maximumLength}) when maximum length is defined", () => {
		const obj = pgVarchar(100);
		const meta = columnMeta(obj);
		expect(meta?.dataType).toBe("varchar(100)");
	});
});

describe("char column", () => {
	test("type is Char", () => {
		const obj = pgChar();
		expectTypeOf(obj).toMatchTypeOf<pgChar>();
	});

	test("method chaining", () => {
		const obj = pgChar().nullable().default("hellotrue").nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgChar>();
	});

	test("argument for default is string", () => {
		const obj = pgChar();
		const expect: Expect<Equal<string, Parameters<typeof obj.default>[0]>> =
			true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	test("dataType is char({maximumLength}) when maximum length is defined", () => {
		const obj = pgChar(100);
		const meta = columnMeta(obj);
		expect(meta?.dataType).toBe("char(100)");
	});

	testMetaValue(pgChar(100), "dataType", "char(100)");
	testMetaValue(pgChar(), "dataType", "char(1)");
	testMetaValue(pgChar(), "defaultValue", null);
	testMetaValue(pgChar(), "isNullable", true);
	testMetaValue(pgChar(), "renameFrom", null);
	testMetaValue(pgChar().renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(pgChar().default("hello"), "defaultValue", "hello");
	testMetaValue(pgChar().nullable(), "isNullable", true);
	testMetaValue(pgChar().nonNullable(), "isNullable", false);
	testMetaValue(pgChar(), "characterMaximumLength", 1);
	testMetaValue(pgChar(100), "characterMaximumLength", 100);
	testMetaValue(pgChar(), "primaryKey", null);
	testMetaValue(pgChar().primaryKey(), "primaryKey", true);
});

describe("numeric column", () => {
	test("type is PgNumeric", () => {
		const obj = pgNumeric();
		expectTypeOf(obj).toMatchTypeOf<pgNumeric>();
	});

	test("method chaining", () => {
		const obj = pgNumeric().nullable().default(12).nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgNumeric>();
	});

	test("argument for default is number", () => {
		const obj = pgNumeric();
		const expect: Expect<
			Equal<string | number | bigint, Parameters<typeof obj.default>[0]>
		> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgNumeric(), "dataType", "numeric");
	testMetaValue(pgNumeric(), "defaultValue", null);
	testMetaValue(pgNumeric(), "isNullable", true);
	testMetaValue(pgNumeric(), "renameFrom", null);
	testMetaValue(pgNumeric().renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(pgNumeric().default(12), "defaultValue", 12);
	testMetaValue(pgNumeric().nullable(), "isNullable", true);
	testMetaValue(pgNumeric().nonNullable(), "isNullable", false);
	testMetaValue(pgNumeric(), "primaryKey", null);
	testMetaValue(pgNumeric().primaryKey(), "primaryKey", true);
});

describe("numeric column with precision", () => {
	test("type is PgNumeric", () => {
		const obj = pgNumeric(10);
		expectTypeOf(obj).toMatchTypeOf<pgNumeric>();
	});

	test("argument for default is number", () => {
		const obj = pgNumeric();
		const expect: Expect<
			Equal<string | number | bigint, Parameters<typeof obj.default>[0]>
		> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	test("method chaining", () => {
		const obj = pgNumeric(10).nullable().default(12).nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgNumeric>();
	});

	testMetaValue(pgNumeric(10), "dataType", "numeric(10, 0)");
	testMetaValue(pgNumeric(10), "defaultValue", null);
	testMetaValue(pgNumeric(10), "isNullable", true);
	testMetaValue(pgNumeric(10), "renameFrom", null);
	testMetaValue(pgNumeric(10).renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(pgNumeric(10).default(12), "defaultValue", 12);
	testMetaValue(pgNumeric(10).nullable(), "isNullable", true);
	testMetaValue(pgNumeric(10).nonNullable(), "isNullable", false);
	testMetaValue(pgNumeric(10), "primaryKey", null);
	testMetaValue(pgNumeric(10).primaryKey(), "primaryKey", true);
});

describe("numeric column with precision and scale", () => {
	test("type is PgNumeric", () => {
		const obj = pgNumeric(10, 10);
		expectTypeOf(obj).toMatchTypeOf<pgNumeric>();
	});

	test("method chaining", () => {
		const obj = pgNumeric(10, 10).nullable().default(12).nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgNumeric>();
	});

	test("argument for default is number", () => {
		const obj = pgNumeric();
		const expect: Expect<
			Equal<string | number | bigint, Parameters<typeof obj.default>[0]>
		> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgNumeric(10, 4), "dataType", "numeric(10, 4)");
	testMetaValue(pgNumeric(10, 4), "defaultValue", null);
	testMetaValue(pgNumeric(10, 4), "isNullable", true);
	testMetaValue(pgNumeric(10, 4), "renameFrom", null);
	testMetaValue(
		pgNumeric(10, 4).renameFrom("test_col"),
		"renameFrom",
		"test_col",
	);
	testMetaValue(pgNumeric(10, 4).default(12), "defaultValue", 12);
	testMetaValue(pgNumeric(10, 4).nullable(), "isNullable", true);
	testMetaValue(pgNumeric(10, 4).nonNullable(), "isNullable", false);
	testMetaValue(pgNumeric(10, 4), "primaryKey", null);
	testMetaValue(pgNumeric(10, 4).primaryKey(), "primaryKey", true);
});

describe("pgBigInt column", () => {
	test("type is pgBigInt", () => {
		const obj = pgBigInt();
		expectTypeOf(obj).toMatchTypeOf<pgBigInt>();
	});

	test("method chaining", () => {
		const obj = pgBigInt().nullable().default(12).nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgBigInt>();
	});

	test("argument for default is string or number or bigint", () => {
		const obj = pgBigInt();
		const expect: Expect<
			Equal<number | string | bigint, Parameters<typeof obj.default>[0]>
		> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgBigInt(), "dataType", "bigint");
	testMetaValue(pgBigInt(), "min", -9223372036854775808n);
	testMetaValue(pgBigInt(), "max", 9223372036854775808n);
	testMetaValue(pgBigInt(), "defaultValue", null);
	testMetaValue(pgBigInt(), "isNullable", true);
	testMetaValue(pgBigInt(), "renameFrom", null);
	testMetaValue(pgBigInt().renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(pgBigInt().default(12), "defaultValue", 12);
	testMetaValue(pgBigInt().nullable(), "isNullable", true);
	testMetaValue(pgBigInt().nonNullable(), "isNullable", false);
	testMetaValue(pgBigInt(), "primaryKey", null);
	testMetaValue(pgBigInt().primaryKey(), "primaryKey", true);
});

describe("pgBigSerial column", () => {
	test("type is pgBigSerial", () => {
		const obj = pgBigSerial();
		expectTypeOf(obj).toMatchTypeOf<pgBigSerial>();
	});

	test("method chaining", () => {
		const obj = pgBigSerial().nullable().nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgBigSerial>();
	});

	test("does not have a default method", () => {
		const obj = pgBigSerial();
		expect((obj as pgBigSerial).default).toBeUndefined();
	});

	testMetaValue(pgBigSerial(), "dataType", "bigserial");
	testMetaValue(pgBigSerial(), "min", 1);
	testMetaValue(pgBigSerial(), "max", 9223372036854775808n);
	testMetaValue(pgBigSerial(), "defaultValue", null);
	testMetaValue(pgBigSerial(), "isNullable", false);
	testMetaValue(pgBigSerial(), "renameFrom", null);
	testMetaValue(pgBigSerial().renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(pgBigSerial().nullable(), "isNullable", true);
	testMetaValue(pgBigSerial().nonNullable(), "isNullable", false);
	testMetaValue(pgBigSerial(), "primaryKey", null);
	testMetaValue(pgBigSerial().primaryKey(), "primaryKey", true);
});

describe("pgBytea column", () => {
	test("type is pgBytea", () => {
		const obj = pgBytea();
		expectTypeOf(obj).toMatchTypeOf<pgBytea>();
	});

	test("method chaining", () => {
		const obj = pgBytea().nullable().default(Buffer.from("1")).nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgBytea>();
	});

	test("argument for default is string", () => {
		const obj = pgBytea();
		const expect: Expect<
			Equal<
				Buffer | string | boolean | number | NestedRecord,
				Parameters<typeof obj.default>[0]
			>
		> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgBytea(), "dataType", "bytea");
	testMetaValue(pgBytea(), "defaultValue", null);
	testMetaValue(pgBytea(), "isNullable", true);
	testMetaValue(pgBytea(), "renameFrom", null);
	testMetaValue(pgBytea().renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(
		pgBytea().default(Buffer.from("12")),
		"defaultValue",
		Buffer.from("12"),
		true,
	);
	testMetaValue(pgBytea().nullable(), "isNullable", true);
	testMetaValue(pgBytea().nonNullable(), "isNullable", false);
	testMetaValue(pgBytea(), "primaryKey", null);
	testMetaValue(pgBytea().primaryKey(), "primaryKey", true);
});

describe("pgDate column", () => {
	test("type is pgDate", () => {
		const obj = pgDate();
		expectTypeOf(obj).toMatchTypeOf<pgDate>();
	});

	test("method chaining", () => {
		const obj = pgDate().nullable().default(new Date(1)).nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgDate>();
	});

	test("argument for default is date", () => {
		const obj = pgDate();
		const expect: Expect<
			Equal<string | Date, Parameters<typeof obj.default>[0]>
		> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgDate(), "dataType", "date");
	testMetaValue(pgDate(), "defaultValue", null);
	testMetaValue(pgDate(), "isNullable", true);
	testMetaValue(pgDate(), "renameFrom", null);
	testMetaValue(pgDate().renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(
		pgDate().default(new Date(100)),
		"defaultValue",
		new Date(100),
		true,
	);
	testMetaValue(pgDate().nullable(), "isNullable", true);
	testMetaValue(pgDate().nonNullable(), "isNullable", false);
	testMetaValue(pgDate(), "primaryKey", null);
	testMetaValue(pgDate().primaryKey(), "primaryKey", true);
});

describe("pgDoublePrecision column", () => {
	test("type is pgDoublePrecision", () => {
		const obj = pgDoublePrecision();
		expectTypeOf(obj).toMatchTypeOf<pgDoublePrecision>();
	});

	test("method chaining", () => {
		const obj = pgDoublePrecision().nullable().default(12).nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgDoublePrecision>();
	});

	test("argument for default is string or number or bigint", () => {
		const obj = pgDoublePrecision();
		const expect: Expect<
			Equal<string | number | bigint, Parameters<typeof obj.default>[0]>
		> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgDoublePrecision(), "dataType", "double precision");
	testMetaValue(pgDoublePrecision(), "min", -1e308);
	testMetaValue(pgDoublePrecision(), "max", 1e308);
	testMetaValue(pgDoublePrecision(), "defaultValue", null);
	testMetaValue(pgDoublePrecision(), "isNullable", true);
	testMetaValue(pgDoublePrecision(), "renameFrom", null);
	testMetaValue(
		pgDoublePrecision().renameFrom("test_col"),
		"renameFrom",
		"test_col",
	);
	testMetaValue(pgDoublePrecision().default(12.1), "defaultValue", 12.1);
	testMetaValue(pgDoublePrecision().nullable(), "isNullable", true);
	testMetaValue(pgDoublePrecision().nonNullable(), "isNullable", false);
	testMetaValue(pgDoublePrecision(), "primaryKey", null);
	testMetaValue(pgDoublePrecision().primaryKey(), "primaryKey", true);
});

describe("pgFloat4 column", () => {
	test("type is pgFloat4", () => {
		const obj = pgFloat4();
		expectTypeOf(obj).toMatchTypeOf<pgFloat4>();
	});

	test("method chaining", () => {
		const obj = pgFloat4().nullable().default(12).nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgFloat4>();
	});

	test("argument for default is string or number or bigint", () => {
		const obj = pgFloat4();
		const expect: Expect<
			Equal<string | number | bigint, Parameters<typeof obj.default>[0]>
		> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgFloat4(), "dataType", "float4");
	testMetaValue(pgFloat4(), "min", -1e37);
	testMetaValue(pgFloat4(), "max", 1e37);
	testMetaValue(pgFloat4(), "defaultValue", null);
	testMetaValue(pgFloat4(), "isNullable", true);
	testMetaValue(pgFloat4(), "renameFrom", null);
	testMetaValue(pgFloat4().renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(pgFloat4().default(12.1), "defaultValue", 12.1);
	testMetaValue(pgFloat4().nullable(), "isNullable", true);
	testMetaValue(pgFloat4().nonNullable(), "isNullable", false);
	testMetaValue(pgFloat4(), "primaryKey", null);
	testMetaValue(pgFloat4().primaryKey(), "primaryKey", true);
});

describe("pgFloat8 column", () => {
	test("type is pgFloat8", () => {
		const obj = pgFloat8();
		expectTypeOf(obj).toMatchTypeOf<pgFloat8>();
	});

	test("method chaining", () => {
		const obj = pgFloat8().nullable().default(12).nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgFloat8>();
	});

	test("argument for default is string or number or bigint", () => {
		const obj = pgFloat8();
		const expect: Expect<
			Equal<string | number | bigint, Parameters<typeof obj.default>[0]>
		> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgFloat8(), "dataType", "float8");
	testMetaValue(pgFloat8(), "min", -1e308);
	testMetaValue(pgFloat8(), "max", 1e308);
	testMetaValue(pgFloat8(), "defaultValue", null);
	testMetaValue(pgFloat8(), "isNullable", true);
	testMetaValue(pgFloat8(), "renameFrom", null);
	testMetaValue(pgFloat8().renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(pgFloat8().default(12.1), "defaultValue", 12.1);
	testMetaValue(pgFloat8().nullable(), "isNullable", true);
	testMetaValue(pgFloat8().nonNullable(), "isNullable", false);
	testMetaValue(pgFloat8(), "primaryKey", null);
	testMetaValue(pgFloat8().primaryKey(), "primaryKey", true);
});

describe("pgInt2 column", () => {
	test("type is pgInt2", () => {
		const obj = pgInt2();
		expectTypeOf(obj).toMatchTypeOf<pgInt2>();
	});

	test("method chaining", () => {
		const obj = pgInt2().nullable().default(12).nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgInt2>();
	});

	test("argument for default is string or number or bigint", () => {
		const obj = pgInt2();
		const expect: Expect<
			Equal<number | string, Parameters<typeof obj.default>[0]>
		> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgInt2(), "dataType", "int2");
	testMetaValue(pgInt2(), "min", -32768);
	testMetaValue(pgInt2(), "max", 32768);
	testMetaValue(pgInt2(), "defaultValue", null);
	testMetaValue(pgInt2(), "isNullable", true);
	testMetaValue(pgInt2(), "renameFrom", null);
	testMetaValue(pgInt2().renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(pgInt2().default(12), "defaultValue", 12);
	testMetaValue(pgInt2().nullable(), "isNullable", true);
	testMetaValue(pgInt2().nonNullable(), "isNullable", false);
	testMetaValue(pgInt2(), "primaryKey", null);
	testMetaValue(pgInt2().primaryKey(), "primaryKey", true);
});

describe("pgInt4 column", () => {
	test("type is pgInt4", () => {
		const obj = pgInt4();
		expectTypeOf(obj).toMatchTypeOf<pgInt4>();
	});

	test("method chaining", () => {
		const obj = pgInt4().nullable().default(12).nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgInt4>();
	});

	test("argument for default is string or number or bigint", () => {
		const obj = pgInt4();
		const expect: Expect<
			Equal<number | string, Parameters<typeof obj.default>[0]>
		> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgInt4(), "dataType", "int4");
	testMetaValue(pgInt4(), "min", -2147483648);
	testMetaValue(pgInt4(), "max", 2147483648);
	testMetaValue(pgInt4(), "defaultValue", null);
	testMetaValue(pgInt4(), "isNullable", true);
	testMetaValue(pgInt4(), "renameFrom", null);
	testMetaValue(pgInt4().renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(pgInt4().default(12), "defaultValue", 12);
	testMetaValue(pgInt4().nullable(), "isNullable", true);
	testMetaValue(pgInt4().nonNullable(), "isNullable", false);
	testMetaValue(pgInt4(), "primaryKey", null);
	testMetaValue(pgInt4().primaryKey(), "primaryKey", true);
});

describe("pgInt8 column", () => {
	test("type is pgInt8", () => {
		const obj = pgInt8();
		expectTypeOf(obj).toMatchTypeOf<pgInt8>();
	});

	test("method chaining", () => {
		const obj = pgInt8().nullable().default(12).nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgInt8>();
	});

	test("argument for default is string or number or bigint", () => {
		const obj = pgInt8();
		const expect: Expect<
			Equal<number | string | bigint, Parameters<typeof obj.default>[0]>
		> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgInt8(), "dataType", "int8");
	testMetaValue(pgInt8(), "min", -9223372036854775808n);
	testMetaValue(pgInt8(), "max", 9223372036854775808n);
	testMetaValue(pgInt8(), "defaultValue", null);
	testMetaValue(pgInt8(), "isNullable", true);
	testMetaValue(pgInt8(), "renameFrom", null);
	testMetaValue(pgInt8().renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(pgInt8().default(12), "defaultValue", 12);
	testMetaValue(pgInt8().nullable(), "isNullable", true);
	testMetaValue(pgInt8().nonNullable(), "isNullable", false);
	testMetaValue(pgInt8(), "primaryKey", null);
	testMetaValue(pgInt8().primaryKey(), "primaryKey", true);
});

describe("pgInteger column", () => {
	test("type is pgInteger", () => {
		const obj = pgInteger();
		expectTypeOf(obj).toMatchTypeOf<pgInteger>();
	});

	test("method chaining", () => {
		const obj = pgInteger().nullable().default(12).nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgInteger>();
	});

	test("argument for default is string or number", () => {
		const obj = pgInteger();
		const expect: Expect<
			Equal<number | string, Parameters<typeof obj.default>[0]>
		> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgInteger(), "dataType", "int4");
	testMetaValue(pgInteger(), "min", -2147483648);
	testMetaValue(pgInteger(), "max", 2147483648);
	testMetaValue(pgInteger(), "defaultValue", null);
	testMetaValue(pgInteger(), "isNullable", true);
	testMetaValue(pgInteger(), "renameFrom", null);
	testMetaValue(pgInteger().renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(pgInteger().default(12), "defaultValue", 12);
	testMetaValue(pgInteger().nullable(), "isNullable", true);
	testMetaValue(pgInteger().nonNullable(), "isNullable", false);
	testMetaValue(pgInteger(), "primaryKey", null);
	testMetaValue(pgInteger().primaryKey(), "primaryKey", true);
});

describe("pgJson column", () => {
	test("type is pgJson", () => {
		const obj = pgJson();
		expectTypeOf(obj).toMatchTypeOf<pgJson>();
	});

	test("method chaining", () => {
		const obj = pgJson().nullable().default("12").nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgJson>();
	});

	test("argument for default is string, number, or boolean", () => {
		const obj = pgJson();
		const expect: Expect<Equal<string, Parameters<typeof obj.default>[0]>> =
			true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgJson(), "dataType", "json");
	testMetaValue(pgJson(), "defaultValue", null);
	testMetaValue(pgJson(), "isNullable", true);
	testMetaValue(pgJson(), "renameFrom", null);
	testMetaValue(pgJson().renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(pgJson().default("12"), "defaultValue", "12");
	testMetaValue(pgJson().nullable(), "isNullable", true);
	testMetaValue(pgJson().nonNullable(), "isNullable", false);
	testMetaValue(pgJson(), "primaryKey", null);
	testMetaValue(pgJson().primaryKey(), "primaryKey", true);
});

describe("pgJsonB column", () => {
	test("type is pgJsonB", () => {
		const obj = pgJsonB();
		expectTypeOf(obj).toMatchTypeOf<pgJsonB>();
	});

	test("method chaining", () => {
		const obj = pgJsonB().nullable().default("12").nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgJsonB>();
	});

	test("argument for default is string, number, or boolean", () => {
		const obj = pgJsonB();
		const expect: Expect<Equal<string, Parameters<typeof obj.default>[0]>> =
			true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgJsonB(), "dataType", "jsonb");
	testMetaValue(pgJsonB(), "defaultValue", null);
	testMetaValue(pgJsonB(), "isNullable", true);
	testMetaValue(pgJsonB(), "renameFrom", null);
	testMetaValue(pgJsonB().renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(pgJsonB().default("12"), "defaultValue", "12");
	testMetaValue(pgJsonB().nullable(), "isNullable", true);
	testMetaValue(pgJsonB().nonNullable(), "isNullable", false);
	testMetaValue(pgJsonB(), "primaryKey", null);
	testMetaValue(pgJsonB().primaryKey(), "primaryKey", true);
});

describe("pgReal column", () => {
	test("type is pgReal", () => {
		const obj = pgReal();
		expectTypeOf(obj).toMatchTypeOf<pgReal>();
	});

	test("method chaining", () => {
		const obj = pgReal().nullable().default(12).nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgReal>();
	});

	test("argument for default is string or number or bigint", () => {
		const obj = pgReal();
		const expect: Expect<
			Equal<string | number | bigint, Parameters<typeof obj.default>[0]>
		> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgReal(), "dataType", "real");
	testMetaValue(pgReal(), "min", -1e37);
	testMetaValue(pgReal(), "max", 1e37);
	testMetaValue(pgReal(), "defaultValue", null);
	testMetaValue(pgReal(), "isNullable", true);
	testMetaValue(pgReal(), "renameFrom", null);
	testMetaValue(pgReal().renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(pgReal().default(12), "defaultValue", 12);
	testMetaValue(pgReal().nullable(), "isNullable", true);
	testMetaValue(pgReal().nonNullable(), "isNullable", false);
	testMetaValue(pgReal(), "primaryKey", null);
	testMetaValue(pgReal().primaryKey(), "primaryKey", true);
});

describe("pgSerial column", () => {
	test("type is pgSerial", () => {
		const obj = pgSerial();
		expectTypeOf(obj).toMatchTypeOf<pgSerial>();
	});

	test("method chaining", () => {
		const obj = pgSerial().nullable().nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgSerial>();
	});

	test("does not have a default method", () => {
		const obj = pgSerial();
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		expect((obj as any).default).toBeUndefined();
	});

	testMetaValue(pgSerial(), "dataType", "serial");
	testMetaValue(pgSerial(), "min", 1);
	testMetaValue(pgSerial(), "max", 2147483648);
	testMetaValue(pgSerial(), "defaultValue", null);
	testMetaValue(pgSerial(), "isNullable", false);
	testMetaValue(pgSerial(), "renameFrom", null);
	testMetaValue(pgSerial().renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(pgSerial().nullable(), "isNullable", true);
	testMetaValue(pgSerial().nonNullable(), "isNullable", false);
	testMetaValue(pgSerial(), "primaryKey", null);
	testMetaValue(pgSerial().primaryKey(), "primaryKey", true);
});

describe("pgTime", () => {
	test("type is pgTime", () => {
		const obj = pgTime();
		expectTypeOf(obj).toMatchTypeOf<pgTime>();
	});

	test("method chaining", () => {
		const obj = pgTime().nullable().default("string").nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgTime>();
	});

	test("argument for default is date", () => {
		const obj = pgTime();
		const expect: Expect<Equal<string, Parameters<typeof obj.default>[0]>> =
			true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgTime(), "dataType", "time");
	testMetaValue(pgTime(), "defaultValue", null);
	testMetaValue(pgTime(), "isNullable", true);
	testMetaValue(pgTime(), "datetimePrecision", null);
	testMetaValue(pgTime(), "renameFrom", null);
	testMetaValue(pgTime().renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(pgTime().default("05:24:11"), "defaultValue", "05:24:11");
	testMetaValue(pgTime().nullable(), "isNullable", true);
	testMetaValue(pgTime().nonNullable(), "isNullable", false);
	testMetaValue(pgTime(), "primaryKey", null);
	testMetaValue(pgTime().primaryKey(), "primaryKey", true);
});

describe("pgTime with date time precision", () => {
	test("type is pgTime", () => {
		const obj = pgTime(1);
		expectTypeOf(obj).toMatchTypeOf<pgTime>();
	});

	test("method chaining", () => {
		const obj = pgTime(1).nullable().default("string").nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgTime>();
	});

	test("argument for default is date", () => {
		const obj = pgTime(1);
		const expect: Expect<Equal<string, Parameters<typeof obj.default>[0]>> =
			true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgTime(1), "dataType", "time(1)");
	testMetaValue(pgTime(1), "defaultValue", null);
	testMetaValue(pgTime(1), "isNullable", true);
	testMetaValue(pgTime(2), "datetimePrecision", 2);
	testMetaValue(pgTime(1), "renameFrom", null);
	testMetaValue(pgTime(1).renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(pgTime(1).default("05:24:11"), "defaultValue", "05:24:11");
	testMetaValue(pgTime(1).nullable(), "isNullable", true);
	testMetaValue(pgTime(1).nonNullable(), "isNullable", false);
	testMetaValue(pgTime(1), "primaryKey", null);
	testMetaValue(pgTime(1).primaryKey(), "primaryKey", true);
});

describe("pgTimestamp", () => {
	test("type is pgTimestamp", () => {
		const obj = pgTimestamp();
		expectTypeOf(obj).toMatchTypeOf<pgTimestamp>();
	});

	test("method chaining", () => {
		const obj = pgTimestamp().nullable().default("string").nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgTimestamp>();
	});

	test("argument for default is date", () => {
		const obj = pgTimestamp();
		const expect: Expect<
			Equal<string | Date, Parameters<typeof obj.default>[0]>
		> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgTimestamp(), "dataType", "timestamp");
	testMetaValue(pgTimestamp(), "defaultValue", null);
	testMetaValue(pgTimestamp(), "isNullable", true);
	testMetaValue(pgTimestamp(), "datetimePrecision", null);
	testMetaValue(pgTimestamp(), "renameFrom", null);
	testMetaValue(pgTimestamp().renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(
		pgTimestamp().default("1999-01-08 04:05:06"),
		"defaultValue",
		"1999-01-08 04:05:06",
	);
	testMetaValue(pgTimestamp().nullable(), "isNullable", true);
	testMetaValue(pgTimestamp().nonNullable(), "isNullable", false);
	testMetaValue(pgTimestamp(), "primaryKey", null);
	testMetaValue(pgTimestamp().primaryKey(), "primaryKey", true);
});

describe("pgTimestamp with date time precision", () => {
	test("type is pgTimestamp", () => {
		const obj = pgTimestamp(1);
		expectTypeOf(obj).toMatchTypeOf<pgTimestamp>();
	});

	test("method chaining", () => {
		const obj = pgTimestamp(1).nullable().default("string").nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgTimestamp>();
	});

	test("argument for default is date", () => {
		const obj = pgTimestamp(1);
		const expect: Expect<
			Equal<string | Date, Parameters<typeof obj.default>[0]>
		> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgTimestamp(1), "dataType", "timestamp(1)");
	testMetaValue(pgTimestamp(1), "defaultValue", null);
	testMetaValue(pgTimestamp(1), "isNullable", true);
	testMetaValue(pgTimestamp(2), "datetimePrecision", 2);
	testMetaValue(pgTimestamp(2), "renameFrom", null);
	testMetaValue(
		pgTimestamp(2).renameFrom("test_col"),
		"renameFrom",
		"test_col",
	);
	testMetaValue(
		pgTimestamp(2).default("1999-01-08 04:05:06"),
		"defaultValue",
		"1999-01-08 04:05:06",
	);
	testMetaValue(pgTimestamp(2).nullable(), "isNullable", true);
	testMetaValue(pgTimestamp(2).nonNullable(), "isNullable", false);
	testMetaValue(pgTimestamp(2), "primaryKey", null);
	testMetaValue(pgTimestamp(2).primaryKey(), "primaryKey", true);
});

describe("pgTimestampTz", () => {
	test("type is pgTimestampTz", () => {
		const obj = pgTimestampTz();
		expectTypeOf(obj).toMatchTypeOf<pgTimestampTz>();
	});

	test("method chaining", () => {
		const obj = pgTimestampTz().nullable().default("string").nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgTimestampTz>();
	});

	test("argument for default is date", () => {
		const obj = pgTimestampTz();
		const expect: Expect<
			Equal<string | Date, Parameters<typeof obj.default>[0]>
		> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgTimestampTz(), "dataType", "timestamptz");
	testMetaValue(pgTimestampTz(), "defaultValue", null);
	testMetaValue(pgTimestampTz(), "isNullable", true);
	testMetaValue(pgTimestampTz(), "datetimePrecision", null);
	testMetaValue(pgTimestampTz(), "renameFrom", null);
	testMetaValue(
		pgTimestampTz().renameFrom("test_col"),
		"renameFrom",
		"test_col",
	);
	testMetaValue(
		pgTimestampTz().default("1999-01-08 04:05:06 -8:00"),
		"defaultValue",
		"1999-01-08 04:05:06 -8:00",
	);
	testMetaValue(pgTimestampTz().nullable(), "isNullable", true);
	testMetaValue(pgTimestampTz().nonNullable(), "isNullable", false);
	testMetaValue(pgTimestampTz(), "primaryKey", null);
	testMetaValue(pgTimestampTz().primaryKey(), "primaryKey", true);
});

describe("pgTimestampTz with date time precision", () => {
	test("type is pgTimestampTz", () => {
		const obj = pgTimestampTz(1);
		expectTypeOf(obj).toMatchTypeOf<pgTimestampTz>();
	});

	test("method chaining", () => {
		const obj = pgTimestampTz(1).nullable().default("string").nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgTimestampTz>();
	});

	test("argument for default is date", () => {
		const obj = pgTimestampTz(1);
		const expect: Expect<
			Equal<string | Date, Parameters<typeof obj.default>[0]>
		> = true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgTimestampTz(1), "dataType", "timestamptz(1)");
	testMetaValue(pgTimestampTz(1), "defaultValue", null);
	testMetaValue(pgTimestampTz(1), "isNullable", true);
	testMetaValue(pgTimestampTz(2), "datetimePrecision", 2);
	testMetaValue(pgTimestampTz(2), "renameFrom", null);
	testMetaValue(
		pgTimestampTz(2).renameFrom("test_col"),
		"renameFrom",
		"test_col",
	);
	testMetaValue(
		pgTimestampTz(2).default("1999-01-08 04:05:06 -8:00"),
		"defaultValue",
		"1999-01-08 04:05:06 -8:00",
	);
	testMetaValue(pgTimestampTz(1).nullable(), "isNullable", true);
	testMetaValue(pgTimestampTz(2).nonNullable(), "isNullable", false);
	testMetaValue(pgTimestampTz(1), "primaryKey", null);
	testMetaValue(pgTimestampTz(1).primaryKey(), "primaryKey", true);
});

describe("pgTimeTz", () => {
	test("type is pgTimeTz", () => {
		const obj = pgTimeTz();
		expectTypeOf(obj).toMatchTypeOf<pgTimeTz>();
	});

	test("method chaining", () => {
		const obj = pgTimeTz().nullable().default("string").nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgTimeTz>();
	});

	test("argument for default is date", () => {
		const obj = pgTimeTz();
		const expect: Expect<Equal<string, Parameters<typeof obj.default>[0]>> =
			true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgTimeTz(), "dataType", "timetz");
	testMetaValue(pgTimeTz(), "defaultValue", null);
	testMetaValue(pgTimeTz(), "isNullable", true);
	testMetaValue(pgTimeTz(), "datetimePrecision", null);
	testMetaValue(pgTimeTz(), "renameFrom", null);
	testMetaValue(pgTimeTz().renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(
		pgTimeTz().default("04:05-08:00"),
		"defaultValue",
		"04:05-08:00",
	);
	testMetaValue(pgTimeTz().nullable(), "isNullable", true);
	testMetaValue(pgTimeTz().nonNullable(), "isNullable", false);
	testMetaValue(pgTimeTz(), "primaryKey", null);
	testMetaValue(pgTimeTz().primaryKey(), "primaryKey", true);
});

describe("pgTimeTz with date time precision", () => {
	test("type is pgTimeTz", () => {
		const obj = pgTimeTz();
		expectTypeOf(obj).toMatchTypeOf<pgTimeTz>();
	});

	test("method chaining", () => {
		const obj = pgTimeTz(1).nullable().default("string").nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgTimeTz>();
	});

	test("argument for default is date", () => {
		const obj = pgTimeTz(1);
		const expect: Expect<Equal<string, Parameters<typeof obj.default>[0]>> =
			true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgTimeTz(1), "dataType", "timetz(1)");
	testMetaValue(pgTimeTz(1), "defaultValue", null);
	testMetaValue(pgTimeTz(1), "isNullable", true);
	testMetaValue(pgTimeTz(2), "datetimePrecision", 2);
	testMetaValue(pgTimeTz(2), "renameFrom", null);
	testMetaValue(pgTimeTz(2).renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(
		pgTimeTz(2).default("04:05-08:00"),
		"defaultValue",
		"04:05-08:00",
	);
	testMetaValue(pgTimeTz(2).nullable(), "isNullable", true);
	testMetaValue(pgTimeTz(2).nonNullable(), "isNullable", false);
	testMetaValue(pgTimeTz(2), "primaryKey", null);
	testMetaValue(pgTimeTz(2).primaryKey(), "primaryKey", true);
});

describe("pgUuid column", () => {
	test("type is pgUuid", () => {
		const obj = pgUuid();
		expectTypeOf(obj).toMatchTypeOf<pgUuid>();
	});

	test("method chaining", () => {
		const obj = pgUuid().nullable().default("23").nonNullable();
		expectTypeOf(obj).toMatchTypeOf<pgUuid>();
	});

	test("argument for default is string", () => {
		const obj = pgUuid();
		const expect: Expect<Equal<string, Parameters<typeof obj.default>[0]>> =
			true;
		expectTypeOf(expect).toMatchTypeOf<boolean>();
	});

	testMetaValue(pgUuid(), "dataType", "uuid");
	testMetaValue(pgUuid(), "defaultValue", null);
	testMetaValue(pgUuid(), "isNullable", true);
	testMetaValue(pgUuid(), "renameFrom", null);
	testMetaValue(pgUuid().renameFrom("test_col"), "renameFrom", "test_col");
	testMetaValue(
		pgUuid().default("e7c96606-3e2f-4762-b545-7424f7acd8a7"),
		"defaultValue",
		"e7c96606-3e2f-4762-b545-7424f7acd8a7",
	);
	testMetaValue(pgUuid().nullable(), "isNullable", true);
	testMetaValue(pgUuid().nonNullable(), "isNullable", false);
	testMetaValue(pgUuid(), "primaryKey", null);
	testMetaValue(pgUuid().primaryKey(), "primaryKey", true);
});
