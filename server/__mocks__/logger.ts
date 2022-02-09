import {Logger, TaggedLogger, LogLevel} from '../types';
import {ActivatableLogger} from '../logger';

export type MockLogMessages = any[][];
type TaggedLogMessages = {
    tags: {[key: string]: TaggedLogMessages},
    logs: {[key: string]: MockLogMessages}
}

export class MockLogger implements ActivatableLogger {
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

    init(...args: any[]): void {}

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

    tag(...tags: string[]): TaggedLogger {
        const logger: MockLogger = this;
        return {
            log(level: LogLevel, ...args: any[]): void {
                logger.doLog(logger.taggedLogMessages, level, tags, args);
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
    }
}

export default new MockLogger();
