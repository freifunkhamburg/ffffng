<script setup lang="ts">
import BaseCard from "@/components/BaseCard.vue";
import { ComponentVariant } from "@/types";
</script>

<template>
    <BaseCard
        :variant="ComponentVariant.INFO"
        icon="info-circle"
        :scrollIntoView="false"
    >
        <slot />
    </BaseCard>
</template>

<style lang="scss"></style>
