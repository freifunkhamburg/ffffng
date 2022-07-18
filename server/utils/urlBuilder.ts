import _ from "lodash"
import {config} from "../config"
import {MonitoringToken, Url} from "../types"

function formUrl(route: string, queryParams?: { [key: string]: string }): Url {
    let url = config.server.baseUrl as string;
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
    return url as Url;
}

export function editNodeUrl(): Url {
    return formUrl('update');
}

export function monitoringConfirmUrl(monitoringToken: MonitoringToken): Url {
    return formUrl('monitoring/confirm', {token: monitoringToken});
}

export function monitoringDisableUrl(monitoringToken: MonitoringToken): Url {
    return formUrl('monitoring/disable', {token: monitoringToken});
}
