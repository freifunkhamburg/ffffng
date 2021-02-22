import _ from "lodash";
import async from "async";
import crypto from "crypto";
import oldFs, {promises as fs} from "graceful-fs";
import glob from "glob";

import {config} from "../config";
import ErrorTypes from "../utils/errorTypes";
import Logger from "../logger";
import * as MailService from "../services/mailService";
import {normalizeString} from "../utils/strings";
import {monitoringConfirmUrl, monitoringDisableUrl} from "../utils/urlBuilder";
import {FastdKey, MonitoringState, MonitoringToken, Node, NodeSecrets, NodeStatistics, Token} from "../types";
import util from "util";

const pglob = util.promisify(glob);

type NodeFilter = {
    hostname?: string,
    mac?: string,
    key?: string,
    token?: Token,
    monitoringToken?: string,
}

type NodeFilenameParsed = {
    hostname?: string,
    mac?: string,
    key?: string,
    token?: Token,
    monitoringToken?: string,
}

const linePrefixes = {
    hostname: '# Knotenname: ',
    nickname: '# Ansprechpartner: ',
    email: '# Kontakt: ',
    coords: '# Koordinaten: ',
    mac: '# MAC: ',
    token: '# Token: ',
    monitoring: '# Monitoring: ',
    monitoringToken: '# Monitoring-Token: '
};

const filenameParts = ['hostname', 'mac', 'key', 'token', 'monitoringToken'];

function generateToken(): Token {
    return crypto.randomBytes(8).toString('hex');
}

function toNodeFilesPattern(filter: NodeFilter): string {
    const pattern = _.join(
        _.map(
            filenameParts,
            field => field in filter ? (filter as {[key: string]: string | undefined})[field] : '*'),
        '@'
    );

    return config.server.peersPath + '/' + pattern.toLowerCase();
}

function findNodeFiles(filter: NodeFilter): Promise<string[]> {
    return pglob(toNodeFilesPattern(filter));
}

function findNodeFilesSync(filter: NodeFilter) {
    return glob.sync(toNodeFilesPattern(filter));
}

async function findFilesInPeersPath(): Promise<string[]> {
    const files = await pglob(config.server.peersPath + '/*');

    return await async.filter(files, (file, fileCallback) => {
        if (file[0] === '.') {
            return fileCallback(null, false);
        }

        fs.lstat(file)
            .then(stats => fileCallback(null, stats.isFile()))
            .catch(fileCallback);
    });
}

function parseNodeFilename(filename: string): NodeFilenameParsed {
    const parts = _.split(filename, '@', filenameParts.length);
    const parsed: {[key: string]: string | undefined} = {};
    const zippedParts = _.zip<string, string>(filenameParts, parts);
    _.each(zippedParts, part => {
        const key = part[0];
        if (key) {
            parsed[key] = part[1];
        }
    });
    return parsed;
}

function isDuplicate(filter: NodeFilter, token: Token | null): boolean {
    const files = findNodeFilesSync(filter);
    if (files.length === 0) {
        return false;
    }

    if (files.length > 1 || !token /* node is being created*/) {
        return true;
    }

    return parseNodeFilename(files[0]).token !== token;
}

function checkNoDuplicates(token: Token | null, node: Node, nodeSecrets: NodeSecrets): void {
    if (isDuplicate({ hostname: node.hostname }, token)) {
        throw {data: {msg: 'Already exists.', field: 'hostname'}, type: ErrorTypes.conflict};
    }

    if (node.key) {
        if (isDuplicate({ key: node.key }, token)) {
            throw {data: {msg: 'Already exists.', field: 'key'}, type: ErrorTypes.conflict};
        }
    }

    if (isDuplicate({ mac: node.mac }, token)) {
        throw {data: {msg: 'Already exists.', field: 'mac'}, type: ErrorTypes.conflict};
    }

    if (nodeSecrets.monitoringToken && isDuplicate({ monitoringToken: nodeSecrets.monitoringToken }, token)) {
        throw {data: {msg: 'Already exists.', field: 'monitoringToken'}, type: ErrorTypes.conflict};
    }
}

