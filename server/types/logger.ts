export type LogLevel = "debug" | "info" | "warn" | "error" | "profile";
export const LogLevels: LogLevel[] = [
    "debug",
    "info",
    "warn",
    "error",
    "profile",
];

export function isLogLevel(arg: unknown): arg is LogLevel {
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
    log(level: LogLevel, ...args: unknown[]): void;
    debug(...args: unknown[]): void;
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
    profile(...args: unknown[]): void;
}

export interface Logger {
    tag(...tags: string[]): TaggedLogger;
}
