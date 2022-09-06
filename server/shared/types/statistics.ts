/**
 * Contains types and type guards for representing statistics information.
 */
import { isPlainObject } from "./objects";
import { isNumber } from "./primitives";

/**
 * Some basic statistics of the known Freifunk nodes in the community.
 */
export type NodeStatistics = {
    /**
     * Number of nodes registered via ffffng.
     */
    registered: number;

    /**
     * Number of nodes with {@link FastdKey}
     */
    withVPN: number;

    /**
     * Number of nodes with geo-coordinates.
     */
    withCoords: number;

    /**
     * Monitoring statistics.
     */
    monitoring: {
        /**
         * Number of registered nodes with active monitoring.
         */
        active: number;

        /**
         * Number of registered nodes with activated monitoring but pending email confirmation.
         */
        pending: number;
    };
};

/**
 * Type guard for {@link NodeStatistics}.
 *
 * @param arg - Value to check.
 */
export function isNodeStatistics(arg: unknown): arg is NodeStatistics {
    if (!isPlainObject(arg)) {
        return false;
    }
    const stats = arg as NodeStatistics;
    return (
        isNumber(stats.registered) &&
        isNumber(stats.withVPN) &&
        isNumber(stats.withCoords) &&
        isPlainObject(stats.monitoring) &&
        isNumber(stats.monitoring.active) &&
        isNumber(stats.monitoring.pending)
    );
}

/**
 * Statistics object wrapping {@link NodeStatistics} to be used a REST API response.
 */
export type Statistics = {
    nodes: NodeStatistics;
};

/**
 * Type guard for {@link Statistics}.
 *
 * @param arg - Value to check.
 */
export function isStatistics(arg: unknown): arg is Statistics {
    return isPlainObject(arg) && isNodeStatistics((arg as Statistics).nodes);
}
