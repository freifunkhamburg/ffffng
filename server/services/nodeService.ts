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
import {
    Coordinates,
    EmailAddress,
    FastdKey,
    Hostname,
    MAC,
    MailType,
    MonitoringState,
    MonitoringToken,
    Nickname,
    Node,
    NodeSecrets,
    NodeStatistics,
    Token,
    toUnixTimestampSeconds,
    unhandledEnumField,
    UnixTimestampMilliseconds,
    UnixTimestampSeconds
} from "../types";
import util from "util";

const pglob = util.promisify(glob);

type NodeFilter = {
    // TODO: Newtype
    hostname?: string,
    mac?: MAC,
    key?: FastdKey,
    token?: Token,
    monitoringToken?: MonitoringToken,
}

// TODO: Newtypes?
type NodeFilenameParsed = {
    hostname?: string,
    mac?: string,
    key?: string,
    token?: string,
    monitoringToken?: string,
}

enum LINE_PREFIX {
    HOSTNAME = "# Knotenname: ",
    NICKNAME = "# Ansprechpartner: ",
    EMAIL = "# Kontakt: ",
    COORDS = "# Koordinaten: ",
    MAC = "# MAC: ",
    TOKEN = "# Token: ",
    MONITORING = "# Monitoring: ",
    MONITORING_TOKEN = "# Monitoring-Token: ",
}

const filenameParts = ['hostname', 'mac', 'key', 'token', 'monitoringToken'];

function generateToken<Type extends string & { readonly __tag: symbol } = never>(): Type {
    return crypto.randomBytes(8).toString('hex') as Type;
}

