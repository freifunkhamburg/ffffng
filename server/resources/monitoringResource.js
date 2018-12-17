'use strict';

const _ = require('lodash')

const Constraints = require('../../shared/validation/constraints')
const ErrorTypes = require('../utils/errorTypes')
const Logger = require('../logger')
const MonitoringService = require('../services/monitoringService')
const Resources = require('../utils/resources')
const Strings = require('../utils/strings')
const Validator = require('../validation/validator')

const isValidToken = Validator.forConstraint(Constraints.token);

module.exports =  {
    getAll (req, res) {
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

    confirm (req, res) {
        const data = Resources.getData(req);

        const token = Strings.normalizeString(data.token);
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

    disable (req, res) {
        const data = Resources.getData(req);

        const token = Strings.normalizeString(data.token);
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
}
