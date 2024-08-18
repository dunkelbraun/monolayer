import { confirm } from "@clack/prompts";
import { cancelOperation } from "@monorepo/base/programs/cancel-operation.js";
import { ChangesetPhase } from "@monorepo/pg/changeset/types.js";
import { localPendingSchemaMigrations } from "@monorepo/programs/migrations/local-pending.js";
import { logPendingMigrations } from "@monorepo/programs/migrations/log-pending-migrations.js";
import { Effect } from "effect";
import { unlinkSync } from "fs";
import color from "picocolors";

export const handlePendingSchemaMigrations = Effect.gen(function* () {
	const localPending = yield* localPendingSchemaMigrations;
	if (localPending.length == 0) return true;

	yield* logPendingMigrations;

	if (yield* askConfirmationDelete) {
		yield* deletePendingMigrations(localPending);
	} else {
		yield* cancelOperation();
	}
});

const askConfirmationDelete = Effect.gen(function* () {
	const promptConfirm = yield* Effect.tryPromise(() =>
		confirm({
			initialValue: false,
			message: `You have pending schema migrations to apply and ${color.bold(
				"we need to delete them to continue",
			)}. Do you want to proceed?`,
		}),
	);
	return promptConfirm === true;
});

interface PendingMigration {
	name: string;
	path: string;
}

export function deletePendingMigrations(pendingMigrations: PendingMigration[]) {
	return Effect.gen(function* () {
		for (const migration of pendingMigrations) {
			unlinkSync(migration.path);
		}
		return yield* Effect.succeed(true);
	});
}

export function checkNoPendingMigrations(phases: ChangesetPhase[]) {
	return Effect.gen(function* () {
		let noPending = true;
		yield* logPendingMigrations;
		const pendingPhases: ChangesetPhase[] = [];
		const pendingByPhase = yield* localPendingSchemaMigrationsByPhase;
		for (const phase of phases) {
			if (pendingByPhase[phase].length !== 0) {
				noPending = false;
				pendingPhases.push(phase);
			}
		}
		return [noPending, pendingPhases] as [boolean, ChangesetPhase[]];
	});
}

const localPendingSchemaMigrationsByPhase = Effect.gen(function* () {
	const localPending = yield* localPendingSchemaMigrations;
	const initial: Record<
		ChangesetPhase,
		{
			name: string;
			path: string;
			phase: ChangesetPhase;
		}[]
	> = {
		[`${ChangesetPhase.Expand}`]: [],
		[`${ChangesetPhase.Alter}`]: [],
		[`${ChangesetPhase.Contract}`]: [],
		[`${ChangesetPhase.Data}`]: [],
	};
	return localPending.reduce((acc, pending) => {
		acc[pending.phase].push(pending);
		return acc;
	}, initial);
});
