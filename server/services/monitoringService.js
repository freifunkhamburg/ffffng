'use strict';

angular.module('ffffng')
.service('MonitoringService', function (NodeService, ErrorTypes) {
    return {
        confirm: function (mac, token, callback) {
            NodeService.getNodeDataByMac(mac, function (err, node, nodeSecrets) {
                if (err) {
                    return callback(err);
                }

                if (!node.monitoring || !nodeSecrets.monitoringToken || nodeSecrets.monitoringToken !== token) {
                    return callback({data: 'Invalid token.', type: ErrorTypes.badRequest});
                }

                if (node.monitoringConfirmed) {
                    return callback(null, node);
                }

                node.monitoringConfirmed = true;
                NodeService.internalUpdateNode(node.token, node, nodeSecrets, function (err, token, node) {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, node);
                });
            });
        }
    };
});
