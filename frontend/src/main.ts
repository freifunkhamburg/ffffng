import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import { useConfigStore } from "@/stores/config";
import { useVersionStore } from "@/stores/version";

async function main() {
    const app = createApp(App);

    app.use(createPinia());
    app.use(router);

    const configLoaded = useConfigStore().refresh();
    const versionLoaded = useVersionStore().refresh();

    await configLoaded;
    await versionLoaded;

    app.mount("#app");
}

main().catch((error) => console.error("Unhandled error:", error));
