<script setup lang="ts">
import ValidationFormInput from "@/components/form/ValidationFormInput.vue";
import type { Coordinates } from "@/types";
import { useConfigStore } from "@/stores/config";
import CONSTRAINTS from "@/shared/validation/constraints";
import NodeMap from "@/components/NodeMap.vue";

interface Props {
    modelValue?: Coordinates;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    (e: "update:modelValue", value: Coordinates): void;
}>();

const configStore = useConfigStore();

function onUpdateModelValue(value: string) {
    emit("update:modelValue", value as Coordinates);
}
</script>

<template>
    <div class="node-coordinates-input">
        <div class="input-panel">
            <p class="help-block">
                Wenn Du möchtest, dass Dein Knoten an der richtigen Stelle auf
                der
                <a :href="configStore.getConfig.map.mapUrl" target="_blank"
                    >Knotenkarte</a
                >
                angezeigt wird, kannst Du seine Koordinaten hier eintragen.
                Klicke einfach in der auf dieser Seite angezeigten Karte an die
                Stelle, wo Dein Knoten erscheinen soll. Durch erneutes Klicken
                kannst Du die Position jederzeit anpassen.
            </p>

            <ValidationFormInput
                name="coords"
                :model-value="props.modelValue"
                @update:modelValue="onUpdateModelValue"
                :placeholder="`z. B. ${configStore.getConfig.coordsSelector.lat} ${configStore.getConfig.coordsSelector.lng}`"
                :constraint="CONSTRAINTS.node.coords"
                :validation-error="`Bitte gib die Koordinaten wie folgt an, Beispiel: ${configStore.getConfig.coordsSelector.lat} ${configStore.getConfig.coordsSelector.lng}`"
            />
        </div>

        <div class="node-map">
            <NodeMap
                @coordinatesSelected="onUpdateModelValue"
                :coordinates="props.modelValue"
                :editable="true"
            />
        </div>
    </div>
</template>

<style lang="scss">
@import "../../scss/variables";
@import "../../scss/mixins";

.node-coordinates-input {
    display: flex;
    align-items: flex-start;
    margin: $node-coordinates-input-margin;

    .help-block {
        margin-top: 0;
    }

    .input-panel {
        width: $node-coordinates-input-input-panel-width;
    }

    .node-map {
        margin-left: $node-coordinates-input-horizontal-gap;
        width: 100%;
    }
}

@include max-page-breakpoint(small) {
    .node-coordinates-input {
        flex-direction: column;

        .input-panel {
            width: 100%;
        }

        .node-map {
            margin: 0;
        }
    }
}
</style>
