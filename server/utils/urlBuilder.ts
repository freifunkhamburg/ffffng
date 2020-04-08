import _ from "lodash"
import {config} from "../config"
import {NodeSecrets} from "../types"

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

export function monitoringConfirmUrl (nodeSecrets: NodeSecrets): string {
    return formUrl('monitoring/confirm', { token: nodeSecrets.monitoringToken });
}

export function monitoringDisableUrl (nodeSecrets: NodeSecrets): string {
    return formUrl('monitoring/disable', { token: nodeSecrets.monitoringToken });
}
