import {defineStore} from "pinia";
import {isEnhancedNode, type EnhancedNode} from "@/types";
import {internalApi} from "@/utils/Api";

interface NodesStoreState {
    nodes: EnhancedNode[];
    totalNodes: number;
}

export const useNodesStore = defineStore({
    id: "nodes",
    state(): NodesStoreState {
        return {
            nodes: [],
            totalNodes: 0,
        };
    },
    getters: {
        getNodes(state: NodesStoreState): EnhancedNode[] {
            return state.nodes;
        },

        getTotalNodes(state: NodesStoreState): number {
            return state.totalNodes;
        }
    },
    actions: {
        async refresh(): Promise<void> {
            const result = await internalApi.getPagedList<EnhancedNode>(
                "nodes",
                isEnhancedNode
            );
            this.nodes = result.entries;
            this.totalNodes = result.total;
        },
    },
});
