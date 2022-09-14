/**
 * Contains types and type guards for representing Freifunk nodes in various states.
 */
import { isObject } from "./objects";
import { isOptional } from "./helpers";
import type {
    Coordinates,
    Domain,
    FastdKey,
    MAC,
    Nickname,
    Site,
} from "./newtypes";
import {
    isCoordinates,
    isDomain,
    isFastdKey,
    isMAC,
    isNickname,
    isSite,
    toIsNewtype,
} from "./newtypes";
import { isBoolean, isString } from "./primitives";
import { type SortFieldFor, toIsSortField } from "./sortfields";
import { type EmailAddress, isEmailAddress } from "./email";
import { isUnixTimestampSeconds, type UnixTimestampSeconds } from "./time";
import {
    isMonitoringState,
    isOnlineState,
    MonitoringState,
    OnlineState,
} from "./monitoring";

/**
 * ID of a node in the context of the `nodes.json` of the Freifunk community's node map.
 *
 * This is typically the nodes lowercase MAC address without any delimiters.
 */
export type NodeId = string & { readonly __tag: unique symbol };

/**
 * Type guard for {@link NodeId}.
 *
 * @param arg - Value to check.
 */
export const isNodeId = toIsNewtype(isString, "" as NodeId);

/**
 * Token of a Freifunk node registered with ffffng. This is being used to authorize a user to delete or modify the
 * data being stored for a node.
 *
 * This token should be kept secret by the owner of the node.
 */
export type Token = string & { readonly __tag: unique symbol };

/**
 * Type guard for {@link Token}.
 *
 * @param arg - Value to check.
 */
export const isToken = toIsNewtype(isString, "" as Token);

/**
 * Representation of a Freifunk node's hostname.
 */
export type Hostname = string & { readonly __tag: unique symbol };

/**
 * Type guard for {@link Hostname}.
 *
 * @param arg - Value to check.
 */
export const isHostname = toIsNewtype(isString, "" as Hostname);

/**
 * ID to identify a Freifunk node on the communities map.
 */
export type MapId = string & { readonly __tag: unique symbol };

/**
 * Type guard for {@link MapId}.
 *
 * @param arg - Value to check.
 */
export const isMapId = toIsNewtype(isString, "" as MapId);

/**
 * Most basic information of a Freifunk Node.
 */
export type BaseNode = {
    /**
     * Name / nickname that should be used to contact the node owner.
     */
    nickname: Nickname;

    /**
     * Email address that should be used to contact the node owner.
     */
    email: EmailAddress;

    /**
     * Hostname of the node that will be displayed on the community's node map.
     */
    hostname: Hostname;

    /**
     * Optional coordinates of the node to position it on the community's node map.
     */
    coords: Coordinates | undefined;

    /**
     * Optional fastd key of the node. This is the key used by the node to open a VPN tunnel to Freifunk gateways.
     */
    key: FastdKey | undefined;

    /**
     * MAC address of the node. This MAC address is used to identify the node at various places, e.g. when retrieving
     * information of the node from the `nodes.json` of the communities node map.
     */
    mac: MAC;
};

/**
 * Type guard for {@link BaseNode}.
 *
 * @param arg - Value to check.
 */
export function isBaseNode(arg: unknown): arg is BaseNode {
    if (!isObject(arg)) {
        return false;
    }
    const node = arg as BaseNode;
    return (
        isNickname(node.nickname) &&
        isEmailAddress(node.email) &&
        isHostname(node.hostname) &&
        isOptional(node.coords, isCoordinates) &&
        isOptional(node.key, isFastdKey) &&
        isMAC(node.mac)
    );
}

/**
 * Node data used when creating or updating a node.
 */
export type CreateOrUpdateNode = BaseNode & {
    /**
     * Whether to monitor the nodes online state and notify its owner when it's offline for a longer period of time.
     */
    monitoring: boolean;
};

/**
 * Type guard for {@link CreateOrUpdateNode}.
 *
 * @param arg - Value to check.
 */
