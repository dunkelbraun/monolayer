import { Effect } from "effect";
import { schemaChangeset } from "~/changeset/schema-changeset.js";
import {
	dropSchemaMigration,
	type DropSchemaDiff,
} from "~/database/database_schemas/changeset.js";
import { managedSchemas } from "~/database/database_schemas/introspection.js";
import { Schema, type AnySchema } from "~/database/schema/schema.js";
import { devEnvirinmentDbClient } from "~/services/db-clients.js";
import {
	appEnvironmentCamelCasePlugin,
	appEnvironmentConfigurationSchemas,
} from "~/state/app-environment.js";
import {
	introspectSchema,
	renameMigrationInfo,
	sortTablePriorities,
} from "../introspection/introspect-schemas.js";
import { toSnakeCase } from "./helpers.js";
import { promptSchemaRenames } from "./schema-rename.js";
import type { Changeset } from "./types.js";
import { validateForeignKeyReferences } from "./validate-foreign-key-references.js";

export function changeset() {
	return Effect.gen(function* () {
		const renames = yield* promptSchemaRenames;
		const allSchemas = yield* appEnvironmentConfigurationSchemas;
		let changesets: Changeset[] = [];
		for (const schema of allSchemas) {
			yield* validateForeignKeyReferences(schema, allSchemas);
			const introspection = yield* introspectSchema(schema, renames);
			yield* renameMigrationInfo(introspection);
			yield* sortTablePriorities(introspection);
			changesets = [
				...changesets,
				...schemaChangeset(introspection, yield* appEnvironmentCamelCasePlugin),
			];
		}
		return [...changesets, ...(yield* dropSchemaChangeset(allSchemas))];
	});
}

function dropSchemaChangeset(schemas: AnySchema[]) {
	return Effect.gen(function* () {
		const camelCase = yield* appEnvironmentCamelCasePlugin;
		const schemasToDrop = (yield* monolayerSchemasInDb()).filter(
			(dbSchema) =>
				!schemas.find((schema) => {
					return (
						toSnakeCase(Schema.info(schema).name ?? "public", camelCase) ===
						dbSchema.name
					);
				}),
		);
		const changesets: Changeset[] = [];

		for (const schema of schemasToDrop) {
			const diff = {
				type: "REMOVE",
				path: ["schemaInfo", schema.name],
				oldValue: true,
			} satisfies DropSchemaDiff;
			const changeset = dropSchemaMigration(diff);
			changesets.push(changeset);
		}
		return changesets;
	});
}

function monolayerSchemasInDb() {
	return Effect.gen(function* () {
		const kysely = yield* devEnvirinmentDbClient("kyselyNoCamelCase");
		return yield* Effect.tryPromise(async () => {
			const dbManagedSchemas = await managedSchemas(kysely);
			return dbManagedSchemas;
		});
	});
}
