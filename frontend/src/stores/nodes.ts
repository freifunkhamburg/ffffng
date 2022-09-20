import { defineStore } from "pinia";
import {
    type DomainSpecificNodeResponse,
    isDomainSpecificNodeResponse,
    type NodesFilter,
    NodeSortFieldEnum,
    type Path,
    SortDirection,
} from "@/types";
import { internalApi } from "@/utils/api";

interface NodesStoreState {
    nodes: DomainSpecificNodeResponse[];
    page: number;
    nodesPerPage: number;
    totalNodes: number;
    sortDirection: SortDirection;
    sortField: NodeSortFieldEnum;
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
            sortField: NodeSortFieldEnum.HOSTNAME,
        };
    },
    getters: {
        getNodes(state: NodesStoreState): DomainSpecificNodeResponse[] {
            return state.nodes;
        },

        getTotalNodes(state: NodesStoreState): number {
            return state.totalNodes;
        },

        getNodesPerPage(state: NodesStoreState): number {
            return state.nodesPerPage;
        },

        getPage(state: NodesStoreState): number {
            return state.page;
        },
    },
    actions: {
        async refresh(
            page: number,
            nodesPerPage: number,
            sortDirection: SortDirection,
            sortField: NodeSortFieldEnum,
            filter: NodesFilter,
            searchTerm?: string
        ): Promise<void> {
            const query: Record<string, unknown> = {
                ...filter,
            };
            if (searchTerm) {
                query.q = searchTerm;
            }
            const result = await internalApi.getPagedList<
                DomainSpecificNodeResponse,
                NodeSortFieldEnum
            >(
                "nodes" as Path,
                isDomainSpecificNodeResponse,
                page,
                nodesPerPage,
                sortDirection,
                sortField,
                query
            );
            this.nodes = result.entries;
            this.totalNodes = result.total;
            this.page = page;
            this.nodesPerPage = nodesPerPage;
        },
    },
});
