import moment from 'moment';
import {ParsedNode, parseNode, parseNodesJson, parseTimestamp} from "./monitoringService";
import {OnlineState} from "../types";
import Logger from '../logger';
import {MockLogger} from "../__mocks__/logger";

const mockedLogger = Logger as MockLogger;

jest.mock('../logger');
jest.mock('../db/database');

const NODES_JSON_INVALID_VERSION = 1;
const NODES_JSON_VALID_VERSION = 2;

const TIMESTAMP_INVALID_STRING = "2020-01-02T42:99:23.000Z";
const TIMESTAMP_VALID_STRING = "2020-01-02T12:34:56.000Z";


beforeEach(() => {
    mockedLogger.reset();
});

test('parseTimestamp() should fail parsing non-string timestamp', () => {
    // given
    const timestamp = {};

    // when
    const parsedTimestamp = parseTimestamp(timestamp);

    // then
    expect(parsedTimestamp.isValid()).toBe(false);
});

test('parseTimestamp() should fail parsing empty timestamp string', () => {
    // given
    const timestamp = "";

    // when
    const parsedTimestamp = parseTimestamp(timestamp);

    // then
    expect(parsedTimestamp.isValid()).toBe(false);
});

test('parseTimestamp() should fail parsing invalid timestamp string', () => {
    // given
    const timestamp = TIMESTAMP_INVALID_STRING;

    // when
    const parsedTimestamp = parseTimestamp(timestamp);

    // then
    expect(parsedTimestamp.isValid()).toBe(false);
});

test('parseTimestamp() should succeed parsing valid timestamp string', () => {
    // given
    const timestamp = TIMESTAMP_VALID_STRING;

    // when
    const parsedTimestamp = parseTimestamp(timestamp);

    // then
    expect(parsedTimestamp.isValid()).toBe(true);
    expect(parsedTimestamp.toISOString()).toEqual(timestamp);
});

test('parseNode() should fail parsing node for undefined node data', () => {
    // given
    const importTimestamp = moment();
    const nodeData = undefined;

    // then
    expect(() => parseNode(importTimestamp, nodeData)).toThrowError();
});

test('parseNode() should fail parsing node for empty node data', () => {
    // given
    const importTimestamp = moment();
    const nodeData = {};

    // then
    expect(() => parseNode(importTimestamp, nodeData)).toThrowError();
});

test('parseNode() should fail parsing node for empty node info', () => {
    // given
    const importTimestamp = moment();
    const nodeData = {
        nodeinfo: {}
    };

    // then
    expect(() => parseNode(importTimestamp, nodeData)).toThrowError();
});

test('parseNode() should fail parsing node for non-string node id', () => {
    // given
    const importTimestamp = moment();
    const nodeData = {
        nodeinfo: {
            node_id: 42
        }
    };

    // then
    expect(() => parseNode(importTimestamp, nodeData)).toThrowError();
});

test('parseNode() should fail parsing node for empty node id', () => {
    // given
    const importTimestamp = moment();
    const nodeData = {
        nodeinfo: {
            node_id: ""
        }
    };

    // then
    expect(() => parseNode(importTimestamp, nodeData)).toThrowError();
});

test('parseNode() should fail parsing node for empty network info', () => {
    // given
    const importTimestamp = moment();
    const nodeData = {
        nodeinfo: {
            node_id: "1234567890ab",
            network: {}
        }
    };

    // then
    expect(() => parseNode(importTimestamp, nodeData)).toThrowError();
});

test('parseNode() should fail parsing node for invalid mac', () => {
    // given
    const importTimestamp = moment();
    const nodeData = {
        nodeinfo: {
            node_id: "1234567890ab",
            network: {
                mac: "xxx"
            }
        }
    };

    // then
    expect(() => parseNode(importTimestamp, nodeData)).toThrowError();
});

