import {
    CreateOrUpdateNode,
    Domain,
    DomainSpecificNodeResponse,
    MonitoringResponse,
    MonitoringState,
    MonitoringToken,
    NodeResponse,
    NodeTokenResponse,
    OnlineState,
    Site,
    StoredNode,
} from "../shared/types";

export * from "./config";
export * from "./database";
export * from "./logger";
export * from "../shared/types";

export type NodeStateData = {
    site?: Site;
    domain?: Domain;
    state: OnlineState;
};

export function toCreateOrUpdateNode(node: StoredNode): CreateOrUpdateNode {
    return {
        nickname: node.nickname,
        email: node.email,
        hostname: node.hostname,
        coords: node.coords,
        key: node.key,
        mac: node.mac,
        monitoring: node.monitoringState !== MonitoringState.DISABLED,
    };
}

export function toNodeResponse(node: StoredNode): NodeResponse {
    return {
        token: node.token,
        nickname: node.nickname,
        email: node.email,
        hostname: node.hostname,
        coords: node.coords,
        key: node.key,
        mac: node.mac,
        monitoring: node.monitoringState !== MonitoringState.DISABLED,
        monitoringConfirmed: node.monitoringState === MonitoringState.ACTIVE,
        monitoringState: node.monitoringState,
        modifiedAt: node.modifiedAt,
    };
}

export function toNodeTokenResponse(node: StoredNode): NodeTokenResponse {
    return {
        token: node.token,
        node: toNodeResponse(node),
    };
}

export function toDomainSpecificNodeResponse(
    node: StoredNode,
    nodeStateData: NodeStateData
): DomainSpecificNodeResponse {
    return {
        token: node.token,
        nickname: node.nickname,
        email: node.email,
        hostname: node.hostname,
        coords: node.coords,
        key: node.key,
        mac: node.mac,
        monitoring: node.monitoringState !== MonitoringState.DISABLED,
        monitoringConfirmed: node.monitoringState === MonitoringState.ACTIVE,
        monitoringState: node.monitoringState,
        modifiedAt: node.modifiedAt,
        site: nodeStateData.site,
        domain: nodeStateData.domain,
        onlineState: nodeStateData.state,
    };
}

export function toMonitoringResponse(node: StoredNode): MonitoringResponse {
    return {
        hostname: node.hostname,
        mac: node.mac,
        email: node.email,
        monitoring: node.monitoringState !== MonitoringState.DISABLED,
        monitoringConfirmed: node.monitoringState === MonitoringState.ACTIVE,
    };
}

export type NodeSecrets = {
    monitoringToken?: MonitoringToken;
};