function toNodeFilename(token: Token, node: Node, nodeSecrets: NodeSecrets): string {
    return config.server.peersPath + '/' +
        (
            (node.hostname || '') + '@' +
            (node.mac || '') + '@' +
            (node.key || '') + '@' +
            (token || '') + '@' +
            (nodeSecrets.monitoringToken || '')
        ).toLowerCase();
}

async function writeNodeFile(
    isUpdate: boolean,
    token: Token,
    node: Node,
    nodeSecrets: NodeSecrets,
): Promise<{token: Token, node: Node}> {
    const filename = toNodeFilename(token, node, nodeSecrets);
    let data = '';
    _.each(linePrefixes, function (prefix, key) {
        let value;
        switch (key) {
            case 'monitoring':
                if (node.monitoring && node.monitoringConfirmed) {
                    value = 'aktiv';
                } else if (node.monitoring && !node.monitoringConfirmed) {
                    value = 'pending';
                } else {
                    value = '';
                }
            break;

            case 'monitoringToken':
                value = nodeSecrets.monitoringToken || '';
            break;

            default:
                value = key === 'token' ? token : (node as {[key: string]: any})[key];
                if (_.isUndefined(value)) {
                    const nodeSecret = (nodeSecrets as {[key: string]: string})[key];
                    value = _.isUndefined(nodeSecret) ? '' : nodeSecret;
                }
            break;
        }
        data += prefix + value + '\n';
    });
    if (node.key) {
        data += 'key "' + node.key + '";\n';
    }

    // since node.js is single threaded we don't need a lock

    if (isUpdate) {
        const files = findNodeFilesSync({ token: token });
        if (files.length !== 1) {
            throw {data: 'Node not found.', type: ErrorTypes.notFound};
        }

        checkNoDuplicates(token, node, nodeSecrets);

        const file = files[0];
        try {
            oldFs.unlinkSync(file);
        }
        catch (error) {
            Logger.tag('node', 'save').error('Could not delete old node file: ' + file, error);
            throw {data: 'Could not remove old node data.', type: ErrorTypes.internalError};
        }
    } else {
        checkNoDuplicates(null, node, nodeSecrets);
    }

    try {
        oldFs.writeFileSync(filename, data, 'utf8');
        return {token, node};
    }
    catch (error) {
        Logger.tag('node', 'save').error('Could not write node file: ' + filename, error);
        throw {data: 'Could not write node data.', type: ErrorTypes.internalError};
    }
}

async function deleteNodeFile(token: Token): Promise<void> {
    let files;
    try {
        files = await findNodeFiles({ token: token });
    }
    catch (error) {
        Logger.tag('node', 'delete').error('Could not find node file: ' + files, error);
        throw {data: 'Could not delete node.', type: ErrorTypes.internalError};
    }

    if (files.length !== 1) {
        throw {data: 'Node not found.', type: ErrorTypes.notFound};
    }

    try {
        oldFs.unlinkSync(files[0]);
    }
    catch (error) {
        Logger.tag('node', 'delete').error('Could not delete node file: ' + files, error);
        throw {data: 'Could not delete node.', type: ErrorTypes.internalError};
    }
}

