import type { LogLevel, TaggedLogger } from "../types";
import type { ActivatableLogger } from "../logger";

export type MockLogMessages = unknown[][];
type TaggedLogMessages = {
    tags: { [key: string]: TaggedLogMessages };
    logs: { [key: string]: MockLogMessages };
};

export class MockLogger implements ActivatableLogger {
    private taggedLogMessages: TaggedLogMessages =
        MockLogger.emptyTaggedLogMessages();

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() {}

    private static emptyTaggedLogMessages(): TaggedLogMessages {
        return {
            tags: {},
            logs: {},
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

    // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
    init(...args: unknown[]): void {}

    private doLog(
        taggedLogMessages: TaggedLogMessages,
        level: LogLevel,
        tags: string[],
        args: unknown[]
    ): void {
        if (tags.length > 0) {
            const tag = tags[0];
            const remainingTags = tags.slice(1);
            const subTaggedLogsMessages: TaggedLogMessages =
                taggedLogMessages.tags[tag] ||
                MockLogger.emptyTaggedLogMessages();
            this.doLog(subTaggedLogsMessages, level, remainingTags, args);
            taggedLogMessages.tags[tag] = subTaggedLogsMessages;
        } else {
            const logMessages: MockLogMessages =
                taggedLogMessages.logs[level] || [];
            logMessages.push(args);
            taggedLogMessages.logs[level] = logMessages;
        }
    }

    tag(...tags: string[]): TaggedLogger {
        const doLog = this.doLog.bind(this);
        const taggedLogMessages = this.taggedLogMessages;
        return {
            log(level: LogLevel, ...args: unknown[]): void {
                doLog(taggedLogMessages, level, tags, args);
            },
            debug(...args: unknown[]): void {
                this.log("debug", ...args);
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
                this.log("profile", ...args);
            },
        };
    }
}

export default new MockLogger();
