'use strict';

const _ = require('lodash')

const config = require('../config').config

function formUrl(route, queryParams) {
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

module.exports = {
    editNodeUrl () {
        return formUrl('update');
    },

    monitoringConfirmUrl (nodeSecrets) {
        return formUrl('monitoring/confirm', { token: nodeSecrets.monitoringToken });
    },
    monitoringDisableUrl (nodeSecrets) {
        return formUrl('monitoring/disable', { token: nodeSecrets.monitoringToken });
    }
}
