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
            <RouterLink class="logo" to="/">
                <!--suppress HtmlUnknownTarget -->
                <img
                    src="icon.svg"
                    alt="Symbol: Gelbes Zahnrad in zwei konzentrischen Kreisen (hellgrau und magenta)"
                    aria-hidden="true"
                />
            </RouterLink>

            <h1>
                <RouterLink to="/">
                    {{ config.getConfig.community.name }} – Knotenverwaltung
                </RouterLink>
            </h1>

            <RouterLink class="admin-link" to="/admin">
                <i class="fa fa-wrench" aria-hidden="true" /> Admin-Panel
            </RouterLink>
        </nav>
    </header>
</template>

<style lang="scss" scoped>
@import "../../scss/variables";

header {
    background-color: $nav-bar-background-color;
    padding: $nav-header-padding;

    * {
        vertical-align: middle;
    }

    .logo {
        padding: 0;

        img {
            width: $nav-header-logo-size;
            height: $nav-header-logo-size;

            margin: $nav-header-logo-margin;
        }
    }

    h1 {
        display: inline;
        margin: 0;
    }

    a {
        color: $nav-link-color;
        padding: 0 $nav-link-spacing 0 0;
    }

    a.admin-link {
        display: inline-block;
        padding: 0;
        line-height: 2em;
    }
}
</style>
