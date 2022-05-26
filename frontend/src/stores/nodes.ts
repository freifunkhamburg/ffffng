import {defineStore} from "pinia";
import {isEnhancedNodes, type EnhancedNode} from "@/types";
import {internalApi} from "@/utils/Api";

interface NodesStoreState {
    nodes: EnhancedNode[];
}

export const useNodesStore = defineStore({
    id: "nodes",
    state(): NodesStoreState {
        return {
            nodes: [],
        };
    },
    getters: {
        getNodes(state: NodesStoreState): EnhancedNode[] {
            return state.nodes;
        },
    },
    actions: {
        async refresh(): Promise<void> {
            this.nodes = await internalApi.get<EnhancedNode[]>(
                "nodes",
                isEnhancedNodes
            );
        },
    },
});
