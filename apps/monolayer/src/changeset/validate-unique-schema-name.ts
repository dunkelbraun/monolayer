import { ActionError } from "@monorepo/base/errors.js";
import { Schema } from "@monorepo/pg/schema/schema.js";
import { appEnvironmentConfigurationSchemas } from "@monorepo/state/app-environment.js";
import { Effect } from "effect";

export function validateUniqueSchemaName() {
	return Effect.gen(function* () {
		const schemas = yield* appEnvironmentConfigurationSchemas;
		const uniqueSchemaNames = new Set();
		const schemaNames = schemas.map((schema) => Schema.info(schema).name);

		for (const schemaName of schemaNames) {
			if (uniqueSchemaNames.has(schemaName)) {
				return yield* Effect.fail(
					new ActionError(
						"Schema name error",
						`Multiple schemas with the same name: '${schemaName}'.`,
					),
				);
			} else {
				uniqueSchemaNames.add(schemaName);
			}
		}
		return yield* Effect.succeed(true);
	});
}
