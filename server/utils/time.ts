import {DurationSeconds, UnixTimestampSeconds} from "../types";
import _ from "lodash";
import moment, {Moment} from "moment";

export function now(): UnixTimestampSeconds {
    return Math.round(Date.now() / 1000.0) as UnixTimestampSeconds;
}

export function subtract(timestamp: UnixTimestampSeconds, duration: DurationSeconds): UnixTimestampSeconds {
    return (timestamp - duration) as UnixTimestampSeconds;
}

const SECOND: DurationSeconds = 1 as DurationSeconds;
const MINUTE: DurationSeconds = (60 * SECOND) as DurationSeconds;
const HOUR: DurationSeconds = (60 * MINUTE) as DurationSeconds;
const DAY: DurationSeconds = (24 * HOUR) as DurationSeconds;
const WEEK: DurationSeconds = (7 * DAY) as DurationSeconds;

export function seconds(n: number): DurationSeconds {
    return (n * SECOND) as DurationSeconds;
}

export function minutes(n: number): DurationSeconds {
    return (n * MINUTE) as DurationSeconds;
}

export function hours(n: number): DurationSeconds {
    return (n * HOUR) as DurationSeconds;
}

export function days(n: number): DurationSeconds {
    return (n * DAY) as DurationSeconds;
}

export function weeks(n: number): DurationSeconds {
    return (n * WEEK) as DurationSeconds;
}

export function unix(moment: Moment): UnixTimestampSeconds {
    return moment.unix() as UnixTimestampSeconds;
}

export function formatTimestamp(timestamp: UnixTimestampSeconds): string {
    return moment.unix(timestamp).format();
}

export function parseTimestamp(timestamp: any): UnixTimestampSeconds | null {
    if (!_.isString(timestamp)) {
        return null;
    }
    const parsed = moment.utc(timestamp);
    if (!parsed.isValid()) {
        return null;
    }
    return unix(parsed);
}

