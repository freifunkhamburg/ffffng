<script setup lang="ts">
import { type ComponentInternalInstance, ref } from "vue";

const emit = defineEmits<{
    (e: "submit"): void;
}>();

const validationComponents = ref<ComponentInternalInstance[]>([]);

defineExpose({
    registerValidationComponent(component: ComponentInternalInstance): void {
        validationComponents.value.push(component);
    },
});

function validate(): boolean {
    let valid = true;
    for (const component of validationComponents.value) {
        if (!component.exposed?.validate) {
            throw new Error(
                `Component has no exposed validate() method: ${component.type.__name}`
            );
        }
        valid = component.exposed.validate() && valid;
    }

    return valid;
}

function onSubmit() {
    const valid = validate();
    if (valid) {
        emit("submit");
    } else {
        for (const component of validationComponents.value) {
            if (
                component.isMounted &&
                component.exposed?.validate &&
                component.exposed?.focus
            ) {
                if (!component.exposed.validate()) {
                    component.exposed.focus();
                    return;
                }
            }
        }
    }
}
</script>

<template>
    <form @submit.prevent="onSubmit">
        <slot />
    </form>
</template>

<style lang="scss"></style>
