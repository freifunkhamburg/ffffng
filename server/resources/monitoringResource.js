'use strict';

angular.module('ffffng').factory('MonitoringResource', function (
    Constraints,
    Validator,
    MonitoringService,
    _,
    Strings,
    Resources,
    ErrorTypes
) {
    var isValidMac = Validator.forConstraint(Constraints.node.mac);
    var isValidToken = Validator.forConstraint(Constraints.token);

    return {
        confirm: function (req, res) {
            var data = Resources.getData(req);

            var mac = Strings.normalizeMac(data.mac);
            if (!isValidMac(mac)) {
                return Resources.error(res, {data: 'Invalid MAC.', type: ErrorTypes.badRequest});
            }

            var token = Strings.normalizeString(data.token);
            if (!isValidToken(token)) {
                return Resources.error(res, {data: 'Invalid token.', type: ErrorTypes.badRequest});
            }

            return MonitoringService.confirm(mac, token, function (err, node) {
                if (err) {
                    return Resources.error(res, err);
                }
                return Resources.success(res, {
                    hostname: node.hostname,
                    mac: node.mac,
                    email: node.email,
                    monitoringConfirmed: node.monitoringConfirmed
                });
            });
        }
    };
});
