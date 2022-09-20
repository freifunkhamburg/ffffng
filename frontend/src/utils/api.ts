/**
 * Utility classes for interacting with the servers REST-API.
 */
import {
    hasOwnProperty,
    isPlainObject,
    isString,
    type JSONValue,
    type Path,
    SortDirection,
    toIsArray,
    type TypeGuard,
    type Url,
} from "@/types";
import type { Headers } from "request";
import { parseToInteger } from "@/shared/utils/numbers";
import {
    HttpHeader,
    HttpMethod,
    HttpStatusCode,
    MimeType,
} from "@/shared/utils/http";

/**
 * Enum to distinguish different API errors.
 */
enum ApiErrorType {
    /**
     * The HTTP request failed.
     */
    REQUEST_FAILED = "request_failed",

    /**
     * The HTTP response body was no valid JSON.
     */
    MALFORMED_JSON = "malformed_json",

    /**
     * The HTTP request resulted in a response with an unexpected body payload.
     */
    UNEXPECTED_RESULT_TYPE = "unexpected_result_type",
}

/**
 * An error thrown when interacting with the REST-API fails in some way.
 *
 * You can use the different `is*`-Methods to distinguish between different error types.
 */
export class ApiError extends Error {
    private constructor(
        message: string,
        private status: HttpStatusCode,
        private errorType: ApiErrorType,
        private body: JSONValue
    ) {
        super(message);
    }

    /**
     * Creates an {@link ApiError} in case the HTTP request fails.
     *
     * @param method - The HTTP method used in the request.
     * @param url - The URL used in the HTTP request.
     * @param response - The response object as provided by the `fetch`-API.
     */
    static async requestFailed(
        method: HttpMethod,
        url: Url,
        response: Response
    ): Promise<ApiError> {
        const body: JSONValue =
            response.headers.get(HttpHeader.CONTENT_TYPE) ===
            MimeType.APPLICATION_JSON
                ? await response.json()
                : await response.text();

        return new ApiError(
            `API ${method} request failed: ${url} => ${
                response.status
            } - ${JSON.stringify(body)}`,
            response.status,
            ApiErrorType.REQUEST_FAILED,
            body
        );
    }

    static async malformedJSON(
        method: HttpMethod,
        url: Url,
        response: Response,
        error: unknown
    ): Promise<ApiError> {
        const errorMsg = hasOwnProperty(error, "message")
            ? `${error.message}`
            : `${error}`;
        const body = await response.text();
        return new ApiError(
            `API ${method} request returned malformed JSON: ${url} => ${response.status} - ${errorMsg} - ${body}`,
            response.status,
            ApiErrorType.MALFORMED_JSON,
            body
        );
    }

    /**
     * Creates an {@link ApiError} in case the HTTP request is successful but the responses body payload has an
     * unexpected type.
     *
     * @param method - The HTTP method used in the request.
     * @param url - The URL used in the HTTP request.
     * @param response - The response object as provided by the `fetch`-API.
     * @param json - The JSON body from the response.
     */
    static async unexpectedResultType(
        method: HttpMethod,
        url: Url,
        response: Response,
        json: JSONValue
    ): Promise<ApiError> {
        return new ApiError(
            `API ${method} request result has unexpected type. ${url} => ${JSON.stringify(
                json
            )}`,
            response.status,
            ApiErrorType.UNEXPECTED_RESULT_TYPE,
            json
        );
    }

    /**
     * `true` if the request failed with {@link HttpStatusCode.NOT_FOUND}.
     */
    isNotFoundError(): boolean {
        return (
            this.errorType === ApiErrorType.REQUEST_FAILED &&
            this.status === HttpStatusCode.NOT_FOUND
        );
    }

    /**
     * `true` if the request failed with {@link HttpStatusCode.CONFLICT}.
     */
    isConflict(): boolean {
        return (
            this.errorType === ApiErrorType.REQUEST_FAILED &&
            this.status === HttpStatusCode.CONFLICT
        );
    }

    /**
     * In case of a failed request {@link HttpStatusCode.CONFLICT} this method returns the conflicting field if any.
     */
    getConflictField(): string | undefined {
        if (
            !this.isConflict() ||
            !isPlainObject(this.body) ||
            !hasOwnProperty(this.body, "field") ||
            !isString(this.body.field)
        ) {
            return undefined;
        }

        return this.body.field;
    }
}

/**
 * Result of paged GET request against the REST-API.
 *
 * See {@link Api.getPagedList}.
 */
export interface ApiPagedListResult<T> {
    /**
     * Array of entries for the requested page.
     */
    entries: T[];

    /**
     * Total number of entities known by the server for the specified filters (ignoring paging).
     */
    total: number;
}

/**
 * Response of an REST-API request including the responses HTTP headers.
 */
