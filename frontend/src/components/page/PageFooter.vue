<script setup lang="ts">
import {useConfigStore} from "@/stores/config";
import {useVersionStore} from "@/stores/version";

const configStore = useConfigStore();
const versionStore = useVersionStore();
</script>

<template>
    <footer v-if="configStore.getConfig">
        ffffng ({{ versionStore.getVersion }})
        <a href="https://github.com/freifunkhamburg/ffffng" target="_blank">
            <i class="fa fa-code" aria-hidden="true" /> Source Code
        </a>
        <a href="https://github.com/freifunkhamburg/ffffng/issues" target="_blank">
            <i class="fa fa-bug" aria-hidden="true" /> Fehler melden
        </a>
        <a
            v-if="configStore.getConfig.legal.privacyUrl"
            :href="configStore.getConfig.legal.privacyUrl"
            target="_blank">Datenschutz</a>
        <a
            v-if="configStore.getConfig.legal.imprintUrl"
            :href="configStore.getConfig.legal.imprintUrl"
            target="_blank">Impressum</a>
    </footer>
</template>

<style lang="scss" scoped>
@use "sass:math";
@import "../../scss/variables";

footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;

    text-align: center;

    background-color: $nav-bar-background-color;
    padding: $nav-footer-padding;

    a {
        color: $nav-link-color;
        padding: 0 math.div($nav-link-spacing, 2);
    }
}
</style>
