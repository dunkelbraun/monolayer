import { Effect } from "effect";
import { schemaChangeset } from "~/changeset/schema-changeset.js";
import { createSchemaChangeset } from "~/database/database_schemas/changeset.js";
import { schemaInDb } from "~/database/database_schemas/introspection.js";
import { type AnySchema } from "~/database/schema/schema.js";
import { type SchemaMigrationInfo } from "~/introspection/introspection.js";
import { DevEnvironment } from "../services/environment.js";
import {
	introspectSchemas,
	renameTablesInIntrospectedSchemas,
} from "./introspect-schemas.js";
import { schemaContext } from "./schema-context.js";
import { tableDiffPrompt } from "./table-diff-prompt.js";

export function changeset() {
	return connectorSchemas().pipe(
		Effect.flatMap((connectorSchema) =>
			Effect.all(connectorSchema.flatMap(changesetForLocalSchema)).pipe(
				Effect.flatMap((changesets) =>
					Effect.succeed(changesets.flatMap((changeset) => changeset)),
				),
			),
		),
	);
}

function changesetForLocalSchema(localSchema: AnySchema) {
	return schemaContext(localSchema).pipe(
		Effect.flatMap((context) =>
			introspectSchemas(context).pipe(
				Effect.flatMap(({ local, remote }) =>
					tableDiff(local, remote).pipe(
						Effect.flatMap((tableDiff) =>
							Effect.tryPromise(() => tableDiffPrompt(tableDiff)),
						),
						Effect.flatMap((tablesToRename) =>
							renameTablesInIntrospectedSchemas({
								...context,
								tablesToRename,
								remote,
							}),
						),
					),
				),
				Effect.flatMap(({ local, remote, tablesToRename }) =>
					Effect.succeed(
						schemaChangeset(
							local,
							remote,
							context.schemaName,
							context.camelCasePlugin,
							tablesToRename,
						),
					),
				),
				Effect.tap((changeset) =>
					Effect.tryPromise(() =>
						schemaInDb(context.kyselyInstance, context.schemaName),
					).pipe(
						Effect.flatMap((schemaInDatabase) =>
							Effect.succeed(schemaInDatabase.length !== 0),
						),
						Effect.tap((exists) => {
							if (exists === false) {
								changeset.unshift(createSchemaChangeset(context.schemaName));
							}
						}),
					),
				),
			),
		),
	);
}

function connectorSchemas() {
	return DevEnvironment.pipe(
		Effect.flatMap((environment) =>
			Effect.succeed(environment.connector.schemas),
		),
	);
}

function tableDiff(local: SchemaMigrationInfo, remote: SchemaMigrationInfo) {
	const localTables = Object.keys(local.table);
	const remoteTables = Object.keys(remote.table);
	return Effect.succeed({
		added: localTables.filter((table) => !remoteTables.includes(table)),
		deleted: remoteTables.filter((table) => !localTables.includes(table)),
	});
}
