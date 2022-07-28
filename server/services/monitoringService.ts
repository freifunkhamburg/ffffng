import _ from "lodash";
import request from "request";

import {config} from "../config";
import {db} from "../db/database";
import * as DatabaseUtil from "../utils/databaseUtil";
import ErrorTypes from "../utils/errorTypes";
import Logger from "../logger";

import * as MailService from "../services/mailService";
import * as NodeService from "../services/nodeService";
import * as Resources from "../utils/resources";
import {RestParams} from "../utils/resources";
import {normalizeMac, parseInteger} from "../utils/strings";
import {monitoringDisableUrl} from "../utils/urlBuilder";
import CONSTRAINTS from "../validation/constraints";
import {forConstraint} from "../validation/validator";
import {
    Domain,
    DurationSeconds,
    Hostname,
    isDomain,
    isMonitoringSortField,
    isOnlineState,
    isSite,
    MAC,
    MailType,
    MonitoringSortField,
    MonitoringState,
    MonitoringToken,
    NodeId,
    NodeStateData,
    OnlineState,
    RunResult,
    Site,
    StoredNode,
    toCreateOrUpdateNode,
    UnixTimestampSeconds
} from "../types";
import {days, formatTimestamp, hours, now, parseTimestamp, subtract, weeks} from "../utils/time";

type NodeStateRow = {
    id: number,
    created_at: UnixTimestampSeconds,
    domain: Domain | null,
    hostname: Hostname | null,
    import_timestamp: UnixTimestampSeconds,
    last_seen: UnixTimestampSeconds,
    last_status_mail_sent: string | null,
    last_status_mail_type: string | null,
    mac: MAC,
    modified_at: UnixTimestampSeconds,
    monitoring_state: string | null,
    site: Site | null,
    state: string,
};

const MONITORING_STATE_MACS_CHUNK_SIZE = 100;
const NEVER_ONLINE_NODES_DELETION_CHUNK_SIZE = 20;
const MONITORING_MAILS_DB_BATCH_SIZE = 50;
/**
 * Defines the intervals emails are sent if a node is offline
 */
const MONITORING_OFFLINE_MAILS_SCHEDULE: Record<number, DurationSeconds> = {
    1: hours(3),
    2: days(1),
    3: weeks(1),
};
const DELETE_OFFLINE_NODES_AFTER_DURATION: DurationSeconds = days(100);

export type ParsedNode = {
    mac: MAC,
    importTimestamp: UnixTimestampSeconds,
    state: OnlineState,
    lastSeen: UnixTimestampSeconds,
    site?: Site,
    domain?: Domain,
};

export type NodesParsingResult = {
    importTimestamp: UnixTimestampSeconds,
    nodes: ParsedNode[],
    failedNodesCount: number,
    totalNodesCount: number,
}

export type RetrieveNodeInformationResult = {
    failedParsingNodesCount: number,
    totalNodesCount: number,
};

let previousImportTimestamp: UnixTimestampSeconds | null = null;

async function insertNodeInformation(nodeData: ParsedNode, node: StoredNode): Promise<void> {
    Logger
        .tag('monitoring', 'information-retrieval')
        .debug('Node is new in monitoring, creating data: %s', nodeData.mac);

    await db.run(
        'INSERT INTO node_state ' +
        '(hostname, mac, site, domain, monitoring_state, state, last_seen, import_timestamp, last_status_mail_sent, last_status_mail_type) ' +
        'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
            node.hostname,
            node.mac,
            nodeData.site,
            nodeData.domain,
            node.monitoringState,
            nodeData.state,
            nodeData.lastSeen,
            nodeData.importTimestamp,
            null, // new node so we haven't send a mail yet
            null  // new node so we haven't send a mail yet
        ]
    );
}

async function updateNodeInformation(nodeData: ParsedNode, node: StoredNode, row: any): Promise<void> {
    Logger
        .tag('monitoring', 'informacallbacktion-retrieval')
        .debug('Node is known in monitoring: %s', nodeData.mac);

    if (row.import_timestamp >= nodeData.importTimestamp) {
        Logger
            .tag('monitoring', 'information-retrieval')
            .debug('No new data for node, skipping: %s', nodeData.mac);
        return;
    }

    Logger
        .tag('monitoring', 'information-retrieval')
        .debug('New data for node, updating: %s', nodeData.mac);

    await db.run(
        'UPDATE node_state ' +
        'SET ' +
        'hostname = ?, ' +
        'site = ?, ' +
        'domain = ?, ' +
        'monitoring_state = ?, ' +
        'state = ?, ' +
        'last_seen = ?, ' +
        'import_timestamp = ?, ' +
        'modified_at = ? ' +
        'WHERE id = ? AND mac = ?',
        [
            node.hostname,
            nodeData.site || row.site,
            nodeData.domain || row.domain,
            node.monitoringState,
            nodeData.state,
            nodeData.lastSeen,
            nodeData.importTimestamp,
            now(),

            row.id,
            node.mac
        ]
    );
}

