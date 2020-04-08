import util from "util";
import fs from "graceful-fs";
import glob from "glob";
import path from "path";

import sqlite from "sqlite";
import sqlite3 from "sqlite3";

import {config} from "../config";
import Logger from "../logger";

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

export async function init(): Promise<void> {
    const file = config.server.databaseFile;
    Logger.tag('database').info('Setting up database: %s', file);

    let db: sqlite.Database;
    try {
        db = await sqlite.open(file);
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

    await db.close()
}

Logger.tag('database').info('Setting up legacy database: %s', config.server.databaseFile);

let legacyDB: sqlite3.Database;
try {
    legacyDB = new sqlite3.Database(config.server.databaseFile);
}
catch (error) {
    Logger.tag('database').error('Error initialzing legacy database lib:', error);
    throw error;
}

export const db = legacyDB;