async function parseNodeFile(file: string): Promise<{node: Node, nodeSecrets: NodeSecrets}> {
    const contents = await fs.readFile(file);

    const lines = contents.toString();

    const node: {[key: string]: any} = {};
    const nodeSecrets: {[key: string]: any} = {};

    _.each(lines.split('\n'), function (line) {
        const entries: {[key: string]: string} = {};

        for (const key of Object.keys(linePrefixes)) {
            const prefix = (linePrefixes as {[key: string]: string})[key];
            if (line.substring(0, prefix.length) === prefix) {
                entries[key] = normalizeString(line.substr(prefix.length));
                break;
            }
        }

        if (_.isEmpty(entries) && line.substring(0, 5) === 'key "') {
            entries.key = normalizeString(line.split('"')[1]);
        }

        _.each(entries, function (value, key) {
            switch (key) {
                case 'mac':
                    node.mac = value;
                    node.mapId = _.toLower(value).replace(/:/g, '');
                    break;

                case 'monitoring':
                    const active = value === 'aktiv';
                    const pending = value === 'pending';
                    node.monitoring = active || pending;
                    node.monitoringConfirmed = active;
                    node.monitoringState =
                        active ? MonitoringState.ACTIVE : (pending ? MonitoringState.PENDING : MonitoringState.DISABLED);
                    break;

                case 'monitoringToken':
                    nodeSecrets.monitoringToken = value;
                    break;

                default:
                   node[key] = value;
                   break;
            }
        });
    });

    return {
        node: {
            token: node.token as Token || '',
            nickname: node.nickname as string || '',
            email: node.email as string || '',
            hostname: node.hostname as string || '',
            coords: node.coords as string || undefined,
            key: node.key as FastdKey || undefined,
            mac: node.mac as string || '',
            monitoring: !!node.monitoring,
            monitoringConfirmed: !!node.monitoringConfirmed,
            monitoringState: node.monitoringState as MonitoringState || MonitoringState.DISABLED,
        },
        nodeSecrets: {
            monitoringToken: nodeSecrets.monitoringToken as MonitoringToken || undefined,
        },
    };
}

async function findNodeDataByFilePattern(filter: NodeFilter): Promise<{node: Node, nodeSecrets: NodeSecrets} | null> {
    const files = await findNodeFiles(filter);

    if (files.length !== 1) {
        return null;
    }

    const file = files[0];
    return await parseNodeFile(file);
}

async function getNodeDataByFilePattern(filter: NodeFilter): Promise<{node: Node, nodeSecrets: NodeSecrets}> {
    const result = await findNodeDataByFilePattern(filter);
    if (!result) {
        throw {data: 'Node not found.', type: ErrorTypes.notFound};
    }

    return result;
}

async function sendMonitoringConfirmationMail(node: Node, nodeSecrets: NodeSecrets): Promise<void> {
    const monitoringToken = nodeSecrets.monitoringToken;
    if (!monitoringToken) {
        Logger
            .tag('monitoring', 'confirmation')
            .error('Could not enqueue confirmation mail. No monitoring token found.');
        throw {data: 'Internal error.', type: ErrorTypes.internalError};
    }

    const confirmUrl = monitoringConfirmUrl(monitoringToken);
    const disableUrl = monitoringDisableUrl(monitoringToken);

    await MailService.enqueue(
        config.server.email.from,
        node.nickname + ' <' + node.email + '>',
        'monitoring-confirmation',
        {
            node: node,
            confirmUrl: confirmUrl,
            disableUrl: disableUrl
        },
    );
}

export async function createNode (node: Node): Promise<{token: Token, node: Node}> {
    const token = generateToken();
    const nodeSecrets: NodeSecrets = {};

    node.monitoringConfirmed = false;

    if (node.monitoring) {
        nodeSecrets.monitoringToken = generateToken();
    }

    const written = await writeNodeFile(false, token, node, nodeSecrets);

    if (written.node.monitoring && !written.node.monitoringConfirmed) {
        await sendMonitoringConfirmationMail(written.node, nodeSecrets)
    }

    return written;
}

export async function updateNode (token: Token, node: Node): Promise<{token: Token, node: Node}> {
    const {node: currentNode, nodeSecrets} = await getNodeDataWithSecretsByToken(token);

    let monitoringConfirmed = false;
    let monitoringToken = '';

    if (node.monitoring) {
        if (!currentNode.monitoring) {
            // monitoring just has been enabled
            monitoringConfirmed = false;
            monitoringToken = generateToken();

        } else {
            // monitoring is still enabled

            if (currentNode.email !== node.email) {
                // new email so we need a new token and a reconfirmation
                monitoringConfirmed = false;
                monitoringToken = generateToken();

            } else {
                // email unchanged, keep token (fix if not set) and confirmation state
                monitoringConfirmed = currentNode.monitoringConfirmed;
                monitoringToken = nodeSecrets.monitoringToken || generateToken();
            }
        }
    }

    node.monitoringConfirmed = monitoringConfirmed;
    nodeSecrets.monitoringToken = monitoringToken;

    const written = await writeNodeFile(true, token, node, nodeSecrets);
    if (written.node.monitoring && !written.node.monitoringConfirmed) {
        await sendMonitoringConfirmationMail(written.node, nodeSecrets)
    }

    return written;
}