async function storeNodeInformation(nodeData: ParsedNode, node: StoredNode): Promise<void> {
    Logger.tag('monitoring', 'information-retrieval').debug('Storing status for node: %s', nodeData.mac);

    const row = await db.get('SELECT * FROM node_state WHERE mac = ?', [node.mac]);

    if (_.isUndefined(row)) {
        return await insertNodeInformation(nodeData, node);
    } else {
        return await updateNodeInformation(nodeData, node, row);
    }
}

const isValidMac = forConstraint(CONSTRAINTS.node.mac, false);

// TODO: Use sparkson for JSON parsing.
export function parseNode(importTimestamp: UnixTimestampSeconds, nodeData: any): ParsedNode {
    if (!_.isPlainObject(nodeData)) {
        throw new Error(
            'Unexpected node type: ' + (typeof nodeData)
        );
    }

    if (!_.isPlainObject(nodeData.nodeinfo)) {
        throw new Error(
            'Unexpected nodeinfo type: ' + (typeof nodeData.nodeinfo)
        );
    }

    const nodeId = nodeData.nodeinfo.node_id;
    if (!nodeId || !_.isString(nodeId)) {
        throw new Error(
            `Invalid node id of type "${typeof nodeId}": ${nodeId}`
        );
    }

    if (!_.isPlainObject(nodeData.nodeinfo.network)) {
        throw new Error(
            'Node ' + nodeId + ': Unexpected nodeinfo.network type: ' + (typeof nodeData.nodeinfo.network)
        );
    }

    if (!isValidMac(nodeData.nodeinfo.network.mac)) {
        throw new Error(
            'Node ' + nodeId + ': Invalid MAC: ' + nodeData.nodeinfo.network.mac
        );
    }
    const mac = normalizeMac(nodeData.nodeinfo.network.mac) as MAC;

    if (!_.isPlainObject(nodeData.flags)) {
        throw new Error(
            'Node ' + nodeId + ': Unexpected flags type: ' + (typeof nodeData.flags)
        );
    }
    if (!_.isBoolean(nodeData.flags.online)) {
        throw new Error(
            'Node ' + nodeId + ': Unexpected flags.online type: ' + (typeof nodeData.flags.online)
        );
    }
    const isOnline = nodeData.flags.online;

    const lastSeen = parseTimestamp(nodeData.lastseen);
    if (lastSeen === null) {
        throw new Error(
            'Node ' + nodeId + ': Invalid lastseen timestamp: ' + nodeData.lastseen
        );
    }

    let site: Site | undefined;
    if (_.isPlainObject(nodeData.nodeinfo.system) && isSite(nodeData.nodeinfo.system.site_code)) {
        site = nodeData.nodeinfo.system.site_code;
    }

    let domain: Domain | undefined;
    if (_.isPlainObject(nodeData.nodeinfo.system) && isDomain(nodeData.nodeinfo.system.domain_code)) {
        domain = nodeData.nodeinfo.system.domain_code;
    }

    return {
        mac,
        importTimestamp: importTimestamp,
        state: isOnline ? OnlineState.ONLINE : OnlineState.OFFLINE,
        lastSeen,
        site,
        domain,
    };
}

