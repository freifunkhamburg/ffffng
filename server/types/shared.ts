// Types shared with the client.

export function isObject(arg: unknown): arg is object {
    return arg !== null && typeof arg === "object";
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
