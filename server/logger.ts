import {isString, Logger, LogLevel, TaggedLogger} from './types';
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
    init(enabled: boolean, loggingFunction?: LoggingFunction): void;
}

/**
 * TODO: Check if LoggingConfig.debug and LoggingConfig.profile are handled.
 */
export class ActivatableLoggerImpl implements ActivatableLogger {
    private enabled: boolean = false;
    private loggingFunction: LoggingFunction = console.info;

    init(enabled: boolean, loggingFunction?: LoggingFunction): void {
        this.enabled = enabled;
        this.loggingFunction = loggingFunction || console.info;
    }

    tag(...tags: string[]): TaggedLogger {
        if (this.enabled) {
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
                    this.log('debug', ...args);
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
                    this.log('profile', ...args);
                },
            }
        } else {
            return noopTaggedLogger;
        }
    }
}

export default new ActivatableLoggerImpl() as ActivatableLogger;
