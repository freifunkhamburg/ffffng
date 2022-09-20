import { defineStore } from "pinia";
import {
    type CreateOrUpdateNode,
    isNodeTokenResponse,
    isStoredNode,
    type Path,
    type StoredNode,
    type Token,
} from "@/types";
import { api } from "@/utils/api";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface NodeStoreState {}

export const useNodeStore = defineStore({
    id: "node",
    state(): NodeStoreState {
        return {};
    },
    getters: {},
    actions: {
        async create(node: CreateOrUpdateNode): Promise<StoredNode> {
            const response = await api.post(
                "node" as Path,
                isNodeTokenResponse,
                node
            );
            return response.node;
        },

        async fetchByToken(token: Token): Promise<StoredNode> {
            return await api.get(`node/${token}` as Path, isStoredNode);
        },

        async deleteByToken(token: Token): Promise<void> {
            await api.delete(`node/${token}` as Path);
        },
    },
});
