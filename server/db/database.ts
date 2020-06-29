import util from "util";
import fs from "graceful-fs";
import glob from "glob";
import path from "path";
import {config} from "../config";
import Logger from "../logger";
import sqlite, {Database, Statement} from "sqlite";

const pglob = util.promisify(glob);
const pReadFile = util.promisify(fs.readFile);

async function applyPatch(db: sqlite.Database, file: string): Promise<void> {
    Logger.tag('database', 'migration').info('Checking if patch need to be applied: %s', file);

    const contents = await pReadFile(file);
    const version = path.basename(file, '.sql');

    const row = await db.get('SELECT * FROM schema_version WHERE version = ?', version);
    if (row) {
        // patch is already applied. skip!
        Logger.tag('database', 'migration').info('Patch already applied, skipping: %s', file);
        return
    }

    const sql = 'BEGIN TRANSACTION;\n' +
              contents.toString() + '\n' +
              'INSERT INTO schema_version (version) VALUES (\'' + version + '\');\n' +
              'END TRANSACTION;';

    await db.exec(sql);

    Logger.tag('database', 'migration').info('Patch successfully applied: %s', file);
}

async function applyMigrations(db: sqlite.Database): Promise<void> {
    Logger.tag('database', 'migration').info('Migrating database...');

    const sql = 'BEGIN TRANSACTION; CREATE TABLE IF NOT EXISTS schema_version (\n' +
              '    version VARCHAR(255) PRIMARY KEY ASC,\n' +
              '    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL\n' +
              '); END TRANSACTION;';

    await db.exec(sql);

    const files = await pglob(__dirname + '/patches/*.sql');
    for (const file of files) {
        await applyPatch(db, file)
    }
}

const dbPromise = new Promise<Database>((resolve, reject) => {
    sqlite.open(config.server.databaseFile)
        .then(resolve)
        .catch(reject);
});

export async function init(): Promise<void> {
    Logger.tag('database').info('Setting up database: %s', config.server.databaseFile);

    let db: Database;
    try {
        db = await dbPromise;
    }
    catch (error) {
        Logger.tag('database').error('Error initialzing database:', error);
        throw error;
    }

    db.on('profile', (sql, time) => Logger.tag('database').profile('[%sms]\t%s', time, sql));

    try {
        await applyMigrations(db);
    }
    catch (error) {
        Logger.tag('database').error('Error migrating database:', error);
        throw error;
    }
}

/**
 * Wrapper around a Promise<Database> providing the same interface as the Database itself.
 */
class DatabasePromiseWrapper implements Database {
    constructor(private db: Promise<Database>) {
        db.catch(err => {
            Logger.tag('database', 'init').error('Error initializing database: ', err);
            process.exit(1);
        });
    }

    async close() {
        const db = await this.db;
        // @ts-ignore
        return await db.close.apply(db, arguments);
    }

    async run() {
        const db = await this.db;
        // @ts-ignore
        return await db.run.apply(db, arguments);
    }

    async get() {
        const db = await this.db;
        // @ts-ignore
        return await db.get.apply(db, arguments);
    }

    async all() {
        const db = await this.db;
        // @ts-ignore
        return await db.all.apply(db, arguments);
    }

    async exec() {
        const db = await this.db;
        // @ts-ignore
        return await db.exec.apply(db, arguments);
    }

    async each() {
        const db = await this.db;
        // @ts-ignore
        return await db.each.apply(db, arguments);
    }

    async prepare() {
        const db = await this.db;
        // @ts-ignore
        return await db.prepare.apply(db, arguments);
    }

    async configure() {
        const db = await this.db;
        // @ts-ignore
        return await db.configure.apply(db, arguments);
    }

    async migrate() {
        const db = await this.db;
        // @ts-ignore
        return await db.migrate.apply(db, arguments);
    }

    async on() {
        const db = await this.db;
        // @ts-ignore
        return await db.on.apply(db, arguments);
    }
}

export const db: Database = new DatabasePromiseWrapper(dbPromise);
export {Database, Statement};
