<script setup lang="ts">
import ButtonGroup from "@/components/form/ButtonGroup.vue";
import type { StoredNode } from "@/types";
import { ButtonSize, ComponentAlignment, ComponentVariant } from "@/types";
import { useConfigStore } from "@/stores/config";
import { computed } from "vue";
import RouteButton from "@/components/form/RouteButton.vue";
import { route, RouteName } from "@/router";
import NodePreviewCard from "@/components/nodes/NodePreviewCard.vue";

const configStore = useConfigStore();
const email = computed(() => configStore.getConfig.community.contactEmail);
const mapUrl = computed(() => configStore.getConfig.map.mapUrl);

interface Props {
    node: StoredNode;
}

const props = defineProps<Props>();
</script>

<template>
    <div>
        <h2>Geschafft!</h2>
        <p>
            Dein Freifunk-Knoten ist erfolgreich angemeldet worden. Es kann
            jetzt noch bis zu 20 Minuten dauern, bis Dein Knoten funktioniert
            und in der
            <a :href="mapUrl" target="_blank">Knotenkarte</a> auftaucht.
        </p>

        <p>
            Du kannst die Daten Deines Knotens später selber ändern. Dazu
            benötigst Du das Token unten (16-stelliger Code).
        </p>

        <p class="token-hint">Notiere Dir bitte folgendes Token:</p>

        <div class="summary">
            <span class="token">
                <i class="fa fa-pencil"></i>
                {{ props.node.token }}
            </span>
        </div>

        <p>
            <strong>Hinweis:</strong>
            Sollte Dein Knoten länger als drei Monate offline sein, so wird
            dieser nach einer gewissen Zeit automatisch gelöscht. Du kannst
            Deinen Knoten selbstverständlich jederzeit neu anmelden.
        </p>

        <p>
            Bei Fragen wende Dich gerne an
            <a :href="`mailto:${email}`">{{ email }}</a
            >.
        </p>

        <NodePreviewCard class="preview" :node="props.node" />

        <ButtonGroup
            :align="ComponentAlignment.CENTER"
            :button-size="ButtonSize.MEDIUM"
        >
            <RouteButton
                icon="reply"
                :variant="ComponentVariant.SECONDARY"
                :size="ButtonSize.MEDIUM"
                :route="route(RouteName.HOME)"
            >
                Zurück zum Anfang
            </RouteButton>
        </ButtonGroup>
    </div>
</template>

<style lang="scss" scoped>
@import "../../scss/variables";

.summary {
    text-align: center;

    .token {
        display: inline-block;

        padding: $node-created-summary-padding;

        background-color: $node-created-summary-background-color;

        border: $node-created-summary-border;
        border-radius: $node-created-summary-border-radius;

        font-size: $node-created-summary-font-size;
    }
}

.preview {
    margin: {
        top: 1.5em;
        bottom: 1em;
    }
}
</style>
