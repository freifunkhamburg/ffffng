import { ParsedNode, parseNode, parseNodesJson } from "./monitoringService";
import { Domain, MAC, OnlineState, Site, UnixTimestampSeconds } from "../types";
import Logger from "../logger";
import { MockLogger } from "../__mocks__/logger";
import { now, parseTimestamp } from "../utils/time";

const mockedLogger = Logger as MockLogger;

jest.mock("../logger");
jest.mock("../db/database");

const NODES_JSON_INVALID_VERSION = 1;
const NODES_JSON_VALID_VERSION = 2;

const TIMESTAMP_INVALID_STRING = "2020-01-02T42:99:23.000Z";
const TIMESTAMP_VALID_STRING = "2020-01-02T12:34:56.000Z";

const PARSED_TIMESTAMP_VALID = parseTimestamp(TIMESTAMP_VALID_STRING);
if (PARSED_TIMESTAMP_VALID === null) {
    fail("Should not happen: Parsed valid timestamp as invalid.");
}
const TIMESTAMP_VALID: UnixTimestampSeconds = PARSED_TIMESTAMP_VALID;

beforeEach(() => {
    mockedLogger.reset();
});

test("parseNode() should fail parsing node for undefined node data", () => {
    // given
    const importTimestamp = now();
    const nodeData = undefined;

    // then
    expect(() => parseNode(importTimestamp, nodeData)).toThrowError();
});

test("parseNode() should fail parsing node for empty node data", () => {
    // given
    const importTimestamp = now();
    const nodeData = {};

    // then
    expect(() => parseNode(importTimestamp, nodeData)).toThrowError();
});

test("parseNode() should fail parsing node for empty node info", () => {
    // given
    const importTimestamp = now();
    const nodeData = {
        nodeinfo: {},
    };

    // then
    expect(() => parseNode(importTimestamp, nodeData)).toThrowError();
});

test("parseNode() should fail parsing node for non-string node id", () => {
    // given
    const importTimestamp = now();
    const nodeData = {
        nodeinfo: {
            node_id: 42,
        },
    };

    // then
    expect(() => parseNode(importTimestamp, nodeData)).toThrowError();
});

test("parseNode() should fail parsing node for empty node id", () => {
    // given
    const importTimestamp = now();
    const nodeData = {
        nodeinfo: {
            node_id: "",
        },
    };

    // then
    expect(() => parseNode(importTimestamp, nodeData)).toThrowError();
});

test("parseNode() should fail parsing node for empty network info", () => {
    // given
    const importTimestamp = now();
    const nodeData = {
        nodeinfo: {
            node_id: "1234567890ab",
            network: {},
        },
    };

    // then
    expect(() => parseNode(importTimestamp, nodeData)).toThrowError();
});

test("parseNode() should fail parsing node for invalid mac", () => {
    // given
    const importTimestamp = now();
    const nodeData = {
        nodeinfo: {
            node_id: "1234567890ab",
            network: {
                mac: "xxx",
            },
        },
    };

    // then
    expect(() => parseNode(importTimestamp, nodeData)).toThrowError();
});

test("parseNode() should fail parsing node for missing flags", () => {
    // given
    const importTimestamp = now();
    const nodeData = {
        nodeinfo: {
            node_id: "1234567890ab",
            network: {
                mac: "12:34:56:78:90:ab",
            },
        },
    };

    // then
    expect(() => parseNode(importTimestamp, nodeData)).toThrowError();
});

test("parseNode() should fail parsing node for empty flags", () => {
    // given
    const importTimestamp = now();
    const nodeData = {
        nodeinfo: {
            node_id: "1234567890ab",
            network: {
                mac: "12:34:56:78:90:ab",
            },
        },
        flags: {},
    };

    // then
    expect(() => parseNode(importTimestamp, nodeData)).toThrowError();
});

test("parseNode() should fail parsing node for missing last seen timestamp", () => {
    // given
    const importTimestamp = now();
    const nodeData = {
        nodeinfo: {
            node_id: "1234567890ab",
            network: {
                mac: "12:34:56:78:90:ab",
            },
        },
        flags: {
            online: true,
        },
    };

    // then
    expect(() => parseNode(importTimestamp, nodeData)).toThrowError();
});

test("parseNode() should fail parsing node for invalid last seen timestamp", () => {
    // given
    const importTimestamp = now();
    const nodeData = {
        nodeinfo: {
            node_id: "1234567890ab",
            network: {
                mac: "12:34:56:78:90:ab",
            },
        },
        flags: {
            online: true,
        },
        lastseen: 42,
    };

    // then
    expect(() => parseNode(importTimestamp, nodeData)).toThrowError();
});

test("parseNode() should succeed parsing node without site and domain", () => {
    // given
    const importTimestamp = now();
    const nodeData = {
        nodeinfo: {
            node_id: "1234567890ab",
            network: {
                mac: "12:34:56:78:90:ab",
            },
        },
        flags: {
            online: true,
        },
        lastseen: TIMESTAMP_VALID_STRING,
    };

    // then
    const expectedParsedNode: ParsedNode = {
        mac: "12:34:56:78:90:AB" as MAC,
        importTimestamp: importTimestamp,
        state: OnlineState.ONLINE,
        lastSeen: TIMESTAMP_VALID,
        site: undefined,
        domain: undefined,
    };
    expect(parseNode(importTimestamp, nodeData)).toEqual(expectedParsedNode);
});

