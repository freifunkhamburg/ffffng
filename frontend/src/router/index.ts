import {
    createRouter,
    createWebHistory,
    type LocationQueryRaw,
} from "vue-router";
import AdminDashboardView from "@/views/AdminDashboardView.vue";
import AdminNodesView from "@/views/AdminNodesView.vue";
import HomeView from "@/views/HomeView.vue";
import NodeDeleteView from "@/views/NodeDeleteView.vue";
import {
    isNodesFilter,
    isNodeSortField,
    isSortDirection,
    type SearchTerm,
} from "@/types";

export interface Route {
    name: RouteName;
    query?: LocationQueryRaw;
}

export enum RouteName {
    HOME = "home",
    NODE_DELETE = "node-delete",
    ADMIN = "admin",
    ADMIN_NODES = "admin-nodes",
}

export function route(name: RouteName, query?: LocationQueryRaw): Route {
    return {
        name,
        query,
    };
}

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/",
            name: RouteName.HOME,
            component: HomeView,
        },
        {
            path: "/node/delete",
            name: RouteName.NODE_DELETE,
            component: NodeDeleteView,
        },
        {
            path: "/admin",
            name: RouteName.ADMIN,
            component: AdminDashboardView,
        },
        {
            path: "/admin/nodes",
            name: RouteName.ADMIN_NODES,
            component: AdminNodesView,
            props: (route) => {
                let filter: unknown;
                if (
                    Object.prototype.hasOwnProperty.call(route.query, "filter")
                ) {
                    try {
                        filter = JSON.parse(route.query.filter as string);
                    } catch (e) {
                        console.warn(e);
                        filter = {};
                    }
                } else {
                    filter = {};
                }

                const searchTerm = route.query.q
                    ? (route.query.q as SearchTerm)
                    : undefined;
                return {
                    filter: isNodesFilter(filter) ? filter : {},
                    searchTerm,
                    sortDirection: isSortDirection(route.query.sortDir)
                        ? route.query.sortDir
                        : undefined,
                    sortField: isNodeSortField(route.query.sortField)
                        ? route.query.sortField
                        : undefined,
                };
            },
        },
    ],
});

export default router;
