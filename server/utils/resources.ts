import _ from "lodash";

import CONSTRAINTS from "../shared/validation/constraints";
import ErrorTypes from "./errorTypes";
import Logger from "../logger";
import {
    Constraints,
    forConstraints,
    isConstraints,
    NestedConstraints,
} from "../shared/validation/validator";
import { Request, Response } from "express";
import {
    EnumTypeGuard,
    ValueOf,
    type GenericSortField,
    getFieldIfExists,
    isJSONObject,
    isNumber,
    isString,
    isUndefined,
    JSONObject,
    JSONValue,
    SortDirection,
    TypeGuard,
} from "../types";

export type RequestData = JSONObject;
export type RequestHandler = (request: Request, response: Response) => void;

export type Entity = { [key: string]: unknown };

export type RestParams = {
    q?: string;

    _sortField?: GenericSortField;
    _sortDir?: SortDirection;

    _page: number;
    _perPage: number;

    filters?: FilterClause;
};

export type OrderByClause = { query: string; params: unknown[] };
export type LimitOffsetClause = { query: string; params: unknown[] };
export type FilterClause = { query: string; params: unknown[] };

function respond(
    res: Response,
    httpCode: number,
    data: string,
    type: "html"
): void;
function respond(
    res: Response,
    httpCode: number,
    data: JSONValue,
    type: "json"
): void;
function respond(
    res: Response,
    httpCode: number,
    data: JSONValue,
    type: "html" | "json"
): void {
    switch (type) {
        case "html":
            res.writeHead(httpCode, { "Content-Type": "text/html" });
            res.end(data);
            break;

        default:
            res.writeHead(httpCode, { "Content-Type": "application/json" });
            res.end(JSON.stringify(data));
            break;
    }
}

function orderByClause<S>(
    restParams: RestParams,
    defaultSortField: ValueOf<S>,
    isSortField: EnumTypeGuard<S>
): OrderByClause {
    let sortField: ValueOf<S> | undefined = isSortField(restParams._sortField)
        ? restParams._sortField
        : undefined;
    if (!sortField) {
        sortField = defaultSortField;
    }

    return {
        query:
            "ORDER BY LOWER(" +
            sortField +
            ") " +
            (restParams._sortDir === SortDirection.ASCENDING ? "ASC" : "DESC"),
        params: [],
    };
}

function limitOffsetClause(restParams: RestParams): LimitOffsetClause {
    const page = restParams._page;
    const perPage = restParams._perPage;

    return {
        query: "LIMIT ? OFFSET ?",
        params: [perPage, (page - 1) * perPage],
    };
}

