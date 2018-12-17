'use strict';

const _ = require('lodash')
const deepExtend = require('deep-extend')

const Constraints = require('../../shared/validation/constraints')
const ErrorTypes = require('../utils/errorTypes')
const Logger = require('../logger')
const MonitoringService = require('../services/monitoringService')
const NodeService = require('../services/nodeService')
const Strings = require('../utils/strings')
const Validator = require('../validation/validator')
const Resources = require('../utils/resources')

const nodeFields = ['hostname', 'key', 'email', 'nickname', 'mac', 'coords', 'monitoring'];

function getNormalizedNodeData(reqData) {
    const node = {};
    _.each(nodeFields, function (field) {
        let value = Strings.normalizeString(reqData[field]);
        if (field === 'mac') {
            value = Strings.normalizeMac(value);
        }
        node[field] = value;
    });
    return node;
}

const isValidNode = Validator.forConstraints(Constraints.node);
const isValidToken = Validator.forConstraint(Constraints.token);

module.exports =  {
    create: function (req, res) {
        const data = Resources.getData(req);

        const node = getNormalizedNodeData(data);
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
        const data = Resources.getData(req);

        const token = Strings.normalizeString(data.token);
        if (!isValidToken(token)) {
            return Resources.error(res, {data: 'Invalid token.', type: ErrorTypes.badRequest});
        }

        const node = getNormalizedNodeData(data);
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
        const data = Resources.getData(req);

        const token = Strings.normalizeString(data.token);
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
        const token = Strings.normalizeString(Resources.getData(req).token);
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
        Resources.getValidRestParams('list', 'node', req, function (err, restParams) {
            if (err) {
                return Resources.error(res, err);
            }

            return NodeService.getAllNodes(function (err, nodes) {
                if (err) {
                    return Resources.error(res, err);
                }

                const realNodes = _.filter(nodes, function (node) {
                    // We ignore nodes without tokens as those are only manually added ones like gateways.
                    return node.token;
                });

                const macs = _.map(realNodes, function (node) {
                    return node.mac;
                });

                MonitoringService.getByMacs(macs, function (err, nodeStateByMac) {
                    if (err) {
                        Logger.tag('nodes', 'admin').error('Error getting nodes by MACs:', err);
                        return Resources.error(res, {data: 'Internal error.', type: ErrorTypes.internalError});
                    }

                    const enhancedNodes = _.map(realNodes, function (node) {
                        const nodeState = nodeStateByMac[node.mac];
                        if (nodeState) {
                            return deepExtend({}, node, {
                                site: nodeState.site,
                                domain: nodeState.domain,
                                onlineState: nodeState.state
                            });
                        }

                        return node;
                    });

                    const filteredNodes = Resources.filter(
                        enhancedNodes,
                        [
                            'hostname',
                            'nickname',
                            'email',
                            'token',
                            'mac',
                            'site',
                            'domain',
                            'key',
                            'onlineState'
                        ],
                        restParams
                    );
                    const total = filteredNodes.length;

                    const sortedNodes = Resources.sort(
                        filteredNodes,
                        [
                            'hostname',
                            'nickname',
                            'email',
                            'token',
                            'mac',
                            'key',
                            'site',
                            'domain',
                            'coords',
                            'onlineState',
                            'monitoringState'
                        ],
                        restParams
                    );
                    const pageNodes = Resources.getPageEntities(sortedNodes, restParams);

                    res.set('X-Total-Count', total);
                    return Resources.success(res, pageNodes);
                });
            });
        });
    }
}
