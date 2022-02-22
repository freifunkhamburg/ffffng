<script setup lang="ts">
import { useVersionStore } from "@/stores/version";

const version = useVersionStore();

function refresh(): void {
    version.refresh();
}

refresh();
</script>

<template>
    <footer>
        {{ version.getVersion }}
    </footer>
</template>

<style lang="scss" scoped></style>
