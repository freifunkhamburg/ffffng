'use strict';

angular.module('ffffng').factory('UrlBuilder', function (_, config) {
    function formUrl(route, queryParams) {
        var url = config.server.baseUrl;
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

    return {
        editNodeUrl: function () {
            return formUrl('update');
        },

        monitoringConfirmUrl: function (nodeSecrets) {
            return formUrl('monitoring/confirm', { token: nodeSecrets.monitoringToken });
        },
        monitoringDisableUrl: function (nodeSecrets) {
            return formUrl('monitoring/disable', { token: nodeSecrets.monitoringToken });
        }
    };
});