function escapeForLikePattern(str: string): string {
    return str.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

function filterCondition(
    restParams: RestParams,
    filterFields: string[]
): FilterClause {
    if (_.isEmpty(filterFields)) {
        return {
            query: "1 = 1",
            params: [],
        };
    }

    let query = filterFields
        .map((field) => "LOWER(" + field + ") LIKE ?")
        .join(" OR ");

    query += " ESCAPE '\\'";

    const search =
        "%" +
        (isString(restParams.q)
            ? escapeForLikePattern(restParams.q.trim().toLowerCase())
            : "") +
        "%";
    const params = _.times(filterFields.length, () => search);

    return {
        query: query,
        params: params,
    };
}

function getConstrainedValues(
    data: { [key: string]: unknown },
    constraints: Constraints
): { [key: string]: unknown } {
    const values: { [key: string]: unknown } = {};
    for (const key of Object.keys(constraints)) {
        const value = data[key];
        values[key] =
            isUndefined(value) &&
            key in constraints &&
            !isUndefined(constraints[key].default)
                ? constraints[key].default
                : value;
    }
    return values;
}

function normalize(data: unknown): JSONObject {
    return isJSONObject(data) ? data : {};
}

export function getData(req: Request): RequestData {
    const body = normalize(req.body);
    const params = normalize(req.params);
    const query = normalize(req.query);

    return {
        ...body,
        ...params,
        ...query,
    };
}

export async function getValidRestParams(
    type: string,
    subtype: string | null,
    req: Request
): Promise<RestParams> {
    const restConstraints = CONSTRAINTS.rest as { [key: string]: Constraints };
    if (!(type in restConstraints) || !isConstraints(restConstraints[type])) {
        Logger.tag("validation", "rest").error(
            "Unknown REST resource type: {}",
            type
        );
        throw { data: "Internal error.", type: ErrorTypes.internalError };
    }
    const constraints: Constraints = restConstraints[type];

    let filterConstraints: Constraints = {};
    if (subtype) {
        const subtypeFilters = subtype + "Filters";
        const nestedConstraints = CONSTRAINTS as NestedConstraints;
        const subConstraints = nestedConstraints[subtypeFilters];
        if (!isConstraints(subConstraints)) {
            Logger.tag("validation", "rest").error(
                "Unknown REST resource subtype: {}",
                subtype
            );
            throw { data: "Internal error.", type: ErrorTypes.internalError };
        }
        filterConstraints = subConstraints;
    }

    const data = getData(req);

    const restParams = getConstrainedValues(data, constraints);
    const filterParams = getConstrainedValues(data, filterConstraints);

    const areValidParams = forConstraints(constraints, false);
    const areValidFilters = forConstraints(filterConstraints, false);
    if (!areValidParams(restParams) || !areValidFilters(filterParams)) {
        throw { data: "Invalid REST parameters.", type: ErrorTypes.badRequest };
    }

    restParams.filters = filterParams;
    return restParams as RestParams;
}

export function filter<E>(
    entities: E[],
    allowedFilterFields: string[],
    restParams: RestParams
): E[] {
    let query = restParams.q;
    if (query) {
        query = query.trim().toLowerCase();
    }

    function queryMatches(entity: E): boolean {
        if (!query) {
            return true;
        }
        return allowedFilterFields.some((field: string): boolean => {
            if (!query) {
                return true;
            }
            let value = getFieldIfExists(entity, field);
            if (isNumber(value)) {
                value = value.toString();
            }

            if (!isString(value) || _.isEmpty(value)) {
                return false;
            }

            const lowerCaseValue = value.toLowerCase();
            if (field === "mac") {
                return _.includes(
                    lowerCaseValue.replace(/:/g, ""),
                    query.replace(/:/g, "")
                );
            }

            return _.includes(lowerCaseValue, query);
        });
    }

    const filters = restParams.filters;

    function filtersMatch(entity: E): boolean {
        if (isUndefined(filters) || _.isEmpty(filters)) {
            return true;
        }

        return Object.entries(filters).every(([key, value]) => {
            if (isUndefined(value)) {
                return true;
            }
            if (key.startsWith("has")) {
                const entityKey =
                    key.substring(3, 4).toLowerCase() + key.substring(4);
                return (
                    _.isEmpty(
                        getFieldIfExists(entity, entityKey)
                    ).toString() !== value
                );
            }
            return getFieldIfExists(entity, key) === value;
        });
    }

    return entities.filter(
        (entity) => queryMatches(entity) && filtersMatch(entity)
    );
}

export function sort<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Type extends { [Key in SortField]: any },
    SortField extends string
>(
    entities: Type[],
    isSortField: TypeGuard<SortField>,
    restParams: RestParams
): Type[] {
    const sortField: SortField | undefined = isSortField(restParams._sortField)
        ? restParams._sortField
        : undefined;
    if (!sortField) {
        return entities;
    }

    const sorted = entities.slice(0);
    sorted.sort((a, b) => {
        let as = a[sortField];
        let bs = b[sortField];

        if (isString(as)) {
            as = as.toLowerCase();
        }
        if (isString(bs)) {
            bs = bs.toLowerCase();
        }

        let order = 0;
        if (as < bs) {
            order = -1;
        } else if (as > bs) {
            order = 1;
        }

        return restParams._sortDir === SortDirection.DESCENDING
            ? -order
            : order;
    });

    return sorted;
}

export function getPageEntities<Entity>(
    entities: Entity[],
    restParams: RestParams
): Entity[] {
    const page = restParams._page;
    const perPage = restParams._perPage;

    return entities.slice((page - 1) * perPage, page * perPage);
}

export { filterCondition as whereCondition };

export function filterClause<S>(
    restParams: RestParams,
    defaultSortField: ValueOf<S>,
    isSortField: EnumTypeGuard<S>,
    filterFields: string[]
): FilterClause {
    const orderBy = orderByClause<S>(restParams, defaultSortField, isSortField);
    const limitOffset = limitOffsetClause(restParams);

    const filter = filterCondition(restParams, filterFields);

    return {
        query: filter.query + " " + orderBy.query + " " + limitOffset.query,
        params: [...filter.params, ...orderBy.params, ...limitOffset.params],
    };
}

export function success(res: Response, data: JSONValue) {
    respond(res, 200, data, "json");
}

export function successHtml(res: Response, html: string) {
    respond(res, 200, html, "html");
}

export function error(
    res: Response,
    err: { data: JSONValue; type: { code: number } }
) {
    respond(res, err.type.code, err.data, "json");
}

export function handleJSON<Response>(
    handler: () => Promise<Response>
): RequestHandler {
    return (request, response) => {
        handler()
            .then((data) => success(response, data || {}))
            .catch((e) => error(response, e));
    };
}

export function handleJSONWithData<Response>(
    handler: (data: RequestData) => Promise<Response>
): RequestHandler {
    return (request, response) => {
        handler(getData(request))
            .then((data) => success(response, data || {}))
            .catch((e) => error(response, e));
    };
}
