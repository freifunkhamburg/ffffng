<script setup lang="ts">
import PageContainer from "@/components/page/PageContainer.vue";
import NodeDeleteForm from "@/components/nodes/NodeDeleteForm.vue";
import NodeDeleteConfirmationForm from "@/components/nodes/NodeDeleteConfirmationForm.vue";
import NodeDeletedPanel from "@/components/nodes/NodeDeletedPanel.vue";
import {ref} from "vue";
import type {Hostname, StoredNode} from "@/types";

const node = ref<StoredNode | undefined>(undefined);
const deletedHostname = ref<Hostname | undefined>(undefined);

async function onSelectNode(nodeToDelete: StoredNode) {
    node.value = nodeToDelete;
}

async function onDelete(hostname: Hostname) {
    deletedHostname.value = hostname;
}
</script>

<template>
    <PageContainer>
        <NodeDeleteForm v-if="!node && !deletedHostname" @submit="onSelectNode"/>
        <NodeDeleteConfirmationForm v-if="node && !deletedHostname" @delete="onDelete" :node="node"/>
        <NodeDeletedPanel v-if="deletedHostname" :hostname="deletedHostname"/>
    </PageContainer>
</template>

<style lang="scss" scoped>
</style>
