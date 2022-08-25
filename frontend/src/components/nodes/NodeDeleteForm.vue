<script setup lang="ts">
import { useConfigStore } from "@/stores/config";
import { useNodeStore } from "@/stores/node";
import { computed, nextTick, ref } from "vue";
import CONSTRAINTS from "@/shared/validation/constraints";
import ActionButton from "@/components/form/ActionButton.vue";
import type { StoredNode, Token } from "@/types";
import { ButtonSize, ComponentAlignment, ComponentVariant } from "@/types";
import ErrorCard from "@/components/ErrorCard.vue";
import ButtonGroup from "@/components/form/ButtonGroup.vue";
import ValidationForm from "@/components/form/ValidationForm.vue";
import ValidationFormInput from "@/components/form/ValidationFormInput.vue";
import { route, RouteName } from "@/router";
import RouteButton from "@/components/form/RouteButton.vue";
import { ApiError } from "@/utils/Api";

const configStore = useConfigStore();
const email = computed(() => configStore.getConfig.community.contactEmail);

const nodeStore = useNodeStore();

const emit = defineEmits<{
    (e: "submit", node: StoredNode): void;
}>();

const token = ref("" as Token);
const nodeNotFound = ref<boolean>(false);
const generalError = ref<boolean>(false);

async function onSubmit() {
    nodeNotFound.value = false;
    generalError.value = false;
    // Make sure to re-render error message to trigger scrolling into view.
    await nextTick();

    try {
        const node = await nodeStore.fetchByToken(token.value);
        emit("submit", node);
    } catch (error) {
        if (error instanceof ApiError) {
            if (error.isNotFoundError()) {
                nodeNotFound.value = true;
            } else {
                console.error(error);
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
        <h2>Knoten löschen</h2>

        <div>
            <p>
                Um die Daten Deines Knotens zu löschen, benötigen wir den
                passenden Token (eine 16-stellige Folge aus Ziffern und
                Buchstaben). Diesen hast Du beim ersten Anmelden Deines Knotens
                erhalten. Sinn des Tokens ist, Dich davor zu schützen, dass
                Dritte unbefugt Deine Daten einsehen oder ändern können.
            </p>
            <p>
                <strong>
                    Solltest Du den Token nicht mehr haben, wende Dich einfach
                    per E-Mail an
                    <a :href="`mailto:${email}`">{{ email }}</a
                    >.
                </strong>
            </p>

            <ErrorCard v-if="nodeNotFound">
                Zum Token wurde kein passender Knoten gefunden.
            </ErrorCard>

            <ErrorCard v-if="generalError">
                Beim Abrufen des Knotens ist ein Fehler aufgetreten. Bitte
                probiere es später nochmal. Sollte dieses Problem weiter
                bestehen, so wende dich bitte per E-Mail an
                <a :href="`mailto:${email}`">{{ email }}</a
                >.
            </ErrorCard>

            <fieldset>
                <ValidationFormInput
                    class="token-input"
                    v-model="token"
                    label="Token"
                    placeholder="Dein 16-stelliger Token"
                    :constraint="CONSTRAINTS.token"
                    validation-error="Das Token ist ein 16-stelliger Wert bestehend aus 0-9 und a-f."
                />
                <ButtonGroup
                    :align="ComponentAlignment.RIGHT"
                    :button-size="ButtonSize.SMALL"
                >
                    <ActionButton
                        type="submit"
                        icon="trash"
                        :variant="ComponentVariant.WARNING"
                        :size="ButtonSize.SMALL"
                    >
                        Knoten löschen
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
            </fieldset>

            <p>
                <em>
                    Hinweis: Nach dem Löschen kann der Knoten ggf. weiterhin in
                    der Knotenkarte angezeigt werden. Dies ist dann der Fall,
                    wenn der Knoten eingeschaltet ist und in Reichweite eines
                    anderen aktiven Knotens steht. Die angezeigten Daten sind
                    dann die während der Einrichtung des Knotens im Config-Mode
                    (Konfigurationsoberfläche des Routers) hinterlegten.
                </em>
            </p>
        </div>
    </ValidationForm>
</template>

<style lang="scss" scoped>
.token-input {
    margin: 0;
}
</style>
