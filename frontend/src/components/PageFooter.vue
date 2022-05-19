<script setup lang="ts">
import { useConfigStore } from "@/stores/config";
import { useVersionStore } from "@/stores/version";

const config = useConfigStore();
const version = useVersionStore();

function refresh(): void {
    config.refresh();
    version.refresh();
}

refresh();
</script>

<template>
    <footer v-if="config.getConfig">
        ffffng ({{ version.getVersion }})
        <a href="https://github.com/freifunkhamburg/ffffng" target="_blank">Source Code</a>
        <a href="https://github.com/freifunkhamburg/ffffng/issues" target="_blank">Fehler melden</a>
        <a
            v-if="config.getConfig.legal.privacyUrl"
            :href="config.getConfig.legal.privacyUrl"
            target="_blank">Datenschutz</a>
        <a
            v-if="config.getConfig.legal.imprintUrl"
            :href="config.getConfig.legal.imprintUrl"
            target="_blank">Impressum</a>
    </footer>
</template>

<style lang="scss" scoped>
@import "../scss/variables";

footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
}
</style>
