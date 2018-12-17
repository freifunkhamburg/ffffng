'use strict';

const util = require('util');
const fs = require('graceful-fs');
const glob = util.promisify(require('glob'));
const path = require('path');

const config = require('../config').config;
const Logger = require('../logger');

async function applyPatch(db, file) {
    Logger.tag('database', 'migration').info('Checking if patch need to be applied: %s', file);

    const contents = await util.promisify(fs.readFile)(file);
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

async function applyMigrations(db) {
    Logger.tag('database', 'migration').info('Migrating database...');

    const sql = 'BEGIN TRANSACTION; CREATE TABLE IF NOT EXISTS schema_version (\n' +
              '    version VARCHAR(255) PRIMARY KEY ASC,\n' +
              '    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL\n' +
              '); END TRANSACTION;';

    await db.exec(sql);

    const files = await glob(__dirname + '/patches/*.sql');
    for (const file of files) {
        await applyPatch(db, file)
    }
}

async function init() {
    const SQLite3 = require('sqlite3');

    const file = config.server.databaseFile;
    Logger.tag('database').info('Setting up database: %s', file);

    let db;
    try {
        db = new SQLite3.Database(file);
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

    module.exports.db = db;
}

module.exports = {
    init
};
