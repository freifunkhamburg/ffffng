'use strict';

var async = require('async');
var fs = require('fs');
var glob = require('glob');
var path = require('path');

var config = require('../config');
var Logger = require('../logger');

function applyPatch(db, file, callback) {
    Logger.tag('database', 'migration').info('Checking if patch need to be applied: %s', file);

    fs.readFile(file, function (err, contents) {
        if (err) {
            return callback(err);
        }

        var version = path.basename(file, '.sql');

        db.get('SELECT * FROM schema_version WHERE version = ?', version, function (err, row) {
            if (err) {
                return callback(err);
            }

            if (row) {
                // patch is already applied. skip!
                Logger.tag('database', 'migration').info('Patch already applied, skipping: %s', file);
                return callback(null);
            }

            var sql = 'BEGIN TRANSACTION;\n'
                    + contents.toString() + '\n'
                    + 'INSERT INTO schema_version (version) VALUES (\'' + version + '\');\n'
                    + 'END TRANSACTION;';

            db.exec(sql, function (err) {
                if (err) {
                    return callback(err);
                }

                Logger.tag('database', 'migration').info('Patch successfully applied: %s', file);

                callback(null);
            });
        });
    });
}

function applyMigrations(db, callback) {
    Logger.tag('database', 'migration').info('Migrating database...');

    var sql = 'BEGIN TRANSACTION; CREATE TABLE IF NOT EXISTS schema_version (\n'
            + '    version VARCHAR(255) PRIMARY KEY ASC,\n'
            + '    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL\n'
            + '); END TRANSACTION;';
    db.exec(sql, function (err) {
        if (err) {
            return callback(err);
        }

        glob(__dirname + '/patches/*.sql', function (err, files) {
            if (err) {
                return callback(err);
            }

            async.eachSeries(
                files,
                function (file, fileCallback) {
                    applyPatch(db, file, fileCallback);
                },
                callback
            );
        });
    });
}

module.exports = {
    init: function (callback) {
        var SQLite3 = require('sqlite3');

        var file = config.server.databaseFile;
        Logger.tag('database').info('Setting up database: %s', file);

        var db;
        try {
            db = new SQLite3.Database(file);
        }
        catch (error) {
            Logger.tag('database').error('Error initialzing database:', error);
            throw error;
        }

        applyMigrations(db, function (err) {
            if (err) {
                Logger.tag('database').error('Error migrating database:', err);
                throw err;
            }

            angular.module('ffffng').factory('Database', function () {
                return db;
            });

            callback();
        });
    }
};
