import {fileURLToPath, URL} from "url";

import {defineConfig} from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [basicSsl(), vue()],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
    server: {
        https: true,
        port: 3000,
        strictPort: true,
        proxy: {
            "/api/": {
                target: "http://localhost:8080",
            },
            "/internal/api/": {
                target: "http://localhost:8080",
            },
        },
    },
});