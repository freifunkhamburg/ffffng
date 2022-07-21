import _ from "lodash";

import Constraints from "../validation/constraints";
import ErrorTypes from "../utils/errorTypes";
import * as MonitoringService from "../services/monitoringService";
import * as NodeService from "../services/nodeService";
import {normalizeMac, normalizeString} from "../utils/strings";
import {forConstraint, forConstraints} from "../validation/validator";
import * as Resources from "../utils/resources";
import {handleJSONWithData} from "../utils/resources";
import {Request, Response} from "express";
import {
    CreateOrUpdateNode,
    DomainSpecificNodeResponse,
    isNodeSortField,
    isToken, JSONObject,
    MAC,
    NodeResponse,
    NodeStateData,
    NodeTokenResponse,
    StoredNode,
    toDomainSpecificNodeResponse,
    Token,
    toNodeResponse,
    toNodeTokenResponse
} from "../types";

const nodeFields = ['hostname', 'key', 'email', 'nickname', 'mac', 'coords', 'monitoring'];

function getNormalizedNodeData(reqData: any): CreateOrUpdateNode {
    const node: { [key: string]: any } = {};
    _.each(nodeFields, function (field) {
        let value = normalizeString(reqData[field]);
        if (field === 'mac') {
            value = normalizeMac(value);
        }
        node[field] = value;
    });
    return node as CreateOrUpdateNode;
}

const isValidNode = forConstraints(Constraints.node, false);
const isValidToken = forConstraint(Constraints.token, false);

function getValidatedToken(data: JSONObject): Token {
    if (!isToken(data.token)) {
        throw {data: 'Missing token.', type: ErrorTypes.badRequest};
    }
    const token = normalizeString(data.token);
    if (!isValidToken(token)) {
        throw {data: 'Invalid token.', type: ErrorTypes.badRequest};
    }
    return token as Token;
}

export const create = handleJSONWithData<NodeTokenResponse>(async data => {
    const baseNode = getNormalizedNodeData(data);
    if (!isValidNode(baseNode)) {
        throw {data: 'Invalid node data.', type: ErrorTypes.badRequest};
    }

    const node = await NodeService.createNode(baseNode);
    return toNodeTokenResponse(node);
});

export const update = handleJSONWithData<NodeTokenResponse>(async data => {
    const validatedToken: Token = getValidatedToken(data);
    const baseNode = getNormalizedNodeData(data);
    if (!isValidNode(baseNode)) {
        throw {data: 'Invalid node data.', type: ErrorTypes.badRequest};
    }

    const node = await NodeService.updateNode(validatedToken, baseNode);
    return toNodeTokenResponse(node);
});

export const remove = handleJSONWithData<void>(async data => {
    const validatedToken = getValidatedToken(data);
    await NodeService.deleteNode(validatedToken);
});

export const get = handleJSONWithData<NodeResponse>(async data => {
    const validatedToken: Token = getValidatedToken(data);
    const node = await NodeService.getNodeDataByToken(validatedToken);
    return toNodeResponse(node);
});

async function doGetAll(req: Request): Promise<{ total: number; pageNodes: any }> {
    const restParams = await Resources.getValidRestParams('list', 'node', req);

    const nodes = await NodeService.getAllNodes();

    const realNodes = _.filter(nodes, node =>
        // We ignore nodes without tokens as those are only manually added ones like gateways.
        !!node.token
    );

    const macs: MAC[] = _.map(realNodes, (node: StoredNode): MAC => node.mac);
    const nodeStateByMac = await MonitoringService.getByMacs(macs);

    const domainSpecificNodes: DomainSpecificNodeResponse[] = _.map(realNodes, (node: StoredNode): DomainSpecificNodeResponse => {
        const nodeState: NodeStateData = nodeStateByMac[node.mac] || {};
        return toDomainSpecificNodeResponse(node, nodeState);
    });

    const filteredNodes = Resources.filter<DomainSpecificNodeResponse>(
        domainSpecificNodes,
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
        isNodeSortField,
        restParams
    );
    const pageNodes = Resources.getPageEntities(sortedNodes, restParams);

    return {total, pageNodes};
}

export function getAll(req: Request, res: Response): void {
    doGetAll(req)
        .then((result: { total: number, pageNodes: any[] }) => {
            res.set('X-Total-Count', result.total.toString(10));
            return Resources.success(res, result.pageNodes);
        })
        .catch((err: any) => Resources.error(res, err));
}
