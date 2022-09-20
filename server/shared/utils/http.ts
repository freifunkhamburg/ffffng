/**
 * Enum representing supported HTTP methods.
 */
export enum HttpMethod {
    /**
     * See {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/GET}.
     */
    GET = "GET",

    /**
     * See {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/POST}.
     */
    POST = "POST",

    /**
     * See {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/PUT}.
     */
    PUT = "PUT",

    /**
     * See {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/DELETE}.
     */
    DELETE = "DELETE",
}

/**
 * Enum representing supported HTTP headers.
 */
export enum HttpHeader {
    /**
     * See {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type}.
     */
    CONTENT_TYPE = "Content-Type",

    /**
     * Holds the total number of entities known by the server matching the request (ignoring paging parameters).
     */
    X_TOTAL_COUNT = "X-Total-Count",
}

/**
 * Enum representing supported mime-types.
 */
export enum MimeType {
    /**
     * The content is JSON.
     */
    APPLICATION_JSON = "application/json",

    /**
     * The content is (X)HTML.
     */
    TEXT_HTML = "text/html",
}

/**
 * Enum representing supported HTTP response status codes.
 */
export enum HttpStatusCode {
    /**
     * See {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200}.
     */
    OK = 200,

    /**
     * See {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400}.
     */
    BAD_REQUEST = 400,

    /**
     * See {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404}.
     */
    NOT_FOUND = 404,

    /**
     * See {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/409}.
     */
    CONFLICT = 409,

    /**
     * See {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500}.
     */
    INTERNAL_SERVER_ERROR = 500,
}
