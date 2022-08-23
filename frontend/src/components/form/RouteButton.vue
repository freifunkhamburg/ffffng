<script setup lang="ts">
import type {ButtonSize, ComponentVariant} from "@/types";
import type {Route} from "@/router";
import router from "@/router";
import ActionButton from "@/components/form/ActionButton.vue";

interface Props {
    variant: ComponentVariant;
    size: ButtonSize;
    icon: string;
    route: Route;
}

const props = defineProps<Props>();

async function onClick() {
    await router.push(props.route);
}
</script>

<template>
    <ActionButton
        :variant="variant"
        :size="size"
        :icon="icon"
        @click="onClick"
    >
        <slot/>
    </ActionButton>
</template>

<style scoped lang="scss">
</style>
