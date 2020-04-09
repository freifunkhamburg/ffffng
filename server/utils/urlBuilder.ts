import _ from "lodash"
import {config} from "../config"
import {MonitoringToken} from "../types"

// TODO: Typed URLs

function formUrl(route: string, queryParams?: {[key: string]: string}): string {
    let url = config.server.baseUrl;
    if (route || queryParams) {
        url += '/#/';
    }
    if (route) {
        url += route;
    }
    if (queryParams) {
        url += '?';
        url += _.join(
            _.map(
                queryParams,
                function (value, key) {
                    return encodeURIComponent(key) + '=' + encodeURIComponent(value);
                }
            ),
            '&'
        );
    }
    return url;
}

export function editNodeUrl (): string {
    return formUrl('update');
}

export function monitoringConfirmUrl (monitoringToken: MonitoringToken): string {
    return formUrl('monitoring/confirm', { token: monitoringToken });
}

export function monitoringDisableUrl (monitoringToken: MonitoringToken): string {
    return formUrl('monitoring/disable', { token: monitoringToken });
}
