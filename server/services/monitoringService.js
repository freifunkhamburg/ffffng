'use strict';

angular.module('ffffng')
.service('MonitoringService', function (
        _,
        async,
        config,
        Database,
        ErrorTypes,
        Logger,
        moment,
        NodeService,
        request,
        Strings,
        Validator,
        Constraints
) {
        var previousImportTimestamp = null;

        function insertNodeInformation(nodeData, node, callback) {
            Logger
                .tag('monitoring', 'information-retrieval')
                .debug('Node is new in monitoring, creating data:', nodeData.mac);

            return Database.run(
                'INSERT INTO node_state ' +
                '(mac, state, last_seen, import_timestamp, last_status_mail_send) ' +
                'VALUES (?, ?, ?, ?, ?)',
                [
                    node.mac,
                    nodeData.state,
                    nodeData.lastSeen.unix(),
                    nodeData.importTimestamp.unix(),
                    null // new node so we haven't send a mail yet
                ],
                callback
            );
        }

        function updateNodeInformation(nodeData, node, row, callback) {
            Logger
                .tag('monitoring', 'information-retrieval')
                .debug('Node is known in monitoring:', nodeData.mac);

            if (!moment(row.import_timestamp).isBefore(nodeData.importTimestamp)) {
                Logger
                    .tag('monitoring', 'information-retrieval')
                    .debug('No new data for node, skipping:', nodeData.mac);
                return callback();
            }

            Logger
                .tag('monitoring', 'information-retrieval')
                .debug('New data for node, updating:', nodeData.mac);

            return Database.run(
                'UPDATE node_state ' +
                'SET state = ?, last_seen = ?, import_timestamp = ?, modified_at = ?' +
                'WHERE id = ? AND mac = ?',
                [
                    nodeData.state, nodeData.lastSeen.unix(), nodeData.importTimestamp.unix(), moment().unix(),
                    row.id, node.mac
                ],
                callback
            );
        }

        function deleteNodeInformation(nodeData, node, callback) {
            Logger
                .tag('monitoring', 'information-retrieval')
                .debug('Node is not being monitored, deleting monitoring data:', nodeData.mac);
            return Database.run(
                'DELETE FROM node_state WHERE mac = ? AND import_timestamp < ?',
                [node.mac, nodeData.importTimestamp.unix()],
                callback
            );
        }

        function storeNodeInformation(nodeData, node, callback) {
            if (node.monitoring && node.monitoringConfirmed) {
                Logger.tag('monitoring', 'information-retrieval').debug('Node is being monitored:', nodeData.mac);

                return Database.get('SELECT * FROM node_state WHERE mac = ?', [node.mac], function (err, row) {
                    if (err) {
                        return callback(err);
                    }

                    if (_.isUndefined(row)) {
                        return insertNodeInformation(nodeData, node, callback);
                    } else {
                        return updateNodeInformation(nodeData, node, row, callback);
                    }
                });
            } else {
                return deleteNodeInformation(nodeData, node, callback);
            }
        }

        var isValidMac = Validator.forConstraint(Constraints.node.mac);

        function parseNodesJson(body, callback) {
            Logger.tag('monitoring', 'information-retrieval').info('Parsing nodes.json...');

            function parseTimestamp(timestamp) {
                if (!_.isString(json.timestamp)) {
                    return moment.invalid();
                }
                return moment.utc(timestamp);
            }

            var data = {};
            try {
                var json = JSON.parse(body);

                if (json.version !== 1) {
                    return callback(new Error('Unexpected nodes.json version: ' + json.version));
                }

                data.importTimestamp = parseTimestamp(json.timestamp);
                if (!data.importTimestamp.isValid()) {
                    return callback(new Error('Invalid timestamp: ' + json.timestamp));
                }

                if (!_.isPlainObject(json.nodes)) {
                    return callback(new Error('Invalid nodes object type: ' + (typeof json.nodes)));
                }

                data.nodes = _.values(_.map(json.nodes, function (nodeData, nodeId) {
                    if (!_.isPlainObject(nodeData)) {
                        throw new Error(
                            'Node ' + nodeId + ': Unexpected node type: ' + (typeof nodeData)
                        );
                    }

                    if (!_.isPlainObject(nodeData.nodeinfo)) {
                        throw new Error(
                            'Node ' + nodeId + ': Unexpected nodeinfo type: ' + (typeof nodeData.nodeinfo)
                        );
                    }
                    if (!_.isPlainObject(nodeData.nodeinfo.network)) {
                        throw new Error(
                            'Node ' + nodeId + ': Unexpected nodeinfo.network type: ' +
                            (typeof nodeData.nodeinfo.network)
                        );
                    }

                    if (!isValidMac(nodeData.nodeinfo.network.mac)) {
                        throw new Error(
                            'Node ' + nodeId + ': Invalid MAC: ' + nodeData.nodeinfo.network.mac
                        );
                    }
                    var mac = Strings.normalizeMac(nodeData.nodeinfo.network.mac);

                    if (!_.isPlainObject(nodeData.flags)) {
                        throw new Error(
                            'Node ' + nodeId + ': Unexpected flags type: ' + (typeof nodeData.flags)
                        );
                    }
                    if (!_.isBoolean(nodeData.flags.online)) {
                        throw new Error(
                            'Node ' + nodeId + ': Unexpected flags.online type: ' + (typeof nodeData.flags.online)
                        );
                    }
                    var isOnline = nodeData.flags.online;

                    var lastSeen = parseTimestamp(nodeData.lastseen);
                    if (!lastSeen.isValid()) {
                        throw new Error(
                            'Node ' + nodeId + ': Invalid lastseen timestamp: ' + nodeData.lastseen
                        );
                    }

                    return {
                        mac: mac,
                        importTimestamp: data.importTimestamp,
                        state: isOnline ? 'ONLINE' : 'OFFLINE',
                        lastSeen: lastSeen
                    };
                }));
            }
            catch (error) {
                return callback(error);
            }

            callback(null, data);
        }

        return {
        confirm: function (token, callback) {
            NodeService.getNodeDataByMonitoringToken(token, function (err, node, nodeSecrets) {
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
        },

        disable: function (token, callback) {
            NodeService.getNodeDataByMonitoringToken(token, function (err, node, nodeSecrets) {
                if (err) {
                    return callback(err);
                }

                if (!node.monitoring || !nodeSecrets.monitoringToken || nodeSecrets.monitoringToken !== token) {
                    return callback({data: 'Invalid token.', type: ErrorTypes.badRequest});
                }

                node.monitoring = false;
                node.monitoringConfirmed = false;
                nodeSecrets.monitoringToken = '';

                NodeService.internalUpdateNode(node.token, node, nodeSecrets, function (err, token, node) {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, node);
                });
            });
        },

        retrieveNodeInformation: function (callback) {
            var url = config.server.map.nodesJsonUrl;
            Logger.tag('monitoring', 'information-retrieval').info('Retrieving nodes.json:', url);
            request(url, function (err, response, body) {
                if (err) {
                    return callback(err);
                }

                if (response.statusCode !== 200) {
                    return callback(new Error(
                        'Could not download nodes.json from ' + url + ': ' +
                        response.statusCode + ' - ' + response.statusMessage
                    ));
                }

                parseNodesJson(body, function (err, data) {
                    if (err) {
                        return callback(err);
                    }

                    if (previousImportTimestamp !== null && !data.importTimestamp.isAfter(previousImportTimestamp)) {
                        Logger
                            .tag('monitoring', 'information-retrieval')
                            .info(
                                'No new data, skipping.',
                                'Current timestamp:',
                                data.importTimestamp.format(),
                                'Previous timestamp:',
                                previousImportTimestamp.format()
                            );
                        return callback();
                    }
                    previousImportTimestamp = data.importTimestamp;

                    async.each(
                        data.nodes,
                        function (nodeData, nodeCallback) {
                            Logger.tag('monitoring', 'information-retrieval').debug('Importing:', nodeData.mac);

                            NodeService.findNodeDataByMac(nodeData.mac, function (err, node) {
                                if (err) {
                                    Logger
                                        .tag('monitoring', 'information-retrieval')
                                        .error('Error importing:', nodeData.mac, err);
                                    return nodeCallback(err);
                                }

                                if (!node) {
                                    Logger
                                        .tag('monitoring', 'information-retrieval')
                                        .debug('Unknown node, skipping:', nodeData.mac);
                                    return nodeCallback(null);
                                }

                                storeNodeInformation(nodeData, node, function (err) {
                                    if (err) {
                                        Logger
                                            .tag('monitoring', 'information-retrieval')
                                            .debug('Could not update / deleting node data: ', nodeData.mac, err);
                                        return nodeCallback(err);
                                    }

                                    Logger
                                        .tag('monitoring', 'information-retrieval')
                                        .debug('Updating / deleting node data done:', nodeData.mac);

                                    nodeCallback();
                                });
                            });
                        },
                        callback
                    );
                });
            });
        }
    };
});
