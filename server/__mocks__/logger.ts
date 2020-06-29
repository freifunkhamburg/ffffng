import {Logger, TaggedLogger} from "../types";

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'profile';

export type MockLogMessages = any[][];
type TaggedLogMessages = {
    tags: {[key: string]: TaggedLogMessages},
    logs: {[key: string]: MockLogMessages}
}

export class MockLogger implements Logger {
    private taggedLogMessages: TaggedLogMessages = MockLogger.emptyTaggedLogMessages();

    constructor() {}

    private static emptyTaggedLogMessages(): TaggedLogMessages {
        return {
            tags: {},
            logs: {}
        };
    }

    reset(): void {
        this.taggedLogMessages = MockLogger.emptyTaggedLogMessages();
    }

    getMessages(level: LogLevel, ...tags: string[]): MockLogMessages {
        let taggedLogMessages = this.taggedLogMessages;
        for (const tag of tags) {
            if (!taggedLogMessages.tags[tag]) {
                return [];
            }

            taggedLogMessages = taggedLogMessages.tags[tag];
        }

        return taggedLogMessages.logs[level] || [];
    }

    init(): void {}

    private doLog(taggedLogMessages: TaggedLogMessages, level: LogLevel, tags: string[], args: any[]): void {
        if (tags.length > 0) {
            const tag = tags[0];
            const remainingTags = tags.slice(1);
            const subTaggedLogsMessages: TaggedLogMessages =
                taggedLogMessages.tags[tag] || MockLogger.emptyTaggedLogMessages();
            this.doLog(subTaggedLogsMessages, level, remainingTags, args);
            taggedLogMessages.tags[tag] = subTaggedLogsMessages;

        } else {
            const logMessages: MockLogMessages = taggedLogMessages.logs[level] || [];
            logMessages.push(args);
            taggedLogMessages.logs[level] = logMessages;
        }
    }

    private log(level: LogLevel, tags: string[], args: any[]): void {
        this.doLog(this.taggedLogMessages, level, tags, args);
    }

    tag(...tags: string[]): TaggedLogger {
        return {
            debug: (...args: any[]): void => this.log('debug', tags, args),
            info: (...args: any[]): void => this.log('info', tags, args),
            warn: (...args: any[]): void => this.log('warn', tags, args),
            error: (...args: any[]): void => this.log('error', tags, args),
            profile: (...args: any[]): void => this.log('profile', tags, args),
        }
    }
}

export default new MockLogger();
