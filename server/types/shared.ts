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

export function isString(arg: unknown): arg is string {
    return typeof arg === "string"
}

export function toIsArray<T>(isT: TypeGuard<T>): TypeGuard<T[]> {
    return (arg): arg is T[] => isArray(arg, isT);
}

export function toIsEnum<E>(enumDef: E): TypeGuard<E> {
    return (arg): arg is E => Object.values(enumDef).includes(arg as [keyof E]);
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
    // noinspection SuspiciousTypeOfGuard
    return (
        typeof stats.registered === "number" &&
        typeof stats.withVPN === "number" &&
        typeof stats.withCoords === "number" &&
        typeof stats.monitoring === "object" &&
        typeof stats.monitoring.active === "number" &&
        typeof stats.monitoring.pending === "number"
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
    // noinspection SuspiciousTypeOfGuard
    return (
        typeof cfg.name === "string" &&
        typeof cfg.domain === "string" &&
        typeof cfg.contactEmail === "string" &&
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
    // noinspection SuspiciousTypeOfGuard
    return (
        (cfg.privacyUrl === undefined || typeof cfg.privacyUrl === "string") &&
        (cfg.imprintUrl === undefined || typeof cfg.imprintUrl === "string")
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
    // noinspection SuspiciousTypeOfGuard
    return typeof cfg.mapUrl === "string";
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
    // noinspection SuspiciousTypeOfGuard
    return typeof cfg.enabled === "boolean";
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
    // noinspection SuspiciousTypeOfGuard
    return (
        typeof coords.lat === "number" &&
        typeof coords.lng === "number"
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
    // noinspection SuspiciousTypeOfGuard
    return (
        typeof cfg.lat === "number" &&
        typeof cfg.lng === "number" &&
        typeof cfg.defaultZoom === "number" &&
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
    // noinspection SuspiciousTypeOfGuard
    return (
        typeof cfg.showInfo === "boolean" &&
        typeof cfg.showBorderForDebugging === "boolean" &&
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
    // noinspection SuspiciousTypeOfGuard
    return (
        isCommunityConfig(cfg.community) &&
        isLegalConfig(cfg.legal) &&
        isClientMapConfig(cfg.map) &&
        isMonitoringConfig(cfg.monitoring) &&
        isCoordsSelectorConfig(cfg.coordsSelector) &&
        isOtherCommunityInfoConfig(cfg.otherCommunityInfo) &&
        typeof cfg.rootPath === "string"
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
    // noinspection SuspiciousTypeOfGuard
    return (
        isToken(node.token) &&
        typeof node.nickname === "string" &&
        typeof node.email === "string" &&
        typeof node.hostname === "string" &&
        (node.coords === undefined || typeof node.coords === "string") &&
        (node.key === undefined || isFastdKey(node.key)) &&
        isMAC(node.mac) &&
        typeof node.monitoring === "boolean" &&
        typeof node.monitoringConfirmed === "boolean" &&
        isMonitoringState(node.monitoringState) &&
        typeof node.modifiedAt === "number"
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
        (node.site === undefined || isSite(node.site)) &&
        (node.domain === undefined || isDomain(node.domain)) &&
        (node.onlineState === undefined || isOnlineState(node.onlineState))
    );
}

export const isEnhancedNodes = toIsArray(isEnhancedNode);
