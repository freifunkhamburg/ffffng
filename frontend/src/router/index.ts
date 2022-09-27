import {
    createRouter,
    createWebHistory,
    type LocationQueryRaw,
    type RouteLocationNormalized,
    type RouteLocationRaw,
    type RouteRecordRaw,
    type RouteRecordRedirectOption,
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
import { useConfigStore } from "@/stores/config";

/**
 * Route to use for navigation.
 */
export interface Route {
    /**
     * Name of the route to navigate to.
     */
    name: RouteName;

    /**
     * Optional query parameters. This is a flat mapping from key to value. Nested values must be stringified already.
     */
    query?: LocationQueryRaw;
}

/**
 * Enum used to identify each route. Each field corresponds to `name` field of one of the routes below.
 */
export enum RouteName {
    HOME = "home",
    NODE_CREATE = "node-create",
    NODE_UPDATE = "node-update",
    NODE_DELETE = "node-delete",
    // MONITORING_CONFIRM = "monitoring-confirm",
    // MONITORING_DISABLE = "monitoring-disable",
    ADMIN = "admin",
    ADMIN_NODES = "admin-nodes",
}

/**
 * Helper function to construct a {@link Route} object for navigation.
 *
 * @param name - Name of the route to navigate to.
 * @param query - Optional query parameters. This is a flat mapping from key to value. Nested values must be
 *                stringified already.
 */
export function route(name: RouteName, query?: LocationQueryRaw): Route {
    return {
        name,
        query,
    };
}

/**
 * Helper function to get the query parameter `field` in a typesafe manner.
 *
 * @param route - The route object to get the query parameter from.
 * @param field - The name of the query parameter to get.
 * @param isT - Type guard to check the query parameter has the expected type `<T>`.
 * @returns The query parameter of type `<T>`. If the query parameter is not set or has an unexpected type `undefined`
 *          will be returned.
 */
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

/**
 * Helper function to get JSON from the query parameter `field` in a typesafe manner.
 *
 * @param route - The route object to get the query parameter from.
 * @param field - The name of the query parameter to get.
 * @param isT - Type guard to check the JSON for the query parameter has the expected type `<T>`.
 * @returns The query parameter of type `<T>`. If the query parameter is not set, the value cannot be parsed a JSON the
 *          JSON does not match the expected type `undefined` will be returned.
 */
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

/**
 * Helper type to make the compiler enforce setting a title for each route.
 */
type RouteWithTitle = RouteRecordRaw & {
    meta: {
        /**
         * Title to set for the HTML document for the route.
         */
        title: string;
    };
};

/**
 * All route definitions go here.
 */
const routes: RouteWithTitle[] = [
    {
        path: "/",
        name: RouteName.HOME,
        meta: {
            title: "Willkommen",
        },
        component: HomeView,
    },
    {
        path: "/node/create",
        name: RouteName.NODE_CREATE,
        meta: {
            title: "Neuen Knoten anmelden",
        },
        component: NodeCreateView,
        props: (route) => ({
            hostname: getQueryField(route, "hostname", isHostname),
            fastdKey: getQueryField(route, "key", isFastdKey),
            mac: getQueryField(route, "mac", isMAC),
        }),
    },
    // {
    //     path: "/node/update",
    //     name: RouteName.NODE_UPDATE,
    //     meta: {
    //         title: "Knotendaten ändern",
    //     },
    //     component: NodeUpdateView,
    // },
    {
        path: "/node/delete",
        name: RouteName.NODE_DELETE,
        meta: {
            title: "Knoten löschen",
        },
        component: NodeDeleteView,
    },
    // {
    //     path: "/monitoring/confirm",
    //     name: RouteName.MONITORING_CONFIRM,
    //     meta: {
    //         title: "Versand von Status-E-Mails bestätigen",
    //     },
    //     component: MonitoringConfirmView,
    // },
    // {
    //     path: "/monitoring/disable",
    //     name: RouteName.MONITORING_DISABLE,
    //     meta: {
    //         title: "Versand von Status-E-Mails deaktivieren",
    //     },
    //     component: MonitoringDisableView,
    // },
    {
        path: "/admin",
        name: RouteName.ADMIN,
        meta: {
            title: "Admin - Dashboard",
        },
        component: AdminDashboardView,
    },
    {
        path: "/admin/nodes",
        name: RouteName.ADMIN_NODES,
        meta: {
            title: "Admin - Knoten",
        },
        component: AdminNodesView,
        props: (route) => ({
            filter: getJSONQueryField(route, "filter", isNodesFilter) || {},
            searchTerm: getQueryField(route, "q", isSearchTerm),
            sortDirection: getQueryField(route, "sortDir", isSortDirection),
            sortField: getQueryField(route, "sortField", isNodeSortField),
        }),
    },
];

// TODO: Redirect legacy admin URLs.

/**
 * Redirects for routes from the old frontend.
 */
const legacyRedirects: { path: string; redirect: RouteRecordRedirectOption }[] =
    [
        {
            path: "/new",
            redirect: {
                name: RouteName.NODE_CREATE,
            },
        },
        {
            path: "/update",
            redirect: {
                name: RouteName.NODE_UPDATE,
            },
        },
        {
            path: "/delete",
            redirect: {
                name: RouteName.NODE_DELETE,
            },
        },
    ];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [...legacyRedirects, ...routes],
});

router.beforeResolve(redirectLegacyUrls);

/**
 * Navigation guard to make sure URLs of the old frontend of the form `/#/<path>?<query>` still work.
 * Those will be redirected to `/<path>?<query>`.
 *
 * @param to - The route that is being navigated to.
 * @returns New path to navigate to if a legacy URL is detected or `true` otherwise.
 */
function redirectLegacyUrls(
    to: RouteLocationNormalized
): RouteLocationRaw | boolean {
    if (to.fullPath.startsWith("/#/")) {
        // URL for the old frontend. Do a proper redirect.
        return to.fullPath.slice(2);
    }

    // Nothing to do.
    return true;
}

/**
 * Update the HTML documents title for the given route.
 *
 * @param route - Route to set the title for.
 */
function updateTitle(route: RouteLocationNormalized) {
    const baseTitle = `${
        useConfigStore().getConfig.community.name
    } - Knotenverwaltung`;

    let title: string;
    if (hasOwnProperty(route.meta, "title") && isString(route.meta.title)) {
        title = `${baseTitle} - ${route.meta.title}`;
    } else {
        console.error(`Missing title for route: ${route.path}`);
        title = baseTitle;
    }
    document.title = title;
}

/**
 * Initialize keeping the HTML document's title in sync with the current route.
 *
 * Note: This must be called after the config store is available.
 */
export function initTitleSync() {
    router.beforeEach(updateTitle);

    // Make sure the title is up-to-date after page load.
    updateTitle(router.currentRoute.value);
}

export default router;
