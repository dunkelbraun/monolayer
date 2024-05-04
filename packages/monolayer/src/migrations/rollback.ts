import * as p from "@clack/prompts";
import { Effect } from "effect";
import { NO_MIGRATIONS, type MigrationInfo } from "kysely";
import path from "path";
import {
	migrationInfoToMigration,
	type Migration,
} from "~/migrations/migration.js";
import {
	confirmDeletePendingMigrationsPrompt,
	confirmRollbackPrompt,
	confirmRollbackWithScaffoldedMigrationsPrompt,
	rollbackMigrationPrompt,
} from "~/prompts/rollback-migration.js";
import { Environment } from "~/services/environment.js";
import { cancelOperation } from "../cli/cancel-operation.js";
import { ExitWithSuccess } from "../cli/cli-action.js";
import { migrateTo } from "./apply.js";
import { allMigrations } from "./migration.js";
import { deletePendingMigrations, pendingMigrations } from "./pending.js";

export function rollback() {
	return Effect.gen(function* () {
		const executedMigrations = yield* executedMigrationsWithCheck();

		if (executedMigrations.length === 0) {
			p.log.info("Nothing to rollback.");
			return yield* Effect.succeed(true);
		}

		p.log.info(`You have ${executedMigrations.length} migrations applied.`);
		const promptResult = yield* promptRollback(executedMigrations, 10);

		yield* confirmRollback(promptResult.migrationNames);

		yield* confirmRollbackWithScafoldedMigrations(
			migrationInfoToMigration(executedMigrations),
		);

		const migration = yield* migrateTo(promptResult.downTo);
		if (!migration) {
			return yield* Effect.succeed(false);
		}

		p.log.info("Pending migrations after rollback:");

		yield* pendingMigrations();

		if (yield* confirmDelete()) {
			yield* nameAndPath(
				executedMigrations.filter((r) =>
					promptResult.migrationNames.includes(r.name),
				),
			).pipe(Effect.tap(deletePendingMigrations));
		}
		yield* Effect.succeed(true);
	});
}

function executedMigrationsWithCheck() {
	return allMigrations().pipe(
		Effect.flatMap((migrations) => {
			if (migrations.length === 0) {
				p.log.warn("Nothing to squash. There are no migrations.");
				return Effect.fail(new ExitWithSuccess({ cause: "No migraitons" }));
			}

			return Effect.succeed(
				migrations.filter((m) => m.executedAt !== undefined),
			);
		}),
	);
}

function confirmRollback(migrations: string[]) {
	return Effect.tryPromise(() => confirmRollbackPrompt(migrations)).pipe(
		Effect.flatMap((proceedWithSquash) => {
			if (typeof proceedWithSquash === "symbol" || !proceedWithSquash) {
				return cancelOperation();
			}
			return Effect.succeed(true);
		}),
	);
}

function confirmDelete() {
	return Effect.gen(function* () {
		const confirm = yield* Effect.tryPromise(() =>
			confirmDeletePendingMigrationsPrompt(),
		);
		if (typeof confirm === "symbol") {
			yield* cancelOperation();
		}
		assertBoolean(confirm);
		return confirm;
	});
}

function assertBoolean(value: unknown): asserts value is boolean {
	true;
}

function migrationsForPrompt(
	migrations: readonly MigrationInfo[],
	limit: number,
) {
	const migrationValues = migrations.map((m) => {
		return {
			value: m.name,
		};
	});
	migrationValues.unshift({
		value: `rollback all migrations (${migrations.length})`,
	});
	migrationValues.pop();
	return migrationValues.slice(-limit);
}

function promptRollback(migrations: readonly MigrationInfo[], limit: number) {
	return Effect.gen(function* () {
		const migration = yield* Effect.tryPromise(() =>
			rollbackMigrationPrompt(migrationsForPrompt(migrations, limit)),
		);
		if (typeof migration === "symbol") {
			yield* cancelOperation();
		}
		const findMigrationIndex = migrations.findIndex(
			(m) => m.name === migration,
		);
		const migrationNames = migrations
			.slice(findMigrationIndex == -1 ? 0 : findMigrationIndex + 1)
			.map((m) => m.name);
		return {
			migrationNames,
			downTo:
				findMigrationIndex === -1
					? NO_MIGRATIONS
					: migrations[findMigrationIndex]!.name,
		};
	});
}

function confirmRollbackWithScafoldedMigrations(
	migrations: Required<Migration>[],
) {
	return Effect.gen(function* () {
		if (migrations.every((r) => !r.scaffold)) {
			return;
		}
		const scaffoldedMigrations = migrations
			.filter((r) => r.scaffold)
			.map((r) => r.name!);
		return yield* Effect.tryPromise(() =>
			confirmRollbackWithScaffoldedMigrationsPrompt(scaffoldedMigrations),
		).pipe(
			Effect.flatMap((proceedWithSquash) => {
				if (typeof proceedWithSquash === "symbol" || !proceedWithSquash) {
					return cancelOperation();
				}
				return Effect.succeed(true);
			}),
		);
	});
}

function nameAndPath(migrations: MigrationInfo[]) {
	return Effect.gen(function* () {
		const env = yield* Environment;
		return migrations.map((rev) => ({
			name: rev.name,
			path: path.join(env.schemaMigrationsFolder, `${rev.name}.ts`),
		}));
	});
}
