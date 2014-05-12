'use strict';

angular.module('ffffng')
.service('NodeService', function (config, _, crypto, fs, glob, Strings, ErrorTypes) {
    var linePrefixes = {
        hostname: '# Knotenname: ',
        nickname: '# Ansprechpartner: ',
        email: '# Kontakt: ',
        coords: '# Koordinaten: ',
        mac: '# MAC: ',
        token: '# Token: '
    };

    function generateToken() {
        return crypto.randomBytes(8).toString('hex');
    }

    function findNodeFiles(pattern) {
        return glob.sync(config.peersPath + '/' + pattern.toLowerCase());
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

    function writeNodeFile(isUpdate, token, node, callback) {
        var filename =
            config.peersPath + '/' + (node.hostname + '@' + node.mac + '@' + node.key + '@' + token).toLowerCase();

        var data = '';
        _.each(linePrefixes, function (prefix, key) {
            var value = key === 'token' ? token : node[key];
            if (_.isUndefined(value)) {
                value = '';
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

            var file = files[0];
            fs.unlinkSync(file);
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

    function parseNodeFile(file, callback) {
        var lines = fs.readFileSync(file).toString();

        var node = {};

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
                node[key] = value;
            });
        });
        callback(null, node);
    }

    return {
        createNode: function (node, callback) {
            var token = generateToken();
            writeNodeFile(false, token, node, callback);
        },

        updateNode: function (token, node, callback) {
            writeNodeFile(true, token, node, callback);
        },

        getNodeData: function (token, callback) {
            var files = findNodeFiles('*@*@*@' + token);

            if (files.length !== 1) {
                return callback({data: 'Node not found.', type: ErrorTypes.notFound});
            }

            var file = files[0];
            return parseNodeFile(file, callback);
        }
    };
});