export async function internalUpdateNode(
    token: Token,
    node: Node, nodeSecrets: NodeSecrets
): Promise<{token: Token, node: Node}> {
    return await writeNodeFile(true, token, node, nodeSecrets);
}

export async function deleteNode (token: Token): Promise<void> {
    await deleteNodeFile(token);
}

export async function getAllNodes(): Promise<Node[]> {
    let files;
    try {
        files = await findNodeFiles({});
    } catch (error) {
        Logger.tag('nodes').error('Error getting all nodes:', error);
        throw {data: 'Internal error.', type: ErrorTypes.internalError};
    }

    const nodes: Node[] = [];
    for (const file of files) {
        try {
            const {node} = await parseNodeFile(file);
            nodes.push(node);
        } catch (error) {
            Logger.tag('nodes').error('Error getting all nodes:', error);
            throw {data: 'Internal error.', type: ErrorTypes.internalError};
        }
    }

    return nodes;
}

export async function getNodeDataWithSecretsByMac (mac: string): Promise<{node: Node, nodeSecrets: NodeSecrets} | null> {
    return await findNodeDataByFilePattern({ mac: mac });
}

export async function getNodeDataByMac (mac: string): Promise<Node | null> {
    const result = await findNodeDataByFilePattern({ mac: mac });
    return result ? result.node : null;
}

export async function getNodeDataWithSecretsByToken (token: Token): Promise<{node: Node, nodeSecrets: NodeSecrets}> {
    return await getNodeDataByFilePattern({ token: token });
}

export async function getNodeDataByToken (token: Token): Promise<Node> {
    const {node} = await getNodeDataByFilePattern({ token: token });
    return node;
}

export async function getNodeDataWithSecretsByMonitoringToken (
    monitoringToken: MonitoringToken
): Promise<{node: Node, nodeSecrets: NodeSecrets}> {
    return await getNodeDataByFilePattern({ monitoringToken: monitoringToken });
}

export async function getNodeDataByMonitoringToken (
    monitoringToken: MonitoringToken
): Promise<Node> {
    const {node} = await getNodeDataByFilePattern({ monitoringToken: monitoringToken });
    return node;
}

export async function fixNodeFilenames(): Promise<void> {
    const files = await findFilesInPeersPath();

    for (const file of files) {
        const {node, nodeSecrets} = await parseNodeFile(file);

        const expectedFilename = toNodeFilename(node.token, node, nodeSecrets);
        if (file !== expectedFilename) {
            try {
                await fs.rename(file, expectedFilename);
            }
            catch (error) {
                throw new Error(
                    'Cannot rename file ' + file + ' to ' + expectedFilename + ' => ' + error
                );
            }
        }
    }
}

export async function getNodeStatistics(): Promise<NodeStatistics> {
    const nodes = await getAllNodes();

    const nodeStatistics: NodeStatistics = {
        registered: _.size(nodes),
        withVPN: 0,
        withCoords: 0,
        monitoring: {
            active: 0,
            pending: 0
        }
    };

    _.each(nodes, function (node: Node): void {
        if (node.key) {
            nodeStatistics.withVPN += 1;
        }

        if (node.coords) {
            nodeStatistics.withCoords += 1;
        }

        function ensureExhaustive(monitoringState: never): void {
            throw new Error('Add missing case for monitoring stat below: ' + monitoringState);
        }

        const monitoringState = node.monitoringState;
        switch (monitoringState) {
            case MonitoringState.ACTIVE:
                nodeStatistics.monitoring.active += 1;
            break;
            case MonitoringState.PENDING:
                nodeStatistics.monitoring.pending += 1;
            break;
            case MonitoringState.DISABLED:
                // Not counted seperately.
            break;

            default:
                ensureExhaustive(monitoringState);
        }
    });

    return nodeStatistics;
}
