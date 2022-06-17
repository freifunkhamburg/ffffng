import {ArrayField, Field, RawJsonField} from "sparkson";

// Types shared with the client.
export type TypeGuard<T> = (arg: unknown) => arg is T;

export function isObject(arg: unknown): arg is object {
    return arg !== null && typeof arg === "object";
}

export function isArray<T>(arg: unknown, isT: TypeGuard<T>): arg is Array<T> {
    if (!Array.isArray(arg)) {
        return false;
    }
    for (const element of arg) {
        if (!isT(element)) {
            return false
        }
    }
    return true;
}

export function isMap(arg: unknown): arg is Map<any, any> {
    return arg instanceof Map;
}

export function isString(arg: unknown): arg is string {
    return typeof arg === "string"
}

export function isNumber(arg: unknown): arg is number {
    return typeof arg === "number"
}

export function isBoolean(arg: unknown): arg is boolean {
    return typeof arg === "boolean"
}

export function toIsArray<T>(isT: TypeGuard<T>): TypeGuard<T[]> {
    return (arg): arg is T[] => isArray(arg, isT);
}

export function toIsEnum<E>(enumDef: E): TypeGuard<E> {
    return (arg): arg is E => Object.values(enumDef).includes(arg as [keyof E]);
}

export function isOptional<T>(arg: unknown, isT: TypeGuard<T>): arg is (T | undefined) {
    return arg === undefined || isT(arg);
}

export type Version = string;

// Should be good enough for now.
export const isVersion = isString;

export type NodeStatistics = {
    registered: number;
    withVPN: number;
    withCoords: number;
    monitoring: {
        active: number;
        pending: number;
    };
};

export function isNodeStatistics(arg: unknown): arg is NodeStatistics {
    if (!isObject(arg)) {
        return false;
    }
    const stats = arg as NodeStatistics;
    return (
        isNumber(stats.registered) &&
        isNumber(stats.withVPN) &&
        isNumber(stats.withCoords) &&
        isObject(stats.monitoring) &&
        isNumber(stats.monitoring.active) &&
        isNumber(stats.monitoring.pending)
    );
}

export interface Statistics {
    nodes: NodeStatistics;
}

export function isStatistics(arg: unknown): arg is Statistics {
    return isObject(arg) && isNodeStatistics((arg as Statistics).nodes);
}

export class CommunityConfig {
    constructor(
        @Field("name") public name: string,
        @Field("domain") public domain: string,
        @Field("contactEmail") public contactEmail: string,
        @ArrayField("sites", String) public sites: string[],
        @ArrayField("domains", String) public domains: string[],
    ) {}
}

export function isCommunityConfig(arg: unknown): arg is CommunityConfig {
    if (!isObject(arg)) {
        return false;
    }
    const cfg = arg as CommunityConfig;
    return (
        isString(cfg.name) &&
        isString(cfg.domain) &&
        isString(cfg.contactEmail) &&
        isArray(cfg.sites, isString) &&
        isArray(cfg.domains, isString)
    );
}

export class LegalConfig {
    constructor(
        @Field("privacyUrl", true) public privacyUrl?: string,
        @Field("imprintUrl", true) public imprintUrl?: string,
    ) {}
}

export function isLegalConfig(arg: unknown): arg is LegalConfig {
    if (!isObject(arg)) {
        return false;
    }
    const cfg = arg as LegalConfig;
    return (
        isOptional(cfg.privacyUrl, isString) &&
        isOptional(cfg.imprintUrl, isString)
    );
}

export class ClientMapConfig {
    constructor(
        @Field("mapUrl") public mapUrl: string,
    ) {}
}

export function isClientMapConfig(arg: unknown): arg is ClientMapConfig {
    if (!isObject(arg)) {
        return false;
    }
    const cfg = arg as ClientMapConfig;
    return isString(cfg.mapUrl);
}

export class MonitoringConfig {
    constructor(
        @Field("enabled") public enabled: boolean,
    ) {}
}

export function isMonitoringConfig(arg: unknown): arg is MonitoringConfig {
    if (!isObject(arg)) {
        return false;
    }
    const cfg = arg as MonitoringConfig;
    return isBoolean(cfg.enabled);
}

export class Coords {
    constructor(
        @Field("lat") public lat: number,
        @Field("lng") public lng: number,
    ) {}
}

export function isCoords(arg: unknown): arg is Coords {
    if (!isObject(arg)) {
        return false;
    }
    const coords = arg as Coords;
    return (
        isNumber(coords.lat) &&
        isNumber(coords.lng)
    );
}

export class CoordsSelectorConfig {
    constructor(
        @Field("lat") public lat: number,
        @Field("lng") public lng: number,
        @Field("defaultZoom") public defaultZoom: number,
        @RawJsonField("layers") public layers: any, // TODO: Better types!
    ) {}
}

