'use strict';

var async = require('async');
var fs = require('fs');
var glob = require('glob');
var path = require('path');

var config = require('../config');

function applyPatch(db, file, callback) {
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
                return callback(null);
            }

            var sql = 'BEGIN TRANSACTION;\n'
                    + contents.toString() + '\n'
                    + 'INSERT INTO schema_version (version) VALUES (\'' + version + '\');\n'
                    + 'END TRANSACTION;';

            db.exec(sql, callback);
        });
    });
}

function applyMigrations(db, callback) {
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

            async.each(
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
        var db = new SQLite3.Database(config.server.databaseFile);

        applyMigrations(db, function (err) {
            if (err) {
                throw err;
            }

            angular.module('ffffng').factory('Database', function () {
                return db;
            });

            callback();
        });
    }
};
