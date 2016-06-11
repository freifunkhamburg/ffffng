'use strict';

angular.module('ffffng').factory('Resources', function (_, Constraints, Validator, ErrorTypes) {
    function respond(res, httpCode, data, type) {
        switch (type) {
            case 'html':
                res.writeHead(httpCode, {'Content-Type': 'text/html'});
                res.end(data);
            break;

            default:
                res.writeHead(httpCode, {'Content-Type': 'application/json'});
                res.end(JSON.stringify(data));
            break;
        }
    }

    function orderByClause(restParams, defaultSortField, allowedSortFields) {
        var sortField = _.includes(allowedSortFields, restParams._sortField) ? restParams._sortField : undefined;
        if (!sortField) {
            sortField = defaultSortField;
        }

        return {
            query: 'ORDER BY ' + sortField + ' ' + (restParams._sortDir === 'ASC' ? 'ASC' : 'DESC'),
            params: []
        }
    }

    function limitOffsetClause(restParams) {
        var page = restParams._page;
        var perPage = restParams._perPage;

        return {
            query: 'LIMIT ? OFFSET ?',
            params: [perPage, ((page - 1) * perPage)]
        };
    }

    function escapeForLikePattern(str) {
        return str
            .replace(/\\/g, '\\\\')
            .replace(/%/g, '\\%')
            .replace(/_/g, '\\_')
    }

    function filterCondition(restParams, filterFields) {
        if (_.isEmpty(filterFields)) {
            return {
                query: '1 = 1',
                params: []
            }
        }

        var query = _.join(
            _.map(filterFields, function (field) {
                return 'LOWER(' + field + ') LIKE ?';
            }),
            ' OR '
        );

        query += ' ESCAPE \'\\\'';

        var search = '%' + (_.isString(restParams.q) ? escapeForLikePattern(_.toLower(restParams.q.trim())) : '') + '%';
        var params = _.times(filterFields.length, _.constant(search));

        return {
            query: query,
            params: params
        };
    }

    return {
        getData: function (req) {
            return _.extend({}, req.body, req.params, req.query);
        },

        getValidRestParams: function(type, req, callback) {
            var constraints = Constraints.rest[type];
            if (!_.isPlainObject(constraints)) {
                Logger.tag('validation', 'rest').error('Unknown REST resource type: {}', type);
                return callback({data: 'Internal error.', type: ErrorTypes.internalError});
            }

            var data = this.getData(req);

            var restParams = {};
            _.each(_.keys(constraints), function (key) {
                var value = data[key];
                restParams[key] = _.isUndefined(value) && !_.isUndefined(constraints[key].default)
                                ? constraints[key].default
                                : value;
            });

            var areValidParams = Validator.forConstraints(constraints);
            if (!areValidParams(restParams)) {
                return callback({data: 'Invalid REST parameters.', type: ErrorTypes.badRequest});
            }

            callback(null, restParams);
        },

        filter: function (entities, allowedFilterFields, restParams) {
            var query = restParams.q;
            if (!query) {
                return entities;
            }

            query = _.toLower(query.trim());

            return _.filter(entities, function (entity) {
                return _.some(allowedFilterFields, function (field) {
                    var value = entity[field];
                    if (_.isNumber(value)) {
                        value = value.toString();
                    }

                    if (!_.isString(value) || _.isEmpty(value)) {
                        return false;
                    }

                    value = _.toLower(value);
                    if (field === 'mac') {
                        return _.includes(value.replace(/:/g, ''), query.replace(/:/g, ''));
                    }

                    return _.includes(value, query);
                })
            });
        },

        sort: function (entities, allowedSortFields, restParams) {
            var sortField = _.includes(allowedSortFields, restParams._sortField) ? restParams._sortField : undefined;
            if (!sortField) {
                return entities;
            }

            var sorted = _.sortBy(entities, [sortField]);

            return restParams._sortDir === 'ASC' ? sorted : _.reverse(sorted);
        },

        getPageEntities: function (entities, restParams) {
            var page = restParams._page;
            var perPage = restParams._perPage;

            return entities.slice((page - 1) * perPage, page * perPage);
        },

        filterClause: function (restParams, defaultSortField, allowedSortFields, filterFields) {
            var orderBy = orderByClause(
                restParams,
                defaultSortField,
                allowedSortFields
            );
            var limitOffset = limitOffsetClause(restParams);

            var filter = filterCondition(
                restParams,
                filterFields
            );

            return {
                query: filter.query + ' ' + orderBy.query + ' ' + limitOffset.query,
                params: _.concat(filter.params, orderBy.params, limitOffset.params)
            }
        },

        success: function (res, data) {
            respond(res, 200, data, 'json');
        },

        successHtml: function (res, html) {
            respond(res, 200, html, 'html');
        },

        error: function (res, err) {
            respond(res, err.type.code, err.data, 'json');
        }
    };
});
