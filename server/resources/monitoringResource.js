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
    var isValidToken = Validator.forConstraint(Constraints.token);

    return {
        confirm: function (req, res) {
            var data = Resources.getData(req);

            var token = Strings.normalizeString(data.token);
            if (!isValidToken(token)) {
                return Resources.error(res, {data: 'Invalid token.', type: ErrorTypes.badRequest});
            }

            return MonitoringService.confirm(token, function (err, node) {
                if (err) {
                    return Resources.error(res, err);
                }
                return Resources.success(res, {
                    hostname: node.hostname,
                    mac: node.mac,
                    email: node.email,
                    monitoring: node.monitoring,
                    monitoringConfirmed: node.monitoringConfirmed
                });
            });
        },

        disable: function (req, res) {
            var data = Resources.getData(req);

            var token = Strings.normalizeString(data.token);
            if (!isValidToken(token)) {
                return Resources.error(res, {data: 'Invalid token.', type: ErrorTypes.badRequest});
            }

            return MonitoringService.disable(token, function (err, node) {
                if (err) {
                    return Resources.error(res, err);
                }
                return Resources.success(res, {
                    hostname: node.hostname,
                    mac: node.mac,
                    email: node.email,
                    monitoring: node.monitoring
                });
            });
        }
    };
});
