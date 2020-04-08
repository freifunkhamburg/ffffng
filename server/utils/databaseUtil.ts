import _ from "lodash";

export function inCondition<T>(field: string, list: T[]): {query: string, params: T[]} {
    return {
        query: '(' + field + ' IN (' + _.join(_.times(list.length, _.constant('?')), ', ') + '))',
        params: list,
    }
}
