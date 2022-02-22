<script setup lang="ts">
import {RouterLink, RouterView} from "vue-router";
import PageHeader from "@/components/PageHeader.vue";
import PageFooter from "@/components/PageFooter.vue";
</script>

<template>
    <PageHeader />

    <main>
        <RouterView />
    </main>

    <PageFooter />
</template>

<style lang="scss" scoped></style>