// TODO: Use sparkson for JSON parsing.
export function parseNodesJson(body: string): NodesParsingResult {
    Logger.tag('monitoring', 'information-retrieval').debug('Parsing nodes.json...');

    const json = JSON.parse(body);

    if (!_.isPlainObject(json)) {
        throw new Error(`Expecting a JSON object as the nodes.json root, but got: ${typeof json}`);
    }

    const expectedVersion = 2;
    if (json.version !== expectedVersion) {
        throw new Error(`Unexpected nodes.json version "${json.version}". Expected: "${expectedVersion}"`);
    }

    const importTimestamp = parseTimestamp(json.timestamp);
    if (importTimestamp === null) {
        throw new Error('Invalid timestamp: ' + json.timestamp);
    }

    const result: NodesParsingResult = {
        importTimestamp,
        nodes: [],
        failedNodesCount: 0,
        totalNodesCount: 0,
    };

    if (!_.isArray(json.nodes)) {
        throw new Error('Invalid nodes array type: ' + (typeof json.nodes));
    }

    for (const nodeData of json.nodes) {
        result.totalNodesCount += 1;
        try {
            const parsedNode = parseNode(result.importTimestamp, nodeData);
            Logger.tag('monitoring', 'parsing-nodes-json').debug(`Parsing node successful: ${parsedNode.mac}`);
            result.nodes.push(parsedNode);
        } catch (error) {
            result.failedNodesCount += 1;
            Logger.tag('monitoring', 'parsing-nodes-json').error("Could not parse node.", error, nodeData);
        }
    }

    return result;
}

async function updateSkippedNode(id: NodeId, node?: StoredNode): Promise<RunResult> {
    return await db.run(
        'UPDATE node_state ' +
        'SET hostname = ?, monitoring_state = ?, modified_at = ?' +
        'WHERE id = ?',
        [
            node ? node.hostname : '', node ? node.monitoringState : '', now(),
            id
        ]
    );
}

async function sendMonitoringMailsBatched(
    name: string,
    mailType: MailType,
    findBatchFun: () => Promise<any[]>,
): Promise<void> {
    Logger.tag('monitoring', 'mail-sending').debug('Sending "%s" mails...', name);

    while (true) {
        Logger.tag('monitoring', 'mail-sending').debug('Sending next batch...');

        const nodeStates = await findBatchFun();
        if (_.isEmpty(nodeStates)) {
            Logger.tag('monitoring', 'mail-sending').debug('Done sending "%s" mails.', name);
            return;
        }

        for (const nodeState of nodeStates) {
            const mac = nodeState.mac;
            Logger.tag('monitoring', 'mail-sending').debug('Loading node data for: %s', mac);

            const result = await NodeService.findNodeDataWithSecretsByMac(mac);
            if (!result) {
                Logger
                    .tag('monitoring', 'mail-sending')
                    .debug(
                        'Node not found. Skipping sending of "' + name + '" mail: ' + mac
                    );
                await updateSkippedNode(nodeState.id);
                continue;
            }

            const {node, nodeSecrets} = result;

            if (node.monitoringState !== MonitoringState.ACTIVE) {
                Logger
                    .tag('monitoring', 'mail-sending')
                    .debug('Monitoring disabled, skipping "%s" mail for: %s', name, mac);
                await updateSkippedNode(nodeState.id, node);
                continue;
            }

            const monitoringToken = nodeSecrets.monitoringToken;
            if (!monitoringToken) {
                Logger
                    .tag('monitoring', 'mail-sending')
                    .error('Node has no monitoring token. Cannot send mail "%s" for: %s', name, mac);
                await updateSkippedNode(nodeState.id, node);
                continue;
            }

            Logger
                .tag('monitoring', 'mail-sending')
                .info('Sending "%s" mail for: %s', name, mac);

            await MailService.enqueue(
                config.server.email.from,
                node.nickname + ' <' + node.email + '>',
                mailType,
                {
                    node: node,
                    lastSeen: nodeState.last_seen,
                    disableUrl: monitoringDisableUrl(monitoringToken),
                }
            );

            Logger
                .tag('monitoring', 'mail-sending')
                .debug('Updating node state: ', mac);

            const timestamp = now();
            await db.run(
                'UPDATE node_state ' +
                'SET hostname = ?, monitoring_state = ?, modified_at = ?, last_status_mail_sent = ?, last_status_mail_type = ?' +
                'WHERE id = ?',
                [
                    node.hostname, node.monitoringState, timestamp, timestamp, mailType,
                    nodeState.id
                ]
            );
        }
    }
}

async function sendOnlineAgainMails(startTime: UnixTimestampSeconds): Promise<void> {
    await sendMonitoringMailsBatched(
        'online again',
        MailType.MONITORING_ONLINE_AGAIN,
        async (): Promise<any[]> => await db.all(
            'SELECT * FROM node_state ' +
            'WHERE modified_at < ? AND state = ? AND last_status_mail_type IN (' +
            '\'monitoring-offline-1\', \'monitoring-offline-2\', \'monitoring-offline-3\'' +
            ')' +
            'ORDER BY id ASC LIMIT ?',
            [
                startTime,
                'ONLINE',

                MONITORING_MAILS_DB_BATCH_SIZE
            ],
        ),
    );
}

