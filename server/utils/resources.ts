import _ from "lodash";

import CONSTRAINTS from "../validation/constraints";
import ErrorTypes from "../utils/errorTypes";
import Logger from "../logger";
import {Constraints, forConstraints, isConstraints} from "../validation/validator";
import {Request, Response} from "express";
import {EnumTypeGuard, EnumValue, type GenericSortField, SortDirection, TypeGuard} from "../types";

export type Entity = { [key: string]: any };

export type RestParams = {
    q?: string;

    _sortField?: GenericSortField;
    _sortDir?: SortDirection;

    _page: number;
    _perPage: number;

    filters?: FilterClause;
};

export type OrderByClause = { query: string, params: any[] };
export type LimitOffsetClause = { query: string, params: any[] };
export type FilterClause = { query: string, params: any[] };

function respond(res: Response, httpCode: number, data: any, type: string): void {
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

function orderByClause<S>(
    restParams: RestParams,
    defaultSortField: EnumValue<S>,
    isSortField: EnumTypeGuard<S>,
): OrderByClause {
    let sortField: EnumValue<S> | undefined = isSortField(restParams._sortField) ? restParams._sortField : undefined;
    if (!sortField) {
        sortField = defaultSortField;
    }

    return {
        query: 'ORDER BY LOWER(' + sortField + ') ' + (restParams._sortDir === SortDirection.ASCENDING ? 'ASC' : 'DESC'),
        params: []
    };
}

function limitOffsetClause(restParams: RestParams): LimitOffsetClause {
    const page = restParams._page;
    const perPage = restParams._perPage;

    return {
        query: 'LIMIT ? OFFSET ?',
        params: [perPage, ((page - 1) * perPage)]
    };
}

function escapeForLikePattern(str: string): string {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
}

function filterCondition(restParams: RestParams, filterFields: string[]): FilterClause {
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

function getConstrainedValues(data: { [key: string]: any }, constraints: Constraints): { [key: string]: any } {
    const values: { [key: string]: any } = {};
    _.each(_.keys(constraints), (key: string): void => {
        const value = data[key];
        values[key] =
            _.isUndefined(value) && key in constraints && !_.isUndefined(constraints[key].default)
                ? constraints[key].default
                : value;
    });
    return values;
}

export function getData(req: Request): any {
    return _.extend({}, req.body, req.params, req.query);
}

export async function getValidRestParams(
    type: string,
    subtype: string | null,
    req: Request,
): Promise<RestParams> {
    const restConstraints = CONSTRAINTS.rest as { [key: string]: any };
    let constraints: Constraints;
    if (!(type in restConstraints) || !isConstraints(restConstraints[type])) {
        Logger.tag('validation', 'rest').error('Unknown REST resource type: {}', type);
        throw {data: 'Internal error.', type: ErrorTypes.internalError};
    }
    constraints = restConstraints[type];

    let filterConstraints: Constraints = {};
    if (subtype) {
        const subtypeFilters = subtype + 'Filters';
        const constraintsObj = CONSTRAINTS as { [key: string]: any };
        if (!(subtypeFilters in constraintsObj) || !isConstraints(constraintsObj[subtypeFilters])) {
            Logger.tag('validation', 'rest').error('Unknown REST resource subtype: {}', subtype);
            throw {data: 'Internal error.', type: ErrorTypes.internalError};
        }
        filterConstraints = constraintsObj[subtypeFilters];
    }

    const data = getData(req);

    const restParams = getConstrainedValues(data, constraints);
    const filterParams = getConstrainedValues(data, filterConstraints);

    const areValidParams = forConstraints(constraints, false);
    const areValidFilters = forConstraints(filterConstraints, false);
    if (!areValidParams(restParams) || !areValidFilters(filterParams)) {
        throw {data: 'Invalid REST parameters.', type: ErrorTypes.badRequest};
    }

    restParams.filters = filterParams;
    return restParams as RestParams;
}

export function filter<E>(entities: ArrayLike<E>, allowedFilterFields: string[], restParams: RestParams): E[] {
    let query = restParams.q;
    if (query) {
        query = _.toLower(query.trim());
    }

    function queryMatches(entity: Entity): boolean {
        if (!query) {
            return true;
        }
        return _.some(allowedFilterFields, (field: string): boolean => {
            if (!query) {
                return true;
            }
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

    function filtersMatch(entity: Entity): boolean {
        if (_.isEmpty(filters)) {
            return true;
        }

        return _.every(filters, (value: any, key: string): boolean => {
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
}

export function sort<T, S>(entities: ArrayLike<T>, isSortField: TypeGuard<S>, restParams: RestParams): ArrayLike<T> {
    const sortField: S | undefined = isSortField(restParams._sortField) ? restParams._sortField : undefined;
    if (!sortField) {
        return entities;
    }

    const sorted: T[] = _.sortBy(entities, [sortField]);
    if (restParams._sortDir === SortDirection.ASCENDING) {
        return sorted;
    } else {
        return _.reverse(sorted);
    }
}

export function getPageEntities(entities: ArrayLike<Entity>, restParams: RestParams) {
    const page = restParams._page;
    const perPage = restParams._perPage;

    return _.slice(entities, (page - 1) * perPage, page * perPage);
}

export {filterCondition as whereCondition};

export function filterClause<S>(
    restParams: RestParams,
    defaultSortField: EnumValue<S>,
    isSortField: EnumTypeGuard<S>,
    filterFields: string[],
): FilterClause {
    const orderBy = orderByClause<S>(
        restParams,
        defaultSortField,
        isSortField,
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
}

export function success(res: Response, data: any) {
    respond(res, 200, data, 'json');
}

export function successHtml(res: Response, html: string) {
    respond(res, 200, html, 'html');
}

export function error(res: Response, err: { data: any, type: { code: number } }) {
    respond(res, err.type.code, err.data, 'json');
}
