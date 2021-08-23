import {Logger, TaggedLogger} from "./types";

function procConsole() {
    // @ts-ignore
    return process.console;
}

const noopTaggedLogger: TaggedLogger = {
    debug(...args: any): void {},
    info(...args: any): void {},
    warn(...args: any): void {},
    error(...args: any): void {},
    profile(...args: any): void {},
};

class ActivatableLogger implements Logger {
    private enabled: boolean = false;

    init(): void {
        const app = require('./app').app;
        const config = require('./config').config;

        const enabled = config.server.logging.enabled;
        this.enabled = enabled;

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

        function addLogger(name: string, color: string, active: boolean) {
            if (enabled && active) {
                procConsole().addLogger(name, color, {
                    logInConsole: false
                });
            } else {
                // @ts-ignore
                procConsole()[name] = function () {
                    this._reset(); // forget tags, etc. for this logging event
                };
            }
        }

        addLogger('debug', 'grey', config.server.logging.debug);
        addLogger('profile', 'blue', config.server.logging.profile);

        if (enabled && config.server.logging.logRequests) {
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
                const alt: {[key: string]: any} = {};
                const storeKey = (key: string)  => {
                    alt[key] = this[key];
                };
                Object.getOwnPropertyNames(this).forEach(storeKey, this);
                return alt;
            }
        });

        // @ts-ignore
        for (const key of Object.keys(procConsole())) {
            // @ts-ignore
            module.exports[key] = enabled ? procConsole()[key] : (...args: any) => {};
        }
    }

    tag(...tags: any): TaggedLogger {
        if (this.enabled) {
            return {
                debug(...args: any): void {
                    procConsole().tag(...tags).debug(...args);
                },
                info(...args: any): void {
                    procConsole().tag(...tags).info(...args);
                },
                warn(...args: any): void {
                    procConsole().tag(...tags).warn(...args);
                },
                error(...args: any): void {
                    procConsole().tag(...tags).error(...args);
                },
                profile(...args: any): void {
                    procConsole().tag(...tags).profile(...args);
                },
            }
        } else {
            return noopTaggedLogger;
        }
    }
}

export default new ActivatableLogger() as Logger;
