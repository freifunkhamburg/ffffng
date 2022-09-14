import util from "util";
import fs from "graceful-fs";
import glob from "glob";
import path from "path";
import { config } from "../config";
import Logger from "../logger";
import { Database, open, Statement } from "sqlite";
import * as sqlite3 from "sqlite3";
import type { RunResult, SqlType, TypedDatabase } from "../types";

const pglob = util.promisify(glob);
const pReadFile = util.promisify(fs.readFile);

/**
 * Typesafe database wrapper.
 *
 * @see Database
 */
class DatabasePromiseWrapper implements TypedDatabase {
    private db: Promise<Database>;

    constructor() {
        this.db = new Promise<Database>((resolve, reject) => {
            open({
                filename: config.server.databaseFile,
                driver: sqlite3.Database,
            })
                .then(resolve)
                .catch(reject);
        });
        this.db.catch((err) => {
            Logger.tag("database", "init").error(
                "Error initializing database: ",
                err
            );
            process.exit(1);
        });
    }

    async on(event: string, listener: unknown): Promise<void> {
        const db = await this.db;
        db.on(event, listener);
    }

    async run(sql: SqlType, ...params: unknown[]): Promise<RunResult> {
        const db = await this.db;
        return db.run(sql, ...params);
    }

    async get<T>(sql: SqlType, ...params: unknown[]): Promise<T | undefined> {
        const db = await this.db;
        return await db.get<T>(sql, ...params);
    }

    async each<T>(
        sql: SqlType,
        callback: (err: unknown, row: T) => void
    ): Promise<number>;
    async each<T>(
        sql: SqlType,
        param1: unknown,
        callback: (err: unknown, row: T) => void
    ): Promise<number>;
    async each<T>(
        sql: SqlType,
        param1: unknown,
        param2: unknown,
        callback: (err: unknown, row: T) => void
    ): Promise<number>;
    async each<T>(
        sql: SqlType,
        param1: unknown,
        param2: unknown,
        param3: unknown,
        callback: (err: unknown, row: T) => void
    ): Promise<number>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async each<T>(sql: SqlType, ...params: unknown[]): Promise<number> {
        const db = await this.db;
        return await db.each(sql, ...params);
    }

    async all<T>(sql: SqlType, ...params: unknown[]): Promise<T[]> {
        const db = await this.db;
        return await db.all<T[]>(sql, ...params);
    }

    async exec(sql: SqlType, ...params: unknown[]): Promise<void> {
        const db = await this.db;
        return await db.exec(sql, ...params);
    }

    async prepare(sql: SqlType, ...params: unknown[]): Promise<Statement> {
        const db = await this.db;
        return await db.prepare(sql, ...params);
    }
}

async function applyPatch(db: TypedDatabase, file: string): Promise<void> {
    Logger.tag("database", "migration").info(
        "Checking if patch need to be applied: %s",
        file
    );

    const contents = await pReadFile(file);
    const version = path.basename(file, ".sql");

    const row = await db.get(
        "SELECT * FROM schema_version WHERE version = ?",
        version
    );
    if (row) {
        // patch is already applied. skip!
        Logger.tag("database", "migration").info(
            "Patch already applied, skipping: %s",
            file
        );
        return;
    }

    const sql =
        "BEGIN TRANSACTION;\n" +
        contents.toString() +
        "\n" +
        "INSERT INTO schema_version (version) VALUES ('" +
        version +
        "');\n" +
        "END TRANSACTION;";

    await db.exec(sql);

    Logger.tag("database", "migration").info(
        "Patch successfully applied: %s",
        file
    );
}

async function applyMigrations(db: TypedDatabase): Promise<void> {
    Logger.tag("database", "migration").info("Migrating database...");

    const sql =
        "BEGIN TRANSACTION; CREATE TABLE IF NOT EXISTS schema_version (\n" +
        "    version VARCHAR(255) PRIMARY KEY ASC,\n" +
        "    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL\n" +
        "); END TRANSACTION;";

    await db.exec(sql);

    const files = await pglob(__dirname + "/patches/*.sql");
    for (const file of files) {
        await applyPatch(db, file);
    }
}

export const db: TypedDatabase = new DatabasePromiseWrapper();

export async function init(): Promise<void> {
    Logger.tag("database").info(
        "Setting up database: %s",
        config.server.databaseFile
    );
    await db.on("profile", (sql: string, time: number) =>
        Logger.tag("database").profile("[%sms]\t%s", time, sql)
    );

    try {
        await applyMigrations(db);
    } catch (error) {
        Logger.tag("database").error("Error migrating database:", error);
        throw error;
    }
}
