/**
 * Contains types and type guards for monitoring data.
 */
import {
    type Domain,
    isDomain,
    isMAC,
    isSite,
    type MAC,
    type Site,
    toIsNewtype,
} from "./newtypes";
import { isBoolean, isNumber, isString } from "./primitives";
import { toIsEnum } from "./enums";
import { type Hostname, isHostname, isMapId, type MapId } from "./node";
import {
    type EmailAddress,
    isEmailAddress,
    isMailType,
    MailType,
} from "./email";
import { isUnixTimestampSeconds, type UnixTimestampSeconds } from "./time";
import { isOptional } from "./helpers";
import { type SortFieldFor, toIsSortField } from "./sortfields";

/**
 * Token for activating monitoring of a Freifunk node. This is being sent to verify the email address to use.
 */
export type MonitoringToken = string & { readonly __tag: unique symbol };

/**
 * Type guard for {@link MonitoringToken}.
 *
 * @param arg - Value to check.
 */
export const isMonitoringToken = toIsNewtype(isString, "" as MonitoringToken);

/**
 * The different states of monitoring of a Freifunk node.
 */
export enum MonitoringState {
    /**
     * The node's online state is being actively monitored. If the node goes offline for a certain period of time
     * a notification email will be sent.
     */
    ACTIVE = "active",

    /**
     * Monitoring has been activated by the user, but the email address used is not yet verified.
     */
    PENDING = "pending",

    /**
     * Monitoring is disabled.
     */
    DISABLED = "disabled",
}

/**
 * Type guard for {@link MonitoringState}.
 *
 * @param arg - Value to check.
 */
export const isMonitoringState = toIsEnum(MonitoringState);

/**
 * Online state of a Freifunk node.
 */
export enum OnlineState {
    /**
     * The node is currently online.
     */
    ONLINE = "ONLINE",

    /**
     * The node is currently offline.
     */
    OFFLINE = "OFFLINE",
}

/**
 * Type guard for {@link OnlineState}.
 *
 * @param arg - Value to check.
 */
export const isOnlineState = toIsEnum(OnlineState);

/**
 * Data of a Freifunk node as it is provided by the server's API when changing the nodes monitoring state.
 */
export type MonitoringResponse = {
    /**
     * Hostname of the node.
     */
    hostname: Hostname;

    /**
     * MAC address of the node.
     */
    mac: MAC;

    /**
     * Email address that is being used for monitoring.
     */
    email: EmailAddress;

    /**
     * Whether monitoring is enabled.
     */
    monitoring: boolean;

    /**
     * Whether the email address has been confirmed for use in monitoring the node.
     */
    monitoringConfirmed: boolean;
};

/**
 * Type guard for {@link MonitoringResponse}.
 *
 * @param arg - Value to check.
 */
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

/**
 * ID of the monitoring data of a Freifunk node stored in the database.
 */
export type NodeStateId = number & { readonly __tag: unique symbol };

/**
 * Type guard for {@link NodeStateId}.
 *
 * @param arg - Value to check.
 */
export const isNodeStateId = toIsNewtype(isNumber, NaN as NodeStateId);

/**
 * Monitoring related data of a Freifunk node as it is provided by the server's API to the admin frontend.
 */
export type NodeMonitoringStateResponse = {
    /**
     * ID of the monitoring data stored in the database.
     */
    id: NodeStateId;

    /**
     * Time the monitoring data has first been stored.
     */
    created_at: UnixTimestampSeconds;

    /**
     * Time the monitoring data has last been updated.
     */
    modified_at: UnixTimestampSeconds;

    /**
     * Hostname of the Freifunk node.
     */
    hostname?: Hostname;

    /**
     * MAC address of the Freifunk node.
     */
    mac: MAC;

    /**
     * ID to identify a Freifunk node on the communities map.
     */
    mapId: MapId;

    /**
     * Freifunk site as specified in the community map's `nodes.json`.
     */
    site?: Site;

    /**
     * Freifunk domain as specified in the community map's `nodes.json`.
     */
    domain?: Domain;

    /**
     * Time data for the node has last been imported from the community map's `nodes.json`.
     */
    import_timestamp: UnixTimestampSeconds;

    /**
     * Time the node has last been seen online.
     */
    last_seen: UnixTimestampSeconds;

    /**
     * Time the last monitoring notification email has been sent, if any.
     */
    last_status_mail_sent?: UnixTimestampSeconds;

    /**
     * Type of the last monitoring notification email sent, if any.
     */
    last_status_mail_type?: MailType;

    /**
     * Monitoring state of the node.
     */
    monitoring_state?: MonitoringState;

    /**
     * Online state of the node.
     */
    state: OnlineState;
};

