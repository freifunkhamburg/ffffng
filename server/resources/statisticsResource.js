'use strict';

const ErrorTypes = require('../utils/errorTypes')
const Logger = require('../logger')
const NodeService = require('../services/nodeService')
const Resources = require('../utils/resources')

module.exports = {
    get (req, res) {
        NodeService.getNodeStatistics((err, nodeStatistics) => {
            if (err) {
                Logger.tag('statistics').error('Error getting statistics:', err);
                return Resources.error(res, {data: 'Internal error.', type: ErrorTypes.internalError});
            }

            return Resources.success(
                res,
                {
                    nodes: nodeStatistics
                }
            );
        });
    }
}
