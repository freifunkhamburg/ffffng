'use strict';

angular.module('ffffng')
.service('MonitoringService', function (
        _,
        async,
        config,
        deepExtend,
        Database,
        DatabaseUtil,
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
    var MONITORING_STATE_MACS_CHUNK_SIZE = 100;
    var MONITORING_MAILS_DB_BATCH_SIZE = 50;
    /**
     * Defines the intervals emails are sent if a node is offline
     */
    var MONITORING_OFFLINE_MAILS_SCHEDULE = {
        1: { amount: 3, unit: 'hours' },
        2: { amount: 1, unit: 'days' },
        3: { amount: 7, unit: 'days' }
    };
    var DELETE_OFFLINE_NODES_AFTER_DURATION = {
        amount: 100,
        unit: 'days'
    };

    var previousImportTimestamp = null;

    function insertNodeInformation(nodeData, node, callback) {
        Logger
            .tag('monitoring', 'information-retrieval')
            .debug('Node is new in monitoring, creating data: %s', nodeData.mac);

        return Database.run(
            'INSERT INTO node_state ' +
            '(hostname, mac, site, domain, monitoring_state, state, last_seen, import_timestamp, last_status_mail_sent, last_status_mail_type) ' +
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                node.hostname,
                node.mac,
                nodeData.site,
                nodeData.domain,
                node.monitoringState,
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

        // jshint -W106
        if (!moment(row.import_timestamp).isBefore(nodeData.importTimestamp)) {
        // jshint +W106
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
            'SET ' +
            'hostname = ?, ' +
            'site = ?, ' +
            'domain = ?, ' +
            'monitoring_state = ?, ' +
            'state = ?, ' +
            'last_seen = ?, ' +
            'import_timestamp = ?, ' +
            'modified_at = ? ' +
            'WHERE id = ? AND mac = ?',
            [
                node.hostname,
                nodeData.site || row.site,
                nodeData.domain || row.domain,
                node.monitoringState,
                nodeData.state,
                nodeData.lastSeen.unix(),
                nodeData.importTimestamp.unix(),
                moment().unix(),

                row.id,
                node.mac
            ],
            callback
        );
    }

    function storeNodeInformation(nodeData, node, callback) {
        Logger.tag('monitoring', 'information-retrieval').debug('Storing status for node: %s', nodeData.mac);

        return Database.get('SELECT * FROM node_state WHERE mac = ?', [node.mac], function (err, row) {
            if (err) {
                return callback(err);
            }

            var nodeDataForStoring;
            if (nodeData === 'missing') {
                nodeDataForStoring = {
                    mac: node.mac,
                    site: _.isUndefined(row) ? null : row.site,
                    domain: _.isUndefined(row) ? null : row.domain,
                    state: 'OFFLINE',
                    // jshint -W106
                    lastSeen: _.isUndefined(row) ? moment() : moment.unix(row.last_seen),
                    // jshint +W106
                    importTimestamp: moment()
                };
            } else {
                nodeDataForStoring = nodeData;
            }

            if (_.isUndefined(row)) {
                return insertNodeInformation(nodeDataForStoring, node, callback);
            } else {
                return updateNodeInformation(nodeDataForStoring, node, row, callback);
            }
        });
    }

    var isValidMac = Validator.forConstraint(Constraints.node.mac);

    function parseTimestamp (timestamp) {
        if (!_.isString(timestamp)) {
            return moment.invalid();
        }
        return moment.utc(timestamp);
    }

    function parseNode (importTimestamp, nodeData, nodeId) {
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
                'Node ' + nodeId + ': Unexpected nodeinfo.network type: ' + (typeof nodeData.nodeinfo.network)
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

        var site = null;
        // jshint -W106
        if (_.isPlainObject(nodeData.nodeinfo.system) && _.isString(nodeData.nodeinfo.system.site_code)) {
            site = nodeData.nodeinfo.system.site_code;
        }
        // jshint +W106

        var domain = null;
        // jshint -W106
        if (_.isPlainObject(nodeData.nodeinfo.system) && _.isString(nodeData.nodeinfo.system.domain_code)) {
            domain = nodeData.nodeinfo.system.domain_code;
        }
        // jshint +W106

        return {
            mac: mac,
            importTimestamp: importTimestamp,
            state: isOnline ? 'ONLINE' : 'OFFLINE',
            lastSeen: lastSeen,
            site: site,
            domain: domain
        };
    }

    function parseNodesJson (body, callback) {
        Logger.tag('monitoring', 'information-retrieval').debug('Parsing nodes.json...');

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

            data.nodes = _.filter(
                _.values(
                    _.map(
                        json.nodes,
                        function (nodeData, nodeId) {
                            try {
                                return parseNode(data.importTimestamp, nodeData, nodeId);
                            }
                            catch (error) {
                                Logger.tag('monitoring', 'information-retrieval').error(error);
                                return null;
                            }
                        }
                    )
                ),
                function (node) {
                    return node !== null;
                }
            );
        }
        catch (error) {
            return callback(error);
        }

        callback(null, data);
    }

    function updateSkippedNode(id, node, callback) {
        Database.run(
            'UPDATE node_state ' +
            'SET hostname = ?, monitoring_state = ?, modified_at = ?' +
            'WHERE id = ?',
            [
                node ? node.hostname : '', node ? node.monitoringState : '', moment().unix(),
                id
            ],
            callback
        );
    }

    function sendMonitoringMailsBatched(name, mailType, findBatchFun, callback) {
        Logger.tag('monitoring', 'mail-sending').debug('Sending "%s" mails...', name);

        var sendNextBatch = function (err) {
            if (err) {
                return callback(err);
            }

            Logger.tag('monitoring', 'mail-sending').debug('Sending next batch...');

            findBatchFun(function (err, nodeStates) {
                if (err) {
                    return callback(err);
                }

                if (_.isEmpty(nodeStates)) {
                    Logger.tag('monitoring', 'mail-sending').debug('Done sending "%s" mails.', name);
                    return callback(null);
                }

                async.each(
                    nodeStates,
                    function (nodeState, mailCallback) {
                        var mac = nodeState.mac;
                        Logger.tag('monitoring', 'mail-sending').debug('Loading node data for: %s', mac);
                        NodeService.getNodeDataByMac(mac, function (err, node, nodeSecrets) {
                            if (err) {
                                Logger
                                    .tag('monitoring', 'mail-sending')
                                    .error('Error sending "' + name + '" mail for node: ' + mac, err);
                                return mailCallback(err);
                            }

                            if (!node) {
                                Logger
                                    .tag('monitoring', 'mail-sending')
                                    .debug(
                                    'Node not found. Skipping sending of "' + name + '" mail: ' + mac
                                );
                                return updateSkippedNode(nodeState.id, {}, mailCallback);
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
                                        // jshint -W106
                                        lastSeen: nodeState.last_seen,
                                        // jshint +W106
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
                                            'SET hostname = ?, monitoring_state = ?, modified_at = ?, last_status_mail_sent = ?, last_status_mail_type = ?' +
                                            'WHERE id = ?',
                                            [
                                                node.hostname, node.monitoringState, now, now, mailType,
                                                nodeState.id
                                            ],
                                            mailCallback
                                        );
                                    }
                                );
                            } else {
                                Logger
                                    .tag('monitoring', 'mail-sending')
                                    .debug('Monitoring disabled, skipping "%s" mail for: %s', name, mac);
                                return updateSkippedNode(nodeState.id, {}, mailCallback);
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

    /**
     * sends one of three mails if a node is offline
     * @param  {moment}   startTime  the moment the job started
     * @param  {Number}   mailNumber which of three mails
     * @param  {Function} callback   gets all nodes that are offline
     */
    function sendOfflineMails(startTime, mailNumber, callback) {
        sendMonitoringMailsBatched(
            'offline ' + mailNumber,
            'monitoring-offline-' + mailNumber,
            function (findBatchCallback) {
                /**
                 * descriptive string that stores, which was the last mail type, stored in the database as last_status_mail_type
                 */
                var previousType =
                    mailNumber === 1 ? 'monitoring-online-again' : ('monitoring-offline-' + (mailNumber - 1));

                // the first time the first offline mail is send, there was no mail before
                var allowNull = mailNumber === 1 ? ' OR last_status_mail_type IS NULL' : '';

                var schedule = MONITORING_OFFLINE_MAILS_SCHEDULE[mailNumber];
                var scheduledTimeBefore = moment().subtract(schedule.amount, schedule.unit);

                Database.all(
                    'SELECT * FROM node_state ' +
                    'WHERE modified_at < ? AND state = ? AND (last_status_mail_type = ?' + allowNull + ') AND ' +
                    'last_seen <= ? AND (last_status_mail_sent <= ? OR last_status_mail_sent IS NULL) ' +
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

    function withUrlsData(urls, callback) {
        async.map(urls, function (url, urlCallback) {
            Logger.tag('monitoring', 'information-retrieval').debug('Retrieving nodes.json: %s', url);
            request(url, function (err, response, body) {
                if (err) {
                    return urlCallback(err);
                }

                if (response.statusCode !== 200) {
                    return urlCallback(new Error(
                        'Could not download nodes.json from ' + url + ': ' +
                        response.statusCode + ' - ' + response.statusMessage
                    ));
                }

                parseNodesJson(body, urlCallback);
            });
        }, callback);
    }

    function retrieveNodeInformationForUrls(urls, callback) {
        withUrlsData(urls, function (err, datas) {
            if (err) {
                return callback(err);
            }

            var maxTimestamp = datas[0].importTimestamp;
            var minTimestamp = maxTimestamp;
            _.each(datas, function (data) {
                if (data.importTimestamp.isAfter(maxTimestamp)) {
                    maxTimestamp = data.importTimestamp;
                }
                if (data.importTimestamp.isBefore(minTimestamp)) {
                    minTimestamp = data.importTimestamp;
                }
            });

            if (previousImportTimestamp !== null && !maxTimestamp.isAfter(previousImportTimestamp)) {
                Logger
                    .tag('monitoring', 'information-retrieval')
                    .debug(
                        'No new data, skipping. Current timestamp: %s, previous timestamp: %s',
                        maxTimestamp.format(),
                        previousImportTimestamp.format()
                    );
                return callback();
            }
            previousImportTimestamp = maxTimestamp;

            // We do not parallelize here as the sqlite will start slowing down and blocking with too many
            // parallel queries. This has resulted in blocking other requests too and thus in a major slowdown.
            var allNodes = _.flatMap(datas, function (data) {
                return data.nodes;
            });

            // Get rid of duplicates from different nodes.json files. Always use the one with the newest
            var sortedNodes = _.orderBy(allNodes, [function (node) {
                return node.lastSeen.unix();
            }], ['desc']);
            var uniqueNodes = _.uniqBy(sortedNodes, function (node) {
                return node.mac;
            });
            async.eachSeries(
                uniqueNodes,
                function (nodeData, nodeCallback) {
                    Logger.tag('monitoring', 'information-retrieval').debug('Importing: %s', nodeData.mac);

                    NodeService.getNodeDataByMac(nodeData.mac, function (err, node) {
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
                function (err) {
                    if (err) {
                        return callback(err);
                    }

                    Logger
                        .tag('monitoring', 'information-retrieval')
                        .debug('Marking missing nodes as offline.');

                    // Mark nodes as offline that haven't been imported in this run.
                    Database.run(
                        'UPDATE node_state ' +
                        'SET state = ?, modified_at = ?' +
                        'WHERE import_timestamp < ?',
                        [
                            'OFFLINE', moment().unix(),
                            minTimestamp.unix()
                        ],
                        callback
                    );
                }
            );
        });
    }

    return {
        getAll: function (restParams, callback) {
            var sortFields = [
                'id',
                'hostname',
                'mac',
                'site',
                'domain',
                'monitoring_state',
                'state',
                'last_seen',
                'import_timestamp',
                'last_status_mail_type',
                'last_status_mail_sent',
                'created_at',
                'modified_at'
            ];
            var filterFields = [
                'hostname',
                'mac',
                'monitoring_state',
                'state',
                'last_status_mail_type'
            ];

            var where = Resources.whereCondition(restParams, filterFields);

            Database.get(
                'SELECT count(*) AS total FROM node_state WHERE ' + where.query,
                _.concat([], where.params),
                function (err, row) {
                    if (err) {
                        return callback(err);
                    }

                    var total = row.total;

                    var filter = Resources.filterClause(
                        restParams,
                        'id',
                        sortFields,
                        filterFields
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

        getByMacs: function (macs, callback) {
            if (_.isEmpty(macs)) {
                return callback(null, {});
            }

            async.map(
                _.chunk(macs, MONITORING_STATE_MACS_CHUNK_SIZE),
                function (subMacs, subCallback) {
                    var inCondition = DatabaseUtil.inCondition('mac', subMacs);

                    Database.all(
                        'SELECT * FROM node_state WHERE ' + inCondition.query,
                        _.concat([], inCondition.params),
                        subCallback
                    );
                },
                function (err, rowsArrays) {
                    if (err) {
                        return callback(err);
                    }

                    var nodeStateByMac = {};
                    _.each(_.flatten(rowsArrays), function (row) {
                        nodeStateByMac[row.mac] = row;
                    });

                    return callback(null, nodeStateByMac);
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
            var urls = config.server.map.nodesJsonUrl;
            if (_.isEmpty(urls)) {
                return callback(
                    new Error('No nodes.json-URLs set. Please adjust config.json: server.map.nodesJsonUrl')
                );
            }
            if (_.isString(urls)) {
                urls = [urls];
            }

            retrieveNodeInformationForUrls(urls, callback);
        },

        sendMonitoringMails: function (callback) {
            Logger.tag('monitoring', 'mail-sending').debug('Sending monitoring mails...');

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

        deleteOfflineNodes: function (callback) {
            Logger
                .tag('nodes', 'delete-offline')
                .info(
                    'Deleting offline nodes older than ' +
                    DELETE_OFFLINE_NODES_AFTER_DURATION.amount + ' ' +
                    DELETE_OFFLINE_NODES_AFTER_DURATION.unit
                );

            Database.all(
                'SELECT * FROM node_state WHERE state = ? AND last_seen < ?',
                [
                    'OFFLINE',
                    moment().subtract(
                        DELETE_OFFLINE_NODES_AFTER_DURATION.amount,
                        DELETE_OFFLINE_NODES_AFTER_DURATION.unit
                    ).unix()
                ],
                function (err, rows) {
                    async.eachSeries(
                        rows,
                        function (row, nodeCallback) {
                            var mac = row.mac;
                            Logger.tag('nodes', 'delete-offline').info('Deleting node ' + mac);
                            NodeService.getNodeDataByMac(mac, function (err, node) {
                                if (err) {
                                    Logger.tag('nodes', 'delete-offline').error('Error getting node ' + mac, err);
                                    return nodeCallback(err);
                                }

                                async.seq(
                                    function (callback) {
                                        if (node && node.token) {
                                            // If the node has no token it is a special node (e.g. a gateway)
                                            // we need to skip.
                                            return NodeService.deleteNode(node.token, callback);
                                        }
                                        return callback(null);
                                    },
                                    function (callback) {
                                        Database.run(
                                            'DELETE FROM node_state WHERE mac = ? AND state = ?',
                                            [mac, 'OFFLINE'],
                                            callback
                                        );
                                    }
                                )(function (err) {
                                    if (err) {
                                        Logger.tag('nodes', 'delete-offline').error('Error deleting node ' + mac, err);
                                        return nodeCallback(err);
                                    }

                                    nodeCallback(null);
                                });
                            });
                        },
                        callback
                    );
                }
            );
        }
    };
});
