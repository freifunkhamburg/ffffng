<script setup lang="ts">
import type { StoredNode } from "@/types";
import { MonitoringState } from "@/types";

interface Props {
    node: StoredNode;
}

const props = defineProps<Props>();
</script>

<template>
    <div class="node-preview-card">
        <h3>
            <i
                class="fa fa-dot-circle-o"
                aria-hidden="true"
                title="Knotenname:"
            />
            {{ props.node.hostname }}
        </h3>

        <div class="field">
            <strong>Token: </strong>
            <code>{{ props.node.token }}</code>
        </div>

        <div class="field">
            <i class="fa fa-map-marker" aria-hidden="true" title="Standort:" />
            {{ props.node.coords || "nicht angegeben" }}
        </div>

        <div class="field">
            <strong>MAC-Adresse: </strong>
            <code>{{ props.node.mac }}</code>
        </div>

        <div class="field">
            <strong>VPN-Schlüssel: </strong>
            <code>{{ props.node.key || "nicht angegeben" }}</code>
        </div>

        <div class="field">
            <strong>Monitoring: </strong>
            <span v-if="props.node.monitoringState === MonitoringState.PENDING">
                Bestätigung ausstehend
            </span>
            <span v-if="props.node.monitoringState === MonitoringState.ACTIVE">
                aktiv
            </span>
            <span
                v-if="props.node.monitoringState === MonitoringState.DISABLED"
            >
                nicht aktiv
            </span>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "../../scss/variables";

.node-preview-card {
    display: flex;
    flex-direction: column;
    align-items: center;

    padding: $node-preview-card-padding;

    border: $node-preview-card-border;
    border-radius: $node-preview-card-border-radius;

    h3 {
        font-size: $node-preview-card-headline-font-size;
        margin: $node-preview-card-headline-margin;
        text-align: center;
    }

    .field {
        margin: $node-preview-card-field-margin;
        max-width: 100%;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
    }

    code {
        font-size: $node-preview-card-field-code-font-size;
    }
}
</style>
