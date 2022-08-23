import { MockLogger } from "./logger";

test("should reset single message", () => {
    // given
    const logger = new MockLogger();

    // when
    logger.tag("test").debug("message");
    logger.reset();

    // then
    expect(logger.getMessages("debug", "test")).toEqual([]);
});

test("should reset multiple messages", () => {
    // given
    const logger = new MockLogger();

    // when
    logger.tag("test").debug("message 1");
    logger.tag("test").debug("message 2");
    logger.reset();

    // then
    expect(logger.getMessages("debug", "test")).toEqual([]);
});

test("should reset multiple nested messages", () => {
    // given
    const logger = new MockLogger();

    // when
    logger.tag("foo", "bar").debug("message 1");
    logger.tag("foo", "bar").debug("message 2");
    logger.tag("foo").debug("message 3");
    logger.tag("baz").debug("message 4");
    logger.tag("baz").debug("message 5");
    logger.reset();

    // then
    expect(logger.getMessages("debug", "foo", "bar")).toEqual([]);
    expect(logger.getMessages("debug", "foo")).toEqual([]);
    expect(logger.getMessages("debug", "baz")).toEqual([]);
});

test("should not get messages without logging", () => {
    // given
    const logger = new MockLogger();

    // then
    expect(logger.getMessages("debug")).toEqual([]);
    expect(logger.getMessages("debug", "foo")).toEqual([]);
    expect(logger.getMessages("debug", "foo", "bar")).toEqual([]);
});

test("should not get messages for no tag", () => {
    // given
    const logger = new MockLogger();

    // when
    logger.tag("test").debug("message");

    // then
    expect(logger.getMessages("debug")).toEqual([]);
});

test("should not get messages for wrong single tag", () => {
    // given
    const logger = new MockLogger();

    // when
    logger.tag("foo").debug("message");

    // then
    expect(logger.getMessages("debug", "bar")).toEqual([]);
});

test("should not get messages for wrong tags", () => {
    // given
    const logger = new MockLogger();

    // when
    logger.tag("foo", "bar").debug("message");

    // then
    expect(logger.getMessages("debug", "baz")).toEqual([]);
    expect(logger.getMessages("debug", "foo", "baz")).toEqual([]);
});

test("should not get messages for wrong level", () => {
    // given
    const logger = new MockLogger();

    // when
    logger.tag("foo", "bar").debug("message");

    // then
    expect(logger.getMessages("info", "foo", "bar")).toEqual([]);
});

test("should get messages for no tag", () => {
    // given
    const logger = new MockLogger();

    // when
    logger.tag().debug("message");

    // then
    expect(logger.getMessages("debug")).toEqual([["message"]]);
});

test("should get messages for single tag", () => {
    // given
    const logger = new MockLogger();

    // when
    logger.tag("test").debug("message");

    // then
    expect(logger.getMessages("debug", "test")).toEqual([["message"]]);
});

test("should get messages for multiple tags", () => {
    // given
    const logger = new MockLogger();

    // when
    logger.tag("foo", "bar").debug("message");

    // then
    expect(logger.getMessages("debug", "foo", "bar")).toEqual([["message"]]);
});

test("should get messages for correct tags", () => {
    // given
    const logger = new MockLogger();

    // when
    logger.tag("foo", "bar").debug("message 1");
    logger.tag("foo", "baz").debug("message 2");

    // then
    expect(logger.getMessages("debug", "foo", "bar")).toEqual([["message 1"]]);
});

test("should get multiple messages", () => {
    // given
    const logger = new MockLogger();

    // when
    logger.tag("foo", "bar").debug("message 1");
    logger.tag("foo", "bar").debug("message 2");

    // then
    expect(logger.getMessages("debug", "foo", "bar")).toEqual([
        ["message 1"],
        ["message 2"],
    ]);
});

test("should get complex message", () => {
    // given
    const logger = new MockLogger();

    // when
    logger.tag("foo", "bar").debug("message", 1, false, {});

    // then
    expect(logger.getMessages("debug", "foo", "bar")).toEqual([
        ["message", 1, false, {}],
    ]);
});
