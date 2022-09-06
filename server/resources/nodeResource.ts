import Constraints from "../shared/validation/constraints";
import ErrorTypes from "../utils/errorTypes";
import * as MonitoringService from "../services/monitoringService";
import * as NodeService from "../services/nodeService";
import { normalizeMac, normalizeString } from "../shared/utils/strings";
import { forConstraint, forConstraints } from "../shared/validation/validator";
import * as Resources from "../utils/resources";
import { handleJSONWithData } from "../utils/resources";
import { Request, Response } from "express";
import {
    CreateOrUpdateNode,
    DomainSpecificNodeResponse,
    isCreateOrUpdateNode,
    isNodeSortField,
    isString,
    isToken,
    isUndefined,
    JSONObject,
    JSONValue,
    MAC,
    NodeResponse,
    NodeStateData,
    NodeTokenResponse,
    toDomainSpecificNodeResponse,
    Token,
    toNodeResponse,
    toNodeTokenResponse,
} from "../types";
import { filterUndefinedFromJSON } from "../shared/utils/json";

const nodeFields = [
    "hostname",
    "key",
    "email",
    "nickname",
    "mac",
    "coords",
    "monitoring",
];

function getNormalizedNodeData(reqData: JSONObject): CreateOrUpdateNode {
    const node: { [key: string]: unknown } = {};
    for (const field of nodeFields) {
        let value: JSONValue | undefined = reqData[field];
        if (isString(value)) {
            value = normalizeString(value);
            if (field === "mac") {
                value = normalizeMac(value as MAC);
            }
        }

        if (!isUndefined(value)) {
            node[field] = value;
        }
    }

    if (isCreateOrUpdateNode(node)) {
        return node;
    }

    throw { data: "Invalid node data.", type: ErrorTypes.badRequest };
}

const isValidNode = forConstraints(Constraints.node, false);
const isValidToken = forConstraint(Constraints.token, false);

function getValidatedToken(data: JSONObject): Token {
    if (!isToken(data.token)) {
        throw { data: "Missing token.", type: ErrorTypes.badRequest };
    }
    const token = normalizeString(data.token);
    if (!isValidToken(token)) {
        throw { data: "Invalid token.", type: ErrorTypes.badRequest };
    }
    return token as Token;
}

export const create = handleJSONWithData<NodeTokenResponse>(async (data) => {
    const baseNode = getNormalizedNodeData(data);
    if (!isValidNode(baseNode)) {
        throw { data: "Invalid node data.", type: ErrorTypes.badRequest };
    }

    const node = await NodeService.createNode(baseNode);
    return toNodeTokenResponse(node);
});

export const update = handleJSONWithData<NodeTokenResponse>(async (data) => {
    const validatedToken: Token = getValidatedToken(data);
    const baseNode = getNormalizedNodeData(data);
    if (!isValidNode(baseNode)) {
        throw { data: "Invalid node data.", type: ErrorTypes.badRequest };
    }

    const node = await NodeService.updateNode(validatedToken, baseNode);
    return toNodeTokenResponse(node);
});

export const remove = handleJSONWithData<void>(async (data) => {
    const validatedToken = getValidatedToken(data);
    await NodeService.deleteNode(validatedToken);
});

export const get = handleJSONWithData<NodeResponse>(async (data) => {
    const validatedToken: Token = getValidatedToken(data);
    const node = await NodeService.getNodeDataByToken(validatedToken);
    return toNodeResponse(node);
});

async function doGetAll(
    req: Request
): Promise<{ total: number; pageNodes: DomainSpecificNodeResponse[] }> {
    const restParams = await Resources.getValidRestParams("list", "node", req);

    const nodes = await NodeService.getAllNodes();

    const realNodes = nodes.filter(
        (node) =>
            // We ignore nodes without tokens as those are only manually added ones like gateways.
            !!node.token // FIXME: As node.token may not be undefined or null here, handle this when loading!
    );

    const macs: MAC[] = realNodes.map((node) => node.mac);
    const nodeStateByMac = await MonitoringService.getByMacs(macs);

    const domainSpecificNodes: DomainSpecificNodeResponse[] = realNodes.map(
        (node) => {
            const nodeState: NodeStateData = nodeStateByMac[node.mac] || {};
            return toDomainSpecificNodeResponse(node, nodeState);
        }
    );

    const filteredNodes = Resources.filter<DomainSpecificNodeResponse>(
        domainSpecificNodes,
        [
            "hostname",
            "nickname",
            "email",
            "token",
            "mac",
            "site",
            "domain",
            "key",
            "onlineState",
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

    return { total, pageNodes };
}

export function getAll(req: Request, res: Response): void {
    doGetAll(req)
        .then(
            (result: {
                total: number;
                pageNodes: DomainSpecificNodeResponse[];
            }) => {
                res.set("X-Total-Count", result.total.toString(10));
                return Resources.success(
                    res,
                    result.pageNodes.map(filterUndefinedFromJSON)
                );
            }
        )
        .catch((err) => Resources.error(res, err));
}
