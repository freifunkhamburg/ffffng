/**
 * Contains types and corresponding type guards for the client side configuration of ffffng.
 *
 * @module config
 */
import { ArrayField, Field, RawJsonField } from "sparkson";
import { isObject, isPlainObject } from "./objects";
import { isBoolean, isNumber, isString } from "./primitives";
import { isArray } from "./arrays";
import { isOptional } from "./helpers";
import { isJSONObject } from "./json";
import { Domain, isDomain, isSite, isUrl, Site, Url } from "./newtypes";
import { EmailAddress, isEmailAddress } from "./email";

/**
 * Configuration for a single coordinate.
 *
 * See {@link CommunityConfig.constructor}.
 */
export class CoordinatesConfig {
    /**
     * @param lat - Latitude of the coordinate.
     * @param lng - Longitude of the coordinate.
     */
    constructor(
        @Field("lat") public lat: number,
        @Field("lng") public lng: number
    ) {}
}

/**
 * Type guard for {@link CoordinatesConfig}.
 *
 * @param arg - Value to check.
 */
export function isCoordinatesConfig(arg: unknown): arg is CoordinatesConfig {
    if (!isObject(arg)) {
        return false;
    }
    const coords = arg as CoordinatesConfig;
    return isNumber(coords.lat) && isNumber(coords.lng);
}

/**
 * Configuration for checking if a node is inside the community boundaries.
 *
 * See {@link OtherCommunityInfoConfig.constructor}.
 */
export class OtherCommunityInfoConfig {
    /**
     * @param showInfo - Specifies if for nodes outside the community boundaries a confirmation screen should be shown.
     * @param showBorderForDebugging - If set to `true` the outline of the community is rendered on the map.
     * @param localCommunityPolygon - Boundaries of the community.
     */
    constructor(
        @Field("showInfo") public showInfo: boolean,
        @Field("showBorderForDebugging") public showBorderForDebugging: boolean,
        @ArrayField("localCommunityPolygon", CoordinatesConfig)
        public localCommunityPolygon: CoordinatesConfig[]
    ) {}
}

/**
 * Type guard for {@link OtherCommunityInfoConfig}.
 *
 * @param arg - Value to check.
 */
export function isOtherCommunityInfoConfig(
    arg: unknown
): arg is OtherCommunityInfoConfig {
    if (!isObject(arg)) {
        return false;
    }
    const cfg = arg as OtherCommunityInfoConfig;
    return (
        isBoolean(cfg.showInfo) &&
        isBoolean(cfg.showBorderForDebugging) &&
        isArray(cfg.localCommunityPolygon, isCoordinatesConfig)
    );
}

/**
 * Options of a map layer.
 */
export type LayerOptions = {
    /**
     * Attribution shown for the map layer (HTML).
     */
    attribution: string;

    /**
     * Subdomains used to load tiles for the map layer, e.g.: `"1234"` or `"abcd"`.
     */
    subdomains?: string;

    /**
     * Maximum zoom level for the map layer.
     */
    maxZoom: number;
};

/**
 * Type guard for {@link LayerOptions}.
 *
 * @param arg - Value to check.
 */
export function isLayerOptions(arg: unknown): arg is LayerOptions {
    if (!isPlainObject(arg)) {
        return false;
    }
    const obj = arg as LayerOptions;
    return (
        isString(obj.attribution) &&
        isOptional(obj.subdomains, isString) &&
        isNumber(obj.maxZoom)
    );
}

/**
 * Configuration of a map layer.
 */
export type LayerConfig = {
    /**
     * Display name of the map layer.
     */
    name: string;

    /**
     * Tiles URL of the layer.
     */
    url: Url;

    /**
     * Type of the map (e.g. `"xyz"`). Unused in new frontend.
     */
    type: string;

    /**
     * See {@link LayerOptions}.
     */
    layerOptions: LayerOptions;
};

/**
 * Type guard for {@link LayerConfig}.
 *
 * @param arg - Value to check.
 */
export function isLayerConfig(arg: unknown): arg is LayerConfig {
    if (!isPlainObject(arg)) {
        return false;
    }
    const obj = arg as LayerConfig;
    return (
        isString(obj.name) &&
        isUrl(obj.url) &&
        isString(obj.type) &&
        isLayerOptions(obj.layerOptions)
    );
}

/**
 * Configuration of the map for picking node coordinates.
 *
 * See {@link CoordinatesSelectorConfig.constructor}
 */
export class CoordinatesSelectorConfig {
    /**
     * @param lat - Latitude to center the map on
     * @param lng - Longitude to center the map on
     * @param defaultZoom - Default zoom level of the map
     * @param layers - Mapping of layer ids to layer configurations for the map
     */
    constructor(
        @Field("lat") public lat: number,
        @Field("lng") public lng: number,
        @Field("defaultZoom") public defaultZoom: number,
        @RawJsonField("layers") public layers: Record<string, LayerConfig>
    ) {}
}

/**
 * Type guard for {@link CoordinatesSelectorConfig}.
 *
 * @param arg - Value to check.
 */
export function isCoordinatesSelectorConfig(
    arg: unknown
): arg is CoordinatesSelectorConfig {
    if (!isObject(arg)) {
        return false;
    }
    const cfg = arg as CoordinatesSelectorConfig;
    return (
        isNumber(cfg.lat) &&
        isNumber(cfg.lng) &&
        isNumber(cfg.defaultZoom) &&
        isJSONObject(cfg.layers)
    );
}

