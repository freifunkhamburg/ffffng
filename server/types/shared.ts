import {ArrayField, Field, RawJsonField} from "sparkson";

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

export function toIsNewtype<
    Type extends Value & { readonly __tag: symbol },
    Value,
>(isValue: TypeGuard<Value>, _example: Type): TypeGuard<Type> {
    return (arg: unknown): arg is Type => isValue(arg);
}

export function isNumber(arg: unknown): arg is number {
    return typeof arg === "number"
}

export function isBoolean(arg: unknown): arg is boolean {
    return typeof arg === "boolean"
}

export function isUndefined(arg: unknown): arg is undefined {
    return arg === undefined;
}

export function isNull(arg: unknown): arg is null {
    return arg === null;
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
export const isUrl = toIsNewtype(isString, "" as Url);

export type Version = string & { readonly __tag: unique symbol };
export const isVersion = toIsNewtype(isString, "" as Version);

export type EmailAddress = string & { readonly __tag: unique symbol };
export const isEmailAddress = toIsNewtype(isString, "" as EmailAddress);

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

export type Statistics = {
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

export type Token = string & { readonly __tag: unique symbol };
export const isToken = toIsNewtype(isString, "" as Token);

export type FastdKey = string & { readonly __tag: unique symbol };
export const isFastdKey = toIsNewtype(isString, "" as FastdKey);

export type MAC = string & { readonly __tag: unique symbol };
export const isMAC = toIsNewtype(isString, "" as MAC);

export type DurationSeconds = number & { readonly __tag: unique symbol };
export const isDurationSeconds = toIsNewtype(isNumber, NaN as DurationSeconds);

export type UnixTimestampSeconds = number & { readonly __tag: unique symbol };
export const isUnixTimestampSeconds = toIsNewtype(isNumber, NaN as UnixTimestampSeconds);

export type UnixTimestampMilliseconds = number & { readonly __tag: unique symbol };
export const isUnixTimestampMilliseconds = toIsNewtype(isNumber, NaN as UnixTimestampMilliseconds);

export function toUnixTimestampSeconds(ms: UnixTimestampMilliseconds): UnixTimestampSeconds {
    return Math.floor(ms) as UnixTimestampSeconds;
}

export type MonitoringToken = string & { readonly __tag: unique symbol };
export const isMonitoringToken = toIsNewtype(isString, "" as MonitoringToken);

export enum MonitoringState {
    ACTIVE = "active",
    PENDING = "pending",
    DISABLED = "disabled",
}

export const isMonitoringState = toIsEnum(MonitoringState);

export type NodeId = string & { readonly __tag: unique symbol };
export const isNodeId = toIsNewtype(isString, "" as NodeId);

export type Hostname = string & { readonly __tag: unique symbol }
export const isHostname = toIsNewtype(isString, "" as Hostname);

export type Nickname = string & { readonly __tag: unique symbol };
export const isNickname = toIsNewtype(isString, "" as Nickname);

export type Coordinates = string & { readonly __tag: unique symbol };
export const isCoordinates = toIsNewtype(isString, "" as Coordinates);

/**
 * Basic node data.
 */
export type BaseNode = {
    nickname: Nickname;
    email: EmailAddress;
    hostname: Hostname;
    coords?: Coordinates;
    key?: FastdKey;
    mac: MAC;
}

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
 * Node data used for creating or updating a node.
 */
export type CreateOrUpdateNode = BaseNode & {
    monitoring: boolean;
}

export function isCreateOrUpdateNode(arg: unknown): arg is CreateOrUpdateNode {
    if (!isBaseNode(arg)) {
        return false;
    }
    const node = arg as CreateOrUpdateNode;
    return (
        isBoolean(node.monitoring)
    );
}

/**
 * Representation of a stored node.
 */
export type StoredNode = BaseNode & {
    token: Token;
    monitoringState: MonitoringState;
    modifiedAt: UnixTimestampSeconds;
}

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

export type NodeResponse = StoredNode & {
    monitoring: boolean;
    monitoringConfirmed: boolean;
}

export function isNodeResponse(arg: unknown): arg is NodeResponse {
    if (!isStoredNode(arg)) {
        return false;
    }
    const node = arg as NodeResponse;
    return (
        isBoolean(node.monitoring) &&
        isBoolean(node.monitoringConfirmed)
    );
}

export type NodeTokenResponse = {
    token: Token;
    node: NodeResponse;
}

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

export enum OnlineState {
    ONLINE = "ONLINE",
    OFFLINE = "OFFLINE",
}

export const isOnlineState = toIsEnum(OnlineState);

export type Site = string & { readonly __tag: unique symbol };
export const isSite = toIsNewtype(isString, "" as Site);

export type Domain = string & { readonly __tag: unique symbol };
export const isDomain = toIsNewtype(isString, "" as Domain);

/**
 * Represents a node in the context of a Freifunk site and domain.
 */
export type DomainSpecificNodeResponse = Record<NodeSortField, any> & NodeResponse & {
    site?: Site,
    domain?: Domain,
    onlineState?: OnlineState,
}

export function isDomainSpecificNodeResponse(arg: unknown): arg is DomainSpecificNodeResponse {
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

export type MonitoringResponse = {
    hostname: Hostname,
    mac: MAC,
    email: EmailAddress,
    monitoring: boolean,
    monitoringConfirmed: boolean,
}

export function isMonitoringResponse(arg: unknown): arg is MonitoringResponse {
    if (!Object(arg)) {
        return false;
    }
    const response = arg as MonitoringResponse;
    return (
        isHostname(response.hostname) &&
        isMAC(response.mac) &&
        isEmailAddress(response.email) &&
        isBoolean(response.monitoring) &&
        isBoolean(response.monitoringConfirmed)
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

export type NodesFilter = {
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
