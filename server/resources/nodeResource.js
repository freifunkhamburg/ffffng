'use strict';

angular.module('ffffng').factory('NodeResource', function (
    Constraints,
    Validator,
    NodeService,
    _,
    Strings,
    ErrorTypes
) {
    function getData(req) {
        return _.extend({}, req.body, req.params);
    }

    var nodeFields = ['hostname', 'key', 'email', 'nickname', 'mac', 'coords'];

    function getValidNodeData(reqData) {
        var node = {};
        _.each(nodeFields, function (field) {
            var value = Strings.normalizeString(reqData[field]);
            if (field === 'mac') {
                value = Strings.normalizeMac(value);
            }
            node[field] = value;
        });
        return node;
    }

    function respond(res, httpCode, data) {
        res.writeHead(httpCode, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(data));
    }

    function success(res, data) {
        respond(res, 200, data);
    }

    function error(res, err) {
        respond(res, err.type.code, err.data);
    }

    var isValidNode = Validator.forConstraints(Constraints.node);
    var isValidToken = Validator.forConstraint(Constraints.token);

    return {
        create: function (req, res) {
            var data = getData(req);

            var node = getValidNodeData(data);
            if (!isValidNode(node)) {
                return error(res, {data: 'Invalid node data.', type: ErrorTypes.badRequest});
            }

            return NodeService.createNode(node, function (err, token, node) {
                if (err) {
                    return error(res, err);
                }
                return success(res, {token: token, node: node});
            });
        },

        update: function (req, res) {
            var data = getData(req);

            var token = Strings.normalizeString(data.token);
            if (!isValidToken(token)) {
                return error(res, {data: 'Invalid token.', type: ErrorTypes.badRequest});
            }

            var node = getValidNodeData(data);
            if (!isValidNode(node)) {
                return error(res, {data: 'Invalid node data.', type: ErrorTypes.badRequest});
            }

            return NodeService.updateNode(token, node, function (err, token, node) {
                if (err) {
                    return error(res, err);
                }
                return success(res, {token: token, node: node});
            });
        },

        delete: function (req, res) {
            var data = getData(req);

            var token = Strings.normalizeString(data.token);
            if (!isValidToken(token)) {
                return error(res, {data: 'Invalid token.', type: ErrorTypes.badRequest});
            }

            return NodeService.deleteNode(token, function (err) {
                if (err) {
                    return error(res, err);
                }
                return success(res, {});
            });
        },

        get: function (req, res) {
            var token = Strings.normalizeString(getData(req).token);
            if (!isValidToken(token)) {
                return error(res, {data: 'Invalid token.', type: ErrorTypes.badRequest});
            }

            return NodeService.getNodeData(token, function (err, node) {
                if (err) {
                    return error(res, err);
                }
                return success(res, node);
            });
        }
    };
});
