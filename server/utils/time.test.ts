import { parseTimestamp } from "./time";
import moment from "moment";

const TIMESTAMP_INVALID_STRING = "2020-01-02T42:99:23.000Z";
const TIMESTAMP_VALID_STRING = "2020-01-02T12:34:56.000Z";

test("parseTimestamp() should fail parsing non-string timestamp", () => {
    // given
    const timestamp = {};

    // when
    const parsedTimestamp = parseTimestamp(timestamp);

    // then
    expect(parsedTimestamp).toEqual(null);
});

test("parseTimestamp() should fail parsing empty timestamp string", () => {
    // given
    const timestamp = "";

    // when
    const parsedTimestamp = parseTimestamp(timestamp);

    // then
    expect(parsedTimestamp).toEqual(null);
});

test("parseTimestamp() should fail parsing invalid timestamp string", () => {
    // given
    // noinspection UnnecessaryLocalVariableJS
    const timestamp = TIMESTAMP_INVALID_STRING;

    // when
    const parsedTimestamp = parseTimestamp(timestamp);

    // then
    expect(parsedTimestamp).toEqual(null);
});

test("parseTimestamp() should succeed parsing valid timestamp string", () => {
    // given
    const timestamp = TIMESTAMP_VALID_STRING;

    // when
    const parsedTimestamp = parseTimestamp(timestamp);

    // then
    if (parsedTimestamp === null) {
        fail("timestamp should not be null");
    }
    expect(moment.unix(parsedTimestamp).toISOString()).toEqual(timestamp);
});
