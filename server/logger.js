'use strict';

const app = require('./app');
const config = require('./config').config;

// Hack to allow proper logging of Error.
Object.defineProperty(Error.prototype, 'message', {
    configurable: true,
    enumerable: true
});
Object.defineProperty(Error.prototype, 'stack', {
    configurable: true,
    enumerable: true
});


const scribe = require('scribe-js')({
    rootPath: config.server.logging.directory,
});

function addLogger(name, color, active) {
    if (active) {
        process.console.addLogger(name, color, {
            logInConsole: false
        });
    } else {
        process.console[name] = function () {
            this._reset(); // forget tags, etc. for this logging event
        };
    }
}

addLogger('debug', 'grey', config.server.logging.debug);
addLogger('profile', 'blue', config.server.logging.profile);

if (config.server.logging.logRequests) {
    app.use(scribe.express.logger());
}
if (config.server.internal.active) {
    const prefix = config.server.rootPath === '/' ? '' : config.server.rootPath;
    app.use(prefix + '/internal/logs', scribe.webPanel());
}

// Hack to allow correct logging of node.js Error objects.
// See: https://github.com/bluejamesbond/Scribe.js/issues/70
Object.defineProperty(Error.prototype, 'toJSON', {
    configurable: true,
    value: function () {
        const alt = {};
        const storeKey = function (key) {
            alt[key] = this[key];
        };
        Object.getOwnPropertyNames(this).forEach(storeKey, this);
        return alt;
    }
});

module.exports = process.console;
