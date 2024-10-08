import { appEnvironmentCamelCasePlugin } from "@monorepo/state/app-environment.js";
import { Context, Effect, Layer } from "effect";
import { gen } from "effect/Effect";
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { connectionOptions } from "~services/db-clients/connection-options.js";
import { databasePoolFromEnvironment } from "~services/pg-pool.js";

export type DbClientProperties = {
	readonly pgPool: pg.Pool;
	readonly pgAdminPool: pg.Pool;
	readonly databaseName: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly kysely: Kysely<any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly kyselyNoCamelCase: Kysely<any>;
};

export class DbClients extends Context.Tag("DbClients")<
	DbClients,
	DbClientProperties
>() {
	static readonly LiveLayer = Layer.effect(
		DbClients,
		gen(function* () {
			const connectionOpts = yield* connectionOptions;
			const pgPool = new pg.Pool({ connectionString: connectionOpts.app });
			const pgAdminPool = new pg.Pool({
				connectionString: connectionOpts.admin,
			});
			yield* Effect.addFinalizer(() =>
				Effect.gen(function* () {
					yield* Effect.promise(() => pgPool.end());
					yield* Effect.promise(() => pgAdminPool.end());
				}),
			);
			return {
				pgPool: pgPool,
				pgAdminPool: pgAdminPool,
				databaseName: connectionOpts.databaseName,
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				kysely: new Kysely<any>({
					dialect: new PostgresDialect({
						pool: pgPool,
					}),
					plugins:
						(yield* appEnvironmentCamelCasePlugin) === true
							? [new CamelCasePlugin()]
							: [],
				}),
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				kyselyNoCamelCase: new Kysely<any>({
					dialect: new PostgresDialect({
						pool: pgPool,
					}),
				}),
			};
		}),
	);

	static readonly TestLayer = (
		adminPool: pg.Pool,
		databaseName: string,
		camelCase = false,
	) => {
		const pool = databasePoolFromEnvironment(databaseName);
		return Layer.effect(
			DbClients,
			// eslint-disable-next-line require-yield
			Effect.gen(function* () {
				return {
					pgPool: pool,
					pgAdminPool: adminPool,
					databaseName,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					kysely: new Kysely<any>({
						dialect: new PostgresDialect({
							pool: pool,
						}),
						plugins: camelCase ? [new CamelCasePlugin()] : [],
					}),
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					kyselyNoCamelCase: new Kysely<any>({
						dialect: new PostgresDialect({
							pool: pool,
						}),
					}),
				};
			}),
		);
	};
}
