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

    async get<T>(path: string, isT: (arg: unknown) => arg is T): Promise<T> {
        const url = this.toURL(path);
        const result = await fetch(url);
        const json = await result.json();

        if (!isT(json)) {
            console.log(json);
            throw new Error(`API get result has wrong type. ${url} => ${json}`);
        }

        return json;
    }
}

export const api = new Api();

class InternalApi extends Api {
    constructor() {
        super("internal/api/");
    }
}

export const internalApi = new InternalApi();