test('parseNode() should fail parsing node for missing flags', () => {
    // given
    const importTimestamp = moment();
    const nodeData = {
        nodeinfo: {
            node_id: "1234567890ab",
            network: {
                mac: "12:34:56:78:90:ab"
            }
        }
    };

    // then
    expect(() => parseNode(importTimestamp, nodeData)).toThrowError();
});

test('parseNode() should fail parsing node for empty flags', () => {
    // given
    const importTimestamp = moment();
    const nodeData = {
        nodeinfo: {
            node_id: "1234567890ab",
            network: {
                mac: "12:34:56:78:90:ab"
            }
        },
        flags: {}
    };

    // then
    expect(() => parseNode(importTimestamp, nodeData)).toThrowError();
});

test('parseNode() should fail parsing node for missing last seen timestamp', () => {
    // given
    const importTimestamp = moment();
    const nodeData = {
        nodeinfo: {
            node_id: "1234567890ab",
            network: {
                mac: "12:34:56:78:90:ab"
            }
        },
        flags: {
            online: true
        }
    };

    // then
    expect(() => parseNode(importTimestamp, nodeData)).toThrowError();
});

test('parseNode() should fail parsing node for invalid last seen timestamp', () => {
    // given
    const importTimestamp = moment();
    const nodeData = {
        nodeinfo: {
            node_id: "1234567890ab",
            network: {
                mac: "12:34:56:78:90:ab"
            }
        },
        flags: {
            online: true
        },
        lastseen: 42
    };

    // then
    expect(() => parseNode(importTimestamp, nodeData)).toThrowError();
});

test('parseNode() should succeed parsing node without site and domain', () => {
    // given
    const importTimestamp = moment();
    const nodeData = {
        nodeinfo: {
            node_id: "1234567890ab",
            network: {
                mac: "12:34:56:78:90:ab"
            }
        },
        flags: {
            online: true
        },
        lastseen: TIMESTAMP_VALID_STRING
    };

    // then
    const expectedParsedNode: ParsedNode = {
        mac: "12:34:56:78:90:AB",
        importTimestamp: importTimestamp,
        state: OnlineState.ONLINE,
        lastSeen: parseTimestamp(TIMESTAMP_VALID_STRING),
        site: '<unknown-site>',
        domain: '<unknown-domain>'
    };
    expect(parseNode(importTimestamp, nodeData)).toEqual(expectedParsedNode);
});

test('parseNode() should succeed parsing node with site and domain', () => {
    // given
    const importTimestamp = moment();
    const nodeData = {
        nodeinfo: {
            node_id: "1234567890ab",
            network: {
                mac: "12:34:56:78:90:ab"
            },
            system: {
                site_code: "test-site",
                domain_code: "test-domain"
            }
        },
        flags: {
            online: true
        },
        lastseen: TIMESTAMP_VALID_STRING,
    };

    // then
    const expectedParsedNode: ParsedNode = {
        mac: "12:34:56:78:90:AB",
        importTimestamp: importTimestamp,
        state: OnlineState.ONLINE,
        lastSeen: parseTimestamp(TIMESTAMP_VALID_STRING),
        site: 'test-site',
        domain: 'test-domain'
    };
    expect(parseNode(importTimestamp, nodeData)).toEqual(expectedParsedNode);
});

test('parseNodesJson() should fail parsing empty string', () => {
    // given
    const json = "";

    // then
    expect(() => parseNodesJson(json)).toThrowError();
});

test('parseNodesJson() should fail parsing malformed JSON', () => {
    // given
    const json = '{"version": 2]';

    // then
    expect(() => parseNodesJson(json)).toThrowError();
});

test('parseNodesJson() should fail parsing JSON null', () => {
    // given
    const json = JSON.stringify(null);

    // then
    expect(() => parseNodesJson(json)).toThrowError();
});

test('parseNodesJson() should fail parsing JSON string', () => {
    // given
    const json = JSON.stringify("foo");

    // then
    expect(() => parseNodesJson(json)).toThrowError();
});

