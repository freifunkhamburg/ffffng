'use strict';

angular.module('ffffng')
.service('NodeService', function (
    config,
    _,
    async,
    crypto,
    fs,
    glob,
    Logger,
    MailService,
    Strings,
    ErrorTypes,
    UrlBuilder
) {
    var MAX_PARALLEL_NODES_PARSING = 10;

    var linePrefixes = {
        hostname: '# Knotenname: ',
        nickname: '# Ansprechpartner: ',
        email: '# Kontakt: ',
        coords: '# Koordinaten: ',
        mac: '# MAC: ',
        token: '# Token: ',
        monitoring: '# Monitoring: ',
        monitoringToken: '# Monitoring-Token: '
    };

    var filenameParts = ['hostname', 'mac', 'key', 'token', 'monitoringToken'];

    function generateToken() {
        return crypto.randomBytes(8).toString('hex');
    }

    function findNodeFiles(filter) {
        var pattern = _.join(
            _.map(filenameParts, function (field) {
                return filter.hasOwnProperty(field) ? filter[field] : '*';
            }),
            '@'
        );

        return glob.sync(config.server.peersPath + '/' + pattern.toLowerCase());
    }

    function parseNodeFilename(filename) {
        var parts = _.split(filename, '@', filenameParts.length);
        var parsed = {};
        _.each(_.zip(filenameParts, parts), function (part) {
            parsed[part[0]] = part[1];
        });
        return parsed;
    }

    function isDuplicate(filter, token) {
        var files = findNodeFiles(filter);
        if (files.length === 0) {
            return false;
        }

        if (files.length > 1 || !token /* node is being created*/) {
            return true;
        }

        return parseNodeFilename(files[0]).token !== token;
    }

    function checkNoDuplicates(token, node, nodeSecrets) {
        if (isDuplicate({ hostname: node.hostname }, token)) {
            return {data: {msg: 'Already exists.', field: 'hostname'}, type: ErrorTypes.conflict};
        }

        if (node.key) {
            if (isDuplicate({ key: node.key }, token)) {
                return {data: {msg: 'Already exists.', field: 'key'}, type: ErrorTypes.conflict};
            }
        }

        if (isDuplicate({ mac: node.mac }, token)) {
            return {data: {msg: 'Already exists.', field: 'mac'}, type: ErrorTypes.conflict};
        }

        if (nodeSecrets.monitoringToken && isDuplicate({ monitoringToken: nodeSecrets.monitoringToken }, token)) {
            return {data: {msg: 'Already exists.', field: 'monitoringToken'}, type: ErrorTypes.conflict};
        }

        return null;
    }

    function writeNodeFile(isUpdate, token, node, nodeSecrets, callback) {
        var filename =
            config.server.peersPath + '/' +
            (
                node.hostname + '@' +
                node.mac + '@' +
                (node.key || '') + '@' +
                token + '@' +
                (nodeSecrets.monitoringToken || '')
            ).toLowerCase();

        var data = '';
        _.each(linePrefixes, function (prefix, key) {
            var value;
            switch (key) {
                case 'monitoring':
                    if (node.monitoring && node.monitoringConfirmed) {
                        value = 'aktiv';
                    } else if (node.monitoring && !node.monitoringConfirmed) {
                        value = 'pending';
                    } else {
                        value = '';
                    }
                break;

                case 'monitoringToken':
                    value = nodeSecrets.monitoringToken || '';
                break;

                default:
                    value = key === 'token' ? token : node[key];
                    if (_.isUndefined(value)) {
                        value = _.isUndefined(nodeSecrets[key]) ? '' : nodeSecrets[key];
                    }
                break;
            }
            data += prefix + value + '\n';
        });
        if (node.key) {
            data += 'key "' + node.key + '";\n';
        }

        // since node.js is single threaded we don't need a lock

        var error;

        if (isUpdate) {
            var files = findNodeFiles({ token: token });
            if (files.length !== 1) {
                return callback({data: 'Node not found.', type: ErrorTypes.notFound});
            }

            error = checkNoDuplicates(token, node, nodeSecrets);
            if (error) {
                return callback(error);
            }

            var file = files[0];
            try {
                fs.unlinkSync(file);
            }
            catch (error) {
                Logger.tag('node', 'save').error('Could not delete old node file: ' + file, error);
                return callback({data: 'Could not remove old node data.', type: ErrorTypes.internalError});
            }
        } else {
            error = checkNoDuplicates(null, node, nodeSecrets);
            if (error) {
                return callback(error);
            }
        }

        try {
            fs.writeFileSync(filename, data, 'utf8');
        }
        catch (error) {
            Logger.tag('node', 'save').error('Could not write node file: ' + filename, error);
            return callback({data: 'Could not write node data.', type: ErrorTypes.internalError});
        }

        return callback(null, token, node);
    }

    function deleteNodeFile(token, callback) {
        var files = findNodeFiles({ token: token });
        if (files.length !== 1) {
            return callback({data: 'Node not found.', type: ErrorTypes.notFound});
        }

        try {
            fs.unlinkSync(files[0]);
        }
        catch (error) {
            Logger.tag('node', 'delete').error('Could not delete node file: ' + file, error);
            return callback({data: 'Could not delete node.', type: ErrorTypes.internalError});
        }

        return callback(null);
    }

    function parseNodeFile(file, callback) {
        var lines = fs.readFileSync(file).toString();

        var node = {};
        var nodeSecrets = {};

        _.each(lines.split('\n'), function (line) {
            var entries = {};

            for (var key in linePrefixes) {
                if (linePrefixes.hasOwnProperty(key)) {
                    var prefix = linePrefixes[key];
                    if (line.substring(0, prefix.length) === prefix) {
                        entries[key] = Strings.normalizeString(line.substr(prefix.length));
                        break;
                    }
                }
            }

            if (_.isEmpty(entries) && line.substring(0, 5) === 'key "') {
                entries.key = Strings.normalizeString(line.split('"')[1]);
            }

            _.each(entries, function (value, key) {
                if (key === 'mac') {
                    node['mac'] = value;
                    node['mapId'] = _.toLower(value).replace(/:/g, '')
                } else if (key === 'monitoring') {
                    var active = value === 'aktiv';
                    var pending = value === 'pending';
                    node.monitoring = active || pending;
                    node.monitoringConfirmed = active;
                    node.monitoringState = active ? 'active' : (pending ? 'pending' : '');
                } else if (key === 'monitoringToken') {
                    nodeSecrets.monitoringToken = value;
                } else {
                    node[key] = value;
                }
            });
        });

        callback(null, node, nodeSecrets);
    }

    function findNodeDataByFilePattern(filter, callback) {
        var files = findNodeFiles(filter);

        if (files.length !== 1) {
            return callback(null);
        }

        var file = files[0];
        return parseNodeFile(file, callback);
    }

    function getNodeDataByFilePattern(filter, callback) {
        findNodeDataByFilePattern(filter, function (err, node, nodeSecrets) {
            if (err) {
                return callback(err);
            }

            if (!node) {
                return callback({data: 'Node not found.', type: ErrorTypes.notFound});
            }

            callback(null, node, nodeSecrets);
        });
    }

    function sendMonitoringConfirmationMail(node, nodeSecrets, callback) {
        var confirmUrl = UrlBuilder.monitoringConfirmUrl(nodeSecrets);
        var disableUrl = UrlBuilder.monitoringDisableUrl(nodeSecrets);

        MailService.enqueue(
            config.server.email.from,
            node.nickname + ' <' + node.email + '>',
            'monitoring-confirmation',
            {
                node: node,
                confirmUrl: confirmUrl,
                disableUrl: disableUrl
            },
            function (err) {
                if (err) {
                    Logger.tag('monitoring', 'confirmation').error('Could not enqueue confirmation mail.', error);
                    return callback({data: 'Internal error.', type: ErrorTypes.internalError});
                }

                callback(null);
            }
        );
    }

    return {
        createNode: function (node, callback) {
            var token = generateToken();
            var nodeSecrets = {};

            node.monitoringConfirmed = false;

            if (node.monitoring) {
                nodeSecrets.monitoringToken = generateToken();
            }

            writeNodeFile(false, token, node, nodeSecrets, function (err, token, node) {
                if (err) {
                    return callback(err);
                }

                if (node.monitoring && !node.monitoringConfirmed) {
                    return sendMonitoringConfirmationMail(node, nodeSecrets, function (err) {
                        if (err) {
                            return callback(err);
                        }

                        return callback(null, token, node);
                    });
                }

                return callback(null, token, node);
            });
        },

        updateNode: function (token, node, callback) {
            this.getNodeDataByToken(token, function (err, currentNode, nodeSecrets) {
                if (err) {
                    return callback(err);
                }

                var monitoringConfirmed = false;
                var monitoringToken = '';

                if (node.monitoring) {
                    if (!currentNode.monitoring) {
                        // monitoring just has been enabled
                        monitoringConfirmed = false;
                        monitoringToken = generateToken();

                    } else {
                        // monitoring is still enabled

                        if (currentNode.email != node.email) {
                            // new email so we need a new token and a reconfirmation
                            monitoringConfirmed = false;
                            monitoringToken = generateToken();

                        } else {
                            // email unchanged, keep token (fix if not set) and confirmation state
                            monitoringConfirmed = currentNode.monitoringConfirmed;
                            monitoringToken = nodeSecrets.monitoringToken || generateToken();
                        }
                    }
                }

                node.monitoringConfirmed = monitoringConfirmed;
                nodeSecrets.monitoringToken = monitoringToken;

                writeNodeFile(true, token, node, nodeSecrets, function (err, token, node) {
                    if (err) {
                        return callback(err);
                    }

                    if (node.monitoring && !node.monitoringConfirmed) {
                        return sendMonitoringConfirmationMail(node, nodeSecrets, function (err) {
                            if (err) {
                                return callback(err);
                            }

                            return callback(null, token, node);
                        });
                    }

                    return callback(null, token, node);
                });
            });
        },

        internalUpdateNode: function (token, node, nodeSecrets, callback) {
            writeNodeFile(true, token, node, nodeSecrets, callback);
        },

        deleteNode: function (token, callback) {
            deleteNodeFile(token, callback);
        },

        getAllNodes: function (callback) {
            var files = findNodeFiles({});

            async.mapLimit(
                files,
                MAX_PARALLEL_NODES_PARSING,
                parseNodeFile,
                function (err, nodes) {
                    if (err) {
                        Logger.tag('nodes').error('Error getting all nodes:', error);
                        return callback({data: 'Internal error.', type: ErrorTypes.internalError});
                    }

                    return callback(null, nodes);
                }
            );
        },

        findNodeDataByMac: function (mac, callback) {
            return findNodeDataByFilePattern({ mac: mac }, callback);
        },

        getNodeDataByToken: function (token, callback) {
            return getNodeDataByFilePattern({ token: token }, callback);
        },

        getNodeDataByMonitoringToken: function (monitoringToken, callback) {
            return getNodeDataByFilePattern({ monitoringToken: monitoringToken }, callback);
        }
    };
});
