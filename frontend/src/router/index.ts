import {
    createRouter,
    createWebHistory,
    type LocationQueryRaw,
    type RouteLocationNormalized,
} from "vue-router";
import AdminDashboardView from "@/views/AdminDashboardView.vue";
import AdminNodesView from "@/views/AdminNodesView.vue";
import HomeView from "@/views/HomeView.vue";
import NodeCreateView from "@/views/NodeCreateView.vue";
import NodeDeleteView from "@/views/NodeDeleteView.vue";
import {
    hasOwnProperty,
    isFastdKey,
    isHostname,
    isMAC,
    isNodesFilter,
    isNodeSortField,
    isSearchTerm,
    isSortDirection,
    isString,
    type JSONValue,
    type TypeGuard,
} from "@/types";
import { parseJSON } from "@/shared/utils/json";

export interface Route {
    name: RouteName;
    query?: LocationQueryRaw;
}

export enum RouteName {
    HOME = "home",
    NODE_CREATE = "node-create",
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

function getQueryField<T>(
    route: RouteLocationNormalized,
    field: string,
    isT: TypeGuard<T>
): T | undefined {
    if (!hasOwnProperty(route.query, field)) {
        return undefined;
    }
    const value = route.query[field];
    return isT(value) ? value : undefined;
}

function getJSONQueryField<T>(
    route: RouteLocationNormalized,
    field: string,
    isT: TypeGuard<T>
): T | undefined {
    const value = getQueryField(route, field, isString);
    if (!value) {
        return undefined;
    }

    let json: JSONValue;
    try {
        json = parseJSON(value);
    } catch (e) {
        console.warn(e);
        return undefined;
    }

    return isT(json) ? json : undefined;
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
            path: "/node/create",
            name: RouteName.NODE_CREATE,
            component: NodeCreateView,
            props: (route) => ({
                hostname: getQueryField(route, "hostname", isHostname),
                fastdKey: getQueryField(route, "key", isFastdKey),
                mac: getQueryField(route, "mac", isMAC),
            }),
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
            props: (route) => ({
                filter: getJSONQueryField(route, "filter", isNodesFilter) || {},
                searchTerm: getQueryField(route, "q", isSearchTerm),
                sortDirection: getQueryField(route, "sortDir", isSortDirection),
                sortField: getQueryField(route, "sortField", isNodeSortField),
            }),
        },
    ],
});

export default router;