export function isCreateOrUpdateNode(arg: unknown): arg is CreateOrUpdateNode {
    if (!isBaseNode(arg)) {
        return false;
    }
    const node = arg as CreateOrUpdateNode;
    return isBoolean(node.monitoring);
}

/**
 * Representation of a Freifunk node as it is stored on the server.
 */
export type StoredNode = BaseNode & {
    /**
     * Token used to authorize a user to delete or modify the data being stored for a node.
     *
     * This token should be kept secret by the owner of the node.
     */
    token: Token;

    /**
     * State of the online monitoring for this node.
     *
     * See {@link MonitoringState}.
     */
    monitoringState: MonitoringState;

    /**
     * Last time the node data has been updated on the server.
     */
    modifiedAt: UnixTimestampSeconds;
};

/**
 * Type guard for {@link StoredNode}.
 *
 * @param arg - Value to check.
 */
export function isStoredNode(arg: unknown): arg is StoredNode {
    if (!isObject(arg)) {
        return false;
    }
    const node = arg as StoredNode;
    return (
        isBaseNode(node) &&
        isToken(node.token) &&
        isMonitoringState(node.monitoringState) &&
        isUnixTimestampSeconds(node.modifiedAt)
    );
}

/**
 * Data of a Freifunk node as it is provided by the server's API.
 */
export type NodeResponse = StoredNode & {
    /**
     * Whether the node's online state should be monitored.
     */
    monitoring: boolean;

    /**
     * Specifies if the node owner has clicked the email confirmation link to enable monitoring of the online state.
     */
    monitoringConfirmed: boolean;
};

/**
 * Type guard for {@link NodeResponse}.
 *
 * @param arg - Value to check.
 */
export function isNodeResponse(arg: unknown): arg is NodeResponse {
    if (!isStoredNode(arg)) {
        return false;
    }
    const node = arg as NodeResponse;
    return isBoolean(node.monitoring) && isBoolean(node.monitoringConfirmed);
}

/**
 * Data of a Freifunk node as it is provided by the server's API also providing the token to authorize node owners.
 */
export type NodeTokenResponse = {
    /**
     * Token used to authorize a user to delete or modify the data being stored for a node.
     *
     * This token should be kept secret by the owner of the node.
     */
    token: Token;

    /**
     * Data of the Freifunk node. See {@link NodeResponse}.
     */
    node: NodeResponse;
};

/**
 * Type guard for {@link NodeTokenResponse}.
 *
 * @param arg - Value to check.
 */
export function isNodeTokenResponse(arg: unknown): arg is NodeTokenResponse {
    if (!isObject(arg)) {
        return false;
    }
    const response = arg as NodeTokenResponse;
    return (
        isToken(response.token) &&
        isNodeResponse(response.node) &&
        response.token === response.node.token
    );
}

/**
 * Represents a node in the context of a Freifunk site and domain.
 */
export type DomainSpecificNodeResponse = NodeResponse & {
    /**
     * Freifunk site the node resides in or `undefined` if unknown.
     */
    site: Site | undefined;

    /**
     * Freifunk domain the node resides in or `undefined` if unknown.
     */
    domain: Domain | undefined;

    /**
     * Online state of the Freifunk node or `undefined` if unknown.
     */
    onlineState: OnlineState | undefined;
};

/**
 * Type guard for {@link DomainSpecificNodeResponse}.
 *
 * @param arg - Value to check.
 */
export function isDomainSpecificNodeResponse(
    arg: unknown
): arg is DomainSpecificNodeResponse {
    if (!isNodeResponse(arg)) {
        return false;
    }
    const node = arg as DomainSpecificNodeResponse;
    return (
        isOptional(node.site, isSite) &&
        isOptional(node.domain, isDomain) &&
        isOptional(node.onlineState, isOnlineState)
    );
}

/**
 * Enum specifying the allowed sort fields when retrieving the list of nodes via the REST API.
 */
