<script setup lang="ts">
import { useConfigStore } from "@/stores/config";
import { useNodeStore } from "@/stores/node";
import { computed, nextTick, ref } from "vue";
import CONSTRAINTS from "@/shared/validation/constraints";
import ActionButton from "@/components/form/ActionButton.vue";
import type {
    Coordinates,
    EmailAddress,
    FastdKey,
    Hostname,
    MAC,
    Nickname,
    StoredNode,
} from "@/types";
import {
    ButtonSize,
    ComponentAlignment,
    ComponentVariant,
    hasOwnProperty,
} from "@/types";
import ErrorCard from "@/components/ErrorCard.vue";
import ButtonGroup from "@/components/form/ButtonGroup.vue";
import ValidationForm from "@/components/form/ValidationForm.vue";
import ValidationFormInput from "@/components/form/ValidationFormInput.vue";
import { route, RouteName } from "@/router";
import RouteButton from "@/components/form/RouteButton.vue";
import { ApiError } from "@/utils/Api";

const configStore = useConfigStore();
const nodeStore = useNodeStore();

const emit = defineEmits<{
    (e: "create", node: StoredNode): void;
}>();

const generalError = ref<boolean>(false);

const CONFLICT_MESSAGES: Record<string, string> = {
    hostname: "Der Knotenname ist bereits vergeben. Bitte wähle einen anderen.",
    key: "Für den VPN-Schlüssel gibt es bereits einen Eintrag.",
    mac: "Für die MAC-Adresse gibt es bereits einen Eintrag.",
};

const conflictErrorMessage = ref<string | undefined>(undefined);

const hostname = ref("" as Hostname);
const fastdKey = ref("" as FastdKey);
const mac = ref("" as MAC);
const coords = ref("" as Coordinates);
const nickname = ref("" as Nickname);
const email = ref("" as EmailAddress);
const monitoring = ref(false);

async function onSubmit() {
    generalError.value = false;
    conflictErrorMessage.value = undefined;

    // Make sure to re-render error message to trigger scrolling into view.
    await nextTick();

    try {
        const node = await nodeStore.create({
            hostname: hostname.value,
            key: fastdKey.value || undefined,
            mac: mac.value,
            coords: coords.value || undefined,
            nickname: nickname.value,
            email: email.value,
            monitoring: monitoring.value,
        });
        emit("create", node);
    } catch (error) {
        if (error instanceof ApiError) {
            console.error(error);

            const conflictingField = error.getConflictField();
            if (
                conflictingField !== undefined &&
                hasOwnProperty(CONFLICT_MESSAGES, conflictingField)
            ) {
                conflictErrorMessage.value =
                    CONFLICT_MESSAGES[conflictingField];
            } else {
                generalError.value = true;
            }
        } else {
            throw error;
        }
    }
}
</script>