function toNodeFilesPattern(filter: NodeFilter): string {
    const fields: (string | undefined)[] = [
        filter.hostname,
        filter.mac,
        filter.key,
        filter.token,
        filter.monitoringToken,
    ];

    const pattern = fields.map((value) => value || '*').join('@');

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
    const parsed: { [key: string]: string | undefined } = {};
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
    if (isDuplicate({hostname: node.hostname}, token)) {
        throw {data: {msg: 'Already exists.', field: 'hostname'}, type: ErrorTypes.conflict};
    }

    if (node.key) {
        if (isDuplicate({key: node.key}, token)) {
            throw {data: {msg: 'Already exists.', field: 'key'}, type: ErrorTypes.conflict};
        }
    }

    if (isDuplicate({mac: node.mac}, token)) {
        throw {data: {msg: 'Already exists.', field: 'mac'}, type: ErrorTypes.conflict};
    }

    if (nodeSecrets.monitoringToken && isDuplicate({monitoringToken: nodeSecrets.monitoringToken}, token)) {
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

function getNodeValue(prefix: LINE_PREFIX, node: Node, nodeSecrets: NodeSecrets): string {
    switch (prefix) {
        case LINE_PREFIX.HOSTNAME:
            return node.hostname;
        case LINE_PREFIX.NICKNAME:
            return node.nickname;
        case LINE_PREFIX.EMAIL:
            return node.email;
        case LINE_PREFIX.COORDS:
            return node.coords || "";
        case LINE_PREFIX.MAC:
            return node.mac;
        case LINE_PREFIX.TOKEN:
            return node.token;
        case LINE_PREFIX.MONITORING:
            if (node.monitoring && node.monitoringConfirmed) {
                return "aktiv";
            } else if (node.monitoring && !node.monitoringConfirmed) {
                return "pending";
            }
            return "";
        case LINE_PREFIX.MONITORING_TOKEN:
            return nodeSecrets.monitoringToken || "";
        default:
            return unhandledEnumField(prefix);
    }
}

async function writeNodeFile(
    isUpdate: boolean,
    token: Token,
    node: Node,
    nodeSecrets: NodeSecrets,
): Promise<{ token: Token, node: Node }> {
    const filename = toNodeFilename(token, node, nodeSecrets);
    let data = '';

    for (const prefix of Object.values(LINE_PREFIX)) {
        data += `${prefix}${getNodeValue(prefix, node, nodeSecrets)}\n`;
    }

    if (node.key) {
        data += `key "${node.key}";\n`;
    }

    // since node.js is single threaded we don't need a lock

    if (isUpdate) {
        const files = findNodeFilesSync({token: token});
        if (files.length !== 1) {
            throw {data: 'Node not found.', type: ErrorTypes.notFound};
        }

        checkNoDuplicates(token, node, nodeSecrets);

        const file = files[0];
        try {
            oldFs.unlinkSync(file);
        } catch (error) {
            Logger.tag('node', 'save').error('Could not delete old node file: ' + file, error);
            throw {data: 'Could not remove old node data.', type: ErrorTypes.internalError};
        }
    } else {
        checkNoDuplicates(null, node, nodeSecrets);
    }

    try {
        oldFs.writeFileSync(filename, data, 'utf8');
        return {token, node};
    } catch (error) {
        Logger.tag('node', 'save').error('Could not write node file: ' + filename, error);
        throw {data: 'Could not write node data.', type: ErrorTypes.internalError};
    }
}

async function deleteNodeFile(token: Token): Promise<void> {
    let files;
    try {
        files = await findNodeFiles({token: token});
    } catch (error) {
        Logger.tag('node', 'delete').error('Could not find node file: ' + files, error);
        throw {data: 'Could not delete node.', type: ErrorTypes.internalError};
    }

    if (files.length !== 1) {
        throw {data: 'Node not found.', type: ErrorTypes.notFound};
    }

    try {
        oldFs.unlinkSync(files[0]);
    } catch (error) {
        Logger.tag('node', 'delete').error('Could not delete node file: ' + files, error);
        throw {data: 'Could not delete node.', type: ErrorTypes.internalError};
    }
}

class NodeBuilder {
    public token: Token = "" as Token; // FIXME: Either make token optional in Node or handle this!
    public nickname: Nickname = "" as Nickname;
    public email: EmailAddress = "" as EmailAddress;
    public hostname: Hostname = "" as Hostname; // FIXME: Either make hostname optional in Node or handle this!
    public coords?: Coordinates;
    public key?: FastdKey;
    public mac: MAC = "" as MAC; // FIXME: Either make mac optional in Node or handle this!
    public monitoring: boolean = false;
    public monitoringConfirmed: boolean = false;
    public monitoringState: MonitoringState = MonitoringState.DISABLED;

    constructor(
        public readonly modifiedAt: UnixTimestampSeconds,
    ) {
    }

    public build(): Node {
        return {
            token: this.token,
            nickname: this.nickname,
            email: this.email,
            hostname: this.hostname,
            coords: this.coords,
            key: this.key,
            mac: this.mac,
            monitoring: this.monitoring,
            monitoringConfirmed: this.monitoringConfirmed,
            monitoringState: this.monitoringState,
            modifiedAt: this.modifiedAt,
        }
    }
}

function setNodeValue(prefix: LINE_PREFIX, node: NodeBuilder, nodeSecrets: NodeSecrets, value: string) {
    switch (prefix) {
        case LINE_PREFIX.HOSTNAME:
            node.hostname = value as Hostname;
            break;
        case LINE_PREFIX.NICKNAME:
            node.nickname = value as Nickname;
            break;
        case LINE_PREFIX.EMAIL:
            node.email = value as EmailAddress;
            break;
        case LINE_PREFIX.COORDS:
            node.coords = value as Coordinates;
            break;
        case LINE_PREFIX.MAC:
            node.mac = value as MAC;
            break;
        case LINE_PREFIX.TOKEN:
            node.token = value as Token;
            break;
        case LINE_PREFIX.MONITORING:
            const active = value === 'aktiv';
            const pending = value === 'pending';
            node.monitoring = active || pending;
            node.monitoringConfirmed = active;
            node.monitoringState =
                active ? MonitoringState.ACTIVE : (pending ? MonitoringState.PENDING : MonitoringState.DISABLED);
            break;
        case LINE_PREFIX.MONITORING_TOKEN:
            nodeSecrets.monitoringToken = value as MonitoringToken;
            break;
        default:
            return unhandledEnumField(prefix);
    }
}

async function getModifiedAt(file: string): Promise<UnixTimestampSeconds> {
    const modifiedAtMs = (await fs.lstat(file)).mtimeMs as UnixTimestampMilliseconds;
    return toUnixTimestampSeconds(modifiedAtMs);
}

async function parseNodeFile(file: string): Promise<{ node: Node, nodeSecrets: NodeSecrets }> {
    const contents = await fs.readFile(file);
    const modifiedAt = await getModifiedAt(file);

    const lines = contents.toString().split("\n");

    const node = new NodeBuilder(modifiedAt);
    const nodeSecrets: NodeSecrets = {};

    for (const line of lines) {
        if (line.substring(0, 5) === 'key "') {
            node.key = normalizeString(line.split('"')[1]) as FastdKey;
        } else {
            for (const prefix of Object.values(LINE_PREFIX)) {
                if (line.substring(0, prefix.length) === prefix) {
                    const value = normalizeString(line.substring(prefix.length));
                    setNodeValue(prefix, node, nodeSecrets, value);
                    break;
                }
            }
        }
    }

    return {
        node: node.build(),
        nodeSecrets,
    };
}

async function findNodeDataByFilePattern(filter: NodeFilter): Promise<{ node: Node, nodeSecrets: NodeSecrets } | null> {
    const files = await findNodeFiles(filter);

    if (files.length !== 1) {
        return null;
    }

    const file = files[0];
    return await parseNodeFile(file);
}

async function getNodeDataByFilePattern(filter: NodeFilter): Promise<{ node: Node, nodeSecrets: NodeSecrets }> {
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
        MailType.MONITORING_CONFIRMATION,
        {
            node: node,
            confirmUrl: confirmUrl,
            disableUrl: disableUrl
        },
    );
}

export async function createNode(node: Node): Promise<{ token: Token, node: Node }> {
    const token: Token = generateToken();
    const nodeSecrets: NodeSecrets = {};

    node.monitoringConfirmed = false;

    if (node.monitoring) {
        nodeSecrets.monitoringToken = generateToken<MonitoringToken>();
    }

    const written = await writeNodeFile(false, token, node, nodeSecrets);

    if (written.node.monitoring && !written.node.monitoringConfirmed) {
        await sendMonitoringConfirmationMail(written.node, nodeSecrets)
    }

    return written;
}

export async function updateNode(token: Token, node: Node): Promise<{ token: Token, node: Node }> {
    const {node: currentNode, nodeSecrets} = await getNodeDataWithSecretsByToken(token);

    let monitoringConfirmed = false;
    let monitoringToken: MonitoringToken | undefined;

    if (node.monitoring) {
        if (!currentNode.monitoring) {
            // monitoring just has been enabled
            monitoringConfirmed = false;
            monitoringToken = generateToken<MonitoringToken>();

        } else {
            // monitoring is still enabled

            if (currentNode.email !== node.email) {
                // new email so we need a new token and a reconfirmation
                monitoringConfirmed = false;
                monitoringToken = generateToken<MonitoringToken>();

            } else {
                // email unchanged, keep token (fix if not set) and confirmation state
                monitoringConfirmed = currentNode.monitoringConfirmed;
                monitoringToken = nodeSecrets.monitoringToken || generateToken<MonitoringToken>();
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
): Promise<{ token: Token, node: Node }> {
    return await writeNodeFile(true, token, node, nodeSecrets);
}

export async function deleteNode(token: Token): Promise<void> {
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

export async function getNodeDataWithSecretsByMac(mac: MAC): Promise<{ node: Node, nodeSecrets: NodeSecrets } | null> {
    return await findNodeDataByFilePattern({mac});
}

export async function getNodeDataByMac(mac: MAC): Promise<Node | null> {
    const result = await findNodeDataByFilePattern({mac});
    return result ? result.node : null;
}

export async function getNodeDataWithSecretsByToken(token: Token): Promise<{ node: Node, nodeSecrets: NodeSecrets }> {
    return await getNodeDataByFilePattern({token: token});
}

export async function getNodeDataByToken(token: Token): Promise<Node> {
    const {node} = await getNodeDataByFilePattern({token: token});
    return node;
}

export async function getNodeDataWithSecretsByMonitoringToken(
    monitoringToken: MonitoringToken
): Promise<{ node: Node, nodeSecrets: NodeSecrets }> {
    return await getNodeDataByFilePattern({monitoringToken: monitoringToken});
}

export async function getNodeDataByMonitoringToken(
    monitoringToken: MonitoringToken
): Promise<Node> {
    const {node} = await getNodeDataByFilePattern({monitoringToken: monitoringToken});
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
            } catch (error) {
                throw new Error(
                    'Cannot rename file ' + file + ' to ' + expectedFilename + ' => ' + error
                );
            }
        }
    }
}

export async function findNodesModifiedBefore(timestamp: UnixTimestampSeconds): Promise<Node[]> {
    const nodes = await getAllNodes();
    return _.filter(nodes, node => node.modifiedAt < timestamp);
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
                unhandledEnumField(monitoringState);
        }
    });

    return nodeStatistics;
}
