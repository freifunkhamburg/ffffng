import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import { useConfigStore } from "@/stores/config";
import { useVersionStore } from "@/stores/version";

const app = createApp(App);

app.use(createPinia());
app.use(router);

useConfigStore()
    .refresh()
    .catch((err) => console.error(err));
useVersionStore()
    .refresh()
    .catch((err) => console.error(err));

app.mount("#app");
