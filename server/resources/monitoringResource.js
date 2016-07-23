'use strict';

angular.module('ffffng').factory('MonitoringResource', function (
    Constraints,
    Validator,
    MonitoringService,
    Logger,
    _,
    Strings,
    Resources,
    ErrorTypes
) {
    var isValidToken = Validator.forConstraint(Constraints.token);

    return {
        getAll: function (req, res) {
            Resources.getValidRestParams('list', null, req, function (err, restParams) {
                if (err) {
                    return Resources.error(res, err);
                }

                return MonitoringService.getAll(
                    restParams,
                    function (err, monitoringStates, total) {
                        if (err) {
                            Logger.tag('monitoring', 'admin').error('Could not get monitoring states:', err);
                            return Resources.error(res, {data: 'Internal error.', type: ErrorTypes.internalError});
                        }

                        res.set('X-Total-Count', total);
                        return Resources.success(res, _.map(monitoringStates, function (state) {
                            state.mapId = _.toLower(state.mac).replace(/:/g, '');
                            return state;
                        }));
                    }
                );
            });
        },

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
