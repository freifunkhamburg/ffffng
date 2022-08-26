<script setup lang="ts">
import { ref } from "vue";
import ExpandableHelpBox from "@/components/ExpandableHelpBox.vue";

interface Props {
    name: string;
    modelValue?: boolean;
    label: string;
    help?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
}>();

const input = ref<HTMLInputElement>();
const focussed = ref(false);

function onChange() {
    const element = input.value;
    if (!element) {
        console.warn("Could not get referenced input element.");
        return;
    }
    emit("update:modelValue", element.checked);
}

function onFocus() {
    focussed.value = true;
}

function onBlur() {
    focussed.value = false;
}
</script>

<template>
    <div
        :class="{
            'checkbox-input': true,
            checked: modelValue,
            focussed,
        }"
    >
        <label>
            <input
                ref="input"
                type="checkbox"
                :name="props.name"
                :checked="props.modelValue"
                @change="onChange"
                @focus="onFocus"
                @blur="onBlur"
            />
            {{ props.label }}
            <ExpandableHelpBox v-if="props.help" :text="props.help" />
        </label>
    </div>
</template>

<style scoped lang="scss">
@import "../../scss/variables";

.checkbox-input {
    margin: $validation-form-input-margin;
}

input {
    // hide the default checkbox and then rebuild a new one via label::before
    z-index: -1;

    position: absolute;

    margin: 0;
    padding: 0;

    width: 0;
    height: 0;

    opacity: 0;

    border: none;
    box-shadow: none;
}

label {
    position: relative;
    clear: both;

    display: block;
    width: 100%;
    font-weight: $label-font-weight;
    cursor: pointer;

    &::before {
        float: left;

        display: block;
        vertical-align: top;

        content: "";

        margin: $checkbox-margin;

        width: $checkbox-size;
        height: $checkbox-size;

        background-color: $input-background-color;
        border-radius: $checkbox-border-radius;

        cursor: pointer;
    }

    .checked &::before {
        // TODO: Fallback if font does not load?
        content: "\f00c";

        //noinspection CssNoGenericFontName
        font-family: ForkAwesome;

        text-align: center;
        line-height: $checkbox-size;

        font-weight: bold;

        color: $input-text-color;
    }

    .focussed &::before {
        outline: $input-outline;
        outline-offset: $input-outline-offset;
    }
}
</style>
