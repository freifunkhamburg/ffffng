import {defineStore} from "pinia";
import {type EnhancedNode, isEnhancedNode, type NodesFilter, NodeSortField, SortDirection} from "@/types";
import {internalApi} from "@/utils/Api";

interface NodesStoreState {
    nodes: EnhancedNode[];
    page: number;
    nodesPerPage: number;
    totalNodes: number;
    sortDirection: SortDirection;
    sortField: NodeSortField;
}

export const useNodesStore = defineStore({
    id: "nodes",
    state(): NodesStoreState {
        return {
            nodes: [],
            page: 1,
            nodesPerPage: 20,
            totalNodes: 0,
            sortDirection: SortDirection.ASCENDING,
            sortField: NodeSortField.HOSTNAME,
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
        async refresh(
            page: number,
            nodesPerPage: number,
            sortDirection: SortDirection,
            sortField: NodeSortField,
            filter: NodesFilter,
            searchTerm?: string
        ): Promise<void> {
            const query: Record<string, any> = {
                ...filter,
            };
            if (searchTerm) {
                query.q = searchTerm;
            }
            const result = await internalApi.getPagedList<EnhancedNode, NodeSortField>(
                "nodes",
                isEnhancedNode,
                page,
                nodesPerPage,
                sortDirection,
                sortField,
                query,
            );
            this.nodes = result.entries;
            this.totalNodes = result.total;
            this.page = page;
            this.nodesPerPage = nodesPerPage;
        },
    },
});
