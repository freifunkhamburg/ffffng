<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref } from "vue";
import { type Constraint, forConstraint } from "@/shared/validation/validator";
import ExpandableHelpBox from "@/components/ExpandableHelpBox.vue";

type InputType = "text" | "number" | "password" | "email" | "tel" | "url";

interface Props {
    name: string;
    modelValue?: string;
    label?: string;
    type?: InputType;
    placeholder: string;
    constraint: Constraint;
    validationError: string;
    resetIconTitle?: string;
    help?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
}>();

const displayLabel = computed(() =>
    props.label
        ? props.constraint.optional
            ? `${props.label}:`
            : `${props.label}*:`
        : undefined
);

const label = ref<HTMLInputElement>();
const input = ref<HTMLInputElement>();
const valid = ref(true);
const validated = ref(false);

const hasResetIcon = computed(
    () => !!(props.modelValue && props.resetIconTitle)
);

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

function withInputElement(callback: (element: HTMLInputElement) => void): void {
    const element = input.value;
    if (!element) {
        console.warn("Could not get referenced input element.");
        return;
    }

    callback(element);
}

function onInput() {
    if (validated.value) {
        validate();
    }
    withInputElement((element) => {
        emit("update:modelValue", element.value);
    });
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

function reset() {
    withInputElement((element) => {
        element.value = "";
        onInput();
    });
}

function focus() {
    label.value?.scrollIntoView();
    input.value?.focus();
}

defineExpose({
    focus,
    validate,
});

onMounted(() => {
    registerValidationComponent();
});
</script>

<template>
    <div class="validation-form-input">
        <label ref="label">
            {{ displayLabel }}
            <ExpandableHelpBox v-if="props.help" :text="props.help" />

            <span class="input-wrapper">
                <input
                    ref="input"
                    :class="{ 'has-reset-icon': hasResetIcon }"
                    :name="props.name"
                    :value="props.modelValue"
                    @input="onInput"
                    :type="props.type || 'text'"
                    :placeholder="props.placeholder"
                />
                <i
                    v-if="hasResetIcon"
                    class="fa fa-times reset-icon"
                    aria-hidden="true"
                    :title="props.resetIconTitle"
                    @click.prevent="reset"
                />
            </span>
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
    position: relative;
    display: block;
    font-weight: $label-font-weight;
    cursor: pointer;
}

.input-wrapper {
    display: flex;
    align-items: center;

    input {
        box-sizing: border-box;
        width: 100%;
        margin: 0.25em 0;

        &.has-reset-icon {
            padding-right: $input-with-reset-icon-padding-right;
        }
    }

    .reset-icon {
        cursor: pointer;
        width: 0; // Allow input to really take up 100% width within flexbox.

        margin-left: -$input-reset-icon-position-right;

        font-size: $input-font-size;
        color: $input-reset-icon-color;
    }
}

.validation-error {
    color: $variant-color-danger;
    margin: 0.25em 0;
}
</style>
