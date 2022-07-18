import {ArrayField, Field, RawJsonField} from "sparkson";
import exp from "constants";

// Types shared with the client.
export type TypeGuard<T> = (arg: unknown) => arg is T;

export function parseJSON(str: string): JSONValue {
    const json = JSON.parse(str);
    if (!isJSONValue(json)) {
        throw new Error("Invalid JSON returned. Should never happen.");
    }
    return json;
}

export type JSONValue =
    | null
    | string
    | number
    | boolean
    | JSONObject
    | JSONArray;

export function isJSONValue(arg: unknown): arg is JSONValue {
    return (
        arg === null ||
        isString(arg) ||
        isNumber(arg) ||
        isBoolean(arg) ||
        isJSONObject(arg) ||
        isJSONArray(arg)
    );
}

export interface JSONObject {
    [x: string]: JSONValue;
}

export function isJSONObject(arg: unknown): arg is JSONObject {
    if (!isObject(arg)) {
        return false;
    }

    const obj = arg as object;
    for (const [key, value] of Object.entries(obj)) {
        if (!isString(key) || !isJSONValue(value)) {
            return false;
        }
    }

    return true;
}

export interface JSONArray extends Array<JSONValue> {
}

export const isJSONArray = toIsArray(isJSONValue);

export type EnumValue<E> = E[keyof E];
export type EnumTypeGuard<E> = TypeGuard<EnumValue<E>>;

export function unhandledEnumField(field: never): never {
    throw new Error(`Unhandled enum field: ${field}`);
}

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

export function toIsEnum<E>(enumDef: E): EnumTypeGuard<E> {
    return (arg): arg is EnumValue<E> => Object.values(enumDef).includes(arg as [keyof E]);
}

export function isOptional<T>(arg: unknown, isT: TypeGuard<T>): arg is (T | undefined) {
    return arg === undefined || isT(arg);
}

export type Url = string & { readonly __tag: unique symbol };
export const isUrl = isString;

export type Version = string & { readonly __tag: unique symbol };
export const isVersion = isString;

export type EmailAddress = string & { readonly __tag: unique symbol };
export const isEmailAddress = isString;

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
        @Field("contactEmail") public contactEmail: EmailAddress,
        @ArrayField("sites", String) public sites: Site[],
        @ArrayField("domains", String) public domains: Domain[],
    ) {
    }
}

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

export class LegalConfig {
    constructor(
        @Field("privacyUrl", true) public privacyUrl?: Url,
        @Field("imprintUrl", true) public imprintUrl?: Url,
    ) {
    }
}

export function isLegalConfig(arg: unknown): arg is LegalConfig {
    if (!isObject(arg)) {
        return false;
    }
    const cfg = arg as LegalConfig;
    return (
        isOptional(cfg.privacyUrl, isUrl) &&
        isOptional(cfg.imprintUrl, isUrl)
    );
}

export class ClientMapConfig {
    constructor(
        @Field("mapUrl") public mapUrl: Url,
    ) {
    }
}

export function isClientMapConfig(arg: unknown): arg is ClientMapConfig {
    if (!isObject(arg)) {
        return false;
    }
    const cfg = arg as ClientMapConfig;
    return isUrl(cfg.mapUrl);
}

export class MonitoringConfig {
    constructor(
        @Field("enabled") public enabled: boolean,
    ) {
    }
}

export function isMonitoringConfig(arg: unknown): arg is MonitoringConfig {
    if (!isObject(arg)) {
        return false;
    }
    const cfg = arg as MonitoringConfig;
    return isBoolean(cfg.enabled);
}

export class CoordinatesConfig {
    constructor(
        @Field("lat") public lat: number,
        @Field("lng") public lng: number,
    ) {
    }
}

export function isCoordinatesConfig(arg: unknown): arg is CoordinatesConfig {
    if (!isObject(arg)) {
        return false;
    }
    const coords = arg as CoordinatesConfig;
    return (
        isNumber(coords.lat) &&
        isNumber(coords.lng)
    );
}

export class CoordinatesSelectorConfig {
    constructor(
        @Field("lat") public lat: number,
        @Field("lng") public lng: number,
        @Field("defaultZoom") public defaultZoom: number,
        @RawJsonField("layers") public layers: JSONObject,
    ) {
    }
}

