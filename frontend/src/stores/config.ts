import { defineStore } from "pinia";
import { type ClientConfig, isClientConfig, type Path } from "@/types";
import { api } from "@/utils/api";

interface ConfigStoreState {
    config: ClientConfig;
}

export const useConfigStore = defineStore({
    id: "config",
    state(): ConfigStoreState {
        return {
            // Initialized in main.ts before mounting app.
            config: undefined as unknown as ClientConfig,
        };
    },
    getters: {
        getConfig(state: ConfigStoreState): ClientConfig {
            return state.config;
        },
    },
    actions: {
        async refresh(): Promise<void> {
            this.config = await api.get<ClientConfig>(
                "config" as Path,
                isClientConfig
            );
        },
    },
});
