import { RunResult, SqlType, Statement, TypedDatabase } from "../../types";
import * as sqlite3 from "sqlite3";

export async function init(): Promise<void> {
    return;
}

export class MockDatabase implements TypedDatabase {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async on(event: string, listener: unknown): Promise<void> {
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async run(sql: SqlType, ...params: unknown[]): Promise<RunResult> {
        return {
            stmt: new Statement(new sqlite3.Statement()),
        };
    }

    async get<T = unknown>(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        sql: SqlType,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ...params: unknown[]
    ): Promise<T | undefined> {
        return undefined;
    }

    async each<T = unknown>(
        sql: SqlType,
        callback: (err: unknown, row: T) => void
    ): Promise<number>;
    async each<T = unknown>(
        sql: SqlType,
        param1: unknown,
        callback: (err: unknown, row: T) => void
    ): Promise<number>;
    async each<T = unknown>(
        sql: SqlType,
        param1: unknown,
        param2: unknown,
        callback: (err: unknown, row: T) => void
    ): Promise<number>;
    async each<T = unknown>(
        sql: SqlType,
        param1: unknown,
        param2: unknown,
        param3: unknown,
        callback: (err: unknown, row: T) => void
    ): Promise<number>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async each<T = unknown>(
        sql: SqlType,
        ...params: unknown[]
    ): Promise<number>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async each(sql: SqlType, ...callback: unknown[]): Promise<number> {
        return 0;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async all<T>(sql: SqlType, ...params: unknown[]): Promise<T[]> {
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async exec(sql: SqlType, ...params: unknown[]): Promise<void> {
        return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async prepare(sql: SqlType, ...params: unknown[]): Promise<Statement> {
        return new Statement(new sqlite3.Statement());
    }
}

export const db: MockDatabase = new MockDatabase();

export { TypedDatabase, Statement };
