<script setup lang="ts">
import { useConfigStore } from "@/stores/config";
import ButtonGroup from "@/components/form/ButtonGroup.vue";
import { ButtonSize, ComponentAlignment, ComponentVariant } from "@/types";
import ActionButton from "@/components/form/ActionButton.vue";
import ValidationForm from "@/components/form/ValidationForm.vue";
import FloatingIcon from "@/components/FloatingIcon.vue";
import { onMounted } from "vue";

const configStore = useConfigStore();

const emit = defineEmits<{
    (e: "cancel"): void;
    (e: "confirm"): void;
}>();

onMounted(() => {
    window.scrollTo(0, 0);
});

function onCancel() {
    emit("cancel");
}

function onSubmit() {
    emit("confirm");
}
</script>

<template>
    <ValidationForm class="outside-of-community-form" @submit="onSubmit">
        <h2>
            Dein Router steht außerhalb des
            {{ configStore.getConfig.community.name }} Gebiets
        </h2>

        <p>
            <strong
                >Erst mal großartig, dass du Freifunk machen möchtest!</strong
            >
        </p>

        <FloatingIcon icon="community" :variant="ComponentVariant.SECONDARY" />

        <p>
            Freifunk steht u.a. für Denzentralität. Deshalb wäre es klasse wenn
            Du Dich einer Community in Deiner Nähe anschließt oder vielleicht
            sogar
            <a
                href="https://freifunk.net/wie-mache-ich-mit/lokale-gruppe-gruenden/"
                target="_blank"
                >Deine eigene gründest</a
            >. Da aller Anfang schwer ist, macht es für eben diesen vielleicht
            Sinn sich erst mal einer
            <a
                href="https://freifunk.net/wie-mache-ich-mit/community-finden/"
                target="_blank"
                >nahegelegen Gruppe</a
            >
            anzuschließen. Auch wir von
            {{ configStore.getConfig.community.name }} stehen Dir natürlich
            gerne mit Rat und Tat zur Seite und mit den existierenden
            Hilfsmitteln ist die technische Hürde auch nicht mehr ganz so
            gigantisch.
        </p>

        <p>
            Es gibt auch technische Gründe, die gegen eine Erweiterung über die
            Grenzen von
            {{ configStore.getConfig.community.name }} hinaus sprechen. Das
            Problem mit Mesh-Netzen heute ist, dass sie nicht besonders gut
            skalieren und mit jedem weiteren Router die Leistung nach unten
            geht.
        </p>

        <p>
            Im Moment kommen ständig neue Freifunk-Communities dazu. Welche
            Communities es schon gibt, siehts Du
            <a
                href="https://freifunk.net/wie-mache-ich-mit/community-finden/"
                target="_blank"
                >in dieser Übersicht</a
            >.
        </p>

        <ButtonGroup
            :align="ComponentAlignment.CENTER"
            :button-size="ButtonSize.MEDIUM"
        >
            <ActionButton
                type="reset"
                icon="times"
                :variant="ComponentVariant.SECONDARY"
                :size="ButtonSize.SMALL"
                @click="onCancel"
            >
                Abbrechen
            </ActionButton>

            <ActionButton
                type="submit"
                icon="dot-circle-o"
                :variant="ComponentVariant.INFO"
                :size="ButtonSize.SMALL"
            >
                Knoten dennoch anmelden
            </ActionButton>
        </ButtonGroup>
    </ValidationForm>
</template>

<style lang="scss"></style>