test('parseNodesJson() should fail parsing JSON number', () => {
    // given
    const json = JSON.stringify(42);

    // then
    expect(() => parseNodesJson(json)).toThrowError();
});

test('parseNodesJson() should fail parsing empty JSON object', () => {
    // given
    const json = JSON.stringify({});

    // then
    expect(() => parseNodesJson(json)).toThrowError();
});

test('parseNodesJson() should fail parsing for mismatching version', () => {
    // given
    const json = JSON.stringify({
        version: NODES_JSON_INVALID_VERSION
    });

    // then
    expect(() => parseNodesJson(json)).toThrowError();
});

test('parseNodesJson() should fail parsing for missing timestamp', () => {
    // given
    const json = JSON.stringify({
        version: NODES_JSON_VALID_VERSION,
        nodes: []
    });

    // then
    expect(() => parseNodesJson(json)).toThrowError();
});

test('parseNodesJson() should fail parsing for invalid timestamp', () => {
    // given
    const json = JSON.stringify({
        version: NODES_JSON_VALID_VERSION,
        timestamp: TIMESTAMP_INVALID_STRING,
        nodes: []
    });

    // then
    expect(() => parseNodesJson(json)).toThrowError();
});

test('parseNodesJson() should fail parsing for nodes object instead of array', () => {
    // given
    const json = JSON.stringify({
        version: NODES_JSON_VALID_VERSION,
        timestamp: TIMESTAMP_VALID_STRING,
        nodes: {}
    });

    // then
    expect(() => parseNodesJson(json)).toThrowError();
});

test('parseNodesJson() should succeed parsing no nodes', () => {
    // given
    const json = JSON.stringify({
        version: NODES_JSON_VALID_VERSION,
        timestamp: TIMESTAMP_VALID_STRING,
        nodes: []
    });

    // when
    const result = parseNodesJson(json);

    // then
    expect(result.importTimestamp.isValid()).toBe(true);
    expect(result.nodes).toEqual([]);
    expect(result.failedNodesCount).toEqual(0);
    expect(result.totalNodesCount).toEqual(0);
});

test('parseNodesJson() should skip parsing invalid nodes', () => {
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
                        mac: "12:34:56:78:90:ab"
                    },
                    system: {
                        site_code: "test-site",
                        domain_code: "test-domain"
                    }
                },
                flags: {
                    online: true
                },
                lastseen: TIMESTAMP_INVALID_STRING,
            }
        ]
    });

    // when
    const result = parseNodesJson(json);

    // then
    expect(result.importTimestamp.isValid()).toBe(true);
    expect(result.nodes).toEqual([]);
    expect(result.failedNodesCount).toEqual(2);
    expect(result.totalNodesCount).toEqual(2);
    expect(mockedLogger.getMessages('error', 'monitoring', 'parsing-nodes-json').length).toEqual(2);
});

test('parseNodesJson() should parse valid nodes', () => {
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
                        mac: "12:34:56:78:90:ab"
                    },
                    system: {
                        site_code: "test-site",
                        domain_code: "test-domain"
                    }
                },
                flags: {
                    online: true
                },
                lastseen: TIMESTAMP_VALID_STRING,
            }
        ]
    });

    // when
    const result = parseNodesJson(json);

    // then
    const expectedParsedNode: ParsedNode = {
        mac: "12:34:56:78:90:AB",
        importTimestamp: parseTimestamp(TIMESTAMP_VALID_STRING),
        state: OnlineState.ONLINE,
        lastSeen: parseTimestamp(TIMESTAMP_VALID_STRING),
        site: 'test-site',
        domain: 'test-domain'
    };

    expect(result.importTimestamp.isValid()).toBe(true);
    expect(result.nodes).toEqual([expectedParsedNode]);
    expect(result.failedNodesCount).toEqual(1);
    expect(result.totalNodesCount).toEqual(2);
    expect(mockedLogger.getMessages('error', 'monitoring', 'parsing-nodes-json').length).toEqual(1);
});
