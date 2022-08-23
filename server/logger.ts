import {
    isString,
    Logger,
    LoggingConfig,
    LogLevel,
    TaggedLogger,
} from "./types";
import moment from "moment";

export type LoggingFunction = (...args: unknown[]) => void;

// noinspection JSUnusedLocalSymbols
const noopTaggedLogger: TaggedLogger = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
    log(level: LogLevel, ...args: unknown[]): void {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
    debug(...args: unknown[]): void {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
    info(...args: unknown[]): void {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
    warn(...args: unknown[]): void {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
    error(...args: unknown[]): void {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
    profile(...args: unknown[]): void {},
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
                log(level: LogLevel, ...args: unknown[]): void {
                    const timeStr = moment().format("YYYY-MM-DD HH:mm:ss");
                    const levelStr = level.toUpperCase();
                    const tagsStr = tags ? "[" + tags.join(", ") + "]" : "";
                    const messagePrefix = `${timeStr} ${levelStr} - ${tagsStr}`;

                    // Make sure to only replace %s, etc. in real log message
                    // but not in tags.
                    const escapedMessagePrefix = messagePrefix.replace(
                        /%/g,
                        "%%"
                    );

                    let message = "";
                    if (args && isString(args[0])) {
                        message = args[0];
                        args.shift();
                    }

                    const logStr = message
                        ? `${escapedMessagePrefix} ${message}`
                        : escapedMessagePrefix;
                    loggingFunction(logStr, ...args);
                },
                debug(...args: unknown[]): void {
                    if (debug) {
                        this.log("debug", ...args);
                    }
                },
                info(...args: unknown[]): void {
                    this.log("info", ...args);
                },
                warn(...args: unknown[]): void {
                    this.log("warn", ...args);
                },
                error(...args: unknown[]): void {
                    this.log("error", ...args);
                },
                profile(...args: unknown[]): void {
                    if (profile) {
                        this.log("profile", ...args);
                    }
                },
            };
        } else {
            return noopTaggedLogger;
        }
    }
}

export default new ActivatableLoggerImpl() as ActivatableLogger;
