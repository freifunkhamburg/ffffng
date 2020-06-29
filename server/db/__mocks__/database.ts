import {Database, Statement} from "sqlite";

export async function init(): Promise<void> {}

export class MockStatement implements Statement {
    constructor() {}

    readonly changes: number = 0;
    readonly lastID: number = 0;
    readonly sql: string = "";

    async all(): Promise<any[]>;
    async all(...params: any[]): Promise<any[]>;
    async all<T>(): Promise<T[]>;
    async all<T>(...params: any[]): Promise<T[]>;
    all(...params: any[]): any {
    }

    async bind(): Promise<Statement>;
    async bind(...params: any[]): Promise<Statement>;
    async bind(...params: any[]): Promise<Statement> {
        return mockStatement();
    }

    async each(callback?: (err: Error, row: any) => void): Promise<number>;
    async each(...params: any[]): Promise<number>;
    async each(...callback: (((err: Error, row: any) => void) | any)[]): Promise<number> {
        return 0;
    }

    async finalize(): Promise<void> {}

    get(): Promise<any>;
    get(...params: any[]): Promise<any>;
    get<T>(): Promise<T>;
    get<T>(...params: any[]): Promise<T>;
    get(...params: any[]): any {
    }

    async reset(): Promise<Statement> {
        return mockStatement();
    }

    async run(): Promise<Statement>;
    async run(...params: any[]): Promise<Statement>;
    async run(...params: any[]): Promise<Statement> {
        return mockStatement();
    }
}

function mockStatement(): Statement {
    return new MockStatement();
}

export class MockDatabase implements Database {
    constructor() {}

    async close(): Promise<void> {}

    async run(...args: any): Promise<Statement> {
        return mockStatement();
    }

    async get(...args: any): Promise<any> {}

    async all(...args: any): Promise<any[]> {
        return [];
    }

    async exec(...args: any): Promise<Database> {
        return this;
    }

    async each(...args: any): Promise<number> {
        return 0;
    }

    async prepare(...args: any): Promise<Statement> {
        return mockStatement();
    }

    configure(...args: any): void {}

    async migrate(...args: any): Promise<Database> {
        return this;
    }

    on(...args: any): void {}
}

export const db: MockDatabase = new MockDatabase();

export {Database, Statement}
