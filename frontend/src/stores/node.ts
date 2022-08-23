import { defineStore } from "pinia";
import { isStoredNode, type StoredNode, type Token } from "@/types";
import { api } from "@/utils/Api";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface NodeStoreState {}

export const useNodeStore = defineStore({
    id: "node",
    state(): NodeStoreState {
        return {};
    },
    getters: {},
    actions: {
        async fetchByToken(token: Token): Promise<StoredNode> {
            return await api.get(`node/${token}`, isStoredNode);
        },

        async deleteByToken(token: Token): Promise<void> {
            await api.delete(`node/${token}`);
        },
    },
});
