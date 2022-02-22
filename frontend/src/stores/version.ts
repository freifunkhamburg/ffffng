import { defineStore } from "pinia";
import { isObject, isVersion, type Version } from "@/types";
import { api } from "@/utils/Api";

interface VersionResponse {
    version: Version;
}

function isVersionResponse(arg: unknown): arg is VersionResponse {
    return isObject(arg) && isVersion((arg as VersionResponse).version);
}

interface VersionStoreState {
    version: Version | null;
}

export const useVersionStore = defineStore({
    id: "version",
    state(): VersionStoreState {
        return {
            version: null,
        };
    },
    getters: {
        getVersion(state: VersionStoreState): Version | null {
            return state.version;
        },
    },
    actions: {
        async refresh(): Promise<void> {
            const response = await api.get<VersionResponse>(
                "version",
                isVersionResponse
            );
            this.version = response.version;
        },
    },
});
