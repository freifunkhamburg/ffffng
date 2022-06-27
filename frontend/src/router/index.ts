import {createRouter, createWebHistory} from "vue-router";
import AdminDashboardView from "@/views/AdminDashboardView.vue";
import AdminNodesView from "@/views/AdminNodesView.vue";
import HomeView from "@/views/HomeView.vue";
import {isNodesFilter, isNodeSortField, isSortDirection, type SearchTerm} from "@/types";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: "/",
            name: "home",
            component: HomeView,
        },
        {
            path: "/admin",
            name: "admin",
            component: AdminDashboardView,
        },
        {
            path: "/admin/nodes",
            name: "admin-nodes",
            component: AdminNodesView,
            props: route => {
                let filter: any;
                if (route.query.hasOwnProperty("filter")) {
                    try {
                        filter = JSON.parse(route.query.filter as string);
                    } catch (e) {
                        console.warn(e);
                        filter = {};
                    }
                } else {
                    filter = {};
                }

                const searchTerm = route.query.q ? route.query.q as SearchTerm : undefined;
                return {
                    filter: isNodesFilter(filter) ? filter : {},
                    searchTerm,
                    sortDirection: isSortDirection(route.query.sortDir) ? route.query.sortDir : undefined,
                    sortField: isNodeSortField(route.query.sortField) ? route.query.sortField : undefined,
                }
            }
        },
    ],
});

export default router;
