import {isString, Logger, LoggingConfig, LogLevel, TaggedLogger} from './types';
import moment from 'moment';

export type LoggingFunction = (...args: any[]) => void;

const noopTaggedLogger: TaggedLogger = {
    log(_level: LogLevel, ..._args: any[]): void {},
    debug(..._args: any[]): void {},
    info(..._args: any[]): void {},
    warn(..._args: any[]): void {},
    error(..._args: any[]): void {},
    profile(..._args: any[]): void {},
};

export interface ActivatableLogger extends Logger {
    init(config: LoggingConfig, loggingFunction?: LoggingFunction): void;
}

/**
 * TODO: Check if LoggingConfig.debug and LoggingConfig.profile are handled.
 */
export class ActivatableLoggerImpl implements ActivatableLogger {
    private config: LoggingConfig = new LoggingConfig(false, false, false);
    private loggingFunction: LoggingFunction = console.info;

    init(config: LoggingConfig, loggingFunction?: LoggingFunction): void {
        this.config = config;
        this.loggingFunction = loggingFunction || console.info;
    }

    tag(...tags: string[]): TaggedLogger {
        if (this.config.enabled) {
            const debug = this.config.debug;
            const profile = this.config.profile;
            const loggingFunction = this.loggingFunction;
            return {
                log(level: LogLevel, ...args: any[]): void {
                    const timeStr = moment().format('YYYY-MM-DD HH:mm:ss');
                    const levelStr = level.toUpperCase();
                    const tagsStr = tags ? '[' + tags.join(', ') + ']' : '';
                    const messagePrefix = `${timeStr} ${levelStr} - ${tagsStr}`;

                    // Make sure to only replace %s, etc. in real log message
                    // but not in tags.
                    const escapedMessagePrefix = messagePrefix.replace(/%/g, '%%');

                    let message = '';
                    if (args && isString(args[0])) {
                        message = args[0];
                        args.shift();
                    }

                    const logStr = message
                        ? `${escapedMessagePrefix} ${message}`
                        : escapedMessagePrefix;
                    loggingFunction(logStr, ...args);
                },
                debug(...args: any[]): void {
                    if (debug) {
                        this.log('debug', ...args);
                    }
                },
                info(...args: any[]): void {
                    this.log('info', ...args);
                },
                warn(...args: any[]): void {
                    this.log('warn', ...args);
                },
                error(...args: any[]): void {
                    this.log('error', ...args);
                },
                profile(...args: any[]): void {
                    if (profile) {
                        this.log('profile', ...args);
                    }
                },
            }
        } else {
            return noopTaggedLogger;
        }
    }
}

export default new ActivatableLoggerImpl() as ActivatableLogger;
