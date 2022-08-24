<script setup lang="ts">
import ButtonGroup from "@/components/form/ButtonGroup.vue";
import type { Hostname } from "@/types";
import { ButtonSize, ComponentAlignment, ComponentVariant } from "@/types";
import { useConfigStore } from "@/stores/config";
import { computed } from "vue";
import RouteButton from "@/components/form/RouteButton.vue";
import { route, RouteName } from "@/router";

const configStore = useConfigStore();
const email = computed(() => configStore.getConfig.community.contactEmail);
const mapUrl = computed(() => configStore.getConfig.map.mapUrl);

interface Props {
    hostname: Hostname;
}

const props = defineProps<Props>();
</script>

<template>
    <div>
        <h1>Erledigt!</h1>
        <p>
            Die Daten Deines Freifunk-Knotens sind gelöscht worden. Es kann
            jetzt noch bis zu 20 Minuten dauern, bis die Änderungen überall
            wirksam werden und sich in der
            <a :href="mapUrl" target="_blank">Knotenkarte</a> auswirken.
        </p>

        <div class="summary">
            <div class="deleted-node">
                <i class="fa fa-trash-o" aria-hidden="true" />
                <span class="node">{{ props.hostname }}</span>
            </div>
        </div>

        <p>
            <em>
                Hinweis: Nach dem Löschen kann der Knoten ggf. weiterhin als
                online in der Knotenkarte angezeigt werden. Dies ist dann der
                Fall, wenn der Knoten eingeschaltet ist und in Reichweite eines
                anderen aktiven Knotens steht. Die angezeigten Daten sind dann
                die während der Einrichtung des Knotens im Config-Mode
                (Konfigurationsoberfläche des Routers) hinterlegten. Außerdem
                kann es nach dem Löschen noch etwa einen Monat dauern, bis der
                Knoten in der Karte auch nicht mehr als offline erscheint.
            </em>
        </p>

        <p>
            Bei Fragen wende Dich gerne an
            <a :href="`mailto:${email}`">{{ email }}</a
            >.
        </p>

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

    .deleted-node {
        display: inline-block;

        padding: $node-deleted-summary-padding;

        border: $node-deleted-summary-border;
        border-radius: $node-deleted-summary-border-radius;

        font-size: $node-deleted-summary-font-size;
    }
}
</style>