/**
 * Type guard for {@link NodeMonitoringStateResponse}.
 *
 * @param arg - Value to check.
 */
export function isNodeMonitoringStateResponse(
    arg: unknown
): arg is NodeMonitoringStateResponse {
    if (!Object(arg)) {
        return false;
    }
    const response = arg as NodeMonitoringStateResponse;
    return (
        isNodeStateId(response.id) &&
        isUnixTimestampSeconds(response.created_at) &&
        isOptional(response.domain, isDomain) &&
        isOptional(response.hostname, isHostname) &&
        isUnixTimestampSeconds(response.import_timestamp) &&
        isUnixTimestampSeconds(response.last_seen) &&
        isOptional(response.last_status_mail_sent, isUnixTimestampSeconds) &&
        isOptional(response.last_status_mail_type, isMailType) &&
        isMAC(response.mac) &&
        isUnixTimestampSeconds(response.modified_at) &&
        isOptional(response.monitoring_state, isMonitoringState) &&
        isOptional(response.site, isSite) &&
        isOnlineState(response.state) &&
        isMapId(response.mapId)
    );
}

/**
 * Enum specifying the allowed sort fields when retrieving the list of monitoring data via the REST API.
 */
export enum MonitoringSortFieldEnum {
    // noinspection JSUnusedGlobalSymbols
    /**
     * See {@link NodeMonitoringStateResponse.id}.
     */
    ID = "id",

    /**
     * See {@link NodeMonitoringStateResponse.hostname}.
     */
    HOSTNAME = "hostname",

    /**
     * See {@link NodeMonitoringStateResponse.mac}.
     */
    MAC = "mac",

    /**
     * See {@link NodeMonitoringStateResponse.site}.
     */
    SITE = "site",

    /**
     * See {@link NodeMonitoringStateResponse.domain}.
     */
    DOMAIN = "domain",

    /**
     * See {@link NodeMonitoringStateResponse.monitoring_state}.
     */
    MONITORING_STATE = "monitoring_state",

    /**
     * See {@link NodeMonitoringStateResponse.state}.
     */
    STATE = "state",

    /**
     * See {@link NodeMonitoringStateResponse.last_seen}.
     */
    LAST_SEEN = "last_seen",

    /**
     * See {@link NodeMonitoringStateResponse.import_timestamp}.
     */
    IMPORT_TIMESTAMP = "import_timestamp",

    /**
     * See {@link NodeMonitoringStateResponse.last_status_mail_type}.
     */
    LAST_STATUS_MAIL_TYPE = "last_status_mail_type",

    /**
     * See {@link NodeMonitoringStateResponse.last_status_mail_sent}.
     */
    LAST_STATUS_MAIL_SENT = "last_status_mail_sent",

    /**
     * See {@link NodeMonitoringStateResponse.created_at}.
     */
    CREATED_AT = "created_at",

    /**
     * See {@link NodeMonitoringStateResponse.modified_at}.
     */
    MODIFIED_AT = "modified_at",
}

/**
 * Allowed sort fields when retrieving the list of monitoring data via the REST API.
 */
export type MonitoringSortField = SortFieldFor<
    NodeMonitoringStateResponse,
    MonitoringSortFieldEnum
>;

/**
 * Type guard for {@link MonitoringSortField}.
 *
 * @param arg - Value to check.
 */
export const isMonitoringSortField = toIsSortField<
    NodeMonitoringStateResponse,
    MonitoringSortFieldEnum,
    typeof MonitoringSortFieldEnum,
    MonitoringSortField
>(MonitoringSortFieldEnum);
