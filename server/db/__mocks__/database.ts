import {RunResult, SqlType, Statement, TypedDatabase} from "../database";
import * as sqlite3 from "sqlite3";

export async function init(): Promise<void> {
}

export class MockDatabase implements TypedDatabase {
    constructor() {
    }

    async on(event: string, listener: any): Promise<void> {
    }

    async run(sql: SqlType, ...params: any[]): Promise<RunResult> {
        return {
            stmt: new Statement(new sqlite3.Statement()),
        };
    }

    async get<T = any>(sql: SqlType, ...params: any[]): Promise<T | undefined> {
        return undefined;
    }

    async each<T = any>(sql: SqlType, callback: (err: any, row: T) => void): Promise<number>;
    async each<T = any>(sql: SqlType, param1: any, callback: (err: any, row: T) => void): Promise<number>;
    async each<T = any>(sql: SqlType, param1: any, param2: any, callback: (err: any, row: T) => void): Promise<number>;
    async each<T = any>(sql: SqlType, param1: any, param2: any, param3: any, callback: (err: any, row: T) => void): Promise<number>;
    async each<T = any>(sql: SqlType, ...params: any[]): Promise<number>;
    async each(sql: SqlType, ...callback: (any)[]): Promise<number> {
        return 0;
    }

    async all<T>(sql: SqlType, ...params: any[]): Promise<T[]> {
        return [];
    }

    async exec(sql: SqlType, ...params: any[]): Promise<void> {
    }


    async prepare(sql: SqlType, ...params: any[]): Promise<Statement> {
        return new Statement(new sqlite3.Statement());
    }
}

export const db: MockDatabase = new MockDatabase();

export {TypedDatabase, Statement}
