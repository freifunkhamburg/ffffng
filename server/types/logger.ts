export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'profile';
export const LogLevels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'profile'];

export function isLogLevel(arg: any): arg is LogLevel {
    if (typeof arg !== "string") {
        return false;
    }
    for (const level of LogLevels) {
        if (level === arg) {
            return true;
        }
    }
    return false;
}

export interface TaggedLogger {
    log(level: LogLevel, ...args: any[]): void;
    debug(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    profile(...args: any[]): void;
}

export interface Logger {
    tag(...tags: string[]): TaggedLogger;
}