export enum NodeSortFieldEnum {
    // noinspection JSUnusedGlobalSymbols

    /**
     * See {@link BaseNode.hostname}.
     */
    HOSTNAME = "hostname",

    /**
     * See {@link BaseNode.nickname}.
     */
    NICKNAME = "nickname",

    /**
     * See {@link BaseNode.email}.
     */
    EMAIL = "email",

    /**
     * See {@link StoredNode.token}.
     */
    TOKEN = "token",

    /**
     * See {@link BaseNode.mac}.
     */
    MAC = "mac",

    /**
     * See {@link BaseNode.key}.
     */
    KEY = "key",

    /**
     * See {@link DomainSpecificNodeResponse.site}.
     */
    SITE = "site",

    /**
     * See {@link DomainSpecificNodeResponse.domain}.
     */
    DOMAIN = "domain",

    /**
     * See {@link BaseNode.coords}.
     */
    COORDS = "coords",

    /**
     * See {@link DomainSpecificNodeResponse.onlineState}.
     */
    ONLINE_STATE = "onlineState",

    /**
     * See {@link StoredNode.monitoringState}.
     */
    MONITORING_STATE = "monitoringState",
}

/**
 * Allowed sort fields when retrieving the list of nodes via the REST API.
 */
export type NodeSortField = SortFieldFor<
    DomainSpecificNodeResponse,
    NodeSortFieldEnum
>;

/**
 * Type guard for {@link NodeSortField}.
 *
 * @param arg - Value to check.
 */
export const isNodeSortField = toIsSortField<
    DomainSpecificNodeResponse,
    NodeSortFieldEnum,
    typeof NodeSortFieldEnum,
    NodeSortField
>(NodeSortFieldEnum);

/**
 * Allowed filters when retrieving the list of nodes via the REST API.
 */
export type NodesFilter = {
    /**
     * If set only nodes with / without a Fastd key will be returned.
     */
    hasKey?: boolean;

    /**
     * If set only nodes with / without geo coordinates will be returned.
     */
    hasCoords?: boolean;

    /**
     * If set only nodes having the given monitoring state will be returned.
     */
    monitoringState?: MonitoringState;

    /**
     * If set only nodes belonging to the given Freifunk site will be returned.
     */
    site?: Site;

    /**
     * If set only nodes belonging to the given Freifunk domain will be returned.
     */
    domain?: Domain;

    /**
     * If set only nodes having the given online state will be returned.
     */
    onlineState?: OnlineState;
};

/**
 * Allowed filter fields when retrieving the list of nodes via the REST API.
 */
export const NODES_FILTER_FIELDS: Record<
    keyof NodesFilter,
    | BooleanConstructor
    | StringConstructor
    | typeof MonitoringState
    | typeof OnlineState
> = {
    /**
     * See {@link NodesFilter.hasKey}.
     */
    hasKey: Boolean,

    /**
     * See {@link NodesFilter.hasCoords}.
     */
    hasCoords: Boolean,

    /**
     * See {@link NodesFilter.monitoringState}.
     */
    monitoringState: MonitoringState,

    /**
     * See {@link NodesFilter.site}.
     */
    site: String,

    /**
     * See {@link NodesFilter.domain}.
     */
    domain: String,

    /**
     * See {@link NodesFilter.onlineState}.
     */
    onlineState: OnlineState,
};

/**
 * Type guard for {@link NodesFilter}.
 *
 * @param arg - Value to check.
 */
export function isNodesFilter(arg: unknown): arg is NodesFilter {
    if (!isObject(arg)) {
        return false;
    }
    const filter = arg as NodesFilter;
    return (
        isOptional(filter.hasKey, isBoolean) &&
        isOptional(filter.hasCoords, isBoolean) &&
        isOptional(filter.monitoringState, isMonitoringState) &&
        isOptional(filter.site, isSite) &&
        isOptional(filter.domain, isDomain) &&
        isOptional(filter.onlineState, isOnlineState)
    );
}