export function isCoordinatesSelectorConfig(arg: unknown): arg is CoordinatesSelectorConfig {
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

export class OtherCommunityInfoConfig {
    constructor(
        @Field("showInfo") public showInfo: boolean,
        @Field("showBorderForDebugging") public showBorderForDebugging: boolean,
        @ArrayField("localCommunityPolygon", CoordinatesConfig) public localCommunityPolygon: CoordinatesConfig[],
    ) {
    }
}

export function isOtherCommunityInfoConfig(arg: unknown): arg is OtherCommunityInfoConfig {
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

export class ClientConfig {
    constructor(
        @Field("community") public community: CommunityConfig,
        @Field("legal") public legal: LegalConfig,
        @Field("map") public map: ClientMapConfig,
        @Field("monitoring") public monitoring: MonitoringConfig,
        @Field("coordsSelector") public coordsSelector: CoordinatesSelectorConfig,
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
        isCoordinatesSelectorConfig(cfg.coordsSelector) &&
        isOtherCommunityInfoConfig(cfg.otherCommunityInfo) &&
        isString(cfg.rootPath)
    );
}

// TODO: Token type.
export type Token = string & { readonly __tag: unique symbol };
export const isToken = isString;

export type FastdKey = string & { readonly __tag: unique symbol };
export const isFastdKey = isString;

export type MAC = string & { readonly __tag: unique symbol };
export const isMAC = isString;

export type UnixTimestampSeconds = number & { readonly __tag: unique symbol };
export const isUnixTimestampSeconds = isNumber;

export type UnixTimestampMilliseconds = number & { readonly __tag: unique symbol };
export const isUnixTimestampMilliseconds = isNumber;

export function toUnixTimestampSeconds(ms: UnixTimestampMilliseconds): UnixTimestampSeconds {
    return Math.floor(ms) as UnixTimestampSeconds;
}

export type MonitoringToken = string & { readonly __tag: unique symbol };

export enum MonitoringState {
    ACTIVE = "active",
    PENDING = "pending",
    DISABLED = "disabled",
}

export const isMonitoringState = toIsEnum(MonitoringState);

export type NodeId = string & { readonly __tag: unique symbol };

export type Hostname = string & { readonly __tag: unique symbol };
export const isHostname = isString;

export type Nickname = string & { readonly __tag: unique symbol };
export const isNickname = isString;

export type Coordinates = string & { readonly __tag: unique symbol };
export const isCoordinates = isString;

// TODO: More Newtypes
export type Node = {
    token: Token;
    nickname: Nickname;
    email: EmailAddress;
    hostname: Hostname;
    coords?: Coordinates;
    key?: FastdKey;
    mac: MAC;
    monitoring: boolean;
    monitoringConfirmed: boolean;
    monitoringState: MonitoringState;
    modifiedAt: UnixTimestampSeconds;
};

export function isNode(arg: unknown): arg is Node {
    if (!isObject(arg)) {
        return false;
    }
    const node = arg as Node;
    return (
        isToken(node.token) &&
        isNickname(node.nickname) &&
        isEmailAddress(node.email) &&
        isHostname(node.hostname) &&
        isOptional(node.coords, isCoordinates) &&
        isOptional(node.key, isFastdKey) &&
        isMAC(node.mac) &&
        isBoolean(node.monitoring) &&
        isBoolean(node.monitoringConfirmed) &&
        isMonitoringState(node.monitoringState) &&
        isUnixTimestampSeconds(node.modifiedAt)
    );
}

export enum OnlineState {
    ONLINE = "ONLINE",
    OFFLINE = "OFFLINE",
}

export const isOnlineState = toIsEnum(OnlineState);

export type Site = string & { readonly __tag: unique symbol };
export const isSite = isString;

export type Domain = string & { readonly __tag: unique symbol };
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

export enum NodeSortField {
    HOSTNAME = 'hostname',
    NICKNAME = 'nickname',
    EMAIL = 'email',
    TOKEN = 'token',
    MAC = 'mac',
    KEY = 'key',
    SITE = 'site',
    DOMAIN = 'domain',
    COORDS = 'coords',
    ONLINE_STATE = 'onlineState',
    MONITORING_STATE = 'monitoringState',
}

export const isNodeSortField = toIsEnum(NodeSortField);

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

export enum MonitoringSortField {
    ID = 'id',
    HOSTNAME = 'hostname',
    MAC = 'mac',
    SITE = 'site',
    DOMAIN = 'domain',
    MONITORING_STATE = 'monitoring_state',
    STATE = 'state',
    LAST_SEEN = 'last_seen',
    IMPORT_TIMESTAMP = 'import_timestamp',
    LAST_STATUS_MAIL_TYPE = 'last_status_mail_type',
    LAST_STATUS_MAIL_SENT = 'last_status_mail_sent',
    CREATED_AT = 'created_at',
    MODIFIED_AT = 'modified_at',
}

export const isMonitoringSortField = toIsEnum(MonitoringSortField);

export enum TaskSortField {
    ID = 'id',
    NAME = 'name',
    SCHEDULE = 'schedule',
    STATE = 'state',
    RUNNING_SINCE = 'runningSince',
    LAST_RUN_STARTED = 'lastRunStarted',
}

export const isTaskSortField = toIsEnum(TaskSortField);

export enum MailSortField {
    ID = 'id',
    FAILURES = 'failures',
    SENDER = 'sender',
    RECIPIENT = 'recipient',
    EMAIL = 'email',
    CREATED_AT = 'created_at',
    MODIFIED_AT = 'modified_at',
}

export const isMailSortField = toIsEnum(MailSortField);

export type GenericSortField = {
    value: string;
    readonly __tag: unique symbol
};

export enum SortDirection {
    ASCENDING = "ASC",
    DESCENDING = "DESC",
}

export const isSortDirection = toIsEnum(SortDirection);
