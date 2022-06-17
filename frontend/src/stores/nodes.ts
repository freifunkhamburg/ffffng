import {defineStore} from "pinia";
import {type EnhancedNode, isEnhancedNode, type NodesFilter} from "@/types";
import {internalApi} from "@/utils/Api";

interface NodesStoreState {
    nodes: EnhancedNode[];
    page: number;
    nodesPerPage: number;
    totalNodes: number;
}

export const useNodesStore = defineStore({
    id: "nodes",
    state(): NodesStoreState {
        return {
            nodes: [],
            page: 1,
            nodesPerPage: 20,
            totalNodes: 0,
        };
    },
    getters: {
        getNodes(state: NodesStoreState): EnhancedNode[] {
            return state.nodes;
        },

        getTotalNodes(state: NodesStoreState): number {
            return state.totalNodes;
        },

        getNodesPerPage(state: NodesStoreState): number {
            return state.nodesPerPage
        },

        getPage(state: NodesStoreState): number {
            return state.page
        },
    },
    actions: {
        async refresh(page: number, nodesPerPage: number, filter: NodesFilter, searchTerm?: string): Promise<void> {
            const query: Record<string, any> = {
                ...filter,
            };
            if (searchTerm) {
                query.q = searchTerm;
            }
            const result = await internalApi.getPagedList<EnhancedNode>(
                "nodes",
                isEnhancedNode,
                page,
                nodesPerPage,
                query,
            );
            this.nodes = result.entries;
            this.totalNodes = result.total;
            this.page = page;
            this.nodesPerPage = nodesPerPage;
        },
    },
});