<template>
    <ValidationForm novalidate="" ref="form" @submit="onSubmit">
        <h2>Neuen Knoten anmelden</h2>

        <div>
            <p>
                Damit Dein neuer Freifunk-Router erfolgreich ins Netz
                eingebunden werden kann, benötigen wir noch ein paar angaben von
                Dir. Sobald Du fertig bist, kannst Du durch einen Klick auf
                "Knoten anmelden" die Anmeldung abschließen.
            </p>
            <p>
                Und keine Sorge:
                <strong>Datenschutz ist uns genauso wichtig wie Dir.</strong>
            </p>

            <ErrorCard v-if="conflictErrorMessage">{{
                conflictErrorMessage
            }}</ErrorCard>
            <ErrorCard v-if="generalError">
                Beim Anlegen des Knotens ist ein Fehler aufgetreten. Bitte
                probiere es später nochmal. Sollte dieses Problem weiter
                bestehen, so wende dich bitte per E-Mail an
                <a :href="`mailto:${email}`">{{ email }}</a
                >.
            </ErrorCard>

            <fieldset>
                <h3>Knotendaten</h3>

                <ValidationFormInput
                    v-model="hostname"
                    label="Knotenname"
                    placeholder="z. B. Lisas-Freifunk"
                    :constraint="CONSTRAINTS.node.hostname"
                    help="Das ist der Name, der auch auf der Karte auftaucht."
                    validation-error="Knotennamen dürfen maximal 32 Zeichen lang sein und nur Klein- und Großbuchstaben, sowie Ziffern, - und _ enthalten."
                />
                <ValidationFormInput
                    v-model="fastdKey"
                    label="VPN-Schlüssel (bitte nur weglassen, wenn Du weisst, was Du tust)"
                    placeholder="Dein 64-stelliger VPN-Schlüssel"
                    :constraint="CONSTRAINTS.node.key"
                    help="Dieser Schlüssel wird verwendet, um die Verbindung Deines Routers zu den Gateway-Servern abzusichern."
                    validation-error="Knotennamen dürfen maximal 32 Zeichen lang sein und nur Klein- und Großbuchstaben, sowie Ziffern, - und _ enthalten."
                />
                <ValidationFormInput
                    v-model="mac"
                    label="MAC-Adresse"
                    placeholder="z. B. 12:34:56:78:9a:bc oder 123456789abc"
                    :constraint="CONSTRAINTS.node.mac"
                    help="Die MAC-Adresse (kurz „MAC“) steht üblicherweise auf dem Aufkleber auf der Unterseite deines Routers. Sie wird verwendet, um die Daten Deines Routers auf der Karte korrekt zuzuordnen."
                    validation-error="Die angegebene MAC-Adresse ist ungültig."
                />
            </fieldset>

            <h1>TODO: Standort</h1>

            <fieldset>
                <h3>Wie können wir Dich erreichen?</h3>

                <p class="help-block">
                    Deinen Namen und Deine E-Mail-Adresse verwenden wir
                    ausschließlich, um bei Problemen mit Deinem Router oder bei
                    wichtigen Änderungen Kontakt zu Dir aufzunehmen. Bitte trage
                    eine gültige E-Mail-Adresse ein, damit wir Dich im Zweifel
                    erreichen können. Deine persönlichen Daten sind
                    selbstverständlich
                    <strong>nicht öffentlich einsehbar</strong> und werden von
                    uns <strong>nicht weitergegeben</strong>
                    oder anderweitig verwendet. Versprochen!
                </p>

                <ValidationFormInput
                    v-model="nickname"
                    label="Nickname / Name"
                    placeholder="z. B. Lisa"
                    :constraint="CONSTRAINTS.node.nickname"
                    validation-error="Nicknames dürfen maximal 64 Zeichen lang sein und nur Klein- und Großbuchstaben, sowie Ziffern, - und _ enthalten. Umlaute sind erlaubt."
                />
                <ValidationFormInput
                    v-model="email"
                    type="email"
                    label="E-Mail-Adresse"
                    :placeholder="`z. B. lisa@${configStore.getConfig.community.domain}`"
                    :constraint="CONSTRAINTS.node.email"
                    validation-error="Die angegebene E-Mail-Adresse ist ungültig."
                />
            </fieldset>

            <h1>TODO: Monitoring</h1>

            <ButtonGroup
                :align="ComponentAlignment.RIGHT"
                :button-size="ButtonSize.SMALL"
            >
                <ActionButton
                    type="submit"
                    icon="dot-circle-o"
                    :variant="ComponentVariant.INFO"
                    :size="ButtonSize.SMALL"
                >
                    Knoten anmelden
                </ActionButton>
                <RouteButton
                    type="reset"
                    icon="times"
                    :variant="ComponentVariant.SECONDARY"
                    :size="ButtonSize.SMALL"
                    :route="route(RouteName.HOME)"
                >
                    Abbrechen
                </RouteButton>
            </ButtonGroup>
        </div>
    </ValidationForm>
</template>

<style lang="scss" scoped></style>
