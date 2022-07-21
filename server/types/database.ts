import {ISqlite, Statement} from "sqlite";

export type RunResult = ISqlite.RunResult;
export type SqlType = ISqlite.SqlType;

export {Statement};

export interface TypedDatabase {
    /**
     * @see Database.on
     */
    on(event: string, listener: any): Promise<void>;

    /**
     * @see Database.run
     */
    run(sql: SqlType, ...params: any[]): Promise<RunResult>;

    /**
     * @see Database.get
     */
    get<T>(sql: SqlType, ...params: any[]): Promise<T | undefined>;

    /**
     * @see Database.each
     */
    each<T>(sql: SqlType, callback: (err: any, row: T) => void): Promise<number>;

    each<T>(sql: SqlType, param1: any, callback: (err: any, row: T) => void): Promise<number>;

    each<T>(sql: SqlType, param1: any, param2: any, callback: (err: any, row: T) => void): Promise<number>;

    each<T>(sql: SqlType, param1: any, param2: any, param3: any, callback: (err: any, row: T) => void): Promise<number>;

    each<T>(sql: SqlType, ...params: any[]): Promise<number>;

    /**
     * @see Database.all
     */
    all<T = never>(sql: SqlType, ...params: any[]): Promise<T[]>;

    /**
     * @see Database.exec
     */
    exec(sql: SqlType, ...params: any[]): Promise<void>;

    /**
     * @see Database.prepare
     */
    prepare(sql: SqlType, ...params: any[]): Promise<Statement>;
}
