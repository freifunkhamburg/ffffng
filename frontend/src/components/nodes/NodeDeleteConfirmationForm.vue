<script setup lang="ts">
import ValidationForm from "@/components/form/ValidationForm.vue";
import {useNodeStore} from "@/stores/node";
import ButtonGroup from "@/components/form/ButtonGroup.vue";
import ActionButton from "@/components/form/ActionButton.vue";
import NodePreviewCard from "@/components/nodes/NodePreviewCard.vue";
import type {Hostname, StoredNode} from "@/types";
import {ButtonSize, ComponentAlignment, ComponentVariant} from "@/types";
import router, {route, RouteName} from "@/router";
import {computed, nextTick, ref} from "vue";
import {ApiError} from "@/utils/Api";
import ErrorCard from "@/components/ErrorCard.vue";
import {useConfigStore} from "@/stores/config";

interface Props {
    node: StoredNode;
}

const props = defineProps<Props>();
const nodeStore = useNodeStore();
const configStore = useConfigStore();
const email = computed(() => configStore.getConfig?.community.contactEmail);

const errorDeletingNode = ref<boolean>(false);

const emit = defineEmits<{
    (e: "delete", hostname: Hostname): void
}>();

async function onSubmit() {
    errorDeletingNode.value = false;
    // Make sure to re-render error message to trigger scrolling into view.
    await nextTick();

    const token = props.node.token;

    try {
        await nodeStore.deleteByToken(token);
    } catch (error) {
        if (error instanceof ApiError) {
            // If the node has been deleted in the meantime, we move on as if no error had occured.
            if (!error.isNotFoundError()) {
                errorDeletingNode.value = true;
                return;
            }
        } else {
            throw error;
        }
    }

    emit("delete", props.node.hostname);
}

async function onAbort() {
    await router.push(route(RouteName.HOME));
}
</script>

<template>
    <ValidationForm @submit="onSubmit">
        <h2>Soll der Knoten wirklich gelöscht werden?</h2>

        <p>
            Soll der Knoten <strong>{{ props.node.hostname }}</strong> wirklich endgültig gelöscht werden?
            Du kannst ihn selbstverständlich später jederzeit erneut anmelden!
        </p>

        <ErrorCard v-if="errorDeletingNode">
            Beim Löschen des Knotens ist ein Fehler aufgetreten. Bitte probiere es später nochmal. Sollte dieses Problem
            weiter bestehen, so wende dich bitte per E-Mail an <a v-if="email" :href="`mailto:${email}`">{{ email }}</a>.
        </ErrorCard>

        <NodePreviewCard class="preview" :node="props.node"/>

        <ButtonGroup :align="ComponentAlignment.CENTER" :button-size="ButtonSize.SMALL">
            <ActionButton
                type="submit"
                icon="trash"
                :variant="ComponentVariant.WARNING"
                :size="ButtonSize.MEDIUM">
                Knoten löschen
            </ActionButton>
            <ActionButton
                type="reset"
                icon="times"
                :variant="ComponentVariant.SECONDARY"
                :size="ButtonSize.MEDIUM"
                @click="onAbort">
                Abbrechen
            </ActionButton>
        </ButtonGroup>
    </ValidationForm>
</template>

<style lang="scss" scoped>
.preview {
    margin: 1em 0;
}
</style>
