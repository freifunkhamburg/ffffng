<script setup lang="ts">
import { useConfigStore } from "@/stores/config";

const config = useConfigStore();

function refresh(): void {
    config.refresh();
}

refresh();
</script>

<template>
    <header v-if="config.getConfig">
        <nav>
            <RouterLink to="/">
                <img src="icon.svg" alt="Symbol: Gelbes Zahnrad in zwei konzentrischen Kreisen (hellgrau und magenta)"/>
                {{ config.getConfig.community.name }} – Knotenverwaltung
            </RouterLink>
            <RouterLink to="/admin">Admin-Panel</RouterLink>
        </nav>
    </header>
</template>

<style lang="scss" scoped>
@import "../scss/variables";

header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;

    img {
        width: 2em;
        height: 2em;
    }
}
</style>
