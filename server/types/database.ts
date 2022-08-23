import { ISqlite, Statement } from "sqlite";

export type RunResult = ISqlite.RunResult;
export type SqlType = ISqlite.SqlType;

export { Statement };

export interface TypedDatabase {
    /**
     * @see Database.on
     */
    on(event: string, listener: unknown): Promise<void>;

    /**
     * @see Database.run
     */
    run(sql: SqlType, ...params: unknown[]): Promise<RunResult>;

    /**
     * @see Database.get
     */
    get<T>(sql: SqlType, ...params: unknown[]): Promise<T | undefined>;

    /**
     * @see Database.each
     */
    each<T>(
        sql: SqlType,
        callback: (err: unknown, row: T) => void
    ): Promise<number>;

    each<T>(
        sql: SqlType,
        param1: unknown,
        callback: (err: unknown, row: T) => void
    ): Promise<number>;

    each<T>(
        sql: SqlType,
        param1: unknown,
        param2: unknown,
        callback: (err: unknown, row: T) => void
    ): Promise<number>;

    each<T>(
        sql: SqlType,
        param1: unknown,
        param2: unknown,
        param3: unknown,
        callback: (err: unknown, row: T) => void
    ): Promise<number>;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    each<T>(sql: SqlType, ...params: unknown[]): Promise<number>;

    /**
     * @see Database.all
     */
    all<T = never>(sql: SqlType, ...params: unknown[]): Promise<T[]>;

    /**
     * @see Database.exec
     */
    exec(sql: SqlType, ...params: unknown[]): Promise<void>;

    /**
     * @see Database.prepare
     */
    prepare(sql: SqlType, ...params: unknown[]): Promise<Statement>;
}
