'use strict';

angular.module('ffffng').factory('NodeResource', function (
    Constraints,
    Validator,
    NodeService,
    _,
    Strings,
    Resources,
    ErrorTypes
) {
    var nodeFields = ['hostname', 'key', 'email', 'nickname', 'mac', 'coords', 'monitoring'];

    function getNormalizedNodeData(reqData) {
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

    var isValidNode = Validator.forConstraints(Constraints.node);
    var isValidToken = Validator.forConstraint(Constraints.token);

    return {
        create: function (req, res) {
            var data = Resources.getData(req);

            var node = getNormalizedNodeData(data);
            if (!isValidNode(node)) {
                return Resources.error(res, {data: 'Invalid node data.', type: ErrorTypes.badRequest});
            }

            return NodeService.createNode(node, function (err, token, node) {
                if (err) {
                    return Resources.error(res, err);
                }
                return Resources.success(res, {token: token, node: node});
            });
        },

        update: function (req, res) {
            var data = Resources.getData(req);

            var token = Strings.normalizeString(data.token);
            if (!isValidToken(token)) {
                return Resources.error(res, {data: 'Invalid token.', type: ErrorTypes.badRequest});
            }

            var node = getNormalizedNodeData(data);
            if (!isValidNode(node)) {
                return Resources.error(res, {data: 'Invalid node data.', type: ErrorTypes.badRequest});
            }

            return NodeService.updateNode(token, node, function (err, token, node) {
                if (err) {
                    return Resources.error(res, err);
                }
                return Resources.success(res, {token: token, node: node});
            });
        },

        delete: function (req, res) {
            var data = Resources.getData(req);

            var token = Strings.normalizeString(data.token);
            if (!isValidToken(token)) {
                return Resources.error(res, {data: 'Invalid token.', type: ErrorTypes.badRequest});
            }

            return NodeService.deleteNode(token, function (err) {
                if (err) {
                    return Resources.error(res, err);
                }
                return Resources.success(res, {});
            });
        },

        get: function (req, res) {
            var token = Strings.normalizeString(Resources.getData(req).token);
            if (!isValidToken(token)) {
                return Resources.error(res, {data: 'Invalid token.', type: ErrorTypes.badRequest});
            }

            return NodeService.getNodeDataByToken(token, function (err, node) {
                if (err) {
                    return Resources.error(res, err);
                }
                return Resources.success(res, node);
            });
        },

        getAll: function (req, res) {
            Resources.getValidRestParams('list', req, function (err, restParams) {
                if (err) {
                    return Resources.error(res, err);
                }

                return NodeService.getAllNodes(function (err, nodes) {
                    if (err) {
                        return Resources.error(res, err);
                    }

                    var filteredNodes = Resources.filter(
                        nodes,
                        ['hostname', 'nickname', 'email', 'token', 'mac', 'key'],
                        restParams
                    );
                    var total = filteredNodes.length;

                    var sortedNodes = Resources.sort(
                        filteredNodes,
                        ['hostname', 'nickname', 'email', 'token', 'mac', 'key', 'coords', 'monitoringState'],
                        restParams
                    );
                    var pageNodes = Resources.getPageEntities(sortedNodes, restParams);

                    res.set('X-Total-Count', total);
                    return Resources.success(res, pageNodes);
                });
            });
        }
    };
});
