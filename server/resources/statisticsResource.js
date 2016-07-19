'use strict';

angular.module('ffffng').factory('StatisticsResource', function (
    Logger,
    NodeService,
    Resources,
    ErrorTypes
) {
    return {
        get: function (req, res) {
            NodeService.getNodeStatistics(function (err, nodeStatistics) {
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
    };
});