interface ApiResponse<T> {
    /**
     * Parsed response body.
     */
    result: T;

    /**
     * Response header of the HTTP request.
     */
    headers: Headers;
}

/**
 * Helper class to make type-safe HTTP requests against the servers REST-API.
 */
class Api {
    /**
     * Base URL of the server to make REST-API calls agains.
     * @private
     */
    private baseURL: Url = import.meta.env.BASE_URL as Url;

    /**
     * Prefix to prepend to the path for each request.
     * @private
     */
    private apiPrefix: Path;

    /**
     * Creates an {@link Api} object for REST-API requests beneath the given path prefix.
     *
     * @param apiPrefix - Prefix to prepend to the path for each request.
     */
    constructor(apiPrefix?: Path) {
        this.apiPrefix = apiPrefix || ("api/" as Path);
    }

    /**
     * Constructs a {@link Url} form the specified path and query parameters. The path is considered to be beneath
     * {@link Api.apiPrefix}.
     *
     * @param path - Path of the REST-API resource.
     * @param queryParams - Optional query parameters to include in the URL.
     * @returns The complete URL.
     *
     * @private
     */
    private toURL(path: Path, queryParams?: object): Url {
        let queryString = "";
        if (queryParams) {
            const queryStrings: string[] = [];
            for (const [key, value] of Object.entries(queryParams)) {
                queryStrings.push(
                    `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
                );
            }
            if (queryStrings.length > 0) {
                queryString = `?${queryStrings.join("&")}`;
            }
        }
        return (this.baseURL + this.apiPrefix + path + queryString) as Url;
    }

    /**
     * Gets the JSON payload from the response's body.
     *
     * @param method - The HTTP method used in the request.
     * @param url - The URL used in the HTTP request.
     * @param response - The response object as provided by the `fetch`-API.
     * @returns The JSON payload.
     * @throws {@link ApiError} in case the body cannot be parsed to be valid JSON.
     *
     * @private
     */
    private async getJSONFromResponse(
        method: HttpMethod,
        url: Url,
        response: Response
    ): Promise<JSONValue> {
        try {
            return await response.json();
        } catch (error) {
            throw await ApiError.malformedJSON(method, url, response, error);
        }
    }

    /**
     * Perform a typesafe HTTP request against the servers REST-API. Makes sure the response body type matches `<T>`.
     *
     * @param method - The HTTP method to be used in the request.
     * @param path - The path of the REST-API resource to make request agains.
     * @param isT - Optional {@link TypeGuard} to check the payload in the response body has the expected type `<T>`.
     * @param bodyData - JSON data to be sent in the request body.
     * @param queryParams - Optional query parameters for the URL used in the request.
     * @returns The typesafe payload in the response body together with the responses HTTP headers.
     *
     * @throws {@link ApiError} in case the request fails or the response body is malformed or has an unexpected type.
     *
     * @private
     */
    private async sendRequest<T>(
        method: HttpMethod,
        path: Path,
        isT?: TypeGuard<T>,
        bodyData?: object,
        queryParams?: object
    ): Promise<ApiResponse<T>> {
        const url = this.toURL(path, queryParams);
        const options: RequestInit = {
            method,
        };
        if (bodyData) {
            options.body = JSON.stringify(bodyData);
            options.headers = {
                [HttpHeader.CONTENT_TYPE]: MimeType.APPLICATION_JSON,
            };
        }
        const response = await fetch(url, options);

        if (!response.ok) {
            throw await ApiError.requestFailed(method, url, response);
        }

        if (isT) {
            const json = await this.getJSONFromResponse(method, url, response);
            if (!isT(json)) {
                console.log(json);
                throw await ApiError.unexpectedResultType(
                    method,
                    url,
                    response,
                    json
                );
            }

            return {
                result: json,
                headers: response.headers,
            };
        } else {
            return {
                result: undefined as unknown as T,
                headers: response.headers,
            };
        }
    }

    /**
     * Perform a typesafe HTTP POST request against the servers REST-API. Makes sure the response body type
     * matches `<T>`.
     *
     * @param path - The path of the REST-API resource to make request agains.
     * @param isT - {@link TypeGuard} to check the payload in the response body has the expected type `<T>`.
     * @param postData - JSON data to be posted in the request body.
     * @param queryParams - Optional query parameters for the URL used in the request.
     * @returns The typesafe payload in the response body.
     *
     * @throws {@link ApiError} in case the request fails or the response body is malformed or has an unexpected type.
     *
     * @private
     */
    async post<T>(
        path: Path,
        isT: TypeGuard<T>,
        postData: object,
        queryParams?: object
    ): Promise<T> {
        const response = await this.sendRequest<T>(
            HttpMethod.POST,
            path,
            isT,
            postData,
            queryParams
        );
        return response.result;
    }

    /**
     * Perform a typesafe HTTP PUT request against the servers REST-API. Makes sure the response body type
     * matches `<T>`.
     *
     * @param path - The path of the REST-API resource to make request agains.
     * @param isT - {@link TypeGuard} to check the payload in the response body has the expected type `<T>`.
     * @param putData - JSON data to be put in the request body.
     * @param queryParams - Optional query parameters for the URL used in the request.
     * @returns The typesafe payload in the response body.
     *
     * @throws {@link ApiError} in case the request fails or the response body is malformed or has an unexpected type.
     *
     * @private
     */
    async put<T>(
        path: Path,
        isT: TypeGuard<T>,
        putData: object,
        queryParams?: object
    ): Promise<T> {
        const response = await this.sendRequest<T>(
            HttpMethod.PUT,
            path,
            isT,
            putData,
            queryParams
        );
        return response.result;
    }

    /**
     * Perform a typesafe HTTP GET request against the servers REST-API. Makes sure the response body type
     * matches `<T>`.
     *
     * @param path - The path of the REST-API resource to make request agains.
     * @param isT - {@link TypeGuard} to check the payload in the response body has the expected type `<T>`.
     * @param queryParams - Optional query parameters for the URL used in the request.
     * @returns The typesafe payload in the response body together with the responses HTTP headers.
     *
     * @throws {@link ApiError} in case the request fails or the response body is malformed or has an unexpected type.
     *
     * @private
     */
    private async doGet<T>(
        path: Path,
        isT: TypeGuard<T>,
        queryParams?: object
    ): Promise<ApiResponse<T>> {
        return await this.sendRequest<T>(
            HttpMethod.GET,
            path,
            isT,
            undefined,
            queryParams
        );
    }

    /**
     * Perform a typesafe HTTP GET request against the servers REST-API. Makes sure the response body type
     * matches `<T>`.
     *
     * @param path - The path of the REST-API resource to make request agains.
     * @param isT - {@link TypeGuard} to check the payload in the response body has the expected type `<T>`.
     * @param queryParams - Optional query parameters for the URL used in the request.
     * @returns The typesafe payload in the response body.
     *
     * @throws {@link ApiError} in case the request fails or the response body is malformed or has an unexpected type.
     *
     * @private
     */
    async get<T>(
        path: Path,
        isT: TypeGuard<T>,
        queryParams?: object
    ): Promise<T> {
        const response = await this.doGet(path, isT, queryParams);
        return response.result;
    }

    /**
     * Perform a typesafe HTTP GET request against the servers REST-API to get a paged list of items.
     *
     * @param path - The path of the REST-API resource to make request agains.
     * @param isElement - {@link TypeGuard} to check the payload in the response body has the expected type `<T>`.
     * @param page - Page number to query for. The first page has the number 1.
     * @param itemsPerPage - The number of items to get for each page.
     * @param sortDirection - Optional direction to sort the items in.
     * @param sortField - Optional field to sort the items by.
     * @param filter - Optional filters to filter items with.
     * @returns The typesafe array of entries in the response body along with the number of total items matching
     *          the given filters.
     *
     * @throws {@link ApiError} in case the request fails or the response body is malformed or has an unexpected type.
     *
     * @private
     */
    async getPagedList<Element, SortField>(
        path: Path,
        isElement: TypeGuard<Element>,
        page: number,
        itemsPerPage: number,
        sortDirection?: SortDirection,
        sortField?: SortField,
        filter?: object
    ): Promise<ApiPagedListResult<Element>> {
        const response = await this.doGet(path, toIsArray(isElement), {
            _page: page,
            _perPage: itemsPerPage,
            _sortDir: sortDirection,
            _sortField: sortField,
            ...filter,
        });
        const totalStr = response.headers.get(HttpHeader.X_TOTAL_COUNT);
        const total = parseToInteger(totalStr);

        return {
            entries: response.result,
            total,
        };
    }

    /**
     * Perform a typesafe HTTP DELETE request against the servers REST-API.
     *
     * @param path - The path of the REST-API resource to make request agains.
     *
     * @throws {@link ApiError} in case the request fails or the response body is malformed or has an unexpected type.
     *
     * @private
     */
    async delete(path: Path): Promise<void> {
        await this.sendRequest(HttpMethod.DELETE, path);
    }
}

/**
 * {@link Api} object to make REST-API calls against the servers public API.
 */
export const api = new Api();

/**
 * Helper class to make REST-API calls against the servers internal API.
 *
 * See {@link Api}.
 */
class InternalApi extends Api {
    constructor() {
        super("internal/api/" as Path);
    }
}

/**
 * {@link Api} object to make REST-API calls against the servers internal API.
 */
export const internalApi = new InternalApi();