test("parseNode() should succeed parsing node with site and domain", () => {
    // given
    const importTimestamp = now();
    const nodeData = {
        nodeinfo: {
            node_id: "1234567890ab",
            network: {
                mac: "12:34:56:78:90:ab",
            },
            system: {
                site_code: "test-site",
                domain_code: "test-domain",
            },
        },
        flags: {
            online: true,
        },
        lastseen: TIMESTAMP_VALID_STRING,
    };

    // then
    const expectedParsedNode: ParsedNode = {
        mac: "12:34:56:78:90:AB" as MAC,
        importTimestamp: importTimestamp,
        state: OnlineState.ONLINE,
        lastSeen: TIMESTAMP_VALID,
        site: "test-site" as Site,
        domain: "test-domain" as Domain,
    };
    expect(parseNode(importTimestamp, nodeData)).toEqual(expectedParsedNode);
});

test("parseNodesJson() should fail parsing empty string", () => {
    // given
    const json = "";

    // then
    expect(() => parseNodesJson(json)).toThrowError();
});

test("parseNodesJson() should fail parsing malformed JSON", () => {
    // given
    const json = '{"version": 2]';

    // then
    expect(() => parseNodesJson(json)).toThrowError();
});

test("parseNodesJson() should fail parsing JSON null", () => {
    // given
    const json = JSON.stringify(null);

    // then
    expect(() => parseNodesJson(json)).toThrowError();
});

test("parseNodesJson() should fail parsing JSON string", () => {
    // given
    const json = JSON.stringify("foo");

    // then
    expect(() => parseNodesJson(json)).toThrowError();
});

test("parseNodesJson() should fail parsing JSON number", () => {
    // given
    const json = JSON.stringify(42);

    // then
    expect(() => parseNodesJson(json)).toThrowError();
});

test("parseNodesJson() should fail parsing empty JSON object", () => {
    // given
    const json = JSON.stringify({});

    // then
    expect(() => parseNodesJson(json)).toThrowError();
});

test("parseNodesJson() should fail parsing for mismatching version", () => {
    // given
    const json = JSON.stringify({
        version: NODES_JSON_INVALID_VERSION,
    });

    // then
    expect(() => parseNodesJson(json)).toThrowError();
});

test("parseNodesJson() should fail parsing for missing timestamp", () => {
    // given
    const json = JSON.stringify({
        version: NODES_JSON_VALID_VERSION,
        nodes: [],
    });

    // then
    expect(() => parseNodesJson(json)).toThrowError();
});

test("parseNodesJson() should fail parsing for invalid timestamp", () => {
    // given
    const json = JSON.stringify({
        version: NODES_JSON_VALID_VERSION,
        timestamp: TIMESTAMP_INVALID_STRING,
        nodes: [],
    });

    // then
    expect(() => parseNodesJson(json)).toThrowError();
});

test("parseNodesJson() should fail parsing for nodes object instead of array", () => {
    // given
    const json = JSON.stringify({
        version: NODES_JSON_VALID_VERSION,
        timestamp: TIMESTAMP_VALID_STRING,
        nodes: {},
    });

    // then
    expect(() => parseNodesJson(json)).toThrowError();
});

test("parseNodesJson() should succeed parsing no nodes", () => {
    // given
    const json = JSON.stringify({
        version: NODES_JSON_VALID_VERSION,
        timestamp: TIMESTAMP_VALID_STRING,
        nodes: [],
    });

    // when
    const result = parseNodesJson(json);

    // then
    expect(result.nodes).toEqual([]);
    expect(result.failedNodesCount).toEqual(0);
    expect(result.totalNodesCount).toEqual(0);
});

test("parseNodesJson() should skip parsing invalid nodes", () => {
    // given
    const json = JSON.stringify({
        version: NODES_JSON_VALID_VERSION,
        timestamp: TIMESTAMP_VALID_STRING,
        nodes: [
            {},
            {
                nodeinfo: {
                    node_id: "1234567890ab",
                    network: {
                        mac: "12:34:56:78:90:ab",
                    },
                    system: {
                        site_code: "test-site",
                        domain_code: "test-domain",
                    },
                },
                flags: {
                    online: true,
                },
                lastseen: TIMESTAMP_INVALID_STRING,
            },
        ],
    });

    // when
    const result = parseNodesJson(json);

    // then
    expect(result.nodes).toEqual([]);
    expect(result.failedNodesCount).toEqual(2);
    expect(result.totalNodesCount).toEqual(2);
    expect(
        mockedLogger.getMessages("error", "monitoring", "parsing-nodes-json")
            .length
    ).toEqual(2);
});

test("parseNodesJson() should parse valid nodes", () => {
    // given
    const json = JSON.stringify({
        version: NODES_JSON_VALID_VERSION,
        timestamp: TIMESTAMP_VALID_STRING,
        nodes: [
            {}, // keep an invalid one for good measure
            {
                nodeinfo: {
                    node_id: "1234567890ab",
                    network: {
                        mac: "12:34:56:78:90:ab",
                    },
                    system: {
                        site_code: "test-site",
                        domain_code: "test-domain",
                    },
                },
                flags: {
                    online: true,
                },
                lastseen: TIMESTAMP_VALID_STRING,
            },
        ],
    });

    // when
    const result = parseNodesJson(json);

    // then
    const expectedParsedNode: ParsedNode = {
        mac: "12:34:56:78:90:AB" as MAC,
        importTimestamp: TIMESTAMP_VALID,
        state: OnlineState.ONLINE,
        lastSeen: TIMESTAMP_VALID,
        site: "test-site" as Site,
        domain: "test-domain" as Domain,
    };

    expect(result.nodes).toEqual([expectedParsedNode]);
    expect(result.failedNodesCount).toEqual(1);
    expect(result.totalNodesCount).toEqual(2);
    expect(
        mockedLogger.getMessages("error", "monitoring", "parsing-nodes-json")
            .length
    ).toEqual(1);
});
