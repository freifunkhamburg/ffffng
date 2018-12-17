'use strict';

const _ = require('lodash')

const Constraints = require('../../shared/validation/constraints')
const ErrorTypes = require('../utils/errorTypes')
const Logger = require('../logger')
const Validator = require('../validation/validator')

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
    let sortField = _.includes(allowedSortFields, restParams._sortField) ? restParams._sortField : undefined;
    if (!sortField) {
        sortField = defaultSortField;
    }

    return {
        query: 'ORDER BY ' + sortField + ' ' + (restParams._sortDir === 'ASC' ? 'ASC' : 'DESC'),
        params: []
    };
}

function limitOffsetClause(restParams) {
    const page = restParams._page;
    const perPage = restParams._perPage;

    return {
        query: 'LIMIT ? OFFSET ?',
        params: [perPage, ((page - 1) * perPage)]
    };
}

function escapeForLikePattern(str) {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
}

function filterCondition(restParams, filterFields) {
    if (_.isEmpty(filterFields)) {
        return {
            query: '1 = 1',
            params: []
        };
    }

    let query = _.join(
        _.map(filterFields, function (field) {
            return 'LOWER(' + field + ') LIKE ?';
        }),
        ' OR '
    );

    query += ' ESCAPE \'\\\'';

    const search = '%' + (_.isString(restParams.q) ? escapeForLikePattern(_.toLower(restParams.q.trim())) : '') + '%';
    const params = _.times(filterFields.length, _.constant(search));

    return {
        query: query,
        params: params
    };
}

function getConstrainedValues(data, constraints) {
    const values = {};
    _.each(_.keys(constraints), function (key) {
        const value = data[key];
        values[key] =
            _.isUndefined(value) && !_.isUndefined(constraints[key].default) ? constraints[key].default : value;
    });
    return values;
}

module.exports = {
    getData (req) {
        return _.extend({}, req.body, req.params, req.query);
    },

    getValidRestParams(type, subtype, req, callback) {
        const constraints = Constraints.rest[type];
        if (!_.isPlainObject(constraints)) {
            Logger.tag('validation', 'rest').error('Unknown REST resource type: {}', type);
            return callback({data: 'Internal error.', type: ErrorTypes.internalError});
        }

        let filterConstraints = {};
        if (subtype) {
            filterConstraints = Constraints[subtype + 'Filters'];
            if (!_.isPlainObject(filterConstraints)) {
                Logger.tag('validation', 'rest').error('Unknown REST resource subtype: {}', subtype);
                return callback({data: 'Internal error.', type: ErrorTypes.internalError});
            }
        }

        const data = this.getData(req);

        const restParams = getConstrainedValues(data, constraints);
        const filterParams = getConstrainedValues(data, filterConstraints);

        const areValidParams = Validator.forConstraints(constraints);
        const areValidFilters = Validator.forConstraints(filterConstraints);
        if (!areValidParams(restParams) || !areValidFilters(filterParams)) {
            return callback({data: 'Invalid REST parameters.', type: ErrorTypes.badRequest});
        }

        restParams.filters = filterParams;

        callback(null, restParams);
    },

    filter (entities, allowedFilterFields, restParams) {
        let query = restParams.q;
        if (query) {
            query = _.toLower(query.trim());
        }

        function queryMatches(entity) {
            if (!query) {
                return true;
            }
            return _.some(allowedFilterFields, function (field) {
                let value = entity[field];
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
            });
        }

        const filters = restParams.filters;

        function filtersMatch(entity) {
            if (_.isEmpty(filters)) {
                return true;
            }

            return _.every(filters, function (value, key) {
                if (_.isUndefined(value)) {
                    return true;
                }
                if (_.startsWith(key, 'has')) {
                    const entityKey = key.substr(3, 1).toLowerCase() + key.substr(4);
                    return _.isEmpty(entity[entityKey]).toString() !== value;
                }
                return entity[key] === value;
            });
        }

        return _.filter(entities, function (entity) {
            return queryMatches(entity) && filtersMatch(entity);
        });
    },

    sort (entities, allowedSortFields, restParams) {
        const sortField = _.includes(allowedSortFields, restParams._sortField) ? restParams._sortField : undefined;
        if (!sortField) {
            return entities;
        }

        const sorted = _.sortBy(entities, [sortField]);

        return restParams._sortDir === 'ASC' ? sorted : _.reverse(sorted);
    },

    getPageEntities (entities, restParams) {
        const page = restParams._page;
        const perPage = restParams._perPage;

        return entities.slice((page - 1) * perPage, page * perPage);
    },

    whereCondition: filterCondition,

    filterClause (restParams, defaultSortField, allowedSortFields, filterFields) {
        const orderBy = orderByClause(
            restParams,
            defaultSortField,
            allowedSortFields
        );
        const limitOffset = limitOffsetClause(restParams);

        const filter = filterCondition(
            restParams,
            filterFields
        );

        return {
            query: filter.query + ' ' + orderBy.query + ' ' + limitOffset.query,
            params: _.concat(filter.params, orderBy.params, limitOffset.params)
        };
    },

    success (res, data) {
        respond(res, 200, data, 'json');
    },

    successHtml (res, html) {
        respond(res, 200, html, 'html');
    },

    error (res, err) {
        respond(res, err.type.code, err.data, 'json');
    }
}
