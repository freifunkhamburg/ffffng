import {SortDirection, toIsArray, type TypeGuard} from "@/types";
import type {Headers} from "request";
import {parseInteger} from "@/utils/Numbers";

type Method = "GET" | "PUT" | "POST" | "DELETE";

interface PagedListResult<T> {
    entries: T[];
    total: number;
}

interface ApiResponse<T> {
    result: T;
    headers: Headers;
}

class Api {
    private baseURL: string = import.meta.env.BASE_URL;
    private apiPrefix = "api/";

    constructor(apiPrefix?: string) {
        if (apiPrefix) {
            this.apiPrefix = apiPrefix;
        }
    }

    private toURL(path: string, queryParams?: object): string {
        let queryString = "";
        if (queryParams) {
            const queryStrings: string[] = [];
            for (const [key, value] of Object.entries(queryParams)) {
                queryStrings.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
            }
            if (queryStrings.length > 0) {
                queryString = `?${queryStrings.join("&")}`;
            }
        }
        return this.baseURL + this.apiPrefix + path + queryString;
    }

    private async sendRequest(method: Method, path: string, queryParams?: object): Promise<ApiResponse<undefined>>;
    private async sendRequest<T>(method: Method, path: string, isT: TypeGuard<T>, queryParams?: object): Promise<ApiResponse<T>>;
    private async sendRequest<T>(method: Method, path: string, isT?: TypeGuard<T>, queryParams?: object): Promise<ApiResponse<T>> {
        const url = this.toURL(path, queryParams);
        const response = await fetch(url, {
            method
        });

        if (!response.ok) {
            const body = await response.text();
            throw new Error(`API ${method} request failed: ${path} => ${response.status} - ${body}`);
        }

        if (isT) {
            const json = await response.json();
            if (isT && !isT(json)) {
                console.log(json);
                throw new Error(`API ${method} request result has wrong type. ${path} => ${json}`);
            }

            return {
                result: json,
                headers: response.headers,
            };
        } else {
            return {
                result: undefined as any as T,
                headers: response.headers,
            }
        }
    }

    private async doGet<T>(path: string, isT: TypeGuard<T>, queryParams?: object): Promise<ApiResponse<T>> {
        return await this.sendRequest<T>("GET", path, isT, queryParams);
    }

    async get<T>(path: string, isT: TypeGuard<T>): Promise<T> {
        const response = await this.doGet(path, isT);
        return response.result;
    }

    async getPagedList<Element, SortField>(
        path: string,
        isElement: TypeGuard<Element>,
        page: number,
        itemsPerPage: number,
        sortDirection?: SortDirection,
        sortField?: SortField,
        filter?: object,
    ): Promise<PagedListResult<Element>> {
        const response = await this.doGet(path, toIsArray(isElement), {
            _page: page,
            _perPage: itemsPerPage,
            _sortDir: sortDirection,
            _sortField: sortField,
            ...filter,
        });
        const totalStr = response.headers.get("x-total-count");
        const total = parseInteger(totalStr, 10);

        return {
            entries: response.result,
            total,
        }
    }

    async delete(path: string): Promise<void> {
        await this.sendRequest("DELETE", path);
    }
}

export const api = new Api();

class InternalApi extends Api {
    constructor() {
        super("internal/api/");
    }
}

export const internalApi = new InternalApi();
