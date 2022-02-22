import { createRouter, createWebHistory } from "vue-router";
import AdminDashboardView from "@/views/AdminDashboardView.vue";
import HomeView from "@/views/HomeView.vue";

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
    ],
});

export default router;