async function sendOfflineMails(startTime: UnixTimestampSeconds, mailType: MailType): Promise<void> {
    const mailNumber = parseInteger(mailType.split("-")[2]);
    await sendMonitoringMailsBatched(
        'offline ' + mailNumber,
        mailType,
        async (): Promise<any[]> => {
            const previousType =
                mailNumber === 1 ? 'monitoring-online-again' : ('monitoring-offline-' + (mailNumber - 1));

            // the first time the first offline mail is send, there was no mail before
            const allowNull = mailNumber === 1 ? ' OR last_status_mail_type IS NULL' : '';

            const schedule = MONITORING_OFFLINE_MAILS_SCHEDULE[mailNumber];
            const scheduledTimeBefore = subtract(now(), schedule);

            return await db.all(
                'SELECT * FROM node_state ' +
                'WHERE modified_at < ? AND state = ? AND (last_status_mail_type = ?' + allowNull + ') AND ' +
                'last_seen <= ? AND (last_status_mail_sent <= ? OR last_status_mail_sent IS NULL) ' +
                'ORDER BY id ASC LIMIT ?',
                [
                    startTime,
                    'OFFLINE',
                    previousType,
                    scheduledTimeBefore,
                    scheduledTimeBefore,

                    MONITORING_MAILS_DB_BATCH_SIZE
                ],
            );
        },
    );
}

function doRequest(url: string): Promise<{ response: request.Response, body: string }> {
    return new Promise<{ response: request.Response, body: string }>((resolve, reject) => {
        request(url, function (err, response, body) {
            if (err) {
                return reject(err);
            }

            resolve({response, body});
        });
    });
}

async function withUrlsData(urls: string[]): Promise<NodesParsingResult[]> {
    const results: NodesParsingResult[] = [];

    for (const url of urls) {
        Logger.tag('monitoring', 'information-retrieval').debug('Retrieving nodes.json: %s', url);

        const {response, body} = await doRequest(url);
        if (response.statusCode !== 200) {
            throw new Error(
                'Could not download nodes.json from ' + url + ': ' +
                response.statusCode + ' - ' + response.statusMessage
            );
        }

        results.push(await parseNodesJson(body));

    }
    return results;
}

async function retrieveNodeInformationForUrls(urls: string[]): Promise<RetrieveNodeInformationResult> {
    const datas = await withUrlsData(urls);

    let maxTimestamp = datas[0].importTimestamp;
    let minTimestamp = maxTimestamp;

    let failedParsingNodesCount = 0;
    let totalNodesCount = 0;

    for (const data of datas) {
        if (data.importTimestamp >= maxTimestamp) {
            maxTimestamp = data.importTimestamp;
        }
        if (data.importTimestamp <= minTimestamp) {
            minTimestamp = data.importTimestamp;
        }

        failedParsingNodesCount += data.failedNodesCount;
        totalNodesCount += data.totalNodesCount;
    }

    if (previousImportTimestamp !== null && maxTimestamp >= previousImportTimestamp) {
        Logger
            .tag('monitoring', 'information-retrieval')
            .debug(
                'No new data, skipping. Current timestamp: %s, previous timestamp: %s',
                formatTimestamp(maxTimestamp),
                formatTimestamp(previousImportTimestamp)
            );
        return {
            failedParsingNodesCount,
            totalNodesCount,
        };
    }
    previousImportTimestamp = maxTimestamp;

    // We do not parallelize here as the sqlite will start slowing down and blocking with too many
    // parallel queries. This has resulted in blocking other requests too and thus in a major slowdown.
    const allNodes = _.flatMap(datas, data => data.nodes);

    // Get rid of duplicates from different nodes.json files. Always use the one with the newest
    const sortedNodes = _.orderBy(allNodes, [node => node.lastSeen], ['desc']);
    const uniqueNodes = _.uniqBy(sortedNodes, function (node) {
        return node.mac;
    });

    for (const nodeData of uniqueNodes) {
        Logger.tag('monitoring', 'information-retrieval').debug('Importing: %s', nodeData.mac);

        const result = await NodeService.findNodeDataByMac(nodeData.mac);
        if (!result) {
            Logger
                .tag('monitoring', 'information-retrieval')
                .debug('Unknown node, skipping: %s', nodeData.mac);
            continue;
        }

        await storeNodeInformation(nodeData, result);

        Logger
            .tag('monitoring', 'information-retrieval')
            .debug('Updating / deleting node data done: %s', nodeData.mac);
    }

    Logger
        .tag('monitoring', 'information-retrieval')
        .debug('Marking missing nodes as offline.');

    // Mark nodes as offline that haven't been imported in this run.
    await db.run(
        'UPDATE node_state ' +
        'SET state = ?, modified_at = ?' +
        'WHERE import_timestamp < ?',
        [
            OnlineState.OFFLINE, now(),
            minTimestamp
        ]
    );

    return {
        failedParsingNodesCount,
        totalNodesCount,
    }
}

