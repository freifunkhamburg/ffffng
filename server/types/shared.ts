import {ArrayField, Field, RawJsonField} from "sparkson";

// Types shared with the client.

export function isObject(arg: unknown): arg is object {
    return arg !== null && typeof arg === "object";
}

export function isArray<T>(arg: unknown, isT: (arg: unknown) => arg is T): arg is Array<T> {
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

export type Version = string;

export function isVersion(arg: unknown): arg is Version {
    // Should be good enough for now.
    return typeof arg === "string";
}

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
