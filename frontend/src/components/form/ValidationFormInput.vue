<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref } from "vue";
import { type Constraint, forConstraint } from "@/shared/validation/validator";
import ExpandableHelpBox from "@/components/ExpandableHelpBox.vue";

interface Props {
    modelValue?: string;
    label: string;
    type?: string;
    placeholder: string;
    constraint: Constraint;
    validationError: string;
    help?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
}>();

const displayLabel = computed(() =>
    props.constraint.optional ? props.label : `${props.label}*`
);

const input = ref<HTMLInputElement>();
const valid = ref(true);
const validated = ref(false);

function registerValidationComponent() {
    const instance = getCurrentInstance();
    let parent = instance?.parent;
    while (parent) {
        if (parent.exposed?.registerValidationComponent) {
            parent.exposed.registerValidationComponent(instance);
            return;
        }
        parent = parent.parent;
    }
    throw new Error(
        "Could not find matching ValidationForm for ValidationFormInpunt."
    );
}

function onInput() {
    if (validated.value) {
        validate();
    }
    const element = input.value;
    if (!element) {
        console.warn("Could not get referenced input element.");
        return;
    }
    emit("update:modelValue", element.value);
}

function validate(): boolean {
    const element = input.value;
    if (!element) {
        console.warn("Could not get referenced input element.");
        return false;
    }
    valid.value = forConstraint(props.constraint, false)(element.value);
    validated.value = true;
    return valid.value;
}

defineExpose({
    validate,
});

onMounted(() => {
    registerValidationComponent();
});
</script>

<template>
    <div class="validation-form-input">
        <label>
            {{ displayLabel }}:
            <ExpandableHelpBox v-if="props.help" :text="props.help" />
            <input
                ref="input"
                :value="props.modelValue"
                @input="onInput"
                :type="props.type || 'text'"
                :placeholder="props.placeholder"
            />
        </label>
        <div class="validation-error" v-if="!valid">
            {{ props.validationError }}
        </div>
    </div>
</template>

<style scoped lang="scss">
@import "../../scss/variables";

.validation-form-input {
    margin: $validation-form-input-margin;
}

label {
    display: block;
    font-weight: $label-font-weight;
    cursor: pointer;
}

input {
    box-sizing: border-box;
    width: 100%;
    margin: 0.25em 0;
}

.validation-error {
    color: $variant-color-danger;
    margin: 0.25em 0;
}
</style>
