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
        MailService,
        NodeService,
        request,
        Strings,
        UrlBuilder,
        Validator,
        Constraints,
        Resources
) {
    var MONITORING_MAILS_DB_BATCH_SIZE = 50;
    var MONITORING_OFFLINE_MAILS_SCHEDULE = {
        1: { amount: 3, unit: 'hours' },
        2: { amount: 1, unit: 'days' },
        3: { amount: 7, unit: 'days' }
    };

    var previousImportTimestamp = null;

    function insertNodeInformation(nodeData, node, callback) {
        Logger
            .tag('monitoring', 'information-retrieval')
            .debug('Node is new in monitoring, creating data: %s', nodeData.mac);

        return Database.run(
            'INSERT INTO node_state ' +
            '(mac, state, last_seen, import_timestamp, last_status_mail_sent, last_status_mail_type) ' +
            'VALUES (?, ?, ?, ?, ?, ?)',
            [
                node.mac,
                nodeData.state,
                nodeData.lastSeen.unix(),
                nodeData.importTimestamp.unix(),
                null, // new node so we haven't send a mail yet
                null  // new node so we haven't send a mail yet
            ],
            callback
        );
    }

    function updateNodeInformation(nodeData, node, row, callback) {
        Logger
            .tag('monitoring', 'information-retrieval')
            .debug('Node is known in monitoring: %s', nodeData.mac);

        if (!moment(row.import_timestamp).isBefore(nodeData.importTimestamp)) {
            Logger
                .tag('monitoring', 'information-retrieval')
                .debug('No new data for node, skipping: %s', nodeData.mac);
            return callback();
        }

        Logger
            .tag('monitoring', 'information-retrieval')
            .debug('New data for node, updating: %s', nodeData.mac);

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
            .debug('Node is not being monitored, deleting monitoring data: %s', nodeData.mac);
        return Database.run(
            'DELETE FROM node_state WHERE mac = ? AND import_timestamp < ?',
            [node.mac, nodeData.importTimestamp.unix()],
            callback
        );
    }

    function storeNodeInformation(nodeData, node, callback) {
        if (node.monitoring && node.monitoringConfirmed) {
            Logger.tag('monitoring', 'information-retrieval').debug('Node is being monitored: %s', nodeData.mac);

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

    function sendMonitoringMailsBatched(name, mailType, findBatchFun, callback) {
        Logger.tag('monitoring', 'mail-sending').info('Sending "%s" mails...', name);

        var sendNextBatch = function (err) {
            if (err) {
                return callback(err);
            }

            Logger.tag('monitoring', 'mail-sending').info('Sending next batch...');

            findBatchFun(function (err, nodeStates) {
                if (err) {
                    return callback(err);
                }

                if (_.isEmpty(nodeStates)) {
                    Logger.tag('monitoring', 'mail-sending').info('Done sending "%s" mails.', name);
                    return callback(null);
                }

                async.each(
                    nodeStates,
                    function (nodeState, mailCallback) {
                        var mac = nodeState.mac;
                        Logger.tag('monitoring', 'mail-sending').debug('Loading node data for: %s', mac);
                        NodeService.findNodeDataByMac(mac, function (err, node, nodeSecrets) {
                            if (err) {
                                Logger
                                    .tag('monitoring', 'mail-sending')
                                    .error('Error sending "' + name + '" mail for node: ' + mac, err);
                                return callback(err);
                            }

                            if (!node) {
                                Logger
                                    .tag('monitoring', 'mail-sending')
                                    .warn(
                                        'Node not found. Skipping sending of "' + name + '" mail: ' + mac
                                    );
                                return callback(null);
                            }

                            if (node.monitoring && node.monitoringConfirmed) {
                                Logger
                                    .tag('monitoring', 'mail-sending')
                                    .info('Sending "%s" mail for: %s', name, mac);
                                MailService.enqueue(
                                    config.server.email.from,
                                    node.nickname + ' <' + node.email + '>',
                                    mailType,
                                    {
                                        node: node,
                                        lastSeen: nodeState.last_seen,
                                        disableUrl: UrlBuilder.monitoringDisableUrl(nodeSecrets)

                                    },
                                    function (err) {
                                        if (err) {
                                            Logger
                                                .tag('monitoring', 'mail-sending')
                                                .error('Error sending "' + name + '" mail for node: ' + mac, err);
                                            return mailCallback(err);
                                        }

                                        Logger
                                            .tag('monitoring', 'mail-sending')
                                            .debug('Updating node state: ', mac);

                                        var now = moment().unix();
                                        Database.run(
                                            'UPDATE node_state ' +
                                            'SET modified_at = ?, last_status_mail_sent = ?, last_status_mail_type = ?' +
                                            'WHERE id = ?',
                                            [
                                                now, now, mailType,
                                                nodeState.id
                                            ],
                                            mailCallback
                                        );
                                    }
                                );
                            } else {
                                Logger
                                    .tag('monitoring', 'mail-sending')
                                    .info('Monitoring disabled, skipping "%s" mail for: %s', name, mac);
                            }
                        });
                    },
                    sendNextBatch
                );
            });
        };

        sendNextBatch(null);
    }

    function sendOnlineAgainMails(startTime, callback) {
        sendMonitoringMailsBatched(
            'online again',
            'monitoring-online-again',
            function (findBatchCallback) {
                Database.all(
                    'SELECT * FROM node_state ' +
                    'WHERE modified_at < ? AND state = ? AND last_status_mail_type IN (' +
                        '\'monitoring-offline-1\', \'monitoring-offline-2\', \'monitoring-offline-3\'' +
                    ')' +
                    'ORDER BY id ASC LIMIT ?',
                    [
                        startTime.unix(),
                        'ONLINE',

                        MONITORING_MAILS_DB_BATCH_SIZE
                    ],
                    findBatchCallback
                );
            },
            callback
        );
    }

    function sendOfflineMails(startTime, mailNumber, callback) {
        sendMonitoringMailsBatched(
            'offline ' + mailNumber,
            'monitoring-offline-' + mailNumber,
            function (findBatchCallback) {
                var previousType =
                    mailNumber === 1
                        ? 'monitoring-online-again'
                        : ('monitoring-offline-' + (mailNumber - 1));

                // the first time the first offline mail is send, there was no mail before
                var allowNull = mailNumber === 1 ? ' OR last_status_mail_type IS NULL' : '';

                var schedule = MONITORING_OFFLINE_MAILS_SCHEDULE[mailNumber];
                var scheduledTimeBefore = moment().subtract(schedule.amount, schedule.unit);

                Database.all(
                    'SELECT * FROM node_state ' +
                    'WHERE modified_at < ? AND state = ? AND (last_status_mail_type = ?' + allowNull + ') AND ' +
                    'last_seen <= ? AND last_status_mail_sent <= ? ' +
                    'ORDER BY id ASC LIMIT ?',
                    [
                        startTime.unix(),
                        'OFFLINE',
                        previousType,
                        scheduledTimeBefore.unix(),
                        scheduledTimeBefore.unix(),

                        MONITORING_MAILS_DB_BATCH_SIZE
                    ],
                    findBatchCallback
                );
            },
            callback
        );
    }

    return {
        getAll: function (restParams, callback) {
            Database.get(
                'SELECT count(*) AS total FROM node_state',
                [],
                function (err, row) {
                    if (err) {
                        return callback(err);
                    }

                    var total = row.total;

                    var filter = Resources.filterClause(
                        restParams,
                        'id',
                        [
                            'id',
                            'mac',
                            'state',
                            'last_seen',
                            'import_timestamp',
                            'last_status_mail_type',
                            'last_status_mail_sent',
                            'created_at',
                            'modified_at'
                        ],
                        [
                            'mac',
                            'state',
                            'last_status_mail_type'
                        ]
                    );

                    Database.all(
                        'SELECT * FROM node_state WHERE ' + filter.query,
                        _.concat([], filter.params),
                        function (err, rows) {
                            if (err) {
                                return callback(err);
                            }

                            callback(null, rows, total);
                        }
                    );
                }
            );
        },

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
            Logger.tag('monitoring', 'information-retrieval').info('Retrieving nodes.json: %s', url);
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
                                'No new data, skipping. Current timestamp: %s, previous timestamp: %s',
                                data.importTimestamp.format(),
                                previousImportTimestamp.format()
                            );
                        return callback();
                    }
                    previousImportTimestamp = data.importTimestamp;

                    async.each(
                        data.nodes,
                        function (nodeData, nodeCallback) {
                            Logger.tag('monitoring', 'information-retrieval').debug('Importing: %s', nodeData.mac);

                            NodeService.findNodeDataByMac(nodeData.mac, function (err, node) {
                                if (err) {
                                    Logger
                                        .tag('monitoring', 'information-retrieval')
                                        .error('Error importing: ' + nodeData.mac, err);
                                    return nodeCallback(err);
                                }

                                if (!node) {
                                    Logger
                                        .tag('monitoring', 'information-retrieval')
                                        .debug('Unknown node, skipping: %s', nodeData.mac);
                                    return nodeCallback(null);
                                }

                                storeNodeInformation(nodeData, node, function (err) {
                                    if (err) {
                                        Logger
                                            .tag('monitoring', 'information-retrieval')
                                            .debug('Could not update / deleting node data: %s', nodeData.mac, err);
                                        return nodeCallback(err);
                                    }

                                    Logger
                                        .tag('monitoring', 'information-retrieval')
                                        .debug('Updating / deleting node data done: %s', nodeData.mac);

                                    nodeCallback();
                                });
                            });
                        },
                        callback
                    );
                });
            });
        },

        sendMonitoringMails: function (callback) {
            Logger.tag('monitoring', 'mail-sending').info('Sending monitoring mails...');

            var startTime = moment();

            sendOnlineAgainMails(startTime, function (err) {
                if (err) {
                    // only logging an continuing with next type
                    Logger
                        .tag('monitoring', 'mail-sending')
                        .error('Error sending "online again" mails.', err);
                }

                sendOfflineMails(startTime, 1, function (err) {
                    if (err) {
                        // only logging an continuing with next type
                        Logger
                            .tag('monitoring', 'mail-sending')
                            .error('Error sending "offline 1" mails.', err);
                    }

                    sendOfflineMails(startTime, 2, function (err) {
                        if (err) {
                            // only logging an continuing with next type
                            Logger
                                .tag('monitoring', 'mail-sending')
                                .error('Error sending "offline 2" mails.', err);
                        }

                        sendOfflineMails(startTime, 3, function (err) {
                            if (err) {
                                // only logging an continuing with next type
                                Logger
                                    .tag('monitoring', 'mail-sending')
                                    .error('Error sending "offline 3" mails.', err);
                            }

                            callback(null);
                        });
                    });
                });
            });
        },

        cleanupNodeInformation: function (callback) {
            var daysBeforeCleanup = 30;
            Logger
                .tag('monitoring', 'information-cleanup')
                .info('Cleaning up node data not updated for %s days...', daysBeforeCleanup);
            Database.run(
                'DELETE FROM node_state WHERE modified_at < ?',
                [moment().subtract(daysBeforeCleanup, 'days').unix()],
                function (err) {
                    if (err) {
                        return callback(err);
                    }

                    Logger
                        .tag('monitoring', 'information-retrieval')
                        .info('Node data cleanup done.');

                    callback();
                }
            );
        }
    };
});