/**
 * Configuration of monitoring options.
 *
 * See {@link MonitoringConfig.constructor}.
 */
export class MonitoringConfig {
    /**
     * @param enabled - Specifies if node owners may activate monitoring for their devices
     */
    constructor(@Field("enabled") public enabled: boolean) {}
}

/**
 * Type guard for {@link MonitoringConfig}.
 *
 * @param arg - Value to check.
 */
export function isMonitoringConfig(arg: unknown): arg is MonitoringConfig {
    if (!isObject(arg)) {
        return false;
    }
    const cfg = arg as MonitoringConfig;
    return isBoolean(cfg.enabled);
}

/**
 * Configuration of the community map instance.
 *
 * See {@link CommunityMapConfig.constructor}.
 */
export class CommunityMapConfig {
    /**
     * @param mapUrl - Base URL of the Freifunk community's node map
     */
    constructor(@Field("mapUrl") public mapUrl: Url) {}
}

/**
 * Type guard for {@link CommunityMapConfig}.
 *
 * @param arg - Value to check.
 */
export function isCommunityMapConfig(arg: unknown): arg is CommunityMapConfig {
    if (!isObject(arg)) {
        return false;
    }
    const cfg = arg as CommunityMapConfig;
    return isUrl(cfg.mapUrl);
}

/**
 * Configuration of URLs for legal information.
 *
 * See {@link LegalConfig.constructor}
 */
export class LegalConfig {
    /**
     * @param privacyUrl - Optional: URL to the privacy conditions
     * @param imprintUrl - Optional: URL to the imprint
     */
    constructor(
        @Field("privacyUrl", true) public privacyUrl?: Url,
        @Field("imprintUrl", true) public imprintUrl?: Url
    ) {}
}

/**
 * Type guard for {@link LegalConfig}.
 *
 * @param arg - Value to check.
 */
export function isLegalConfig(arg: unknown): arg is LegalConfig {
    if (!isObject(arg)) {
        return false;
    }
    const cfg = arg as LegalConfig;
    return (
        isOptional(cfg.privacyUrl, isUrl) && isOptional(cfg.imprintUrl, isUrl)
    );
}

/**
 * Configuration for community settings.
 *
 * See: {@link CommunityConfig.constructor}
 */
export class CommunityConfig {
    /**
     * @param name - Name of the Freifunk community, e.g. `"Freifunk Musterstadt"`
     * @param domain - Domain of the Freifunk community, e.g. `"musterstadt.freifunk.net"`
     * @param contactEmail - Contact email address of the Freifunk community
     * @param sites - Array of the valid site codes found in the `nodes.json`, e.g.: `["ffms-site1", "ffms-site2"]`
     * @param domains - Array of the valid domain codes found in the `nodes.json`, e.g.: `["ffms-domain1", "ffms-domain2"]`
     */
    constructor(
        @Field("name") public name: string,
        @Field("domain") public domain: string,
        @Field("contactEmail") public contactEmail: EmailAddress,
        @ArrayField("sites", String) public sites: Site[],
        @ArrayField("domains", String) public domains: Domain[]
    ) {}
}

/**
 * Type guard for {@link CommunityConfig}.
 *
 * @param arg - Value to check.
 */
export function isCommunityConfig(arg: unknown): arg is CommunityConfig {
    if (!isObject(arg)) {
        return false;
    }
    const cfg = arg as CommunityConfig;
    return (
        isString(cfg.name) &&
        isString(cfg.domain) &&
        isEmailAddress(cfg.contactEmail) &&
        isArray(cfg.sites, isSite) &&
        isArray(cfg.domains, isDomain)
    );
}

/**
 * Configuration shared with the client.
 *
 * See: {@link ClientConfig.constructor}
 */
export class ClientConfig {
    /**
     * @param community - See {@link CommunityConfig}
     * @param legal - See {@link LegalConfig}
     * @param map - See {@link CommunityMapConfig}
     * @param monitoring - See {@link MonitoringConfig}
     * @param coordsSelector - See {@link CoordinatesSelectorConfig}
     * @param otherCommunityInfo - See {@link OtherCommunityInfoConfig}
     * @param rootPath - Path under which ffffng is served.
     */
    constructor(
        @Field("community") public community: CommunityConfig,
        @Field("legal") public legal: LegalConfig,
        @Field("map") public map: CommunityMapConfig,
        @Field("monitoring") public monitoring: MonitoringConfig,
        @Field("coordsSelector")
        public coordsSelector: CoordinatesSelectorConfig,
        @Field("otherCommunityInfo")
        public otherCommunityInfo: OtherCommunityInfoConfig,
        @Field("rootPath", true, undefined, "/") public rootPath: string
    ) {}
}

/**
 * Type guard for {@link ClientConfig}.
 *
 * @param arg - Value to check.
 */
export function isClientConfig(arg: unknown): arg is ClientConfig {
    if (!isObject(arg)) {
        return false;
    }
    const cfg = arg as ClientConfig;
    return (
        isCommunityConfig(cfg.community) &&
        isLegalConfig(cfg.legal) &&
        isCommunityMapConfig(cfg.map) &&
        isMonitoringConfig(cfg.monitoring) &&
        isCoordinatesSelectorConfig(cfg.coordsSelector) &&
        isOtherCommunityInfoConfig(cfg.otherCommunityInfo) &&
        isString(cfg.rootPath)
    );
}
