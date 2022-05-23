<script setup lang="ts">
import {useConfigStore} from "@/stores/config";
import {useVersionStore} from "@/stores/version";

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
        <a href="https://github.com/freifunkhamburg/ffffng" target="_blank">
            <i class="fa fa-code" aria-hidden="true" /> Source Code
        </a>
        <a href="https://github.com/freifunkhamburg/ffffng/issues" target="_blank">
            <i class="fa fa-bug" aria-hidden="true" /> Fehler melden
        </a>
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
@use "sass:math";
@import "../../scss/variables";

footer {
    position: absolute;
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
