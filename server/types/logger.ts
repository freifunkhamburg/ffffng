export interface TaggedLogger {
    debug(...args: any[]): void;
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    profile(...args: any[]): void;
}

export interface Logger {
    init(): void;
    tag(...tags: string[]): TaggedLogger;
}
