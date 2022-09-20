import { defineStore } from "pinia";
import { isObject, isVersion, type Path, type Version } from "@/types";
import { api } from "@/utils/api";

interface VersionResponse {
    version: Version;
}

function isVersionResponse(arg: unknown): arg is VersionResponse {
    return isObject(arg) && isVersion((arg as VersionResponse).version);
}

interface VersionStoreState {
    version: Version;
}

export const useVersionStore = defineStore({
    id: "version",
    state(): VersionStoreState {
        return {
            // Initialized in main.ts before mounting app.
            version: undefined as unknown as Version,
        };
    },
    getters: {
        getVersion(state: VersionStoreState): Version {
            return state.version;
        },
    },
    actions: {
        async refresh(): Promise<void> {
            const response = await api.get<VersionResponse>(
                "version" as Path,
                isVersionResponse
            );
            this.version = response.version;
        },
    },
});
