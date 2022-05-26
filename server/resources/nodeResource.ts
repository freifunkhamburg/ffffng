import _ from "lodash";
import deepExtend from "deep-extend";

import Constraints from "../validation/constraints";
import ErrorTypes from "../utils/errorTypes";
import * as MonitoringService from "../services/monitoringService";
import * as NodeService from "../services/nodeService";
import {normalizeMac, normalizeString} from "../utils/strings";
import {forConstraint, forConstraints} from "../validation/validator";
import * as Resources from "../utils/resources";
import {Entity} from "../utils/resources";
import {Request, Response} from "express";
import {EnhancedNode, Node} from "../types";

const nodeFields = ['hostname', 'key', 'email', 'nickname', 'mac', 'coords', 'monitoring'];

function getNormalizedNodeData(reqData: any): Node {
    const node: {[key: string]: any} = {};
    _.each(nodeFields, function (field) {
        let value = normalizeString(reqData[field]);
        if (field === 'mac') {
            value = normalizeMac(value);
        }
        node[field] = value;
    });
    return node as Node;
}

const isValidNode = forConstraints(Constraints.node, false);
const isValidToken = forConstraint(Constraints.token, false);

export function create (req: Request, res: Response): void {
    const data = Resources.getData(req);

    const node = getNormalizedNodeData(data);
    if (!isValidNode(node)) {
        return Resources.error(res, {data: 'Invalid node data.', type: ErrorTypes.badRequest});
    }

    NodeService.createNode(node)
        .then(result => Resources.success(res, result))
        .catch(err => Resources.error(res, err));
}

export function update (req: Request, res: Response): void {
    const data = Resources.getData(req);

    const token = normalizeString(data.token);
    if (!isValidToken(token)) {
        return Resources.error(res, {data: 'Invalid token.', type: ErrorTypes.badRequest});
    }

    const node = getNormalizedNodeData(data);
    if (!isValidNode(node)) {
        return Resources.error(res, {data: 'Invalid node data.', type: ErrorTypes.badRequest});
    }

    NodeService.updateNode(token, node)
        .then(result => Resources.success(res, result))
        .catch(err => Resources.error(res, err));
}

export function remove(req: Request, res: Response): void {
    const data = Resources.getData(req);

    const token = normalizeString(data.token);
    if (!isValidToken(token)) {
        return Resources.error(res, {data: 'Invalid token.', type: ErrorTypes.badRequest});
    }

    NodeService.deleteNode(token)
        .then(() => Resources.success(res, {}))
        .catch(err => Resources.error(res, err));
}

export function get(req: Request, res: Response): void {
    const token = normalizeString(Resources.getData(req).token);
    if (!isValidToken(token)) {
        return Resources.error(res, {data: 'Invalid token.', type: ErrorTypes.badRequest});
    }

    NodeService.getNodeDataByToken(token)
        .then(node => Resources.success(res, node))
        .catch(err => Resources.error(res, err));
}

async function doGetAll(req: Request): Promise<{ total: number; pageNodes: any }> {
    const restParams = await Resources.getValidRestParams('list', 'node', req);

    const nodes = await NodeService.getAllNodes();

    const realNodes = _.filter(nodes, node =>
        // We ignore nodes without tokens as those are only manually added ones like gateways.
        !!node.token
    );

    const macs = _.map(realNodes, (node: Node): string => node.mac);
    const nodeStateByMac = await MonitoringService.getByMacs(macs);

    const enhancedNodes: EnhancedNode[] = _.map(realNodes, (node: Node): EnhancedNode => {
        const nodeState = nodeStateByMac[node.mac];
        if (nodeState) {
            return deepExtend({}, node, {
                site: nodeState.site,
                domain: nodeState.domain,
                onlineState: nodeState.state
            });
        }

        return node as EnhancedNode;
    });

    const filteredNodes = Resources.filter<EnhancedNode>(
        enhancedNodes,
        [
            'hostname',
            'nickname',
            'email',
            'token',
            'mac',
            'site',
            'domain',
            'key',
            'onlineState'
        ],
        restParams
    );

    const total = filteredNodes.length;

    const sortedNodes = Resources.sort(
        filteredNodes,
        [
            'hostname',
            'nickname',
            'email',
            'token',
            'mac',
            'key',
            'site',
            'domain',
            'coords',
            'onlineState',
            'monitoringState'
        ],
        restParams
    );
    const pageNodes = Resources.getPageEntities(sortedNodes, restParams);

    return {total, pageNodes};
}

export function getAll(req: Request, res: Response): void {
    doGetAll(req)
        .then((result: {total: number, pageNodes: any[]}) => {
            res.set('X-Total-Count', result.total.toString(10));
            return Resources.success(res, result.pageNodes);
        })
        .catch((err: any) => Resources.error(res, err));
}
