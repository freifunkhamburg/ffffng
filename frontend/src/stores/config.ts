import {defineStore} from "pinia";
import {type ClientConfig, isClientConfig} from "@/types";
import {api} from "@/utils/Api";

interface ConfigStoreState {
    config: ClientConfig | null;
}

export const useConfigStore = defineStore({
    id: "config",
    state(): ConfigStoreState {
        return {
            config: null,
        };
    },
    getters: {
        getConfig(state: ConfigStoreState): ClientConfig | null {
            return state.config;
        },
    },
    actions: {
        async refresh(): Promise<void> {
            this.config = await api.get<ClientConfig>(
                "config",
                isClientConfig
            );
        },
    },
});