export function isCoordsSelectorConfig(arg: unknown): arg is CoordsSelectorConfig {
    if (!isObject(arg)) {
        return false;
    }
    const cfg = arg as CoordsSelectorConfig;
    return (
        isNumber(cfg.lat) &&
        isNumber(cfg.lng) &&
        isNumber(cfg.defaultZoom) &&
        isObject(cfg.layers) // TODO: Better types!
    );
}

export class OtherCommunityInfoConfig {
    constructor(
        @Field("showInfo") public showInfo: boolean,
        @Field("showBorderForDebugging") public showBorderForDebugging: boolean,
        @ArrayField("localCommunityPolygon", Coords) public localCommunityPolygon: Coords[],
    ) {}
}

export function isOtherCommunityInfoConfig(arg: unknown): arg is OtherCommunityInfoConfig {
    if (!isObject(arg)) {
        return false;
    }
    const cfg = arg as OtherCommunityInfoConfig;
    return (
        isBoolean(cfg.showInfo) &&
        isBoolean(cfg.showBorderForDebugging) &&
        isArray(cfg.localCommunityPolygon, isCoords)
    );
}

export class ClientConfig {
    constructor(
        @Field("community") public community: CommunityConfig,
        @Field("legal") public legal: LegalConfig,
        @Field("map") public map: ClientMapConfig,
        @Field("monitoring") public monitoring: MonitoringConfig,
        @Field("coordsSelector") public coordsSelector: CoordsSelectorConfig,
        @Field("otherCommunityInfo") public otherCommunityInfo: OtherCommunityInfoConfig,
        @Field("rootPath", true, undefined, "/") public rootPath: string,
    ) {
    }
}

export function isClientConfig(arg: unknown): arg is ClientConfig {
    if (!isObject(arg)) {
        return false;
    }
    const cfg = arg as ClientConfig;
    return (
        isCommunityConfig(cfg.community) &&
        isLegalConfig(cfg.legal) &&
        isClientMapConfig(cfg.map) &&
        isMonitoringConfig(cfg.monitoring) &&
        isCoordsSelectorConfig(cfg.coordsSelector) &&
        isOtherCommunityInfoConfig(cfg.otherCommunityInfo) &&
        isString(cfg.rootPath)
    );
}

// TODO: Token type.
export type Token = string;
export const isToken = isString;

export type FastdKey = string;
export const isFastdKey = isString;

export type MAC = string;
export const isMAC = isString;

export type UnixTimestampSeconds = number;
export type UnixTimestampMilliseconds = number;

export type MonitoringToken = string;
export enum MonitoringState {
    ACTIVE = "active",
    PENDING = "pending",
    DISABLED = "disabled",
}

export const isMonitoringState = toIsEnum(MonitoringState);

export type NodeId = string;
export const isNodeId = isString;

export interface Node {
    token: Token;
    nickname: string;
    email: string;
    hostname: string;
    coords?: string; // TODO: Use object with longitude and latitude.
    key?: FastdKey;
    mac: MAC;
    monitoring: boolean;
    monitoringConfirmed: boolean;
    monitoringState: MonitoringState;
    modifiedAt: UnixTimestampSeconds;
}

export function isNode(arg: unknown): arg is Node {
    if (!isObject(arg)) {
        return false;
    }
    const node = arg as Node;
    return (
        isToken(node.token) &&
        isString(node.nickname) &&
        isString(node.email) &&
        isString(node.hostname) &&
        isOptional(node.coords, isString) &&
        isOptional(node.key, isFastdKey) &&
        isMAC(node.mac) &&
        isBoolean(node.monitoring) &&
        isBoolean(node.monitoringConfirmed) &&
        isMonitoringState(node.monitoringState) &&
        isNumber(node.modifiedAt)
    );
}

export enum OnlineState {
    ONLINE = "ONLINE",
    OFFLINE = "OFFLINE",
}
export const isOnlineState = toIsEnum(OnlineState);

export type Site = string;
export const isSite = isString;

export type Domain = string;
export const isDomain = isString;

export interface EnhancedNode extends Node {
    site?: Site,
    domain?: Domain,
    onlineState?: OnlineState,
}

export function isEnhancedNode(arg: unknown): arg is EnhancedNode {
    if (!isNode(arg)) {
        return false;
    }
    const node = arg as EnhancedNode;
    return (
        isOptional(node.site, isSite) &&
        isOptional(node.domain, isDomain) &&
        isOptional(node.onlineState, isOnlineState)
    );
}

export interface NodesFilter {
    hasKey?: boolean;
    hasCoords?: boolean;
    monitoringState?: MonitoringState;
    site?: Site;
    domain?: Domain;
    onlineState?: OnlineState;
}

export const NODES_FILTER_FIELDS = {
    hasKey: Boolean,
    hasCoords: Boolean,
    monitoringState: MonitoringState,
    site: String,
    domain: String,
    onlineState: OnlineState,
};

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
