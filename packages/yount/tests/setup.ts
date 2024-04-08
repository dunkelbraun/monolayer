import dotenv from "dotenv";
import { env } from "node:process";
import pg from "pg";
import type { GlobalThis } from "type-fest";
dotenv.config();

export type GlobalThisInTests = GlobalThis & {
	pool: pg.Pool | undefined;
	poolTwo: pg.Pool | undefined;
};

export function globalPool() {
	const globalTestThis = globalThis as GlobalThisInTests;

	if (globalTestThis.pool === undefined) {
		globalTestThis.pool = new pg.Pool({
			user: env.POSTGRES_USER,
			password: env.POSTGRES_PASSWORD,
			host: env.POSTGRES_HOST,
			port: Number(env.POSTGRES_ONE_PORT ?? 5432),
		});
	}
	return globalTestThis.pool;
}

export function globalPoolTwo() {
	const globalTestThis = globalThis as GlobalThisInTests;

	if (globalTestThis.poolTwo === undefined) {
		globalTestThis.poolTwo = new pg.Pool({
			user: env.POSTGRES_USER,
			password: env.POSTGRES_PASSWORD,
			host: env.POSTGRES_HOST,
			port: Number(env.POSTGRES_TWO_PORT ?? 5432),
		});
	}
	return globalTestThis.poolTwo;
}
