import type {TypeGuard} from "@/types/shared";
import {toIsArray} from "@/types/shared";
import type {Headers} from "request";
import {parseInteger} from "@/utils/Numbers";

interface PagedListResult<T> {
    entries: T[];
    total: number;
}

interface Response<T> {
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

    private toURL(path: string): string {
        return this.baseURL + this.apiPrefix + path;
    }

    private async doGet<T>(path: string, isT: TypeGuard<T>): Promise<Response<T>> {
        const url = this.toURL(path);
        const result = await fetch(url);
        const json = await result.json();

        if (!isT(json)) {
            console.log(json);
            throw new Error(`API get result has wrong type. ${url} => ${json}`);
        }

        return {
            result: json,
            headers: result.headers,
        };
    }

    async get<T>(path: string, isT: TypeGuard<T>): Promise<T> {
        const response = await this.doGet(path, isT);
        return response.result;
    }

    async getPagedList<T>(path: string, isT: TypeGuard<T>): Promise<PagedListResult<T>> {
        const response = await this.doGet(path, toIsArray(isT));
        const totalStr = response.headers.get("x-total-count");
        const total = parseInteger(totalStr, 10);

        return {
            entries: response.result,
            total,
        }
    }
}

export const api = new Api();

class InternalApi extends Api {
    constructor() {
        super("internal/api/");
    }
}

export const internalApi = new InternalApi();