export async function getAll(restParams: RestParams): Promise<{ total: number, monitoringStates: any[] }> {
    const filterFields = [
        'hostname',
        'mac',
        'monitoring_state',
        'state',
        'last_status_mail_type'
    ];

    const where = Resources.whereCondition(restParams, filterFields);

    const row = await db.get<{ total: number }>(
        'SELECT count(*) AS total FROM node_state WHERE ' + where.query,
        _.concat([], where.params),
    );

    const total = row?.total || 0;

    const filter = Resources.filterClause(
        restParams,
        MonitoringSortField.ID,
        isMonitoringSortField,
        filterFields
    );

    const monitoringStates = await db.all(
        'SELECT * FROM node_state WHERE ' + filter.query,
        _.concat([], filter.params),
    );

    return {monitoringStates, total};
}

export async function getByMacs(macs: MAC[]): Promise<Record<MAC, NodeStateData>> {
    if (_.isEmpty(macs)) {
        return {};
    }

    const nodeStateByMac: { [key: string]: NodeStateData } = {};

    for (const subMacs of _.chunk(macs, MONITORING_STATE_MACS_CHUNK_SIZE)) {
        const inCondition = DatabaseUtil.inCondition('mac', subMacs);

        const rows = await db.all<NodeStateRow>(
            'SELECT * FROM node_state WHERE ' + inCondition.query,
            _.concat([], inCondition.params),
        );

        for (const row of rows) {
            const onlineState = row.state;
            if (!isOnlineState(onlineState)) {
                throw new Error(`Invalid online state in database: "${onlineState}"`);
            }

            nodeStateByMac[row.mac] = {
                site: row.site || undefined,
                domain: row.domain || undefined,
                state: onlineState,
            };
        }
    }

    return nodeStateByMac;
}

export async function confirm(token: MonitoringToken): Promise<StoredNode> {
    const {node, nodeSecrets} = await NodeService.getNodeDataWithSecretsByMonitoringToken(token);
    if (node.monitoringState === MonitoringState.DISABLED || !nodeSecrets.monitoringToken || nodeSecrets.monitoringToken !== token) {
        throw {data: 'Invalid token.', type: ErrorTypes.badRequest};
    }

    if (node.monitoringState === MonitoringState.ACTIVE) {
        return node;
    }

    node.monitoringState = MonitoringState.ACTIVE;
    return await NodeService.internalUpdateNode(
        node.token,
        toCreateOrUpdateNode(node),
        node.monitoringState,
        nodeSecrets
    );
}

export async function disable(token: MonitoringToken): Promise<StoredNode> {
    const {node, nodeSecrets} = await NodeService.getNodeDataWithSecretsByMonitoringToken(token);
    if (node.monitoringState === MonitoringState.DISABLED || !nodeSecrets.monitoringToken || nodeSecrets.monitoringToken !== token) {
        throw {data: 'Invalid token.', type: ErrorTypes.badRequest};
    }

    node.monitoringState = MonitoringState.DISABLED;
    nodeSecrets.monitoringToken = undefined;

    return await NodeService.internalUpdateNode(
        node.token,
        toCreateOrUpdateNode(node),
        node.monitoringState,
        nodeSecrets
    );
}

export async function retrieveNodeInformation(): Promise<RetrieveNodeInformationResult> {
    const urls = config.server.map.nodesJsonUrl;
    if (_.isEmpty(urls)) {
        throw new Error('No nodes.json-URLs set. Please adjust config.json: server.map.nodesJsonUrl')
    }

    return await retrieveNodeInformationForUrls(urls);
}

