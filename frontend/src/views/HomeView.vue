<script setup lang="ts">
import ActionButton from "@/components/form/ActionButton.vue";
import ButtonGroup from "@/components/form/ButtonGroup.vue";
import PageContainer from "@/components/page/PageContainer.vue";
import {ButtonSize, ComponentAlignment, ComponentVariant} from "@/types";
import {route, RouteName} from "@/router";
import RouteButton from "@/components/form/RouteButton.vue";</script>

<template>
    <PageContainer>
        <h2>Willkommen!</h2>

        <p>
            Du hast einen neuen Freifunk Hamburg Router (Knoten), den Du in Betrieb nehmen möchtest? Du hast schon
            einen Knoten in Betrieb und möchtest seine Daten ändern? Oder Du möchtest einen Knoten, der nicht mehr
            in Betrieb ist löschen? Dann bist Du hier richtig!
        </p>

        <ButtonGroup class="actions" :align="ComponentAlignment.CENTER" :button-size="ButtonSize.LARGE">
            <ActionButton
                :variant="ComponentVariant.INFO"
                :size="ButtonSize.LARGE"
                icon="dot-circle-o">
                Neuen Knoten anmelden
            </ActionButton>
            <ActionButton
                :variant="ComponentVariant.PRIMARY"
                :size="ButtonSize.LARGE"
                icon="pencil">
                Knotendaten ändern
            </ActionButton>
            <RouteButton
                :variant="ComponentVariant.WARNING"
                :size="ButtonSize.LARGE"
                icon="trash"
                :route="route(RouteName.NODE_DELETE)">
                Knoten löschen
            </RouteButton>
        </ButtonGroup>
    </PageContainer>
</template>

<style lang="scss" scoped>
@import "../scss/variables";
@import "../scss/mixins";

.actions {
    margin-top: $home-actions-margin-top;
}
</style>
