<script setup lang="ts">
import { useConfigStore } from "@/stores/config";
import { useNodeStore } from "@/stores/node";
import { nextTick, onMounted, ref } from "vue";
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
import NodeCoordinatesInput from "@/components/nodes/NodeCoordinatesInput.vue";
import CheckboxInput from "@/components/form/CheckboxInput.vue";
import InfoCard from "@/components/InfoCard.vue";

const configStore = useConfigStore();
const nodeStore = useNodeStore();

interface Props {
    hostname?: Hostname;
    fastdKey?: FastdKey;
    mac?: MAC;
}

const props = defineProps<Props>();

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

const hostnameModel = ref("" as Hostname);
const fastdKeyModel = ref("" as FastdKey);
const macModel = ref("" as MAC);
const coordsModel = ref("" as Coordinates);
const nicknameModel = ref("" as Nickname);
const emailModel = ref("" as EmailAddress);
const monitoringModel = ref(false);

onMounted(() => {
    if (props.hostname) {
        hostnameModel.value = props.hostname;
    }
    if (props.fastdKey) {
        fastdKeyModel.value = props.fastdKey;
    }
    if (props.mac) {
        macModel.value = props.mac;
    }
});

async function onSubmit() {
    generalError.value = false;
    conflictErrorMessage.value = undefined;

    // Make sure to re-render error message to trigger scrolling into view.
    await nextTick();

    try {
        const node = await nodeStore.create({
            hostname: hostnameModel.value,
            key: fastdKeyModel.value || undefined,
            mac: macModel.value,
            coords: coordsModel.value || undefined,
            nickname: nicknameModel.value,
            email: emailModel.value,
            monitoring: monitoringModel.value,
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
                <a :href="`mailto:${emailModel}`">{{ emailModel }}</a
                >.
            </ErrorCard>

            <fieldset>
                <h3>Knotendaten</h3>

                <ValidationFormInput
                    v-model="hostnameModel"
                    name="hostname"
                    label="Knotenname"
                    placeholder="z. B. Lisas-Freifunk"
                    :constraint="CONSTRAINTS.node.hostname"
                    help="Das ist der Name, der auch auf der Karte auftaucht."
                    validation-error="Knotennamen dürfen maximal 32 Zeichen lang sein und nur Klein- und Großbuchstaben, sowie Ziffern, - und _ enthalten."
                />
                <ValidationFormInput
                    v-model="fastdKeyModel"
                    name="key"
                    label="VPN-Schlüssel (bitte nur weglassen, wenn Du weisst, was Du tust)"
                    placeholder="Dein 64-stelliger VPN-Schlüssel"
                    :constraint="CONSTRAINTS.node.key"
                    help="Dieser Schlüssel wird verwendet, um die Verbindung Deines Routers zu den Gateway-Servern abzusichern."
                    validation-error="Knotennamen dürfen maximal 32 Zeichen lang sein und nur Klein- und Großbuchstaben, sowie Ziffern, - und _ enthalten."
                />
                <ValidationFormInput
                    v-model="macModel"
                    name="mac"
                    label="MAC-Adresse"
                    placeholder="z. B. 12:34:56:78:9a:bc oder 123456789abc"
                    :constraint="CONSTRAINTS.node.mac"
                    help="Die MAC-Adresse (kurz „MAC“) steht üblicherweise auf dem Aufkleber auf der Unterseite deines Routers. Sie wird verwendet, um die Daten Deines Routers auf der Karte korrekt zuzuordnen."
                    validation-error="Die angegebene MAC-Adresse ist ungültig."
                />
            </fieldset>

            <fieldset>
                <h3>Wo soll Dein Router stehen?</h3>

                <NodeCoordinatesInput v-model="coordsModel" />
            </fieldset>

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
                    v-model="nicknameModel"
                    name="nickname"
                    label="Nickname / Name"
                    placeholder="z. B. Lisa"
                    :constraint="CONSTRAINTS.node.nickname"
                    validation-error="Nicknames dürfen maximal 64 Zeichen lang sein und nur Klein- und Großbuchstaben, sowie Ziffern, - und _ enthalten. Umlaute sind erlaubt."
                />
                <ValidationFormInput
                    v-model="emailModel"
                    name="email"
                    type="email"
                    label="E-Mail-Adresse"
                    :placeholder="`z. B. lisa@${configStore.getConfig.community.domain}`"
                    :constraint="CONSTRAINTS.node.email"
                    validation-error="Die angegebene E-Mail-Adresse ist ungültig."
                />
            </fieldset>

            <fieldset v-if="configStore.getConfig.monitoring.enabled">
                <h3>Möchtest Du automatisiert Status-E-Mails bekommen?</h3>

                <i class="monitoring-icon fa fa-heartbeat" aria-hidden="true" />

                <p class="help-block">
                    Du kannst Dich automatisiert benachrichtigen lassen, sobald
                    Dein Knoten längere Zeit offline ist. Die erste E-Mail
                    bekommst Du nach 3 Stunden, nach einem Tag gibt es dann
                    nochmal eine Erinnerung. Sollte Dein Knoten nach einer Woche
                    immernoch offline sein, bekommst Du eine letzte
                    Status-E-Mail.
                </p>

                <p class="help-block">
                    Du kannst den automatisierten Versand von Status-E-Mails
                    hier selbstverständlich jederzeit wieder deaktivieren.
                </p>

                <CheckboxInput
                    v-model="monitoringModel"
                    name="monitoring"
                    label="Informiert mich, wenn mein Knoten offline ist"
                />

                <InfoCard v-if="monitoringModel">
                    <p>
                        Zur Bestätigung Deiner E-Mail-Adresse schicken wir Dir
                        nach dem Speichern Deiner Knotendaten eine E-Mail mit
                        einem Bestätigungs-Link. Erst nach der Bestätigung
                        deiner E-Mail-Adresse wirst Du informiert, falls Dein
                        Knoten längere Zeit offline ist.
                    </p>

                    <p>
                        Die Inbetriebnahme Deines Knotens kannst Du
                        selbstverständlich unabhängig von der Bestätigung immer
                        sofort duchführen.
                    </p>

                    <p v-if="emailModel">
                        <strong>
                            <i
                                class="fa fa-envelope-o"
                                aria-hidden="true"
                                title="E-Mail-Adresse"
                            />
                            {{ emailModel }}
                        </strong>
                    </p>
                </InfoCard>
            </fieldset>

            <h1>TODO: Check community bounds</h1>

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

<style lang="scss" scoped>
@import "../../scss/variables";

.monitoring-icon {
    float: left;
    margin: 0 0.25em 0.125em 0;
    font-size: 3em;
    color: $variant-color-primary;
}
</style>