export async function sendMonitoringMails(): Promise<void> {
    Logger.tag('monitoring', 'mail-sending').debug('Sending monitoring mails...');

    const startTime = now();

    try {
        await sendOnlineAgainMails(startTime);
    } catch (error) {
        // only logging an continuing with next type
        Logger
            .tag('monitoring', 'mail-sending')
            .error('Error sending "online again" mails.', error);
    }

    for (const mailType of [
        MailType.MONITORING_OFFLINE_1,
        MailType.MONITORING_OFFLINE_2,
        MailType.MONITORING_OFFLINE_3,
    ]) {
        try {
            await sendOfflineMails(startTime, mailType);
        } catch (error) {
            // only logging an continuing with next type
            Logger
                .tag('monitoring', 'mail-sending')
                .error('Error sending "' + mailType + '" mails.', error);
        }
    }
}

export async function deleteOfflineNodes(): Promise<void> {
    Logger
        .tag('nodes', 'delete-offline')
        .info(
            `Deleting offline nodes older than ${DELETE_OFFLINE_NODES_AFTER_DURATION} seconds.`
        );

    const deleteBefore =
        subtract(
            now(),
            DELETE_OFFLINE_NODES_AFTER_DURATION,
        );

    await deleteNeverOnlineNodesBefore(deleteBefore);
    await deleteNodesOfflineSinceBefore(deleteBefore);
}

async function deleteNeverOnlineNodesBefore(deleteBefore: UnixTimestampSeconds): Promise<void> {
    Logger
        .tag('nodes', 'delete-never-online')
        .info(
            'Deleting nodes that were never online created before ' +
            deleteBefore
        );

    const deletionCandidates: StoredNode[] = await NodeService.findNodesModifiedBefore(deleteBefore);

    Logger
        .tag('nodes', 'delete-never-online')
        .info(
            'Number of nodes created before ' +
            deleteBefore +
            ': ' +
            deletionCandidates.length
        );

    const deletionCandidateMacs: MAC[] = _.map(deletionCandidates, node => node.mac);
    const chunks: MAC[][] = _.chunk(deletionCandidateMacs, NEVER_ONLINE_NODES_DELETION_CHUNK_SIZE);

    Logger
        .tag('nodes', 'delete-never-online')
        .info(
            'Number of chunks to check for deletion: ' +
            chunks.length
        );

    for (const macs of chunks) {
        Logger
            .tag('nodes', 'delete-never-online')
            .info(
                'Checking chunk of ' +
                macs.length +
                ' MACs for deletion.'
            );

        const placeholders = _.join(
            _.map(macs, () => '?'),
            ','
        );

        const rows: { mac: MAC }[] = await db.all(
            `SELECT * FROM node_state WHERE mac IN (${placeholders})`,
            macs
        );

        Logger
            .tag('nodes', 'delete-never-online')
            .info(
                'Of the chunk of ' +
                macs.length +
                ' MACs there were ' +
                rows.length +
                ' nodes found in monitoring database. Those should be skipped.'
            );

        const seenMacs: MAC[] = _.map(rows, (row: { mac: MAC }) => row.mac as MAC);
        const neverSeenMacs = _.difference(macs, seenMacs);

        Logger
            .tag('nodes', 'delete-never-online')
            .info(
                'Of the chunk of ' +
                macs.length +
                ' MACs there are ' +
                neverSeenMacs.length +
                ' nodes that were never online. Those will be deleted.'
            );

        for (const neverSeenMac of neverSeenMacs) {
            await deleteNodeByMac(neverSeenMac);
        }
    }
}

async function deleteNodesOfflineSinceBefore(deleteBefore: UnixTimestampSeconds): Promise<void> {
    const rows = await db.all<NodeStateRow>(
        'SELECT * FROM node_state WHERE state = ? AND last_seen < ?',
        [
            'OFFLINE',
            deleteBefore
        ],
    );

    for (const row of rows) {
        await deleteNodeByMac(row.mac);
    }
}

async function deleteNodeByMac(mac: MAC): Promise<void> {
    Logger.tag('nodes', 'delete-offline').debug('Deleting node ' + mac);

    let node;

    try {
        node = await NodeService.findNodeDataByMac(mac);
    } catch (error) {
        // Only log error. We try to delete the nodes state anyways.
        Logger.tag('nodes', 'delete-offline').error('Could not find node to delete: ' + mac, error);
    }

    if (node && node.token) {
        await NodeService.deleteNode(node.token);
    }

    try {
        await db.run(
            'DELETE FROM node_state WHERE mac = ? AND state = ?',
            [mac, 'OFFLINE'],
        );
    } catch (error) {
        // Only log error and continue with next node.
        Logger.tag('nodes', 'delete-offline').error('Could not delete node state: ' + mac, error);
    }
}

