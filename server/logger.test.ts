import {LogLevel, LogLevels, isLogLevel} from "./types";
import {ActivatableLoggerImpl} from "./logger";
import _ from "lodash";

class TestableLogger extends ActivatableLoggerImpl {
    private logs: any[][] = [];

    constructor(enabled?: boolean) {
        super();
        this.init(
            enabled === false ? false : true, // default is true
            (...args: any[]): void => this.doLog(...args)
        );
    }

    doLog(...args: any[]): void {
        this.logs.push(args);
    }

    getLogs(): any[][] {
        return this.logs;
    }
}

type ParsedLogEntry = {
    level: LogLevel,
    tags: string[],
    message: string,
    args: any[],
};

function parseLogEntry(logEntry: any[]): ParsedLogEntry {
    if (!logEntry.length) {
        throw new Error(
            `Empty log entry. Should always start with log message: ${logEntry}`
        );
    }
    
    const logMessage = logEntry[0];
    if (typeof logMessage !== "string") {
        throw new Error(
            `Expected log entry to start with string, but got: ${logMessage}`
        );
    } 

    const regexp = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} ([A-Z]+) - (\[[^\]]*\])? *(.*)$/;
    const groups = logMessage.match(regexp);
    if (groups === null || groups.length < 4) {
        throw new Error(
            `Malformed log message.\n\nExpected format: ${regexp}.\nGot: ${logMessage}`
        );
    }

    const level = groups[1].toLowerCase();
    if (!isLogLevel(level)) {
        throw new Error(
            `Unknown log level "${level}" in log message: ${logMessage}`
        );
    }

    const tagsStr = groups[2].substring(1, groups[2].length - 1);
    const tags = tagsStr ? _.split(tagsStr, ", ") : [];
    const message = groups[3];
    const args = logEntry.slice(1);

    return {
        level: level as LogLevel,
        tags, 
        message,
        args,
    };
}

function parseLogs(logs: any[][]): ParsedLogEntry[] {
    const parsedLogs: ParsedLogEntry[] = [];
    for (const logEntry of logs) {
        parsedLogs.push(parseLogEntry(logEntry));
    }
    return parsedLogs;
}

for (const level of LogLevels) {
    test(`should log single untagged ${level} message without parameters`, () => {
        // given
        const logger = new TestableLogger();

        // when
        logger.tag()[level]("message");

        // then
        expect(parseLogs(logger.getLogs())).toEqual([{
            level,
            tags: [],
            message: "message",
            args: [],
        }]);
    });

    test(`should log single tagged ${level} message without parameters`, () => {
        // given
        const logger = new TestableLogger();

        // when
        logger.tag("tag1", "tag2")[level]("message");

        // then
        expect(parseLogs(logger.getLogs())).toEqual([{
            level,
            tags: ["tag1", "tag2"],
            message: "message",
            args: [],
        }]);
    });

    test(`should log single tagged ${level} message with parameters`, () => {
        // given
        const logger = new TestableLogger();

        // when
        logger.tag("tag1", "tag2")[level]("message", 1, {}, [false]);

        // then
        expect(parseLogs(logger.getLogs())).toEqual([{
            level,
            tags: ["tag1", "tag2"],
            message: "message",
            args: [1, {}, [false]],
        }]);
    });

    test(`should escape tags for ${level} message without parameters`, () => {
        // given
        const logger = new TestableLogger();

        // when
        logger.tag("%s", "%d", "%f", "%o", "%")[level]("message");

        // then
        expect(parseLogs(logger.getLogs())).toEqual([{
            level,
            tags: ["%%s", "%%d", "%%f", "%%o", "%%"],
            message: "message",
            args: [],
        }]);
    });

    test(`should not escape ${level} message itself`, () => {
        // given
        const logger = new TestableLogger();

        // when
        logger.tag("tag")[level]("%s %d %f %o %%");

        // then
        expect(parseLogs(logger.getLogs())).toEqual([{
            level,
            tags: ["tag"],
            message: "%s %d %f %o %%",
            args: [],
        }]);
    }); 

    test(`should not escape ${level} message arguments`, () => {
        // given
        const logger = new TestableLogger();

        // when
        logger.tag("tag")[level]("message", 1, "%s", "%d", "%f", "%o", "%");

        // then
        expect(parseLogs(logger.getLogs())).toEqual([{
            level,
            tags: ["tag"],
            message: "message",
            args: [1, "%s", "%d", "%f", "%o", "%"],
        }]);
    }); 

    test(`should not log ${level} message on disabled logger`, () => {
        // given
        const logger = new TestableLogger(false);

        // when
        logger.tag("tag")[level]("message");

        // then
        expect(parseLogs(logger.getLogs())).toEqual([]);
    }); 
}

