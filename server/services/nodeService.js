'use strict';

angular.module('ffffng')
.service('NodeService', function (config, _, crypto, fs, glob, Strings, ErrorTypes) {
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

    function generateToken() {
        return crypto.randomBytes(8).toString('hex');
    }

    function findNodeFiles(pattern) {
        return glob.sync(config.server.peersPath + '/' + pattern.toLowerCase());
    }

    function isDuplicate(pattern, token) {
        var files = findNodeFiles(pattern);
        if (files.length === 0) {
            return false;
        }

        if (files.length > 1 || !token) {
            return true;
        }

        var file = files[0];
        return file.substring(file.length - token.length, file.length) !== token;
    }

    function checkNoDuplicates(token, node) {
        if (isDuplicate(node.hostname + '@*@*@*', token)) {
            return {data: {msg: 'Already exists.', field: 'hostname'}, type: ErrorTypes.conflict};
        }

        if (node.key) {
            if (isDuplicate('*@*@' + node.key + '@*', token)) {
                return {data: {msg: 'Already exists.', field: 'key'}, type: ErrorTypes.conflict};
            }
        }

        if (isDuplicate('*@' + node.mac + '@*@*', token)) {
            return {data: {msg: 'Already exists.', field: 'mac'}, type: ErrorTypes.conflict};
        }
        return null;
    }

    function writeNodeFile(isUpdate, token, node, nodeSecrets, callback) {
        var filename =
            config.server.peersPath + '/' + (node.hostname + '@' + node.mac + '@' + node.key + '@' + token).toLowerCase();

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
            var files = findNodeFiles('*@*@*@' + token);
            if (files.length !== 1) {
                return callback({data: 'Node not found.', type: ErrorTypes.notFound});
            }

            error = checkNoDuplicates(token, node);
            if (error) {
                return callback(error);
            }

            try {
                var file = files[0];
                fs.unlinkSync(file);
            }
            catch (error) {
                console.log(error);
                return callback({data: 'Could not remove old node data.', type: ErrorTypes.internalError});
            }
        } else {
            error = checkNoDuplicates(null, node);
            if (error) {
                return callback(error);
            }
        }

        try {
            fs.writeFileSync(filename, data, 'utf8');
        }
        catch (error) {
            console.log(error);
            return callback({data: 'Could not write node data.', type: ErrorTypes.internalError});
        }

        return callback(null, token, node);
    }

    function deleteNodeFile(token, callback) {
        var files = findNodeFiles('*@*@*@' + token);
        if (files.length !== 1) {
            return callback({data: 'Node not found.', type: ErrorTypes.notFound});
        }

        try {
            fs.unlinkSync(files[0]);
        }
        catch (error) {
            console.log(error);
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
                if (key === 'monitoring') {
                    var active = value === 'aktiv';
                    var pending = value === 'pending';
                    node.monitoring = active || pending;
                    node.monitoringConfirmed = active;
                } else if (key === 'monitoringToken') {
                    nodeSecrets.monitoringToken = value;
                } else {
                    node[key] = value;
                }
            });
        });

        callback(null, node, nodeSecrets);
    }

    function getNodeDataByFilePattern(pattern, callback) {
        var files = findNodeFiles(pattern);

        if (files.length !== 1) {
            return callback({data: 'Node not found.', type: ErrorTypes.notFound});
        }

        var file = files[0];
        return parseNodeFile(file, callback);
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
                    // TODO: Send mail...
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
                        // TODO: Send mail...
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

        getNodeDataByToken: function (token, callback) {
            return getNodeDataByFilePattern('*@*@*@' + token, callback);
        },

        getNodeDataByMac: function (mac, callback) {
            return getNodeDataByFilePattern('*@' + mac + '@*@*', callback);
        }
    };
});
