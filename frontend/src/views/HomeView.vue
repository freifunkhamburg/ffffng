<script setup lang="ts">
import ActionButton from "@/components/form/ActionButton.vue";
import {ButtonSize, ComponentVariant} from "@/types";
</script>

<template>
    <div>
        <h2>Willkommen!</h2>

        <p>Du hast einen neuen Freifunk Hamburg Router (Knoten), den Du in Betrieb nehmen möchtest? Du hast schon einen
            Knoten in Betrieb und möchtest seine Daten ändern? Oder Du möchtest einen Knoten, der nicht mehr in Betrieb
            ist löschen? Dann bist Du hier richtig!</p>

        <div class="actions">
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
            <ActionButton
                :variant="ComponentVariant.WARNING"
                :size="ButtonSize.LARGE"
                icon="trash">
                Knoten löschen
            </ActionButton>
        </div>
    </div>
</template>

<style lang="scss" scoped>
</style>
